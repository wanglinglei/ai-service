import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

interface FileUploadSignParams {
  action: string;
  model: string;
}

interface FileUploadSignResponse {
  upload_host: string;
  oss_access_key_id: string;
  policy: string;
  signature: string;
  upload_dir: string;
  x_oss_object_acl: string;
  x_oss_forbid_overwrite: string;
}

async function getFileUploadSign(
  params: FileUploadSignParams,
): Promise<FileUploadSignResponse> {
  const { action, model } = params;
  const response = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/uploads',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.TY_API_KEY}`,
      },
      body: JSON.stringify({
        action,
        model,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to get file upload sign: ${response.status}`);
  }
  const result = await response.json();
  return result as FileUploadSignResponse;
}

interface FileUploadParams {
  action: string;
  model: string;
  file: File;
}

export const tyFileUpload = async (params: FileUploadParams) => {
  const { action, model } = params;
  try {
    const signData = await getFileUploadSign({ action, model });
    const {
      upload_host,
      oss_access_key_id,
      policy,
      signature,
      upload_dir,
      x_oss_object_acl,
      x_oss_forbid_overwrite,
    } = signData;
    const fileId =
      Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    const fileExtension = params.file.name.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;
    const formData = new FormData();
    const fileKey = upload_dir + '/' + fileName;
    formData.append('file', params.file);
    formData.append('OSSAccessKeyId', oss_access_key_id);
    formData.append('policy', policy);
    formData.append('Signature', signature);
    formData.append('key', fileKey);
    formData.append('x_oss_object_acl', x_oss_object_acl);
    formData.append('x_oss_forbid_overwrite', x_oss_forbid_overwrite);
    formData.append('file', params.file);
    const response = await fetch(upload_host, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.status}`);
    }
    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(`Failed to upload file: ${result.message}`);
    }
    return 'oss://' + fileKey;
  } catch (error) {
    throw new Error(`Failed to upload file: ${error}`);
  }
};
