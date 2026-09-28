import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import TopBar from './components/Header/TopBar';
import NavBar from './components/Header/NavBar';
import LeafletMap from './components/Map/LeafletMap';
import ValuationForm from './components/Valuation/ValuationForm';
import ProgressModal from './components/Valuation/ProgressModal';
import ResultsSection from './components/Results/ResultsSection';
import CompareView from './components/Compare/CompareView';
import CertificateModal from './components/Certificate/CertificateModal';
import Footer from './components/Footer/Footer';
import { predictPropertyPrice } from './services/api';
import './styles/main.css';

export default function App() {
    // 1. Theme State
    const [theme, setTheme] = useState(() => localStorage.getItem('mhd_theme') || 'dark');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mhd_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // 2. Navigation State
    const [activeTab, setActiveTab] = useState('home'); // 'home' | 'compare'
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // 3. Form Data State
    const [formData, setFormData] = useState({
        property_type: "Nhà riêng",
        province_name: "Thành phố Hồ Chí Minh",
        district_name: "Quận 1",
        ward_name: "",
        street_name: "",
        area: 60,
        frontage_width: 4.0,
        road_width: 3.5,
        floor_count: 2,
        bedroom_count: 3,
        bathroom_count: 2,
        house_direction: "Đông Nam",
        has_so_do: true,
        is_oto_do: false,
        is_lo_goc: false,
        is_no_hau: false,
        latitude: 10.776889,
        longitude: 106.700806,
        customer_phone: ""
    });

    const [formattedAddress, setFormattedAddress] = useState('52 Trần Bình Trọng, Quận 1, TP. Hồ Chí Minh');

    const handleFormChange = (updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleLocationChange = ({ lat, lng, province, district, ward, street, formattedAddress: addr }) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            ...(province ? { province_name: province } : {}),
            ...(district ? { district_name: district } : {}),
            ...(ward ? { ward_name: ward } : {}),
            ...(street ? { street_name: street } : {})
        }));
        if (addr) setFormattedAddress(addr);
    };

    // 4. Valuation Results State
    const [valuationData, setValuationData] = useState(null);
    const [comparables, setComparables] = useState([]);
    const [marketStats, setMarketStats] = useState(null);

    // 5. 5-Step Progressive Modal State
    const [isProgressOpen, setIsProgressOpen] = useState(false);
    const [progressStep, setProgressStep] = useState(1);
    const [stepMessages, setStepMessages] = useState({});

    // 6. Certificate Modal State
    const [certModalOpen, setCertModalOpen] = useState(false);

    // 7. Toast Message State
    const [toastMessage, setToastMessage] = useState('');
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3500);
    };

    // Progressive Valuation Submit Handler
    const handleValuationSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!formData.area || formData.area <= 0) {
            showToast('Vui lòng nhập diện tích hợp lệ!');
            return;
        }

        setIsProgressOpen(true);
        setProgressStep(1);
        setStepMessages({});

        // Step 1: Geocoding
        setStepMessages(prev => ({ ...prev, 1: 'Đang xác thực tọa độ WGS84 & ranh giới hành chính...' }));
        await new Promise(r => setTimeout(r, 400));
        setProgressStep(2);

        // Step 2: KNN Spatial Query
        setStepMessages(prev => ({ ...prev, 2: 'Đang truy vấn PostGIS quét 5 BĐS đối chứng lân cận...' }));
        await new Promise(r => setTimeout(r, 450));
        setProgressStep(3);

        // Step 3: CMA Standards Adjustment
        setStepMessages(prev => ({ ...prev, 3: 'Đang chuẩn hóa hệ số điều chỉnh mặt tiền, ngõ, pháp lý...' }));
        await new Promise(r => setTimeout(r, 400));
        setProgressStep(4);

        // Step 4: Machine Learning Inference
        setStepMessages(prev => ({ ...prev, 4: 'Mô hình CatBoost v2.4 đang tổng hợp dự báo...' }));

        try {
            const result = await predictPropertyPrice({
                property_type: formData.property_type,
                province_name: formData.province_name,
                district_name: formData.district_name,
                ward_name: formData.ward_name,
                street_name: formData.street_name,
                area: Number(formData.area),
                bedroom_count: Number(formData.bedroom_count),
                bathroom_count: Number(formData.bathroom_count),
                floor_count: Number(formData.floor_count),
                road_width: Number(formData.road_width),
                frontage_width: Number(formData.frontage_width),
                house_direction: formData.house_direction,
                has_so_do: Boolean(formData.has_so_do),
                is_lo_goc: Boolean(formData.is_lo_goc),
                is_no_hau: Boolean(formData.is_no_hau),
                is_oto_do: Boolean(formData.is_oto_do),
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
                customer_phone: formData.customer_phone || undefined
            });

            // Step 5: Complete & SHAP Attribution
            setProgressStep(5);
            setStepMessages(prev => ({ ...prev, 5: 'Hoàn tất chứng thư thẩm định & phân tích TreeSHAP' }));
            await new Promise(r => setTimeout(r, 380));

            // Populate Results
            if (result && result.valuation) {
                const val = result.valuation;
                const comps = result.comparable_properties || [];
                const stats = result.market_stats || null;

                setValuationData({
                    ...val,
                    area: formData.area,
                    address: formattedAddress
                });
                setComparables(comps);
                setMarketStats(stats);

                // Confetti blast
                try {
                    confetti({
                        particleCount: 80,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                } catch (e) {}
            }

            setTimeout(() => {
                setIsProgressOpen(false);
                const el = document.getElementById('resultsSection');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);

        } catch (err) {
            console.error('Valuation error', err);
            setIsProgressOpen(false);
            showToast(`Lỗi thẩm định: ${err.message}`);
        }
    };

    return (
        <div className="mhd-app-root">
            {/* Header: TopBar & Navigation Bar */}
            <TopBar
                theme={theme}
                onToggleTheme={toggleTheme}
                mobileMenuOpen={mobileMenuOpen}
                onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
            />

            <NavBar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                mobileMenuOpen={mobileMenuOpen}
                onCloseMobileMenu={() => setMobileMenuOpen(false)}
            />

            {/* Main Content Area */}
            <main className="main-content-layout">
                {activeTab === 'home' && (
                    <div className="home-view-container">
                        {/* 2-Column Hero: Left Valuation Form, Right Interactive Map */}
                        <div className="hero-2column-grid">
                            <div className="hero-col-form">
                                <ValuationForm
                                    formData={formData}
                                    onChange={handleFormChange}
                                    onSubmit={handleValuationSubmit}
                                    isLoading={isProgressOpen}
                                />
                            </div>

                            <div className="hero-col-map">
                                <LeafletMap
                                    theme={theme}
                                    coords={{ lat: formData.latitude, lng: formData.longitude }}
                                    onLocationChange={handleLocationChange}
                                    addressDisplay={formattedAddress}
                                    radius={500}
                                />
                            </div>
                        </div>

                        {/* Results Section */}
                        {valuationData && (
                            <ResultsSection
                                valuationData={valuationData}
                                onOpenCertificate={() => setCertModalOpen(true)}
                                onViewComparables={() => {
                                    setActiveTab('compare');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'compare' && (
                    <CompareView
                        comparables={comparables}
                        subjectData={{
                            ...formData,
                            ...(valuationData || {})
                        }}
                        onBackHome={() => {
                            setActiveTab('home');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    />
                )}
            </main>

            {/* Footer */}
            <Footer />

            {/* 5-Step Progressive AI Valuation Modal */}
            <ProgressModal
                isOpen={isProgressOpen}
                currentStep={progressStep}
                stepMessages={stepMessages}
            />

            {/* Official Electronic Valuation Certificate Modal */}
            <CertificateModal
                isOpen={certModalOpen}
                onClose={() => setCertModalOpen(false)}
                valuationData={valuationData}
                subjectData={formData}
            />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="mhd-toast-notification">
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
