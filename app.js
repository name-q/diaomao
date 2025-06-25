'use strict';

module.exports = app => {
  app.beforeStart(async () => {
    try {
      app.logger.info('AI代码审查服务启动中...');
    } catch (err) {
      app.logger.error('启动前异常：', err);
    }
  });
};
