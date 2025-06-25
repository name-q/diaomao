'use strict';

const Service = require('egg').Service;

class ReviewService extends Service {
  async handleGithubPullRequest(data) {
    const { ctx } = this;

    try {
      const pr = data.pull_request;
      const repo = data.repository;

      // 获取PR的diff
      const diffUrl = pr.diff_url;
      const diffContent = await this.fetchDiff(diffUrl);

      if (!diffContent) {
        ctx.logger.warn('无法获取PR diff内容');
        return;
      }

      // AI审查代码
      const reviewResult = await ctx.service.ai.reviewCode(
        diffContent,
        pr.title,
      );

      // 发送企业微信通知
      const message = this.formatPRMessage(pr, repo, reviewResult);
      await ctx.service.wecom.sendNotification(message, repo.name);

      ctx.logger.info(`GitHub PR审查完成: ${pr.html_url}`);
    } catch (error) {
      ctx.logger.error('GitHub PR处理失败:', error);
    }
  }

  async handleGithubPush(data) {
    const { ctx } = this;

    try {
      const repo = data.repository;
      const commits = data.commits || [];

      if (commits.length === 0) {
        return;
      }

      // 获取最新commit的diff
      const latestCommit = commits[commits.length - 1];
      const diffContent = await this.fetchCommitDiff(latestCommit.url);

      if (!diffContent) {
        ctx.logger.warn('无法获取commit diff内容');
        return;
      }

      // AI审查代码
      const reviewResult = await ctx.service.ai.reviewCode(
        diffContent,
        latestCommit.message,
      );

      // 发送企业微信通知
      const message = this.formatPushMessage(data, reviewResult);
      await ctx.service.wecom.sendNotification(message, repo.name);

      ctx.logger.info(`GitHub Push审查完成: ${repo.html_url}`);
    } catch (error) {
      ctx.logger.error('GitHub Push处理失败:', error);
    }
  }

  async handleGitlabMergeRequest(data) {
    const { ctx } = this;

    try {
      const mr = data.object_attributes;
      const project = data.project;

      // 构建GitLab API URL获取MR的changes
      const gitlabUrl =
        process.env.GITLAB_URL ||
        data.project.web_url.split('/')[0] +
          '//' +
          data.project.web_url.split('/')[2];
      const token = process.env.GITLAB_ACCESS_TOKEN;

      if (!token) {
        ctx.logger.error('缺少GitLab访问令牌');
        return;
      }

      const changesUrl = `${gitlabUrl}/api/v4/projects/${project.id}/merge_requests/${mr.iid}/changes`;
      const diffContent = await this.fetchGitlabChanges(changesUrl, token);

      if (!diffContent) {
        ctx.logger.warn('无法获取MR changes内容');
        return;
      }

      // AI审查代码
      const reviewResult = await ctx.service.ai.reviewCode(
        diffContent,
        mr.title,
      );

      // 提取分数并检查是否需要关闭MR
      const score = this.extractScore(reviewResult);
      const shouldClose = score !== null && score < this.config.review.minScore;

      // 发布评论到GitLab MR
      await this.postGitlabMRComment(
        gitlabUrl,
        token,
        project.id,
        mr.iid,
        reviewResult,
        shouldClose,
      );

      // 如果分数过低，关闭MR
      if (shouldClose) {
        await this.closeGitlabMR(gitlabUrl, token, project.id, mr.iid);
      }

      // 发送企业微信通知
      const message = this.formatMRMessage(
        mr,
        project,
        reviewResult,
        shouldClose,
      );
      await ctx.service.wecom.sendNotification(message, project.name);

      ctx.logger.info(`GitLab MR审查完成: ${mr.url}`);
    } catch (error) {
      ctx.logger.error('GitLab MR处理失败:', error);
    }
  }

  async handleGitlabPush(data) {
    const { ctx } = this;

    try {
      const project = data.project;
      const commits = data.commits || [];

      if (commits.length === 0) {
        return;
      }

      // 获取最新commit的diff
      const latestCommit = commits[commits.length - 1];
      const gitlabUrl =
        process.env.GITLAB_URL ||
        project.web_url.split('/')[0] + '//' + project.web_url.split('/')[2];
      const token = process.env.GITLAB_ACCESS_TOKEN;

      if (!token) {
        ctx.logger.error('缺少GitLab访问令牌');
        return;
      }

      const commitUrl = `${gitlabUrl}/api/v4/projects/${project.id}/repository/commits/${latestCommit.id}`;
      const diffContent = await this.fetchGitlabCommit(commitUrl, token);

      if (!diffContent) {
        ctx.logger.warn('无法获取commit diff内容');
        return;
      }

      // AI审查代码
      const reviewResult = await ctx.service.ai.reviewCode(
        diffContent,
        latestCommit.message,
      );

      // 发送企业微信通知
      const message = this.formatPushMessage(data, reviewResult);
      await ctx.service.wecom.sendNotification(message, project.name);

      ctx.logger.info(`GitLab Push审查完成: ${project.web_url}`);
    } catch (error) {
      ctx.logger.error('GitLab Push处理失败:', error);
    }
  }

