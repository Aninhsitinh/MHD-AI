-- ==============================================================================
-- MHD REAL ESTATE TECH • HỆ THỐNG THẨM ĐỊNH GIÁ BẤT ĐỘNG SẢN AI (MHD AVM)
-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU POSTGIS & BẢNG KHÔNG GIAN
-- ==============================================================================

-- 1. KÍCH HOẠT EXTENSION KHÔNG GIAN POSTGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 2. BẢNG 1: DỮ LIỆU THỊ TRƯỜNG & HUẤN LUYỆN (1.000.000+ TIN ĐĂNG TỪ HUGGING FACE)
CREATE TABLE IF NOT EXISTS real_estate_listings (
    id BIGSERIAL PRIMARY KEY,
    source_id VARCHAR(64) UNIQUE,
    property_type VARCHAR(60) NOT NULL,           -- Nhà riêng, Căn hộ, Đất nền...
    province_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    ward_name VARCHAR(100),
    street_name VARCHAR(255),
    project_name VARCHAR(255),
    area NUMERIC(10,2) NOT NULL,                  -- Diện tích m²
    price NUMERIC(16,2) NOT NULL,                 -- Giá bán niêm yết (VNĐ)
    price_per_m2 NUMERIC(14,2),
    bedroom_count INT DEFAULT 1,
    bathroom_count INT DEFAULT 1,
    floor_count INT DEFAULT 1,
    road_width NUMERIC(6,2),                      -- Độ rộng ngõ vào (m)
    frontage_width NUMERIC(6,2),                  -- Chiều ngang mặt tiền (m)
    house_direction VARCHAR(30),
    
    -- CÁC BIẾN NLP THÔNG MINH TRÍCH XUẤT TỪ MÔ TẢ
    has_so_do BOOLEAN DEFAULT FALSE,              -- Sổ đỏ/hồng pháp lý
    is_lo_goc BOOLEAN DEFAULT FALSE,              -- Vị trí lô góc
    is_no_hau BOOLEAN DEFAULT FALSE,              -- Đất/nhà nở hậu
    is_oto_do BOOLEAN DEFAULT FALSE,              -- Ô tô vào nhà/đỗ cửa
    
    -- TỌA ĐỘ KHÔNG GIAN BẢN ĐỒ (WGS84: Longitude, Latitude)
    geom GEOMETRY(Point, 4326),
    raw_description TEXT,
    published_at TIMESTAMP WITH TIME ZONE
);

-- TẠO CÁC CHỈ MỤC TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_listings_geom ON real_estate_listings USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_listings_admin ON real_estate_listings (province_name, district_name);
CREATE INDEX IF NOT EXISTS idx_listings_prop_type ON real_estate_listings (property_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON real_estate_listings (price);

-- 3. BẢNG 2: LƯU LỊCH SỬ ĐỊNH GIÁ & LEADS KHÁCH HÀNG TRÊN WEBSITE MHD
CREATE TABLE IF NOT EXISTS valuation_history (
    id BIGSERIAL PRIMARY KEY,
    client_ip VARCHAR(45),
    customer_phone VARCHAR(20),
    property_type VARCHAR(60) NOT NULL,
    area NUMERIC(10,2) NOT NULL,
    geom GEOMETRY(Point, 4326),
    input_payload JSONB NOT NULL,                 -- Toàn bộ thông số nhà người dùng nhập
    predicted_price NUMERIC(16,2) NOT NULL,       -- Kết quả định giá trung bình
    price_low NUMERIC(16,2) NOT NULL,             -- Cận dưới khoảng tin cậy
    price_high NUMERIC(16,2) NOT NULL,            -- Cận trên khoảng tin cậy
    confidence_score NUMERIC(4,3),                -- Độ tin cậy mô hình (VD: 0.925)
    model_version VARCHAR(50) DEFAULT 'mhd-v2-catboost',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_val_history_created_at ON valuation_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_val_history_phone ON valuation_history (customer_phone);

-- 4. BẢNG 3: CACHE TỌA ĐỘ PHƯỜNG/XÃ (GIẢI QUYẾT RỦI RO GIỚI HẠN OSM NOMINATIM 1 req/s)
CREATE TABLE IF NOT EXISTS spatial_poi_cache (
    id SERIAL PRIMARY KEY,
    province_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    ward_name VARCHAR(100),
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_admin_location UNIQUE (province_name, district_name, ward_name)
);

CREATE INDEX IF NOT EXISTS idx_poi_cache_geom ON spatial_poi_cache USING GIST (geom);
