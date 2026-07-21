#!/usr/bin/env bash
# =============================================================================
# FinanceDesk 一键升级脚本
# 用法: sudo bash scripts/upgrade.sh [--port 8000] [--tag v1.0.0-rc2]
# 默认操作: git pull → pip install → npm build → alembic → restart
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
PORT="${PORT:-8000}"
TAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --tag) TAG="$2"; shift 2 ;;
    *) echo "用法: $0 [--port PORT] [--tag vX.Y.Z]"; exit 1 ;;
  esac
done

cd "$REPO_DIR"
echo "======================================"
echo " FinanceDesk 升级"
echo " 目录: $REPO_DIR"
echo " 端口: $PORT"
echo "======================================"

# ── 1. 获取最新代码 ──
echo "[1/6] 拉取代码..."
git fetch --tags
if [ -n "$TAG" ]; then
  git checkout "$TAG"
else
  git pull
fi

# ── 2. 更新后端依赖 ──
echo "[2/6] 更新后端依赖..."
cd backend
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
  pip install --quiet --upgrade pip
  pip install --quiet -r requirements.txt
else
  echo "  [warn] 虚拟环境不存在，创建..."
  python3 -m venv venv
  source venv/bin/activate
  pip install --quiet --upgrade pip
  pip install --quiet -r requirements.txt
fi
cd ..

# ── 3. 前端重新构建 ──
echo "[3/6] 构建前端..."
cd frontend
npm install --silent
npx vite build --logLevel warn
cd ..

# ── 4. 数据库迁移 ──
echo "[4/6] 数据库迁移..."
cd backend
source venv/bin/activate
alembic upgrade head 2>/dev/null || echo "  [warn] alembic 迁移跳过（可能无变更）"
cd ..

# ── 5. 重启服务 ──
echo "[5/6] 重启服务..."
systemctl --user restart financedesk 2>/dev/null || {
  echo "  [warn] 用户级 systemd 重启失败，尝试直接 kill + 启动..."
  pkill -f "uvicorn main:app" 2>/dev/null || true
  sleep 2
  cd backend
  nohup venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port "$PORT" > /dev/null 2>&1 &
  cd ..
}

# ── 6. Smoke Test ──
echo "[6/6] Smoke Test..."
sleep 3
bash "$SCRIPT_DIR/smoke-test.sh" --port "$PORT" || {
  echo ""
  echo " ⚠️  Smoke Test 未全部通过，请手动检查"
  exit 1
}

echo ""
echo "✅ FinanceDesk 升级完成"
echo "   地址: http://localhost:$PORT"
