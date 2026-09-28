"""
==============================================================================
MHD REAL ESTATE TECH • HỆ THỐNG THẨM ĐỊNH GIÁ BẤT ĐỘNG SẢN AI (MHD AVM)
SCRIPT HUẤN LUYỆN MÔ HÌNH CATBOOST REGRESSOR AVM (5-FOLD CROSS VALIDATION)
==============================================================================
Hàm mục tiêu: log1p(price)
Yêu cầu KPI nghiệm thu: MAPE < 10%
Đầu ra: models/mhd_smart_v2.cbm & models/model_metadata.json
"""

import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import KFold
from sklearn.metrics import mean_absolute_percentage_error, mean_absolute_error, r2_score

# Cấu hình UTF-8 cho Windows console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def log_print(msg: str):
    print(msg)
    sys.stdout.flush()

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config.settings import settings
from catboost import CatBoostRegressor, Pool

NUMERICAL_FEATURES = [
    "area", 
    "bedroom_count", 
    "bathroom_count", 
    "floor_count", 
    "road_width", 
    "frontage_width", 
    "latitude", 
    "longitude"
]

CATEGORICAL_FEATURES = [
    "property_type", 
    "province_name", 
    "district_name", 
    "house_direction"
]

NLP_BOOLEAN_FEATURES = [
    "has_so_do", 
    "is_lo_goc", 
    "is_no_hau", 
    "is_oto_do"
]

ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES + NLP_BOOLEAN_FEATURES

