# Release Deployment Guide — FinanceDesk v1.0.0-beta.1 (RC-001)

> **版本：** v1.0.0-beta.1
> **标签：** `RC-001`
> **提交：** `7437284`
> **日期：** 2026-07-21

---

## 1. 环境要求

| 组件 | 版本要求 | 说明 |
|------|---------|------|
| Ubuntu | 22.04 LTS / 24.04 LTS | 推荐 22.04 |
| Python | 3.11+ | 推荐 3.11 |
| Node.js | 18.x+ | 前端构建需要 |
| npm | 9.x+ | 随 Node.js 安装 |
| SQLite | 3.x | 内置数据库 |
| Nginx | 1.24+ | 仅生产部署需要 |

---

## 2. 部署步骤

### 2.1 安装系统依赖

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm nginx git
```

### 2.2 获取代码

```bash
git clone <repository-url> /opt/financedesk
cd /opt/financedesk
git checkout v1.0.0-beta.1
```

### 2.3 后端部署

```bash
# 创建虚拟环境
cd /opt/financedesk/backend
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install --upgrade pip
pip install -r requirements.txt

# 初始化数据库（如使用现有数据库，跳过此步）
# SQLite 数据库首次启动时自动创建
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"

# 运行数据库迁移
alembic upgrade head

# 测试后端启动
python main.py
# 确认 http://localhost:8000/docs 返回 Swagger UI
```

### 2.4 前端构建

```bash
cd /opt/financedesk/frontend
npm install
npm run build

