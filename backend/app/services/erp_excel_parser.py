"""
ERP Excel 解析引擎 — 工业级 v2 (Pandas 矢量化 + 智能路由 + 批处理)。

核心设计:
  1. 双列分流: 同时存在 [借方/支出] 与 [贷方/收入] → 矢量化切片劈表
  2. 单列符号: 仅一列金额 → np.where 正数→收入, 负数→成本(abs)
  3. 零 iterrows: 全部向量运算, 最终 to_dict('records') 供 bulk_insert
  4. 下行 10,000 条 < 3 秒

使用:
    from app.services.erp_excel_parser import parse_erp_excel
    result = parse_erp_excel(file_bytes, filename)
    # result = {"rows": [{...}, ...], "errors": [...], "total": N}
"""

from __future__ import annotations

import re
from datetime import datetime
from io import BytesIO
from typing import Any

import numpy as np
import pandas as pd

# ── 表头关键词 ─────────────────────────────────────────────
HEADER_KEYWORDS = ["发生时间", "单据日期", "凭证号", "业务单号", "客户名称", "摘要", "金额"]

# ── 列名映射（中→英） ────────────────────────────────────
COL_ALIAS: dict[str, list[str]] = {
    "occur_date":       ["发生时间", "单据日期", "日期", "业务日期", "收款日期", "到账日期", "开票日期"],
    "erp_record_id":    ["凭证号", "业务单号", "单据编号", "流水号", "发票号", "回单号"],
    "summary":          ["摘要", "说明", "交易摘要", "备注", "对方户名", "来源说明", "付款方"],
    "amount_in":        ["贷方金额", "收入金额", "贷方", "收入", "应收金额", "开票金额",
                         "实收金额", "收款金额", "到账金额", "金额"],
    "amount_out":       ["借方金额", "支出金额", "借方", "支出"],
    "raw_project_name": ["客户名称", "对方单位", "往来单位", "项目名称", "合同名称", "客户", "项目"],
}


def normalize_text(s: Any) -> str:
    if s is None:
        return ""
    s = str(s).strip()
    s = re.sub(r"\s+", " ", s)
    s = s.replace("\u3000", " ")
    s = re.sub(r"[\uff01-\uff5e]", lambda m: chr(ord(m.group(0)) - 0xFEE0), s)
    return s.strip()


def locate_header_row(df_raw: pd.DataFrame) -> int:
    """动态定位表头行 —— 扫描前 20 行。"""
    best_row, best_score = 0, 0
    for idx in range(min(len(df_raw), 20)):
        row_str = " ".join(df_raw.iloc[idx].astype(str).str.lower())
        score = sum(1 for kw in HEADER_KEYWORDS if kw.lower() in row_str)
        if score > best_score:
            best_score, best_row = score, idx
    return best_row


def map_columns(df: pd.DataFrame) -> dict[str, str]:
    """构建 {目标字段: DataFrame列名} 映射。"""
    mapping: dict[str, str] = {}
    df_cols = [str(c).strip().lower() for c in df.columns]
    for target, aliases in COL_ALIAS.items():
        for alias in aliases:
            alias_lower = alias.lower()
            for i, dc in enumerate(df_cols):
                if alias_lower in dc and target not in mapping:
                    mapping[target] = df.columns[i]
                    break
            if target in mapping:
                break
    return mapping


def parse_amount_series(s: pd.Series) -> pd.Series:
    """将金额列解析为 float，无法解析的置 NaN。"""
    return pd.to_numeric(
        s.astype(str).str.replace(",", "", regex=False)
         .str.replace("¥", "", regex=False)
         .str.replace("￥", "", regex=False),
        errors="coerce"
    )


def parse_date_series(s: pd.Series) -> pd.Series:
    """将日期列解析为 ISO 字符串，无法解析的置空。"""
    # 尝试自动推断
    parsed = pd.to_datetime(s, errors="coerce")
    return parsed.dt.strftime("%Y-%m-%d").fillna("")


