"""
MHD Real Estate Tech - AI Valuation Model
Script nạp toàn bộ danh mục tọa độ địa lý THẬT vào bảng spatial_poi_cache
Phòng ngừa giới hạn rate limit của OSM Nominatim
"""

import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_values

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config.settings import settings
from src.vietnam_admin_coords import REAL_PROVINCE_COORDINATES, REAL_DISTRICT_COORDINATES

def populate_poi_cache():
    print("=" * 65)
    print("NẠP TỌA ĐỘ ĐỊA LÝ THẬT VÀO BẢNG SPATIAL_POI_CACHE (POSTGIS)")
    print("=" * 65)

    conn = psycopg2.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD
    )
    cursor = conn.cursor()

    records = []

    # 1. Nạp các Tỉnh/Thành
    for prov_name, (lat, lng) in REAL_PROVINCE_COORDINATES.items():
        prov_title = prov_name.title()
        geom_wkt = f"SRID=4326;POINT({lng} {lat})"
        records.append((
            prov_title,
            "Toàn tỉnh/thành",
            "",
            lat,
            lng,
            geom_wkt
        ))

    # 2. Nạp các Quận/Huyện chi tiết
    for key, (lat, lng) in REAL_DISTRICT_COORDINATES.items():
        prov_name, dist_name = key.split("_", 1)
        geom_wkt = f"SRID=4326;POINT({lng} {lat})"
        records.append((
            prov_name.title(),
            dist_name.title(),
            "",
            lat,
            lng,
            geom_wkt
        ))

    insert_sql = """
    INSERT INTO spatial_poi_cache (
        province_name, district_name, ward_name, latitude, longitude, geom
    ) VALUES %s
    ON CONFLICT (province_name, district_name, ward_name) 
    DO UPDATE SET 
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        geom = EXCLUDED.geom;
    """

    execute_values(
        cursor,
        insert_sql,
        records,
        template="(%s, %s, %s, %s, %s, ST_GeomFromEWKT(%s))"
    )
    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM spatial_poi_cache;")
    total = cursor.fetchone()[0]
    print(f" -> Đã nạp thành công {total} điểm tọa độ hành chính thật vào spatial_poi_cache!")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    populate_poi_cache()
