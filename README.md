# AI Service 项目说明文档

## 📋 项目概述

AI Service 是一个基于 NestJS 框架构建的 AI 服务聚合平台，提供统一的 API 接口来访问多个 AI 服务提供商的能力。项目采用模块化设计，支持聊天、视频生成、图片生成、文档处理等多种 AI 功能，并实现了灵活的服务注册与执行机制。

## 🏗️ 技术架构

### 核心技术栈

- **框架**: NestJS 11.x
- **数据库**: MySQL (TypeORM)
- **认证**: JWT + Passport
- **会话管理**: Express Session
- **文件上传**: Multer
- **文档处理**: Mammoth (Word 文档解析)
- **包管理**: pnpm

### 项目结构

```
ai-service/
├── src/
│   ├── main.ts                    # 应用入口文件
│   ├── app.module.ts              # 根模块
│   ├── common/                    # 公共模块
│   │   ├── filters/               # 异常过滤器
│   │   └── interceptors/          # 响应拦截器
│   ├── services/                  # 核心服务层
│   │   ├── http/                  # HTTP 服务抽象层
│   │   │   ├── serviceRegistry.ts # 服务注册表
│   │   │   ├── serviceExecutor.ts # 服务执行器
│   │   │   └── baseFetch.ts       # 基础 HTTP 请求
│   │   ├── baseServices/          # 服务基类
│   │   │   ├── glmBaseService.ts  # GLM 服务基类
│   │   │   └── tyBaseService.ts   # 通义千问服务基类
│   │   ├── chat/                  # 聊天服务实现
│   │   ├── video/                 # 视频生成服务实现
│   │   ├── image/                 # 图片生成服务实现
│   │   └── index.ts               # 服务导出入口
│   ├── chat/                      # 聊天模块
│   ├── video/                     # 视频生成模块
│   ├── image/                     # 图片生成模块
│   ├── docx-process/              # 文档处理模块
│   ├── user/                      # 用户管理模块
│   └── alipay-auth/               # 支付宝认证模块
├── dist/                          # 编译输出目录
├── uploads/                       # 文件上传目录
└── test/                          # 测试文件
```

## 🎯 核心功能模块

### 1. 聊天服务 (Chat)

提供多模型 AI 聊天能力，支持 GLM 和通义千问两个服务提供商。

**API 端点**:

- `POST /ai-service/chat/chat` - 发送聊天消息

**支持的服务提供商**:

- `chat_glm` - GLM 模型（默认模型: glm-4.5）
- `chat_ty` - 通义千问模型（默认模型: qwen-plus）

**请求示例**:

```json
{
  "model": "qwen-plus",
  "messages": [{ "role": "user", "content": "你好" }],
  "provider": "ty"
}
```

### 2. 视频生成服务 (Video)

支持基于文本生成视频的功能。

**API 端点**:

- `POST /ai-service/video/generate` - 生成视频

**支持的服务提供商**:

- `video_glm` - GLM 视频生成服务
- `video_ty` - 通义千问视频生成服务

### 3. 图片生成服务 (Image)

提供 AI 图片生成能力。

**支持的服务提供商**:

- `image_glm` - GLM 图片生成服务
- `image_ty` - 通义千问图片生成服务

### 4. 文档处理服务 (DocxProcess)

智能解析 Word 文档并提取结构化数据。

**API 端点**:

- `POST /ai-service/docx-process/processData` - 处理文档

**功能特点**:

- 支持 `.docx` 格式文件上传
- 基于 AI 模型智能提取文档字段
- 返回结构化 JSON 数据

**请求示例**:

```json
{
  "templateJson": "{\"name\": \"姓名\", \"age\": \"年龄\"}"
}
```

文件通过 `multipart/form-data` 上传，字段名为 `rawDocument`。

### 5. 用户管理模块 (User)

提供用户注册、登录、认证等功能。

**API 端点**:

- `POST /ai-service/user/register` - 用户注册
- `POST /ai-service/user/login` - 用户登录
- `GET /ai-service/user/captcha` - 获取验证码
- `GET /ai-service/user/profile` - 获取用户信息（需认证）

**功能特点**:

- JWT Token 认证
- Session 会话管理
- 密码加密存储（bcrypt）
- 图形验证码生成

### 6. 支付宝认证模块 (AlipayAuth)

支持支付宝小程序/应用的 OAuth 认证。

**API 端点**:

- `POST /ai-service/alipay-auth/login` - 通过 authCode 登录
- `POST /ai-service/alipay-auth/getUserInfo` - 获取用户信息

## 🔧 核心架构设计

### 服务注册与执行机制

项目采用**服务注册表模式**（Service Registry Pattern），实现了灵活的多服务提供商管理机制。

#### 1. 服务注册表 (ServiceRegistry)

负责管理和注册所有可用的 AI 服务：

```typescript
// 服务注册
serviceRegistry.registerService(new GlmChatService());
serviceRegistry.registerService(new TyChatService());

// 配置功能-服务映射
serviceRegistry.configureFeatureServices({
  chat: [
    { label: 'GLM', value: 'chat_glm' },
    { label: '通义千问', value: 'chat_ty' },
  ],
});
```

#### 2. 服务执行器 (ServiceExecutor)

负责执行指定的服务，并支持服务降级机制：

- **主服务执行**: 执行用户选择的服务
- **降级机制**: 主服务失败时自动尝试备用服务
- **错误处理**: 统一的错误处理和日志记录

#### 3. 服务定义接口