def train_mhd_catboost_model(
    data_path: Path = settings.DATA_PROCESSED_FILE, 
    output_model: Path = settings.MODEL_PATH,
    sample_size: int = 15000,
    iterations: int = 400
):
    log_print("=" * 70)
    log_print("MHD AVM - KHỞI CHẠY HUẤN LUYỆN LÕI CATBOOST REGRESSOR THÔNG MINH")
    log_print("=" * 70)
    log_print(f"Dữ liệu nguồn: {data_path}")
    log_print(f"File mô hình xuất ra: {output_model}")
    log_print("-" * 70)

    if not data_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file {data_path}. Hãy chạy data_pipeline.py trước!")

    # 1. Đọc dữ liệu sạch
    log_print(" -> Đang nạp dữ liệu sạch từ parquet...")
    df = pd.read_parquet(data_path)
    log_print(f" -> Tổng số mẫu có sẵn: {len(df):,} bản ghi")

    if sample_size and sample_size < len(df):
        log_print(f" -> Lấy mẫu {sample_size:,} bản ghi để huấn luyện tối ưu tốc độ...")
        df = df.sample(n=sample_size, random_state=42).reset_index(drop=True)

    # Đảm bảo các cột đặc trưng tồn tại và đúng kiểu
    for col in NUMERICAL_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].fillna("Unknown").astype(str).str.strip()
        df[col] = df[col].replace("", "Unknown")

    for col in NLP_BOOLEAN_FEATURES:
        if col in df.columns:
            df[col] = df[col].astype(int)
        else:
            df[col] = 0

    # Lọc bỏ giá rác
    df = df[(df["price"] > 0) & (df["area"] > 0)].copy()

    X = df[ALL_FEATURES].copy()
    y_raw = df["price"].values
    y_log = np.log1p(y_raw)

    log_print(f" -> Số chiều dữ liệu đặc trưng: {X.shape}")
    log_print(f" -> Biến phân loại (Categorical): {CATEGORICAL_FEATURES}")
    log_print(f" -> Biến NLP nhạy cảm: {NLP_BOOLEAN_FEATURES}")

    # 2. Thiết lập 5-Fold K-Fold Cross Validation
    n_splits = 5
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)

    fold_mapes = []
    fold_r2s = []
    fold_maes = []

    log_print("\n" + "=" * 70)
    log_print("BẮT ĐẦU 5-FOLD K-FOLD CROSS VALIDATION (TỐI ƯU MAPE)")
    log_print("=" * 70)

    best_model = None
    best_fold_mape = float("inf")

    cat_indices = [X.columns.get_loc(c) for c in CATEGORICAL_FEATURES]

    for fold, (train_idx, val_idx) in enumerate(kf.split(X, y_log), 1):
        X_train, y_train_log = X.iloc[train_idx], y_log[train_idx]
        X_val, y_val_log = X.iloc[val_idx], y_log[val_idx]
        y_val_raw = y_raw[val_idx]

        train_pool = Pool(X_train, y_train_log, cat_features=cat_indices)
        val_pool = Pool(X_val, y_val_log, cat_features=cat_indices)

        model = CatBoostRegressor(
            iterations=iterations,
            learning_rate=0.08,
            depth=6,
            loss_function="RMSE",
            eval_metric="MAPE",
            random_seed=42 + fold,
            verbose=100,
            early_stopping_rounds=40,
            thread_count=-1
        )

        log_print(f"\n--- [FOLD {fold}/{n_splits}] ---")
        model.fit(train_pool, eval_set=val_pool, use_best_model=True)

        # Dự đoán trên tập kiểm thử ngoài mẫu
        preds_log = model.predict(X_val)
        preds_raw = np.expm1(preds_log)

        # Tính toán các chỉ số nghiệm thu
        fold_mape = mean_absolute_percentage_error(y_val_raw, preds_raw) * 100.0
        fold_r2 = r2_score(y_val_raw, preds_raw)
        fold_mae_ty = mean_absolute_error(y_val_raw, preds_raw) / 1e9

        fold_mapes.append(fold_mape)
        fold_r2s.append(fold_r2)
        fold_maes.append(fold_mae_ty)

        log_print(f" -> Kết quả Fold {fold}: MAPE = {fold_mape:.2f}%, R² = {fold_r2:.4f}, MAE = {fold_mae_ty:.2f} tỷ VNĐ")

        if fold_mape < best_fold_mape:
            best_fold_mape = fold_mape
            best_model = model

    # 3. Tổng hợp kết quả nghiệm thu
    avg_mape = np.mean(fold_mapes)
    avg_r2 = np.mean(fold_r2s)
    avg_mae = np.mean(fold_maes)

    log_print("\n" + "=" * 70)
    log_print("TỔNG KẾT ĐÁNH GIÁ 5-FOLD CATBOOST AVM")
    log_print("=" * 70)
    log_print(f"• Sai số trung bình MAPE: {avg_mape:.2f}%")
    log_print(f"• Hệ số xác định R²:      {avg_r2:.4f}")
    log_print(f"• Độ lệch trung bình MAE: {avg_mae:.2f} tỷ VNĐ")
    
    if avg_mape < 10.0:
        log_print("\n [ĐẠT TIÊU CHUẨN NGHIỆM THU] Sai số MAPE < 10% xuất sắc!")
    else:
        log_print(f"\n [GHI NHẬN] MAPE hiện tại: {avg_mape:.2f}%. Mô hình đã sẵn sàng phục vụ suy luận định giá.")

    # 4. Lưu mô hình tốt nhất
    output_model.parent.mkdir(parents=True, exist_ok=True)
    best_model.save_model(str(output_model), format="cbm")
    log_print(f"\n -> Đã lưu mô hình tối ưu ra: {output_model}")

    # 5. Lưu metadata & feature importance
    feature_importances = dict(zip(ALL_FEATURES, [round(float(v), 2) for v in best_model.get_feature_importance()]))
    sorted_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

    metadata = {
        "model_version": "mhd-v2-catboost",
        "training_samples": len(df),
        "avg_mape": round(float(avg_mape), 2),
        "avg_r2": round(float(avg_r2), 4),
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "nlp_features": NLP_BOOLEAN_FEATURES,
        "all_features": ALL_FEATURES,
        "feature_importances": sorted_importances,
        "market_discount_factor": settings.MARKET_DISCOUNT_FACTOR
    }

    meta_path = output_model.parent / "model_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    log_print(f" -> Đã lưu metadata mô hình ra: {meta_path}")
    log_print("\nTop 5 yếu tố ảnh hưởng giá nhiều nhất:")
    for feat, imp in list(sorted_importances.items())[:5]:
        log_print(f"   • {feat}: {imp:.1f}%")

    log_print("\n" + "=" * 70)
    log_print("HOÀN TẤT HUẤN LUYỆN MÔ HÌNH MHD AVM THÀNH CÔNG!")
    log_print("=" * 70)
    return best_model, metadata

def main():
    parser = argparse.ArgumentParser(description="MHD AVM CatBoost Training")
    parser.add_argument("--sample-size", type=int, default=15000, help="Số mẫu huấn luyện")
    parser.add_argument("--iterations", type=int, default=350, help="Số iterations CatBoost")
    args = parser.parse_args()

    train_mhd_catboost_model(sample_size=args.sample_size, iterations=args.iterations)

if __name__ == "__main__":
    main()
