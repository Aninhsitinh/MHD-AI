import React from 'react';
import { Sparkles, GitCompare, Building, Newspaper, PhoneCall } from 'lucide-react';

export default function NavBar({ activeTab, onSelectTab, mobileMenuOpen, onCloseMobileMenu }) {
    const handleTabClick = (tabId) => {
        if (tabId === 'contact') {
            const footer = document.getElementById('contactFooter');
            if (footer) footer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (tabId === 'projects') {
            onSelectTab('home');
            const resultsSec = document.getElementById('resultsSection');
            if (resultsSec && resultsSec.style.display !== 'none') {
                resultsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const searchBox = document.getElementById('address_search');
                if (searchBox) {
                    searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    searchBox.focus();
                }
            }
        } else {
            onSelectTab(tabId);
        }
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

                        <button
                            type="button"
                            className="nav-tab-btn"
                            onClick={() => handleTabClick('projects')}
                        >
                            <Building size={16} />
                            <span>Dự Án BĐS</span>
                        </button>

                        <button
                            type="button"
                            className="nav-tab-btn"
                            onClick={() => handleTabClick('news')}
                        >
                            <Newspaper size={16} />
                            <span>Tin Tức Thị Trường</span>
                        </button>

                        <button
                            type="button"
                            className="nav-tab-btn"
                            onClick={() => handleTabClick('contact')}
                        >
                            <PhoneCall size={16} />
                            <span>Liên Hệ</span>
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

                        <button
                            type="button"
                            className="mobile-nav-link"
                            onClick={() => handleTabClick('projects')}
                        >
                            <Building size={18} />
                            <span>Dự Án BĐS</span>
                        </button>

                        <button
                            type="button"
                            className="mobile-nav-link"
                            onClick={() => handleTabClick('news')}
                        >
                            <Newspaper size={18} />
                            <span>Tin Tức Thị Trường</span>
                        </button>

                        <button
                            type="button"
                            className="mobile-nav-link"
                            onClick={() => handleTabClick('contact')}
                        >
                            <PhoneCall size={18} />
                            <span>Liên Hệ</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
