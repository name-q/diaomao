<div align="center">
  <img src="./logo.png" alt="Diaomao Logo" width="200" height="200">
  
  # Diaomao
  
  Intelligent AI code review service that supports GitHub and GitLab webhooks, automatically performs code reviews and sends notifications via Enterprise WeChat.
  
  [中文文档](./README.md) | **English**
</div>

## Features

- 🤖 **AI Code Review**: Supports multiple AI providers including OpenAI, DeepSeek, Qwen, etc.
- 🔗 **Multi-platform Support**: Supports GitHub and GitLab webhooks
- 📱 **Enterprise WeChat Notifications**: Supports different WeChat groups for different projects
- ⚡ **Asynchronous Processing**: Fast webhook response with asynchronous code review processing
- 🛡️ **Security & Reliability**: Supports token validation and content truncation
- 🎯 **Smart Scoring**: Automatically scores code quality for MRs/PRs and leaves comments
- 🚫 **Auto Close**: Supports automatically closing MRs/PRs that don't meet quality standards

## Quick Start

### 1. Install Dependencies

```bash
pnpm i
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure the parameters:

```bash
cp .env.example .env
```

### 3. Start Service

```bash
# Development mode
pnpm dev

# Production mode
pnpm start
```

## Configuration

### AI Provider Configuration

Choose one of the following AI providers to configure:

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

#### Qwen
```env
LLM_PROVIDER=qwen
QWEN_API_KEY=your_api_key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-turbo
```

### Enterprise WeChat Configuration

#### Basic Configuration
```env
WECOM_ENABLED=1
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your_key
```

#### Multi-project Configuration
Different projects can be configured with different WeChat groups:

```env
# Configuration for project named PROJECT1 (WECOM_WEBHOOK_URL_ORIGINAL_PROJECT_NAME_IN_UPPERCASE)
WECOM_WEBHOOK_URL_PROJECT1=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=project1_key

# Configuration for project named PROJECT2
WECOM_WEBHOOK_URL_PROJECT2=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=project2_key
```

### Git Platform Configuration

#### GitHub
```env
GITHUB_ACCESS_TOKEN=your_github_token
```

#### GitLab
```env
GITLAB_URL=https://gitlab.example.com
GITLAB_ACCESS_TOKEN=your_gitlab_token
```

### Automatic Operations Configuration

#### Auto Close Unqualified MRs/PRs
```env
# Enable auto close feature
AUTO_CLOSE_ENABLED=1
# Quality score threshold (MRs/PRs below this score will be auto-closed, range 1-10)
QUALITY_THRESHOLD=6
```

#### Score Comment Configuration
```env
# Enable score comment feature
SCORE_COMMENT_ENABLED=1
# Score comment template (optional, uses default template if not configured)
SCORE_COMMENT_TEMPLATE="Code Quality Score: {score}/10\n\n{feedback}"
```

## Webhook Configuration

### GitHub Webhook

Add webhook in GitHub repository settings:

- **Payload URL**: `http://your-domain.com/webhook`
- **Content type**: `application/json`
- **Events**: Select `Pull requests` and `Pushes`

### GitLab Webhook

Add webhook in GitLab project settings:

- **URL**: `http://your-domain.com/webhook`
- **Trigger**: Select `Merge request events` and `Push events`

## API Endpoints

### POST /webhook

Receives webhook requests from GitHub and GitLab.

**Response Example**:
```json
{
  "message": "Request received, processing asynchronously"
}
```

## Deployment

### Docker Deployment

#### Method 1: Using Pre-built Image (Recommended)

```bash
# Pull image
docker pull nameq/diaomao:v1.0.1

# Run container
docker run -d --name diaomao -p 7001:7001 --env-file .env nameq/diaomao:v1.0.1
```

#### Method 2: Using docker-compose

```bash
# Start service
docker-compose up -d

# Stop service
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart
```

#### Method 3: Local Build

```bash
# Build image
docker build -t diaomao .

# Run container
docker run -d --name diaomao -p 7001:7001 --env-file .env diaomao
```

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start npm --name "diaomao" -- start

# Check status
pm2 status
```

## Notes

1. Ensure the server can access the configured AI service APIs
2. Enterprise WeChat bot needs to be created first to obtain the webhook URL
3. GitHub/GitLab access tokens need appropriate permissions
4. HTTPS is recommended for production environments
5. Code content will be truncated based on the configured maximum token count

## License

MIT License