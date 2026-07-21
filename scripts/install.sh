#!/usr/bin/env bash
# =============================================================================
# FinanceDesk v1.0.0-rc1 — 一键安装脚本
# 用法: sudo bash scripts/install.sh [--port 8000] [--target /opt/financedesk]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="${TARGET_DIR:-/opt/financedesk}"
PORT="${PORT:-8000}"
SKIP_CLONE=false

# ── 参数解析 ──
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --target) TARGET_DIR="$2"; shift 2 ;;
    --skip-clone) SKIP_CLONE=true; shift ;;
    *) echo "用法: $0 [--port PORT] [--target DIR] [--skip-clone]"; exit 1 ;;
  esac
done

echo "========================================"
echo " FinanceDesk v1.0.0-rc1 安装"
echo " 目标目录: $TARGET_DIR"
echo " 服务端口: $PORT"
echo "========================================"

# ── 1. 系统依赖 ──
echo "[1/8] 安装系统依赖..."
apt update -qq
apt install -y -qq python3 python3-venv python3-pip nodejs npm nginx git curl

# ── 2. 获取代码 ──
echo "[2/8] 获取代码..."
if [ "$SKIP_CLONE" = false ] && [ ! -d "$TARGET_DIR/.git" ]; then
  mkdir -p "$TARGET_DIR"
  # 从当前目录复制（适用于本地部署），或用 git clone
  if [ "$REPO_DIR" != "$TARGET_DIR" ]; then
    cp -a "$REPO_DIR/." "$TARGET_DIR/"
  fi
fi
cd "$TARGET_DIR"

# ── 3. 后端虚拟环境 ──
echo "[3/8] 配置 Python 虚拟环境..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
cd ..

# ── 4. 前端构建 ──
echo "[4/8] 构建前端..."
cd frontend
npm install --silent
npx vite build --logLevel warn
cd ..

# ── 5. 数据库初始化 ──
echo "[5/8] 初始化数据库..."
cd backend
source venv/bin/activate
alembic upgrade head 2>/dev/null || echo "  [warn] alembic 迁移跳过"
python scripts/seed_dictionary.py 2>/dev/null || echo "  [warn] 种子数据跳过"
cd ..

# ── 6. 创建 systemd 服务（用户级） ──
echo "[6/8] 创建 systemd 服务..."
mkdir -p ~/.config/systemd/user/
SERVICE_FILE="$HOME/.config/systemd/user/financedesk.service"
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=FinanceDesk Backend Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$TARGET_DIR/backend
ExecStart=$TARGET_DIR/backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port $PORT
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1
Environment=PYTHONDONTWRITEBYTECODE=1
Environment=PORT=$PORT

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable financedesk
systemctl --user start financedesk

# ── 7. 等待服务启动 ──
echo "[7/8] 等待服务就绪..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" --max-time 2 2>/dev/null | grep -q 200; then
    echo "  服务已就绪 (端口 $PORT)"
    break
  fi
  sleep 2
done

# ── 8. Smoke Test ──
echo "[8/8] 运行 Smoke Test..."
bash "$SCRIPT_DIR/smoke-test.sh" --port "$PORT" && {
  echo ""
  echo "========================================"
  echo " ✅ FinanceDesk 安装成功！"
  echo " 地址: http://localhost:$PORT"
  echo "========================================"
} || {
  echo ""
  echo " ⚠️  安装完成但 Smoke Test 未全部通过"
  echo " 请手动检查: http://localhost:$PORT"
  echo " 运行: bash scripts/smoke-test.sh --port $PORT"
  echo "========================================"
}
