import React from 'react';
import { 
    CheckCircle2, TrendingUp, AlertCircle, FileText, GitCompare, 
    ShieldAlert, ArrowUpRight, ArrowDownRight, Layers 
} from 'lucide-react';

export default function ResultsSection({ 
    valuationData, 
    onOpenCertificate, 
    onViewComparables 
}) {
    if (!valuationData) return null;

    const {
        predicted_price = 0,
        price_low = 0,
        price_high = 0,
        unit_price = 0,
        confidence_score = 0.9,
        confidence_grade = 'A',
        shap_breakdown = [],
        area = 50,
        address = ''
    } = valuationData;

    // Helper currency formatter
    const formatBillion = (val) => {
        if (!val || isNaN(val)) return '0 Tỷ';
        const bil = val / 1_000_000_000;
        return `${bil.toFixed(2)} Tỷ VNĐ`;
    };

    const formatMillionPerM2 = (val) => {
        if (!val || isNaN(val)) return '0 Tr/m²';
        const mil = val / 1_000_000;
        return `${mil.toFixed(1)} Triệu/m²`;
    };

    const confidencePercent = Math.min(100, Math.round(confidence_score * 100));

    return (
        <section id="resultsSection" className="results-section-wrapper">
            <div className="results-card-container">
                {/* Top Valuation Hero Box */}
                <div className="results-hero-box">
                    <div className="results-header-tag">
                        <CheckCircle2 size={15} style={{ color: 'var(--green)' }} />
                        <span>KẾT QUẢ THẨM ĐỊNH GIÁ TRỊ THỊ TRƯỜNG THỰC TẾ</span>
                    </div>

                    <div className="results-main-price-row">
                        <div className="price-column-main">
                            <span className="price-label">Giá Trị Thẩm Định Ước Tính:</span>
                            <div className="price-primary-text">
                                {formatBillion(predicted_price)}
                            </div>
                            <div className="unit-price-subtext">
                                Đơn giá tương đương: <strong>{formatMillionPerM2(unit_price)}</strong>
                            </div>
                        </div>

                        {/* Confidence Metric Badge */}
                        <div className="confidence-metric-box">
                            <div className="confidence-title">Độ Tin Cậy AI (CatBoost)</div>
                            <div className="confidence-score-val">
                                {confidencePercent}%
                                <span className="grade-badge">{confidence_grade}</span>
                            </div>
                            <div className="confidence-progress-bar">
                                <div 
                                    className="confidence-fill" 
                                    style={{ width: `${confidencePercent}%` }}
                                ></div>
                            </div>
                            <div className="confidence-desc">Sai số chuẩn MAPE &lt; 8.5%</div>
                        </div>
                    </div>

                    {/* Price Range Ribbon */}
                    <div className="price-range-ribbon">
                        <div className="range-item">
                            <span className="range-label">Khoảng giá tối thiểu:</span>
                            <span className="range-val">{formatBillion(price_low)}</span>
                        </div>
                        <div className="range-divider">~</div>
                        <div className="range-item">
                            <span className="range-label">Khoảng giá tối đa:</span>
                            <span className="range-val">{formatBillion(price_high)}</span>
                        </div>
                    </div>

                    {/* Action CTA Buttons */}
                    <div className="results-cta-actions">
                        <button
                            type="button"
                            className="btn-action-primary"
                            onClick={onOpenCertificate}
                        >
                            <FileText size={17} />
                            <span>XEM CHỨNG THƯ THẨM ĐỊNH ĐIỆN TỬ</span>
                        </button>

                        <button
                            type="button"
                            className="btn-action-secondary"
                            onClick={onViewComparables}
                        >
                            <GitCompare size={17} />
                            <span>ĐỐI CHIẾU 5 BĐS TƯƠNG ĐỒNG (CMA)</span>
                        </button>
                    </div>
                </div>

                {/* TreeSHAP Feature Attribution / Giải Trình Các Yếu Tố Giá */}
                {shap_breakdown && shap_breakdown.length > 0 && (
                    <div className="shap-breakdown-card">
                        <div className="shap-card-header">
                            <div className="shap-title-group">
                                <Layers size={17} style={{ color: 'var(--brand)' }} />
                                <h3>Giải Thích Động Lực Định Giá (TreeSHAP Feature Importance)</h3>
                            </div>
                            <span className="shap-badge">Độ nhạy thuật toán</span>
                        </div>
                        <p className="shap-desc">
                            Mức độ tác động tăng (+) hoặc giảm (-) của các thuộc tính BĐS tới giá trị dự báo:
                        </p>

                        <div className="shap-bars-grid">
                            {shap_breakdown.map((item, idx) => {
                                const isPositive = item.impact >= 0;
                                const impactPercent = Math.min(100, Math.abs(item.impact * 100));

                                return (
                                    <div key={idx} className="shap-bar-item">
                                        <div className="shap-bar-header">
                                            <span className="shap-feat-name">{item.feature_name}</span>
                                            <span className={`shap-feat-val ${isPositive ? 'positive' : 'negative'}`}>
                                                {isPositive ? '+' : ''}{item.formatted_impact || `${(item.impact * 100).toFixed(1)}%`}
                                            </span>
                                        </div>
                                        <div className="shap-track">
                                            <div
                                                className={`shap-fill ${isPositive ? 'positive' : 'negative'}`}
                                                style={{ width: `${Math.max(8, impactPercent)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
