"""
MHD Real Estate Tech - Script to Disperse Spatial Coordinates
Cập nhật tọa độ phân tán thực tế theo đường phố & phường cho toàn bộ 34.955 BĐS trong PostGIS
"""

import sys
import os
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import math
import hashlib
import psycopg2
from psycopg2.extras import execute_values
from config.settings import settings
from src.vietnam_admin_coords import get_real_coordinates

def get_district_max_radius(prov: str, dist: str) -> float:
    d = (dist or '').strip().lower()
    compact_districts = {
        'quận 1', 'quận 3', 'quận 4', 'quận 5', 'quận 10', 'quận 11', 'phú nhuận',
        'hoàn kiếm', 'ba đình', 'đống đa', 'hai bà trưng', 'cầu giấy', 'thanh xuân',
        'hải châu', 'thanh khê'
    }
    for cd in compact_districts:
        if cd in d or d.endswith(cd):
            return 380.0
    outer_districts = {
        'củ chi', 'cần giờ', 'nhà bè', 'bình chánh', 'hóc môn',
        'sóc sơn', 'ba vì', 'mê linh', 'thạch thất', 'quốc oai', 'chương mỹ',
        'đông anh', 'gia lâm'
    }
    for od in outer_districts:
        if od in d or d.endswith(od):
            return 950.0
    return 550.0

def compute_dispersed_coords(base_lat: float, base_lng: float, prov: str, dist: str, ward_name: str, street_name: str, item_id: int):
    max_radius = get_district_max_radius(prov, dist)
    w_str = (ward_name or '').strip().lower()
    s_str = (street_name or '').strip().lower()
    i_hash = int(hashlib.md5(str(item_id).encode('utf-8')).hexdigest()[:8], 16)
    w_hash = int(hashlib.md5(w_str.encode('utf-8')).hexdigest()[:6], 16) if w_str else ((i_hash * 37) % 999983)
    s_hash = int(hashlib.md5(s_str.encode('utf-8')).hexdigest()[:6], 16) if s_str else ((i_hash * 73) % 999979)
    
    # Street cluster center: all properties on the same street share the street axis
    street_angle = (s_hash % 360)
    street_dist = 50.0 + (s_hash % int(max_radius * 0.7))
    
    # Ward adjustment:
    ward_angle = (w_hash % 360)
    ward_dist = 30.0 + (w_hash % int(max_radius * 0.25))
    
    # Item offset along street: max +/- 60m
    item_offset = ((i_hash % 25) - 12) * 5.0
    
    angle_rad = math.radians((street_angle * 0.7 + ward_angle * 0.3) % 360)
    total_dist = min(max_radius, street_dist + (ward_dist * 0.2) + item_offset)
    total_dist = max(30.0, total_dist)
    
    dx = total_dist * math.cos(angle_rad)
    dy = total_dist * math.sin(angle_rad)
    
    dlat = dy / 111320.0
    dlng = dx / (111320.0 * math.cos(math.radians(base_lat)))
    
    return round(base_lat + dlat, 6), round(base_lng + dlng, 6)

def main():
    print("=" * 70)
    print("MHD AVM - KHỞI TẠO TỌA ĐỘ PHÂN TÁN ĐƯỜNG PHỐ THỰC TẾ CHO POSTGIS")
    print("=" * 70)
    
    conn = psycopg2.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD
    )
    
    cur = conn.cursor()
    print("1. Đang truy vấn danh sách 34.955 BĐS từ PostgreSQL...")
    cur.execute("SELECT id, province_name, district_name, ward_name, street_name FROM real_estate_listings;")
    rows = cur.fetchall()
    print(f" -> Đã lấy {len(rows):,} bản ghi.")
    
    print("2. Đang tính toán tọa độ phân tán WGS84 từng BĐS...")
    update_data = []
    coord_cache = {}
    
    for r in rows:
        item_id, prov, dist, ward, street = r
        cache_key = (prov, dist)
        if cache_key not in coord_cache:
            coord_cache[cache_key] = get_real_coordinates(prov, dist)
        base_lat, base_lng = coord_cache[cache_key]
        
        new_lat, new_lng = compute_dispersed_coords(base_lat, base_lng, prov, dist, ward, street, item_id)
        update_data.append((new_lng, new_lat, item_id))
    
    print(f" -> Đã tính xong {len(update_data):,} tọa độ riêng biệt.")
    
    print("3. Đang cập nhật vào bảng real_estate_listings qua PostGIS ST_MakePoint...")
    batch_size = 5000
    for i in range(0, len(update_data), batch_size):
        batch = update_data[i:i + batch_size]
        query = """
        UPDATE real_estate_listings AS t
        SET geom = ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
        FROM (VALUES %s) AS v(lng, lat, id)
        WHERE t.id = v.id;
        """
        execute_values(cur, query, batch, template="(%s, %s, %s)", page_size=batch_size)
        conn.commit()
        print(f" -> Đã cập nhật {min(i + batch_size, len(update_data)):,} / {len(update_data):,} bản ghi...")
    
    # Kiểm tra kết quả
    cur.execute("SELECT count(*), count(distinct (ST_X(geom), ST_Y(geom))) FROM real_estate_listings;")
    total, distinct = cur.fetchone()
    print("=" * 70)
    print(f"HOÀN THÀNH: Tổng số {total:,} BĐS -> Số tọa độ độc lập: {distinct:,} điểm!")
    print("=" * 70)
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
