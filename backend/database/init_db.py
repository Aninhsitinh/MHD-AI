"""
==============================================================================
MHD REAL ESTATE TECH • HỆ THỐNG THẨM ĐỊNH GIÁ BẤT ĐỘNG SẢN AI (MHD AVM)
SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU VÀ NẠP SCHEMA DDL POSTGIS
==============================================================================
"""

import sys
from pathlib import Path

# Cấu hình UTF-8 cho Windows console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config.settings import settings

def init_database():
    print("=" * 65)
    print("MHD AVM - KHỞI TẠO CƠ SỞ DỮ LIỆU POSTGRESQL & EXTENSION POSTGIS")
    print("=" * 65)
    print(f"Host: {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}")
    print(f"User: {settings.POSTGRES_USER}")
    print(f"Target Database: {settings.POSTGRES_DB}")
    print("-" * 65)

    # 1. Kết nối postgres mặc định để kiểm tra và tạo database mhd_valuation nếu chưa có
    try:
        conn = psycopg2.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{settings.POSTGRES_DB}'")
        exists = cursor.fetchone()
        if not exists:
            print(f" -> Cơ sở dữ liệu '{settings.POSTGRES_DB}' chưa tồn tại. Đang tạo mới...")
            cursor.execute(f"CREATE DATABASE {settings.POSTGRES_DB};")
            print(f" -> Đã tạo database '{settings.POSTGRES_DB}' thành công!")
        else:
            print(f" -> Database '{settings.POSTGRES_DB}' đã tồn tại sẵn.")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[CẢNH BÁO] Không thể kiểm tra database qua database 'postgres': {e}")
        print("Tiếp tục thử kết nối trực tiếp vào database đích...")

    # 2. Kết nối vào database mhd_valuation và thực thi script DDL
    try:
        conn = psycopg2.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            database=settings.POSTGRES_DB
        )
        cursor = conn.cursor()

        ddl_path = Path(__file__).resolve().parent / "01_init_postgis.sql"
        print(f" -> Đang đọc file DDL: {ddl_path.name}")
        with open(ddl_path, "r", encoding="utf-8") as f:
            ddl_sql = f.read()

        print(" -> Đang kích hoạt extension PostGIS và tạo các bảng không gian...")
        cursor.execute(ddl_sql)
        conn.commit()

        # Kiểm tra phiên bản PostGIS đã kích hoạt
        cursor.execute("SELECT PostGIS_Full_Version();")
        postgis_ver = cursor.fetchone()[0]
        print(f"\n[THÀNH CÔNG] PostGIS đã kích hoạt:\n   {postgis_ver}")

        # Kiểm tra danh sách bảng đã tạo
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name IN ('real_estate_listings', 'valuation_history', 'spatial_poi_cache');
        """)
        tables = [r[0] for r in cursor.fetchall()]
        print(f"\n[THÀNH CÔNG] Các bảng đã sẵn sàng: {', '.join(tables)}")

        cursor.close()
        conn.close()
        print("\n" + "=" * 65)
        print("KHỞI TẠO CƠ SỞ DỮ LIỆU HOÀN TẤT THÀNH CÔNG 100%!")
        print("=" * 65)
        return True

    except Exception as e:
        print(f"\n[LỖI KHỞI TẠO CSDL]: {e}")
        print("\nKhắc phục:")
        print("1. Hãy đảm bảo Docker Desktop đang chạy.")
        print("2. Chạy lệnh: docker compose up -d")
        print("3. Chạy lại script này: python database/init_db.py")
        return False

if __name__ == "__main__":
    init_database()