# 构建产物在 frontend/dist/
# 在 vite.config.ts 中配置 API 代理后端地址
```

### 2.5 生产静态文件部署

```bash
# 将前端构建产物拷贝到后端静态目录
cp -r /opt/financedesk/frontend/dist/* /opt/financedesk/backend/static/
```

---

## 3. Systemd 服务配置

### 3.1 用户级 systemd（推荐）

```bash
mkdir -p ~/.config/systemd/user/
```

创建 `~/.config/systemd/user/financedesk.service`：

```ini
[Unit]
Description=FinanceDesk Backend Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/financedesk/backend
ExecStart=/opt/financedesk/backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1
Environment=PYTHONDONTWRITEBYTECODE=1

[Install]
WantedBy=default.target
```

启用服务：

```bash
systemctl --user enable financedesk
systemctl --user start financedesk
systemctl --user status financedesk
```

### 3.2 系统级 systemd（需要 root）

```bash
sudo tee /etc/systemd/system/financedesk.service << 'EOF'
[Unit]
Description=FinanceDesk Backend Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=financedesk
Group=financedesk
WorkingDirectory=/opt/financedesk/backend
ExecStart=/opt/financedesk/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable financedesk
sudo systemctl start financedesk
```

> **重要：** 确保系统服务运行用户与代码所有者一致，避免 `__pycache__` 权限问题。

---

## 4. Nginx 配置（反向代理）

创建 `/etc/nginx/sites-available/financedesk`：

```nginx
server {
    listen 80;
    server_name financedesk.example.com;

    # 前端静态文件
    location / {
        root /opt/financedesk/backend/static;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger 文档
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
    }

    # 静态资源缓存
    location /assets/ {
        root /opt/financedesk/backend/static;
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/financedesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. 环境变量配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | `sqlite:///./FinanceDesk_Data/finance.db` |
| `HOST` | 监听地址 | `0.0.0.0` |
| `PORT` | 监听端口 | `8000` |
| `PYTHONUNBUFFERED` | Python 日志缓冲 | `1` |
| `PYTHONDONTWRITEBYTECODE` | 禁止写入 .pyc | 建议设置 |

---

## 6. 数据库迁移

```bash
cd /opt/financedesk/backend
source venv/bin/activate

# 查看迁移状态
alembic current

# 运行所有待执行迁移
alembic upgrade head

# 回滚最新一次迁移
alembic downgrade -1
```

### 初始化种子数据

```bash
# 运行字典数据初始化
python scripts/seed_dictionary.py
```

---

## 7. 首次启动检查项

```bash
# 1. 检查后端是否运行
curl -s http://localhost:8000/api/v1/projects?page=1 | python3 -m json.tool | head -5
# 预期：返回项目列表（或空数组）

# 2. 检查 Swagger UI
curl -s http://localhost:8000/docs | head -1
# 预期：返回 HTML（Swagger UI 页面）

# 3. 检查前端静态文件
curl -s http://localhost:8000/ | head -1
# 预期：返回 HTML（index.html）

# 4. 检查关键 API
curl -s http://localhost:8000/api/v1/dashboard/summary | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK:', list(d.keys())[:5])"

# 5. 检查审计日志
curl -s http://localhost:8000/api/v1/audit-logs?page=1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('Audit logs:', d.get('total', 0))"

# 6. 检查字典数据
curl -s http://localhost:8000/api/v1/dict-categories | python3 -c "import sys,json; d=json.load(sys.stdin); print('Dict categories:', len(d))"
```

### 浏览器验收清单

| # | 检查项 | 操作 |
|:-:|--------|------|
| 1 | 经营看板 | 打开首页，确认 KPI 卡片加载，维度切换正常 |
| 2 | 菜单导航 | 点击全部 11 个菜单项，确认跳转正常 |
| 3 | 子菜单展开 | 点击数据中心/成本合同库/基础资料，确认子菜单展开 |
| 4 | 合同详情 Drawer | 点击合同名称，确认详情面板弹出 |
| 5 | 成本流水创建 | 新增成本流水，确认供应商必选 |
| 6 | 付款创建 | 选择成本流水后确认供应商自动显示(只读) |
| 7 | Console | F12 开发者工具 Console 面板 0 Error / 0 Warning |
| 8 | Network | Network 面板全部 API 请求 200 OK |

---

## 8. Pilot 验收流程

### 8.1 预备条件

- [ ] 后端服务运行正常（systemctl status）
- [ ] Nginx 代理配置正确（nginx -t）
- [ ] 数据库已迁移（alembic upgrade head）
- [ ] 浏览器可正常访问

### 8.2 验收步骤

```
1. 经营看板
   → 确认 KPI 数据加载
   → 切换维度（公司/合同/项目/订单）
   → 切换经营期间
   → Console 0 Error / 0 Warning

2. 项目合同（甲方合同）
   → 查看合同列表
   → 点击合同名称 → 验证 Drawer 弹出
   → 验证 KPI 统计数字
   → 测试搜索、分页

3. 订单管理
   → 查看订单列表
   → 点击编辑 → 验证 Modal 弹出
   → 点击详情 → 验证 Drawer 弹出

4. 成本执行
   → 新增成本流水 → 验证供应商为必选
   → 编辑成本流水 → 验证供应商可修改
   → 删除成本流水 → 验证确认弹窗

5. 付款管理
   → 选择成本流水 → 验证供应商名称自动显示（只读）
   → 新增付款（不输入支付对象）→ 验证 payee 自动填充

6. 数据中心
   → ERP数据导入 → 验证 7 步工作台
   → 快速导入 → 验证 7 实体选项卡
   → ERP对账 → 验证 Excel 解析 + 对账表格

7. 成本合同库
   → 合同主体 → 查看供应商列表
   → 成本合同 → 查看供应商合同
   → 单价管理 → 查看供应商单价

8. 基础资料
   → 数据字典 → 查看 11 字典分类
   → 操作日志 → 查看审计日志

9. 业务闭环验证
   → 创建成本流水(选供应商) → 创建付款(不输 payee)
   → 验证付款表中的供应商与成本流水一致
```

### 8.3 滚回方案

如 Pilot 发现问题需要滚回：

```bash
# 停止服务
systemctl --user stop financedesk

# 恢复上一个稳定版本
cd /opt/financedesk
git checkout <previous-stable-tag>

# 重新部署静态文件
cd frontend && npm install && npm run build
cp -r dist/* ../backend/static/

# 重启服务
systemctl --user start financedesk
```

---

## 9. 常见问题

### __pycache__ 权限问题

```bash
# 如果 __pycache__ 被 root 占用
sudo rm -rf /opt/financedesk/backend/app/*/__pycache__
# 重启服务
systemctl --user restart financedesk
```

**预防措施：** 确保 systemd 服务运行用户与代码所有者一致。不要使用 `sudo python main.py`。

### 端口冲突

```bash
# 检查占用
lsof -i :8000

# 更换端口（修改 systemd service 文件中的 --port 参数）
```

### 数据库连接失败

```bash
# 检查数据库文件
ls -la /opt/financedesk/backend/FinanceDesk_Data/finance.db

# 检查文件权限
sudo chown -R $(whoami):$(whoami) /opt/financedesk/backend/FinanceDesk_Data
```

---

## 10. 架构参考

| 组件 | 技术 | 文档 |
|------|------|------|
| 后端 | FastAPI + SQLAlchemy + SQLite | `Knowledge/07_System_Architecture.md` |
| 前端 | React 18 + Ant Design 5 + Vite | `frontend/README.md` |
| 数据库迁移 | Alembic | `backend/alembic/` |
| ETL 集成 | ERP Excel 导入 → 对账引擎 | `Knowledge/06_ERP_Integration.md` |
| 业务规则 | Business Constitution + R021/R022 | `Knowledge/Business_Constitution.md` |
