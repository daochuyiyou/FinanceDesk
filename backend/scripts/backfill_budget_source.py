"""
历史数据溯源重写脚本 —— 遍历现有 BudgetAdjustment 记录，
根据 adjustment_reason 中的关键词自动填充 source_type / source_id / source_description。

执行：source venv/bin/activate && python3 scripts/backfill_budget_source.py
"""

import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import re
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database import DB_PATH
from app.models import BudgetAdjustment, Order, IncomeFlow, CostFlow

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)
db = Session()

# 匹配模式：从 adjustment_reason 中提取订单/流水编号
ORDER_PATTERN = re.compile(r"订单\s*([A-Za-z0-9\-]+)")
INCOME_PATTERN = re.compile(r"收入流水\s*#?(\d+)")
COST_PATTERN = re.compile(r"成本流水\s*#?(\d+)")

updated = 0
skipped = 0

for adj in db.query(BudgetAdjustment).filter(
    BudgetAdjustment.is_deleted == False,
    BudgetAdjustment.source_type.is_(None),
).all():
    reason = adj.adjustment_reason or ""
    source_type = None
    source_id = None
    source_desc = None

    # 尝试从 reason 中匹配来源
    m = ORDER_PATTERN.search(reason)
    if m:
        order_no = m.group(1)
        order = db.query(Order).filter(Order.order_no == order_no).first()
        if order:
            source_type = "order"
            source_id = order.id
            source_desc = f"订单 {order_no}"

    if not source_type:
        m = INCOME_PATTERN.search(reason)
        if m:
            sid = int(m.group(1))
            flow = db.get(IncomeFlow, sid)
            if flow:
                source_type = "income_flow"
                source_id = sid
                source_desc = f"收入流水 #{sid}"

    if not source_type:
        m = COST_PATTERN.search(reason)
        if m:
            sid = int(m.group(1))
            flow = db.get(CostFlow, sid)
            if flow:
                source_type = "cost_flow"
                source_id = sid
                source_desc = f"成本流水 #{sid}"

    # 未匹配到 → 标记为 manual
    if not source_type:
        source_type = "manual"
        skipped += 1
    else:
        updated += 1

    adj.source_type = source_type
    adj.source_id = source_id
    adj.source_description = source_desc

db.commit()
db.close()

print(f"✅ 溯源重写完成: {updated} 条已关联, {skipped} 条保持 manual")
