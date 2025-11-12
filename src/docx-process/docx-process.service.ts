import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { serviceController } from 'src/services';
import * as mammoth from 'mammoth';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();
@Injectable()
export class DocxProcessService {
  private readonly logger = new Logger(DocxProcessService.name);
  async processData(
    rawFile: Express.Multer.File,
    templateJson: string,
  ): Promise<any> {
    // 使用 buffer 而不是文件路径，避免文件系统权限问题
    if (!rawFile.buffer) {
      throw new BadRequestException('文件数据不可用');
    }

    // 将 buffer 复制到局部变量，提取完成后让原始引用可以被回收
    const fileBuffer = rawFile.buffer;
    let rawText;
    try {
      // 提取文本内容
      rawText = await mammoth.extractRawText({ buffer: fileBuffer });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : '文档解析失败',
      );
    }
    // 提取完成后，fileBuffer 局部变量超出作用域，帮助垃圾回收
    // 注意：由于 rawFile 对象可能还在请求上下文中，其 buffer 属性可能仍存在
    // 但实际的文件数据在提取文本后就不再需要了，mammoth 已经处理完毕

    const prompt = `
    请从以下原始文档中提取以下字段的信息：
    **字段列表**：
    ${templateJson}
    **原始文档内容**：
    \`\`\`
    ${rawText.value}
    \`\`\`

    **要求**：
    - 返回一个数组结构的 JSON 对象，数组中每个元素的结构为：{ field: value }，字段名严格匹配
    - 每匹配到一个完整数据,就作为数组中的一个元素，不要合并多个数据为一个元素.例如：模板数据为：{name: '', age: ''},原始文档内容为：姓名：张三，年龄：18， 则返回的JSON数据为：[{name: 张三,age:18}]
    - 如果某字段未找到，对应值为空字符串 ""
    - 不要添加额外说明
    -必须返回一个可直接解析的JSON数据,不要出现'/\`\`\`/'
    `;
    const body = {
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content:
            '你是一个专业的文档解析专家，请从以下原始文档中提取以下字段的信息：',
        },
        { role: 'user', content: prompt },
      ],
      max_input_tokens: 1000000,
      response_format: {
        type: 'json_object',
      },
    };

    try {
      const response = await serviceController.executeService(
        'chat',
        'chat_ty',
        body,
      );

      const content = response?.content;
      if (typeof content !== 'string') {
        throw new BadRequestException('AI 服务返回的数据格式不正确');
      }
      const data = JSON.parse(content);
      return data;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : '文档解析失败',
      );
    }
  }

  async processDataByUpload(
    rawFile: Express.Multer.File,
    templateJson: string,
  ): Promise<any> {
    // 创建 FormData 对象
    const formData = new FormData();
    // 添加文件，使用 Blob 包装 buffer
    const fileBlob = new Blob([new Uint8Array(rawFile.buffer)], {
      type:
        rawFile.mimetype ||
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    formData.append('file', fileBlob, rawFile.originalname);
    // 添加 purpose 参数
    formData.append('purpose', 'file-extract');

    const uploadResult = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/files',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TY_API_KEY}`,
          // 不要手动设置 Content-Type，让浏览器/Node.js 自动设置 multipart/form-data 边界
        },
        body: formData,
      },
    );

    if (!uploadResult.ok) {
      const errorText = await uploadResult.text();
      this.logger.error(`文件上传失败: ${errorText}`);
      throw new BadRequestException(`文件上传失败: ${uploadResult.statusText}`);
    }

    const uploadData = await uploadResult.json();
    const fileId = uploadData.id;

    if (!fileId) {
      throw new BadRequestException('上传成功但未返回 file-id');
    }
    this.logger.log(`文件上传成功，file-id: ${fileId}`);
    const prompt = `
    请从提供的文件中提取以下字段的信息：
    **字段列表**：
    ${templateJson}
    **要求**：
    - 返回一个数组结构的 JSON 对象，数组中每个元素的结构为：{ field: value }，字段名严格匹配
    - 每匹配到一个完整数据,就作为数组中的一个元素，不要合并多个数据为一个元素.例如：模板数据为：{name: '', age: ''},原始文档内容为：姓名：张三，年龄：18， 则返回的JSON数据为：[{name: 张三,age:18}]
    - 如果某字段未找到，对应值为空字符串 ""
    - 不要添加额外说明
    -必须返回一个可直接解析的JSON数据,不要出现'/\`\`\`/'
    `;

    const body = {
      model: 'qwen-long',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文档解析专家，请从文档中提取以下字段的信息：',
        },
        { role: 'system', content: `fileid://${fileId}` },
        { role: 'user', content: prompt },
      ],
    };
    const response = await serviceController.executeService(
      'chat',
      'chat_ty',
      body,
    );
    const content = response?.content;
    // 异步删除文件，不阻塞主业务流程，失败不影响主业务流程
    void (async () => {
      try {
        const deleteResult = await fetch(
          `https://dashscope.aliyuncs.com/compatible-mode/v1/files/${fileId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${process.env.TY_API_KEY}`,
            },
          },
        );
        if (deleteResult.ok) {
          this.logger.log(`文件删除成功，file-id: ${fileId}`);
        } else {
          this.logger.warn(
            `文件删除失败，file-id: ${fileId}，状态码: ${deleteResult.status}`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `文件删除异常，file-id: ${fileId}，错误: ${
            error instanceof Error ? error.message : '未知错误'
          }`,
        );
      }
    })();
    if (typeof content !== 'string') {
      throw new BadRequestException('AI 服务返回的数据格式不正确');
    }
    const data = JSON.parse(content);
    return data;
  }
}
