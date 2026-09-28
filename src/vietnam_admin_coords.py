"""
MHD Real Estate Tech - AI Valuation Model
Tọa độ địa lý hành chính thực tế (Real Centroid Coordinates) của các Tỉnh/Thành phố và Quận/Huyện Việt Nam
Phục vụ lưu vào spatial_poi_cache và chuẩn hóa tọa độ không gian PostGIS WGS84 (Point, 4326)
"""

import re
from typing import Dict, Tuple, Optional

# TỌA ĐỘ THỰC TẾ 63 TỈNH/THÀNH PHỐ VIỆT NAM (WGS84: Latitude, Longitude)
REAL_PROVINCE_COORDINATES: Dict[str, Tuple[float, float]] = {
    "hà nội": (21.028511, 105.854167),
    "hồ chí minh": (10.776889, 106.700806),
    "đà nẵng": (16.054407, 108.202167),
    "hải phòng": (20.844912, 106.688084),
    "cần thơ": (10.045162, 105.746853),
    "an giang": (10.3759, 105.4185),
    "bà rịa - vũng tàu": (10.5422, 107.2429),
    "bắc giang": (21.2731, 106.1946),
    "bắc kạn": (22.1470, 105.8348),
    "bạc liêu": (9.2941, 105.7278),
    "bắc ninh": (21.1861, 106.0763),
    "bến tre": (10.2433, 106.3756),
    "bình định": (13.7830, 109.2197),
    "bình dương": (11.1322, 106.6667),
    "bình phước": (11.7512, 106.8837),
    "bình thuận": (10.9273, 108.1017),
    "cà mau": (9.1769, 105.1501),
    "cao bằng": (22.6667, 105.2500),
    "đắk lắk": (12.6667, 108.0500),
    "đắk nông": (12.0000, 107.6833),
    "điện biên": (21.3833, 103.0167),
    "đồng nai": (10.9574, 106.8427),
    "đồng tháp": (10.4578, 105.6331),
    "gia lai": (13.9833, 108.0000),
    "hà giang": (22.8233, 104.9836),
    "hà nam": (20.5833, 105.9167),
    "hà tĩnh": (18.3333, 105.9000),
    "hải dương": (20.9333, 106.3167),
    "hậu giang": (9.7833, 105.4667),
    "hòa bình": (20.8133, 105.3383),
    "hưng yên": (20.6500, 106.0500),
    "khánh hòa": (12.2388, 109.1967),
    "kiên giang": (10.0125, 105.0809),
    "kon tum": (14.3500, 108.0000),
    "lai châu": (22.3833, 103.4667),
    "lâm đồng": (11.9416, 108.4383),
    "lạng sơn": (21.8500, 106.7500),
    "lào cai": (22.4833, 103.9667),
    "long an": (10.5333, 106.4000),
    "nam định": (20.4333, 106.1667),
    "nghệ an": (18.6667, 105.6667),
    "ninh bình": (20.2500, 105.9667),
    "ninh thuận": (11.5667, 108.9833),
    "phú thọ": (21.3167, 105.4000),
    "phú yên": (13.0833, 109.3000),
    "quảng bình": (17.4833, 106.6000),
    "quảng nam": (15.5667, 108.4833),
    "quảng ngãi": (15.1167, 108.8000),
    "quảng ninh": (20.9505, 107.0734),
    "quảng trị": (16.7500, 107.1833),
    "sóc trăng": (9.6000, 105.9667),
    "sơn la": (21.3167, 103.9167),
    "tây ninh": (11.3000, 106.1000),
    "thái bình": (20.4500, 106.3333),
    "thái nguyên": (21.5833, 105.8333),
    "thanh hóa": (19.8000, 105.7667),
    "thừa thiên huế": (16.4667, 107.6000),
    "tiền giang": (10.3500, 106.3500),
    "trà vinh": (9.9333, 106.3333),
    "tuyên quang": (21.8167, 105.2167),
    "vĩnh long": (10.2500, 105.9667),
    "vĩnh phúc": (21.3000, 105.6000),
    "yên bái": (21.7167, 104.8667)
}

