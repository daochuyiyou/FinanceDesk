# AHF-02 Service Interface — 服务层接口规范

> **AHF-02 P2 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **定义 Service 层统一接口规范、调用流程、异常处理。**

---

## 一、Service 统一接口模式

```python
class XxxService:
    """Service 类 — 无状态，不持有数据库会话以外的资源。"""

    def __init__(self, db: Session):
        self.db = db

    def execute(self, param: XxxParam) -> XxxResult:
        """执行业务编排，返回结果。"""
        # 1. 参数校验
        # 2. 调用 Engine
        # 3. 调用 Repository（可选）
        # 4. 聚合结果
        # 5. 返回
        ...
```

---

## 二、Service 调用流程

```
Router
  │
  ├── 解析请求参数 → Pydantic Schema
  │
  ├── [可选] Service.execute(param)
  │       │
  │       ├── 1. 参数校验 / 预处理
  │       ├── 2. 调用 Engine.execute()
  │       │       └── Engine 内部: 调 Repository → ORM
  │       ├── 3. [可选] 调 Repository 读补充数据
  │       └── 4. 聚合 → 返回 Router
  │
  └── Router 返回 Response
```

---

## 三、Service 方法命名规范

| 模式 | 示例 | 说明 |
|:-----|:-----|:------|
| `execute_*` | `execute_import`, `execute_match` | 调用 Engine 执行 |
| `get_*` | `get_order_summary`, `get_dashboard_data` | 只读查询 |
| `create_*` | `create_order_with_items` | 创建+编排 |
| `update_*` | `update_order_status` | 更新 |
| `validate_*` | `validate_import_data` | 校验 |

---

## 四、Router → Service → Engine 调用示例

```python
# Router (routers/order.py)
@router.post("/orders/batch-import")
def batch_import_orders(file: UploadFile, db: Session = Depends(get_db)):
    service = OrderImportService(db)
    result = service.execute_import(file)
    return result


# Service (services/order_import_service.py)
class OrderImportService:
    def __init__(self, db):
        self.db = db
        self.engine = OrderImportEngine(db)  # Engine 实例

    def execute_import(self, file: UploadFile) -> dict:
        # 1. 解析 Excel
        parser = ExcelParserService()
        rows = parser.parse(file)

        # 2. 调用 Engine 导入
        result = self.engine.import_rows(rows)

        # 3. 读取统计（通过 Repository）
        stats = ImportStatsRepository(self.db).get_latest()

        # 4. 聚合返回
        return {"import_result": result, "stats": stats}


# Engine (engines/order_import_engine.py)
class OrderImportEngine:
    def __init__(self, db):
        self.db = db
        self.repo = OrderRepository(db)

    def import_rows(self, rows: list) -> dict:
        # 核心业务逻辑
        for row in rows:
            self.repo.create(row)
        return {"created": len(rows)}
```

---

## 五、Service 分层代码模板

### 工具 Service（纯函数，无状态）

```python
# services/excel_parser_service.py
def parse_erp_excel(file_bytes: bytes, filename: str) -> dict:
    """纯函数工具 Service — 无状态，可独立测试。"""
    ...
    return {"rows": [...], "errors": [...]}
```

### Engine 辅助 Service（调用 Engine）

```python
# services/import_orchestrator_service.py
class ImportOrchestratorService:
    """跨 Engine 编排。"""

    def __init__(self, db):
        self.db = db

    def full_import_flow(self, batch_no: str) -> dict:
        """完整导入流程：匹配 → 执行 → 汇总。"""
        match_engine = MatchEngine(self.db)
        import_engine = ImportEngine(self.db)
        summary_engine = SummaryEngine(self.db)

        match_result = match_engine.execute(batch_no)
        import_result = import_engine.execute(batch_no)
        summary_result = summary_engine.refresh(batch_no)

        return {
            "matched": match_result,
            "imported": import_result,
            "summary": summary_result,
        }
```

---

## 六、异常处理规范

| 异常类型 | 处理方式 | 示例 |
|:---------|:---------|:-----|
| 参数错误 | 抛 `ValueError` | `raise ValueError("缺少必填参数")` |
| 业务校验失败 | 抛自定义异常 | `raise ImportValidationError("文件格式错误")` |
| Engine 异常 | 透传 | 不捕获，由 Router 统一处理 |
| Repository 异常 | 转换为业务异常 | `raise DataNotFoundError("订单不存在")` |

---

## 七、Service 验证清单

| 检查项 | 方法 |
|:-------|:-----|
| 无 ORM import | `grep "from app.models" services/*.py` 应为 0（工具 Service 除外） |
| 无事务控制 | Service 代码中无 `db.commit()` / `db.rollback()` |
| 无业务规则 Engine 应有 | 核心业务规则不在 Service 中 |
| 调用方向正确 | Service→Engine→Repository（不反向） |
| 方法签名清晰 | 输入为基本类型/Schema，输出为 dict/Schema |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
