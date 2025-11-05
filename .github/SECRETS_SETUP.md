# GitHub Secrets 配置操作流程

## 📋 一、访问 Secrets 配置页面

1. **打开你的 GitHub 仓库**
   - 在浏览器中访问你的 GitHub 仓库页面

2. **进入设置页面**
   - 点击仓库顶部的 **Settings**（设置）标签

3. **打开 Secrets 配置**
   - 在左侧导航栏中找到 **Secrets and variables**
   - 点击下拉菜单，选择 **Actions**
   - 你会看到两个区域：
     - **Environment secrets**（环境秘密）
     - **Repository secrets**（仓库秘密）

## ✅ 二、已配置的基础 Secrets

根据你的配置截图，以下 Secrets 已经设置好了：
- ✅ `DEPLOY_PATH` - 部署路径
- ✅ `SERVER_HOST` - 服务器地址  
- ✅ `SERVER_SSH_KEY` - SSH 私钥
- ✅ `SERVER_USERNAME` - SSH 用户名

**这些不需要再次配置！**

## 🔧 三、需要添加的环境变量 Secrets

在 **Repository secrets** 区域，点击右上角的绿色按钮 **New repository secret**，依次添加以下环境变量：

### 必须配置的环境变量（4个）

#### 1️⃣ GLM API Key
- **Name（名称）**: `ENV_GLM_API_KEY`
- **Value（值）**: 你的 GLM API 密钥（一串字符）
- **获取方式**: 从 GLM API 服务提供商的开发者控制台获取
- **示例**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 2️⃣ GLM API URL
- **Name（名称）**: `ENV_GLM_API_URL`
- **Value（值）**: GLM API 的基础 URL
- **示例**: `https://api.example.com` 或 `https://open.bigmodel.cn`

#### 3️⃣ TY API Key
- **Name（名称）**: `ENV_TY_API_KEY`
- **Value（值）**: 你的通义千问 API 密钥
- **获取方式**: 从阿里云 DashScope 控制台获取
- **示例**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 4️⃣ TY API URL
- **Name（名称）**: `ENV_TY_API_URL`
- **Value（值）**: TY API 的基础 URL
- **示例**: `https://dashscope.aliyuncs.com`

### 可选配置的环境变量（2个，有默认值）

如果不想使用默认值，可以配置：

#### 5️⃣ 端口号（可选）
- **Name（名称）**: `ENV_PORT`
- **Value（值）**: 服务端口号（例如：`3000`）
- **默认值**: 如果不配置，默认使用 `3000`

#### 6️⃣ 运行环境（可选）
- **Name（名称）**: `ENV_NODE_ENV`
- **Value（值）**: 运行环境（例如：`production`）
- **默认值**: 如果不配置，默认使用 `production`

## 📝 四、详细操作步骤

### 步骤 1：添加 GLM API Key

1. 在 **Repository secrets** 区域，点击右上角的绿色按钮 **New repository secret**
2. 在 **Name** 输入框中输入：`ENV_GLM_API_KEY`（注意大小写，必须完全一致）
3. 在 **Secret** 输入框中粘贴你的 GLM API 密钥（直接粘贴，不要添加引号）
4. 点击 **Add secret** 按钮保存
5. 页面会返回到 Secrets 列表，你可以看到新添加的 Secret

### 步骤 2：添加 GLM API URL

1. 再次点击 **New repository secret** 按钮
2. 在 **Name** 输入框中输入：`ENV_GLM_API_URL`
3. 在 **Secret** 输入框中输入你的 GLM API 地址（例如：`https://api.example.com`）
4. 点击 **Add secret** 按钮保存

### 步骤 3：添加 TY API Key

1. 点击 **New repository secret** 按钮
2. 在 **Name** 输入框中输入：`ENV_TY_API_KEY`
3. 在 **Secret** 输入框中粘贴你的 TY API 密钥
4. 点击 **Add secret** 按钮保存

### 步骤 4：添加 TY API URL

1. 点击 **New repository secret** 按钮
2. 在 **Name** 输入框中输入：`ENV_TY_API_URL`
3. 在 **Secret** 输入框中输入你的 TY API 地址（例如：`https://dashscope.aliyuncs.com`）
4. 点击 **Add secret** 按钮保存

### 步骤 5：（可选）配置端口和环境

如果不想使用默认值：

1. 添加 `ENV_PORT`（端口号，例如：`3000`）
2. 添加 `ENV_NODE_ENV`（运行环境，通常是 `production`）

## ✅ 五、配置完成后的检查清单

配置完成后，你的 **Repository secrets** 列表应该包含：

**基础配置（已完成）：**
- ✅ `DEPLOY_PATH`
- ✅ `SERVER_HOST`
- ✅ `SERVER_SSH_KEY`
- ✅ `SERVER_USERNAME`

