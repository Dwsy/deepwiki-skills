#!/usr/bin/env node

const { EventSource } = require('eventsource');
const axios = require('axios');

const MCP_ENDPOINT = 'https://mcp.deepwiki.com/sse';

async function run() {
  const args = process.argv.slice(2);
  const toolName = args[0];
  const params = {};

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    params[key] = args[i + 1];
  }

  if (!toolName) {
    console.error("用法: node dw.js <tool_name> --repo <repo> [...]");
    process.exit(1);
  }

  const es = new EventSource(MCP_ENDPOINT);
  let postUrl = '';

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // 监听 JSON-RPC 响应
      if (data.id === 2) {
        if (data.result && data.result.content) {
          console.log(data.result.content.map(c => c.text).join('\n'));
        } else if (data.error) {
          console.error("Tool 报错:", JSON.stringify(data.error, null, 2));
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
        es.close();
        process.exit(0);
      }
    } catch (e) {
      // 忽略非 JSON 消息
    }
  };

  es.addEventListener('endpoint', async (event) => {
    postUrl = new URL(event.data, MCP_ENDPOINT).href;

    try {
      // 1. Initialize
      await axios.post(postUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'pi-bridge', version: '1.0.0' }
        }
      });

      // 2. Call Tool (ID 设为 2，方便在 onmessage 里匹配)
      await axios.post(postUrl, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        }
      });
      
      // 注意：这里不直接退出，等待 onmessage 接收结果
    } catch (err) {
      console.error("请求失败:", err.response ? err.response.data : err.message);
      es.close();
      process.exit(1);
    }
  });

  es.onerror = (err) => {
    console.error("SSE 连接失败:", err);
    es.close();
    process.exit(1);
  };

  // 30秒超时保护
  setTimeout(() => {
    console.error("超时：未收到服务器响应");
    es.close();
    process.exit(1);
  }, 30000);
}

run();
