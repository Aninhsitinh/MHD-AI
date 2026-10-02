"""
MHD Real Estate Tech - Ward-Level Geocoding Script
===================================================
Geocode 1.832 combo (tỉnh, quận, phường) qua Nominatim API miễn phí.
Kết quả lưu vào data/processed/ward_coordinates.json
Chỉ cần chạy 1 lần duy nhất, sau đó dùng cache mãi mãi.

Rate limit: 1 request/giây (tuân thủ Nominatim usage policy)
Ước tính: ~30 phút cho 1.832 combo
"""

import json
import time
import sys
import io
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

import pandas as pd

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

OUTPUT_FILE = Path("data/processed/ward_coordinates.json")
PARQUET_FILE = Path("data/processed/data_mhd_clean.parquet")
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "MHD-AI-Valuation/1.0 (internal geocoding)"

# Load existing cache nếu có (để resume nếu bị gián đoạn)
cache = {}
if OUTPUT_FILE.exists():
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        cache = json.load(f)
    print(f"[Resume] Đã có {len(cache)} combo trong cache, tiếp tục từ đây...")


def geocode_ward(province: str, district: str, ward: str) -> tuple:
    """Geocode 1 phường qua Nominatim API. Trả về (lat, lng) hoặc (None, None)."""
    # Xây dựng query tìm kiếm
    query_parts = []
    if ward:
        query_parts.append(ward)
    if district:
        query_parts.append(district)
    if province:
        query_parts.append(province)

    query = ", ".join(query_parts) + ", Vietnam"

    params = urllib.parse.urlencode({
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "vn"
    })

    url = f"{NOMINATIM_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lng = float(data[0]["lon"])
                return (lat, lng)
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"  [WARN] Lỗi geocode '{query}': {e}")
    except Exception as e:
        print(f"  [ERROR] Unexpected: {e}")

    return (None, None)


def save_cache():
    """Lưu cache ra file JSON."""
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def main():
    # Load dữ liệu
    df = pd.read_parquet(PARQUET_FILE)
    has_ward = df["ward_name"].notna() & (df["ward_name"] != "")
    combos = df[has_ward][["province_name", "district_name", "ward_name"]].drop_duplicates()
    combos = combos.sort_values(["province_name", "district_name", "ward_name"]).reset_index(drop=True)

    total = len(combos)
    already = sum(1 for _, r in combos.iterrows()
                  if f"{r['province_name']}_{r['district_name']}_{r['ward_name']}" in cache)
    remaining = total - already

    print(f"Tổng combo (tỉnh, quận, phường): {total}")
    print(f"Đã có trong cache: {already}")
    print(f"Cần geocode: {remaining}")
    print(f"Ước tính thời gian: {remaining} giây ≈ {remaining // 60} phút")
    print("-" * 60)

    success = 0
    failed = 0
    save_interval = 50  # Lưu cache mỗi 50 request

    for i, (_, row) in enumerate(combos.iterrows()):
        province = str(row["province_name"])
        district = str(row["district_name"])
        ward = str(row["ward_name"])
        key = f"{province}_{district}_{ward}"

        if key in cache:
            continue

        lat, lng = geocode_ward(province, district, ward)

        if lat is not None and lng is not None:
            cache[key] = {"lat": lat, "lng": lng, "province": province, "district": district, "ward": ward}
            success += 1
            print(f"  [{len(cache)}/{total}] ✓ {ward}, {district}, {province} → ({lat:.5f}, {lng:.5f})")
        else:
            # Thử lại chỉ với quận + tỉnh (fallback)
            cache[key] = None  # Đánh dấu đã thử để không retry
            failed += 1
            print(f"  [{len(cache)}/{total}] ✗ {ward}, {district}, {province}")

        # Rate limit: 1 request/giây
        time.sleep(1.1)

        # Lưu cache định kỳ
        if (success + failed) % save_interval == 0:
            save_cache()
            print(f"  [SAVED] {len(cache)} entries → {OUTPUT_FILE}")

    # Lưu lần cuối
    save_cache()
    print("=" * 60)
    print(f"HOÀN TẤT: {success} thành công, {failed} thất bại")
    print(f"File output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
