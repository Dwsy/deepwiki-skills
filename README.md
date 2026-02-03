# DeepWiki CLI

GitHub 仓库文档查询工具。

## 安装

```bash
npm install -g deepwiki-cli
```

## 使用

```bash
# 查看文档结构
dw rws -r "owner/repo"

# 读取文档内容
dw rwc -r "owner/repo" -t "topic"

# 提问
dw aq -r "owner/repo" -q "question"
```

## 示例

```bash
# 查询 React Router 实现
dw aq -r "facebook/react" -q "如何实现路由？"

# 查询 FastAPI 文档
dw rwc -r "tiangolo/fastapi" -t "dependency injection"

# 列出所有模块
dw rws -r "badlogic/pi-mono"
```