import React from 'react';
import { Sparkles, GitCompare } from 'lucide-react';

export default function NavBar({ activeTab, onSelectTab, mobileMenuOpen, onCloseMobileMenu }) {
    const handleTabClick = (tabId) => {
        onSelectTab(tabId);
        if (mobileMenuOpen) onCloseMobileMenu();
    };

    return (
        <>
            <nav className="nav-bar-container">
                <div className="nav-bar-inner">
                    <div className="nav-tabs-group">
                        <button
                            type="button"
                            className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
                            onClick={() => handleTabClick('home')}
                        >
                            <Sparkles size={16} />
                            <span>Thẩm Định Giá AI</span>
                        </button>

                        <button
                            type="button"
                            className={`nav-tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
                            onClick={() => handleTabClick('compare')}
                        >
                            <GitCompare size={16} />
                            <span>5 BĐS Đối Chứng (CMA)</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="mobile-nav-drawer active">
                    <div className="mobile-nav-inner">
                        <button
                            type="button"
                            className={`mobile-nav-link ${activeTab === 'home' ? 'active' : ''}`}
                            onClick={() => handleTabClick('home')}
                        >
                            <Sparkles size={18} />
                            <span>Thẩm Định Giá AI</span>
                        </button>

                        <button
                            type="button"
                            className={`mobile-nav-link ${activeTab === 'compare' ? 'active' : ''}`}
                            onClick={() => handleTabClick('compare')}
                        >
                            <GitCompare size={18} />
                            <span>5 BĐS Đối Chứng (CMA)</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