# TỌA ĐỘ THỰC TẾ CHI TIẾT QUẬN/HUYỆN TRỌNG ĐIỂM (TP.HCM, HÀ NỘI, ĐÀ NẴNG, BÌNH DƯƠNG...)
REAL_DISTRICT_COORDINATES: Dict[str, Tuple[float, float]] = {
    # --- TP. HỒ CHÍ MINH (22 Quận/Huyện) ---
    "hồ chí minh_quận 1": (10.775659, 106.700424),
    "hồ chí minh_quận 3": (10.784360, 106.684440),
    "hồ chí minh_quận 4": (10.764420, 106.704230),
    "hồ chí minh_quận 5": (10.754040, 106.663410),
    "hồ chí minh_quận 6": (10.748090, 106.635190),
    "hồ chí minh_quận 7": (10.734030, 106.721830),
    "hồ chí minh_quận 8": (10.724080, 106.628620),
    "hồ chí minh_quận 10": (10.771590, 106.667230),
    "hồ chí minh_quận 11": (10.762930, 106.650190),
    "hồ chí minh_quận 12": (10.867150, 106.641340),
    "hồ chí minh_bình thạnh": (10.810580, 106.709140),
    "hồ chí minh_tân bình": (10.801460, 106.653420),
    "hồ chí minh_tân phú": (10.790050, 106.628170),
    "hồ chí minh_phú nhuận": (10.799190, 106.680260),
    "hồ chí minh_gò vấp": (10.838840, 106.665790),
    "hồ chí minh_bình tân": (10.765430, 106.598210),
    "hồ chí minh_thủ đức": (10.849409, 106.753706),
    "hồ chí minh_thành phố thủ đức": (10.849409, 106.753706),
    "hồ chí minh_bình chánh": (10.687390, 106.593880),
    "hồ chí minh_hóc môn": (10.883920, 106.593880),
    "hồ chí minh_nhà bè": (10.695320, 106.729110),
    "hồ chí minh_củ chi": (11.006670, 106.495000),
    "hồ chí minh_cần giờ": (10.411420, 106.954670),

    # --- HÀ NỘI (30 Quận/Huyện) ---
    "hà nội_ba đình": (21.034710, 105.828230),
    "hà nội_hoàn kiếm": (21.030650, 105.852440),
    "hà nội_đống đa": (21.018240, 105.827290),
    "hà nội_hai bà trưng": (21.006930, 105.854420),
    "hà nội_cầu giấy": (21.031340, 105.792510),
    "hà nội_thanh xuân": (20.993750, 105.811820),
    "hà nội_hoàng mai": (20.978010, 105.845830),
    "hà nội_long biên": (21.036220, 105.894340),
    "hà nội_tây hồ": (21.066430, 105.819510),
    "hà nội_nam từ liêm": (21.012540, 105.766320),
    "hà nội_bắc từ liêm": (21.063810, 105.759240),
    "hà nội_hà đông": (20.971210, 105.777010),
    "hà nội_gia lâm": (21.033330, 105.950000),
    "hà nội_đông anh": (21.139620, 105.845830),
    "hà nội_thanh trì": (20.942730, 105.845830),
    "hà nội_hoài đức": (21.025340, 105.706120),
    "hà nội_sóc sơn": (21.283330, 105.850000),
    "hà nội_mê linh": (21.183330, 105.716670),
    "hà nội_thạch thất": (21.016670, 105.533330),
    "hà nội_quốc oai": (20.983330, 105.633330),
    "hà nội_chương mỹ": (20.883330, 105.683330),
    "hà nội_thường tín": (20.866670, 105.866670),
    "hà nội_đan phượng": (21.096410, 105.679320),
    "hà nội_sơn tây": (21.137830, 105.504220),

    # --- ĐÀ NẴNG (8 Quận/Huyện) ---
    "đà nẵng_hải châu": (16.054407, 108.219806),
    "đà nẵng_thanh khê": (16.060120, 108.188450),
    "đà nẵng_sơn trà": (16.088610, 108.243120),
    "đà nẵng_ngũ hành sơn": (16.002440, 108.258330),
    "đà nẵng_liên chiểu": (16.082530, 108.146520),
    "đà nẵng_cẩm lệ": (16.018230, 108.196320),
    "đà nẵng_hòa vang": (15.987620, 108.115430),

    # --- BÌNH DƯƠNG ---
    "bình dương_thủ dầu một": (10.980450, 106.651870),
    "bình dương_dĩ an": (10.906940, 106.772500),
    "bình dương_thuận an": (10.925280, 106.698060),
    "bình dương_bến cát": (11.134440, 106.606940),
    "bình dương_tân uyên": (11.083330, 106.783330),

    # --- KHÁNH HÒA ---
    "khánh hòa_nha trang": (12.238791, 109.196749),
    "khánh hòa_cam ranh": (11.921390, 109.159170),

    # --- HẢI PHÒNG ---
    "hải phòng_hồng bàng": (20.865440, 106.671320),
    "hải phòng_ngô quyền": (20.854230, 106.699120),
    "hải phòng_lê chân": (20.844120, 106.680450),
    "hải phòng_hải an": (20.835420, 106.732140),

    # --- CẦN THƠ ---
    "cần thơ_ninh kiều": (10.033330, 105.783330),
    "cần thơ_bình thủy": (10.071670, 105.738330),
    "cần thơ_cái răng": (9.983330, 105.766670)
}

