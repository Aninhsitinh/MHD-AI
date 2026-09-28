"""
==============================================================================
MHD REAL ESTATE TECH • HỆ THỐNG THẨM ĐỊNH GIÁ BẤT ĐỘNG SẢN AI (MHD AVM)
SCRIPT PIPELINE DỮ LIỆU THẬT 100%: LÀM SẠCH, TRÍCH XUẤT NLP, TỌA ĐỘ THẬT VÀ NẠP POSTGIS
==============================================================================
Nguồn dữ liệu: Hugging Face dataset tinixai/vietnam-real-estates (350.000+ bản ghi)
Đầu ra: data/processed/data_mhd_clean.parquet & PostgreSQL 16 / PostGIS
"""

import os
import sys
import argparse
import hashlib
from pathlib import Path
from typing import List, Optional

# Cấu hình UTF-8 cho Windows console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import pandas as pd
import numpy as np
from tqdm import tqdm
import psycopg2
from psycopg2.extras import execute_values

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config.settings import settings
from src.nlp_extractor import NLPExtractor
from src.vietnam_admin_coords import get_real_coordinates

class MHDDataPipeline:
    def __init__(self, raw_dir: Path = settings.DATA_RAW_DIR, output_file: Path = settings.DATA_PROCESSED_FILE):
        self.raw_dir = Path(raw_dir)
        self.output_file = Path(output_file)
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        self.nlp_extractor = NLPExtractor()

    def clean_and_transform(self, shard_paths: List[Path], sample_limit: Optional[int] = None) -> pd.DataFrame:
        """Đọc dữ liệu thật từ shard, chuẩn hóa quận/huyện, lọc ngoại lai và gán tọa độ THẬT"""
        print("\n[1/3] Đang nạp và làm sạch dữ liệu bất động sản thật...")
        dfs = []
        for p in shard_paths:
            print(f" -> Đang đọc file: {p.name}")
            try:
                dfs.append(pd.read_parquet(p))
            except Exception as e:
                print(f"   Lỗi đọc {p.name}: {e}")

        if not dfs:
            raise RuntimeError("Không tìm thấy file shard parquet nào trong data/raw!")

        df = pd.concat(dfs, ignore_index=True)
        print(f" -> Tổng số bản ghi thô: {len(df):,}")

        if sample_limit and sample_limit < len(df):
            print(f" -> Lấy mẫu {sample_limit:,} bản ghi để xử lý tối ưu...")
            df = df.sample(n=sample_limit, random_state=42).reset_index(drop=True)

        # 1. Chuẩn hóa tên cột
        column_mapping = {
            "property_type_name": "property_type",
            "description": "raw_description"
        }
        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

        # 2. Xử lý giá & diện tích thực tế
        df["price"] = pd.to_numeric(df["price"], errors="coerce")
        df["area"] = pd.to_numeric(df["area"], errors="coerce")
        df = df.dropna(subset=["price", "area"]).copy()

        # Lọc giá thực tế: 150 triệu đến 400 tỷ, diện tích 10m² đến 2.000m²
        initial_len = len(df)
        df = df[(df["price"] >= 150_000_000) & (df["price"] <= 400_000_000_000)]
        df = df[(df["area"] >= 10.0) & (df["area"] <= 2000.0)]
        df["price_per_m2"] = (df["price"] / df["area"]).round(2)
        df = df[(df["price_per_m2"] >= 5_000_000) & (df["price_per_m2"] <= 1_000_000_000)]
        print(f" -> Đã lọc ngoại lai: giữ lại {len(df):,} / {initial_len:,} bản ghi ({len(df)/initial_len*100:.1f}%)")

        # 3. Chuẩn hóa Tên Quận/Huyện (VD: '1' -> 'Quận 1', '7' -> 'Quận 7')
        def normalize_district_name(d):
            d_str = str(d).strip()
            if d_str.isdigit():
                return f"Quận {d_str}"
            return d_str

        df["district_name"] = df["district_name"].fillna("").apply(normalize_district_name)
        df["province_name"] = df["province_name"].fillna("").astype(str).str.strip()
        df["ward_name"] = df["ward_name"].fillna("").astype(str).str.strip()
        df["street_name"] = df["street_name"].fillna("").astype(str).str.strip()
        df["property_type"] = df["property_type"].fillna("Nhà riêng").astype(str).str.strip()
        df["property_type"] = df["property_type"].replace("", "Nhà riêng")

        # 4. Đặc trưng số kỹ thuật
        for col, default_val, max_val in [
            ("bedroom_count", 2, 20),
            ("bathroom_count", 2, 20),
            ("floor_count", 1, 20),
            ("road_width", 3.0, 40.0),
            ("frontage_width", 4.0, 40.0)
        ]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(default_val)
                df[col] = df[col].clip(lower=0.5 if "width" in col else 1, upper=max_val)
            else:
                df[col] = default_val

        if "house_direction" not in df.columns:
            df["house_direction"] = "Đông Nam"
        else:
            df["house_direction"] = df["house_direction"].fillna("Đông Nam").astype(str).str.strip()
            df["house_direction"] = df["house_direction"].replace("", "Đông Nam")

        # 5. Trích xuất đặc trưng NLP nhạy cảm (Sổ đỏ, lô góc, ngõ ô tô, nở hậu) từ mô tả THẬT
        print(" -> Trích xuất đặc trưng NLP (has_so_do, is_lo_goc, is_no_hau, is_oto_do) từ mô tả thật...")
        if "raw_description" in df.columns:
            df = self.nlp_extractor.process_dataframe(df, text_col="raw_description")
        else:
            df["has_so_do"] = False
            df["is_lo_goc"] = False
            df["is_no_hau"] = False
            df["is_oto_do"] = False

        # 6. Gán TỌA ĐỘ ĐỊA LÝ THẬT (WGS84) theo Tỉnh/Thành và Quận/Huyện chính xác
        print(" -> Gán tọa độ địa lý THẬT (WGS84) theo danh mục hành chính Việt Nam...")
        coords = [
            get_real_coordinates(p, d)
            for p, d in zip(df["province_name"], df["district_name"])
        ]
        df["latitude"] = [c[0] for c in coords]
        df["longitude"] = [c[1] for c in coords]

        # 7. Sinh source_id duy nhất
        def make_source_id(row):
            key = f"{row.get('province_name')}_{row.get('district_name')}_{row.get('ward_name')}_{row.get('street_name')}_{row.get('price')}_{row.get('area')}"
            return hashlib.md5(key.encode('utf-8')).hexdigest()

        df["source_id"] = [make_source_id(row) for _, row in df.iterrows()]
        df = df.drop_duplicates(subset=["source_id"]).reset_index(drop=True)

        if "published_at" not in df.columns or df["published_at"].isna().all():
            df["published_at"] = pd.Timestamp.now(tz="UTC")
        else:
            df["published_at"] = pd.to_datetime(df["published_at"], errors="coerce").fillna(pd.Timestamp.now(tz="UTC"))

        return df

    def save_processed(self, df: pd.DataFrame) -> Path:
        print(f"\n[2/3] Lưu tập dữ liệu sạch ra: {self.output_file}")
        df.to_parquet(self.output_file, index=False, engine="pyarrow", compression="snappy")
        print(f" -> Hoàn tất! File có {len(df):,} bản ghi ({self.output_file.stat().st_size / (1024*1024):.2f} MB)")
        return self.output_file

    def load_to_postgis(self, df: Optional[pd.DataFrame] = None, batch_size: int = 5000):
        print("\n[3/3] Nạp toàn bộ dữ liệu sạch vào PostgreSQL 16 + PostGIS...")
        if df is None:
            df = pd.read_parquet(self.output_file)

        conn = psycopg2.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            dbname=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD
        )
        cursor = conn.cursor()

        # Làm sạch bảng trước khi nạp tập dữ liệu mới với tọa độ chuẩn
        cursor.execute("TRUNCATE TABLE real_estate_listings RESTART IDENTITY;")
        conn.commit()
        print(" -> Đã làm mới bảng real_estate_listings.")

        insert_query = """
        INSERT INTO real_estate_listings (
            source_id, property_type, province_name, district_name, ward_name,
            street_name, project_name, area, price, price_per_m2,
            bedroom_count, bathroom_count, floor_count, road_width, frontage_width,
            house_direction, has_so_do, is_lo_goc, is_no_hau, is_oto_do,
            geom, raw_description, published_at
        ) VALUES %s
        ON CONFLICT (source_id) DO NOTHING;
        """

        records = []
        for _, row in tqdm(df.iterrows(), total=len(df), desc="Chuẩn bị PostGIS WGS84"):
            lng = float(row["longitude"])
            lat = float(row["latitude"])
            geom_wkt = f"SRID=4326;POINT({lng} {lat})"
            
            records.append((
                str(row["source_id"]),
                str(row["property_type"]),
                str(row["province_name"]),
                str(row["district_name"]),
                str(row.get("ward_name", "")),
                str(row.get("street_name", "")),
                str(row.get("project_name", "")),
                float(row["area"]),
                float(row["price"]),
                float(row["price_per_m2"]),
                int(row["bedroom_count"]),
                int(row["bathroom_count"]),
                int(row["floor_count"]),
                float(row["road_width"]),
                float(row["frontage_width"]),
                str(row.get("house_direction", "Đông Nam")),
                bool(row["has_so_do"]),
                bool(row["is_lo_goc"]),
                bool(row["is_no_hau"]),
                bool(row["is_oto_do"]),
                geom_wkt,
                str(row.get("raw_description", ""))[:1000],
                row["published_at"]
            ))

        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            execute_values(
                cursor, 
                insert_query, 
                batch, 
                template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, ST_GeomFromEWKT(%s), %s, %s)"
            )
            conn.commit()

        cursor.execute("SELECT COUNT(*) FROM real_estate_listings;")
        count = cursor.fetchone()[0]
        print(f" -> Đã nạp thành công {count:,} bất động sản thật vào PostGIS!")

        cursor.close()
        conn.close()

def main():
    parser = argparse.ArgumentParser(description="MHD AVM Real Data Pipeline")
    parser.add_argument("--sample-limit", type=int, default=50000, help="Số bản ghi xử lý (mặc định 50,000)")
    parser.add_argument("--load-db", action="store_true", help="Nạp trực tiếp vào PostGIS")
    args = parser.parse_args()

    pipeline = MHDDataPipeline()
    shard_paths = list(pipeline.raw_dir.glob("*.parquet"))
    if not shard_paths:
        print("Không tìm thấy file parquet nào trong data/raw. Đang tải shard 0...")
        shard_paths = pipeline.download_shards(max_shards=1)

    df_clean = pipeline.clean_and_transform(shard_paths, sample_limit=args.sample_limit)
    pipeline.save_processed(df_clean)

    if args.load_db:
        pipeline.load_to_postgis(df_clean)

    print("\n=======================================================")
    print("HOÀN TẤT NẠP DỮ LIỆU THẬT CHO TOÀN BỘ HỆ THỐNG MHD AVM!")
    print("=======================================================\n")

if __name__ == "__main__":
    main()
