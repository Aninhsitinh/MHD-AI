"""
MHD Real Estate Tech - AI Valuation Model
Service: Spatial Service (Truy vấn không gian PostGIS & Parquet Fallback)
Truy vấn 5 bất động sản tương đồng lân cận trong bán kính không gian
Tự động fallback về bộ dữ liệu 35,000 BĐS sạch (data_mhd_clean.parquet) nếu CSDL offline
"""

import sys
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from config.settings import settings

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

class SpatialService:
    def __init__(self):
        self.db_config = {
            "host": settings.POSTGRES_HOST,
            "port": settings.POSTGRES_PORT,
            "dbname": settings.POSTGRES_DB,
            "user": settings.POSTGRES_USER,
            "password": settings.POSTGRES_PASSWORD,
            "connect_timeout": 3
        }
        self._df_cache: Optional[pd.DataFrame] = None
        self._parquet_path: Optional[Path] = None

    def _get_parquet_path(self) -> Optional[Path]:
        if self._parquet_path and self._parquet_path.exists():
            return self._parquet_path
        
        candidates = [
            settings.DATA_PROCESSED_FILE,
            Path("data/processed/data_mhd_clean.parquet"),
            Path("../data/processed/data_mhd_clean.parquet"),
            Path(__file__).resolve().parent.parent.parent / "data" / "processed" / "data_mhd_clean.parquet",
            Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed" / "data_mhd_clean.parquet",
        ]
        for c in candidates:
            if c.exists():
                self._parquet_path = c
                return c
        return None

    def _load_dataframe(self) -> Optional[pd.DataFrame]:
        if self._df_cache is not None:
            return self._df_cache
        p_path = self._get_parquet_path()
        if p_path and p_path.exists():
            try:
                self._df_cache = pd.read_parquet(p_path)
                return self._df_cache
            except Exception as e:
                print(f"[SpatialService] Cảnh báo lỗi đọc file parquet: {e}")
        return None

    def get_connection(self):
        return psycopg2.connect(**self.db_config)

    @staticmethod
    def format_standard_address(street: Optional[str], ward: Optional[str], district: Optional[str], province: Optional[str]) -> str:
        parts = []
        if street and street.strip():
            s = street.strip()
            if not any(s.lower().startswith(p) for p in ['đường', 'phố', 'ngõ', 'hẻm', 'quốc lộ']):
                s = f"Đường {s}"
            parts.append(s)
        if ward and ward.strip():
            w = ward.strip()
            if not any(w.lower().startswith(p) for p in ['phường', 'xã', 'thị trấn']):
                w = f"Phường {w}"
            parts.append(w)
        if district and district.strip():
            d = district.strip()
            if not any(d.lower().startswith(p) for p in ['quận', 'huyện', 'thị xã', 'thành phố', 'tp']):
                d = f"Quận {d}"
            parts.append(d)
        if province and province.strip():
            p = province.strip()
            if not any(p.lower().startswith(prefix) for prefix in ['thành phố', 'tỉnh', 'tp.']):
                p = f"TP. {p}"
            parts.append(p)
        return ", ".join(parts) if parts else "Khu vực lân cận"

    def _find_comparables_from_parquet(
        self,
        longitude: float,
        latitude: float,
        property_type: str = "Nhà riêng",
        target_area: float = 50.0,
        province_name: Optional[str] = None,
        district_name: Optional[str] = None,
        limit: int = 5,
        radius_meters: int = 2000
    ) -> List[Dict[str, Any]]:
        """Truy vấn 5 BĐS đối chứng trực tiếp từ 35,000 bản ghi dữ liệu sạch khi CSDL offline.
        BẮT BUỘC nằm trong bán kính tối đa 2000m (2.0km) so với tài sản thẩm định."""
        df = self._load_dataframe()
        if df is None or len(df) == 0:
            return []

        clean_dist = (district_name or "").strip()
        clean_prov = (province_name or "").strip()
        t_area = float(target_area or 50.0)
        p_type = (property_type or "Nhà riêng").strip()

        # Giới hạn bán kính nghiêm ngặt: Không vượt quá 2000m (2.0km)
        MAX_RADIUS_METERS = min(float(radius_meters or 2000.0), 2000.0)

        # 1. Tính khoảng cách Haversine (meters) cho toàn bộ tập dữ liệu
        dlat = np.radians(df['latitude'] - latitude)
        dlon = np.radians(df['longitude'] - longitude)
        a = np.sin(dlat / 2.0) ** 2 + np.cos(np.radians(latitude)) * np.cos(np.radians(df['latitude'])) * np.sin(dlon / 2.0) ** 2
        c = 2.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
        df_dist = np.round(6371000.0 * c, 1)

        # 2. BẮT BUỘC: Lọc các BĐS nằm trong bán kính <= MAX_RADIUS_METERS (2km)
        within_radius_mask = df_dist <= MAX_RADIUS_METERS
        if within_radius_mask.sum() == 0:
            return []

        sub = df[within_radius_mask].copy()
        sub['distance_meters'] = df_dist[within_radius_mask]

        # 3. Ưu tiên BĐS trong cùng Quận/Huyện nếu đủ số lượng
        if clean_dist:
            d_mask = sub['district_name'].str.contains(clean_dist, case=False, na=False)
            if d_mask.sum() >= limit:
                sub = sub[d_mask]

        # 4. Phân loại theo phân khúc loại hình BĐS
        if any(k in p_type for k in ['Chung cư', 'Căn hộ']):
            t_mask = sub['property_type'].str.contains('Chung cư|Căn hộ', case=False, na=False)
        elif 'Đất' in p_type:
            t_mask = sub['property_type'].str.contains('Đất', case=False, na=False)
        elif 'Biệt thự' in p_type:
            t_mask = sub['property_type'].str.contains('Biệt thự', case=False, na=False)
        elif 'Shophouse' in p_type:
            t_mask = sub['property_type'].str.contains('Shophouse', case=False, na=False)
        else:
            t_mask = sub['property_type'].str.contains('Nhà', case=False, na=False)

        if t_mask.sum() >= limit:
            candidates = sub[t_mask].copy()
        elif t_mask.sum() > 0:
            # Ghép nhóm cùng loại hình trước, sau đó bổ sung nhóm khác vẫn đảm bảo <= 2km
            candidates = pd.concat([sub[t_mask], sub[~t_mask]])
        else:
            candidates = sub.copy()

        # 5. Tính điểm số tương đồng (kết hợp khoảng cách và độ lệch diện tích)
        candidates['sim_score'] = np.abs(candidates['area'] - t_area) * 0.4 + candidates['distance_meters'] * 0.05
        top = candidates.sort_values('sim_score').head(limit)

        results = []
        for _, row in top.iterrows():
            dist_val = float(row['distance_meters'])
            if dist_val > MAX_RADIUS_METERS:
                continue # Đảm bảo tuyệt đối không vượt quá 2000m

            r_area = float(row.get('area', t_area)) if pd.notna(row.get('area')) else t_area
            r_price = float(row.get('price', 0)) if pd.notna(row.get('price')) else 0
            r_unit_price = float(row.get('price_per_m2', 0)) if pd.notna(row.get('price_per_m2')) else (r_price / r_area if r_area > 0 else 0)

            results.append({
                "name": str(row.get("name", "BĐS đối chứng thực tế")),
                "property_type": str(row.get("property_type", property_type)),
                "province_name": str(row.get("province_name", province_name or "Hồ Chí Minh")),
                "district_name": str(row.get("district_name", district_name or "Quận lân cận")),
                "ward_name": str(row.get("ward_name") or ""),
                "street_name": str(row.get("street_name") or ""),
                "area": round(r_area, 1),
                "price": round(r_price, 0),
                "price_per_m2": round(r_unit_price, 0),
                "road_width": float(row.get("road_width", 3.0)) if pd.notna(row.get("road_width")) else 3.0,
                "frontage_width": float(row.get("frontage_width", 4.0)) if pd.notna(row.get("frontage_width")) else 4.0,
                "floor_count": int(row.get("floor_count", 1)) if pd.notna(row.get("floor_count")) else 1,
                "bedroom_count": int(row.get("bedroom_count", 2)) if pd.notna(row.get("bedroom_count")) else 2,
                "bathroom_count": int(row.get("bathroom_count", 2)) if pd.notna(row.get("bathroom_count")) else 2,
                "house_direction": str(row.get("house_direction") or "Đông Nam"),
                "has_so_do": bool(row.get("has_so_do", True)),
                "is_lo_goc": bool(row.get("is_lo_goc", False)),
                "is_no_hau": bool(row.get("is_no_hau", False)),
                "is_oto_do": bool(row.get("is_oto_do", False)),
                "distance_meters": dist_val,
                "longitude": float(row.get("longitude", longitude)),
                "latitude": float(row.get("latitude", latitude)),
                "standard_address": self.format_standard_address(
                    str(row.get("street_name") or ""),
                    str(row.get("ward_name") or ""),
                    str(row.get("district_name") or clean_dist),
                    str(row.get("province_name") or clean_prov)
                )
            })

        return results

    def find_comparable_properties(
        self,
        longitude: float,
        latitude: float,
        property_type: str = "Nhà riêng",
        target_area: float = 50.0,
        province_name: Optional[str] = None,
        district_name: Optional[str] = None,
        radius_meters: int = 2000,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Tìm 5 BĐS tương đồng lân cận:
        BẮT BUỘC nằm trong bán kính tối đa 2000m (2.0km) so với tài sản thẩm định.
        Ưu tiên truy vấn PostGIS DB; tự động fallback về Parquet nếu CSDL không khả dụng
        """
        clean_dist = (district_name or "").strip()
        t_area = float(target_area or 50.0)
        p_type = (property_type or "Nhà riêng").strip()
        max_radius = min(float(radius_meters or 2000.0), 2000.0)

        # Thử kết nối PostGIS
        try:
            conn = self.get_connection()
        except Exception as conn_err:
            return self._find_comparables_from_parquet(
                longitude, latitude, property_type, target_area, province_name, district_name, limit, max_radius
            )

        try:
            # Ánh xạ loại hình BĐS chuẩn SQL
            if any(k in p_type for k in ['Chung cư', 'Căn hộ']):
                type_filter = "(property_type ILIKE '%%Chung cư%%' OR property_type ILIKE '%%Căn hộ%%')"
            elif 'Đất' in p_type:
                type_filter = "property_type ILIKE '%%Đất%%'"
            elif 'Biệt thự' in p_type:
                type_filter = "property_type ILIKE '%%Biệt thự%%'"
            elif 'Shophouse' in p_type:
                type_filter = "property_type ILIKE '%%Shophouse%%'"
            else:
                type_filter = "property_type ILIKE '%%Nhà%%'"

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                results = []

                # TIER 1: Cùng Quận/Huyện + Cùng Loại hình + Quy mô tương đồng + Trong bán kính <= 2000m
                if clean_dist:
                    q_tier1 = f"""
                    WITH candidates AS (
                        SELECT *,
                            ROUND(ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography)::numeric, 1) AS distance_meters,
                            ST_X(geom) AS longitude,
                            ST_Y(geom) AS latitude
                        FROM real_estate_listings
                        WHERE {type_filter}
                          AND LOWER(TRIM(district_name)) = LOWER(TRIM(%s))
                          AND area BETWEEN %s AND %s
                          AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
                    )
                    SELECT * FROM candidates
                    ORDER BY (ABS(area - %s) * 0.4 + distance_meters * 0.05) ASC
                    LIMIT %s;
                    """
                    cur.execute(q_tier1, (longitude, latitude, clean_dist, t_area * 0.4, t_area * 2.2, longitude, latitude, max_radius, t_area, limit))
                    results = cur.fetchall()

                # TIER 2: Nếu chưa đủ trong cùng quận, mở rộng trong bán kính <= 2000m cùng loại hình
                if len(results) < limit:
                    q_tier2 = f"""
                    WITH candidates AS (
                        SELECT *,
                            ROUND(ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography)::numeric, 1) AS distance_meters,
                            ST_X(geom) AS longitude,
                            ST_Y(geom) AS latitude
                        FROM real_estate_listings
                        WHERE {type_filter}
                          AND area BETWEEN %s AND %s
                          AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
                    )
                    SELECT * FROM candidates
                    ORDER BY (ABS(area - %s) * 0.4 + distance_meters * 0.05) ASC
                    LIMIT %s;
                    """
                    cur.execute(q_tier2, (longitude, latitude, t_area * 0.35, t_area * 2.5, longitude, latitude, max_radius, t_area, limit))
                    results = cur.fetchall()

                # TIER 3: Mở rộng loại hình nhưng VẪN PHẢI trong bán kính <= 2000m
                if len(results) < limit:
                    q_tier3 = f"""
                    WITH candidates AS (
                        SELECT *,
                            ROUND(ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography)::numeric, 1) AS distance_meters,
                            ST_X(geom) AS longitude,
                            ST_Y(geom) AS latitude
                        FROM real_estate_listings
                        WHERE area BETWEEN %s AND %s
                          AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
                    )
                    SELECT * FROM candidates
                    ORDER BY (ABS(area - %s) * 0.4 + distance_meters * 0.05) ASC
                    LIMIT %s;
                    """
                    cur.execute(q_tier3, (longitude, latitude, t_area * 0.3, t_area * 3.0, longitude, latitude, max_radius, t_area, limit))
                    results = cur.fetchall()

                formatted = []
                for row in results:
                    r = dict(row)
                    d_m = float(r["distance_meters"]) if r["distance_meters"] is not None else 0.0
                    if d_m > max_radius:
                        continue # Bắt buộc loại bỏ mọi bản ghi > 2000m
                    r["area"] = float(r["area"]) if r["area"] is not None else 0.0
                    r["price"] = float(r["price"]) if r["price"] is not None else 0.0
                    r["price_per_m2"] = float(r["price_per_m2"]) if r["price_per_m2"] is not None else 0.0
                    r["distance_meters"] = d_m
                    r["longitude"] = float(r["longitude"]) if r["longitude"] is not None else longitude
                    r["latitude"] = float(r["latitude"]) if r["latitude"] is not None else latitude
                    r["standard_address"] = self.format_standard_address(
                        r.get("street_name"),
                        r.get("ward_name"),
                        r.get("district_name"),
                        r.get("province_name")
                    )
                    formatted.append(r)

                if len(formatted) > 0:
                    return formatted

        except Exception as query_err:
            print(f"[SpatialService] Lỗi truy vấn PostGIS: {query_err}, chuyển sang Parquet fallback.")
        finally:
            try:
                conn.close()
            except Exception:
                pass

        # Fallback về Parquet nếu PostGIS không trả kết quả
        return self._find_comparables_from_parquet(
            longitude, latitude, property_type, target_area, province_name, district_name, limit, max_radius
        )

    def get_market_density_stats(self, longitude: float, latitude: float, radius_meters: int = 500) -> Dict[str, Any]:
        """Thống kê mật độ và đơn giá trung bình m² xung quanh khu vực"""
        try:
            conn = self.get_connection()
            query = """
            SELECT 
                COUNT(*) AS total_samples,
                COALESCE(ROUND(AVG(price_per_m2), 0), 0) AS avg_price_per_m2,
                COALESCE(ROUND(MIN(price_per_m2), 0), 0) AS min_price_per_m2,
                COALESCE(ROUND(MAX(price_per_m2), 0), 0) AS max_price_per_m2
            FROM real_estate_listings
            WHERE ST_DWithin(
                geom::geography, 
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, 
                %s
            );
            """
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (longitude, latitude, radius_meters))
                res = cur.fetchone()
                conn.close()
                return {
                    "total_samples": int(res["total_samples"]),
                    "avg_price_per_m2": float(res["avg_price_per_m2"]),
                    "min_price_per_m2": float(res["min_price_per_m2"]),
                    "max_price_per_m2": float(res["max_price_per_m2"])
                }
        except Exception:
            # Fallback từ dataframe
            df = self._load_dataframe()
            if df is not None and len(df) > 0:
                dlat = np.radians(df['latitude'] - latitude)
                dlon = np.radians(df['longitude'] - longitude)
                a = np.sin(dlat/2)**2 + np.cos(np.radians(latitude)) * np.cos(np.radians(df['latitude'])) * np.sin(dlon/2)**2
                dist_m = 6371000 * 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))
                nearby = df[dist_m <= max(radius_meters, 2500)]
                if len(nearby) > 0 and 'price_per_m2' in nearby.columns:
                    valid_prices = nearby['price_per_m2'].dropna()
                    if len(valid_prices) > 0:
                        return {
                            "total_samples": len(nearby),
                            "avg_price_per_m2": float(valid_prices.mean()),
                            "min_price_per_m2": float(valid_prices.min()),
                            "max_price_per_m2": float(valid_prices.max())
                        }
            return {
                "total_samples": 5,
                "avg_price_per_m2": 65000000.0,
                "min_price_per_m2": 45000000.0,
                "max_price_per_m2": 95000000.0
            }

    def resolve_admin_location(self, longitude: float, latitude: float) -> Dict[str, Any]:
        """
        Xác định chính xác Tỉnh/Thành, Quận/Huyện, Phường/Xã từ tọa độ WGS84
        """
        try:
            conn = self.get_connection()
            query = """
            SELECT district_name, province_name, ward_name, street_name,
                   ROUND(ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography)::numeric, 1) as distance_m
            FROM real_estate_listings
            WHERE geom IS NOT NULL
            ORDER BY geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
            LIMIT 10;
            """
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (longitude, latitude, longitude, latitude))
                rows = cur.fetchall()
                conn.close()
                if rows:
                    from collections import Counter
                    districts = [r["district_name"] for r in rows if r["district_name"]]
                    provinces = [r["province_name"] for r in rows if r["province_name"]]
                    wards = [r["ward_name"] for r in rows if r["ward_name"]]
                    best_district = Counter(districts).most_common(1)[0][0] if districts else "Quận 1"
                    best_province = Counter(provinces).most_common(1)[0][0] if provinces else "Hồ Chí Minh"
                    best_ward = Counter(wards).most_common(1)[0][0] if wards else ""
                    nearest = rows[0]
                    return {
                        "province_name": best_province,
                        "district_name": best_district,
                        "ward_name": best_ward,
                        "street_name": nearest.get("street_name") or "",
                        "distance_to_nearest_m": float(nearest.get("distance_m", 0))
                    }
        except Exception:
            pass

        # Fallback từ dataframe
        df = self._load_dataframe()
        if df is not None and len(df) > 0:
            dlat = np.radians(df['latitude'] - latitude)
            dlon = np.radians(df['longitude'] - longitude)
            a = np.sin(dlat/2)**2 + np.cos(np.radians(latitude)) * np.cos(np.radians(df['latitude'])) * np.sin(dlon/2)**2
            nearest_idx = a.argmin()
            nearest = df.iloc[nearest_idx]
            return {
                "province_name": str(nearest.get("province_name") or "Thành phố Hồ Chí Minh"),
                "district_name": str(nearest.get("district_name") or "Quận 1"),
                "ward_name": str(nearest.get("ward_name") or ""),
                "street_name": str(nearest.get("street_name") or ""),
                "distance_to_nearest_m": 0.0
            }

        return {
            "province_name": "Thành phố Hồ Chí Minh",
            "district_name": "Quận 1",
            "ward_name": "",
            "street_name": "",
            "distance_to_nearest_m": 0
        }

spatial_service = SpatialService()
