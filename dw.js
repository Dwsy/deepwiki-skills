#!/usr/bin/env node

/**
 * DeepWiki CLI - Streamable HTTP Protocol
 * 获取 GitHub 仓库文档和知识的 CLI 工具
 */

const axios = require('axios');

const MCP_ENDPOINT = 'https://mcp.deepwiki.com/mcp';

// i18n messages
const MESSAGES = {
  en: {
    usage: 'Usage: dw <command> [options]',
    description: 'CLI tool for GitHub repository documentation via DeepWiki MCP',
    commands: {
      'rws': 'Get repository documentation structure',
      'rwc': 'List available documentation pages',
      'aq': 'Ask questions about the repository',
      'list_tools': 'List available tools'
    },
    options: {
      repo: 'Repository name (e.g., "owner/repo")',
      question: 'Your question about the repository',
      format: 'Output format (text|json, default: text)'
    },
    errors: {
      noCommand: 'Error: No command provided',
      connectionFailed: 'Error: Connection failed',
      requestFailed: 'Error: Request failed',
      timeout: 'Error: Timeout',
      missingRepo: 'Error: --repo is required',
      missingQuestion: 'Error: --question is required'
    }
  },
  zh: {
    usage: '用法: dw <命令> [选项]',
    description: '通过 DeepWiki MCP 获取 GitHub 仓库文档的 CLI 工具',
    commands: {
      'rws': '获取仓库文档结构',
      'rwc': '查看仓库所有可用文档页面',
      'aq': '针对仓库提问',
      'list_tools': '列出可用工具'
    },
    options: {
      repo: '仓库名称 (例如: "owner/repo")',
      question: '关于仓库的问题',
      format: '输出格式 (text|json, 默认: text)'
    },
    errors: {
      noCommand: '错误: 未提供命令',
      connectionFailed: '错误: 连接失败',
      requestFailed: '错误: 请求失败',
      timeout: '错误: 超时',
      missingRepo: '错误: 需要 --repo 参数',
      missingQuestion: '错误: 需要 --question 参数'
    }
  }
};

// Detect language
function getLanguage() {
  const envLang = process.env.LANG || process.env.LC_ALL || '';
  if (envLang.startsWith('zh')) return 'zh';
  return 'en';
}

const LANG = getLanguage();
const t = MESSAGES[LANG];

// Parse arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { command: null, params: {}, options: {} };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      result.options.help = true;
      return result;
    }
    if (arg === '-f' || arg === '--format') {
      result.options.format = args[++i];
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[++i];
      result.params[key] = value || true;
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const value = args[++i];
      if (key === 'r') result.params.repo = value;
      if (key === 'n') result.params.name = value;
      if (key === 'q') result.params.question = value;
    } else {
      result.command = arg;
    }
  }

  return result;
}

// Print help
function printHelp() {
  console.log(`\n${t.usage}`);
  console.log(`\n${t.description}\n`);
  console.log(`${t.help?.commandsSection || 'Commands:'}`);
  console.log(`  rws                     ${t.commands.rws}`);
  console.log(`  rwc                     ${t.commands.rwc}`);
  console.log(`  aq                      ${t.commands.aq}`);
  console.log(`  list_tools              ${t.commands.list_tools}`);
  console.log(`\nOptions:`);
  console.log(`  --repo, -r              ${t.options.repo}`);
  console.log(`  --question, -q          ${t.options.question}`);
  console.log(`  --format, -f            ${t.options.format}`);
  console.log(`  --help, -h              Help`);
  console.log(`\nExamples:`);
  console.log(`  dw rws -r "tauri-apps/tauri"`);
  console.log(`  dw rwc -r "tauri-apps/tauri"`);
  console.log(`  dw aq -r "tauri-apps/tauri" -q "How to create window?"`);
  console.log();
}

