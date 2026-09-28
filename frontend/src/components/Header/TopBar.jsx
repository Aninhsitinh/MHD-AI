import React from 'react';
import { Sun, Moon, Phone, Menu, X, CheckCircle2 } from 'lucide-react';

export default function TopBar({ theme, onToggleTheme, mobileMenuOpen, onToggleMobileMenu }) {
    return (
        <header className="topbar">
            <div className="topbar-inner">
                {/* Brand Logo & Name */}
                <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img 
                        src="/logomhd.png" 
                        alt="MHD Real Estate Tech" 
                        className="brand-logo" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="brand-text">
                        <div className="brand-name">
                            <span>MHD</span> VALUATION
                        </div>
                        <div className="brand-tagline">Hệ Thống Thẩm Định Giá Bất Động Sản AI AVM</div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="topbar-actions">
                    {/* AI Engine Status Badge */}
                    <div className="topbar-ai-status">
                        <span className="ai-status-dot"></span>
                        <span>CatBoost v2.4 Online</span>
                    </div>

                    {/* Hotline Button */}
                    <a href="tel:02835153516" className="topbar-hotline-cta" title="Hotline tư vấn chuyên sâu">
                        <span className="hotline-pulse-dot"></span>
                        <Phone size={14} />
                        <span>028 3515 3516</span>
                    </a>

                    {/* Theme Toggle Button */}
                    <button 
                        type="button" 
                        className="btn-theme-toggle" 
                        onClick={onToggleTheme} 
                        title="Chuyển chế độ Sáng / Tối"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                    </button>

                    {/* Mobile Hamburger Menu Toggle */}
                    <button 
                        type="button" 
                        className="btn-mobile-menu" 
                        onClick={onToggleMobileMenu}
                        aria-label="Toggle Navigation Menu"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
        </header>
    );
}
