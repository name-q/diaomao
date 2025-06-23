'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;

  // 首页
  router.get('/', controller.webhook.index);

  // Webhook接口
  router.post('/webhook', controller.webhook.handleWebhook);
};
