'use strict';

const Service = require('egg').Service;
const axios = require('axios');
const { encoding_for_model } = require('tiktoken');

class AiService extends Service {
  async reviewCode(diffContent, commitMessage = '') {
    const { ctx, config } = this;

    try {
      // 截断过长的内容
      const truncatedDiff = this.truncateContent(
        diffContent,
        config.review.maxTokens,
      );

      if (!truncatedDiff.trim()) {
        return '代码为空，无需审查';
      }

      // 构建提示词
      const messages = this.buildMessages(truncatedDiff, commitMessage);

      // 调用AI服务
      const result = await this.callAI(messages);

      // 清理结果格式
      return this.cleanResult(result);
    } catch (error) {
      ctx.logger.error('AI代码审查失败:', error);
      return '代码审查失败，请稍后重试';
    }
  }

  buildMessages(diffContent, commitMessage) {
    const { config } = this;

    const systemPrompt = `你是一个专业的代码审查专家。请对提供的代码变更进行详细审查，重点关注：

1. **代码质量**：逻辑错误、性能问题、安全漏洞
2. **编码规范**：命名规范、代码风格、注释质量
3. **架构设计**：模块化、可维护性、可扩展性
4. **最佳实践**：是否遵循语言和框架的最佳实践

请以${
  config.review.style === 'professional' ? '专业严谨' : '友好建议'
}的语调提供反馈，并在最后给出总分（1-10分）。`;

    const userPrompt = `请审查以下代码变更：

**提交信息**: ${commitMessage}

**代码变更**:
\`\`\`diff
${diffContent}
\`\`\`

请提供详细的审查意见和改进建议。`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  async callAI(messages) {
    const { ctx, config } = this;
    const provider = config.ai.provider;

    ctx.logger.info(`调用AI服务进行代码审查，提供商: ${provider}`);

    switch (provider) {
      case 'openai':
        return await this.callOpenAI(messages);
      case 'deepseek':
        return await this.callDeepSeek(messages);
      case 'qwen':
        return await this.callQwen(messages);
      default:
        throw new Error(`不支持的AI提供商: ${provider}`);
    }
  }

  async callOpenAI(messages) {
    const { ctx, config } = this;

    try {
      const response = await axios.post(
        `${config.ai.openai.baseURL}/chat/completions`,
        {
          model: config.ai.openai.model,
          messages,
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${config.ai.openai.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      ctx.logger.error(
        'OpenAI API调用失败:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async callDeepSeek(messages) {
    const { ctx, config } = this;

    try {
      const response = await axios.post(
        `${config.ai.deepseek.baseURL}/chat/completions`,
        {
          model: config.ai.deepseek.model,
          messages,
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${config.ai.deepseek.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      ctx.logger.error(
        'DeepSeek API调用失败:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async callQwen(messages) {
    const { ctx, config } = this;

    try {
      const response = await axios.post(
        `${config.ai.qwen.baseURL}/chat/completions`,
        {
          model: config.ai.qwen.model,
          messages,
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${config.ai.qwen.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      ctx.logger.error(
        'Qwen API调用失败:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  truncateContent(content, maxTokens) {
    const { ctx } = this;

    try {
      // 使用tiktoken计算token数量
      const encoding = encoding_for_model('gpt-3.5-turbo');
      const tokens = encoding.encode(content);

      if (tokens.length <= maxTokens) {
        encoding.free();
        return content;
      }

      // 截断到指定token数量
      const truncatedTokens = tokens.slice(0, maxTokens);
      const truncatedContent = encoding.decode(truncatedTokens);
      encoding.free();

      ctx.logger.warn(
        `内容过长，已截断: ${tokens.length} -> ${maxTokens} tokens`,
      );
      return truncatedContent;
    } catch (error) {
      ctx.logger.error('Token计算失败，使用字符截断:', error);
      // 降级到字符截断
      return content.length > maxTokens * 4
        ? content.substring(0, maxTokens * 4)
        : content;
    }
  }

  cleanResult(result) {
    if (!result) return '审查结果为空';

    // 移除markdown代码块标记
    let cleaned = result.trim();
    if (cleaned.startsWith('```markdown') && cleaned.endsWith('```')) {
      cleaned = cleaned.slice(11, -3).trim();
    } else if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
      cleaned = cleaned.slice(3, -3).trim();
    }

    return cleaned;
  }
}

module.exports = AiService;
