'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1234567890';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  // 安全配置
  config.security = {
    csrf: {
      enable: false,
    },
  };

  // CORS配置
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  // 服务端口
  config.cluster = {
    listen: {
      port: process.env.SERVER_PORT || 7001,
      hostname: '0.0.0.0',
    },
  };

  // 集群客户端配置
  config.clusterClient = {
    maxIdleTime: 120000, // 增加最大空闲时间到2分钟
    responseTimeout: 180000, // 响应超时时间3分钟
  };

  // HTTP客户端配置
  config.httpclient = {
    request: {
      timeout: 120000, // 请求超时2分钟
    },
  };

  // AI配置
  config.ai = {
    provider: process.env.LLM_PROVIDER || 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    },
    qwen: {
      apiKey: process.env.QWEN_API_KEY,
      baseURL:
        process.env.QWEN_BASE_URL ||
        'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: process.env.QWEN_MODEL || 'qwen-turbo',
    },
  };

  // 企业微信配置
  config.wecom = {
    enabled: process.env.WECOM_ENABLED === '1',
    defaultWebhookUrl: process.env.WECOM_WEBHOOK_URL,
  };

  // 代码审查配置
  config.review = {
    maxTokens: parseInt(process.env.REVIEW_MAX_TOKENS) || 10000,
    style: process.env.REVIEW_STYLE || 'professional',
  };

  return {
    ...config,
    ...userConfig,
  };
};
