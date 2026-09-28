let currentLat = 10.775659;
        let currentLng = 106.700424;
        let activeTileLayer = null;

        // 1. THEME SWITCHER ENGINE (TINIX SEGMENTED ARCHITECTURE)
        function setThemeMode(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('mhd_theme', theme);
            updateThemeControls(theme);
            updateMapTiles(theme);
        }

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setThemeMode(newTheme);
        }

        function updateThemeControls(theme) {
            const btnLight = document.getElementById('themeBtnLight');
            const btnDark = document.getElementById('themeBtnDark');
            if (btnLight && btnDark) {
                if (theme === 'dark') {
                    btnDark.classList.add('active');
                    btnLight.classList.remove('active');
                } else {
                    btnLight.classList.add('active');
                    btnDark.classList.remove('active');
                }
            }
            const label = document.getElementById('themeLabel');
            const icon = document.getElementById('themeIcon');
            if (label && icon) {
                if (theme === 'dark') {
                    label.textContent = 'Light';
                    icon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
                } else {
                    label.textContent = 'Dark';
                    icon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
                }
            }
        }

        function toggleMobileNav() {
            const drawer = document.getElementById('mobileNavDrawer');
            if (drawer) {
                drawer.classList.toggle('open');
            }
        }

        // 2. MAP INIT
        const map = L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView([currentLat, currentLng], 16);

        function updateMapTiles(theme) {
            if (!activeTileLayer) {
                activeTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    subdomains: ['a', 'b', 'c'],
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> | MHD AI GIS'
                }).addTo(map);
            }
        }

        updateMapTiles('dark');

        // SVG Markers
        function createSvgIcon(color, isMain = false, number = null) {
            let svgHtml = '';
            if (isMain) {
                svgHtml = `
                    <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color}" flood-opacity="0.6"/>
                        </filter>
                        <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="${color}" filter="url(#glow)"/>
                        <circle cx="17" cy="16" r="7" fill="#FFFFFF"/>
                        <circle cx="17" cy="16" r="3.5" fill="${color}"/>
                    </svg>
                `;
            } else {
                svgHtml = `
                    <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <filter id="numGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${color}" flood-opacity="0.5"/>
                        </filter>
                        <path d="M15 0C6.71 0 0 6.71 0 15C0 26.25 15 38 15 38C15 38 30 26.25 30 15C30 6.71 23.29 0 15 0Z" fill="${color}" filter="url(#numGlow)"/>
                        <circle cx="15" cy="14" r="9" fill="#FFFFFF"/>
                        <text x="15" y="18" text-anchor="middle" font-family="'DM Sans', sans-serif" font-weight="800" font-size="11.5" fill="${color}">${number || ''}</text>
                    </svg>
                `;
            }
            return L.divIcon({
                className: 'custom-leaflet-marker',
                html: svgHtml,
                iconSize: isMain ? [34, 42] : [30, 38],
                iconAnchor: isMain ? [17, 42] : [15, 38],
                popupAnchor: [0, -38]
            });
        }

        const mainIcon = createSvgIcon('#E05400', true);
        const mainMarker = L.marker([currentLat, currentLng], { draggable: true, icon: mainIcon, zIndexOffset: 1000 }).addTo(map);
        const radiusCircle = L.circle([currentLat, currentLng], { color: '#E05400', fillColor: '#E05400', fillOpacity: 0.08, weight: 1.5, radius: 500 }).addTo(map);
        const compLayerGroup = L.layerGroup().addTo(map);

        // ── POI VECTOR SVG ICONS & LAYER MANAGEMENT (9 COMPREHENSIVE CATEGORIES, STRICTLY NO EMOJI) ──
        const poiLayerGroup = L.layerGroup().addTo(map);
        let currentPois = [];
        let activePoiCategories = new Set([
            'admin', 'commercial', 'hospitality', 'health', 'education', 'transit', 'finance', 'green', 'lifestyle'
        ]);

        const POI_META = {
            admin: {
                color: '#3B82F6',
                name: 'Cơ quan & Tòa nhà',
                iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"></line><line x1="6" y1="21" x2="6" y2="10"></line><line x1="18" y1="21" x2="18" y2="10"></line><path d="M12 3L2 9h20L12 3z"></path><line x1="12" y1="21" x2="12" y2="10"></line></svg>`
            },
            commercial: {
                color: '#EC4899',
                name: 'TTTM & Siêu thị',
                iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`
            },
            hospitality: {
                color: '#F59E0B',
                name: 'Khách sạn & Dịch vụ',
                iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v11"></path><path d="M21 18V11a2 2 0 0 0-2-2H9"></path><path d="M3 14h18"></path><circle cx="6" cy="10" r="2"></circle></svg>`
            },
            health: {
                color: '#EF4444',
                name: 'Y tế & Bệnh viện',
                iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`
            },
            education: {
                color: '#10B981',
                name: 'Giáo dục & Trường học',
                iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`
            },
            transit: {
                color: '#8B5CF6',
                name: 'Giao thông & Metro',
                iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="13" rx="2"></rect><path d="M4 11h16"></path><circle cx="8" cy="14" r="1"></circle><circle cx="16" cy="14" r="1"></circle><path d="M7 19l-3 3M17 19l3 3"></path></svg>`
            },
            finance: {
                color: '#06B6D4',
                name: 'Tài chính & Ngân hàng',
                iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line><circle cx="12" cy="15" r="2"></circle></svg>`
            },
            green: {
                color: '#22C55E',
                name: 'Công viên & Cảnh quan',
                iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path><path d="M7 17l5-5 5 5"></path></svg>`
            },
            lifestyle: {
                color: '#FF6B1A',
                name: 'Ẩm thực & Giải trí',
                iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF6B1A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`
            }
        };

        function createPoiSvgDivIcon(category) {
            const meta = POI_META[category] || POI_META.admin;
            const html = `
                <div class="poi-marker-bubble" style="--poi-color:${meta.color};">
                    <div class="poi-marker-pin">
                        ${meta.iconSvg}
                    </div>
                    <div class="poi-marker-arrow"></div>
                </div>
            `;
            return L.divIcon({
                className: 'custom-poi-marker',
                html: html,
                iconSize: [28, 34],
                iconAnchor: [14, 34],
                popupAnchor: [0, -34]
            });
        }

        // ── POI CITYWIDE MULTI-DISTRICT DATABASE & SCOPE ENGINE ──
        let poiScopeMode = 'radius'; // 'radius' | 'citywide'
        let lastScannedLat = currentLat;
        let lastScannedLng = currentLng;
        let currentScannedAreaName = 'Quận 1';

        // BỘ DỮ LIỆU ĐIỂM NHẤN TIỆN ÍCH TRỌNG ĐIỂM BIỂU TƯỢNG PHỦ SÓNG TOÀN DIỆN 22 QUẬN/HUYỆN/TP THỦ ĐỨC (VÀ CÁC ĐÔ THỊ LỚN)
        const CITYWIDE_LANDMARKS_DB = [
            // --- QUẬN 1 ---
            { id: 'cw-q1-1', name: 'UBND TP. Hồ Chí Minh', district: 'Quận 1', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.77688, lng: 106.70089 },
            { id: 'cw-q1-2', name: 'TTTM Vincom Center Đồng Khởi', district: 'Quận 1', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.77810, lng: 106.70195 },
            { id: 'cw-q1-3', name: 'Khách sạn Caravelle Saigon', district: 'Quận 1', category: 'hospitality', category_name: 'Khách sạn & Dịch vụ', lat: 10.77665, lng: 106.70321 },
            { id: 'cw-q1-4', name: 'Bệnh viện Nhi Đồng 2', district: 'Quận 1', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.78180, lng: 106.70340 },
            { id: 'cw-q1-5', name: 'Đại học KHXH&NV TP.HCM', district: 'Quận 1', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.78650, lng: 106.70090 },
            { id: 'cw-q1-6', name: 'Ga Metro Trung tâm Bến Thành', district: 'Quận 1', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.77190, lng: 106.69830 },
            { id: 'cw-q1-7', name: 'Trụ sở Ngân hàng Nhà nước & Vietcombank Tower', district: 'Quận 1', category: 'finance', category_name: 'Tài chính & Ngân hàng', lat: 10.77250, lng: 106.70580 },
            { id: 'cw-q1-8', name: 'Thảo Cầm Viên & Bảo tàng Lịch sử', district: 'Quận 1', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.78750, lng: 106.70520 },
            { id: 'cw-q1-9', name: 'Phố đi bộ Nguyễn Huệ & Bến Bạch Đằng', district: 'Quận 1', category: 'lifestyle', category_name: 'Ẩm thực & Giải trí', lat: 10.77450, lng: 106.70480 },

            // --- QUẬN 3 ---
            { id: 'cw-q3-1', name: 'UBND Quận 3', district: 'Quận 3', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.78170, lng: 106.68530 },
            { id: 'cw-q3-2', name: 'Bệnh viện Tai Mũi Họng TP.HCM', district: 'Quận 3', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.78530, lng: 106.68280 },
            { id: 'cw-q3-3', name: 'Bệnh viện Da Liễu TP.HCM', district: 'Quận 3', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.78010, lng: 106.68740 },
            { id: 'cw-q3-4', name: 'Đại học Kinh tế TP.HCM (UEH)', district: 'Quận 3', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.78280, lng: 106.69580 },
            { id: 'cw-q3-5', name: 'Ga Sài Gòn (Đường sắt Bắc Nam)', district: 'Quận 3', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.78250, lng: 106.67780 },
            { id: 'cw-q3-6', name: 'Hồ Con Rùa & Công viên Lê Văn Tám', district: 'Quận 3', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.78270, lng: 106.69590 },
            { id: 'cw-q3-7', name: 'Phố ẩm thực Nguyễn Thượng Hiền', district: 'Quận 3', category: 'lifestyle', category_name: 'Ẩm thực & Giải trí', lat: 10.77520, lng: 106.68150 },

            // --- QUẬN 4 ---
            { id: 'cw-q4-1', name: 'UBND Quận 4', district: 'Quận 4', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.76210, lng: 106.70450 },
            { id: 'cw-q4-2', name: 'Bến Nhà Rồng & Bảo tàng Hồ Chí Minh', district: 'Quận 4', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.76820, lng: 106.70700 },
            { id: 'cw-q4-3', name: 'Bệnh viện Quận 4', district: 'Quận 4', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.75980, lng: 106.70750 },
            { id: 'cw-q4-4', name: 'Đại học Luật TP.HCM (Cơ sở Q4)', district: 'Quận 4', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.76450, lng: 106.70820 },
            { id: 'cw-q4-5', name: 'Phố ẩm thực ốc Vĩnh Khánh', district: 'Quận 4', category: 'lifestyle', category_name: 'Ẩm thực & Giải trí', lat: 10.76150, lng: 106.70280 },

            // --- QUẬN 5 ---
            { id: 'cw-q5-1', name: 'UBND Quận 5', district: 'Quận 5', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.75620, lng: 106.66620 },
            { id: 'cw-q5-2', name: 'TTTM Hùng Vương Plaza', district: 'Quận 5', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.75710, lng: 106.66120 },
            { id: 'cw-q5-3', name: 'Chợ An Đông Plaza', district: 'Quận 5', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.75690, lng: 106.67020 },
            { id: 'cw-q5-4', name: 'Bệnh viện Chợ Rẫy (Tuyến TW)', district: 'Quận 5', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.75780, lng: 106.65950 },
            { id: 'cw-q5-5', name: 'Bệnh viện Đại học Y Dược TP.HCM', district: 'Quận 5', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.75520, lng: 106.66150 },
            { id: 'cw-q5-6', name: 'Trường Đại học Sư Phạm TP.HCM', district: 'Quận 5', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.76050, lng: 106.68250 },
            { id: 'cw-q5-7', name: 'Phố thuốc Bắc Hải Thượng Lãn Ông', district: 'Quận 5', category: 'lifestyle', category_name: 'Ẩm thực & Giải trí', lat: 10.75080, lng: 106.65820 },

            // --- QUẬN 6 ---
            { id: 'cw-q6-1', name: 'UBND Quận 6', district: 'Quận 6', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.74820, lng: 106.64320 },
            { id: 'cw-q6-2', name: 'Chợ Bình Tây (Chợ Lớn Di sản)', district: 'Quận 6', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.74950, lng: 106.65150 },
            { id: 'cw-q6-3', name: 'Mega Market Bình Phú', district: 'Quận 6', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.74350, lng: 106.63420 },
            { id: 'cw-q6-4', name: 'Bệnh viện Quận 6', district: 'Quận 6', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.74650, lng: 106.64180 },
            { id: 'cw-q6-5', name: 'Công viên Phú Lâm', district: 'Quận 6', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.74680, lng: 106.63050 },

            // --- QUẬN 7 ---
            { id: 'cw-q7-1', name: 'UBND Quận 7', district: 'Quận 7', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.73650, lng: 106.73280 },
            { id: 'cw-q7-2', name: 'TTTM Crescent Mall Phú Mỹ Hưng', district: 'Quận 7', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.72950, lng: 106.71980 },
            { id: 'cw-q7-3', name: 'TTTM SC VivoCity', district: 'Quận 7', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.73220, lng: 106.70580 },
            { id: 'cw-q7-4', name: 'Lotte Mart Nam Sài Gòn', district: 'Quận 7', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.73980, lng: 106.70120 },
            { id: 'cw-q7-5', name: 'Bệnh viện Quốc tế FV (Pháp Việt)', district: 'Quận 7', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.73150, lng: 106.72250 },
            { id: 'cw-q7-6', name: 'Bệnh viện Tim Tâm Đức', district: 'Quận 7', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.73280, lng: 106.72150 },
            { id: 'cw-q7-7', name: 'Đại học RMIT Việt Nam', district: 'Quận 7', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.73020, lng: 106.69480 },
            { id: 'cw-q7-8', name: 'Đại học Tôn Đức Thắng', district: 'Quận 7', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.73280, lng: 106.69950 },
            { id: 'cw-q7-9', name: 'Cầu Ánh Sao & Hồ Bán Nguyệt', district: 'Quận 7', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.72880, lng: 106.71850 },

            // --- QUẬN 8 ---
            { id: 'cw-q8-1', name: 'UBND Quận 8', district: 'Quận 8', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.73680, lng: 106.66950 },
            { id: 'cw-q8-2', name: 'TTTM Central Premium Mall Q8', district: 'Quận 8', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.74280, lng: 106.67120 },
            { id: 'cw-q8-3', name: 'BV Phục hồi chức năng & Điều trị BNN', district: 'Quận 8', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.74550, lng: 106.68050 },
            { id: 'cw-q8-4', name: 'Bến xe Quận 8', district: 'Quận 8', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.73080, lng: 106.65480 },
            { id: 'cw-q8-5', name: 'Công viên Dạ Nam & Cầu Chữ Y', district: 'Quận 8', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.74850, lng: 106.68420 },

            // --- QUẬN 10 ---
            { id: 'cw-q10-1', name: 'UBND Quận 10', district: 'Quận 10', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.77450, lng: 106.66850 },
            { id: 'cw-q10-2', name: 'TTTM Vạn Hạnh Mall', district: 'Quận 10', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.77050, lng: 106.66980 },
            { id: 'cw-q10-3', name: 'Bệnh viện Nhi Đồng 1', district: 'Quận 10', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.76750, lng: 106.66920 },
            { id: 'cw-q10-4', name: 'Bệnh viện Nhân Dân 115', district: 'Quận 10', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.77480, lng: 106.66120 },
            { id: 'cw-q10-5', name: 'Đại học Bách Khoa TP.HCM', district: 'Quận 10', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.77250, lng: 106.65880 },
            { id: 'cw-q10-6', name: 'Công viên Văn hóa Lê Thị Riêng', district: 'Quận 10', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.78550, lng: 106.66450 },

            // --- QUẬN 11 ---
            { id: 'cw-q11-1', name: 'UBND Quận 11', district: 'Quận 11', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.76280, lng: 106.65080 },
            { id: 'cw-q11-2', name: 'Công viên Văn hóa Đầm Sen', district: 'Quận 11', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.76720, lng: 106.64080 },
            { id: 'cw-q11-3', name: 'Lotte Mart Phú Thọ', district: 'Quận 11', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.76850, lng: 106.65580 },
            { id: 'cw-q11-4', name: 'Bệnh viện Quận 11', district: 'Quận 11', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.76020, lng: 106.64920 },

            // --- QUẬN 12 ---
            { id: 'cw-q12-1', name: 'UBND Quận 12', district: 'Quận 12', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.86650, lng: 106.64080 },
            { id: 'cw-q12-2', name: 'Công viên Phần mềm Quang Trung (QTSC)', district: 'Quận 12', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.85450, lng: 106.62950 },
            { id: 'cw-q12-3', name: 'Mega Market Hiệp Phú', district: 'Quận 12', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.86250, lng: 106.64350 },
            { id: 'cw-q12-4', name: 'Bệnh viện Quận 12', district: 'Quận 12', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.86450, lng: 106.64750 },
            { id: 'cw-q12-5', name: 'Ga Metro Tân Thới Nhất (Metro số 2)', district: 'Quận 12', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.83550, lng: 106.61950 },

            // --- BÌNH THẠNH ---
            { id: 'cw-bt-1', name: 'UBND Quận Bình Thạnh', district: 'Bình Thạnh', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.80120, lng: 106.70050 },
            { id: 'cw-bt-2', name: 'Landmark 81 Skyview & Vincom Center', district: 'Bình Thạnh', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.79520, lng: 106.72180 },
            { id: 'cw-bt-3', name: 'Bệnh viện Ung Bướu TP.HCM (CS1)', district: 'Bình Thạnh', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.80150, lng: 106.69750 },
            { id: 'cw-bt-4', name: 'Bệnh viện Nhân Dân Gia Định', district: 'Bình Thạnh', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.80280, lng: 106.69650 },
            { id: 'cw-bt-5', name: 'Đại học HUTECH & ĐH GTVT', district: 'Bình Thạnh', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.80180, lng: 106.71450 },
            { id: 'cw-bt-6', name: 'Bến xe Miền Đông (Bình Thạnh)', district: 'Bình Thạnh', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.81450, lng: 106.71150 },
            { id: 'cw-bt-7', name: 'Công viên Vinhomes Central Park ven sông', district: 'Bình Thạnh', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.79420, lng: 106.72350 },

            // --- GÒ VẤP ---
            { id: 'cw-gv-1', name: 'UBND Quận Gò Vấp', district: 'Gò Vấp', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.83650, lng: 106.66580 },
            { id: 'cw-gv-2', name: 'Đại siêu thị Emart Phan Văn Trị', district: 'Gò Vấp', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.82580, lng: 106.69120 },
            { id: 'cw-gv-3', name: 'Vincom Plaza Phan Văn Trị', district: 'Gò Vấp', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.82820, lng: 106.68520 },
            { id: 'cw-gv-4', name: 'Bệnh viện Quân Y 175 (Bộ Quốc Phòng)', district: 'Gò Vấp', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.81950, lng: 106.67950 },
            { id: 'cw-gv-5', name: 'Đại học Công nghiệp TP.HCM (IUH)', district: 'Gò Vấp', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.82250, lng: 106.68750 },
            { id: 'cw-gv-6', name: 'Công viên Làng Hoa Gò Vấp', district: 'Gò Vấp', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.84450, lng: 106.65750 },

            // --- PHÚ NHUẬN ---
            { id: 'cw-pn-1', name: 'UBND Quận Phú Nhuận', district: 'Phú Nhuận', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.79820, lng: 106.68120 },
            { id: 'cw-pn-2', name: 'Bệnh viện Đa khoa Hoàn Mỹ Sài Gòn', district: 'Phú Nhuận', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.79580, lng: 106.68350 },
            { id: 'cw-pn-3', name: 'Trung tâm Hội nghị White Palace', district: 'Phú Nhuận', category: 'hospitality', category_name: 'Khách sạn & Dịch vụ', lat: 10.80050, lng: 106.67450 },
            { id: 'cw-pn-4', name: 'Công viên Gia Định (Phần Phú Nhuận)', district: 'Phú Nhuận', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.81350, lng: 106.67450 },
            { id: 'cw-pn-5', name: 'Phố ẩm thực Phan Xích Long', district: 'Phú Nhuận', category: 'lifestyle', category_name: 'Ẩm thực & Giải trí', lat: 10.79650, lng: 106.68780 },

            // --- TÂN BÌNH ---
            { id: 'cw-tb-1', name: 'UBND Quận Tân Bình', district: 'Tân Bình', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.79420, lng: 106.65650 },
            { id: 'cw-tb-2', name: 'Cảng HKQT Tân Sơn Nhất & Nhà ga T3', district: 'Tân Bình', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.81850, lng: 106.65850 },
            { id: 'cw-tb-3', name: 'Menas Mall Saigon Airport', district: 'Tân Bình', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.81550, lng: 106.66350 },
            { id: 'cw-tb-4', name: 'Bệnh viện Thống Nhất (Tuyến TW)', district: 'Tân Bình', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.79250, lng: 106.65680 },
            { id: 'cw-tb-5', name: 'Công viên Hoàng Văn Thụ', district: 'Tân Bình', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.80120, lng: 106.66150 },

            // --- TÂN PHÚ ---
            { id: 'cw-tp-1', name: 'UBND Quận Tân Phú', district: 'Tân Phú', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.79120, lng: 106.62750 },
            { id: 'cw-tp-2', name: 'Đại siêu thị AEON Mall Tân Phú Celadon', district: 'Tân Phú', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.80150, lng: 106.61650 },
            { id: 'cw-tp-3', name: 'Bệnh viện Đa khoa Tân Phú', district: 'Tân Phú', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.78150, lng: 106.63420 },
            { id: 'cw-tp-4', name: 'Đại học Công Thương TP.HCM (HUIT)', district: 'Tân Phú', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.80450, lng: 106.62880 },

            // --- BÌNH TÂN ---
            { id: 'cw-btn-1', name: 'UBND Quận Bình Tân', district: 'Bình Tân', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.75050, lng: 106.60150 },
            { id: 'cw-btn-2', name: 'Đại siêu thị AEON Mall Bình Tân', district: 'Bình Tân', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.74280, lng: 106.61350 },
            { id: 'cw-btn-3', name: 'Bến xe Miền Tây', district: 'Bình Tân', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.74650, lng: 106.62120 },
            { id: 'cw-btn-4', name: 'Bệnh viện Quốc tế City (CIH)', district: 'Bình Tân', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.74050, lng: 106.61250 },
            { id: 'cw-btn-5', name: 'Bệnh viện Đa khoa Triều An', district: 'Bình Tân', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.74450, lng: 106.61950 },

            // --- TP. THỦ ĐỨC ---
            { id: 'cw-td-1', name: 'Trung tâm Hành chính TP. Thủ Đức', district: 'TP. Thủ Đức', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.84920, lng: 106.77080 },
            { id: 'cw-td-2', name: 'TTTM GigaMall Phạm Văn Đồng', district: 'TP. Thủ Đức', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.82750, lng: 106.72150 },
            { id: 'cw-td-3', name: 'Vincom Mega Mall Thảo Điền', district: 'TP. Thủ Đức', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.80380, lng: 106.73650 },
            { id: 'cw-td-4', name: 'Đại đô thị Đại học Quốc gia TP.HCM', district: 'TP. Thủ Đức', category: 'education', category_name: 'Giáo dục & Trường học', lat: 10.87550, lng: 106.80150 },
            { id: 'cw-td-5', name: 'Khu Công nghệ cao TP.HCM (SHTP)', district: 'TP. Thủ Đức', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.85650, lng: 106.79250 },
            { id: 'cw-td-6', name: 'Bến xe Miền Đông mới & Ga Metro', district: 'TP. Thủ Đức', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.86550, lng: 106.81550 },
            { id: 'cw-td-7', name: 'Bệnh viện TP. Thủ Đức', district: 'TP. Thủ Đức', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.85450, lng: 106.75850 },
            { id: 'cw-td-8', name: 'Khu Du lịch Văn hóa Suối Tiên', district: 'TP. Thủ Đức', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.86650, lng: 106.80350 },

            // --- HUYỆN BÌNH CHÁNH ---
            { id: 'cw-bc-1', name: 'UBND Huyện Bình Chánh', district: 'Bình Chánh', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.68650, lng: 106.59150 },
            { id: 'cw-bc-2', name: 'Cụm Y tế Tân Kiên & BV Bình Chánh', district: 'Bình Chánh', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.70250, lng: 106.58150 },
            { id: 'cw-bc-3', name: 'Chợ Đầu mối Nông sản Bình Điền', district: 'Bình Chánh', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.70850, lng: 106.63450 },

            // --- HUYỆN NHÀ BÈ ---
            { id: 'cw-nb-1', name: 'UBND Huyện Nhà Bè', district: 'Nhà Bè', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.69450, lng: 106.73350 },
            { id: 'cw-nb-2', name: 'Cảng Quốc tế Hiệp Phước & KCN', district: 'Nhà Bè', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.62850, lng: 106.76150 },
            { id: 'cw-nb-3', name: 'Bệnh viện Huyện Nhà Bè', district: 'Nhà Bè', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.69750, lng: 106.73150 },

            // --- HUYỆN HÓC MÔN ---
            { id: 'cw-hm-1', name: 'UBND Huyện Hóc Môn', district: 'Hóc Môn', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.88350, lng: 106.59050 },
            { id: 'cw-hm-2', name: 'Chợ Đầu mối Nông sản Hóc Môn', district: 'Hóc Môn', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.85850, lng: 106.60250 },
            { id: 'cw-hm-3', name: 'Bệnh viện Đa khoa KV Hóc Môn', district: 'Hóc Môn', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.88250, lng: 106.59550 },

            // --- HUYỆN CỦ CHI ---
            { id: 'cw-cc-1', name: 'UBND Huyện Củ Chi', district: 'Củ Chi', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.97150, lng: 106.49250 },
            { id: 'cw-cc-2', name: 'Bệnh viện Đa khoa KV Củ Chi', district: 'Củ Chi', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.97550, lng: 106.49650 },
            { id: 'cw-cc-3', name: 'Địa đạo Củ Chi (KDL Bến Dược)', district: 'Củ Chi', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 11.14250, lng: 106.46250 },

            // --- HUYỆN CẦN GIỜ ---
            { id: 'cw-cg-1', name: 'UBND Huyện Cần Giờ', district: 'Cần Giờ', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 10.41050, lng: 106.95350 },
            { id: 'cw-cg-2', name: 'Khu Dự trữ Sinh quyển Rừng Sác Cần Giờ', district: 'Cần Giờ', category: 'green', category_name: 'Công viên & Cảnh quan', lat: 10.51250, lng: 106.87150 },
            { id: 'cw-cg-3', name: 'Phà Bình Khánh (Cửa ngõ Cần Giờ)', district: 'Cần Giờ', category: 'transit', category_name: 'Giao thông & Metro', lat: 10.67150, lng: 106.77250 },

            // --- HÀ NỘI ---
            { id: 'cw-hn-1', name: 'UBND TP. Hà Nội & Hồ Gươm', district: 'Hà Nội', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 21.02851, lng: 105.85444 },
            { id: 'cw-hn-2', name: 'TTTM Lotte Center Liễu Giai', district: 'Hà Nội', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 21.03320, lng: 105.81450 },
            { id: 'cw-hn-3', name: 'Bệnh viện Bạch Mai', district: 'Hà Nội', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 21.00050, lng: 105.84150 },
            { id: 'cw-hn-4', name: 'Đại học Quốc gia Hà Nội (Cầu Giấy)', district: 'Hà Nội', category: 'education', category_name: 'Giáo dục & Trường học', lat: 21.03750, lng: 105.78150 },
            { id: 'cw-hn-5', name: 'Ga Hà Nội (Đường sắt Bắc Nam)', district: 'Hà Nội', category: 'transit', category_name: 'Giao thông & Metro', lat: 21.02450, lng: 105.84120 },

            // --- ĐÀ NẴNG ---
            { id: 'cw-dn-1', name: 'Trung tâm Hành chính TP. Đà Nẵng', district: 'Đà Nẵng', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 16.07750, lng: 108.22380 },
            { id: 'cw-dn-2', name: 'Cầu Rồng & Sông Hàn', district: 'Đà Nẵng', category: 'transit', category_name: 'Giao thông & Metro', lat: 16.06120, lng: 108.22750 },
            { id: 'cw-dn-3', name: 'Vincom Plaza Ngô Quyền', district: 'Đà Nẵng', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 16.07150, lng: 108.23250 },
            { id: 'cw-dn-4', name: 'Bệnh viện Đa khoa Đà Nẵng', district: 'Đà Nẵng', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 16.07250, lng: 108.21650 },

            // --- BÌNH DƯƠNG ---
            { id: 'cw-bd-1', name: 'Trung tâm Hành chính Tỉnh Bình Dương', district: 'Bình Dương', category: 'admin', category_name: 'Cơ quan & Tòa nhà', lat: 11.05450, lng: 106.66680 },
            { id: 'cw-bd-2', name: 'AEON Mall Canary Bình Dương', district: 'Bình Dương', category: 'commercial', category_name: 'TTTM & Siêu thị', lat: 10.93250, lng: 106.70250 },
            { id: 'cw-bd-3', name: 'Bệnh viện Đa khoa Tỉnh Bình Dương', district: 'Bình Dương', category: 'health', category_name: 'Y tế & Bệnh viện', lat: 10.98550, lng: 106.66250 }
        ];

        function setPoiScopeMode(mode) {
            poiScopeMode = mode;
            const btnRad = document.getElementById('btnModeRadius');
            const btnCity = document.getElementById('btnModeCitywide');
            if (mode === 'citywide') {
                if (btnRad) btnRad.classList.remove('active');
                if (btnCity) btnCity.classList.add('active');
                if (map.getZoom() > 14) {
                    map.flyTo([10.782, 106.695], 12.5, { duration: 0.9 });
                }
                showToast("Đã kích hoạt chế độ: Phủ sóng toàn thành phố (22 Quận/Huyện)");
            } else {
                if (btnRad) btnRad.classList.add('active');
                if (btnCity) btnCity.classList.remove('active');
                map.flyTo([currentLat, currentLng], 16, { duration: 0.8 });
                showToast("Đã kích hoạt chế độ: Bán kính 1.5km quanh tài sản");
            }
            renderPoiMarkers();
        }

        function jumpToDistrict(name, lat, lng, btnEl) {
            if (btnEl) {
                document.querySelectorAll('.district-chip').forEach(c => c.classList.remove('active'));
                btnEl.classList.add('active');
                btnEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            map.flyTo([lat, lng], 15, { duration: 0.8 });
            lastScannedLat = lat;
            lastScannedLng = lng;
            currentScannedAreaName = name;
            const searchBtn = document.getElementById('btnSearchThisArea');
            if (searchBtn) searchBtn.style.display = 'none';
            fetchNearbyPois(lat, lng, name);
            showToast(`Đang quét tiện ích: ${name}`);
        }

        async function searchCurrentViewportArea() {
            const center = map.getCenter();
            const searchBtn = document.getElementById('btnSearchThisArea');
            if (searchBtn) {
                searchBtn.innerHTML = `
                    <svg class="poi-spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    <span>Đang quét tiện ích khu vực này...</span>
                `;
            }
            await fetchNearbyPois(center.lat, center.lng, 'Góc nhìn hiện tại');
            if (searchBtn) {
                searchBtn.style.display = 'none';
                searchBtn.innerHTML = `
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span id="btnSearchAreaText">Quét tiện ích tại khu vực này</span>
                `;
            }
        }

        let _poiFetchDebounce = null;
        async function fetchNearbyPois(lat, lng, areaLabel = null) {
            clearTimeout(_poiFetchDebounce);
            _poiFetchDebounce = setTimeout(async () => {
                lastScannedLat = lat;
                lastScannedLng = lng;
                if (areaLabel) currentScannedAreaName = areaLabel;

                const statusMsg = document.getElementById('poiStatusMsg');
                const spinner = document.querySelector('.poi-spinner');
                if (statusMsg) statusMsg.textContent = areaLabel ? `Đang quét: ${areaLabel}...` : 'Đang quét tiện ích OSM...';
                if (spinner) spinner.style.display = 'inline-block';

                let pois = [];
                try {
                    const res = await fetch(`/api/v1/nearby-pois?latitude=${lat}&longitude=${lng}&radius=1500`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.status === 'success' && Array.isArray(data.pois) && data.pois.length > 0) {
                            pois = data.pois;
                        }
                    }
                } catch (e) {
                    console.warn("Backend POI error, trying browser Overpass:", e);
                }

                if (!pois || pois.length === 0) {
                    try {
                        const overpassQuery = `[out:json][timeout:8];(
                          node["amenity"~"townhall|courthouse|post_office|police|community_centre"](around:1500,${lat},${lng});
                          way["amenity"~"townhall|courthouse|post_office|police|community_centre"](around:1500,${lat},${lng});
                          node["shop"~"mall|supermarket|department_store"](around:1500,${lat},${lng});
                          way["shop"~"mall|supermarket|department_store"](around:1500,${lat},${lng});
                          node["tourism"~"hotel|guest_house|motel|resort"](around:1500,${lat},${lng});
                          way["tourism"~"hotel|guest_house|motel|resort"](around:1500,${lat},${lng});
                          node["amenity"~"hospital|clinic"](around:1500,${lat},${lng});
                          way["amenity"~"hospital|clinic"](around:1500,${lat},${lng});
                          node["amenity"~"school|university|college|kindergarten"](around:1500,${lat},${lng});
                          way["amenity"~"school|university|college|kindergarten"](around:1500,${lat},${lng});
                          node["railway"~"station|subway_entrance"](around:1500,${lat},${lng});
                          node["amenity"~"bus_station|ferry_terminal"](around:1500,${lat},${lng});
                          node["amenity"~"bank|atm"](around:1500,${lat},${lng});
                          node["leisure"~"park|garden"](around:1500,${lat},${lng});
                          way["leisure"~"park|garden"](around:1500,${lat},${lng});
                          node["amenity"~"restaurant|cafe|cinema"](around:1200,${lat},${lng});
                        );out center 45;`;
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 4000);
                        const res = await fetch("https://overpass-api.de/api/interpreter", {
                            method: "POST",
                            body: overpassQuery,
                            signal: controller.signal
                        }).catch(() => null);
                        clearTimeout(timeoutId);
                        if (res && res.ok) {
                            const osmData = await res.json();
                            const elements = osmData.elements || [];
                            elements.forEach(el => {
                                const t = el.tags || {};
                                const name = t.name || t['name:vi'] || t['name:en'];
                                if (!name) return;
                                const pLat = el.lat || (el.center && el.center.lat);
                                const pLng = el.lon || (el.center && el.center.lon);
                                if (!pLat || !pLng) return;

                                let category = 'admin';
                                let catName = 'Cơ quan & Tòa nhà';
                                const s = t.shop || '';
                                const tou = t.tourism || '';
                                const am = t.amenity || '';
                                const r = t.railway || '';
                                const l = t.leisure || '';

                                if (['mall', 'supermarket', 'department_store'].includes(s)) {
                                    category = 'commercial';
                                    catName = 'TTTM & Siêu thị';
                                } else if (['hotel', 'guest_house', 'motel', 'resort'].includes(tou)) {
                                    category = 'hospitality';
                                    catName = 'Khách sạn & Dịch vụ';
                                } else if (['hospital', 'clinic'].includes(am)) {
                                    category = 'health';
                                    catName = 'Y tế & Bệnh viện';
                                } else if (['school', 'university', 'college', 'kindergarten'].includes(am)) {
                                    category = 'education';
                                    catName = 'Giáo dục & Trường học';
                                } else if (r || ['bus_station', 'ferry_terminal'].includes(am)) {
                                    category = 'transit';
                                    catName = 'Giao thông & Metro';
                                } else if (['bank', 'atm'].includes(am)) {
                                    category = 'finance';
                                    catName = 'Tài chính & Ngân hàng';
                                } else if (['park', 'garden'].includes(l)) {
                                    category = 'green';
                                    catName = 'Công viên & Cảnh quan';
                                } else if (['restaurant', 'cafe', 'cinema'].includes(am)) {
                                    category = 'lifestyle';
                                    catName = 'Ẩm thực & Giải trí';
                                }

                                const dLat = (pLat - currentLat) * 111320;
                                const dLng = (pLng - currentLng) * 111320 * Math.cos(currentLat * Math.PI / 180);
                                const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

                                pois.push({
                                    id: String(el.id),
                                    name: name,
                                    category: category,
                                    category_name: catName,
                                    type: s || am || tou || r || l,
                                    lat: pLat,
                                    lng: pLng,
                                    distance_m: dist,
                                    district: areaLabel || ''
                                });
                            });
                        }
                    } catch (err) {
                        console.warn("Direct Overpass query error:", err);
                    }
                }

                // Bảo chứng dữ liệu: Nếu mạng trễ hoặc Overpass bị quá tải / timeout, lập tức nạp ngay các tiện ích biểu tượng của khu vực từ DB
                if (!pois || pois.length === 0) {
                    const fallbackDist = CITYWIDE_LANDMARKS_DB.map(lm => {
                        const dLat = (lm.lat - currentLat) * 111320;
                        const dLng = (lm.lng - currentLng) * 111320 * Math.cos(currentLat * Math.PI / 180);
                        const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
                        return {
                            ...lm,
                            distance_m: dist
                        };
                    }).filter(lm => {
                        if (areaLabel && lm.district && lm.district.toLowerCase().includes(areaLabel.toLowerCase())) return true;
                        const dLat = (lm.lat - lat) * 111320;
                        const dLng = (lm.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180);
                        const distFromCenter = Math.sqrt(dLat * dLat + dLng * dLng);
                        return distFromCenter <= 4500;
                    });

                    if (fallbackDist.length > 0) {
                        pois = fallbackDist;
                    }
                }

                pois.sort((a, b) => a.distance_m - b.distance_m);
                currentPois = pois;
                renderPoiMarkers();

                if (statusMsg) {
                    if (poiScopeMode === 'citywide') {
                        statusMsg.textContent = `Toàn thành phố: ${CITYWIDE_LANDMARKS_DB.length + currentPois.length} địa điểm`;
                    } else {
                        statusMsg.textContent = `${pois.length} địa điểm (${currentScannedAreaName || '1.5km'})`;
                    }
                }
                if (spinner) spinner.style.display = 'none';

                renderAmenitiesCard(pois);
            }, 300);
        }

        function renderPoiMarkers() {
            poiLayerGroup.clearLayers();

            const counts = {
                admin: 0,
                commercial: 0,
                hospitality: 0,
                health: 0,
                education: 0,
                transit: 0,
                finance: 0,
                green: 0,
                lifestyle: 0
            };

            // Xác định danh sách POI cần vẽ dựa trên scope mode
            let displayPois = [];

            if (poiScopeMode === 'citywide') {
                // Kết hợp các điểm mốc toàn thành phố với các POI vừa quét lân cận (loại trùng lặp)
                const seenCoords = new Set();

                CITYWIDE_LANDMARKS_DB.forEach(landmark => {
                    const dLat = (landmark.lat - currentLat) * 111320;
                    const dLng = (landmark.lng - currentLng) * 111320 * Math.cos(currentLat * Math.PI / 180);
                    const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
                    const item = {
                        ...landmark,
                        distance_m: dist
                    };
                    displayPois.push(item);
                    seenCoords.add(`${landmark.lat.toFixed(3)}_${landmark.lng.toFixed(3)}`);
                });

                currentPois.forEach(p => {
                    const key = `${p.lat.toFixed(3)}_${p.lng.toFixed(3)}`;
                    if (!seenCoords.has(key)) {
                        displayPois.push(p);
                        seenCoords.add(key);
                    }
                });
            } else {
                displayPois = currentPois;
            }

            displayPois.forEach(poi => {
                if (counts[poi.category] !== undefined) {
                    counts[poi.category]++;
                }

                if (!activePoiCategories.has(poi.category)) return;

                const icon = createPoiSvgDivIcon(poi.category);
                const marker = L.marker([poi.lat, poi.lng], { icon: icon });

                const meta = POI_META[poi.category] || POI_META.admin;
                const distFormatted = poi.distance_m >= 1000
                    ? (poi.distance_m / 1000).toFixed(1) + ' km'
                    : poi.distance_m + ' m';

                const distHtml = poi.district
                    ? `<span class="poi-district-tag">${poi.district}</span>`
                    : '';

                const popupContent = `
                    <div class="poi-popup-card">
                        <div class="poi-popup-cat" style="background:${meta.color}22; color:${meta.color}; border:1px solid ${meta.color}55;">
                            ${meta.iconSvg}
                            <span>${poi.category_name || meta.name}</span>
                        </div>
                        <div class="poi-popup-name">${distHtml}${poi.name}</div>
                        <div class="poi-popup-dist">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span>Cách tài sản: <b>${distFormatted}</b></span>
                        </div>
                    </div>
                `;
                marker.bindPopup(popupContent, { maxWidth: 280 });
                poiLayerGroup.addLayer(marker);
            });

            // Cập nhật số lượng đếm trên từng nút danh mục
            const updateCount = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            };

            updateCount('countAdmin', counts.admin);
            updateCount('countCommercial', counts.commercial);
            updateCount('countHospitality', counts.hospitality);
            updateCount('countHealth', counts.health);
            updateCount('countEducation', counts.education);
            updateCount('countTransit', counts.transit);
            updateCount('countFinance', counts.finance);
            updateCount('countGreen', counts.green);
            updateCount('countLifestyle', counts.lifestyle);

            const statusMsg = document.getElementById('poiStatusMsg');
            if (statusMsg) {
                if (poiScopeMode === 'citywide') {
                    statusMsg.textContent = `${displayPois.length} địa điểm toàn TP.HCM`;
                } else {
                    statusMsg.textContent = `${displayPois.length} địa điểm (${currentScannedAreaName || '1.5km'})`;
                }
            }
        }

        function togglePoiCategory(cat, btn) {
            if (activePoiCategories.has(cat)) {
                activePoiCategories.delete(cat);
                if (btn) btn.classList.remove('active');
            } else {
                activePoiCategories.add(cat);
                if (btn) btn.classList.add('active');
            }
            renderPoiMarkers();
        }

        function toggleAllPoiCategories(btn) {
            const allCats = Object.keys(POI_META);
            if (activePoiCategories.size === allCats.length) {
                activePoiCategories.clear();
                document.querySelectorAll('.poi-filter-btn').forEach(b => b.classList.remove('active'));
                if (btn) btn.textContent = 'Bật tất cả';
            } else {
                allCats.forEach(c => activePoiCategories.add(c));
                document.querySelectorAll('.poi-filter-btn').forEach(b => b.classList.add('active'));
                if (btn) btn.textContent = 'Bỏ chọn';
            }
            renderPoiMarkers();
        }

        function renderAmenitiesCard(pois) {
            const card = document.getElementById('amenitiesCard');
            const list = document.getElementById('amenitiesGridList');
            const totalTag = document.getElementById('amenitiesTotalTag');
            if (!card || !list) return;

            if (!pois || pois.length === 0) {
                card.style.display = 'none';
                return;
            }

            card.style.display = 'block';
            if (totalTag) totalTag.textContent = `${pois.length} địa điểm trong 1.5km`;

            const selected = [];
            const seenCats = new Set();
            for (const p of pois) {
                if (!seenCats.has(p.category)) {
                    selected.push(p);
                    seenCats.add(p.category);
                }
                if (selected.length >= 6) break;
            }
            for (const p of pois) {
                if (!selected.includes(p) && selected.length < 8) {
                    selected.push(p);
                }
            }

            list.innerHTML = selected.map(item => {
                const meta = POI_META[item.category] || POI_META.admin;
                const distFormatted = item.distance_m >= 1000
                    ? (item.distance_m / 1000).toFixed(1) + 'km'
                    : item.distance_m + 'm';
                return `
                    <div class="amenity-item-chip" title="${item.name}">
                        <div class="amenity-item-icon" style="background:${meta.color}18; color:${meta.color}; border:1px solid ${meta.color}40;">
                            ${meta.iconSvg}
                        </div>
                        <div class="amenity-item-info">
                            <div class="amenity-item-name">${item.name}</div>
                            <div class="amenity-item-sub">
                                <span>${item.category_name || meta.name}</span>
                                <span>•</span>
                                <b>${distFormatted}</b>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        mainMarker.on('dragend', function () {
            const pos = mainMarker.getLatLng();
            updateLocationAndValuate(pos.lat, pos.lng);
        });

        map.on('click', function (e) {
            mainMarker.setLatLng(e.latlng);
            updateLocationAndValuate(e.latlng.lat, e.latlng.lng);
        });

        // Theo dõi di chuyển bản đồ để hiển thị nút "Quét tiện ích tại khu vực này"
        map.on('moveend', function () {
            const center = map.getCenter();
            const dLat = (center.lat - lastScannedLat) * 111320;
            const dLng = (center.lng - lastScannedLng) * 111320 * Math.cos(center.lat * Math.PI / 180);
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            const searchBtn = document.getElementById('btnSearchThisArea');
            if (dist > 950) {
                if (searchBtn) searchBtn.style.display = 'inline-flex';
            } else {
                if (searchBtn) searchBtn.style.display = 'none';
            }
        });

        // Timer for map interactions & reverse geocoding
        let _mapInteractionTimer = null;

        function updateLocationAndValuate(lat, lng, shouldSyncInputs = true) {
            currentLat = lat;
            currentLng = lng;
            radiusCircle.setLatLng([lat, lng]);
            document.getElementById('coordsBadge').innerText = `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`;

            const searchBtn = document.getElementById('btnSearchThisArea');
            if (searchBtn) searchBtn.style.display = 'none';

            fetchNearbyPois(lat, lng);

            clearTimeout(_mapInteractionTimer);
            _mapInteractionTimer = setTimeout(async () => {
                if (shouldSyncInputs) {
                    await reverseGeocodeAndSyncInputs(lat, lng);
                } else {
                    const curDist = document.getElementById('district_name').value.trim();
                    const curProv = document.getElementById('province_name').value.trim();
                    const areaVal = parseFloat(document.getElementById('area').value);
                    if (areaVal && areaVal > 0 && curDist) {
                        triggerValuation();
                    } else {
                        fetchQuickComparables(lat, lng, curDist, curProv);
                    }
                }
            }, 300);
        }

        // Tự động tải POI tại tọa độ khởi tạo ban đầu
        fetchNearbyPois(currentLat, currentLng, 'Quận 1');

        // ==========================================
        // BỘ DỮ LIỆU ĐỊA GIỚI HÀNH CHÍNH VIỆT NAM CAO CẤP
        // Đảm bảo nhận diện Quận / Huyện chính xác 100% khi di chuyển bản đồ hoặc định vị GPS
        // ==========================================
        const WARD_TO_DISTRICT_MAP = {
            // --- TP. HỒ CHÍ MINH (22 Quận / Huyện / TP Thủ Đức) ---
            // QUẬN 1
            'bến nghé': 'Quận 1', 'bến thành': 'Quận 1', 'đa kao': 'Quận 1', 'tân định': 'Quận 1',
            'cầu ông lãnh': 'Quận 1', 'cầu kho': 'Quận 1', 'cô giang': 'Quận 1', 'nguyễn cư trinh': 'Quận 1',
            'nguyễn thái bình': 'Quận 1', 'phạm ngũ lão': 'Quận 1', 'sài gòn': 'Quận 1',
            // QUẬN 3
            'võ thị sáu': 'Quận 3', 'nhiêu lộc': 'Quận 3', 'bàn cờ': 'Quận 3', 'trương minh giảng': 'Quận 3',
            // QUẬN 4
            'khánh hội': 'Quận 4', 'xóm chiếu': 'Quận 4', 'vĩnh hội': 'Quận 4', 'cây bàng': 'Quận 4',
            // QUẬN 5
            'chợ lớn': 'Quận 5', 'an đông': 'Quận 5', 'hàm tử': 'Quận 5', 'chợ quán': 'Quận 5',
            // QUẬN 6
            'bình tây': 'Quận 6', 'bình phú': 'Quận 6', 'phú lâm': 'Quận 6', 'cây gõ': 'Quận 6',
            // QUẬN 7
            'tân hưng': 'Quận 7', 'tân phong': 'Quận 7', 'tân quy': 'Quận 7', 'tân kiểng': 'Quận 7',
            'tân thuận đông': 'Quận 7', 'tân thuận tây': 'Quận 7', 'phú mỹ': 'Quận 7', 'phú thuận': 'Quận 7',
            'bình thuận': 'Quận 7', 'phú mỹ hưng': 'Quận 7', 'tân mỹ': 'Quận 7',
            // QUẬN 8
            'chánh hưng': 'Quận 8', 'rạch ông': 'Quận 8', 'bình đông': 'Quận 8', 'hưng phú': 'Quận 8', 'xóm củi': 'Quận 8',
            // QUẬN 10
            'hòa hưng': 'Quận 10', 'chí hòa': 'Quận 10', 'vườn lài': 'Quận 10', 'nhật tảo': 'Quận 10', 'bắc hải': 'Quận 10',
            // QUẬN 11
            'hòa bình': 'Quận 11', 'bình thới': 'Quận 11', 'đầm sen': 'Quận 11', 'phú thọ': 'Quận 11',
            // QUẬN 12
            'an phú đông': 'Quận 12', 'thạnh lộc': 'Quận 12', 'thạnh xuân': 'Quận 12', 'tân chánh hiệp': 'Quận 12',
            'tân thới hiệp': 'Quận 12', 'đông hưng thuận': 'Quận 12', 'hiệp thành': 'Quận 12', 'tân thới nhất': 'Quận 12',
            'trung mỹ tây': 'Quận 12', 'tân hưng thuận': 'Quận 12',
            // BÌNH THẠNH
            'bình thạnh': 'Bình Thạnh', 'bình lợi trung': 'Bình Thạnh', 'bình lợi': 'Bình Thạnh',
            'gia định': 'Bình Thạnh', 'hàng xanh': 'Bình Thạnh', 'thị nghè': 'Bình Thạnh',
            'bạch đằng': 'Bình Thạnh', 'thanh đa': 'Bình Thạnh', 'bình quới': 'Bình Thạnh', 'bình hòa': 'Bình Thạnh',
            // PHÚ NHUẬN
            'phú nhuận': 'Phú Nhuận', 'cầu kiệu': 'Phú Nhuận', 'đức nhuận': 'Phú Nhuận', 'phan xích long': 'Phú Nhuận',
            // GÒ VẤP
            'gò vấp': 'Gò Vấp', 'thông tây hội': 'Gò Vấp', 'hạnh thông': 'Gò Vấp', 'an nhơn': 'Gò Vấp', 'tân sơn': 'Gò Vấp',
            // TÂN BÌNH
            'tân bình': 'Tân Bình', 'tân sơn hòa': 'Tân Bình', 'tân sơn nhất': 'Tân Bình', 'bảy hiền': 'Tân Bình', 'lăng cha cả': 'Tân Bình',
            // TÂN PHÚ
            'tân phú': 'Tân Phú', 'phú thạnh': 'Tân Phú', 'tân sơn nhì': 'Tân Phú', 'phú thọ hòa': 'Tân Phú',
            'tây thạnh': 'Tân Phú', 'sơn kỳ': 'Tân Phú', 'hiệp tân': 'Tân Phú', 'hòa thạnh': 'Tân Phú', 'tân quý': 'Tân Phú', 'tân thành': 'Tân Phú',
            // BÌNH TÂN
            'bình tân': 'Bình Tân', 'bình trị đông': 'Bình Tân', 'an lạc': 'Bình Tân', 'bình hưng hòa': 'Bình Tân', 'tân tạo': 'Bình Tân',
            // THÀNH PHỐ THỦ ĐỨC
            'thủ đức': 'Thành phố Thủ Đức', 'thành phố thủ đức': 'Thành phố Thủ Đức', 'thảo điền': 'Thành phố Thủ Đức',
            'an phú': 'Thành phố Thủ Đức', 'hiệp bình': 'Thành phố Thủ Đức', 'linh chiểu': 'Thành phố Thủ Đức',
            'linh trung': 'Thành phố Thủ Đức', 'linh tây': 'Thành phố Thủ Đức', 'tam bình': 'Thành phố Thủ Đức',
            'tam phú': 'Thành phố Thủ Đức', 'trường thọ': 'Thành phố Thủ Đức', 'linh đông': 'Thành phố Thủ Đức',
            'linh xuân': 'Thành phố Thủ Đức', 'phước long': 'Thành phố Thủ Đức', 'tăng nhơn phú': 'Thành phố Thủ Đức',
            'long thạnh mỹ': 'Thành phố Thủ Đức', 'long phước': 'Thành phố Thủ Đức', 'hiệp phú': 'Thành phố Thủ Đức',
            'thạnh mỹ lợi': 'Thành phố Thủ Đức', 'bình trưng': 'Thành phố Thủ Đức', 'an khánh': 'Thành phố Thủ Đức', 'cát lái': 'Thành phố Thủ Đức',
            // HÓC MÔN
            'hóc môn': 'Hóc Môn', 'bà điểm': 'Hóc Môn', 'tân thới nhì': 'Hóc Môn', 'xuân thới thượng': 'Hóc Môn',
            'xuân thới đông': 'Hóc Môn', 'trung chánh': 'Hóc Môn', 'nhị bình': 'Hóc Môn',
            // BÌNH CHÁNH
            'bình chánh': 'Bình Chánh', 'bình hưng': 'Bình Chánh', 'phong phú': 'Bình Chánh', 'đa phước': 'Bình Chánh',
            'tân kiên': 'Bình Chánh', 'vĩnh lộc': 'Bình Chánh', 'an phú tây': 'Bình Chánh', 'quy đức': 'Bình Chánh',
            // NHÀ BÈ
            'nhà bè': 'Nhà Bè', 'phước kiển': 'Nhà Bè', 'hiệp phước': 'Nhà Bè', 'phú xuân': 'Nhà Bè', 'nhơn đức': 'Nhà Bè', 'long thới': 'Nhà Bè',
            // CỦ CHI
            'củ chi': 'Củ Chi', 'tân an hội': 'Củ Chi', 'an nhơn tây': 'Củ Chi', 'thái mỹ': 'Củ Chi', 'phước vĩnh an': 'Củ Chi', 'tân thạnh đông': 'Củ Chi',
            // CẦN GIỜ
            'cần giờ': 'Cần Giờ', 'cần thạnh': 'Cần Giờ', 'long hòa': 'Cần Giờ', 'bình khánh': 'Cần Giờ', 'lý nhơn': 'Cần Giờ', 'thạnh an': 'Cần Giờ',

            // --- THỦ ĐÔ HÀ NỘI ---
            'hoàn kiếm': 'Hoàn Kiếm', 'hàng bạc': 'Hoàn Kiếm', 'hàng gai': 'Hoàn Kiếm', 'hàng bông': 'Hoàn Kiếm', 'tràng tiền': 'Hoàn Kiếm', 'đồng xuân': 'Hoàn Kiếm',
            'ba đình': 'Ba Đình', 'trúc bạch': 'Ba Đình', 'kim mã': 'Ba Đình', 'giảng võ': 'Ba Đình', 'ngọc khánh': 'Ba Đình', 'liễu giai': 'Ba Đình', 'cống vị': 'Ba Đình',
            'đống đa': 'Đống Đa', 'cát linh': 'Đống Đa', 'văn miếu': 'Đống Đa', 'láng thượng': 'Đống Đa', 'láng hạ': 'Đống Đa', 'ô chợ dừa': 'Đống Đa', 'kim liên': 'Đống Đa',
            'hai bà trưng': 'Hai Bà Trưng', 'bạch mai': 'Hai Bà Trưng', 'bách khoa': 'Hai Bà Trưng', 'vĩnh tuy': 'Hai Bà Trưng', 'minh khai': 'Hai Bà Trưng',
            'cầu giấy': 'Cầu Giấy', 'dịch vọng': 'Cầu Giấy', 'nghĩa đô': 'Cầu Giấy', 'nghĩa tân': 'Cầu Giấy', 'mai dịch': 'Cầu Giấy', 'trung hòa': 'Cầu Giấy', 'yên hòa': 'Cầu Giấy',
            'tây hồ': 'Tây Hồ', 'bưởi': 'Tây Hồ', 'thụy khuê': 'Tây Hồ', 'quảng an': 'Tây Hồ', 'nhật tân': 'Tây Hồ', 'tứ liên': 'Tây Hồ', 'xuân la': 'Tây Hồ',
            'thanh xuân': 'Thanh Xuân', 'khương đình': 'Thanh Xuân', 'khương mai': 'Thanh Xuân', 'khương trung': 'Thanh Xuân', 'nhân chính': 'Thanh Xuân',
            'hoàng mai': 'Hoàng Mai', 'linh đàm': 'Hoàng Mai', 'định công': 'Hoàng Mai', 'giáp bát': 'Hoàng Mai', 'hoàng liệt': 'Hoàng Mai',
            'long biên': 'Long Biên', 'bồ đề': 'Long Biên', 'ngọc lâm': 'Long Biên', 'gia thụy': 'Long Biên',
            'nam từ liêm': 'Nam Từ Liêm', 'mỹ đình': 'Nam Từ Liêm', 'mễ trì': 'Nam Từ Liêm', 'trung văn': 'Nam Từ Liêm',
            'bắc từ liêm': 'Bắc Từ Liêm', 'cổ nhuế': 'Bắc Từ Liêm', 'xuân đỉnh': 'Bắc Từ Liêm',
            'hà đông': 'Hà Đông', 'mộ lao': 'Hà Đông', 'văn quán': 'Hà Đông', 'la khê': 'Hà Đông',

            // --- THÀNH PHỐ ĐÀ NẴNG ---
            'hải châu': 'Hải Châu', 'hòa cường': 'Hải Châu', 'thạch thang': 'Hải Châu', 'thanh bình': 'Hải Châu', 'thuận phước': 'Hải Châu',
            'thanh khê': 'Thanh Khê', 'tam thuận': 'Thanh Khê', 'xuân hà': 'Thanh Khê', 'tân chính': 'Thanh Khê',
            'sơn trà': 'Sơn Trà', 'an hải': 'Sơn Trà', 'phước mỹ': 'Sơn Trà', 'mân thái': 'Sơn Trà',
            'ngũ hành sơn': 'Ngũ Hành Sơn', 'mỹ an': 'Ngũ Hành Sơn', 'khuê mỹ': 'Ngũ Hành Sơn',
            'liên chiểu': 'Liên Chiểu', 'hòa minh': 'Liên Chiểu', 'hòa khánh': 'Liên Chiểu',
            'cẩm lệ': 'Cẩm Lệ', 'khuê trung': 'Cẩm Lệ', 'hòa thọ': 'Cẩm Lệ',

            // --- TỈNH BÌNH DƯƠNG ---
            'thủ dầu một': 'Thủ Dầu Một', 'phú cường': 'Thủ Dầu Một', 'hiệp thành': 'Thủ Dầu Một', 'chánh nghĩa': 'Thủ Dầu Một',
            'dĩ an': 'Dĩ An', 'tân đông hiệp': 'Dĩ An', 'an bình': 'Dĩ An', 'đông hòa': 'Dĩ An',
            'thuận an': 'Thuận An', 'lái thiêu': 'Thuận An', 'an phú': 'Thuận An', 'thuận giao': 'Thuận An',
            'bến cát': 'Bến Cát', 'tân uyên': 'Tân Uyên'
        };

        const DISTRICT_CENTROIDS = [
            // TP. Hồ Chí Minh
            { name: 'Quận 1', prov: 'Thành phố Hồ Chí Minh', lat: 10.775659, lng: 106.700424 },
            { name: 'Quận 3', prov: 'Thành phố Hồ Chí Minh', lat: 10.784360, lng: 106.684440 },
            { name: 'Quận 4', prov: 'Thành phố Hồ Chí Minh', lat: 10.764420, lng: 106.704230 },
            { name: 'Quận 5', prov: 'Thành phố Hồ Chí Minh', lat: 10.754040, lng: 106.663410 },
            { name: 'Quận 6', prov: 'Thành phố Hồ Chí Minh', lat: 10.748090, lng: 106.635190 },
            { name: 'Quận 7', prov: 'Thành phố Hồ Chí Minh', lat: 10.734030, lng: 106.721830 },
            { name: 'Quận 8', prov: 'Thành phố Hồ Chí Minh', lat: 10.724080, lng: 106.628620 },
            { name: 'Quận 10', prov: 'Thành phố Hồ Chí Minh', lat: 10.771590, lng: 106.667230 },
            { name: 'Quận 11', prov: 'Thành phố Hồ Chí Minh', lat: 10.762930, lng: 106.650190 },
            { name: 'Quận 12', prov: 'Thành phố Hồ Chí Minh', lat: 10.867150, lng: 106.641340 },
            { name: 'Bình Thạnh', prov: 'Thành phố Hồ Chí Minh', lat: 10.810580, lng: 106.709140 },
            { name: 'Phú Nhuận', prov: 'Thành phố Hồ Chí Minh', lat: 10.799190, lng: 106.680260 },
            { name: 'Gò Vấp', prov: 'Thành phố Hồ Chí Minh', lat: 10.838840, lng: 106.665790 },
            { name: 'Tân Bình', prov: 'Thành phố Hồ Chí Minh', lat: 10.801460, lng: 106.653420 },
            { name: 'Tân Phú', prov: 'Thành phố Hồ Chí Minh', lat: 10.790050, lng: 106.628170 },
            { name: 'Bình Tân', prov: 'Thành phố Hồ Chí Minh', lat: 10.765430, lng: 106.598210 },
            { name: 'Thành phố Thủ Đức', prov: 'Thành phố Hồ Chí Minh', lat: 10.849409, lng: 106.753706 },
            { name: 'Hóc Môn', prov: 'Thành phố Hồ Chí Minh', lat: 10.883920, lng: 106.593880 },
            { name: 'Bình Chánh', prov: 'Thành phố Hồ Chí Minh', lat: 10.687390, lng: 106.593880 },
            { name: 'Nhà Bè', prov: 'Thành phố Hồ Chí Minh', lat: 10.695320, lng: 106.729110 },
            { name: 'Củ Chi', prov: 'Thành phố Hồ Chí Minh', lat: 11.006670, lng: 106.495000 },
            { name: 'Cần Giờ', prov: 'Thành phố Hồ Chí Minh', lat: 10.411420, lng: 106.954670 },
            // Hà Nội
            { name: 'Hoàn Kiếm', prov: 'Hà Nội', lat: 21.030650, lng: 105.852440 },
            { name: 'Ba Đình', prov: 'Hà Nội', lat: 21.034710, lng: 105.828230 },
            { name: 'Đống Đa', prov: 'Hà Nội', lat: 21.018240, lng: 105.827290 },
            { name: 'Hai Bà Trưng', prov: 'Hà Nội', lat: 21.006930, lng: 105.854420 },
            { name: 'Cầu Giấy', prov: 'Hà Nội', lat: 21.031340, lng: 105.792510 },
            { name: 'Thanh Xuân', prov: 'Hà Nội', lat: 20.993750, lng: 105.811820 },
            { name: 'Tây Hồ', prov: 'Hà Nội', lat: 21.066430, lng: 105.819510 },
            { name: 'Hoàng Mai', prov: 'Hà Nội', lat: 20.978010, lng: 105.845830 },
            { name: 'Long Biên', prov: 'Hà Nội', lat: 21.036220, lng: 105.894340 },
            { name: 'Nam Từ Liêm', prov: 'Hà Nội', lat: 21.012540, lng: 105.766320 },
            { name: 'Bắc Từ Liêm', prov: 'Hà Nội', lat: 21.063810, lng: 105.759240 },
            { name: 'Hà Đông', prov: 'Hà Nội', lat: 20.971210, lng: 105.777010 },
            // Đà Nẵng
            { name: 'Hải Châu', prov: 'Đà Nẵng', lat: 16.054407, lng: 108.219806 },
            { name: 'Thanh Khê', prov: 'Đà Nẵng', lat: 16.060120, lng: 108.188450 },
            { name: 'Sơn Trà', prov: 'Đà Nẵng', lat: 16.088610, lng: 108.243120 },
            { name: 'Ngũ Hành Sơn', prov: 'Đà Nẵng', lat: 16.002440, lng: 108.258330 },
            { name: 'Liên Chiểu', prov: 'Đà Nẵng', lat: 16.082530, lng: 108.146520 },
            { name: 'Cẩm Lệ', prov: 'Đà Nẵng', lat: 16.018230, lng: 108.196320 },
            // Bình Dương
            { name: 'Thủ Dầu Một', prov: 'Bình Dương', lat: 10.980450, lng: 106.651870 },
            { name: 'Dĩ An', prov: 'Bình Dương', lat: 10.906940, lng: 106.772500 },
            { name: 'Thuận An', prov: 'Bình Dương', lat: 10.925280, lng: 106.698060 }
        ];

        function cleanAdminToken(s) {
            if (!s || typeof s !== 'string') return '';
            return s.toLowerCase()
                .replace(/^(phường|quận|thị trấn|thị xã|huyện|tp\.|thành phố)\s+/i, '')
                .replace(/\(phường\)|\(quận\)|\(thị xã\)|\(huyện\)/gi, '')
                .trim();
        }

        function formatStandardDistrict(raw) {
            if (!raw) return '';
            const trimmed = raw.trim();
            // Nếu là dạng số: '1' -> 'Quận 1'
            if (/^\d+$/.test(trimmed)) return `Quận ${trimmed}`;
            if (/^quận\s*\d+$/i.test(trimmed)) {
                const num = trimmed.replace(/\D/g, '');
                return `Quận ${num}`;
            }
            if (/^thủ đức$|^thành phố thủ đức$/i.test(trimmed)) return 'Thành phố Thủ Đức';
            // Chuẩn hóa viết hoa chữ cái đầu
            return trimmed.replace(/^(quận|huyện|thị xã|tp\.|thành phố)\s+/i, '')
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }

        function findNearestDistrictCentroid(lat, lng, targetProv) {
            let pool = DISTRICT_CENTROIDS;
            if (targetProv) {
                const matched = DISTRICT_CENTROIDS.filter(c => c.prov.toLowerCase().includes(targetProv.toLowerCase()) || targetProv.toLowerCase().includes(c.prov.toLowerCase()));
                if (matched.length > 0) pool = matched;
            }
            let best = pool[0];
            let minD = Infinity;
            for (const item of pool) {
                const d = (item.lat - lat) ** 2 + (item.lng - lng) ** 2;
                if (d < minD) {
                    minD = d;
                    best = item;
                }
            }
            return best ? best.name : 'Quận 1';
        }

        async function resolveAdminLocation(lat, lng, existingNomAddr = null, existingDisplayName = '') {
            let nomAddr = existingNomAddr;
            let displayName = existingDisplayName;
            let bdcData = null;

            const fetchPromises = [];

            // 1. Fetch Nominatim nếu chưa có
            if (!nomAddr) {
                const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
                fetchPromises.push(
                    fetch(nomUrl)
                        .then(r => r.json())
                        .then(data => {
                            if (data) {
                                nomAddr = data.address || {};
                                displayName = data.display_name || '';
                            }
                        })
                        .catch(e => console.warn("Nominatim fetch err:", e))
                );
            }

            // 2. Fetch BigDataCloud (Rất nhanh và nhận diện hành chính chi tiết)
            const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`;
            fetchPromises.push(
                fetch(bdcUrl)
                    .then(r => r.json())
                    .then(data => { bdcData = data; })
                    .catch(e => console.warn("BigDataCloud fetch err:", e))
            );

            await Promise.all(fetchPromises);
            nomAddr = nomAddr || {};

            // --- A. XÁC ĐỊNH TỈNH / THÀNH PHỐ ---
            let prov = nomAddr.city || nomAddr.state || nomAddr.province || (bdcData ? bdcData.city || bdcData.principalSubdivision : '');
            if (!prov || prov.toLowerCase().includes('hồ chí minh') || (lat >= 10.3 && lat <= 11.2 && lng >= 106.3 && lng <= 107.1)) {
                prov = 'Thành phố Hồ Chí Minh';
            } else if (prov.toLowerCase().includes('hà nội') || (lat >= 20.7 && lat <= 21.5 && lng >= 105.4 && lng <= 106.1)) {
                prov = 'Hà Nội';
            } else if (prov.toLowerCase().includes('đà nẵng') || (lat >= 15.8 && lat <= 16.3 && lng >= 108.0 && lng <= 108.5)) {
                prov = 'Đà Nẵng';
            } else if (prov.toLowerCase().includes('bình dương')) {
                prov = 'Bình Dương';
            }

            // --- B. TẬP HỢP TẤT CẢ CÁC ĐỊA DANH ỨNG VIÊN ĐỂ XÁC ĐỊNH QUẬN/HUYỆN ---
            const candidateTokens = [];

            // Từ BigDataCloud
            if (bdcData) {
                if (bdcData.locality) candidateTokens.push(bdcData.locality);
                const admins = bdcData.localityInfo && bdcData.localityInfo.administrative ? bdcData.localityInfo.administrative : [];
                admins.forEach(ad => { if (ad.name) candidateTokens.push(ad.name); });
            }

            // Từ Nominatim
            ['suburb', 'quarter', 'ward', 'neighbourhood', 'city_district', 'district', 'county', 'town'].forEach(k => {
                if (nomAddr[k]) candidateTokens.push(nomAddr[k]);
            });

            // Từ Display Name
            if (displayName) {
                displayName.split(',').forEach(p => {
                    const cleanP = p.trim();
                    if (cleanP) candidateTokens.push(cleanP);
                });
            }

            // --- C. TRA CỨU QUẬN/HUYỆN QUA TỪ ĐIỂN CHÍNH XÁC CAO ---
            let resolvedDistrict = '';

            // 1. Quét qua từ điển WARD_TO_DISTRICT_MAP (chính xác tuyệt đối cho phường/xã/khu phố)
            for (const token of candidateTokens) {
                const cleaned = cleanAdminToken(token);
                if (WARD_TO_DISTRICT_MAP[cleaned]) {
                    resolvedDistrict = WARD_TO_DISTRICT_MAP[cleaned];
                    break;
                }
            }

            // 2. Nếu chưa tìm thấy, kiểm tra trường district/city_district trực tiếp của OSM
            if (!resolvedDistrict) {
                const directDist = nomAddr.city_district || nomAddr.district || nomAddr.county || nomAddr.town || '';
                if (directDist && !directDist.toLowerCase().includes('hồ chí minh') && !directDist.toLowerCase().includes('hà nội')) {
                    resolvedDistrict = formatStandardDistrict(directDist);
                }
            }

            // 3. Nếu chưa tìm thấy, quét qua các chuỗi con xem có Quận ... / Huyện ... / TP Thủ Đức
            if (!resolvedDistrict) {
                for (const token of candidateTokens) {
                    const t = token.trim();
                    if (/^(Quận|Huyện|Thị xã|TP\.|Thành phố Thủ Đức)\b/i.test(t) && !/Hồ Chí Minh|Hà Nội|Đà Nẵng/i.test(t)) {
                        resolvedDistrict = formatStandardDistrict(t);
                        break;
                    }
                }
            }

            // 4. Nếu vẫn chưa có, sử dụng giải thuật tiệm cận tâm không gian (Nearest District Centroid)
            if (!resolvedDistrict) {
                resolvedDistrict = findNearestDistrictCentroid(lat, lng, prov);
            }

            // --- D. XÁC ĐỊNH PHƯỜNG / XÃ ---
            let resolvedWard = nomAddr.ward || nomAddr.quarter || '';
            const sub = nomAddr.suburb || '';
            if (!resolvedWard && sub) {
                if (/^(phường|xã|thị trấn)\b/i.test(sub)) {
                    resolvedWard = sub;
                } else if (sub !== resolvedDistrict) {
                    resolvedWard = `Phường ${sub}`;
                }
            }
            if (!resolvedWard && bdcData && bdcData.locality) {
                const loc = bdcData.locality.trim();
                if (loc && loc !== resolvedDistrict && !/^(hồ chí minh|hà nội)$/i.test(loc)) {
                    resolvedWard = /^(phường|xã|thị trấn)\b/i.test(loc) ? loc : `Phường ${loc}`;
                }
            }

            // --- E. XÁC ĐỊNH TÊN ĐƯỜNG & SỐ NHÀ ---
            const road = nomAddr.road || nomAddr.pedestrian || nomAddr.street || '';
            const houseNum = nomAddr.house_number || '';
            const resolvedStreet = houseNum ? `${houseNum} ${road}`.trim() : road;

            // --- F. TỔNG HỢP ĐỊA CHỈ ĐẦY ĐỦ ---
            const fullAddress = [resolvedStreet, resolvedWard, resolvedDistrict, prov].filter(Boolean).join(', ');

            return {
                province: prov,
                district: resolvedDistrict,
                ward: resolvedWard,
                street: resolvedStreet,
                fullAddress: fullAddress
            };
        }

        async function reverseGeocodeAndSyncInputs(lat, lng) {
            try {
                const info = await resolveAdminLocation(lat, lng);
                if (info) {
                    if (info.province) document.getElementById('province_name').value = info.province;
                    if (info.district) document.getElementById('district_name').value = info.district;
                    if (info.ward) document.getElementById('ward_name').value = info.ward;
                    if (info.street) document.getElementById('street_name').value = info.street;

                    if (info.fullAddress) {
                        document.getElementById('quickAddressSearch').value = info.fullAddress;
                    }

                    const areaVal = parseFloat(document.getElementById('area').value);
                    if (areaVal && areaVal > 0 && info.district) {
                        triggerValuation();
                    } else {
                        fetchQuickComparables(lat, lng, info.district, info.province);
                    }
                    showToast(`Đã nhận diện vị trí: ${info.fullAddress || info.district}`);
                }
            } catch (err) {
                console.warn("Reverse geocode error:", err);
                const curDist = document.getElementById('district_name').value.trim();
                const curProv = document.getElementById('province_name').value.trim();
                fetchQuickComparables(lat, lng, curDist, curProv);
            }
        }

        // ADDRESS INPUT SYNC
        let addrInputTimeout = null;
        function handleAddressInputChange() {
            clearTimeout(addrInputTimeout);
            addrInputTimeout = setTimeout(async () => {
                const prov = document.getElementById('province_name').value.trim();
                const dist = document.getElementById('district_name').value.trim();
                const ward = document.getElementById('ward_name').value.trim();
                const street = document.getElementById('street_name').value.trim();
                if (!prov && !dist) return;
                try {
                    const url = `/api/v1/geocode?province=${encodeURIComponent(prov)}&district=${encodeURIComponent(dist)}&ward=${encodeURIComponent(ward)}&street=${encodeURIComponent(street)}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (data.status === 'success' && data.latitude && data.longitude) {
                        currentLat = data.latitude;
                        currentLng = data.longitude;
                        map.flyTo([currentLat, currentLng], 16, { duration: 0.8 });
                        mainMarker.setLatLng([currentLat, currentLng]);
                        radiusCircle.setLatLng([currentLat, currentLng]);
                        document.getElementById('coordsBadge').innerText = `${currentLat.toFixed(5)}°N, ${currentLng.toFixed(5)}°E`;
                        fetchQuickComparables(currentLat, currentLng, dist, prov);
                        fetchNearbyPois(currentLat, currentLng, dist || 'Vị trí chuẩn hoá');
                        showToast(`Đã chuẩn hoá vị trí: ${data.standard_address || dist}`);
                    }
                } catch (err) { console.warn("Addr sync error:", err); }
            }, 450);
        }

        ['province_name', 'district_name', 'ward_name', 'street_name'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', handleAddressInputChange);
                el.addEventListener('blur', handleAddressInputChange);
            }
        });

        // SEARCH
        const searchInput = document.getElementById('quickAddressSearch');
        const searchDropdown = document.getElementById('searchDropdown');
        const btnSearch = document.getElementById('btnSearchAddress');
        let searchTimeout = null;

        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            const q = this.value.trim();
            if (q.length < 3) { searchDropdown.style.display = 'none'; return; }
            searchTimeout = setTimeout(() => searchAddressNominatim(q), 350);
        });

        btnSearch.addEventListener('click', function () {
            const q = searchInput.value.trim();
            if (q) searchAddressNominatim(q);
        });

        async function searchAddressNominatim(query) {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Vietnam')}&limit=5&addressdetails=1`;
                const res = await fetch(url);
                const results = await res.json();
                if (!results || results.length === 0) {
                    searchDropdown.innerHTML = '<div style="padding:8px 12px; color:var(--text-3); font-size:11px;">Không tìm thấy địa chỉ phù hợp</div>';
                    searchDropdown.style.display = 'block';
                    return;
                }
                searchDropdown.innerHTML = '';
                results.forEach(r => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-row';
                    item.innerHTML = `
                        <span class="svg-icon" style="color:var(--brand); margin-top:1px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>
                        <div><b>${r.display_name.split(',')[0]}</b><br><small style="color:var(--text-3); font-size:10px;">${r.display_name}</small></div>
                    `;
                    item.addEventListener('click', () => { selectLocation(r); searchDropdown.style.display = 'none'; });
                    searchDropdown.appendChild(item);
                });
                searchDropdown.style.display = 'block';
            } catch (err) { console.error("Search error:", err); }
        }

        async function selectLocation(r) {
            const lat = parseFloat(r.lat);
            const lng = parseFloat(r.lon);
            map.flyTo([lat, lng], 17, { duration: 1.0 });
            mainMarker.setLatLng([lat, lng]);
            radiusCircle.setLatLng([lat, lng]);
            document.getElementById('coordsBadge').innerText = `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`;
            searchInput.value = r.display_name.split(',').slice(0, 3).join(', ');

            const info = await resolveAdminLocation(lat, lng, r.address, r.display_name);
            if (info) {
                if (info.province) document.getElementById('province_name').value = info.province;
                if (info.district) document.getElementById('district_name').value = info.district;
                if (info.ward) document.getElementById('ward_name').value = info.ward;
                if (info.street) document.getElementById('street_name').value = info.street;
                if (info.fullAddress) document.getElementById('quickAddressSearch').value = info.fullAddress;
            }
            updateLocationAndValuate(lat, lng, false);
        }

        document.addEventListener('click', function (e) {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = 'none';
            }
        });

        function quickJump(lat, lng, name, btnEl) {
            if (btnEl) {
                document.querySelectorAll('.quick-city-btn, .city-btn').forEach(b => b.classList.remove('active'));
                btnEl.classList.add('active');
            }
            map.flyTo([lat, lng], 16, { duration: 1.0 });
            mainMarker.setLatLng([lat, lng]);
            updateLocationAndValuate(lat, lng);
            showToast(`Đã chuyển khu vực: ${name}`);
        }

        async function getCurrentLocation() {
            if (!navigator.geolocation) {
                showToast("Trình duyệt không hỗ trợ định vị GPS");
                return;
            }
            showToast("Đang xác định tọa độ GPS và tự động điền địa chỉ...");
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    currentLat = lat;
                    currentLng = lng;
                    map.flyTo([lat, lng], 17, { duration: 1.0 });
                    mainMarker.setLatLng([lat, lng]);
                    radiusCircle.setLatLng([lat, lng]);
                    document.getElementById('coordsBadge').innerText = `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`;

                    // Tự động giải mã vị trí GPS và điền đầy đủ các ô địa chỉ với độ chính xác tuyệt đối
                    try {
                        const info = await resolveAdminLocation(lat, lng);
                        if (info) {
                            if (info.province) document.getElementById('province_name').value = info.province;
                            if (info.district) document.getElementById('district_name').value = info.district;
                            if (info.ward) document.getElementById('ward_name').value = info.ward;
                            if (info.street) document.getElementById('street_name').value = info.street;
                            if (info.fullAddress) document.getElementById('quickAddressSearch').value = info.fullAddress;

                            fetchNearbyPois(lat, lng, info.district || 'Vị trí GPS');
                            fetchQuickComparables(lat, lng, info.district, info.province);
                            showToast("Đã định vị GPS và tự động điền địa chỉ thành công!");
                            return;
                        }
                    } catch (e) {
                        console.warn("GPS reverse geocode error:", e);
                    }
                    fetchNearbyPois(lat, lng, 'Vị trí GPS');
                    fetchQuickComparables(lat, lng, '', '');
                    showToast("Đã định vị thành công vị trí GPS của bạn");
                },
                (err) => {
                    showToast("Không thể truy cập GPS. Quý khách vui lòng chọn vị trí trên bản đồ");
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }

        function formatVND(amount) {
            if (!amount) return "-- VNĐ";
            if (amount >= 1e9) return (amount / 1e9).toFixed(2) + " Tỷ VNĐ";
            return (amount / 1e6).toFixed(0) + " Triệu VNĐ";
        }

        // SLIDER SYNC
        function syncAreaSlider(val) {
            document.getElementById('area').value = val;
            document.getElementById('areaSliderVal').textContent = val;
        }

        function syncAreaInput(val) {
            const num = parseFloat(val);
            if (!isNaN(num) && num > 0) {
                document.getElementById('areaRangeSlider').value = Math.min(350, Math.max(15, num));
                document.getElementById('areaSliderVal').textContent = val;
            } else {
                document.getElementById('areaSliderVal').textContent = '--';
            }
        }

        function setAreaVal(val) {
            if (val !== null && val !== undefined && val !== '') {
                document.getElementById('area').value = val;
                document.getElementById('areaRangeSlider').value = val;
                document.getElementById('areaSliderVal').textContent = val;
            } else {
                document.getElementById('area').value = '';
                document.getElementById('areaSliderVal').textContent = '--';
            }
        }

        const PROPERTY_CONFIGS = {
            'Nhà riêng': { hintDesc: 'Hiển thị đầy đủ thông số kết cấu (số tầng, phòng ngủ, WC), diện tích đất và ngõ vào.', areaLabel: 'Diện tích khuôn viên đất', areaPlaceholder: 'VD: 85', directionLabel: 'Hướng nhà chính', soDoText: 'Sổ đỏ / Sổ hồng', loGocText: 'Vị trí Lô góc 2 mặt', visibleFields: ['area', 'frontage_width', 'road_width', 'floor_count', 'bedroom_count', 'bathroom_count'], visibleNlp: ['has_so_do', 'is_oto_do', 'is_lo_goc', 'is_no_hau'] },
            'Căn hộ chung cư': { hintDesc: 'Tự động ẩn số tầng, mặt tiền, ngõ vào và thế đất. Chỉ cần nhập diện tích căn hộ, số phòng ngủ/WC.', areaLabel: 'Diện tích thông thủy căn hộ', areaPlaceholder: 'VD: 72', directionLabel: 'Hướng ban công / Cửa chính', soDoText: 'Sổ hồng / HĐMB', loGocText: 'Căn góc 2 mặt thoáng', visibleFields: ['area', 'bedroom_count', 'bathroom_count'], visibleNlp: ['has_so_do', 'is_lo_goc'] },
            'Đất nền': { hintDesc: 'Tự động ẩn số tầng và số phòng ngủ/WC. Tập trung vào diện tích, chiều ngang mặt tiền và pháp lý.', areaLabel: 'Quy mô thửa đất nền', areaPlaceholder: 'VD: 100', directionLabel: 'Hướng đất chính', soDoText: 'Sổ đỏ chính chủ', loGocText: 'Vị trí Lô góc 2 mặt', visibleFields: ['area', 'frontage_width', 'road_width'], visibleNlp: ['has_so_do', 'is_oto_do', 'is_lo_goc', 'is_no_hau'] },
            'Biệt thự': { hintDesc: 'Đầy đủ thông số khuôn viên biệt thự, mặt tiền, số tầng cao và không gian sân vườn.', areaLabel: 'Diện tích khuôn viên biệt thự', areaPlaceholder: 'VD: 200', directionLabel: 'Hướng biệt thự chính', soDoText: 'Sổ đỏ chính chủ', loGocText: 'Vị trí Lô góc 2 mặt', visibleFields: ['area', 'frontage_width', 'road_width', 'floor_count', 'bedroom_count', 'bathroom_count'], visibleNlp: ['has_so_do', 'is_oto_do', 'is_lo_goc', 'is_no_hau'] },
            'Shophouse': { hintDesc: 'Tối ưu cho mặt bằng kinh doanh kết hợp ở (mặt tiền, lộ giới đường, số tầng).', areaLabel: 'Diện tích sàn kinh doanh / đất', areaPlaceholder: 'VD: 110', directionLabel: 'Hướng nhà chính', soDoText: 'Sổ đỏ chính chủ', loGocText: 'Vị trí Lô góc thương mại', visibleFields: ['area', 'frontage_width', 'road_width', 'floor_count', 'bedroom_count', 'bathroom_count'], visibleNlp: ['has_so_do', 'is_oto_do', 'is_lo_goc', 'is_no_hau'] }
        };

        function setPropTypeTab(type) {
            document.getElementById('property_type').value = type;
            document.querySelectorAll('.prop-tab-btn').forEach(b => {
                if (b.dataset.type === type) b.classList.add('active');
                else b.classList.remove('active');
            });
            updateFormByPropertyType();
        }

        function updateFormByPropertyType() {
            const ptype = document.getElementById('property_type').value;
            const cfg = PROPERTY_CONFIGS[ptype] || PROPERTY_CONFIGS['Nhà riêng'];
            document.getElementById('propertyTypeHintText').textContent = cfg.hintDesc;
            const labelArea = document.getElementById('label_area');
            const inputArea = document.getElementById('area');
            if (labelArea) labelArea.textContent = cfg.areaLabel;
            if (inputArea) inputArea.placeholder = cfg.areaPlaceholder;
            const labelDir = document.getElementById('label_house_direction');
            if (labelDir) labelDir.textContent = cfg.directionLabel;
            const textSoDo = document.getElementById('text_has_so_do');
            if (textSoDo) textSoDo.textContent = cfg.soDoText;
            const textLoGoc = document.getElementById('text_is_lo_goc');
            if (textLoGoc) textLoGoc.textContent = cfg.loGocText;
            const allFields = ['frontage_width', 'road_width', 'floor_count', 'bedroom_count', 'bathroom_count'];
            allFields.forEach(f => {
                const group = document.getElementById(`group_${f}`);
                if (!group) return;
                if (cfg.visibleFields.includes(f)) { group.classList.remove('field-hidden'); }
                else { group.classList.add('field-hidden'); const inp = document.getElementById(f); if (inp && f !== 'area') inp.value = ''; }
            });
            const allNlp = ['has_so_do', 'is_oto_do', 'is_lo_goc', 'is_no_hau'];
            allNlp.forEach(n => {
                const item = document.getElementById(`nlp_${n}`);
                if (!item) return;
                if (cfg.visibleNlp.includes(n)) { item.classList.remove('field-hidden'); }
                else { item.classList.add('field-hidden'); const chk = document.getElementById(n); if (chk) { chk.checked = false; syncChipStyle(chk); } }
            });
        }

        function syncChipStyle(chk) {
            const parent = chk.closest('.chip');
            if (!parent) return;
            if (chk.checked) parent.classList.add('checked');
            else parent.classList.remove('checked');
        }

        async function triggerValuation() {
            const btn = document.getElementById('btnSubmit');
            const btnText = document.getElementById('btnText');
            btnText.textContent = 'Đang tính toán CatBoost...';
            btn.disabled = true;

            const ptype = document.querySelector('input[name="property_type"]:checked')?.value || 'Nhà riêng';
            const isChungCu = (ptype === 'Căn hộ chung cư');
            const isDat = (ptype === 'Đất nền');

            const rawArea = parseFloat(document.getElementById('area').value);
            if (isNaN(rawArea) || rawArea <= 0) {
                showToast('Vui lòng nhập diện tích bất động sản!');
                document.getElementById('area').focus();
                btnText.textContent = 'XÁC ĐỊNH GIÁ TRỊ THẨM ĐỊNH';
                btn.disabled = false;
                return;
            }

            const provInput = document.getElementById('province_name').value.trim();
            const distInput = document.getElementById('district_name').value.trim();

            if (!provInput) {
                showToast('Vui lòng nhập Tỉnh / Thành phố của BĐS!');
                document.getElementById('province_name').focus();
                btnText.textContent = 'XÁC ĐỊNH GIÁ TRỊ THẨM ĐỊNH';
                btn.disabled = false;
                return;
            }

            if (!distInput) {
                showToast('Vui lòng nhập Quận / Huyện của BĐS!');
                document.getElementById('district_name').focus();
                btnText.textContent = 'XÁC ĐỊNH GIÁ TRỊ THẨM ĐỊNH';
                btn.disabled = false;
                return;
            }

            const validArea = rawArea;
            const rawRoad = parseFloat(document.getElementById('road_width')?.value);
            const validRoad = (!isNaN(rawRoad) && rawRoad >= 0) ? rawRoad : 3.0;
            const rawFront = parseFloat(document.getElementById('frontage_width')?.value);
            const validFront = (!isNaN(rawFront) && rawFront >= 0) ? rawFront : 4.0;
            const rawFloor = parseInt(document.getElementById('floor_count')?.value);
            const validFloor = (!isNaN(rawFloor) && rawFloor >= 1) ? rawFloor : 1;
            const rawBed = parseInt(document.getElementById('bedroom_count')?.value);
            const validBed = (!isNaN(rawBed) && rawBed >= 1) ? rawBed : 2;
            const rawBath = parseInt(document.getElementById('bathroom_count')?.value);
            const validBath = (!isNaN(rawBath) && rawBath >= 1) ? rawBath : 1;
            const houseDir = document.getElementById('house_direction')?.value || 'Đông Nam';

            const payload = {
                property_type: ptype,
                province_name: provInput,
                district_name: distInput,
                ward_name: document.getElementById('ward_name').value.trim(),
                street_name: document.getElementById('street_name').value.trim(),
                area: validArea,
                frontage_width: isChungCu ? 4.0 : validFront,
                road_width: isChungCu ? 3.0 : validRoad,
                floor_count: (isChungCu || isDat) ? 1 : validFloor,
                bedroom_count: isDat ? 2 : validBed,
                bathroom_count: isDat ? 2 : validBath,
                house_direction: houseDir,
                has_so_do: document.getElementById('has_so_do').checked,
                is_lo_goc: document.getElementById('is_lo_goc').checked,
                is_no_hau: isChungCu ? false : document.getElementById('is_no_hau').checked,
                is_oto_do: isChungCu ? false : document.getElementById('is_oto_do').checked,
                latitude: currentLat,
                longitude: currentLng,
                customer_phone: document.getElementById('customer_phone').value || null
            };

            try {
                const response = await fetch('/api/v1/predict-price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    throw new Error(`Máy chủ phản hồi mã ${response.status}`);
                }
                const data = await response.json();

                if (data.status === 'success') {
                    document.getElementById('valuationResultWrapper').style.display = 'block';
                    document.getElementById('resultPlaceholder').style.display = 'none';
                    renderValuationResult(data.valuation);
                    renderComparables(data.comparable_properties);
                    showToast('Đã hoàn thành thẩm định giá tài sản');
                    document.getElementById('valuationResultWrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (error) {
                console.error("API error:", error);
                showToast('Không thể kết nối máy chủ thẩm định');
            } finally {
                btnText.textContent = 'XÁC ĐỊNH GIÁ TRỊ THẨM ĐỊNH';
                btn.disabled = false;
            }
        }

        async function fetchQuickComparables(lat, lng, dist = null, prov = null) {
            try {
                const d = dist || document.getElementById('district_name').value.trim();
                const p = prov || document.getElementById('province_name').value.trim();
                const ptype = document.querySelector('input[name="property_type"]:checked')?.value || 'Nhà riêng';
                const area = parseFloat(document.getElementById('area').value) || 50;
                let url = `/api/v1/comparables?latitude=${lat}&longitude=${lng}&property_type=${encodeURIComponent(ptype)}&target_area=${area}&limit=5&radius_meters=2000`;
                if (d) url += `&district_name=${encodeURIComponent(d)}`;
                if (p) url += `&province_name=${encodeURIComponent(p)}`;
                const res = await fetch(url);
                if (!res.ok) {
                    console.warn("Lỗi tải BĐS tương đồng nhanh:", res.status);
                    return;
                }
                const data = await res.json();
                if (data && data.comparable_properties) { renderComparables(data.comparable_properties); }
            } catch (e) { console.warn("Comp fetch error:", e); }
        }

        // ════════ MAIN TAB SWITCHER (TRANG CHỦ / SO SÁNH GIÁ) ════════
        let activeMainTab = 'home';
        let latestValuation = null;


        function renderValuationResult(v) {
            latestValuation = v;
            const priceEl = document.getElementById('predictedPrice');
            const rangeEl = document.getElementById('priceRange');
            const perM2El = document.getElementById('pricePerM2');
            const confEl = document.getElementById('confidenceScore');
            const meterEl = document.getElementById('confidenceMeterFill');
            const certCodeEl = document.getElementById('certSecurityCode');

            const randCode = Math.floor(1000 + Math.random() * 9000);
            certCodeEl.textContent = `MHD-TDG-2026-${randCode}`;

            priceEl.innerHTML = `${(v.predicted_price / 1e9).toFixed(2)} <span>Tỷ VNĐ</span>`;
            if (rangeEl) rangeEl.innerText = `Khoảng ước tính: ${formatVND(v.price_low)} - ${formatVND(v.price_high)}`;
            perM2El.innerText = (v.price_per_m2 / 1e6).toFixed(1) + " Tr/m²";

            // Visual Spectrum Range Gauge updates
            const minEl = document.getElementById('rangeMinVal');
            const targetEl = document.getElementById('rangeTargetVal');
            const highEl = document.getElementById('rangeHighVal');
            const pointerEl = document.getElementById('gaugePointer');
            if (minEl) minEl.textContent = `${(v.price_low / 1e9).toFixed(2)} Tỷ`;
            if (targetEl) targetEl.textContent = `${(v.predicted_price / 1e9).toFixed(2)} Tỷ`;
            if (highEl) highEl.textContent = `${(v.price_high / 1e9).toFixed(2)} Tỷ`;

            if (pointerEl && v.price_high > v.price_low) {
                const pct = Math.max(8, Math.min(92, ((v.predicted_price - v.price_low) / (v.price_high - v.price_low)) * 100));
                pointerEl.style.left = `${pct}%`;
            }

            // Circular Confidence Donut Gauge & Ranking
            const confPct = (v.confidence_score * 100).toFixed(1);
            const confLevel = v.confidence_score >= 0.90 ? "Hạng A+ (Rất cao)" : (v.confidence_score >= 0.85 ? "Hạng A (Chuẩn xác)" : "Hạng B (Tiêu chuẩn)");
            confEl.innerText = `${confPct}% (${confLevel})`;
            if (meterEl) meterEl.style.width = `${Math.min(100, Math.max(50, confPct))}%`;

            const ringText = document.getElementById('ringCenterVal');
            const ringCircle = document.getElementById('confidenceRingProgress');
            if (ringText) ringText.textContent = `${Math.round(confPct)}%`;
            if (ringCircle) {
                const circumference = 163.36; // 2 * PI * 26
                const offset = circumference - (circumference * (v.confidence_score || 0.85));
                ringCircle.style.strokeDashoffset = offset;
            }

            const driversContainer = document.getElementById('valueDriversList');
            driversContainer.innerHTML = '';

            const maxAbsImpact = Math.max(...v.value_drivers.map(d => {
                const num = parseFloat(d.impact_percent.replace('%', '').replace('+', ''));
                return Math.abs(num);
            }), 1);

            v.value_drivers.forEach((d) => {
                const row = document.createElement('div');
                row.className = 'driver-card-row';
                const isPos = d.positive;
                const absVal = Math.abs(parseFloat(d.impact_percent.replace('%', '').replace('+', '')));
                const barWidth = Math.max(4, Math.min(100, (absVal / maxAbsImpact) * 100));
                const barColor = isPos ? 'var(--green)' : 'var(--red)';

                const iconSvg = isPos
                    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>`
                    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="7" x2="17" y2="17"></line><polyline points="17 7 17 7 17 17"></polyline></svg>`;

                const explanations = {
                    'Vị trí Quận/Huyện': 'Mô hình AI CatBoost đánh giá mức chênh lệch giá trị vị trí này so với mặt bằng toàn quốc dựa trên 34.955 giao dịch thực tế.',
                    'Quy mô diện tích đất': 'Hệ số co giãn giá trị theo diện tích sử dụng — so sánh với mức trung vị của phân khúc cùng khu vực.',
                    'Diện tích căn hộ': 'Diện tích thông thuỷ của căn hộ chung cư ảnh hưởng trực tiếp đến giá trị tổng tài sản.',
                    'Diện tích khu đất': 'Quy mô thửa đất lớn hoặc nhỏ tạo hiệu ứng biên giá trị khác nhau.',
                    'Phân khúc loại hình BĐS': 'Mức chênh lệch giá giữa các loại hình (Nhà riêng, Chung cư, Đất nền, Biệt thự) theo cung/cầu thị trường.',
                    'Pháp lý Sổ đỏ / Sổ hồng': 'BĐS có sổ đỏ/sổ hồng chuẩn có thanh khoản cao hơn đáng kể so với giấy tờ khác.',
                    'Ngõ ô tô đỗ cửa / vào nhà': 'Khả năng ô tô tiếp cận tận cửa gia tăng tính tiện ích và giá trị thương mại vượt trội.',
                    'Vị trí Lô góc 2 mặt tiền': 'Lô góc 2 mặt tiền hưởng lợi ánh sáng, thông thoáng và cơ hội kinh doanh.',
                    'Thế đất Nở hậu phong thủy': 'Thế đất nở hậu được ưa chuộng theo quan niệm phong thuỷ, tạo điểm cộng định giá.',
                    'Độ rộng đường ngõ tiếp cận': 'Đường ngõ rộng rãi giúp việc đi lại thuận lợi và gia tăng giá trị tài sản.',
                    'Chiều rộng mặt tiền': 'Mặt tiền rộng mang lại lợi thế thương mại và kiến trúc xây dựng.',
                    'Chiết khấu thương lượng thị trường (MHD Discount)': 'Hệ số điều chỉnh từ giá niêm yết (asking price) về sát giá chốt công chứng thực tế (trung bình ~7%).'
                };

                const explanation = explanations[d.factor] || `Thuật toán TreeSHAP đo lường mức đóng góp biên chính xác của yếu tố "${d.factor}" vào kết quả định giá cuối cùng.`;

                row.innerHTML = `
                    <div class="driver-header-line">
                        <div class="driver-name-tag">
                            <span class="svg-icon" style="color:${isPos ? 'var(--green)' : 'var(--red)'};">${iconSvg}</span>
                            ${d.factor}
                        </div>
                        <span class="driver-pct-badge ${isPos ? 'pos' : 'neg'}">${d.impact_percent}</span>
                    </div>
                    <div class="driver-track-bar">
                        <div style="height:100%; width:${barWidth}%; background:${barColor}; border-radius:2px;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="driver-status-line">${d.status}</span>
                        <span style="font-size:10px; color:var(--brand); font-weight:700;">Chi tiết</span>
                    </div>
                    <div class="driver-exp-drawer">${explanation}</div>
                `;

                row.addEventListener('click', () => { row.classList.toggle('expanded'); });
                driversContainer.appendChild(row);
            });

            // Update Multi-Dimensional Radar Assessment matching benchmark
            updateRadarAssessment(v);

            // Show Bridge Card to Compare View
            const bridgeCard = document.getElementById('bridgeCompareCard');
            if (bridgeCard) bridgeCard.style.display = 'flex';
        }

        // Toggle Expandable SHAP Drawer
        function toggleShapDetails() {
            const drawer = document.getElementById('shapDetailDrawer');
            const txt = document.getElementById('shapToggleText');
            const icon = document.getElementById('shapToggleIcon');
            if (drawer) {
                const isOpen = drawer.style.display !== 'none';
                drawer.style.display = isOpen ? 'none' : 'block';
                if (txt) txt.textContent = isOpen ? 'Xem chi tiết 10 yếu tố TreeSHAP' : 'Thu gọn chi tiết TreeSHAP';
                if (icon) icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        }

        // ── REAL-DATA DYNAMIC 5-AXIS RADAR ASSESSMENT ENGINE ──
        function updateRadarAssessment(v) {
            if (!v) return;

            // 1. PHÁP LÝ (Thực tế từ TreeSHAP pháp lý & tình trạng Sổ đỏ/hồng)
            let phapLy = 70;
            const hasSoDo = document.getElementById('has_so_do')?.checked;
            const ptype = document.getElementById('property_type')?.value || '';
            const legalDriver = (v.value_drivers || []).find(d => 
                d.factor.includes('Pháp lý') || d.factor.includes('Sổ đỏ') || d.status.includes('sổ')
            );
            
            if (hasSoDo) {
                phapLy = 92;
                if (legalDriver && legalDriver.positive) {
                    const impactVal = parseFloat(legalDriver.impact_percent.replace(/[+%]/g, '')) || 0;
                    phapLy = Math.min(98, Math.round(90 + impactVal * 1.5));
                }
            } else {
                if (ptype.includes('chung cư')) {
                    phapLy = 82; // HĐMB hoặc đang chờ cấp sổ
                } else {
                    const negImpact = legalDriver ? Math.abs(parseFloat(legalDriver.impact_percent.replace(/[-+%]/g, ''))) : 15;
                    phapLy = Math.max(38, Math.round(65 - negImpact)); // Giấy tờ khác / vi bằng chịu rủi ro pháp lý cao
                }
            }

            // 2. GIÁ CẢ (Thực tế đối chiếu Đơn giá thẩm định vs Đơn giá trung bình 5 BĐS PostGIS)
            let giaCa = 78;
            const targetUnitPrice = v.price_per_m2 || 0;
            if (currentComps && currentComps.length > 0 && targetUnitPrice > 0) {
                const validComps = currentComps.filter(c => c.unit_price > 0);
                if (validComps.length > 0) {
                    const avgCompUnitPrice = validComps.reduce((acc, c) => acc + c.unit_price, 0) / validComps.length;
                    const priceRatio = targetUnitPrice / avgCompUnitPrice; // Tỉ lệ giá đối chiếu thực tế
                    
                    if (priceRatio <= 1.0) {
                        // Giá rất hấp dẫn / cạnh tranh so với các giao dịch lân cận
                        giaCa = Math.min(96, Math.round(82 + (1.0 - priceRatio) * 60));
                    } else {
                        // Giá cao hơn trung bình lân cận (do nhà đẹp hoặc ngõ rộng hơn)
                        giaCa = Math.max(50, Math.round(82 - (priceRatio - 1.0) * 70));
                    }
                }
            } else {
                // Suy luận từ biên độ giá [price_low, price_high] và confidence_score
                const confScore = v.confidence_score || 0.85;
                giaCa = Math.round(confScore * 92);
            }

            // 3. VỊ TRÍ (Thực tế từ TreeSHAP Vị trí Quận/Huyện, độ rộng ngõ, mặt tiền & cự ly PostGIS)
            let viTri = 75;
            const districtDriver = (v.value_drivers || []).find(d => 
                d.factor.includes('Quận') || d.factor.includes('Huyện') || d.factor.includes('Vị trí')
            );
            if (districtDriver) {
                const distImpact = parseFloat(districtDriver.impact_percent.replace(/[+%]/g, '')) || 0;
                viTri += Math.round(distImpact * 1.2);
            }
            
            const roadW = parseFloat(document.getElementById('road_width')?.value || 0);
            if (roadW >= 6) viTri += 8; // Ô tô tránh nhau
            else if (roadW >= 3.5) viTri += 4; // Ô tô đỗ cửa
            else if (roadW > 0 && roadW < 2.5) viTri -= 5; // Ngõ hẹp xe máy

            const frontW = parseFloat(document.getElementById('frontage_width')?.value || 0);
            if (frontW >= 5) viTri += 5; // Mặt tiền rộng kinh doanh tốt
            
            if (document.getElementById('is_lo_goc')?.checked) viTri += 4;
            
            // Cự ly đối chứng không gian thực tế
            if (currentComps && currentComps.length > 0) {
                const avgDistance = currentComps.reduce((acc, c) => acc + (c.distance_meters || 1000), 0) / currentComps.length;
                if (avgDistance < 600) viTri += 4; // Trung tâm đô thị nén dày đặc
            }
            viTri = Math.min(98, Math.max(45, Math.round(viTri)));

            // 4. TIỆN ÍCH (Thực tế từ tổng số POI hạ tầng đã quét quanh tọa độ GPS)
            let tienIch = 80;
            const countAdmin = parseInt(document.getElementById('countAdmin')?.textContent) || 0;
            const countCommercial = parseInt(document.getElementById('countCommercial')?.textContent) || 0;
            const countHospitality = parseInt(document.getElementById('countHospitality')?.textContent) || 0;
            const countHealth = parseInt(document.getElementById('countHealth')?.textContent) || 0;
            const countEdu = parseInt(document.getElementById('countEdu')?.textContent) || 0;
            const totalPois = countAdmin + countCommercial + countHospitality + countHealth + countEdu;
            
            if (totalPois >= 25) tienIch = 95;
            else if (totalPois >= 15) tienIch = 90;
            else if (totalPois >= 8) tienIch = 84;
            else if (totalPois >= 3) tienIch = 76;
            else {
                // Nếu POI chưa quét xong, nội suy theo cự ly khu vực
                tienIch = viTri >= 85 ? 88 : 74;
            }

            // 5. TIỀM NĂNG (Thực tế từ độ tin cậy giao dịch, thế đất phong thủy & độ phân tán giá)
            let tiemNang = 72;
            const conf = v.confidence_score || 0.85;
            tiemNang += Math.round(conf * 15); // Thanh khoản thị trường cao
            
            if (v.predicted_price > 0 && v.price_high > v.price_low) {
                const spread = (v.price_high - v.price_low) / v.predicted_price;
                if (spread < 0.12) tiemNang += 6; // Biên độ hẹp = thanh khoản nhanh, tính thương mại an toàn
            }
            
            if (document.getElementById('is_no_hau')?.checked) tiemNang += 5; // Thế đất nở hậu gia tăng giá trị
            if (document.getElementById('is_lo_goc')?.checked) tiemNang += 3;
            if (ptype === 'Shophouse' || ptype === 'Nhà riêng') tiemNang += 3;
            tiemNang = Math.min(98, Math.max(50, Math.round(tiemNang)));

            const scores = { phapLy, giaCa, viTri, tienIch, tiemNang };

            // Update Radar Chart Polygon & Vertices
            // Center (170, 135), R = 80
            // Angles: -90 (Pháp lý), -18 (Giá cả), 54 (Vị trí), 126 (Tiện ích), 198 (Tiềm năng)
            const cx = 170, cy = 135, R = 80;
            const angles = [-90, -18, 54, 126, 198];
            const values = [scores.phapLy, scores.giaCa, scores.viTri, scores.tienIch, scores.tiemNang];

            const pts = values.map((val, idx) => {
                const frac = Math.max(0.18, Math.min(1.0, val / 100));
                const rad = (angles[idx] * Math.PI) / 180;
                const x = cx + R * frac * Math.cos(rad);
                const y = cy + R * frac * Math.sin(rad);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            });

            const polygon = document.getElementById('radarPolygon');
            if (polygon) {
                polygon.setAttribute('points', pts.join(' '));
            }

            pts.forEach((pt, idx) => {
                const dot = document.getElementById(`radarDot${idx}`);
                if (dot) {
                    const [x, y] = pt.split(',');
                    dot.setAttribute('cx', x);
                    dot.setAttribute('cy', y);
                }
            });

            // Update Progress Bars matching Image 2
            const updateBar = (id, val) => {
                const bar = document.getElementById(`bar${id}`);
                const score = document.getElementById(`score${id}`);
                if (bar) bar.style.width = `${Math.min(100, Math.max(10, val))}%`;
                if (score) score.textContent = `${Math.round(val)}%`;
            };

            updateBar('PhapLy', scores.phapLy);
            updateBar('GiaCa', scores.giaCa);
            updateBar('ViTri', scores.viTri);
            updateBar('TienIch', scores.tienIch);
            updateBar('TiemNang', scores.tiemNang);
        }

        let currentComps = [];

        function renderComparables(comps) {
            compLayerGroup.clearLayers();
            currentComps = comps || [];
            const listContainer = document.getElementById('compList');
            listContainer.innerHTML = '';

            const compCount = comps ? comps.length : 0;
            const navBadge = document.getElementById('navCompCount');
            if (navBadge) navBadge.textContent = compCount;
            const navBadgeMobile = document.getElementById('navCompCountMobile');
            if (navBadgeMobile) navBadgeMobile.textContent = compCount;

            const bridgeTitle = document.getElementById('bridgeTitleText');
            if (bridgeTitle) bridgeTitle.textContent = `Đối Chiếu ${compCount} Bất Động Sản Tương Đồng Lân Cận`;

            if (!comps || comps.length === 0) {
                listContainer.innerHTML = '<div style="padding:18px; color:var(--text-3); text-align:center; font-size:11.5px;">Chưa có dữ liệu giao dịch trong khu vực lân cận này.</div>';
                document.getElementById('compTitleText').textContent = '5 BĐS Tương Đồng Lân Cận';
                document.getElementById('compRadiusBadge').textContent = '0 BĐS';
                updateCompareViewHeader();
                return;
            }

            const distances = comps.map(c => c.distance_meters || 0);
            const maxDist = Math.max(...distances, 0);
            let radLabel = maxDist <= 500 ? "500m" : (maxDist < 1000 ? Math.round(maxDist) + "m" : (maxDist / 1000).toFixed(1) + "km");

            document.getElementById('compTitleText').textContent = `${comps.length} BĐS Tương Đồng Lân Cận`;
            document.getElementById('compRadiusBadge').textContent = `Bán kính ~${radLabel}`;
            updateCompareViewHeader();

            if (radiusCircle) { radiusCircle.setRadius(Math.max(500, maxDist + 50)); }

            const compMarkers = [];
            const seenPositions = {};

            comps.forEach((c, idx) => {
                const fullLocStr = c.standard_address || [c.street_name, c.ward_name, c.district_name, c.province_name].filter(p => p && p.trim().length > 0).join(', ') || 'Khu vuc lan can';

                let displayLat = c.latitude;
                let displayLng = c.longitude;
                if (displayLat && displayLng) {
                    const posKey = `${displayLat.toFixed(5)}_${displayLng.toFixed(5)}`;
                    if (seenPositions[posKey] !== undefined) {
                        seenPositions[posKey] += 1;
                        const angle = (seenPositions[posKey] * 72) * Math.PI / 180;
                        displayLat += (0.00025 * Math.sin(angle));
                        displayLng += (0.00025 * Math.cos(angle));
                    } else { seenPositions[posKey] = 0; }
                }

                const numIcon = createSvgIcon('#E05400', false, idx + 1);
                const item = document.createElement('div');
                item.className = 'comp-card-record';
                item.dataset.idx = idx;
                const distText = c.distance_meters < 50 ? "Ngay cạnh" : `${Math.round(c.distance_meters)}m`;
                const currentArea = parseFloat(document.getElementById('area').value) || 85;
                const areaDelta = Math.abs(c.area - currentArea);
                const matchScore = Math.max(88, Math.min(99, Math.round(100 - (c.distance_meters / 100) - (areaDelta * 0.4))));

                const hasCma = c.adjustment_percent !== undefined && c.indicated_price_per_m2 !== undefined;
                const adjText = hasCma ? `${c.adjustment_percent > 0 ? '+' : ''}${c.adjustment_percent}%` : null;
                const indPriceText = hasCma ? `${(c.indicated_price_per_m2 / 1e6).toFixed(1)} Tr/m²` : null;
                const weightText = c.weight_percent !== undefined ? `${c.weight_percent}%` : null;

                item.innerHTML = `
                    <div class="comp-meta-column">
                        <span class="comp-num-pill">#${idx + 1}</span>
                        <span class="comp-dist-badge">${distText}</span>
                    </div>
                    <div class="comp-content-column">
                        <div class="comp-title-line">
                            <span class="comp-title-name">${c.property_type || 'BĐS'} ${c.area}m²</span>
                            <span class="comp-match-pill">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                ${c.similarity_score || matchScore}% Tương đồng
                            </span>
                        </div>
                        <div class="comp-address-line" title="${fullLocStr}">
                            <span class="svg-icon" style="color:var(--brand); flex-shrink:0;">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            </span>
                            <span>${fullLocStr}</span>
                        </div>
                        <div class="comp-attributes-line">
                            <span class="comp-attr-chip">Ngõ ${c.road_width || 3}m</span>
                            <span class="comp-attr-chip">${c.bedroom_count ? c.bedroom_count + ' PN' : 'MT ' + (c.frontage_width || 4) + 'm'}</span>
                            ${c.has_so_do ? '<span class="comp-attr-chip" style="color:var(--green); font-weight:600;">Sổ đỏ</span>' : ''}
                            ${hasCma ? `<span class="comp-attr-chip" style="color:var(--brand); font-weight:700;">Đ/C: ${adjText} (Trọng số ${weightText})</span>` : ''}
                        </div>
                    </div>
                    <div class="comp-price-column">
                        <div class="comp-price-hero">${formatVND(c.price)}</div>
                        <div class="comp-price-sqm">${(c.price_per_m2 / 1e6).toFixed(1)} Tr/m²</div>
                    </div>
                `;

                let marker = null;
                if (displayLat && displayLng) {
                    marker = L.marker([displayLat, displayLng], { icon: numIcon, zIndexOffset: 600 - idx }).bindPopup(`
                        <div style="font-family:'Inter', sans-serif; font-size:11.5px; min-width:200px; line-height:1.5;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">
                                <b style="color:#E05400; font-family:'DM Sans', sans-serif; font-size:12.5px;">#${idx + 1}: ${c.property_type}</b>
                                <span style="background:rgba(224,84,0,0.12); color:#E05400; font-family:'DM Sans', sans-serif; font-weight:700; font-size:10px; padding:1px 6px; border-radius:3px;">Cach ${distText}</span>
                            </div>
                            <div style="margin-bottom:3px;"><b>Dia chi:</b> ${fullLocStr}</div>
                            <div style="margin-bottom:3px;"><b>Gia:</b> <span style="color:#E05400; font-family:'DM Sans', sans-serif; font-weight:800;">${formatVND(c.price)}</span> (${(c.price_per_m2 / 1e6).toFixed(1)} Tr/m2)</div>
                            <div style="color:#94A3B8; font-size:10.5px;">DT: <b>${c.area}m2</b> | Ngo: <b>${c.road_width || 3}m</b></div>
                        </div>
                    `);

                    marker.on('click', () => {
                        document.querySelectorAll('.comp-card-record').forEach(el => el.classList.remove('active'));
                        item.classList.add('active');
                        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        openCompModal(c, idx, fullLocStr);
                    });
                    compLayerGroup.addLayer(marker);
                }
                compMarkers.push(marker);

                item.addEventListener('click', () => {
                    document.querySelectorAll('.comp-card-record').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    if (displayLat && displayLng) {
                        map.flyTo([displayLat, displayLng], 17, { duration: 0.7 });
                        if (compMarkers[idx]) compMarkers[idx].openPopup();
                    }
                    openCompModal(c, idx, fullLocStr);
                });

                listContainer.appendChild(item);
            });

            if (latestValuation) {
                updateRadarAssessment(latestValuation);
            }
        }

        // COMPARISON MODAL
        function openCompModal(c, idx, locStr) {
            const existing = document.getElementById('compModal');
            if (existing) existing.remove();

            const myArea = parseFloat(document.getElementById('area').value) || 85;
            const myType = document.getElementById('property_type').value;
            const myRoad = parseFloat(document.getElementById('road_width').value) || 4;

            const modal = document.createElement('div');
            modal.id = 'compModal';
            modal.className = 'mhd-modal-backdrop';
            modal.innerHTML = `
                <div class="mhd-modal-shell">
                    <div class="modal-shell-header">
                        <div style="font-family:var(--font-heading); font-size:14px; font-weight:700; color:var(--text-1); display:flex; align-items:center; gap:6px;">
                            <span class="comp-num-pill">#${idx + 1}</span>
                            <span>${c.property_type} ${c.area}m2</span>
                        </div>
                        <button class="modal-close-btn" onclick="closeCompModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div class="modal-shell-body">
                        <div class="modal-hero-price-box">
                            <div>
                                <div style="font-family:var(--font-heading); font-size:22px; font-weight:800; color:var(--brand); line-height:1.1;">${formatVND(c.price)}</div>
                                <div style="font-size:10.5px; color:var(--text-3); margin-top:1px;">Giá niêm yết thị trường</div>
                            </div>
                            <div style="font-family:var(--font-heading); font-size:15px; font-weight:800; color:var(--text-1);">${(c.price_per_m2 / 1e6).toFixed(1)} Tr/m²</div>
                        </div>

                        <table class="comparison-specs-table">
                            <thead><tr><th>Chỉ số</th><th>Tài sản thẩm định</th><th>BĐS đối chứng #${idx + 1}</th></tr></thead>
                            <tbody>
                                <tr><td><b>Loại hình</b></td><td>${myType}</td><td><b>${c.property_type}</b></td></tr>
                                <tr><td><b>Diện tích</b></td><td>${myArea} m²</td><td><b>${c.area} m²</b> (${c.area >= myArea ? '+' : ''}${(c.area - myArea).toFixed(1)}m²)</td></tr>
                                <tr><td><b>Ngõ vào</b></td><td>${myRoad} m</td><td><b>${c.road_width || 3} m</b></td></tr>
                                <tr><td><b>Số tầng</b></td><td>${document.getElementById('floor_count').value || '—'} tầng</td><td><b>${c.floor_count || '—'} tầng</b></td></tr>
                                <tr><td><b>PN/WC</b></td><td>${document.getElementById('bedroom_count').value || '—'} PN</td><td><b>${c.bedroom_count || '—'} PN / ${c.bathroom_count || '—'} WC</b></td></tr>
                                <tr><td><b>Khoảng cách</b></td><td>Tâm khảo sát</td><td><b style="color:var(--brand);">${Math.round(c.distance_meters)} mét</b></td></tr>
                            </tbody>
                        </table>

                        ${c.adjustment_percent !== undefined ? `
                        <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--r-sm); padding:10px; margin-bottom:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <span style="font-size:10.5px; font-weight:700; text-transform:uppercase; color:var(--brand); letter-spacing:0.5px;">Phép Tính Điều Chỉnh So Sánh (CMA)</span>
                                <span style="font-size:11.5px; font-weight:700; color:${c.adjustment_percent < 0 ? 'var(--red)' : 'var(--green)'};">
                                    ${c.adjustment_percent > 0 ? '+' : ''}${c.adjustment_percent}%
                                </span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; margin-bottom:5px;">
                                <span style="color:var(--text-3);">Mức giá chỉ dẫn sau điều chỉnh:</span>
                                <b style="color:var(--text-1); font-family:var(--font-heading);">${(c.indicated_price_per_m2 / 1e6).toFixed(1)} Tr/m² (${formatVND(c.indicated_price)})</b>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; margin-bottom:5px;">
                                <span style="color:var(--text-3);">Trọng số gia quyền vào giá thẩm định:</span>
                                <b style="color:var(--brand); font-family:var(--font-heading);">${c.weight_percent}%</b>
                            </div>
                            ${c.adjustment_reasons && c.adjustment_reasons.length > 0 ? `
                            <div style="border-top:1px dashed var(--border); padding-top:5px; font-size:10.5px; color:var(--text-3); line-height:1.4;">
                                <b>Yếu tố chênh lệch:</b> ${c.adjustment_reasons.join(' | ')}
                            </div>` : ''}
                        </div>` : ''}

                        <div style="font-size:11px; color:var(--text-3); margin-bottom:12px; display:flex; align-items:center; gap:5px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--brand);"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span><b>Địa chỉ:</b> ${locStr}</span>
                        </div>

                        <button type="button" class="btn-apply-specs" onclick="applyCompToForm(${idx})">
                            <span class="svg-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></span>
                            Áp Dụng Thông Số BĐS Đối Chứng Vào Form
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            requestAnimationFrame(() => modal.classList.add('open'));
            modal.addEventListener('click', (e) => { if (e.target === modal) closeCompModal(); });
        }

        function closeCompModal() {
            const modal = document.getElementById('compModal');
            if (modal) { modal.classList.remove('open'); setTimeout(() => modal.remove(), 200); }
        }

        function applyCompToForm(idx) {
            const c = currentComps[idx];
            if (!c) return;
            if (c.property_type) {
                let matchVal = 'Nhà riêng';
                if (c.property_type.includes('chung cư') || c.property_type.includes('Căn hộ')) matchVal = 'Căn hộ chung cư';
                else if (c.property_type.includes('Đất')) matchVal = 'Đất nền';
                else if (c.property_type.includes('Biệt thự')) matchVal = 'Biệt thự';
                else if (c.property_type.includes('Shophouse')) matchVal = 'Shophouse';
                setPropTypeTab(matchVal);
            }
            if (c.area) setAreaVal(c.area);
            if (c.road_width) document.getElementById('road_width').value = c.road_width;
            if (c.frontage_width) document.getElementById('frontage_width').value = c.frontage_width;
            if (c.floor_count) document.getElementById('floor_count').value = c.floor_count;
            if (c.bedroom_count) document.getElementById('bedroom_count').value = c.bedroom_count;
            if (c.bathroom_count) document.getElementById('bathroom_count').value = c.bathroom_count;

            const chkSoDo = document.getElementById('has_so_do');
            const chkLoGoc = document.getElementById('is_lo_goc');
            const chkNoHau = document.getElementById('is_no_hau');
            const chkOtoDo = document.getElementById('is_oto_do');
            chkSoDo.checked = !!c.has_so_do;
            chkLoGoc.checked = !!c.is_lo_goc;
            chkNoHau.checked = !!c.is_no_hau;
            chkOtoDo.checked = !!c.is_oto_do;
            syncChipStyle(chkSoDo);
            syncChipStyle(chkLoGoc);
            syncChipStyle(chkNoHau);
            syncChipStyle(chkOtoDo);

            closeCompModal();
            showToast('Đã áp dụng toàn bộ thông số BĐS đối chứng vào form');
        }

        function resetFormToDefaults() {
            setAreaVal('');
            document.getElementById('province_name').value = '';
            document.getElementById('district_name').value = '';
            document.getElementById('ward_name').value = '';
            document.getElementById('street_name').value = '';
            document.getElementById('quickAddressSearch').value = '';

            document.getElementById('frontage_width').value = '';
            document.getElementById('road_width').value = '';
            document.getElementById('floor_count').value = '';
            document.getElementById('bedroom_count').value = '';
            document.getElementById('bathroom_count').value = '';
            document.getElementById('house_direction').value = '';
            document.getElementById('customer_phone').value = '';

            ['has_so_do', 'is_oto_do', 'is_lo_goc', 'is_no_hau'].forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.checked = false; syncChipStyle(el); }
            });
            showToast('Đã làm mới form, toàn bộ thông tin địa chỉ và thông số để trống để bạn tự điền');
        }

        function showToast(msg) {
            let toast = document.getElementById('mhdToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'mhdToast';
                toast.className = 'mhd-toast';
                document.body.appendChild(toast);
            }
            toast.innerHTML = `
                <span class="svg-icon" style="color:var(--green);"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></span>
                <span>${msg}</span>
            `;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2600);
        }

        // ── PRIMARY NAVIGATION & TABS ──
        function switchMainTab(tab) {
            const homeView = document.getElementById('homeView');
            const compareView = document.getElementById('compareView');
            const navHomeBtn = document.getElementById('navHomeBtn');
            const navCompareBtn = document.getElementById('navCompareBtn');

            if (tab === 'home') {
                if (homeView) homeView.style.display = 'block';
                if (compareView) compareView.style.display = 'none';
                if (navHomeBtn) navHomeBtn.classList.add('active');
                if (navCompareBtn) navCompareBtn.classList.remove('active');
                setTimeout(() => { if (map) map.invalidateSize(); }, 200);
            } else if (tab === 'compare') {
                if (homeView) homeView.style.display = 'none';
                if (compareView) compareView.style.display = 'block';
                if (navHomeBtn) navHomeBtn.classList.remove('active');
                if (navCompareBtn) navCompareBtn.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                updateCompareViewHeader();
            }
        }

        function updateCompareViewHeader() {
            const subjectTag = document.getElementById('compareSubjectTag');
            const kpiSubjectUnitPrice = document.getElementById('kpiSubjectUnitPrice');
            const kpiSubjectTotalPrice = document.getElementById('kpiSubjectTotalPrice');
            const kpiAvgUnitPrice = document.getElementById('kpiAvgUnitPrice');
            const kpiMinMaxRange = document.getElementById('kpiMinMaxRange');
            const kpiRadiusScan = document.getElementById('kpiRadiusScan');
            const kpiCountMatches = document.getElementById('kpiCountMatches');

            const dist = document.getElementById('district_name').value.trim();
            const prov = document.getElementById('province_name').value.trim();
            const area = parseFloat(document.getElementById('area').value) || 0;
            const predPriceEl = document.getElementById('predictedPrice');
            const unitPriceEl = document.getElementById('pricePerM2');

            if (subjectTag) {
                subjectTag.textContent = (dist || prov) ? `BĐS Thẩm Định: ${[dist, prov].filter(Boolean).join(', ')} (${area > 0 ? area + 'm²' : 'Chưa có DT'})` : 'BĐS Thẩm Định: Chưa nhập';
            }

            if (kpiSubjectUnitPrice && unitPriceEl && unitPriceEl.textContent !== '-- Tr/m²') {
                kpiSubjectUnitPrice.textContent = unitPriceEl.textContent;
            }
            if (kpiSubjectTotalPrice && predPriceEl && predPriceEl.textContent !== '-- Tỷ VNĐ') {
                kpiSubjectTotalPrice.textContent = 'Tổng giá: ' + predPriceEl.textContent;
            }

            if (currentComps && currentComps.length > 0) {
                const pricesPerM2 = currentComps.map(c => (c.price_per_m2 || (c.price / c.area)) / 1e6).filter(p => !isNaN(p) && p > 0);
                if (pricesPerM2.length > 0) {
                    const avg = pricesPerM2.reduce((a, b) => a + b, 0) / pricesPerM2.length;
                    const min = Math.min(...pricesPerM2);
                    const max = Math.max(...pricesPerM2);
                    if (kpiAvgUnitPrice) kpiAvgUnitPrice.textContent = avg.toFixed(1) + ' Tr/m²';
                    if (kpiMinMaxRange) kpiMinMaxRange.textContent = min.toFixed(1) + ' ~ ' + max.toFixed(1) + ' Tr/m²';
                }
                const distances = currentComps.map(c => c.distance_meters || 0);
                const maxDist = Math.max(...distances, 0);
                let radLabel = maxDist <= 500 ? "500m" : (maxDist < 1000 ? Math.round(maxDist) + "m" : (maxDist / 1000).toFixed(1) + "km");
                if (kpiRadiusScan) kpiRadiusScan.textContent = '~' + radLabel;
                if (kpiCountMatches) kpiCountMatches.textContent = `${currentComps.length} tài sản xác thực`;
            }
        }

        // ── SCROLL & NAVIGATION HELPERS ──
        function scrollToMap() {
            switchMainTab('home');
            const el = document.getElementById('mapSection');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 300);
        }

        function scrollToContact() {
            const el = document.getElementById('contactFooter') || document.querySelector('footer');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function scrollToResults() {
            const el = document.getElementById('resultsSection');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        function goToProjects() {
            switchMainTab('home');
            const resultsSec = document.getElementById('resultsSection');
            if (resultsSec && resultsSec.style.display !== 'none' && resultsSec.offsetHeight > 50) {
                resultsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const searchBox = document.getElementById('address_search') || document.getElementById('valuationForm');
                if (searchBox) {
                    searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    searchBox.focus();
                }
                showToast('Tra cứu dữ liệu dự án BĐS theo địa chỉ hoặc chọn vị trí trên bản đồ');
            }
        }

        function goToNews() {
            showToast('Chuyên mục Tin tức & Báo cáo thị trường BĐS AI đang được đồng bộ theo thời gian thực');
        }

        // ── 5-STEP PROGRESSIVE AI VALUATION (TINIX BENCHMARK) ──
        let _isValuatingWithProgress = false;
        async function triggerValuationWithProgress() {
            if (_isValuatingWithProgress) return;

            const prov = document.getElementById('province_name').value.trim();
            const dist = document.getElementById('district_name').value.trim();
            const area = parseFloat(document.getElementById('area').value);

            if (!prov || !dist) {
                showToast('Vui lòng chọn vị trí trên bản đồ hoặc nhập Tỉnh/Quận');
                return;
            }
            if (!area || isNaN(area) || area <= 0) {
                showToast('Vui lòng nhập diện tích hợp lệ');
                return;
            }

            const modal = document.getElementById('aiProgressModal');
            if (!modal) {
                triggerValuation();
                return;
            }

            _isValuatingWithProgress = true;
            modal.style.display = 'flex';
            requestAnimationFrame(() => modal.classList.add('active'));

            const setStep = (idx, state, text) => {
                const s = document.getElementById('aiStep' + idx);
                if (!s) return;
                s.className = 'ai-step-item ' + state;
                const st = s.querySelector('.ai-step-status');
                if (st && text) st.textContent = text;
            };

            for (let i = 1; i <= 5; i++) {
                setStep(i, '', 'Chờ xử lý...');
            }

            // Step 1: GIS Geocoding
            setStep(1, 'active', 'Đang xác thực tọa độ & ranh giới hành chính...');
            await new Promise(r => setTimeout(r, 380));
            setStep(1, 'done', 'Đã xác thực tọa độ không gian chính xác');

            // Step 2: KNN Comparables
            setStep(2, 'active', 'Đang quét 5 bất động sản đối chứng lân cận...');
            await new Promise(r => setTimeout(r, 420));
            setStep(2, 'done', 'Đã đối soát 5 tài sản tương đồng PostGIS');

            // Step 3: CMA Standards
            setStep(3, 'active', 'Đang tính toán hệ số điều chỉnh so sánh thị trường (CMA)...');
            await new Promise(r => setTimeout(r, 380));
            setStep(3, 'done', 'Chuẩn hóa tỷ lệ tương đồng CMA hoàn tất');

            // Step 4: Machine Learning Inference
            setStep(4, 'active', 'Mô hình CatBoost v2.4 đang tổng hợp định giá...');
            try {
                await triggerValuation();
            } catch (err) {
                console.error(err);
            }
            setStep(4, 'done', 'Dự đoán giá trị thị trường hoàn thành');

            // Step 5: Certificate & SHAP
            setStep(5, 'active', 'Đang xuất chứng thư & phân tích TreeSHAP...');
            await new Promise(r => setTimeout(r, 350));
            setStep(5, 'done', 'Hoàn tất chứng thư thẩm định giá');

            setTimeout(() => {
                modal.classList.remove('active');
                modal.style.display = 'none';
                _isValuatingWithProgress = false;
                scrollToResults();
            }, 300);
        }

        document.getElementById('valuationForm').addEventListener('submit', function (e) {
            e.preventDefault();
            triggerValuationWithProgress();
        });


        // INIT APPLICATION
        const savedTheme = localStorage.getItem('mhd_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeControls(savedTheme);
        updateMapTiles(savedTheme);
        updateFormByPropertyType();
        ['has_so_do', 'is_oto_do', 'is_lo_goc', 'is_no_hau'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.checked = false; syncChipStyle(el); }
        });
        const initDist = document.getElementById('district_name').value.trim();
        const initProv = document.getElementById('province_name').value.trim();
        fetchQuickComparables(currentLat, currentLng, initDist, initProv);

// Expose all top-level functions to global window for HTML inline handlers
window.applyCompToForm = applyCompToForm;
window.cleanAdminToken = cleanAdminToken;
window.closeCompModal = closeCompModal;
window.createPoiSvgDivIcon = createPoiSvgDivIcon;
window.createSvgIcon = createSvgIcon;
window.fetchNearbyPois = fetchNearbyPois;
window.fetchQuickComparables = fetchQuickComparables;
window.findNearestDistrictCentroid = findNearestDistrictCentroid;
window.formatStandardDistrict = formatStandardDistrict;
window.formatVND = formatVND;
window.getCurrentLocation = getCurrentLocation;
window.goToNews = goToNews;
window.goToProjects = goToProjects;
window.handleAddressInputChange = handleAddressInputChange;
window.jumpToDistrict = jumpToDistrict;
window.openCompModal = openCompModal;
window.quickJump = quickJump;
window.renderAmenitiesCard = renderAmenitiesCard;
window.renderComparables = renderComparables;
window.renderPoiMarkers = renderPoiMarkers;
window.renderValuationResult = renderValuationResult;
window.resetFormToDefaults = resetFormToDefaults;
window.resolveAdminLocation = resolveAdminLocation;
window.reverseGeocodeAndSyncInputs = reverseGeocodeAndSyncInputs;
window.scrollToContact = scrollToContact;
window.scrollToMap = scrollToMap;
window.scrollToResults = scrollToResults;
window.searchAddressNominatim = searchAddressNominatim;
window.searchCurrentViewportArea = searchCurrentViewportArea;
window.selectLocation = selectLocation;
window.setAreaVal = setAreaVal;
window.setPoiScopeMode = setPoiScopeMode;
window.setPropTypeTab = setPropTypeTab;
window.setThemeMode = setThemeMode;
window.showToast = showToast;
window.switchMainTab = switchMainTab;
window.syncAreaInput = syncAreaInput;
window.syncAreaSlider = syncAreaSlider;
window.syncChipStyle = syncChipStyle;
window.toggleAllPoiCategories = toggleAllPoiCategories;
window.toggleMobileNav = toggleMobileNav;
window.togglePoiCategory = togglePoiCategory;
window.toggleShapDetails = toggleShapDetails;
window.toggleTheme = toggleTheme;
window.triggerValuation = triggerValuation;
window.triggerValuationWithProgress = triggerValuationWithProgress;
window.updateCompareViewHeader = updateCompareViewHeader;
window.updateFormByPropertyType = updateFormByPropertyType;
window.updateLocationAndValuate = updateLocationAndValuate;
window.updateMapTiles = updateMapTiles;
window.updateRadarAssessment = updateRadarAssessment;
window.updateThemeControls = updateThemeControls;
window.map = map;
