# DeepWiki

A powerful CLI tool for retrieving GitHub repository documentation and knowledge via DeepWiki MCP SSE protocol.

## Features

- 🔍 **Explore Repository Structure**: View all available documentation topics
- 📖 **Read Documentation Content**: Access detailed wiki contents
- 💬 **Ask Questions**: Query repository knowledge using natural language

## Installation

```bash
npm install @skills/deepwiki
```

Or using pnpm:

```bash
pnpm add @skills/deepwiki
```

## Usage

### 1. Get repository documentation structure

```bash
node dw.js read_wiki_structure --repoName "owner/repo"
```

### 2. View specific documentation content

```bash
node dw.js read_wiki_contents --repoName "owner/repo" --topic "topic_name"
```

### 3. Ask questions about the repository

```bash
node dw.js ask_question --repoName "owner/repo" --question "Your question here"
```

## Prerequisites

- Node.js 14 or higher
- DeepWiki MCP server access
- Valid GitHub repository path

## Example

```bash
# Explore a repository
node dw.js read_wiki_structure --repoName "openai/openai-node"

# Read specific documentation
node dw.js read_wiki_contents --repoName "openai/openai-node" --topic "quickstart"

# Ask a question
node dw.js ask_question --repoName "openai/openai-node" --question "How do I authenticate?"
```

## Dependencies

- `axios` - HTTP client
- `eventsource` - SSE protocol support

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Repository

https://github.com/Dwsy/deepwiki-skills

---

[中文文档](./README.zh-CN.md)