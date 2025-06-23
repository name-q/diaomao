'use strict';

const Controller = require('egg').Controller;

class WebhookController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = '<h1>AI代码审查服务正在运行</h1>';
  }

  async handleWebhook() {
    const { ctx } = this;

    try {
      const data = ctx.request.body;
      if (!data) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid JSON' };
        return;
      }

      // 判断是GitHub还是GitLab的webhook
      const githubEvent = ctx.headers['x-github-event'];

      if (githubEvent) {
        // GitHub webhook
        await this.handleGithubWebhook(githubEvent, data);
      } else {
        // GitLab webhook
        await this.handleGitlabWebhook(data);
      }

      ctx.body = { message: '请求已接收，正在异步处理' };
    } catch (error) {
      ctx.logger.error('Webhook处理失败:', error);
      ctx.status = 500;
      ctx.body = { error: '内部服务器错误' };
    }
  }

  async handleGithubWebhook(eventType, data) {
    const { ctx } = this;

    ctx.logger.info(`收到GitHub事件: ${eventType}`);

    if (eventType === 'pull_request') {
      const action = data.action;
      if (['opened', 'synchronize', 'reopened'].includes(action)) {
        // 异步处理PR审查
        setImmediate(() => {
          ctx.service.review.handleGithubPullRequest(data).catch(err => {
            ctx.logger.error('GitHub PR处理失败:', err);
          });
        });
      }
    } else if (eventType === 'push') {
      // 异步处理Push审查
      setImmediate(() => {
        ctx.service.review.handleGithubPush(data).catch(err => {
          ctx.logger.error('GitHub Push处理失败:', err);
        });
      });
    }
  }

  async handleGitlabWebhook(data) {
    const { ctx } = this;

    const objectKind = data.object_kind;
    ctx.logger.info(`收到GitLab事件: ${objectKind}`);

    if (objectKind === 'merge_request') {
      const action = data.object_attributes?.action;
      if (['open', 'update', 'reopen'].includes(action)) {
        // 异步处理MR审查
        setImmediate(() => {
          ctx.service.review.handleGitlabMergeRequest(data).catch(err => {
            ctx.logger.error('GitLab MR处理失败:', err);
          });
        });
      }
    } else if (objectKind === 'push') {
      // 异步处理Push审查
      setImmediate(() => {
        ctx.service.review.handleGitlabPush(data).catch(err => {
          ctx.logger.error('GitLab Push处理失败:', err);
        });
      });
    }
  }
}

module.exports = WebhookController;