// Parse SSE stream from Node.js stream response
async function parseSSEStream(response) {
  const chunks = [];

  return new Promise((resolve, reject) => {
    response.data.on('data', (chunk) => chunks.push(chunk));
    response.data.on('end', () => {
      const fullText = Buffer.concat(chunks).toString('utf-8');
      const messages = [];
      let currentEvent = null;
      let currentData = '';

      for (const line of fullText.split('\n')) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7);
        } else if (line.startsWith('data: ')) {
          currentData = line.slice(6);
          if (currentData.trim()) {
            try {
              messages.push({ event: currentEvent || 'message', data: JSON.parse(currentData) });
            } catch (e) { /* ignore parse errors */ }
          }
        }
      }
      resolve(messages);
    });
    response.data.on('error', reject);
  });
}

// List available tools
async function listTools() {
  try {
    const response = await axios.post(MCP_ENDPOINT, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    }, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
      responseType: 'stream',
      timeout: 30000
    });

    const messages = await parseSSEStream(response);
    const result = messages.find(m => m.data?.result?.tools);
    
    if (result?.data?.result?.tools) {
      console.log('\nAvailable Tools:');
      result.data.result.tools.forEach(tool => {
        console.log(`\n  ${tool.name}`);
        console.log(`    ${tool.description || 'No description'}`);
        if (tool.inputSchema?.properties) {
          console.log('    Parameters:');
          Object.entries(tool.inputSchema.properties).forEach(([key, prop]) => {
            const required = tool.inputSchema.required?.includes(key) ? ' (required)' : '';
            console.log(`      --${key}${required}: ${prop.type}${prop.description ? ` - ${prop.description}` : ''}`);
          });
        }
      });
    }
    process.exit(0);
  } catch (err) {
    console.error(t.errors.connectionFailed, err.message);
    process.exit(1);
  }
}

// Call MCP tool
async function callTool(toolName, params) {
  try {
    const response = await axios.post(MCP_ENDPOINT, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: params }
    }, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
      responseType: 'stream',
      timeout: 60000
    });

    const messages = await parseSSEStream(response);
    const result = messages.find(m => m.data?.result);

    if (result?.data?.error) {
      console.error(`${t.errors.requestFailed}:`, JSON.stringify(result.data.error, null, 2));
      process.exit(1);
    }

    if (result?.data?.result?.content) {
      return result.data.result.content;
    }

    return null;
  } catch (err) {
    console.error(t.errors.connectionFailed, err.message);
    process.exit(1);
  }
}

// Format output
function formatOutput(content, format = 'text') {
  if (format === 'json') {
    console.log(JSON.stringify(content, null, 2));
    return;
  }

  if (Array.isArray(content)) {
    content.forEach(item => {
      if (item.type === 'text') {
        console.log(item.text);
      } else if (item.type === 'resource') {
        console.log(`\n## ${item.resource?.name || 'Resource'}`);
        if (item.resource?.uri) console.log(`URI: ${item.resource.uri}`);
        if (item.resource?.mimeType) console.log(`Type: ${item.resource.mimeType}`);
        if (item.text) console.log(`\n${item.text}`);
      }
    });
  } else if (typeof content === 'string') {
    console.log(content);
  } else if (content) {
    console.log(JSON.stringify(content, null, 2));
  }
}

// Main function
async function main() {
  const { command, params, options } = parseArgs();

  if (options.help || !command) {
    printHelp();
    process.exit(0);
  }

  const format = options.format || 'text';

  switch (command) {
    case 'list_tools':
      await listTools();
      break;

    case 'rws':
      if (!params.repo) {
        console.error(t.errors.missingRepo);
        process.exit(1);
      }
      const structure = await callTool('read_wiki_structure', { repoName: params.repo });
      if (structure) formatOutput(structure, format);
      break;

    case 'rwc':
      if (!params.repo) {
        console.error(t.errors.missingRepo);
        process.exit(1);
      }
      // read_wiki_contents 只支持 repoName 参数，返回所有可用页面
      const contents = await callTool('read_wiki_contents', { repoName: params.repo });
      if (contents) formatOutput(contents, format);
      break;

    case 'aq':
      if (!params.repo) {
        console.error(t.errors.missingRepo);
        process.exit(1);
      }
      if (!params.question) {
        console.error(t.errors.missingQuestion);
        process.exit(1);
      }
      const answer = await callTool('ask_question', { repoName: params.repo, question: params.question });
      if (answer) formatOutput(answer, format);
      break;

    default:
      console.error(`${t.errors.noCommand}: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main();
