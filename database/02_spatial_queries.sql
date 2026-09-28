-- ==============================================================================
-- MHD REAL ESTATE TECH • TRUY VẤN KHÔNG GIAN BĐS TƯƠNG ĐỒNG TRONG BÁN KÍNH 500M
-- ==============================================================================

-- 1. Truy vấn 5 tài sản tương đồng bán kính 500m quanh tọa độ người dùng chấm ghim:
-- Thay thế các tham số :lng, :lat, :property_type, :radius_meters bằng giá trị thực tế
-- Ví dụ: Hồ Con Rùa, Quận 3, TP.HCM (lng=106.6983, lat=10.7828)
SELECT 
    id, 
    source_id,
    property_type, 
    province_name,
    district_name,
    ward_name,
    street_name,
    area, 
    price, 
    price_per_m2, 
    road_width, 
    frontage_width,
    bedroom_count,
    bathroom_count,
    has_so_do,
    is_oto_do,
    ROUND(
        ST_Distance(
            geom::geography, 
            ST_SetSRID(ST_MakePoint(106.7009, 10.7769), 4326)::geography
        )::numeric, 1
    ) AS distance_meters,
    ST_X(geom) AS longitude,
    ST_Y(geom) AS latitude
FROM real_estate_listings 
WHERE property_type = 'Nhà riêng'
  AND ST_DWithin(
        geom::geography, 
        ST_SetSRID(ST_MakePoint(106.7009, 10.7769), 4326)::geography, 
        500
  ) 
ORDER BY distance_meters ASC 
LIMIT 5;

-- 2. Truy vấn thống kê đơn giá trung bình m² theo bán kính 500m
SELECT 
    COUNT(*) AS total_samples,
    ROUND(AVG(price_per_m2), 0) AS avg_price_per_m2,
    ROUND(MIN(price_per_m2), 0) AS min_price_per_m2,
    ROUND(MAX(price_per_m2), 0) AS max_price_per_m2
FROM real_estate_listings
WHERE property_type = 'Nhà riêng'
  AND ST_DWithin(
        geom::geography, 
        ST_SetSRID(ST_MakePoint(106.7009, 10.7769), 4326)::geography, 
        500
  );
