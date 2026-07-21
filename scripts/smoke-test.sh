#!/usr/bin/env bash
# =============================================================================
# FinanceDesk Smoke Test — 部署后自动验证
# 用法: bash scripts/smoke-test.sh [--port 8000] [--browser]
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
PORT="${PORT:-8000}"
BROWSER=false
PASS=0
FAIL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --browser) BROWSER=true; shift ;;
    *) echo "用法: $0 [--port PORT] [--browser]"; exit 1 ;;
  esac
done

BASE="http://localhost:$PORT"

echo "======================================"
echo " FinanceDesk Smoke Test"
echo " 服务器: $BASE"
echo "======================================"

# ── 辅助函数 ──
check() {
  local name="$1" url="$2" expected="$3"
  local resp
  resp=$(curl -s -o /dev/null -w '%{http_code}' "$url" --max-time 10 2>/dev/null || echo "000")
  if [ "$resp" = "$expected" ]; then
    echo "  ✅ PASS: $name ($resp)"
    PASS=$((PASS+1))
  else
    echo "  ❌ FAIL: $name (期望 $expected, 实际 $resp)"
    FAIL=$((FAIL+1))
  fi
}

check_json() {
  local name="$1" url="$2" jq_filter="$3"
  local resp
  resp=$(curl -s "$url" --max-time 10 2>/dev/null)
  if echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); assert $jq_filter, 'assertion failed'" 2>/dev/null; then
    echo "  ✅ PASS: $name (数据验证通过)"
    PASS=$((PASS+1))
  else
    echo "  ❌ FAIL: $name (数据验证失败)"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "--- 1. 基础可用性 ---"
check "首页"        "$BASE/"                200
check "Swagger UI"  "$BASE/docs"            200
check "项目列表"    "$BASE/api/v1/projects?page=1"   200
check "订单列表"    "$BASE/api/v1/orders?page=1"     200

echo ""
echo "--- 2. 核心 API ---"
check "Dashboard 摘要" "$BASE/api/v1/dashboard/summary?period=2026-06" 200
check "Dashboard 合同" "$BASE/api/v1/dashboard/contract-summary?period=2026-06" 200
check "Dashboard 订单" "$BASE/api/v1/dashboard/batch-order-summary?period=2026-06" 200
check "Dashboard 现金流" "$BASE/api/v1/dashboard/cashflow-trend?period=2026-06" 200
check "Dashboard 利润" "$BASE/api/v1/dashboard/project-profit?period=2026-06" 200

echo ""
echo "--- 3. 业务数据 API ---"
check "收入流"    "$BASE/api/v1/income-flows?page=1"       200
check "成本流"    "$BASE/api/v1/cost-flows?page=1"         200
check "回款"      "$BASE/api/v1/collections?page=1"        200
check "付款"      "$BASE/api/v1/payments?page=1"           200
check "供应商"    "$BASE/api/v1/suppliers?page=1"          200
check "供应商-合同" "$BASE/api/v1/supplier-contracts?page=1" 200
check "供应商-单价" "$BASE/api/v1/supplier-unit-prices?page=1" 200

echo ""
echo "--- 4. 字典 & 日志 ---"
check "字典分类"  "$BASE/api/v1/dict-categories"     200
check "操作日志"  "$BASE/api/v1/audit-logs?page=1"   200
check "合同状态字典" "$BASE/api/v1/dict/contract_status" 200

echo ""
echo "--- 5. 数据完整性 ---"
check_json "Dashboard 有项目数" \
  "$BASE/api/v1/dashboard/summary?period=2026-06" \
  "'project_count' in d and d['project_count'] >= 0"

check_json "字典有分类" \
  "$BASE/api/v1/dict-categories" \
  "isinstance(d, list) and len(d) > 0"

check_json "审计有日志" \
  "$BASE/api/v1/audit-logs?page=1" \
  "'total' in d and d['total'] >= 0"

echo ""
echo "--- 6. 浏览器验证（手动）---"
echo "  请打开 Chrome DevTools → Console:"
echo "    Console: 0 Error ✅ / 0 Warning ✅"
echo "    Network: 全部 200 ✅"
if [ "$BROWSER" = true ]; then
  echo "  --browser 模式：自动检查暂不支持，请手动完成"
fi

echo ""
echo "======================================"
echo " 结果: $PASS pass, $FAIL fail"
echo "======================================"

if [ "$FAIL" -eq 0 ]; then
  echo " 🎉 全部通过！部署验证完成。"
  exit 0
else
  echo " ⚠️  有 $FAIL 项未通过，请检查服务状态。"
  exit 1
fi
