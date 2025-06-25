<div align="center">
  <img src="./logo.png" alt="掉毛 Logo" width="200" height="200">
  
  # 掉毛 (Diaomao)
  
  AI 代码审查服务，支持 GitHub 和 GitLab 的 Webhook，自动进行代码审查并通过企业微信发送通知。
  
  **中文** | [English](./README_EN.md)
</div>

## 功能特性

- 🤖 **AI代码审查**: 支持 OpenAI、DeepSeek、通义千问等多个AI提供商
- 🔗 **多平台支持**: 支持 GitHub 和 GitLab 的 Webhook
- 📱 **企业微信通知**: 支持不同项目配置不同的企业微信群
- ⚡ **异步处理**: 快速响应 Webhook，异步处理代码审查
- 🛡️ **安全可靠**: 支持 Token 验证和内容截断
- 🎯 **智能评分**: 自动为 MR/PR 进行代码质量评分并留言
- 🚫 **自动关闭**: 支持自动关闭不符合质量标准的 MR/PR

## 快速开始

### 1. 安装依赖

```bash
pnpm i
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置相关参数：

```bash
cp .env.example .env
```

### 3. 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm start
```

## 配置说明

### AI提供商配置

支持以下AI提供商，选择其中一个配置即可：

#### OpenAI
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

#### DeepSeek
```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

#### 通义千问
```env
LLM_PROVIDER=qwen
QWEN_API_KEY=your_api_key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-turbo
```

### 企业微信配置

#### 基础配置
```env
WECOM_ENABLED=1
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your_key
```

#### 多项目配置
不同项目可以配置不同的企业微信群：

```env
# 项目名为 PROJECT1 的配置（WECOM_WEBHOOK_URL_原项目名转大写）
WECOM_WEBHOOK_URL_PROJECT1=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=project1_key

# 项目名为 PROJECT2 的配置  
WECOM_WEBHOOK_URL_PROJECT2=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=project2_key
```

### Git平台配置

#### GitHub
```env
GITHUB_ACCESS_TOKEN=your_github_token
```

#### GitLab
```env
GITLAB_URL=https://gitlab.example.com
GITLAB_ACCESS_TOKEN=your_gitlab_token
```

### 自动操作配置

#### 自动关闭不合格MR/PR
```env
# 启用自动关闭功能
AUTO_CLOSE_ENABLED=1
# 质量评分阈值（低于此分数将自动关闭，范围1-10）
QUALITY_THRESHOLD=6
```

#### 评分留言配置
```env
# 启用评分留言功能
SCORE_COMMENT_ENABLED=1
# 评分留言模板（可选，使用默认模板如不配置）
SCORE_COMMENT_TEMPLATE="代码质量评分：{score}/10\n\n{feedback}"
```

## Webhook配置

### GitHub Webhook

在 GitHub 仓库设置中添加 Webhook：

- **Payload URL**: `http://your-domain.com/webhook`
- **Content type**: `application/json`
- **Events**: 选择 `Pull requests` 和 `Pushes`

### GitLab Webhook

在 GitLab 项目设置中添加 Webhook：

- **URL**: `http://your-domain.com/webhook`
- **Trigger**: 选择 `Merge request events` 和 `Push events`

## API接口

### POST /webhook

接收 GitHub 和 GitLab 的 Webhook 请求。

**响应示例**:
```json
{
  "message": "请求已接收，正在异步处理"
}
```

## 部署

### Docker部署

#### 方式一：使用预构建镜像（推荐）

```bash
# 拉取镜像
docker pull nameq/diaomao:v1.0.1

# 运行容器
docker run -d --name diaomao -p 7001:7001 --env-file .env nameq/diaomao:v1.0.1
```

#### 方式二：使用 docker-compose

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart
```

#### 方式三：本地构建

```bash
# 构建镜像
docker build -t diaomao .

# 运行容器
docker run -d --name diaomao -p 7001:7001 --env-file .env diaomao
```

### PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "diaomao" -- start

# 查看状态
pm2 status
```

## 注意事项

1. 确保服务器能够访问配置的AI服务API
2. 企业微信机器人需要先创建并获取Webhook URL
3. GitHub/GitLab的访问令牌需要有相应的权限
4. 建议在生产环境中使用HTTPS
5. 代码内容会根据配置的最大Token数进行截断

## 许可证

MIT License