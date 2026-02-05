#!/usr/bin/env node

/**
 * DeepWiki SSE 连接测试脚本
 * 用于诊断 410 错误的根源
 */

const { EventSource } = require('eventsource');
const axios = require('axios');

const MCP_ENDPOINT = 'https://mcp.deepwiki.com/sse';

console.log('='.repeat(70));
console.log('DeepWiki SSE 连接测试');
console.log('='.repeat(70));

// 测试 1: 直接连接 SSE 端点
console.log('\n[测试 1] 直接连接 SSE 端点...');
console.log(`端点: ${MCP_ENDPOINT}`);

const es = new EventSource(MCP_ENDPOINT);

let connectionState = 'connecting';
let endpointReceived = false;
let errorReceived = false;

es.onopen = () => {
  console.log('✓ SSE 连接已建立');
  connectionState = 'connected';
};

es.addEventListener('endpoint', (event) => {
  endpointReceived = true;
  console.log(`✓ 收到 endpoint 事件: ${event.data}`);
  es.close();
});

es.onmessage = (event) => {
  console.log(`收到消息: ${event.data}`);
};

es.onerror = (err) => {
  errorReceived = true;
  console.error('✗ SSE 错误:', JSON.stringify(err, null, 2));
  console.error(`  - type: ${err.type}`);
  console.error(`  - message: ${err.message}`);
  console.error(`  - code: ${err.code}`);
  console.error(`  - readyState: ${es.readyState}`);

  if (err.code === 410) {
    console.error('\n❌ 410 Gone - 资源已失效');
    console.error('   可能原因:');
    console.error('   1. DeepWiki 服务已停用该 SSE 端点');
    console.error('   2. 需要使用新的端点 URL');
    console.error('   3. 服务端配置变更');
  }

  es.close();
};

// 超时保护
setTimeout(() => {
  if (!endpointReceived && !errorReceived) {
    console.log('⚠ 超时 - 未收到 endpoint 事件');
    es.close();
  }

  console.log('\n' + '='.repeat(70));
  console.log('测试总结:');
  console.log(`  连接状态: ${connectionState}`);
  console.log(`  Endpoint 事件: ${endpointReceived ? '✓' : '✗'}`);
  console.log(`  错误发生: ${errorReceived ? '✗' : '✓'}`);
  console.log('='.repeat(70));

  // 测试 2: 检查 API 替代端点
  console.log('\n[测试 2] 检查 HTTP API 替代方案...');
  testHttpApi();
}, 5000);

async function testHttpApi() {
  const testRepos = [
    'openai/openai-node',
    'facebook/react',
    'lbjlaq/Antigravity-Manager'
  ];

  for (const repo of testRepos) {
    try {
      console.log(`\n测试仓库: ${repo}`);

      // 尝试不同的 API 端点
      const endpoints = [
        `https://api.devin.ai/ada/repo/${encodeURIComponent(repo)}`,
        `https://mcp.deepwiki.com/api/repo/${encodeURIComponent(repo)}`,
        `https://deepwiki.com/api/repo/${encodeURIComponent(repo)}`
      ];

      for (const url of endpoints) {
        try {
          console.log(`  尝试: ${url}`);
          const response = await axios.get(url, {
            timeout: 5000,
            headers: { 'Accept': 'application/json' }
          });
          console.log(`  ✓ 成功 (${response.status})`);
          break;
        } catch (err) {
          if (err.response) {
            console.log(`  ✗ ${err.response.status} - ${err.response.statusText}`);
          } else {
            console.log(`  ✗ ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.log(`  ✗ 测试失败: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('建议:');
  console.log('  1. 检查 DeepWiki 服务状态: https://github.com/Dwsy/deepwiki-skills');
  console.log('  2. 查看 DeepWiki 文档是否有新的 API 端点');
  console.log('  3. 考虑使用 context7 skill 作为替代方案');
  console.log('='.repeat(70));
}