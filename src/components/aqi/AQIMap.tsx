'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
}

function MapUpdater({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lon], map.getZoom());
    }, [lat, lon, map]);
    return null;
}

export default function AQIMap({ lat, lon, zoom = 10 }: AQIMapProps) {
    const token = process.env.NEXT_PUBLIC_WAQI_TOKEN;
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const t = document.documentElement.getAttribute('data-theme') || 'light';
        setTheme(t);

        // Simple observer to react to theme changes
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

    // CartoDB Tiles - Dark Matter for Dark Theme, Voyager for Light Theme
    const cartoTileUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    return (
        <MapContainer
            center={[lat, lon]}
            zoom={zoom}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url={cartoTileUrl}
            />

            {/* WAQI Heatmap Overlay */}
            <TileLayer
                opacity={0.6}
                url={`https://tiles.aqicn.org/tiles/usepa-aqi/{z}/{x}/{y}.png?token=${token}`}
                attribution='&copy; <a href="https://aqicn.org/">WAQI</a>'
            />

            <MapUpdater lat={lat} lon={lon} />
        </MapContainer>
    );
}
