const axios = require('axios');

async function fetchGitlabChanges() {
  const url =
    'http://192.168.211.2:8080/api/v4/projects/1/merge_requests/9/changes';
  const token = 'glpat-PdvaxwmM1YggNGARzc9y';
  // const token = 'glpat-WzdX8oWTSrfpkxzu1UTH';

  try {
    console.log('正在调用GitLab API...');
    console.log('URL:', url);

    const response = await axios.get(url, {
      headers: {
        'PRIVATE-TOKEN': token,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10秒超时
    });

    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('请求失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else if (error.request) {
      console.error('网络错误:', error.message);
    } else {
      console.error('其他错误:', error.message);
    }
    throw error;
  }
}

// 执行测试
fetchGitlabChanges()
  .then(() => {
    console.log('\n✅ 成功获取数据');
  })
  .catch(() => {
    console.log('\n❌ 获取数据失败');
  });
