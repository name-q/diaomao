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
      const reviewResult = await ctx.service.ai.reviewCode(diffContent, pr.title);
      
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
      const reviewResult = await ctx.service.ai.reviewCode(diffContent, latestCommit.message);
      
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
      const gitlabUrl = process.env.GITLAB_URL || data.project.web_url.split('/')[0] + '//' + data.project.web_url.split('/')[2];
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
      const reviewResult = await ctx.service.ai.reviewCode(diffContent, mr.title);
      
      // 发送企业微信通知
      const message = this.formatMRMessage(mr, project, reviewResult);
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
      const gitlabUrl = process.env.GITLAB_URL || project.web_url.split('/')[0] + '//' + project.web_url.split('/')[2];
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
      const reviewResult = await ctx.service.ai.reviewCode(diffContent, latestCommit.message);
      
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
          'Accept': 'application/vnd.github.v3.diff',
          'Authorization': `token ${process.env.GITHUB_ACCESS_TOKEN}`,
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
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${process.env.GITHUB_ACCESS_TOKEN}`,
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
  
  formatMRMessage(mr, project, reviewResult) {
    return `## 🔍 代码审查报告 - Merge Request

**项目**: ${project.name}
**标题**: ${mr.title}
**作者**: ${mr.author?.name || 'Unknown'}
**分支**: ${mr.source_branch} → ${mr.target_branch}
**链接**: ${mr.url}

### 📋 审查结果
${reviewResult}`;
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