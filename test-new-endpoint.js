#!/usr/bin/env node

const axios = require('axios');

const MCP_ENDPOINT = 'https://mcp.deepwiki.com/mcp';

async function testNewEndpoint() {
  console.log('========================================');
  console.log('测试新的 Streamable HTTP 端点');
  console.log('========================================\n');

  try {
    console.log('[测试] 发送 initialize 请求...');

    const response = await axios.post(MCP_ENDPOINT, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'pi-bridge', version: '1.0.0' }
      }
    }, {
      headers: {
        'Accept': 'application/json, text/event-stream',
        'Content-Type': 'application/json'
      },
      responseType: 'stream',
      timeout: 30000
    });

    console.log('✓ 连接成功！');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\n[流式响应]');

    response.data.on('data', (chunk) => {
      const text = chunk.toString();
      console.log(text);
    });

    response.data.on('end', () => {
      console.log('\n✓ 响应结束');
    });

  } catch (err) {
    console.log('✗ 连接失败');
    console.log('Error:', err.message);
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

testNewEndpoint();