// MHD REAL ESTATE TECH • BACKEND API CLIENT

const API_BASE = '/api/v1';

export async function predictPropertyPrice(payload) {
    const res = await fetch(`${API_BASE}/predict-price`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Lỗi máy chủ (${res.status})`);
    }
    return await res.json();
}

export async function fetchComparables(params) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/comparables?${query}`);
    if (!res.ok) throw new Error('Không thể tải dữ liệu BĐS so sánh');
    return await res.json();
}

export async function fetchSpatialHeatmap(longitude, latitude, radius_meters = 4000) {
    const res = await fetch(`${API_BASE}/spatial-heatmap?longitude=${longitude}&latitude=${latitude}&radius_meters=${radius_meters}`);
    if (!res.ok) return { status: 'error', heatmap_points: [] };
    return await res.json();
}

export async function fetchPriceTrend(district, province, propertyType = 'Nhà riêng', currentPriceM2 = 0) {
    const params = new URLSearchParams({
        district_name: district || '',
        province_name: province || '',
        property_type: propertyType,
        current_price_m2: currentPriceM2
    }).toString();
    const res = await fetch(`${API_BASE}/price-trend?${params}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function geocodeAddress(province, district, ward = '', street = '') {
    const params = new URLSearchParams({
        province: province || '',
        district: district || '',
        ward: ward || '',
        street: street || ''
    }).toString();
    const res = await fetch(`${API_BASE}/geocode?${params}`);
    if (!res.ok) throw new Error('Lỗi geocoding địa chỉ');
    return await res.json();
}

export async function reverseGeocode(latitude, longitude) {
    const res = await fetch(`${API_BASE}/reverse-geocode?latitude=${latitude}&longitude=${longitude}`);
    if (!res.ok) throw new Error('Lỗi reverse geocoding');
    return await res.json();
}

export async function checkModelStatus() {
    const res = await fetch(`${API_BASE}/model-status`);
    if (!res.ok) return { status: 'inactive' };
    return await res.json();
}
