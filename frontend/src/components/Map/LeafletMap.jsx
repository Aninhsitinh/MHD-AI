import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
import { reverseGeocode } from '../../services/api';

export default function LeafletMap({ 
    theme, 
    coords, 
    onLocationChange, 
    addressDisplay,
    radius = 500
}) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerInstance = useRef(null);
    const circleInstance = useRef(null);
    const tileLayerInstance = useRef(null);

    const [searchInput, setSearchInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    // Custom MHD Brand Pin Icon
    const createPinIcon = () => {
        return L.divIcon({
            className: 'mhd-custom-marker-icon',
            html: `
                <div class="mhd-pin-wrapper">
                    <div class="mhd-pin-pulse"></div>
                    <div class="mhd-pin-head">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="#EC4A00" stroke-width="2.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3" fill="#EC4A00"></circle>
                        </svg>
                    </div>
                </div>
            `,
            iconSize: [40, 48],
            iconAnchor: [20, 44]
        });
    };

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const initialLat = coords.lat || 10.776889;
        const initialLng = coords.lng || 106.700806;

        const map = L.map(mapRef.current, {
            center: [initialLat, initialLng],
            zoom: 15,
            zoomControl: false,
            attributionControl: false
        });

        // Tiles based on theme
        const tileUrl = theme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';

        const tiles = L.tileLayer(tileUrl, {
            maxZoom: 19,
            subdomains: 'abcd'
        }).addTo(map);

        tileLayerInstance.current = tiles;

        // Radius circle
        const circle = L.circle([initialLat, initialLng], {
            radius: radius,
            color: '#EC4A00',
            fillColor: '#EC4A00',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '4, 4'
        }).addTo(map);
        circleInstance.current = circle;

        // Draggable Marker
        const marker = L.marker([initialLat, initialLng], {
            icon: createPinIcon(),
            draggable: true
        }).addTo(map);
        markerInstance.current = marker;

        // Marker drag handler
        marker.on('dragend', async (e) => {
            const pos = e.target.getLatLng();
            circle.setLatLng(pos);
            handleCoordUpdate(pos.lat, pos.lng);
        });

        // Map click handler
        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            circle.setLatLng([lat, lng]);
            handleCoordUpdate(lat, lng);
        });

        mapInstance.current = map;

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    // Theme Tile Switcher
    useEffect(() => {
        if (!mapInstance.current || !tileLayerInstance.current) return;
        const tileUrl = theme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';

        tileLayerInstance.current.setUrl(tileUrl);
    }, [theme]);

    // External Coord Changes (e.g. from dropdown province/district select)
    useEffect(() => {
        if (!mapInstance.current || !coords.lat || !coords.lng) return;
        const currentPos = markerInstance.current ? markerInstance.current.getLatLng() : null;
        if (!currentPos || Math.abs(currentPos.lat - coords.lat) > 0.0001 || Math.abs(currentPos.lng - coords.lng) > 0.0001) {
            mapInstance.current.setView([coords.lat, coords.lng], 15);
            if (markerInstance.current) markerInstance.current.setLatLng([coords.lat, coords.lng]);
            if (circleInstance.current) circleInstance.current.setLatLng([coords.lat, coords.lng]);
        }
    }, [coords.lat, coords.lng]);

    // Coordinate update helper with reverse geocode
    const handleCoordUpdate = async (lat, lng) => {
        try {
            const data = await reverseGeocode(lat, lng);
            onLocationChange({
                lat,
                lng,
                province: data.province_name || '',
                district: data.district_name || '',
                ward: data.ward_name || '',
                street: data.street_name || '',
                formattedAddress: data.standard_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            });
        } catch (err) {
            onLocationChange({
                lat,
                lng,
                formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            });
        }
    };

    // Address Search via Nominatim
    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!searchInput.trim()) return;
        setIsSearching(true);
        try {
            const query = encodeURIComponent(`${searchInput.trim()}, Vietnam`);
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`);
            const data = await res.json();
            setSearchResults(data);
        } catch (err) {
            console.error('Search error', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (mapInstance.current) {
            mapInstance.current.setView([lat, lng], 16);
            if (markerInstance.current) markerInstance.current.setLatLng([lat, lng]);
            if (circleInstance.current) circleInstance.current.setLatLng([lat, lng]);
        }
        setSearchResults([]);
        setSearchInput(item.display_name.split(',')[0]);
        handleCoordUpdate(lat, lng);
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (mapInstance.current) {
                    mapInstance.current.setView([latitude, longitude], 16);
                    if (markerInstance.current) markerInstance.current.setLatLng([latitude, longitude]);
                    if (circleInstance.current) circleInstance.current.setLatLng([latitude, longitude]);
                }
                handleCoordUpdate(latitude, longitude);
            },
            () => console.warn('Geolocation denied')
        );
    };

    return (
        <div className="map-wrapper-card">
            {/* Search Input Bar Overlay */}
            <div className="map-search-bar">
                <form onSubmit={handleSearchSubmit} className="map-search-form">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        id="address_search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Tìm kiếm địa chỉ, tên đường, dự án BĐS..."
                        className="map-search-input"
                    />
                    <button type="submit" className="btn-search-submit" disabled={isSearching}>
                        {isSearching ? 'Đang tìm...' : 'Tìm vị trí'}
                    </button>
                </form>

                {/* Autocomplete Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="search-autocomplete-dropdown">
                        {searchResults.map((item, idx) => (
                            <div
                                key={idx}
                                className="search-result-item"
                                onClick={() => handleSelectResult(item)}
                            >
                                <MapPin size={14} className="result-pin-icon" />
                                <span>{item.display_name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div ref={mapRef} className="leaflet-map-element" style={{ width: '100%', height: '520px' }}></div>

            {/* Map Custom Controls Overlay */}
            <div className="map-controls-group">
                <button
                    type="button"
                    className="map-ctrl-btn"
                    onClick={() => mapInstance.current && mapInstance.current.zoomIn()}
                    title="Phóng to"
                >
                    <ZoomIn size={16} />
                </button>
                <button
                    type="button"
                    className="map-ctrl-btn"
                    onClick={() => mapInstance.current && mapInstance.current.zoomOut()}
                    title="Thu nhỏ"
                >
                    <ZoomOut size={16} />
                </button>
                <button
                    type="button"
                    className="map-ctrl-btn"
                    onClick={handleLocateMe}
                    title="Vị trí hiện tại của tôi"
                >
                    <Crosshair size={16} />
                </button>
            </div>

            {/* Coordinates & Location Footer Badge */}
            <div className="map-status-footer">
                <div className="map-status-pin">
                    <MapPin size={13} style={{ color: 'var(--brand)' }} />
                    <span className="map-addr-text">
                        {addressDisplay || 'Nhấn vào bản đồ hoặc kéo ghim để định vị BĐS'}
                    </span>
                </div>
                <div className="map-coords-badge">
                    WGS84: {coords.lat ? coords.lat.toFixed(5) : '--'}, {coords.lng ? coords.lng.toFixed(5) : '--'}
                </div>
            </div>
        </div>
    );
}
