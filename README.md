# 🏙️ MHD Real Estate Tech • AI Automated Valuation Model (AVM)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_+_Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![CatBoost](https://img.shields.io/badge/ML_Engine-CatBoost_v2.4-FFCC00?style=flat-square&logo=catboost&logoColor=black)](https://catboost.ai/)
[![PostGIS](https://img.shields.io/badge/Spatial-PostGIS_16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgis.net/)
[![Docker](https://img.shields.io/badge/Deploy-Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **Hệ thống thẩm định giá Bất Động Sản tự động (AVM) kết hợp trí tuệ nhân tạo CatBoost Machine Learning, giải thích định giá TreeSHAP (XAI), và thuật toán phân tích không gian PostGIS KNN (bán kính chuẩn hóa ≤ 2.0km).**

---

## 🌟 Tính Năng Nổi Bật (Key Features)

- 🤖 **Mô Hình Định Giá CatBoost AVM (v2.4)**: Huấn luyện trên hơn 35.000 bản ghi dữ liệu BĐS thực tế, độ trễ suy luận siêu thấp (< 80ms), khoảng tin cậy giá 95%.
- 🔍 **Giải Thích Định Giá TreeSHAP (Explainable AI)**: Phân tách minh bạch tỷ lệ tác động (+/-% giá trị) của 10 yếu tố định giá cốt lõi: Vị trí, Mặt tiền, Độ rộng ngõ, Pháp lý sổ đỏ, Lô góc, Nở hậu, v.v.
- 🗺️ **Phân Tích Không Gian PostGIS KNN (Bán Kính Nghiêm Ngặt ≤ 2.0km)**:
  - Tự động quét 5 tài sản đối chứng thực tế lân cận tài sản thẩm định.
  - Áp dụng phương pháp so sánh thị trường (CMA) chuẩn quốc tế.
  - Cơ chế tự động Fallback sang Parquet Vector Spatial Engine khi CSDL offline.
- ⚡ **Redis In-Memory Cache**: Lưu cache các tọa độ và truy vấn phổ biến, giảm tải DB và tăng tốc phản hồi cho hàng ngàn người dùng đồng thời.
- 🎨 **Giao Diện Hiện Đại & Trực Quan**:
  - Bản đồ tương tác Leaflet (chọn vị trí theo ghim, tìm kiếm địa chỉ GPS Nominatim).
  - Biểu đồ mạng nhện (Radar Chart) đánh giá 5 khía cạnh BĐS: Pháp lý, Giá cả, Vị trí, Tiện ích, Tiềm năng.
  - Bảng đối soát chi tiết 5 BĐS đối chứng (CMA Table) với hệ số điều chỉnh tỷ lệ % trực quan.
- 🐳 **Đóng Gói Docker Chuẩn Production**: Một lệnh duy nhất khởi chạy toàn bộ 5 dịch vụ (PostGIS, Redis, Backend, Frontend, pgAdmin).

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

```text
                           ┌──────────────────────────────┐
                           │      Client Web Browser      │
                           │   (React SPA / Mobile Web)   │
                           └──────────────┬───────────────┘
                                          │ HTTP / Port 80
                                          ▼
                           ┌──────────────────────────────┐
                           │      Nginx Reverse Proxy     │
                           │   (Static Assets & Gzip)     │
                           └──────────────┬───────────────┘
                                          │ Proxy /api/v1
                                          ▼
                           ┌──────────────────────────────┐
                           │     FastAPI Microservice     │
                           │    (Uvicorn Workers x4)      │
                           └───────┬──────────────┬───────┘
                                   │              │
                   ┌───────────────┘              └───────────────┐
                   ▼                                              ▼
    ┌──────────────────────────────┐              ┌──────────────────────────────┐
    │     CatBoost Model Engine    │              │     PostGIS 16 Database      │
    │  (mhd_smart_v2.cbm + SHAP)   │              │ (Spatial GIST KNN ≤ 2000m)   │
    └──────────────────────────────┘              └──────────────┬───────────────┘
                                                                 │
                                                                 ▼
                                                  ┌──────────────────────────────┐
                                                  │         Redis 7 Cache        │
                                                  │   (Sub-50ms Response Time)   │
                                                  └──────────────────────────────┘
```

---

## 🚀 Khởi Chạy Nhanh Bằng Docker (Quick Start)

### 1. Yêu cầu tiên quyết
- Cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) (hỗ trợ Docker Compose v2).
- Git installed.

### 2. Tải mã nguồn & cấu hình biến môi trường
```bash
# Clone repository
git clone https://github.com/<YOUR_USERNAME>/MHD-AI-Valuation.git
cd MHD-AI-Valuation

# Thiết lập file môi trường
cp .env.example .env
```

### 3. Khởi chạy toàn bộ hệ sinh thái
```bash
# Build và chạy ngầm toàn bộ dịch vụ
docker compose up --build -d
```

### 4. Truy cập các cổng dịch vụ
| Dịch vụ | URL | Mô tả |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost](http://localhost) | Giao diện định giá & đối chứng BĐS |
| **FastAPI Swagger Docs**| [http://localhost:8000/docs](http://localhost:8000/docs) | Tài liệu API tương tác trực tiếp |
| **Health Check Endpoint**| [http://localhost:8000/health](http://localhost:8000/health) | Kiểm tra trạng thái hệ thống |
| **pgAdmin 4 (Tùy chọn)**| [http://localhost:5050](http://localhost:5050) | Quản trị CSDL PostGIS (User: `admin@mhd.vn`, Pass: `admin_password_2026`) |

Dừng toàn bộ hệ thống:
```bash
docker compose down
```

---

## 💻 Chạy Trong Môi Trường Phát Triển Cục Bộ (Local Dev)

Nếu bạn muốn chạy trực tiếp không qua Docker:

### 1. Khởi chạy Backend (Python 3.11+)
```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo và kích hoạt môi trường ảo
python -m venv .venv
# Trên Windows:
.venv\Scripts\activate
# Trên Linux/macOS:
source .venv/bin/activate

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy server FastAPI
python run.py
# Server chạy tại: http://127.0.0.1:8000
```

### 2. Khởi chạy Frontend (Node.js 18+)
```bash
# Mở một cửa sổ terminal mới
cd frontend

# Cài đặt node modules
npm install

# Khởi chạy Vite dev server
npm run dev
# Web app chạy tại: http://localhost:5173
```

---

## 📡 Danh Sách API Chính (Core REST Endpoints)

| Method | Endpoint | Mô tả |
| :---: | :--- | :--- |
| `POST` | `/api/v1/predict-price` | Định giá BĐS, phân tích TreeSHAP & trả về 5 BĐS đối chứng lân cận (≤ 2km) |
| `GET` | `/api/v1/comparables` | Truy vấn nhanh 5 BĐS tương đồng xung quanh tọa độ WGS84 (bán kính ≤ 2km) |
| `GET` | `/api/v1/geocode` | Chuyển đổi địa chỉ hành chính thành tọa độ kinh độ/vĩ độ |
| `GET` | `/api/v1/reverse-geocode` | Phân tích ngược tọa độ thành Tỉnh, Quận, Phường, Đường |
| `GET` | `/health` | Kiểm tra tình trạng kết nối DB PostGIS và Model CatBoost |

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
MHD AI/
├── backend/                  # Dịch vụ Backend FastAPI độc lập
│   ├── config/               # Cấu hình Pydantic Settings
│   ├── data/                 # Dữ liệu sạch Parquet (Fallback)
│   ├── database/             # Script SQL PostGIS
│   ├── models/               # Model CatBoost (.cbm) & Metadata
│   ├── src/                  # Mã nguồn Router, Services (ML & GIS)
│   ├── Dockerfile            # Dockerfile Backend
│   ├── requirements.txt      # Thư viện Python
│   └── run.py                # File khởi chạy Uvicorn tự động nạp .venv
├── frontend/                 # Ứng dụng Frontend React + Vite
│   ├── public/               # Static assets & favicon
│   ├── src/                  # React Components, Styles, Map & Main logic
│   ├── Dockerfile            # Multi-stage Dockerfile (Node -> Nginx)
│   ├── nginx.conf            # Cấu hình Nginx Reverse Proxy
│   ├── package.json          # Quản lý dependencies NPM
│   └── vite.config.js        # Cấu hình Vite Dev & Build
├── database/                 # Script khởi tạo cơ sở dữ liệu PostGIS
├── deploy/                   # File cấu hình triển khai bổ sung
├── docker-compose.yml        # Docker Compose đầy đủ mọi dịch vụ
├── docker-compose.prod.yml   # Docker Compose môi trường Production
├── .env.example              # Mẫu biến môi trường an toàn
├── .gitignore                # Chặn rò rỉ secret, dataset lớn & venv
└── README.md                 # Tài liệu hướng dẫn sử dụng
```

---

## 🛡️ Bảo Mật & Lưu Ý Khi Public Repo
- **Bảo vệ Secret**: File `.env` chứa mật khẩu thực tế đã được cấu hình trong `.gitignore` để không bao giờ bị đẩy lên GitHub. Luôn sử dụng `.env.example` làm mẫu cấu hình.
- **Tối ưu Bán Kính**: Mọi truy vấn BĐS đối chứng được giới hạn cứng tối đa `2000m` (2km) tính từ tài sản thẩm định theo tiêu chuẩn thẩm định giá so sánh thị trường (CMA).

---

## 📄 Bản Quyền (License)
Dự án được phân phối dưới giấy phép **MIT License**. Bạn hoàn toàn có thể tự do sử dụng, chỉnh sửa và triển khai cho mục đích học tập hoặc thương mại.