  async fetchDiff(url) {
    const { ctx } = this;
    try {
      const response = await ctx.curl(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3.diff',
          Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
        },
        timeout: 30000,
      });
      return response.data.toString();
    } catch (error) {
      ctx.logger.error('获取diff失败:', error);
      return null;
    }
  }

  async fetchCommitDiff(commitUrl) {
    const { ctx } = this;
    try {
      const response = await ctx.curl(commitUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
        },
        timeout: 30000,
      });
      const commit = JSON.parse(response.data);
      return commit.files?.map(file => file.patch).join('\n') || '';
    } catch (error) {
      ctx.logger.error('获取commit diff失败:', error);
      return null;
    }
  }

  async fetchGitlabChanges(url, token) {
    const { ctx } = this;
    try {
      const response = await ctx.curl(url, {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': token,
        },
        timeout: 30000,
      });
      const data = JSON.parse(response.data);
      return data.changes?.map(change => change.diff).join('\n') || '';
    } catch (error) {
      ctx.logger.error('获取GitLab changes失败:', error);
      return null;
    }
  }

  async fetchGitlabCommit(url, token) {
    const { ctx } = this;
    try {
      const response = await ctx.curl(url, {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': token,
        },
        timeout: 30000,
      });
      const commit = JSON.parse(response.data);
      return commit.diff || '';
    } catch (error) {
      ctx.logger.error('获取GitLab commit失败:', error);
      return null;
    }
  }

  async postGitlabMRComment(
    gitlabUrl,
    token,
    projectId,
    mrIid,
    reviewResult,
    shouldClose = false,
  ) {
    const { ctx } = this;
    try {
      const commentUrl = `${gitlabUrl}/api/v4/projects/${projectId}/merge_requests/${mrIid}/notes`;
      let commentBody = `## 🤖 AI 代码审查报告

${reviewResult}`;

      if (shouldClose) {
        commentBody += `\n\n---\n\n⚠️ **警告**: 代码质量分数低于最低要求（${this.config.review.minScore}分），该 Merge Request 已被自动关闭。`;
      }

      const response = await ctx.curl(commentUrl, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': token,
          'Content-Type': 'application/json',
        },
        data: {
          body: commentBody,
        },
        timeout: 30000,
      });

      ctx.logger.info('成功发布GitLab MR评论');
      return JSON.parse(response.data);
    } catch (error) {
      ctx.logger.error('发布GitLab MR评论失败:', error);
      throw error;
    }
  }

  async closeGitlabMR(gitlabUrl, token, projectId, mrIid) {
    const { ctx } = this;
    try {
      const closeUrl = `${gitlabUrl}/api/v4/projects/${projectId}/merge_requests/${mrIid}`;

      await ctx.curl(closeUrl, {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': token,
          'Content-Type': 'application/json',
        },
        data: {
          state_event: 'close',
        },
        timeout: 30000,
      });

      ctx.logger.info(`成功关闭 GitLab MR: ${mrIid}`);
    } catch (error) {
      ctx.logger.error('关闭 GitLab MR 失败:', error);
      throw error;
    }
  }

  extractScore(reviewResult) {
    const { ctx } = this;
    try {
      // 尝试多种分数格式匹配，按优先级排序
      const patterns = [
        // x/10 格式（提取分子）
        /(\d+(?:\.\d+)?)\s*\/\s*10/,
        // 总评、评分等关键词后的分数
        /总评[:：]?\s*(\d+(?:\.\d+)?)/,
        /总分[:：]?\s*(\d+(?:\.\d+)?)/,
        /评分[:：]?\s*(\d+(?:\.\d+)?)/,
        /分数[:：]?\s*(\d+(?:\.\d+)?)/,
        /score[:：]?\s*(\d+(?:\.\d+)?)/i,
        // 最后匹配单独的数字+分
        /(\d+(?:\.\d+)?)\s*分/,
      ];

      for (const pattern of patterns) {
        const match = reviewResult.match(pattern);
        if (match) {
          const score = parseFloat(match[1]);
          ctx.logger.info(`提取到分数: ${score}`);
          return score;
        }
      }

      ctx.logger.warn('未能从审查结果中提取到分数');
      return null;
    } catch (error) {
      ctx.logger.error('提取分数失败:', error);
      return null;
    }
  }

  formatPRMessage(pr, repo, reviewResult) {
    return `## 🔍 代码审查报告 - Pull Request

**项目**: ${repo.full_name}
**标题**: ${pr.title}
**作者**: ${pr.user.login}
**分支**: ${pr.head.ref} → ${pr.base.ref}
**链接**: ${pr.html_url}

### 📋 审查结果
${reviewResult}`;
  }

  formatMRMessage(mr, project, reviewResult, shouldClose = false) {
    let message = `## 🔍 代码审查报告 - Merge Request

**项目**: ${project.name}
**标题**: ${mr.title}
**作者**: ${mr.author?.name || 'Unknown'}
**分支**: ${mr.source_branch} → ${mr.target_branch}
**链接**: ${mr.url}`;

    if (shouldClose) {
      message += `\n**状态**: ⚠️ 已自动关闭（分数过低）`;
    }

    message += `\n\n### 📋 审查结果\n${reviewResult}`;

    return message;
  }

  formatPushMessage(data, reviewResult) {
    const repo = data.repository || data.project;
    const commits = data.commits || [];
    const latestCommit = commits[commits.length - 1];

    return `## 🔍 代码审查报告 - Push

**项目**: ${repo.name || repo.full_name}
**分支**: ${data.ref?.replace('refs/heads/', '') || 'unknown'}
**提交者**: ${latestCommit?.author?.name || 'Unknown'}
**提交信息**: ${latestCommit?.message || 'No message'}

### 📋 审查结果
${reviewResult}`;
  }
}

module.exports = ReviewService;
