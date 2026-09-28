"""
MHD Real Estate Tech - AI Valuation Model
Tọa độ địa lý hành chính thực tế (Real Administrative Coordinates)
Dùng để gán tọa độ GPS WGS84 (Point, 4326) thật cho các bất động sản dựa theo Tỉnh/Thành & Quận/Huyện
"""

from typing import Tuple, Optional
from src.vietnam_admin_coords import get_real_coordinates

def get_approximate_coordinates(
    province: Optional[str], 
    district: Optional[str], 
    add_jitter: bool = False
) -> Tuple[float, float]:
    """
    Trả về tọa độ WGS84 THẬT theo danh mục địa danh hành chính Việt Nam.
    """
    lat, lng = get_real_coordinates(province, district)
    return round(lat, 6), round(lng, 6)
