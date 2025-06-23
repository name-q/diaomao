'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/webhook.test.js', () => {
  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect(200)
      .expect(res => {
        assert(res.text.includes('AI代码审查服务正在运行'));
      });
  });

  it('should POST /webhook with invalid data', () => {
    return app.httpRequest()
      .post('/webhook')
      .send({})
      .expect(200)
      .expect(res => {
        assert(res.body.message === '请求已接收，正在异步处理');
      });
  });
});