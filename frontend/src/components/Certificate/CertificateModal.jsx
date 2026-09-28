import React from 'react';
import { X, Printer, ShieldCheck, QrCode, CheckCircle2 } from 'lucide-react';

export default function CertificateModal({
    isOpen,
    onClose,
    valuationData,
    subjectData
}) {
    if (!isOpen || !valuationData) return null;

    const certCode = `MHD-AVM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date().toLocaleDateString('vi-VN');
    
    // Valid for 6 months
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + 6);
    const expDateStr = expDate.toLocaleDateString('vi-VN');

    const predictedPrice = valuationData.predicted_price || 0;
    const formatBillion = (val) => {
        if (!val) return '0 VNĐ';
        return `${(val).toLocaleString('vi-VN')} VNĐ`;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="cert-modal-backdrop active" onClick={onClose}>
            <div className="cert-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Control bar */}
                <div className="cert-modal-controls no-print">
                    <button type="button" className="btn-cert-print" onClick={handlePrint}>
                        <Printer size={16} />
                        <span>In Chứng Thư / Tải PDF</span>
                    </button>
                    <button type="button" className="btn-cert-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Certificate Sheet (Printable A4 document) */}
                <div className="cert-sheet">
                    {/* Header */}
                    <div className="cert-sheet-header">
                        <div className="cert-brand-row">
                            <div className="cert-brand-info">
                                <h1 className="cert-company-name">CÔNG TY CỔ PHẦN CÔNG NGHỆ THẨM ĐỊNH GIÁ MHD</h1>
                                <div className="cert-company-sub">MHD REAL ESTATE TECH • HỆ THỐNG THẨM ĐỊNH GIÁ TỰ ĐỘNG (AVM)</div>
                                <div className="cert-address-line">Trụ sở: 52 Trần Bình Trọng, P. Bình Lợi Trung, TP. Hồ Chí Minh | Hotline: 028 3515 3516</div>
                            </div>
                            <div className="cert-logo-box">
                                <img src="/logomhd.png" alt="MHD Logo" className="cert-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                        </div>

                        <div className="cert-title-block">
                            <h2 className="cert-main-title">CHỨNG THƯ THẨM ĐỊNH GIÁ ĐIỆN TỬ</h2>
                            <div className="cert-number-tag">Số hiệu: <strong>{certCode}</strong></div>
                            <div className="cert-date-tag">Ngày phát hành: {today} • Hiệu lực đến: {expDateStr}</div>
                        </div>
                    </div>

                    {/* Legal Notice */}
                    <div className="cert-legal-notice">
                        Chứng thư được tạo lập tự động từ Hệ thống Thẩm định giá Bất động sản MHD AVM, áp dụng phương pháp so sánh thị trường (CMA) và thuật toán học máy CatBoost Machine Learning theo Tiêu chuẩn Thẩm định giá Việt Nam.
                    </div>

                    {/* Section 1: Subject Property Specifications */}
                    <div className="cert-section-block">
                        <h3 className="cert-section-heading">I. THÔNG TIN ĐẶC ĐIỂM BẤT ĐỘNG SẢN THẨM ĐỊNH</h3>
                        <table className="cert-spec-table">
                            <tbody>
                                <tr>
                                    <td className="spec-label">Loại hình tài sản:</td>
                                    <td className="spec-value">{subjectData?.property_type || 'Nhà phố / Nhà riêng'}</td>
                                    <td className="spec-label">Diện tích đất sử dụng:</td>
                                    <td className="spec-value"><strong>{subjectData?.area || '--'} m²</strong></td>
                                </tr>
                                <tr>
                                    <td className="spec-label">Địa chỉ hành chính:</td>
                                    <td className="spec-value" colSpan={3}>
                                        {subjectData?.street_name ? `${subjectData.street_name}, ` : ''}
                                        {subjectData?.ward_name ? `${subjectData.ward_name}, ` : ''}
                                        {subjectData?.district_name ? `${subjectData.district_name}, ` : ''}
                                        {subjectData?.province_name || 'Hồ Chí Minh'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="spec-label">Chiều rộng mặt tiền:</td>
                                    <td className="spec-value">{subjectData?.frontage_width || '--'} m</td>
                                    <td className="spec-label">Độ rộng ngõ vào:</td>
                                    <td className="spec-value">{subjectData?.road_width || '--'} m</td>
                                </tr>
                                <tr>
                                    <td className="spec-label">Tình trạng pháp lý:</td>
                                    <td className="spec-value">{subjectData?.has_so_do ? 'Đã có Giấy chứng nhận (Sổ đỏ/hồng)' : 'Chưa xác thực'}</td>
                                    <td className="spec-label">Đặc trưng vị trí:</td>
                                    <td className="spec-value">
                                        {[
                                            subjectData?.is_lo_goc ? 'Lô góc' : null,
                                            subjectData?.is_oto_do ? 'Ô tô vào' : null,
                                            subjectData?.is_no_hau ? 'Nở hậu' : null
                                        ].filter(Boolean).join(', ') || 'Tiêu chuẩn'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 2: Valuation Result */}
                    <div className="cert-section-block">
                        <h3 className="cert-section-heading">II. KẾT QUẢ THẨM ĐỊNH GIÁ TRỊ THỊ TRƯỜNG</h3>
                        <div className="cert-result-highlight-box">
                            <div className="cert-result-label">TỔNG GIÁ TRỊ THẨM ĐỊNH ƯỚC TÍNH:</div>
                            <div className="cert-result-price-num">{formatBillion(predictedPrice)}</div>
                            <div className="cert-result-unit-price">
                                Đơn giá bình quân: <strong>{valuationData.unit_price ? `${(valuationData.unit_price / 1_000_000).toFixed(1)} Triệu VNĐ/m²` : '--'}</strong>
                            </div>
                            <div className="cert-result-range">
                                Khoảng giá thị trường tham chiếu: {formatBillion(valuationData.price_low)} ~ {formatBillion(valuationData.price_high)}
                            </div>
                        </div>
                    </div>

                    {/* Footer Stamps & Signatures */}
                    <div className="cert-signatures-row">
                        <div className="cert-qr-block">
                            <div className="cert-qr-frame">
                                <QrCode size={70} />
                            </div>
                            <div className="cert-qr-caption">Quét QR tra cứu trực tuyến</div>
                        </div>

                        <div className="cert-stamp-block">
                            <div className="cert-stamp-circle">
                                <div className="stamp-inner">
                                    <div className="stamp-co">MHD TECH CORP</div>
                                    <ShieldCheck size={28} className="stamp-icon" />
                                    <div className="stamp-txt">ĐÃ KÝ ĐIỆN TỬ</div>
                                    <div className="stamp-sub">HỆ THỐNG AVM</div>
                                </div>
                            </div>
                            <div className="cert-signer-title">HỘI ĐỒNG THẨM ĐỊNH GIÁ MHD</div>
                            <div className="cert-signer-note">Văn bản ký số tự động theo Nghị định 130/2018/NĐ-CP</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
