'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './AQIMap.module.css';
import { Plus, Minus, Info } from 'lucide-react';

// Fix for default marker icons in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AQIMapProps {
    lat: number;
    lon: number;
    zoom?: number;
    status?: string;
}

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'Good': return '#2ecc71';
        case 'Moderate': return '#f1c40f';
        case 'Unhealthy': return '#e67e22';
        case 'Hazardous': return '#e74c3c';
        default: return '#10b981';
    }
};

function MapUpdater({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lon], map.getZoom());
    }, [lat, lon, map]);
    return null;
}

export default function AQIMap({ lat, lon, zoom = 10, status }: AQIMapProps) {
    const token = process.env.NEXT_PUBLIC_WAQI_TOKEN;
    const [theme, setTheme] = useState('light');
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

    useEffect(() => {
        const t = document.documentElement.getAttribute('data-theme') || 'light';
        setTheme(t);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    if (!token) {
        return <div className="p-4 bg-red-100 text-red-700 rounded">Error: WAQI Token not found.</div>;
    }

    const cartoTileUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const color = getStatusColor(status);

    // Custom pulsing marker
    const customIcon = L.divIcon({
        className: 'custom-aqi-marker',
        html: `
            <div class="${styles.markerContainer}" style="--marker-color: ${color}">
                <div class="${styles.markerPulse}"></div>
                <div class="${styles.markerCenter}"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <MapContainer
                center={[lat, lon]}
                zoom={zoom}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={false}
                zoomControl={false}
                ref={setMapInstance}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url={cartoTileUrl}
                />

                <TileLayer
                    opacity={0.6}
                    url={`https://tiles.aqicn.org/tiles/usepa-aqi/{z}/{x}/{y}.png?token=${token}`}
                    attribution='&copy; <a href="https://aqicn.org/">WAQI</a>'
                />

                <Marker position={[lat, lon]} icon={customIcon} />
                <MapUpdater lat={lat} lon={lon} />
            </MapContainer>

            {/* Custom Legend */}
            <div className={styles.legend}>
                <div className={styles.legendTitle}>AQI Levels</div>
                {[
                    { label: 'Good (0-50)', color: '#2ecc71' },
                    { label: 'Moderate (51-100)', color: '#f1c40f' },
                    { label: 'Unhealthy (101-200)', color: '#e67e22' },
                    { label: 'Hazardous (200+)', color: '#e74c3c' }
                ].map((item, i) => (
                    <div key={i} className={styles.legendItem}>
                        <div className={styles.colorBar} style={{ backgroundColor: item.color }} />
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Custom Controls */}
            <div className={styles.controls}>
                <button
                    className={styles.zoomBtn}
                    onClick={() => mapInstance?.zoomIn()}
                    title="Zoom In"
                >
                    <Plus size={20} />
                </button>
                <button
                    className={styles.zoomBtn}
                    onClick={() => mapInstance?.zoomOut()}
                    title="Zoom Out"
                >
                    <Minus size={20} />
                </button>
            </div>
        </div>
    );
}
