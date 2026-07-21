#!/usr/bin/env bash
# =============================================================================
# FinanceDesk 一键备份脚本
# 备份: SQLite 数据库 + 配置文件 + 日志
# 用法: bash scripts/backup.sh [--output /tmp/backups]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-/tmp/financedesk-backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/financedesk-backup-$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "======================================"
echo " FinanceDesk 备份"
echo " 来源: $REPO_DIR"
echo " 备份: $BACKUP_FILE"
echo "======================================"

# ── 1. 数据库 ──
DB_PATH="$REPO_DIR/backend/FinanceDesk_Data/finance.db"
if [ -f "$DB_PATH" ]; then
  echo "[1/3] 备份数据库..."
  # 使用 temp 目录打包
  TMP_DIR=$(mktemp -d)
  mkdir -p "$TMP_DIR/FinanceDesk_Data"
  cp "$DB_PATH" "$TMP_DIR/FinanceDesk_Data/"
else
  echo "[1/3] 跳过数据库备份（文件不存在）"
  TMP_DIR=$(mktemp -d)
fi

# ── 2. 环境配置 ──
echo "[2/3] 备份环境配置..."
if [ -f "$REPO_DIR/.env" ]; then
  cp "$REPO_DIR/.env" "$TMP_DIR/"
fi
if [ -f "$REPO_DIR/backend/.env" ]; then
  cp "$REPO_DIR/backend/.env" "$TMP_DIR/"
fi

# ── 3. systemd 服务配置 ──
SERVICE_FILE="$HOME/.config/systemd/user/financedesk.service"
if [ -f "$SERVICE_FILE" ]; then
  mkdir -p "$TMP_DIR/systemd"
  cp "$SERVICE_FILE" "$TMP_DIR/systemd/"
fi

# ── 4. 打包 ──
echo "[3/3] 打包..."
tar -czf "$BACKUP_FILE" -C "$TMP_DIR" .
rm -rf "$TMP_DIR"

# 输出备份信息
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo ""
echo "✅ 备份完成"
echo "   文件: $BACKUP_FILE"
echo "   大小: $BACKUP_SIZE"
echo ""
echo "恢复命令: bash scripts/restore.sh $BACKUP_FILE"

# 清理 30 天前的旧备份
find "$BACKUP_DIR" -name "financedesk-backup-*.tar.gz" -mtime +30 -delete 2>/dev/null || true