**环境变量配置（需要添加）：**
- ✅ `ENV_GLM_API_KEY`
- ✅ `ENV_GLM_API_URL`
- ✅ `ENV_TY_API_KEY`
- ✅ `ENV_TY_API_URL`
- （可选）`ENV_PORT`
- （可选）`ENV_NODE_ENV`

**总计：至少 8 个 Secrets**（4 个基础 + 4 个必须的环境变量）

## 🔍 六、验证配置

### 方式 1：通过 GitHub Actions 验证

1. **触发部署**
   - 推送代码到 `main` 分支会自动触发部署
   - 或者手动触发：点击 **Actions** 标签 → 选择 **Build and Upload** → 点击 **Run workflow** → 点击绿色按钮

2. **查看部署日志**
   - 点击正在运行的 workflow
   - 展开 **Upload to server** 步骤
   - 查看日志，确认：
     - ✅ 看到 "正在创建 .env 文件..."
     - ✅ 看到 "✅ 环境变量已配置完成！"
     - ✅ 没有错误信息

### 方式 2：在服务器上验证

部署完成后，SSH 连接到服务器，检查 `.env` 文件：

```bash
# 连接到服务器（替换为你的实际信息）
ssh your_username@your_server

# 进入部署目录（替换为你的实际路径）
cd /your/deploy/path

# 查看 .env 文件内容
cat .env
```

应该看到类似以下内容：

```
NODE_ENV=production
PORT=3000
GLM_API_KEY=你的实际密钥
GLM_API_URL=你的实际URL
TY_API_KEY=你的实际密钥
TY_API_URL=你的实际URL
```

## ❓ 七、常见问题

### Q1: 如何获取 API 密钥？

- **GLM API**: 
  - 访问 GLM 服务提供商的开发者控制台
  - 注册/登录账号
  - 创建应用并获取 API Key
- **TY API（通义千问）**: 
  - 访问阿里云 DashScope 控制台
  - 登录阿里云账号
  - 开通 DashScope 服务并获取 API Key

### Q2: Secret 的值可以修改吗？

**可以修改**
- 点击 Secrets 列表中对应 Secret 右侧的**铅笔图标**（编辑）
- 修改值后点击 **Update secret** 保存

### Q3: Secret 的值可以删除吗？

**可以删除**
- 点击 Secrets 列表中对应 Secret 右侧的**垃圾桶图标**（删除）
- 确认删除操作

### Q4: 如果某个 Secret 没有配置会怎样？

- **有默认值的变量**（如 `PORT`、`NODE_ENV`）：会使用默认值
- **没有默认值的变量**（如 API Key）：`.env` 文件中该变量的值会是**空字符串**，应用可能无法正常工作

### Q5: Secret 名称大小写敏感吗？

**是的**，Secret 名称区分大小写，必须完全匹配：
- ✅ `ENV_GLM_API_KEY` - 正确
- ❌ `env_glm_api_key` - 错误（小写）
- ❌ `ENV_GLM_API_Key` - 错误（大小写不一致）

### Q6: 如何确认 Secrets 是否正确配置？

1. **查看 GitHub Actions 日志**
   - 如果看到 "✅ 环境变量已配置完成！" 说明配置成功
   - 如果有错误信息，检查 Secret 名称是否正确

2. **检查服务器上的 .env 文件**
   - 部署后，SSH 到服务器查看 `.env` 文件
   - 确认所有变量都有值（除了可选配置）

## 🔒 八、安全提示

1. ⚠️ **不要将 API 密钥提交到代码仓库**
   - `.env` 文件已在 `.gitignore` 中，不要提交
   - 不要在代码中硬编码 API 密钥

2. ⚠️ **不要将 Secrets 的值分享给他人**
   - Secrets 是敏感信息，不要截图或复制给他人
   - 使用 GitHub Secrets 是安全的方式

3. ⚠️ **定期轮换 API 密钥**
   - 建议定期更换 API 密钥
   - 发现泄露立即更换

4. ⚠️ **使用最小权限原则**
   - 只给 API 密钥必要的权限
   - 不要使用过高的权限

5. ⚠️ **保护好 SSH 私钥**
   - `SERVER_SSH_KEY` 是敏感信息
   - 不要分享给他人

## 📞 九、需要帮助？

如果遇到问题：

1. **检查 Secret 名称是否正确**
   - 必须完全匹配，包括大小写

2. **检查值是否正确**
   - API Key 不要包含多余的空格或换行
   - URL 要包含 `http://` 或 `https://`

3. **查看 GitHub Actions 日志**
   - 查看详细的错误信息

4. **参考文档**
   - `.github/ENV_CONFIG.md` - 环境变量配置说明
   - `.github/DEPLOY.md` - 部署说明文档

