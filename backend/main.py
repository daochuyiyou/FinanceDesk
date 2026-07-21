import os, sys, threading, time, webbrowser
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.non_ascii_response import NonAsciiJSONResponse
from app.routers import project, supplier, order, dashboard, budget, vendor, flow
from app.routers.flow import global_flow_router
from app.routers.collection_payment import collection_router, payment_router, global_coll_router, global_pay_router
from app.routers.supplier_year_price import router as supplier_year_price_router
from app.routers.supplier_overview import router as supplier_overview_router
from app.routers.supplier_contract import router as supplier_contract_router
from app.routers.supplier_unit_price import router as supplier_unit_price_router
from app.routers.data_import import router as import_router
from app.routers.export import router as export_router
from app.routers.batch import router as batch_router
from app.routers.erp import router as erp_router
from app.routers.dict import router as dict_router, categories_router
from app.routers.audit_log import router as audit_log_router
from app.routers.search import router as search_router
from app.routers.dev_tools import router as dev_tools_router

if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(sys.executable)
    STATIC_DIR = os.path.join(BASE_DIR, "frontend_dist")
    DB_DIR = os.path.join(BASE_DIR, "FinanceDesk_Data")
elif hasattr(sys, "_MEIPASS"):
    BASE_DIR = sys._MEIPASS
    STATIC_DIR = os.path.join(BASE_DIR, "frontend_dist")
    DB_DIR = os.path.join(BASE_DIR, "FinanceDesk_Data")
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

PORT = int(os.environ.get("PORT", "8000"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        if os.environ.get("DISPLAY") or os.name == "nt":
            threading.Thread(target=lambda: (time.sleep(1.5), webbrowser.open(f"http://127.0.0.1:{PORT}")), daemon=True).start()
    except:
        pass
    yield


app = FastAPI(
    title="Hermes FinanceDesk SE",
    version="1.0.0",
    lifespan=lifespan,
    default_response_class=NonAsciiJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(project.router, prefix="/api/v1")
app.include_router(supplier.router, prefix="/api/v1")
app.include_router(supplier_year_price_router, prefix="/api/v1")
app.include_router(supplier_overview_router, prefix="/api/v1")
app.include_router(vendor.router, prefix="/api/v1")
app.include_router(order.router, prefix="/api/v1")
app.include_router(budget.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(collection_router, prefix="/api/v1")
app.include_router(payment_router, prefix="/api/v1")
app.include_router(global_coll_router, prefix="/api/v1")
app.include_router(global_pay_router, prefix="/api/v1")
app.include_router(flow.router, prefix="/api/v1")
app.include_router(global_flow_router, prefix="/api/v1")
app.include_router(supplier_contract_router, prefix="/api/v1")
app.include_router(supplier_unit_price_router, prefix="/api/v1")
app.include_router(import_router)
app.include_router(export_router)
app.include_router(batch_router)
app.include_router(erp_router, prefix="/api/v1")
app.include_router(dict_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(audit_log_router)
app.include_router(search_router)
app.include_router(dev_tools_router, prefix="/api/v1")

# 使用自定义 StaticFiles 子类，强制 no-cache
class NoCacheStaticFiles(StaticFiles):
    """静态文件服务，强制禁止浏览器缓存 HTML 和 JS。"""
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

if os.path.isdir(STATIC_DIR):
    app.mount("/", NoCacheStaticFiles(directory=STATIC_DIR, html=True), name="static")
    print(f"[start] static: {STATIC_DIR} (no-cache)")
else:
    print(f"[start] no static dir: {STATIC_DIR}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
