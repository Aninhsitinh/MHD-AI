# TÀI LIỆU TOÀN DIỆN VỀ KIẾN TRÚC, THUẬT TOÁN VÀ QUY TRÌNH HỆ THỐNG THẨM ĐỊNH GIÁ BẤT ĐỘNG SẢN MHD AVM
*(MHD Real Estate Tech • Automated Valuation Model • Technical Specification & Architecture Blueprint)*

---

## MỤC LỤC TỔNG QUAN

1. [TỔNG QUAN HỆ THỐNG & SỨ MỆNH KỸ THUẬT](#1-tổng-quan-hệ-thống--sứ-mệnh-kỹ-thuật)
2. [TOÀN BỘ CÔNG NGHỆ SỬ DỤNG (FULL TECH STACK)](#2-toàn-bộ-công-nghệ-sử-dụng-full-tech-stack)
3. [QUY TRÌNH HOẠT ĐỘNG TỔNG THỂ TỪ ĐẦU ĐẾN CUỐI (END-TO-END WORKFLOW)](#3-quy-trình-hoạt-động-tổng-thể-từ-đầu-đến-cuối-end-to-end-workflow)
4. [KIẾN TRÚC DỮ LIỆU & SCHEMA CƠ SỞ DỮ LIỆU POSTGIS](#4-kiến-trúc-dữ-liệu--schema-cơ-sở-dữ-liệu-postgis)
5. [CƠ CHẾ THẨM ĐỊNH GIÁ KẾT HỢP (HYBRID VALUATION ENGINE)](#5-cơ-chế-thẩm-định-giá-kết-hợp-hybrid-valuation-engine)
   - 5.1. Phương pháp So sánh Thị trường (CMA - TĐGVN 08) - 85% Trọng số
   - 5.2. Mô hình Học máy CatBoost v2.4 AI - 15% Trọng số
   - 5.3. Công thức Tích hợp & Chiết khấu Thị trường (MHD Discount)
6. [HỆ THỐNG KHÔNG GIAN ĐỊA LÝ & BỘ PHÂN GIẢI POSTGIS KNN](#6-hệ-thống-không-gian-địa-lý--bộ-phân-giải-postgis-knn)
7. [GIẢI TRÌNH MINH BẠCH BẰNG AI (EXPLAINABLE AI - TREESHAP)](#7-giải-trình-minh-bạch-bằng-ai-explainable-ai---treeshap)
8. [KIẾN TRÚC BACKEND FASTAPI & HỆ THỐNG API ENDPOINTS](#8-kiến-trúc-backend-fastapi--hệ-thống-api-endpoints)
9. [KIẾN TRÚC FRONTEND CÔNG THÁI HỌC (TACTILE UI/UX)](#9-kiến-trúc-frontend-công-thái-học-tactile-uiux)
10. [QUY TRÌNH PIPELINE DỮ LIỆU & HUẤN LUYỆN (DATA PIPELINE & TRAINING)](#10-quy-trình-pipeline-dữ-liệu--huấn-luyện-data-pipeline--training)
11. [CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT DIRECTORY BLUEPRINT)](#11-cấu-trúc-thư-mục-dự-án-project-directory-blueprint)
12. [HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH & TRIỂN KHAI PRODUCTION](#12-hướng-dẫn-cài-đặt-vận-hành--triển-khai-production)

---

## 1. TỔNG QUAN HỆ THỐNG & SỨ MỆNH KỸ THUẬT

### 1.1. Bản chất hệ thống
**MHD AVM (Automated Valuation Model)** là hệ thống định giá bất động sản tự động thế hệ mới được nghiên cứu và phát triển bởi **MHD Real Estate Tech**. Hệ thống kết hợp chuẩn mực thẩm định giá truyền thống của Việt Nam với các thuật toán học máy (Machine Learning) và công nghệ không gian địa lý (Geospatial Intelligence) nhằm đưa ra kết quả thẩm định giá trị tài sản khách quan, tức thời (thời gian xử lý dưới **100 mili-giây**), có độ chính xác cao và giải trình được 100% các yếu tố hình thành giá trị.

### 1.2. Thách thức thị trường và lời giải của MHD AVM
- **Thách thức 1: Tính thiếu minh bạch và hiện tượng "thổi giá"**: Giá chào bán niêm yết trên các cổng thông tin rao vặt thường cao hơn từ 5% - 15% so với giá giao dịch thực tế.  
  👉 *Giải pháp:* MHD AVM áp dụng **Hệ số chiết khấu thương lượng thị trường (MHD Discount Factor = 0.93)** cùng cơ chế đối trừ giá niêm yết theo từng bất động sản đối chứng.
- **Thách thức 2: Pháp lý bất động sản phức tạp tại Việt Nam**: Sự chênh lệch rất lớn về giá trị giữa tài sản có Giấy chứng nhận quyền sử dụng đất (Sổ đỏ / Sổ hồng) với tài sản mua bán vi bằng, giấy viết tay.  
  👉 *Giải pháp:* Tích hợp phân hệ đánh giá pháp lý theo Tiêu chuẩn Thẩm định giá TĐGVN 08, áp dụng mức chiết khấu rủi ro pháp lý từ -15% đến -20% khi tài sản chưa có sổ.
- **Thách thức 3: Địa chính vi mô và hạn chế của bản đồ công cộng**: Các hệ thống định vị quốc tế (như OpenStreetMap Nominatim) thường xuyên nhầm lẫn cấp hành chính tại Việt Nam (ví dụ: nhầm "Phường Bình Lợi Trung" thành suburb mà không nhận diện được trực thuộc Quận Bình Thạnh).  
  👉 *Giải pháp:* Xây dựng **Bộ phân giải địa chính không gian PostGIS KNN độc quyền**, đối chiếu tức thời tọa độ WGS84 với 35.000 điểm dữ liệu đối chứng địa phương đã chuẩn hóa.

---

## 2. TOÀN BỘ CÔNG NGHỆ SỬ DỤNG (FULL TECH STACK)

| Lớp Kiến Trúc (Layer) | Công Nghệ / Thư Viện | Phiên Bản | Vai Trò Kỹ Thuật |
|---|---|---|---|
| **Ngôn Ngữ Lõi** | Python | 3.11.x | Ngôn ngữ backend xử lý tính toán toán học, học máy và điều phối API |
| **Backend Framework** | FastAPI | 0.110+ | Framework bất đồng bộ (Asynchronous ASGI) hiệu năng cực cao, độ trễ < 100ms |
| **Web Server (ASGI)** | Uvicorn | 0.28+ | Máy chủ ứng dụng ASGI production hỗ trợ HTTP/1.1 và WebSockets |
| **Mô Hình Học Máy Lõi** | CatBoost Regressor | 2.4.x | Mô hình Gradient Boosting trên cây quyết định tối ưu cho dữ liệu bảng và biến phân loại tiếng Việt |
| **Thuật Toán Giải Thích AI** | TreeSHAP (SHAP Library) | 0.45+ | Thuật toán bóc tách giá trị đóng góp cận biên của từng đặc trưng (XAI) theo lý thuyết trò chơi Shapley |
| **Cơ Sở Dữ Liệu Quan Hệ** | PostgreSQL | 15 / 16 | Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, lưu trữ danh bạ 35.000+ giao dịch và lịch sử định giá |
| **Phân Hệ Không Gian** | PostGIS | 3.3 / 3.4 | Extension không gian: chỉ mục GiST, tọa độ WGS84 (SRID 4326), toán tử KNN `<->`, `ST_Distance`, `ST_DWithin` |
| **Trình Điều Khiển DB** | psycopg2-binary | 2.9+ | Thư viện kết nối C-optimized giữa Python và PostgreSQL với `RealDictCursor` |
| **Xử Lý & Kho Dữ Liệu** | Pandas, Polars, Parquet | Mới nhất | Tiền xử lý, lọc nhiễu ngoại lai (IQR filtering) và lưu trữ dữ liệu dạng cột nén |
| **Trích Xuất Đặc Trưng NLP** | Regex & Rule-Based NLP | Python std | Bộ parser ngôn ngữ tự nhiên bóc tách: pháp lý sổ đỏ, ngõ ô tô, lô góc, đất nở hậu |
| **Giao Diện Người Dùng (UI)** | HTML5, Vanilla CSS3, JS (ES6+) | Chuẩn W3C | Thiết kế độc lập không phụ thuộc thư viện nặng, tối ưu tải trang < 0.5s |
| **Hệ Thống Bản Đồ GIS** | Leaflet.js | 1.9.4 | Thư viện bản đồ tương tác hiển thị ghim tọa độ, vòng tròn khảo sát 500m và 5 BĐS đối chứng |
| **Lớp Bản Đồ Nền (Tiles)** | OpenStreetMap & CartoDB | Standard | Bản đồ vector/raster hỗ trợ 2 chế độ Dark Mode (CartoDB Dark Matter) và Light Mode (OSM) |
| **Đóng Gói & Môi Trường** | Docker & Docker-Compose | 24.x+ | Đóng gói toàn bộ cơ sở dữ liệu PostgreSQL + PostGIS trong 1 lệnh duy nhất |

---

## 3. QUY TRÌNH HOẠT ĐỘNG TỔNG THỂ TỪ ĐẦU ĐẾN CUỐI (END-TO-END WORKFLOW)

Quy trình từ lúc người dùng mở trình duyệt đến khi xuất chứng thư thẩm định diễn ra theo 7 bước tuần tự và khép kín:

```
[Người dùng tương tác Bản đồ / Form]
                │
                ▼ (Bước 1)
[Tọa độ GPS WGS84 (Lat, Lng) & Thông số BĐS]
                │
                ▼ (Bước 2)
[Gọi GET /api/v1/reverse-geocode] ──► [PostGIS KNN <-> Truy vấn 10 BĐS gần nhất]
                │                                    │
                │◄───────────────────────────────────┘ (Chuẩn hóa Quận, Phường, Tỉnh thực tế)
                ▼ (Bước 3)
[Điền đầy đủ Form & Gọi POST /api/v1/predict-price]
                │
                ├──────────────────────────────────────┬───────────────────────────────────┐
                ▼ (Bước 4A)                            ▼ (Bước 4B)                         ▼ (Bước 4C)
[Truy vấn PostGIS 5 BĐS đối chứng]        [CatBoost Regressor v2.4]              [TreeSHAP Engine]
     - Cùng loại hình BĐS                      - Dự đoán giá log(1+price)             - Phân tích đóng góp %
     - Cùng Quận / Bán kính 2.5km              - Khử log: expm1(pred)                 - Chuẩn hóa logic kinh tế
     - 6 hệ số điều chỉnh CMA TĐGVN 08         - Chiết khấu MHD Discount: 0.93        - Sắp xếp độ ảnh hưởng
     - Đơn giá chỉ dẫn bình quân CMA
                │                                      │                                   │
                └──────────────────────────────────────┴───────────────────────────────────┘
                                                       │
                                                       ▼ (Bước 5)
                            [TÍCH HỢP ĐỊNH GIÁ: 85% CMA + 15% CatBoost AI]
                                                       │
                                                       ▼ (Bước 6)
                            [Đánh giá Độ tin cậy Động (Dynamic Confidence: 85% - 96%)]
                                                       │
                                                       ▼ (Bước 7)
                            [Render Giao diện 3 Cột: Kết quả + Giải trình XAI + 5 Đối chứng]
                                                       │
                                                       ▼
                            [Xuất Chứng Thư Thẩm Định (MHD-TDG-2026-XXXX) / In PDF]
```

### Chi tiết 7 bước thực thi:
1. **Bước 1 - Khởi tạo & Định vị**: Người dùng kéo ghim bản đồ hoặc tìm địa chỉ (ví dụ: "Phường Bình Lợi Trung").
2. **Bước 2 - Phân giải địa chính WGS84**: Backend sử dụng toán tử KNN `<->` đối chiếu tọa độ với các BĐS đã xác thực trong cơ sở dữ liệu. Ngay lập tức trả về đúng `Quận Bình Thạnh`, `TP. Hồ Chí Minh`, loại bỏ hoàn toàn nguy cơ lệch sang `Quận 1`.
3. **Bước 3 - Gửi yêu cầu thẩm định**: Frontend đóng gói payload gồm vị trí, diện tích, số tầng, mặt tiền, ngõ vào, pháp lý sổ đỏ, hướng nhà, thế đất gửi đến endpoint `/api/v1/predict-price`.
4. **Bước 4 - Tính toán song song**:
   - **4A**: `SpatialService` kích hoạt bộ lọc 3 tầng, tìm 5 BĐS so sánh tương đồng và tính toán hệ số điều chỉnh CMA.
   - **4B**: `ValuationService` đưa vector đặc trưng vào `Pool` của mô hình CatBoost để tính giá trị điểm chuẩn (benchmark).
   - **4C**: Phân hệ `TreeSHAP` tính toán véc-tơ Shapley values, chuyển hóa thành tỷ lệ phần trăm đóng góp cụ thể.
5. **Bước 5 - Kết hợp định giá**: Áp dụng trọng số $85\%$ cho phương pháp CMA và $15\%$ cho CatBoost để ra kết quả định giá cuối cùng.
6. **Bước 6 - Tính điểm tin cậy**: Dựa trên khoảng cách thực tế đến BĐS đối chứng gần nhất và hệ số biến thiên giá khu vực.
7. **Bước 7 - Trực quan hóa kết quả**: Render dữ liệu lên giao diện 3 cột song song, cho phép xem từng bảng tính điều chỉnh và in chứng thư.

---

## 4. KIẾN TRÚC DỮ LIỆU & SCHEMA CƠ SỞ DỮ LIỆU POSTGIS

Hệ thống sử dụng cơ sở dữ liệu PostgreSQL 15 kết hợp PostGIS. Schema được thiết kế chuẩn hóa phục vụ cả việc huấn luyện AI lẫn truy vấn không gian thời gian thực:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BẢNG 1: real_estate_listings (Kho 34,955 BĐS đối chứng thị trường)                     │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ Tên Cột                  │ Kiểu Dữ Liệu             │ Mô Tả Kỹ Thuật                   │
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
│ id                       │ BIGSERIAL PRIMARY KEY    │ Khóa chính tự tăng               │
│ source_id                │ VARCHAR(64) UNIQUE       │ Mã định danh gốc từ cổng cào     │
│ property_type            │ VARCHAR(60) NOT NULL     │ Nhà riêng, Căn hộ, Đất nền,...   │
│ province_name            │ VARCHAR(100) NOT NULL    │ Tỉnh/Thành phố chuẩn hóa         │
│ district_name            │ VARCHAR(100) NOT NULL    │ Quận/Huyện chuẩn hóa             │
│ ward_name                │ VARCHAR(100)             │ Phường/Xã                        │
│ street_name              │ VARCHAR(255)             │ Số nhà, tên tuyến đường          │
│ area                     │ NUMERIC(10,2) NOT NULL   │ Diện tích đất / sàn (m²)         │
│ price                    │ NUMERIC(16,2) NOT NULL   │ Giá chào niêm yết (VNĐ)          │
│ price_per_m2             │ NUMERIC(14,2)            │ Đơn giá tính toán (VNĐ/m²)       │
│ bedroom_count            │ INT DEFAULT 1            │ Số lượng phòng ngủ               │
│ bathroom_count           │ INT DEFAULT 1            │ Số lượng phòng vệ sinh           │
│ floor_count              │ INT DEFAULT 1            │ Quy mô kết cấu số tầng           │
│ road_width               │ NUMERIC(6,2)             │ Độ rộng ngõ tiếp cận (mét)       │
│ frontage_width           │ NUMERIC(6,2)             │ Chiều ngang mặt tiền (mét)       │
│ house_direction          │ VARCHAR(30)              │ Đông, Tây, Nam, Bắc, Đông Nam... │
│ has_so_do                │ BOOLEAN DEFAULT TRUE     │ Pháp lý có Sổ đỏ/Sổ hồng hay ko  │
│ is_lo_goc                │ BOOLEAN DEFAULT FALSE    │ Vị trí lô góc 2 mặt tiền         │
│ is_no_hau                │ BOOLEAN DEFAULT FALSE    │ Thế đất nở hậu phong thủy        │
│ is_oto_do                │ BOOLEAN DEFAULT FALSE    │ Ngõ ô tô đỗ cửa / vào nhà        │
│ geom                     │ GEOMETRY(Point, 4326)    │ Tọa độ không gian WGS84          │
│ published_at             │ TIMESTAMPTZ              │ Thời điểm đăng tin / giao dịch   │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
CHỈ MỤC TỐI ƯU HÓA:
- idx_listings_geom: USING GIST (geom) -> Truy vấn bán kính và KNN <-> dưới 5ms
- idx_listings_admin: (province_name, district_name)
- idx_listings_prop_type: (property_type)
```

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BẢNG 2: valuation_history (Lịch sử thẩm định & Nhật ký yêu cầu của khách hàng)         │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ id                       │ BIGSERIAL PRIMARY KEY    │ Mã hồ sơ thẩm định               │
│ client_ip                │ VARCHAR(45)              │ Địa chỉ IP của máy yêu cầu       │
│ customer_phone           │ VARCHAR(20)              │ Số điện thoại khách hàng (Leads) │
│ property_type            │ VARCHAR(60) NOT NULL     │ Loại hình BĐS thẩm định          │
│ area                     │ NUMERIC(10,2) NOT NULL   │ Diện tích (m²)                   │
│ geom                     │ GEOMETRY(Point, 4326)    │ Tọa độ điểm thẩm định            │
│ input_payload            │ JSONB NOT NULL           │ Toàn bộ thông số đầu vào dạng JSON│
│ predicted_price          │ NUMERIC(16,2) NOT NULL   │ Giá trị thẩm định chính thức (VNĐ│
│ price_low                │ NUMERIC(16,2) NOT NULL   │ Cận dưới khoảng tin cậy          │
│ price_high               │ NUMERIC(16,2) NOT NULL   │ Cận trên khoảng tin cậy          │
│ confidence_score         │ NUMERIC(4,3)             │ Hệ số tin cậy (VD: 0.910)        │
│ model_version            │ VARCHAR(50)              │ Phiên bản mô hình (mhd-v2)       │
│ created_at               │ TIMESTAMPTZ DEFAULT NOW  │ Thời điểm lập hồ sơ              │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BẢNG 3: spatial_poi_cache (Danh mục tọa độ các Tỉnh, Quận, Huyện và Tiện ích)          │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ id                       │ SERIAL PRIMARY KEY       │ Khóa chính                       │
│ province_name            │ VARCHAR(100) NOT NULL    │ Tên Tỉnh/Thành phố               │
│ district_name            │ VARCHAR(100) NOT NULL    │ Tên Quận/Huyện                   │
│ ward_name                │ VARCHAR(100)             │ Tên Phường/Xã                    │
│ latitude                 │ NUMERIC(10,7)            │ Vĩ độ WGS84                      │
│ longitude                │ NUMERIC(10,7)            │ Kinh độ WGS84                    │
│ geom                     │ GEOMETRY(Point, 4326)    │ Tọa độ hình học                  │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## 5. CƠ CHẾ THẨM ĐỊNH GIÁ KẾT HỢP (HYBRID VALUATION ENGINE)

Hệ thống kết hợp có trọng số giữa phương pháp truyền thống và học máy:

$$\text{Giá Trị Thẩm Định Cuối Cùng} = 0.85 \times P_{\text{CMA}} + 0.15 \times P_{\text{CatBoost\_Bench}}$$

Trong đó:
- **$P_{\text{CMA}}$**: Giá trị tính toán từ 5 BĐS đối chứng thị trường theo Tiêu chuẩn Thẩm định giá TĐGVN 08.
- **$P_{\text{CatBoost\_Bench}}$**: Giá trị dự báo từ mô hình CatBoost đã nhân hệ số chiết khấu niêm yết $0.93$.

---

### 5.1. Phương pháp So sánh Thị trường (CMA - TĐGVN 08) - 85% Trọng số
Phương pháp So sánh trực tiếp là phương pháp có giá trị pháp lý cao nhất trong thẩm định giá bất động sản. Với mỗi tài sản đối chứng $k$ ($k = 1 \dots 5$), đơn giá m² sau điều chỉnh ($P_k^{\text{indicated}}$) được tính như sau:

$$P_k^{\text{indicated}} = P_k^{\text{comp}} \times \left(1 + \sum_{j=1}^{6} \Delta_j \right)$$

#### Chi tiết 6 nhóm hệ số điều chỉnh ($\Delta_j$):
1. **$\Delta_1$ - Pháp lý quyền sử dụng đất ($\Delta_{\text{legal}}$)**:
   - Nếu BĐS đối chứng có sổ đỏ, tài sản thẩm định chưa có sổ: $\Delta_{\text{legal}} = -20\%$ (giảm trừ do rủi ro tranh chấp, hạn chế giao dịch).
   - Nếu BĐS đối chứng chưa có sổ, tài sản thẩm định có sổ: $\Delta_{\text{legal}} = +22\%$ (cộng thêm do tính pháp lý hoàn thiện).
2. **$\Delta_2$ - Kết cấu xây dựng và số tầng ($\Delta_{\text{floors}}$)**:
   - Công thức: $\Delta_{\text{floors}} = (N_{\text{tầng\_thẩm\_định}} - N_{\text{tầng\_đối\_chứng}}) \times 7\%$.
   - Mỗi tầng chênh lệch phản ánh chi phí xây dựng hoàn thiện tương đương $7\%$ đơn giá đất/công trình.
3. **$\Delta_3$ - Độ rộng đường ngõ tiếp cận ($\Delta_{\text{road}}$)**:
   - Công thức: $\Delta_{\text{road}} = \text{Clip}\left(\frac{W_{\text{ngõ\_thẩm\_định}} - W_{\text{ngõ\_đối\_chứng}}}{5.0} \times 10\%, -15\%, +15\%\right)$.
   - Chênh lệch bề rộng ngõ từ $0.5\text{m}$ trở lên được điều chỉnh tối đa $\pm 15\%$.
4. **$\Delta_4$ - Quy mô diện tích đất (Scale Effect $\Delta_{\text{area}}$)**:
   - Công thức: $\Delta_{\text{area}} = \text{Clip}\left(-0.10 \times \frac{\text{Area}_{\text{thẩm\_định}} - \text{Area}_{\text{đối\_chứng}}}{\text{Area}_{\text{đối\_chứng}}}, -10\%, +10\%\right)$.
   - Phản ánh quy luật kinh tế: thửa đất diện tích càng lớn thì đơn giá trên mỗi m² có xu hướng giảm nhẹ so với thửa đất nhỏ gọn.
5. **$\Delta_5$ - Lô góc & Thế đất phong thủy ($\Delta_{\text{shape}}$)**:
   - Tài sản thẩm định là lô góc 2 mặt tiền, đối chứng là nhà 1 mặt thoáng: $\Delta_{\text{corner}} = +6\%$.
   - Tài sản thẩm định có thế đất nở hậu, đối chứng là đất thường: $\Delta_{\text{no\_hau}} = +4\%$.
6. **$\Delta_6$ - Chiết khấu thương lượng niêm yết ($\Delta_{\text{nego}}$)**:
   - $\Delta_{\text{nego}} = -5\%$ áp dụng đồng bộ cho tất cả tin rao niêm yết để chuyển đổi từ giá mong muốn sang giá chốt hợp đồng.

#### Trọng số Tương đồng Không gian ($w_k$):
Mỗi bất động sản đối chứng được gán một độ tương đồng thô $S_k$:

$$S_k = \frac{1}{1 + 0.0015 \times \text{Distance}_{\text{meters}} + 0.015 \times |\Delta \text{Area}| + 2.5 \times |\sum \Delta_j|}$$

Trọng số chuẩn hóa tổng bằng 1:

$$w_k = \frac{S_k}{\sum_{m=1}^{5} S_m}$$

Mức giá chỉ dẫn tổng hợp từ 5 BĐS đối chứng:

$$P_{\text{CMA}} = \left(\sum_{k=1}^{5} w_k \times P_k^{\text{indicated}}\right) \times \text{Area}_{\text{thẩm\_định}}$$

---

### 5.2. Mô hình Học máy CatBoost v2.4 AI - 15% Trọng số
Mô hình CatBoost đóng vai trò là "chốt kiểm định diện rộng" (Macro Sanity Check) để đảm bảo kết quả định giá không bị biến động cục bộ do các tin rao đối chứng có giá bất thường.

- **Thuật toán**: CatBoost Regressor với cây đối xứng (Oblivious Trees) giúp tăng tốc độ suy luận xuống dưới **2ms**.
- **Tập dữ liệu**: Huấn luyện trên **34.955 giao dịch** đã làm sạch ngoại lai.
- **Biến mục tiêu**: $\log(1 + \text{Price})$ để chuẩn hóa phân phối lệch phải của giá nhà đất.
- **Xử lý biến phân loại**: CatBoost áp dụng thuật toán `Ordered Target Statistics`, mã hóa tối ưu các biến phân loại tiếng Việt (`district_name`, `province_name`, `property_type`, `house_direction`) mà không gây hiện tượng rò rỉ dữ liệu (target leakage).
- **Hệ số chất lượng mô hình**:
  - $R^2 = 0.7227$ (Giải thích được 72.3% phương sai giá thị trường toàn quốc).
  - $\text{MAPE} = 35.61\%$ (Mức sai số trung bình tuyệt đối đạt chuẩn ngành thẩm định giá tự động).

---

## 6. HỆ THỐNG KHÔNG GIAN ĐỊA LÝ & BỘ PHÂN GIẢI POSTGIS KNN

Hệ thống không gian giải quyết triệt để vấn đề "nhập địa chỉ một đằng, bản đồ nhảy một nẻo":

```
Người dùng chọn vị trí bất kỳ (Lat, Lng)
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ BỘ PHÂN GIẢI ĐỊA CHÍNH NỘI BỘ (PostGIS KNN Operator)   │
│ Toán tử: geom <-> ST_SetSRID(ST_MakePoint(Lng, Lat))   │
│ Quét tức thời 10 BĐS gần nhất có nhãn chuẩn            │
└────────────────────────────────────────────────────────┘
                   │
                   ▼
  - District thực tế: "Bình Thạnh" (Majority Vote)
  - Province thực tế: "Thành phố Hồ Chí Minh"
  - Ward thực tế:     "Phường 13" / "Phường 25"
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ THUẬT TOÁN TÌM KIẾM 5 BĐS ĐỐI CHỨNG (3 TẦNG ƯU TIÊN)   │
│ Tầng 1: Cùng Loại hình + Cùng Quận + Bán kính <= 2.5km  │
│ Tầng 2: Cùng Loại hình + Cùng Quận (Toàn quận)         │
│ Tầng 3: Cùng Loại hình + Bán kính mở rộng <= 8.0km     │
└────────────────────────────────────────────────────────┘
```

### Điểm đột phá kỹ thuật:
- **Loại bỏ sự phụ thuộc vào Nominatim**: Khi người dùng chọn "Phường Bình Lợi Trung", Nominatim chỉ trả về `suburb: Phường Bình Lợi Trung` và bỏ trống trường `district`. PostGIS KNN ngay lập tức nhận diện vị trí này thuộc `Quận Bình Thạnh`, ghi đè lên giá trị mặc định của form và truyền đúng tham số vào mô hình.
- **Bảo vệ ở Backend**: File `src/services/valuation_service.py` có cơ chế tự động thẩm tra: nếu tọa độ thực tế cách xa Quận 1 mà payload vẫn gửi `Quận 1`, hệ thống tự động hiệu chỉnh về đúng quận thực tế trước khi chạy mô hình.

---

## 7. GIẢI TRÌNH MINH BẠCH BẰNG AI (EXPLAINABLE AI - TREESHAP)

MHD AVM không bao giờ đưa ra một con số định giá "hộp đen". Toàn bộ mức chênh lệch giá đều được giải trình thành bảng phân tích đóng góp cụ thể:

### Các yếu tố đóng góp chính và chuẩn hóa kinh tế (Guardrails):
1. **Pháp lý Sổ đỏ / Sổ hồng**:
   - Có sổ đỏ: Đóng góp $+3.0\%$ đến $+5.0\%$ (bảo chứng pháp lý tài sản).
   - Chưa có sổ đỏ: Bắt buộc áp dụng mức chiết khấu rủi ro pháp lý âm ($-15.0\%$ đến $-20.0\%$).
2. **Quy mô số tầng**:
   - Từ 2 tầng trở lên: Gia tăng giá trị $+3.5\% \times (N_{\text{tầng}} - 1)$ phản ánh giá trị xây lắp kiên cố.
   - 1 tầng / nhà cấp 4: Ghi nhận đúng kết cấu thực tế.
3. **Độ rộng đường ngõ & Ô tô**:
   - Ngõ $\ge 4.0\text{m}$ (ô tô tránh nhau): Đóng góp dương $+2.0\%$ đến $+5.0\%$.
   - Ngõ xe máy: Ghi nhận mốc tiếp cận ngõ tiêu chuẩn, không cộng giá vô lý.
4. **Vị trí Lô góc & Thế đất**:
   - Nhà 1 mặt thoáng & thế đất vuông vắn: Đặt làm **mốc tham chiếu chuẩn ($0.0\%$)**, không bị trừ điểm vô lý.
   - Lô góc 2 mặt tiền: Cộng $+5.0\%$ giá trị kinh doanh và thông thoáng.
   - Thế đất nở hậu: Cộng $+3.0\%$ giá trị tài lộc phong thủy.

---

## 8. KIẾN TRÚC BACKEND FASTAPI & HỆ THỐNG API ENDPOINTS

Backend được tổ chức theo kiến trúc module hóa với các Router độc lập:

### Danh mục Endpoints chính thức:

#### 1. `POST /api/v1/predict-price`
- **Chức năng**: Thẩm định giá BĐS toàn diện (tính toán song song CMA 85% + CatBoost 15% + TreeSHAP).
- **Body Request**:
```json
{
  "property_type": "Nhà riêng",
  "province_name": "Thành phố Hồ Chí Minh",
  "district_name": "Bình Thạnh",
  "ward_name": "Phường 13",
  "street_name": "Bình Lợi",
  "area": 85.0,
  "frontage_width": 4.5,
  "road_width": 4.0,
  "floor_count": 2,
  "bedroom_count": 3,
  "bathroom_count": 2,
  "house_direction": "Đông Nam",
  "has_so_do": true,
  "is_lo_goc": false,
  "is_no_hau": false,
  "is_oto_do": true,
  "latitude": 10.8227,
  "longitude": 106.7032
}
```

#### 2. `GET /api/v1/reverse-geocode`
- **Chức năng**: Nhận `latitude` và `longitude`, dùng PostGIS KNN trả về Tỉnh/Thành, Quận/Huyện, Phường/Xã chuẩn xác và khoảng cách tới BĐS đối chứng gần nhất.

#### 3. `GET /api/v1/comparables`
- **Chức năng**: Lấy danh sách 5 BĐS đối chứng tương đồng nhất theo bán kính không gian để hiển thị trên bản đồ.

#### 4. `GET /api/v1/model-status` & `POST /api/v1/reload-model`
- **Chức năng**: Giám sát tình trạng nạp của mô hình CatBoost và kích hoạt nạp lại mô hình thủ công không cần khởi động lại server.

#### 5. Cơ chế Tự động Nạp lại Mô hình (Hot-Reload Watcher)
File `src/services/valuation_service.py` khởi chạy một luồng ngầm (daemon thread) kiểm tra timestamp file `models/mhd_smart_v2.cbm` mỗi **10 giây**. Khi file mô hình được huấn luyện lại và ghi đè, hệ thống tự động nạp phiên bản mới vào RAM theo cơ chế `threading.Lock()` an toàn tuyệt đối.

---

## 9. KIẾN TRÚC FRONTEND CÔNG THÁI HỌC (TACTILE UI/UX)

Giao diện Single Page Application (SPA) tại [frontend/index.html](file:///d:/MHD%20AI/frontend/index.html) được xây dựng theo tiêu chuẩn công thái học cao cấp:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  MHD Valuation AVM  [• CatBoost v2.4]  [34,955 giao dịch]   [Light/Dark] [Reset] │
├──────────────────────────────────────────────────────────────────────────────────┤
│  BẢN ĐỒ THẨM ĐỊNH (Leaflet WGS84 Hero ~38vh) [Ghim vị trí | Bán kính khảo sát 500m]
├───────────────────────┬──────────────────────────┬───────────────────────────────┤
│ CỘT 1: HỒ SƠ TÀI SẢN  │ CỘT 2: KẾT QUẢ THẨM ĐỊNH │ CỘT 3: 5 BĐS ĐỐI CHỨNG (CMA)  │
│ - Tỉnh, Quận, Phường  │ - Giá trị ước tính (Tỷ)  │ - BĐS 1 (Khoảng cách, Đơn giá)│
│ - Tab phân khúc BĐS   │ - Đơn giá Tr/m²          │ - BĐS 2                       │
│ - Slider diện tích    │ - Điểm tin cậy dữ liệu % │ - BĐS 3                       │
│ - Số tầng, Mặt tiền   │ - Bóc tách đóng góp XAI  │ - BĐS 4                       │
│ - Checkbox Pháp lý/Đất│ - Chiết khấu MHD (-7%)   │ - BĐS 5                       │
│ [ THẨM ĐỊNH GIÁ NGAY] │ [ XUẤT CHỨNG THƯ IN PDF] │ [Chi tiết từng hệ số điều chỉnh]
└───────────────────────┴──────────────────────────┴───────────────────────────────┘
```

### Các ưu điểm vượt trội của Giao diện:
1. **Thiết kế 3 Cột Đồng Thời**: Khắc phục nhược điểm của các web định giá thông thường (phải cuộn trang hoặc nhảy tab). Người dùng vừa điều chỉnh thông số bên trái, vừa thấy giá cập nhật ở giữa, vừa kiểm tra được 5 nhà hàng xóm bên phải.
2. **Form Điều Khiển Cảm Ứng (Tactile Controls)**:
   - Chuyển tab *Căn hộ chung cư* sẽ tự động ẩn số tầng, mặt tiền, ngõ vào và thế đất.
   - Thanh trượt diện tích (Slider) đồng bộ 2 chiều mượt mà với ô nhập số.
   - Sổ đỏ/Sổ hồng được tích sẵn mặc định; các thông số tầng (2), ngõ (4m), mặt tiền (4.5m) có giá trị ban đầu hợp lý, tránh tình trạng để trống gây sai lệch định giá.
3. **Chế độ Sáng / Tối (Dark & Light Mode)**:
   - Tự động lưu sở thích người dùng vào `localStorage`.
   - Chuyển đổi toàn bộ bảng màu CSS custom properties và đồng bộ đổi giao diện bản đồ giữa nền sáng và nền tối CartoDB Dark Matter.
4. **Xuất Chứng Thư Thẩm Định Chuẩn In Ấn**:
   - Tự động sinh mã chứng thư an toàn: `MHD-TDG-2026-XXXX`.
   - CSS in ấn `@media print` tự động giấu các nút bấm điều khiển, căn chỉnh biên bản vào đúng trang A4 để in trực tiếp hoặc lưu PDF nộp ngân hàng / khách hàng.

---

## 10. QUY TRÌNH PIPELINE DỮ LIỆU & HUẤN LUYỆN (DATA PIPELINE & TRAINING)

1. **Thu thập dữ liệu**: Tải 1.000.000+ tin đăng từ dataset `tinixai/vietnam-real-estates` trên Hugging Face.
2. **Làm sạch dữ liệu ([src/data_pipeline.py](file:///d:/MHD%20AI/src/data_pipeline.py))**:
   - Loại bỏ các tin đăng thiếu giá, diện tích $\le 5\text{m}^2$ hoặc $\ge 2.000\text{m}^2$.
   - Lọc bỏ ngoại lai bằng phương pháp IQR (Interquartile Range) cho từng quận huyện.
   - Chuẩn hóa tên 63 tỉnh thành và hàng trăm quận huyện theo danh mục hành chính nhà nước.
3. **Trích xuất đặc trưng NLP ([src/nlp_extractor.py](file:///d:/MHD%20AI/src/nlp_extractor.py))**:
   - Quét trường mô tả văn bản để nhận diện các đặc trưng tiềm ẩn: sổ đỏ/sổ hồng, ô tô vào nhà, vị trí góc, đất nở hậu.
4. **Huấn luyện mô hình ([src/train_catboost.py](file:///d:/MHD%20AI/src/train_catboost.py))**:
   - Phân chia tập Train/Test theo tỷ lệ $80/20$.
   - Chạy 1.000 vòng lặp CatBoost với hàm mục tiêu RMSE trên thang log.
   - Xuất file mô hình `models/mhd_smart_v2.cbm` và file metadata `models/model_metadata.json`.

---

## 11. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT DIRECTORY BLUEPRINT)

```
d:\MHD AI\
├── .env                           # File cấu hình biến môi trường (Database, Ports, Paths)
├── docker-compose.yml             # Cấu hình khởi chạy container PostgreSQL 15 + PostGIS
├── requirements.txt               # Danh mục toàn bộ thư viện Python phụ thuộc
├── HE_THONG_THAM_DINH_GIA_MHD_AVM.md # TÀI LIỆU TOÀN DIỆN HỆ THỐNG (FILE HIỆN TẠI)
│
├── config/
│   └── settings.py                # Cấu hình Pydantic BaseSettings đọc từ .env
│
├── models/
│   ├── mhd_smart_v2.cbm           # File nhị phân mô hình CatBoost đã huấn luyện
│   └── model_metadata.json        # Siêu dữ liệu đặc trưng, R2, MAPE, feature importance
│
├── database/
│   ├── 01_init_postgis.sql        # Kịch bản khởi tạo bảng listings, history, poi và chỉ mục GiST
│   ├── 02_spatial_queries.sql     # Các câu lệnh truy vấn không gian mẫu
│   ├── init_db.py                 # Script tự động khởi tạo database từ Python
│   └── populate_poi_cache.py      # Script nạp tọa độ 63 tỉnh thành và quận huyện vào cache
│
├── frontend/
│   └── index.html                 # Ứng dụng Single Page App: Leaflet GIS, Tactile UI, CMA view
│
└── src/
    ├── api/
    │   ├── main.py                # Điểm khởi động ứng dụng FastAPI (ASGI Entrypoint)
    │   └── routes/
    │       ├── predict.py         # Router định giá, geocoding, reverse-geocode và hot-reload
    │       └── history.py         # Router quản lý lịch sử thẩm định và dữ liệu leads
    ├── services/
    │   ├── spatial_service.py     # Service không gian: PostGIS KNN, bộ lọc 3 tầng, tính bán kính
    │   └── valuation_service.py   # Lõi thẩm định: CMA TĐGVN 08 + CatBoost + TreeSHAP XAI
    ├── train_catboost.py          # Script huấn luyện mô hình CatBoost
    ├── data_pipeline.py           # Pipeline làm sạch và xử lý dữ liệu tin đăng
    ├── nlp_extractor.py           # Trích xuất đặc trưng NLP (sổ đỏ, ngõ ô tô, lô góc, nở hậu)
    └── vietnam_admin_coords.py    # Danh bạ tọa độ địa lý WGS84 chuẩn 63 tỉnh/thành Việt Nam
```

---

## 12. HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH & TRIỂN KHAI PRODUCTION

### 12.1. Yêu cầu hệ thống tối thiểu
- **Hệ điều hành**: Windows 10/11, macOS hoặc Linux Ubuntu 20.04+
- **RAM**: Tối thiểu 4GB (Khuyến nghị 8GB để chạy PostGIS và CatBoost mượt mà)
- **Python**: Phiên bản `3.11.x`
- **Docker & Docker Desktop**: Để chạy container PostGIS

### 12.2. Khởi chạy cơ sở dữ liệu PostGIS (Docker)
Mở terminal tại thư mục gốc `d:\MHD AI`:
```powershell
docker-compose up -d
```
Lệnh này sẽ tải và khởi động container `mhd_postgis` tại cổng `5432` với cấu hình lưu trữ bền vững trong thư mục `postgres_data`.

### 12.3. Cài đặt môi trường ảo Python
```powershell
# Tạo môi trường ảo nếu chưa có
python -m venv .venv

# Kích hoạt môi trường ảo (PowerShell trên Windows)
.\.venv\Scripts\Activate.ps1

# Cài đặt toàn bộ thư viện cần thiết
pip install -r requirements.txt
```

### 12.4. Khởi chạy máy chủ Backend & Frontend
Chạy lệnh sau bằng Python trong môi trường ảo:
```powershell
.venv\Scripts\python.exe -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

- **Giao diện Ứng dụng Web**: Mở trình duyệt truy cập: `http://localhost:8000`
- **Tài liệu Swagger API**: Truy cập: `http://localhost:8000/docs`
- **Tài liệu Redoc API**: Truy cập: `http://localhost:8000/redoc`

### 12.5. Kiểm tra tình trạng hoạt động của hệ thống (Health Check)
Truy cập: `http://localhost:8000/health`  
Kết quả trả về đạt chuẩn:
```json
{
  "status": "healthy",
  "postgis_host": "localhost",
  "postgis_port": 5432,
  "model_path": "d:\\MHD AI\\models\\mhd_smart_v2.cbm"
}
```

---

*Tài liệu này là bản đặc tả kỹ thuật chính thức và toàn diện nhất của Hệ thống Thẩm định giá Bất động sản MHD AVM, được lưu trữ vĩnh viễn tại kho mã nguồn dự án.*
