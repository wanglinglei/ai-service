# Docker 部署配置说明

本文档说明如何配置 GitHub Actions 工作流以自动构建 Docker 镜像并直接部署到服务器。

## 前置要求

1. **服务器要求**
   - 已安装 Docker
   - 已配置 SSH 密钥认证
   - 确保服务器有足够的磁盘空间（至少 5GB 用于镜像文件）

## GitHub Secrets 配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下 Secrets：

### 服务器配置

- `SERVER_HOST`: 服务器 IP 地址或域名
  - 示例: `123.456.789.0` 或 `example.com`

- `SERVER_USERNAME`: SSH 登录用户名
  - 示例: `root` 或 `ubuntu`

- `SERVER_SSH_KEY`: SSH 私钥
  - 用于 SSH 登录服务器的私钥内容

- `DEPLOY_PATH`: 服务器上的部署路径
  - 示例: `/project/ai-service`
  - 确保该目录存在且有写入权限

### 应用环境变量

- `ENV_PORT`: 应用端口（默认: 3000）
- `ENV_NODE_ENV`: 运行环境（默认: production）
- `ENV_GLM_API_KEY`: GLM API 密钥
- `ENV_TY_API_KEY`: TY API 密钥
- `ENV_DB_HOST`: 数据库主机地址
- `ENV_DB_PORT`: 数据库端口
- `ENV_DB_USERNAME`: 数据库用户名
- `ENV_DB_PASSWORD`: 数据库密码
- `ENV_DB_NAME`: 数据库名称
- `ENV_APP_PRIVATE_KEY`: 应用私钥
- `ENV_ALIPAY_PUBLIC_KEY`: 支付宝公钥
- `ENV_FRONTEND_ORIGIN`: 前端地址
- `ENV_COS_SECRET_ID`: 腾讯云 COS Secret ID
- `ENV_COS_SECRET_KEY`: 腾讯云 COS Secret Key
- `ENV_SESSION_SECRET`: Session 密钥（可选）

## 工作流说明

工作流会在以下情况触发：

- 推送到 `main` 分支
- 手动触发 (workflow_dispatch)

工作流执行步骤：

1. 检出代码
2. 设置 Docker Buildx
3. 构建 Docker 镜像（使用 GitHub Actions 缓存加速）
4. 将镜像保存为压缩的 tar 文件
5. 通过 SSH/SCP 传输镜像文件到服务器
6. 在服务器上加载镜像
7. 停止并删除旧容器
8. 启动新容器
9. 清理镜像文件和未使用的镜像

## 服务器准备

在服务器上执行以下操作：

1. **安装 Docker**（如果未安装）:

```bash
curl -fsSL https://get.docker.com | bash
```

2. **创建部署目录**:

```bash
mkdir -p /project/ai-service/uploads
chmod 755 /project/ai-service
```

3. **确保 Docker 服务运行**:

```bash
systemctl start docker
systemctl enable docker
```

4. **配置 SSH 密钥认证**:

```bash
# 在本地生成 SSH 密钥对（如果还没有）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 将公钥复制到服务器
ssh-copy-id username@server-ip

# 或者手动添加公钥到服务器的 ~/.ssh/authorized_keys
```

## 使用 docker-compose 部署（可选）

如果你更喜欢使用 docker-compose，可以在服务器上创建 `docker-compose.yml` 文件：

```bash
cd /project/ai-service
# 创建 docker-compose.yml（参考项目根目录的 docker-compose.yml）
# 创建 .env 文件
```

然后使用以下命令部署：

```bash
# 先加载镜像（如果使用工作流传输的镜像）
docker load < ai-service-*.tar.gz

# 使用 docker-compose 启动
docker-compose up -d
```

## 验证部署

部署完成后，检查容器状态：

```bash
docker ps | grep ai-service
docker logs ai-service
docker logs -f ai-service  # 实时查看日志
```

## 故障排查

1. **镜像构建失败**
   - 检查 Dockerfile 是否正确
   - 检查依赖是否正确安装
   - 查看 GitHub Actions 日志

2. **镜像传输失败**
   - 检查 SSH 连接是否正常
   - 检查服务器磁盘空间是否充足
   - 检查网络连接和带宽

3. **服务器部署失败**
   - 检查 Docker 服务是否运行: `systemctl status docker`
   - 检查端口是否被占用: `netstat -tulpn | grep 3000`
   - 查看容器日志: `docker logs ai-service`
   - 检查环境变量是否正确传递

4. **镜像加载失败**
   - 检查镜像文件是否完整传输
   - 检查服务器磁盘空间
   - 尝试手动加载: `gunzip -c ai-service-*.tar.gz | docker load`

5. **容器启动失败**
   - 检查环境变量是否都正确设置
   - 查看容器日志: `docker logs ai-service`
   - 检查数据库连接是否正常
   - 检查文件权限: `ls -la /project/ai-service/uploads`

## 注意事项

- **磁盘空间**: 确保服务器有足够的磁盘空间（镜像文件可能较大，建议至少 5GB 可用空间）
- **网络带宽**: 镜像文件传输可能需要一些时间，取决于文件大小和网络速度
- **安全性**:
  - 建议使用非 root 用户运行容器（已在 Dockerfile 中配置）
  - 定期清理旧的镜像文件: `docker image prune -a`
  - 确保 SSH 密钥安全，不要泄露私钥
- **生产环境**:
  - 建议使用 HTTPS 和反向代理（如 Nginx）
  - 配置防火墙规则
  - 定期备份数据
  - 监控容器资源使用情况

## 手动部署（如果需要）

如果自动部署失败，可以手动执行以下步骤：

1. **在本地构建镜像**:

```bash
docker build -t ai-service:latest .
```

2. **保存镜像**:

```bash
docker save ai-service:latest | gzip > ai-service.tar.gz
```

3. **传输到服务器**:

```bash
scp ai-service.tar.gz username@server-ip:/project/ai-service/
```

4. **在服务器上加载并运行**:

```bash
ssh username@server-ip
cd /project/ai-service
gunzip -c ai-service.tar.gz | docker load
docker stop ai-service 2>/dev/null || true
docker rm ai-service 2>/dev/null || true
docker run -d \
  --name ai-service \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  # ... 其他环境变量
  -v /project/ai-service/uploads:/app/uploads \
  ai-service:latest
```