def normalize_text(text: Optional[str]) -> str:
    """Chuẩn hóa chuỗi địa danh hành chính để tra cứu chính xác"""
    if not text or not isinstance(text, str):
        return ""
    text = text.strip().lower()
    text = re.sub(r"^(thành phố|tỉnh|quận|huyện|thị xã|tp\.|tx\.)\s*", "", text)
    return text.strip()

def get_real_coordinates(province: Optional[str], district: Optional[str]) -> Tuple[float, float]:
    """
    Trả về tọa độ địa lý WGS84 THẬT (latitude, longitude)
    Tra cứu theo Quận/Huyện trước, nếu không có fallback về Tỉnh/Thành
    """
    clean_p = normalize_text(province)
    clean_d = normalize_text(district)

    # 1. Tìm theo Quận/Huyện kết hợp Tỉnh
    for prov_key in ["hồ chí minh", "hà nội", "đà nẵng", "bình dương", "khánh hòa", "hải phòng", "cần thơ"]:
        if prov_key in clean_p or clean_p in prov_key:
            dict_key = f"{prov_key}_{clean_d}"
            if dict_key in REAL_DISTRICT_COORDINATES:
                return REAL_DISTRICT_COORDINATES[dict_key]
            # Thử tìm chứa chuỗi con
            for k, coords in REAL_DISTRICT_COORDINATES.items():
                if k.startswith(prov_key) and (clean_d in k or k.endswith(clean_d)):
                    return coords

    # 2. Tìm theo tên Quận/Huyện đơn lẻ
    for k, coords in REAL_DISTRICT_COORDINATES.items():
        district_part = k.split("_", 1)[-1]
        if clean_d and (clean_d == district_part or clean_d in district_part):
            return coords

    # 3. Fallback về Tọa độ Tỉnh/Thành thật
    if clean_p in REAL_PROVINCE_COORDINATES:
        return REAL_PROVINCE_COORDINATES[clean_p]

    for p_key, coords in REAL_PROVINCE_COORDINATES.items():
        if clean_p and (clean_p in p_key or p_key in clean_p):
            return coords

    # Mặc định: Trụ sở MHD Real Estate (Trung tâm TP.HCM)
    return (10.776889, 106.700806)