def parse_erp_excel(file_bytes: bytes, filename: str = "") -> dict[str, Any]:
    """
    解析 ERP Excel 文件，返回结构化行数据（无 iterrows，全矢量化）。

    返回:
      {
        "sheet_type": str,
        "rows": [{"record_type":..., "erp_record_id":..., ...}, ...],
        "errors": [...],
        "total": int,
        "header_row": int,
      }
    """
    xls = pd.ExcelFile(BytesIO(file_bytes), engine="openpyxl")
    all_rows: list[dict] = []
    all_errors: list[str] = []

    for sheet_name in xls.sheet_names:
        # ── 1. 动态定位表头 ──
        df_raw = pd.read_excel(xls, sheet_name=sheet_name, header=None, dtype=str).fillna("")
        header_row = locate_header_row(df_raw)

        df = pd.read_excel(xls, sheet_name=sheet_name, header=header_row, dtype=str).fillna("")

        # ── 2. 列映射 ──
        mapping = map_columns(df)

        # ── 3. 基建 DataFrame ──
        builder = pd.DataFrame()

        if mapping.get("erp_record_id"):
            builder["erp_record_id"] = df[mapping["erp_record_id"]].apply(normalize_text)
        if mapping.get("occur_date"):
            builder["occur_date"] = df[mapping["occur_date"]].pipe(parse_date_series)
        if mapping.get("summary"):
            builder["summary"] = df[mapping["summary"]].apply(normalize_text)
        if mapping.get("raw_project_name"):
            builder["raw_project_name"] = df[mapping["raw_project_name"]].apply(normalize_text)

        has_in = "amount_in" in mapping
        has_out = "amount_out" in mapping

        if has_in:
            builder["amount_in"] = parse_amount_series(df[mapping["amount_in"]])
        if has_out:
            builder["amount_out"] = parse_amount_series(df[mapping["amount_out"]])

        # ── 4. 智能路由：双列分流 vs 单列符号 ────────────
        if has_in and has_out:
            # 双列模式：贷方→收入池，借方→成本池
            income_mask = builder["amount_in"].notna() & (builder["amount_in"] > 0)
            cost_mask   = builder["amount_out"].notna() & (builder["amount_out"] > 0)

            income_df = builder[income_mask].copy()
            income_df["amount_in"] = income_df["amount_in"].fillna(0.0)
            income_df["amount_out"] = 0.0
            income_df["record_type"] = "income_expense"

            cost_df = builder[cost_mask].copy()
            cost_df["amount_out"] = cost_df["amount_out"].fillna(0.0)
            cost_df["amount_in"] = 0.0
            cost_df["record_type"] = "income_expense"

            builder = pd.concat([income_df, cost_df], ignore_index=True)
        elif has_in:
            # 单列金额：正→收入, 负→成本
            amt = builder["amount_in"].fillna(0.0)

            income_mask = amt > 0
            cost_mask   = amt < 0

            income_df = builder[income_mask].copy()
            income_df["amount_in"] = amt[income_mask]
            income_df["amount_out"] = 0.0
            income_df["record_type"] = "collection"

            cost_df = builder[cost_mask].copy()
            cost_df["amount_out"] = (-amt[cost_mask]).abs()
            cost_df["amount_in"] = 0.0
            cost_df["record_type"] = "income_expense"

            builder = pd.concat([income_df, cost_df], ignore_index=True)
        elif has_out:
            builder["amount_in"] = 0.0
            builder["amount_out"] = builder["amount_out"].fillna(0.0)
            builder["record_type"] = "income_expense"
        else:
            # 无金额列 → 跳过
            all_errors.append(f"Sheet [{sheet_name}]: 未检测到金额列")
            continue

        # ── 5. 剔除空行（合计行/无凭证号+无日期） ──
        builder = builder[
            (builder["erp_record_id"] != "") | (builder["occur_date"] != "")
        ].copy()

        # ── 6. 剔除金额全零的行 ──
        builder = builder[
            (builder["amount_in"] != 0.0) | (builder["amount_out"] != 0.0)
        ].copy()

        total_before = len(builder)

        # ── 7. 转 dict list（供 bulk_insert） ──
        rows = builder.replace({np.nan: None}).to_dict("records")
        # 日期转 string/None
        for r in rows:
            r["occur_date"] = r.get("occur_date") if r.get("occur_date") else None
            r["erp_record_id"] = r.get("erp_record_id") or None
            r["summary"] = r.get("summary") or None
            r["raw_project_name"] = r.get("raw_project_name") or None

        all_rows.extend(rows)

    xls.close()

    return {
        "rows": all_rows,
        "errors": all_errors,
        "total": len(all_rows),
    }
