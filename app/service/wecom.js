'use strict';

const Service = require('egg').Service;
const axios = require('axios');

class WecomService extends Service {
  async sendNotification(content, projectName = null, msgType = 'markdown') {
    const { ctx, config } = this;

    if (!config.wecom.enabled) {
      ctx.logger.info('企业微信通知未启用');
      return;
    }

    try {
      const webhookUrl = this.getWebhookUrl(projectName);
      if (!webhookUrl) {
        ctx.logger.warn(`项目 ${projectName} 未配置企业微信Webhook URL`);
        return;
      }

      // 检查内容长度并分割发送
      const maxBytes = msgType === 'markdown' ? 4096 : 2048;
      const contentBytes = Buffer.byteLength(content, 'utf8');

      if (contentBytes <= maxBytes) {
        await this.sendSingleMessage(webhookUrl, content, msgType);
      } else {
        await this.sendChunkedMessage(webhookUrl, content, msgType, maxBytes);
      }
    } catch (error) {
      ctx.logger.error('企业微信通知发送失败:', error);
    }
  }

  getWebhookUrl(projectName) {
    const { config } = this;

    if (!projectName) {
      return config.wecom.defaultWebhookUrl;
    }

    // 尝试获取项目特定的webhook URL
    const projectKey = `WECOM_WEBHOOK_URL_${projectName.toUpperCase()}`;
    const projectUrl = process.env[projectKey];

    return projectUrl || config.wecom.defaultWebhookUrl;
  }

  async sendSingleMessage(webhookUrl, content, msgType) {
    const { ctx } = this;

    const data = this.buildMessage(content, msgType);

    try {
      const response = await axios.post(webhookUrl, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      if (response.data.errcode !== 0) {
        ctx.logger.error('企业微信消息发送失败:', response.data);
      } else {
        ctx.logger.info('企业微信消息发送成功');
      }
    } catch (error) {
      ctx.logger.error('企业微信请求失败:', error.message);
      throw error;
    }
  }

  async sendChunkedMessage(webhookUrl, content, msgType, maxBytes) {
    const { ctx } = this;

    const chunks = this.splitContent(content, maxBytes);
    ctx.logger.warn(`消息内容过长，分割为 ${chunks.length} 部分发送`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkTitle = `代码审查报告 (第${i + 1}/${chunks.length}部分)`;
      const chunkContent =
        msgType === 'markdown'
          ? `## ${chunkTitle}\n\n${chunks[i]}`
          : `${chunkTitle}\n\n${chunks[i]}`;

      await this.sendSingleMessage(webhookUrl, chunkContent, msgType);

      // 避免发送过快
      if (i < chunks.length - 1) {
        await this.sleep(1000);
      }
    }
  }

  splitContent(content, maxBytes) {
    const chunks = [];
    let start = 0;
    const contentBuffer = Buffer.from(content, 'utf8');

    while (start < contentBuffer.length) {
      let end = Math.min(start + maxBytes, contentBuffer.length);

      // 尝试在换行符处分割
      if (end < contentBuffer.length) {
        for (let i = end; i > start; i--) {
          if (contentBuffer[i] === 0x0a) {
            // \n
            end = i + 1;
            break;
          }
        }
      }

      const chunk = contentBuffer.slice(start, end).toString('utf8');
      chunks.push(chunk);
      start = end;
    }

    return chunks;
  }

  buildMessage(content, msgType) {
    if (msgType === 'markdown') {
      return {
        msgtype: 'markdown',
        markdown: {
          content: this.formatMarkdown(content),
        },
      };
    } else {
      return {
        msgtype: 'text',
        text: {
          content: content,
        },
      };
    }
  }

  formatMarkdown(content) {
    // 处理企业微信markdown格式限制
    let formatted = content;

    // 将5级以上标题转为4级
    formatted = formatted.replace(/#{5,}\s/g, '#### ');

    // 移除HTML标签
    formatted = formatted.replace(/<[^>]+>/g, '');

    return formatted;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WecomService;
