#!/usr/bin/env bash
# =============================================================================
# FinanceDesk 一键恢复脚本
# 用法: bash scripts/restore.sh <备份文件路径>
# 示例: bash scripts/restore.sh /tmp/financedesk-backups/financedesk-backup-20260721_120000.tar.gz
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

if [ $# -lt 1 ]; then
  echo "用法: $0 <备份文件路径>"
  echo "示例: $0 /tmp/financedesk-backups/financedesk-backup-20260721_120000.tar.gz"
  echo ""
  echo "可用备份:"
  ls -lt /tmp/financedesk-backups/financedesk-backup-*.tar.gz 2>/dev/null || echo "  (无备份文件)"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 备份文件不存在: $BACKUP_FILE"
  exit 1
fi

echo "======================================"
echo " FinanceDesk 恢复"
echo " 来源: $BACKUP_FILE"
echo " 目标: $REPO_DIR"
echo "======================================"

# ── 确认 ──
echo -n "恢复将覆盖现有数据。确定继续？(y/N) "
read -r CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "已取消。"
  exit 0
fi

# ── 解压到临时目录 ──
TMP_DIR=$(mktemp -d)
echo "[1/3] 解压备份..."
tar -xzf "$BACKUP_FILE" -C "$TMP_DIR"

# ── 恢复数据库 ──
echo "[2/3] 恢复数据库..."
mkdir -p "$REPO_DIR/backend/FinanceDesk_Data"
if [ -f "$TMP_DIR/FinanceDesk_Data/finance.db" ]; then
  # 备份当前数据库以防万一
  if [ -f "$REPO_DIR/backend/FinanceDesk_Data/finance.db" ]; then
    cp "$REPO_DIR/backend/FinanceDesk_Data/finance.db" \
      "$REPO_DIR/backend/FinanceDesk_Data/finance.db.pre-restore"
    echo "  当前数据库已备份为 finance.db.pre-restore"
  fi
  cp "$TMP_DIR/FinanceDesk_Data/finance.db" "$REPO_DIR/backend/FinanceDesk_Data/"
  echo "  数据库已恢复"
else
  echo "  [warn] 备份中无数据库文件"
fi

# ── 恢复配置 ──
echo "[3/3] 恢复配置..."
if [ -f "$TMP_DIR/.env" ]; then
  cp "$TMP_DIR/.env" "$REPO_DIR/"
  echo "  .env 已恢复"
fi
if [ -f "$TMP_DIR/systemd/financedesk.service" ]; then
  mkdir -p "$HOME/.config/systemd/user/"
  cp "$TMP_DIR/systemd/financedesk.service" "$HOME/.config/systemd/user/"
  systemctl --user daemon-reload
  echo "  systemd 配置已恢复"
fi

# ── 清理 ──
rm -rf "$TMP_DIR"

echo ""
echo "✅ 恢复完成"
echo "   重启服务: systemctl --user restart financedesk"
echo "   或: bash scripts/upgrade.sh"
echo ""
echo "   如需撤销:"
echo "   mv $REPO_DIR/backend/FinanceDesk_Data/finance.db.pre-restore \\"
echo "      $REPO_DIR/backend/FinanceDesk_Data/finance.db"
echo "   systemctl --user restart financedesk"
