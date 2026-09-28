"""
MHD Real Estate Tech - AI Valuation Model
Module: NLP Extractor (Trích xuất các yếu tố nhạy cảm từ mô tả tin đăng)
Trích xuất: has_so_do, is_lo_goc, is_no_hau, is_oto_do
"""

import re
from typing import Dict, Any, Union
import pandas as pd

class NLPExtractor:
    def __init__(self):
        # 1. Sổ đỏ / Sổ hồng / Pháp lý
        self.so_do_patterns = [
            r"\bsổ\s*(?:đỏ|hồng|riêng|hoàn\s*công)\b",
            r"\bpháp\s*lý\s*(?:chuẩn|rõ\s*ràng|đầy\s*đủ|sạch)\b",
            r"\bchính\s*chủ\s*sổ\b",
            r"\bshr\b",
            r"\bđã\s*(?:có\s*sổ|hoàn\s*công)\b",
            r"\bsẵn\s*sổ\b",
            r"\bsổ\s*vuông\s*vắn\b"
        ]
        self.re_so_do = re.compile("|".join(self.so_do_patterns), re.IGNORECASE)

        # 2. Lô góc / 2 mặt tiền
        self.lo_goc_patterns = [
            r"\blô\s*góc\b",
            r"\bcăn\s*góc\b",
            r"\b2\s*mặt\s*(?:tiền|thoáng|ngõ|đường)\b",
            r"\bhai\s*mặt\s*(?:tiền|thoáng|ngõ|đường)\b",
            r"\bvị\s*trí\s*góc\b"
        ]
        self.re_lo_goc = re.compile("|".join(self.lo_goc_patterns), re.IGNORECASE)

        # 3. Nở hậu
        self.no_hau_patterns = [
            r"\bnở\s*hậu\b",
            r"\bđầu\s*hẹp\s*đuôi\s*nở\b",
            r"\bhậu\s*(?:nở|phát)\b"
        ]
        self.re_no_hau = re.compile("|".join(self.no_hau_patterns), re.IGNORECASE)

        # 4. Ngõ ô tô / Ô tô đỗ / Gara ô tô
        self.oto_do_patterns = [
            r"\bô\s*tô\s*(?:đỗ|vào\s*nhà|ngủ\s*trong\s*nhà|tránh|qua\s*nhà|tận\s*cửa|đỗ\s*cửa|vào\s*tận\s*nơi)\b",
            r"\bxe\s*hơi\s*(?:ngủ\s*trong\s*nhà|vào\s*nhà|đỗ\s*cửa)\b",
            r"\bngõ\s*ô\s*tô\b",
            r"\bđường\s*ô\s*tô\b",
            r"\bđường\s*(?:thông|rộng)\s*ô\s*tô\b",
            r"\bxe\s*tải\s*(?:vào|đỗ)\b",
            r"\bgara\s*ô\s*tô\b",
            r"\bô\s*tô\s*7\s*chỗ\b"
        ]
        self.re_oto_do = re.compile("|".join(self.oto_do_patterns), re.IGNORECASE)

    def extract_from_text(self, text: Union[str, None]) -> Dict[str, bool]:
        """Trích xuất 4 cờ đặc trưng từ một chuỗi văn bản mô tả"""
        if not text or not isinstance(text, str):
            return {
                "has_so_do": False,
                "is_lo_goc": False,
                "is_no_hau": False,
                "is_oto_do": False
            }
        
        # Tiền xử lý văn bản cơ bản
        clean_text = text.lower()

        return {
            "has_so_do": bool(self.re_so_do.search(clean_text)),
            "is_lo_goc": bool(self.re_lo_goc.search(clean_text)),
            "is_no_hau": bool(self.re_no_hau.search(clean_text)),
            "is_oto_do": bool(self.re_oto_do.search(clean_text))
        }

    def process_dataframe(self, df: pd.DataFrame, text_col: str = "description") -> pd.DataFrame:
        """Trích xuất hàng loạt cho DataFrame (tối ưu hóa tốc độ với vectorized regex)"""
        text_series = df[text_col].fillna("").astype(str).str.lower()
        
        df["has_so_do"] = text_series.str.contains(self.re_so_do, regex=True)
        df["is_lo_goc"] = text_series.str.contains(self.re_lo_goc, regex=True)
        df["is_no_hau"] = text_series.str.contains(self.re_no_hau, regex=True)
        df["is_oto_do"] = text_series.str.contains(self.re_oto_do, regex=True)
        
        return df

if __name__ == "__main__":
    extractor = NLPExtractor()
    sample = "Bán nhà riêng phố Thái Hà Đống Đa, DT 45m2x5 tầng, ngõ ô tô tránh đỗ cửa, nở hậu, sổ đỏ chính chủ sẵn sàng giao dịch."
    res = extractor.extract_from_text(sample)
    print("Mẫu thử nghiệm trích xuất NLP:")
    print(res)
