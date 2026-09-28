import React from 'react';
import { Check } from 'lucide-react';

export default function ProgressModal({ isOpen, currentStep, stepMessages }) {
    if (!isOpen) return null;

    const steps = [
        {
            num: 1,
            title: "Xác thực vị trí hành chính & trích xuất GIS",
            desc: stepMessages[1] || "Đang xử lý tọa độ OpenStreetMap & ranh giới..."
        },
        {
            num: 2,
            title: "Quét không gian KNN 5 BĐS đối chứng lân cận",
            desc: stepMessages[2] || "Đang đối soát giao dịch thực tế PostGIS..."
        },
        {
            num: 3,
            title: "Hệ số tương đồng phương pháp so sánh thị trường (CMA)",
            desc: stepMessages[3] || "Tính toán điều chỉnh diện tích, mặt tiền, ngõ..."
        },
        {
            num: 4,
            title: "Mô hình CatBoost v2.4 tính toán định giá",
            desc: stepMessages[4] || "Đang tổng hợp suy luận mô hình học máy..."
        },
        {
            num: 5,
            title: "Hoàn thiện chứng thư & phân tích TreeSHAP",
            desc: stepMessages[5] || "Đang đóng dấu điện tử & xuất báo cáo..."
        }
    ];

    return (
        <div className="ai-progress-modal active" style={{ display: 'flex' }}>
            <div className="ai-progress-card">
                <div className="ai-progress-header">
                    <div className="ai-progress-spinner">
                        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                            <circle cx="22" cy="22" r="18" stroke="var(--border-subtle)" stroke-width="4" />
                            <circle
                                cx="22"
                                cy="22"
                                r="18"
                                stroke="var(--brand)"
                                stroke-width="4"
                                strokeDasharray="113"
                                strokeDashoffset="60"
                                strokeLinecap="round"
                            >
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 22 22"
                                    to="360 22 22"
                                    dur="1.2s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </svg>
                    </div>
                    <div className="ai-progress-title">Hệ Thống Đang Xử Lý Thẩm Định AI</div>
                    <div className="ai-progress-desc">
                        Mô hình CatBoost v2.4 &amp; PostGIS Spatial Engine đang phân tích
                    </div>
                </div>

                <div className="ai-steps-list">
                    {steps.map(s => {
                        const isDone = currentStep > s.num;
                        const isActive = currentStep === s.num;
                        const itemClass = isDone ? 'ai-step-item done' : isActive ? 'ai-step-item active' : 'ai-step-item';

                        return (
                            <div key={s.num} className={itemClass}>
                                <div className="ai-step-icon">
                                    {isDone ? <Check size={14} strokeWidth={3} /> : s.num}
                                </div>
                                <div className="ai-step-text">
                                    <div className="ai-step-name">{s.title}</div>
                                    <div className="ai-step-status">{s.desc}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
