---
name: deepwiki
description: 从 DeepWiki 获取 GitHub 仓库的文档和知识。支持查看文档结构、内容以及针对仓库提问。
---

# DeepWiki 技能

此技能通过 MCP SSE 协议连接到 DeepWiki。

## 执行环境

| 路径类型 | 路径 | 基准目录 |
|---------|------|---------|
| **技能目录** | `~/.pi/agent/skills/deepwiki/` | 固定位置 |
| **主脚本** | `~/.pi/agent/skills/deepwiki/dw.js` | 技能目录 |

## 安装

```bash
npm install @skills/deepwiki
```

或使用 pnpm:

```bash
pnpm add @skills/deepwiki
```

## 工具用法

### 1. 获取仓库文档主题列表
```bash
cd ~/.pi/agent/skills/deepwiki
node dw.js read_wiki_structure --repoName "owner/repo"
```

### 2. 查看具体文档内容
```bash
cd ~/.pi/agent/skills/deepwiki
node dw.js read_wiki_contents --repoName "owner/repo" --topic "topic_name"
```

### 3. 针对仓库提问
```bash
cd ~/.pi/agent/skills/deepwiki
node dw.js ask_question --repoName "owner/repo" --question "你的问题"
```

## 路径说明

- **所有脚本必须从 `~/.pi/agent/skills/deepwiki/` 目录执行**
- `dw.js` 文件位于技能安装目录中，不随工作目录变化
- 如果从其他目录执行，必须先 `cd ~/.pi/agent/skills/deepwiki/`

---

[English Documentation](./README.md)
