# GitHub Actions 构建上传配置说明

## 功能说明

此工作流会在以下情况自动触发：

- 推送到 `main` 分支
- 手动触发（在 GitHub Actions 页面）

工作流会：

1. 检出代码
2. 安装依赖（使用 pnpm）
3. 构建项目
4. 打包部署文件
5. 通过 SSH 连接到服务器
6. 上传并解压部署文件
7. 安装生产依赖
8. **不会自动重启应用**（需要手动重启）

⚠️ **注意**：此工作流只负责将构建后的文件上传到服务器，不会自动重启应用。文件上传完成后，请在服务器上手动重启应用。

## GitHub Secrets 配置

在 GitHub 仓库中需要配置以下 Secrets：

### 1. SSH_PRIVATE_KEY

服务器 SSH 私钥（用于身份验证）

**获取方式：**

```bash
# 在本地生成 SSH 密钥对（如果还没有）
ssh-keygen -t rsa -b 4096 -C "github-actions"

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-server.com

# 复制私钥内容（添加到 GitHub Secrets）
cat ~/.ssh/id_rsa
```

### 2. SSH_HOST

服务器 IP 地址或域名

**示例：**

```
192.168.1.100
# 或
example.com
```

### 3. SSH_USER

服务器 SSH 用户名

**示例：**

```
root
# 或
ubuntu
# 或
deploy
```

### 4. DEPLOY_PATH

服务器上的部署路径（绝对路径）

**示例：**

```
/home/deploy/ai-service
# 或
/var/www/ai-service
```

## 服务器准备

### 1. 安装必要的软件

确保服务器上已安装：

- Node.js（推荐 18+ 或 20+）
- pnpm（或 npm）
- 可选：PM2（进程管理）

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2（可选）
npm install -g pm2
```

### 2. 创建部署目录

```bash
sudo mkdir -p /home/deploy/ai-service
sudo chown -R $USER:$USER /home/deploy/ai-service
```

### 3. 配置 SSH 密钥

将 GitHub Actions 使用的 SSH 公钥添加到服务器的 `~/.ssh/authorized_keys`

### 4. 手动重启应用

文件上传完成后，需要手动在服务器上重启应用。根据你的进程管理方式选择相应的重启命令：

#### 方式1: 使用 PM2

```bash
# 在服务器上首次启动应用
cd /home/deploy/ai-service/dist
pm2 start main.js --name ai-service

# 保存 PM2 配置
pm2 save

# 后续重启应用
pm2 restart ai-service

# 查看应用状态
pm2 status

# 查看日志
pm2 logs ai-service
```

#### 方式2: 使用 systemd

创建服务文件 `/etc/systemd/system/ai-service.service`：

```ini
[Unit]
Description=AI Service
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/ai-service/dist
ExecStart=/usr/bin/node main.js
Restart=always

[Install]
WantedBy=multi-user.target
```

然后使用以下命令：

```bash
# 启用服务
sudo systemctl enable ai-service

# 启动服务
sudo systemctl start ai-service

# 重启服务
sudo systemctl restart ai-service

# 查看状态
sudo systemctl status ai-service

# 查看日志
sudo journalctl -u ai-service -f
```

#### 方式3: 使用 Docker Compose

```bash
cd /home/deploy/ai-service
docker-compose restart

# 或重新构建并启动
docker-compose up -d --build
```

#### 方式4: 直接运行 Node.js

```bash
# 停止旧进程
pkill -f "node.*main.js" || true

# 启动新进程
cd /home/deploy/ai-service/dist
nohup node main.js > app.log 2>&1 &

# 查看日志
tail -f app.log
```

## 环境变量配置

如果你的应用需要 `.env` 文件，请确保：

1. **不要将 `.env` 文件提交到 Git**
2. **在服务器上手动创建 `.env` 文件**
3. **或者使用 GitHub Secrets 并在部署脚本中创建**

如果需要在部署时自动创建 `.env`，可以在 `deploy.yml` 中添加：

```yaml
- name: Create .env file on server
  run: |
    ssh ${SSH_USER}@${SSH_HOST} "cat > ${DEPLOY_PATH}/dist/.env << EOF
    NODE_ENV=production
    PORT=3000
    # 添加其他环境变量
    EOF"
```

## 测试部署

1. 推送代码到 `main` 分支
2. 在 GitHub 仓库的 Actions 标签页查看部署进度
3. 等待文件上传完成（工作流会显示 "✅ 部署文件已成功上传到服务器！"）
4. **手动在服务器上重启应用**（参考上面的"手动重启应用"部分）
5. 检查服务器上的应用是否正常运行

## 故障排查

### SSH 连接失败

- 检查 SSH_PRIVATE_KEY 是否正确配置
- 检查 SSH_HOST 和 SSH_USER 是否正确
- 确认服务器防火墙允许 SSH 连接

### 部署失败

- 检查服务器上的部署路径是否存在且有写权限
- 检查 Node.js 和 pnpm 是否正确安装
- 查看 GitHub Actions 日志了解详细错误信息

### 应用无法启动

- 检查服务器上的应用日志
- 确认环境变量已正确配置
- 检查端口是否被占用
