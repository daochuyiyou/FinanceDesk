"""种子数据：为 SysDictionary 填入系统默认字典项。
执行后，所有硬编码的下拉选项变为字典驱动。"""

import os, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import DB_PATH
from app.models import SysDictionary

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)
db = Session()

SEEDS = {
    "cost_type": [
        ("施工费", "施工费", 1),
        ("材料费", "材料费", 2),
        ("管理费", "管理费", 3),
        ("人工费", "人工费", 4),
        ("劳务费", "劳务费", 5),
        ("设备费", "设备费", 6),
        ("运输费", "运输费", 7),
        ("其他", "其他", 99),
    ],
    "project_type": [
        ("工程施工", "工程施工", 1),
        ("技术服务", "技术服务", 2),
        ("维护服务", "维护服务", 3),
        ("设备采购", "设备采购", 4),
        ("其他", "其他", 99),
    ],
    "internal_or_external": [
        ("集团内", "集团内", 1),
        ("集团外", "集团外", 2),
    ],
    "order_status": [
        ("待执行", "待执行", 1),
        ("执行中", "执行中", 2),
        ("已完成", "已完成", 3),
        ("已作废", "已作废", 99),
    ],
    "order_type": [
        ("工程施工", "工程施工", 1),
        ("维护服务", "维护服务", 2),
        ("设备采购", "设备采购", 3),
        ("框架合同", "框架合同", 4),
        ("其他", "其他", 99),
    ],
    "income_status": [
        ("待回款", "待回款", 1),
        ("部分回款", "部分回款", 2),
        ("已回款", "已回款", 3),
        ("已作废", "已作废", 99),
    ],
    "cost_status": [
        ("待支付", "待支付", 1),
        ("部分支付", "部分支付", 2),
        ("已支付", "已支付", 3),
        ("已作废", "已作废", 99),
    ],
    "contract_status": [
        ("待执行", "待执行", 1),
        ("执行中", "执行中", 2),
        ("已完成", "已完成", 3),
        ("已续签", "已续签", 4),
        ("已终止", "已终止", 99),
    ],
    "payment_method": [
        ("银行转账", "银行转账", 1),
        ("支票", "支票", 2),
        ("现金", "现金", 3),
        ("承兑汇票", "承兑汇票", 4),
        ("其他", "其他", 99),
    ],
    "supplier_level": [
        ("A级", "A级 - 战略供应商", 1),
        ("B级", "B级 - 优秀供应商", 2),
        ("C级", "C级 - 合格供应商", 3),
        ("D级", "D级 - 试用供应商", 4),
    ],
}

count = 0
for category, items in SEEDS.items():
    for value, label, sort_order in items:
        exists = db.query(SysDictionary).filter(
            SysDictionary.category == category,
            SysDictionary.value == value,
            SysDictionary.is_deleted == False,
        ).first()
        if not exists:
            db.add(SysDictionary(category=category, value=value, label=label, sort_order=sort_order))
            count += 1

db.commit()
db.close()
print(f"✅ 种子数据完成: {count} 条新增, {len(SEEDS)} 个分类")
