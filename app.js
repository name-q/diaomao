'use strict';

// 加载环境变量
require('dotenv').config();

module.exports = app => {
  app.beforeStart(async () => {
    // 应用启动前的初始化工作
    app.logger.info('AI代码审查服务启动中...');
  });
};
