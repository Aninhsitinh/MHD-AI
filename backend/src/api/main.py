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
from fastapi.middleware.gzip import GZipMiddleware
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

# Nén Gzip tự động cho các response JSON lớn (giảm 75% kích thước truyền tải mảng 35k điểm)
app.add_middleware(GZipMiddleware, minimum_size=500)

# CORS Middleware cho Web Browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
from collections import defaultdict
from fastapi.responses import JSONResponse

# Rate Limiter trong bộ nhớ RAM theo Sliding Window (Không cần phụ thuộc thư viện ngoài)
_REQUEST_HISTORY = defaultdict(list)
RATE_LIMIT_GLOBAL = 150  # tối đa 150 request / phút / IP
RATE_LIMIT_PREDICT = 45  # tối đa 45 lần gọi định giá AI / phút / IP

@app.middleware("http")
async def rate_limiting_middleware(request, call_next):
    client_ip = request.client.host if request.client else "127.0.0.1"
    # Kiểm tra proxy header nếu chạy qua Nginx / Cloudflare
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    path = request.url.path
    now = time.time()
    window = 60.0  # khung thời gian 1 phút

    # Bỏ qua giới hạn cho static files và healthcheck
    if path.startswith("/assets") or path == "/health" or path == "/logomhd.png":
        return await call_next(request)

    key_global = f"global_{client_ip}"
    key_predict = f"predict_{client_ip}" if "/predict" in path else None

    # Dọn dẹp các mốc thời gian cũ hơn 60s
    _REQUEST_HISTORY[key_global] = [t for t in _REQUEST_HISTORY[key_global] if now - t < window]
    if len(_REQUEST_HISTORY[key_global]) >= RATE_LIMIT_GLOBAL:
        return JSONResponse(
            status_code=429,
            content={
                "status": "error",
                "message": "Quá nhiều yêu cầu từ địa chỉ IP của bạn. Vui lòng chờ 1 phút trước khi thử lại.",
                "retry_after_seconds": int(window - (now - _REQUEST_HISTORY[key_global][0]))
            },
            headers={"Retry-After": "60"}
        )

    if key_predict:
        _REQUEST_HISTORY[key_predict] = [t for t in _REQUEST_HISTORY[key_predict] if now - t < window]
        if len(_REQUEST_HISTORY[key_predict]) >= RATE_LIMIT_PREDICT:
            return JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "message": "Bạn đã vượt quá giới hạn định giá 45 lượt/phút. Vui lòng thử lại sau.",
                    "retry_after_seconds": int(window - (now - _REQUEST_HISTORY[key_predict][0]))
                },
                headers={"Retry-After": "60"}
            )
        _REQUEST_HISTORY[key_predict].append(now)

    _REQUEST_HISTORY[key_global].append(now)
    return await call_next(request)

# Middleware đo thời gian xử lý & chèn Server-Timing (X-Process-Time-Ms)
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000.0
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response

# Middleware bảo mật HTTP Headers (Security Hardening)
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Global Exception Handler: Ẩn stack trace chi tiết để chống lộ cấu trúc mã nguồn (Information Disclosure)
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import logging
    logging.error(f"[MHD Uncaught Error] {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Hệ thống gặp lỗi máy chủ nội bộ khi xử lý yêu cầu. Vui lòng liên hệ quản trị viên.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
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
