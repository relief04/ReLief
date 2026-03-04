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
        case 'Good': return '#50CCAA'; // Dark Green
        case 'Satisfactory': return '#CEE5A0'; // Light Green
        case 'Moderately Polluted': return '#FFFF66'; // Yellow
        case 'Poor': return '#FF9933'; // Orange
        case 'Very Poor': return '#FF3333'; // Red
        case 'Severe': return '#990000'; // Dark Red
        default: return '#50CCAA';
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
    const token = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
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
        return <div className="p-4 bg-red-100 text-red-700 rounded">Error: OpenWeather API Key not found.</div>;
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
                    opacity={0.5}
                    url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${token}`}
                    attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
                />

                <Marker position={[lat, lon]} icon={customIcon} />
                <MapUpdater lat={lat} lon={lon} />
            </MapContainer>

            {/* Custom Legend */}
            <div className={styles.legend}>
                <div className={styles.legendTitle}>NAQI Levels</div>
                {[
                    { label: 'Good (0-50)', color: '#50CCAA' },
                    { label: 'Satisfactory (51-100)', color: '#CEE5A0' },
                    { label: 'Mod. Polluted (101-200)', color: '#FFFF66' },
                    { label: 'Poor (201-300)', color: '#FF9933' },
                    { label: 'Very Poor (301-400)', color: '#FF3333' },
                    { label: 'Severe (401-500)', color: '#990000' }
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
