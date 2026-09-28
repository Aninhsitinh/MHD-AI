"""
==============================================================================
MHD REAL ESTATE TECH • HỆ THỐNG THẨM ĐỊNH GIÁ BẤT ĐỘNG SẢN AI (MHD AVM)
FASTAPI BACKEND SERVICE (LOW LATENCY < 100MS)
==============================================================================
"""

import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Cấu hình UTF-8 cho Windows console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from config.settings import settings
from src.api.routes.predict import router as predict_router
from src.api.routes.history import router as history_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Hệ thống thẩm định giá BĐS tự động MHD AVM kết hợp CatBoost & PostGIS OpenStreetMap"
)

# CORS Middleware cho Web Browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các Router
app.include_router(predict_router)
app.include_router(history_router)

# Phục vụ thư mục Frontend tĩnh (React Dist & Frontend Fallback)
base_dir = Path(__file__).resolve().parent.parent.parent
frontend_dir = base_dir / "frontend"
frontend_dist = frontend_dir / "dist"

if (frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

@app.get("/")
async def root():
    dist_index = frontend_dist / "index.html"
    if dist_index.exists():
        return FileResponse(dist_index)
    src_index = frontend_dir / "index.html"
    if src_index.exists():
        return FileResponse(src_index)
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/logomhd.png")
async def get_logo():
    logo_file = frontend_dist / "logomhd.png"
    if not logo_file.exists():
        logo_file = frontend_dir / "public" / "logomhd.png"
    if not logo_file.exists():
        logo_file = base_dir / "logomhd.png"
    if logo_file.exists():
        return FileResponse(logo_file)
    return FileResponse(base_dir / "logomhd.png")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "postgis_host": settings.POSTGRES_HOST,
        "postgis_port": settings.POSTGRES_PORT,
        "model_path": str(settings.MODEL_PATH)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)
