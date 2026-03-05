'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './AQIMap.module.css';
import { Plus, Minus } from 'lucide-react';

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
    aqi?: number;
    city?: string;
}

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'Good': return '#10b981';
        case 'Satisfactory': return '#84cc16';
        case 'Moderately Polluted': return '#eab308';
        case 'Poor': return '#f97316';
        case 'Very Poor': return '#ef4444';
        case 'Severe': return '#7c3aed';
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

export default function AQIMap({ lat, lon, zoom = 10, status, aqi, city }: AQIMapProps) {
    const aqicnToken = process.env.NEXT_PUBLIC_AQICN_API_KEY;
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

    const cartoTileUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const color = getStatusColor(status);

    // Custom AQI badge marker showing the AQI value
    const aqiLabel = aqi !== undefined ? aqi.toString() : '?';
    const customIcon = L.divIcon({
        className: 'custom-aqi-marker',
        html: `
            <div class="${styles.aqiMarker}" style="--marker-color: ${color}">
                <div class="${styles.aqiMarkerPulse}"></div>
                <div class="${styles.aqiMarkerBadge}" style="background: ${color}; box-shadow: 0 2px 12px ${color}80;">
                    <span class="${styles.aqiMarkerValue}">${aqiLabel}</span>
                </div>
                <div class="${styles.aqiMarkerArrow}" style="border-top-color: ${color};"></div>
            </div>
        `,
        iconSize: [56, 68],
        iconAnchor: [28, 68],
        popupAnchor: [0, -68],
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

                {aqicnToken && (
                    <TileLayer
                        opacity={0.6}
                        url={`https://tiles.aqicn.org/tiles/usepa-aqi/{z}/{x}/{y}.png?token=${aqicnToken}`}
                        attribution='&copy; <a href="https://aqicn.org/">AQICN</a>'
                    />
                )}

                <Marker position={[lat, lon]} icon={customIcon}>
                    {(aqi !== undefined || city) && (
                        <Popup>
                            <div style={{ textAlign: 'center', fontFamily: 'inherit', padding: '4px 0' }}>
                                {city && <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>{city}</strong>}
                                {aqi !== undefined && (
                                    <span style={{
                                        display: 'inline-block',
                                        background: color,
                                        color: '#fff',
                                        padding: '2px 10px',
                                        borderRadius: '12px',
                                        fontWeight: 700,
                                        fontSize: '0.85rem'
                                    }}>
                                        AQI: {aqi} — {status || 'Unknown'}
                                    </span>
                                )}
                            </div>
                        </Popup>
                    )}
                </Marker>
                <MapUpdater lat={lat} lon={lon} />
            </MapContainer>

            {/* Custom Legend */}
            <div className={styles.legend}>
                <div className={styles.legendTitle}>NAQI Levels</div>
                {[
                    { label: 'Good (0-50)', color: '#10b981' },
                    { label: 'Satisfactory (51-100)', color: '#84cc16' },
                    { label: 'Mod. Polluted (101-200)', color: '#eab308' },
                    { label: 'Poor (201-300)', color: '#f97316' },
                    { label: 'Very Poor (301-400)', color: '#ef4444' },
                    { label: 'Severe (401-500)', color: '#7c3aed' }
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