所有服务必须实现 `ServiceDefinition` 接口：

```typescript
interface ServiceDefinition<TParams, TResponse> {
  name: string;
  execute: (params: TParams) => Promise<TResponse>;
  validate?: (params: TParams) => boolean;
}
```

### 统一响应格式

所有 API 响应都遵循统一的格式：

**成功响应**:

```json
{
  "success": true,
  "data": { ... },
  "code": 200,
  "feature": "chat"
}
```

**错误响应**:

```json
{
  "success": false,
  "error": "错误信息",
  "code": 400,
  "feature": "chat"
}
```

### 全局拦截器与过滤器

- **TransformInterceptor**: 统一包装响应格式，自动提取功能名称
- **HttpExceptionFilter**: 全局异常捕获和统一错误响应

## 🔐 认证与授权

### JWT 认证

使用 Passport JWT 策略进行用户认证：

```typescript
@UseGuards(AuthGuard('jwt'))
@Get('/profile')
async getProfile(@Request() req) {
  // 访问 req.user.userId 获取用户ID
}
```

### Session 管理

- Session 存储: 内存存储（可配置为 Redis）
- Cookie 配置: HttpOnly, 3分钟过期
- CORS 支持: 支持跨域请求，可配置前端地址

## 📦 环境配置

### 必需的环境变量

创建 `.env` 文件并配置以下变量：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=ai_service

# JWT 配置
JWT_SECRET=your_jwt_secret_key

# Session 配置
SESSION_SECRET=your_session_secret_key

# AI 服务 API Keys
GLM_API_KEY=your_glm_api_key
TY_API_KEY=your_ty_api_key

# 应用配置
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置。

### 3. 启动数据库

确保 MySQL 服务已启动，数据库会自动同步表结构。

### 4. 启动开发服务器

```bash
# 开发模式（热重载）
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

### 5. 访问应用

应用启动后访问: `http://localhost:3000`

API 基础路径: `http://localhost:3000/ai-service`

## 📝 API 文档

### 基础路径

所有 API 都使用统一的前缀: `/ai-service`

### 健康检查

所有模块都提供健康检查端点:

- `GET /ai-service/{module}/health` - 返回 `"ok"`

### 示例请求

**聊天请求**:

```bash
curl -X POST http://localhost:3000/ai-service/chat/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-plus",
    "messages": [
      {"role": "user", "content": "你好"}
    ],
    "provider": "ty"
  }'
```

**用户注册**:

```bash
curl -X POST http://localhost:3000/ai-service/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456",
    "email": "test@example.com",
    "nickname": "测试用户",
    "captcha": "验证码"
  }'
```

## 🗄️ 数据库设计

### User 实体

用户表包含以下字段：

- `id`: 主键
- `username`: 用户名（唯一）
- `email`: 邮箱（唯一，可选）
- `password`: 加密密码
- `nickname`: 昵称
- `avatar`: 头像 URL
- `province`: 省份
- `city`: 城市
- `source`: 用户来源（wechat/alipay/web/other）
- `status`: 用户状态（enabled/disabled）
- `gender`: 性别（male/female/unknown）
- `sourceUserId`: 来源用户ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

数据库使用 TypeORM 的 `synchronize: true` 模式，会自动同步表结构。

## 🔄 服务扩展指南

### 添加新的 AI 服务提供商

1. **创建服务基类**（如需要）:

```typescript
export abstract class NewBaseService {
  protected readonly API_KEY: string;
  protected readonly API_URL: string;
  // ...
}
```

2. **实现服务类**:

```typescript
export class NewChatService
  extends NewBaseService
  implements ChatServiceDefinition
{
  name: ChatServiceName = 'chat_new';

  async execute(params: ChatRequestParams): Promise<ChatMessage> {
    // 实现服务逻辑
  }
}
```

3. **注册服务**:
   在 `src/services/index.ts` 中注册新服务：

```typescript
serviceRegistry.registerService(new NewChatService());
serviceRegistry.configureFeatureServices({
  chat: [{ label: '新服务', value: 'chat_new' }],
});
```

### 添加新功能模块

1. 创建模块目录和文件（Controller, Service, Module）
2. 在 `app.module.ts` 中导入新模块
3. 如需使用服务层，在服务层添加对应的服务实现

## 🧪 测试

```bash
# 单元测试
pnpm run test

# 测试覆盖率
pnpm run test:cov

# E2E 测试
pnpm run test:e2e
```

## 📦 构建与部署

### 构建项目

```bash
pnpm run build
```

构建产物位于 `dist/` 目录。

### 生产部署

项目支持通过 GitHub Actions 自动部署，详见 `.github/DEPLOY.md`。

手动部署步骤：

1. 构建项目: `pnpm run build`
2. 复制 `.env` 文件到 `dist/` 目录
3. 安装生产依赖: `cd dist && pnpm install --prod`
4. 启动应用: `node dist/main.js`

推荐使用 PM2 进行进程管理：

```bash
pm2 start dist/main.js --name ai-service
```

## 🛠️ 开发规范

### 代码风格

- 使用 ESLint + Prettier 进行代码格式化
- 遵循 NestJS 官方代码风格指南
- 使用 TypeScript 严格模式

### 提交规范

- 使用有意义的提交信息
- 遵循 Conventional Commits 规范

## 📄 许可证

UNLICENSED - 私有项目

## 👥 贡献

本项目为私有项目，暂不接受外部贡献。

## 📞 联系方式

如有问题或建议，请联系项目维护者。

---

**最后更新**: 2024年
