import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="footer" id="contactFooter">
            <div>
                <strong>MHD Valuation</strong> — Hệ Thống Thẩm Định Giá Bất Động Sản Tự Động • Bản Quyền MHD Real Estate Tech
            </div>
            <div className="footer-links-row">
                <span className="footer-info-item">
                    <MapPin size={13} style={{ color: 'var(--brand)' }} />
                    <span>52 Trần Bình Trọng, Phường Bình Lợi Trung, TP. Hồ Chí Minh</span>
                </span>
                <span className="footer-info-item">
                    <Phone size={13} style={{ color: 'var(--brand)' }} />
                    <span>Hotline: <a href="tel:02835153516" className="footer-link">028 3515 3516</a></span>
                </span>
                <span className="footer-info-item">
                    <Mail size={13} style={{ color: 'var(--brand)' }} />
                    <span>Email: <a href="mailto:info@mhd.com.vn" className="footer-link">info@mhd.com.vn</a></span>
                </span>
            </div>
        </footer>
    );
}
