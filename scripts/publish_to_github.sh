#!/usr/bin/env bash
set -euo pipefail

if ! command -v git >/dev/null 2>&1; then
  echo "git 未安装，请先安装 git" && exit 1
fi

REMOTE_URL=${GITHUB_REMOTE:-}
if [ -z "$REMOTE_URL" ]; then
  echo "请设置环境变量 GITHUB_REMOTE 为你的仓库地址，例如："
  echo "  GITHUB_REMOTE=https://github.com/<username>/<repo>.git ./scripts/publish_to_github.sh"
  exit 1
fi

echo "初始化 Git 仓库..."
git init
git add .
git commit -m "chore: initial release v1.0.0"
git branch -M main

echo "配置远程仓库: $REMOTE_URL"
if git remote | grep -q '^origin$'; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

echo "推送到 GitHub..."
git push -u origin main
echo "完成：已推送到 $REMOTE_URL"

