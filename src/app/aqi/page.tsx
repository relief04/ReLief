"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { INDIA_LOCATIONS } from '@/lib/india-locations';
import { LocateFixed, Share2, Wind, AlertTriangle, Thermometer, Droplets, Gauge, RefreshCw, MapPin, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

const AQIMap = dynamic(() => import('@/components/aqi/AQIMap'), { ssr: false });

interface AQIData {
    city: string;
    aqi: number;
    status: string;
    pollutants: { pm25: number | null; pm10: number | null; o3: number | null; no2: number | null; so2: number | null; co: number | null; };
    weather: { temperature: number | null; humidity: number | null; windSpeed: number | null; apparentTemperature: number | null; condition: string; isDay: boolean; };
    advice: { general: string; sensitive: string; };
    habits: string[];
    coordinates: { lat: number; lon: number };
    stationName: string;
    updatedAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; emoji: string; gradient: string }> = {
    'Good': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', emoji: '😊', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    'Satisfactory': { color: '#84cc16', bg: 'rgba(132,204,22,0.12)', emoji: '🙂', gradient: 'linear-gradient(135deg, #84cc16, #a3e635)' },
    'Moderately Polluted': { color: '#eab308', bg: 'rgba(234,179,8,0.12)', emoji: '😐', gradient: 'linear-gradient(135deg, #eab308, #facc15)' },
    'Poor': { color: '#f97316', bg: 'rgba(249,115,22,0.12)', emoji: '😷', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
    'Very Poor': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', emoji: '😨', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
    'Severe': { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', emoji: '🚨', gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)' },
};

const getWeatherEmoji = (code: number, isDay: boolean) => {
    if (code === 0) return isDay ? '☀️' : '🌙';
    if (code <= 3) return isDay ? '⛅' : '🌤️';
    if (code <= 49) return '🌫️';
    if (code <= 69) return '🌧️';
    if (code <= 79) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 99) return '⛈️';
    return '🌡️';
};

export default function AQIPage() {
    const [selectedState, setSelectedState] = useState('Delhi');
    const [selectedCity, setSelectedCity] = useState('New Delhi');
    const [data, setData] = useState<AQIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const availableCities = selectedState
        ? INDIA_LOCATIONS.find(s => s.name === selectedState)?.cities || []
        : [];

    const fetchAQI = useCallback(async (params: { city?: string; lat?: number; lon?: number }) => {
        setLoading(true);
        setError('');
        try {
            const url = params.lat !== undefined && params.lon !== undefined
                ? `/api/aqi?lat=${params.lat}&lon=${params.lon}`
                : `/api/aqi?city=${encodeURIComponent(params.city || '')}`;

            const res = await fetch(url);
            const json = await res.json();

            if (!res.ok) throw new Error(json.error || 'Failed to fetch AQI data');
            setData(json);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to load AQI data. Please try again.');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAQI({ city: 'New Delhi, India' });
    }, [fetchAQI]);

    const handleSearch = () => {
        if (selectedCity) fetchAQI({ city: `${selectedCity}, ${selectedState}, India` });
    };

    const handleGeolocate = () => {
        if (!navigator.geolocation) { setError('Geolocation not supported by your browser.'); return; }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchAQI({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => { setError('Could not get your location. Please check browser permissions.'); setLoading(false); }
        );
    };

    const handleShare = async () => {
        if (!data) return;
        const text = `Air Quality in ${data.city}: ${data.aqi} AQI (${data.status}) — checked on ReLief 🌿`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const cfg = data ? (STATUS_CONFIG[data.status] || STATUS_CONFIG['Good']) : null;

    const pollutantList = data ? [
        { label: 'PM 2.5', val: data.pollutants.pm25, unit: 'μg/m³', limit: 250, desc: 'Fine Particles' },
        { label: 'PM 10', val: data.pollutants.pm10, unit: 'μg/m³', limit: 350, desc: 'Respirable Dust' },
        { label: 'O₃', val: data.pollutants.o3, unit: 'ppb', limit: 180, desc: 'Ozone' },
        { label: 'NO₂', val: data.pollutants.no2, unit: 'ppb', limit: 200, desc: 'Nitrogen Dioxide' },
        { label: 'SO₂', val: data.pollutants.so2, unit: 'ppb', limit: 150, desc: 'Sulfur Dioxide' },
        { label: 'CO', val: data.pollutants.co, unit: 'ppm', limit: 10, desc: 'Carbon Monoxide' },
    ] : [];

    return (
        <div className={styles.page}>
            {/* Hero Header */}
            <div className={styles.heroSection} style={cfg ? { '--status-color': cfg.color, '--status-bg': cfg.bg } as React.CSSProperties : {}}>
                <div className={styles.heroContent}>
                    <div className={styles.heroTitleRow}>
                        <span className={styles.heroIcon}>🌬️</span>
                        <div>
                            <h1 className={styles.heroTitle}>Air Quality Monitor</h1>
                            <p className={styles.heroSubtitle}>Real-time AQI, weather & health insights across India</p>
                        </div>
                    </div>

                    {/* Location Selector */}
                    <div className={styles.selectorRow}>
                        <div className={styles.selectorGroup}>
                            <label className={styles.selectorLabel}>State</label>
                            <select
                                className={styles.selectorInput}
                                value={selectedState}
                                onChange={e => { setSelectedState(e.target.value); setSelectedCity(''); }}
                            >
                                <option value="">Select State</option>
                                {INDIA_LOCATIONS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className={styles.selectorGroup}>
                            <label className={styles.selectorLabel}>City</label>
                            <select
                                className={styles.selectorInput}
                                value={selectedCity}
                                onChange={e => setSelectedCity(e.target.value)}
                                disabled={!selectedState}
                            >
                                <option value="">Select City</option>
                                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className={styles.selectorActions}>
                            <button className={styles.locateBtn} onClick={handleGeolocate} title="Use my location">
                                <LocateFixed size={16} /> Locate Me
                            </button>
                            <button className={styles.searchBtn} onClick={handleSearch} disabled={!selectedCity || loading}>
                                {loading ? <RefreshCw size={16} className={styles.spin} /> : <Gauge size={16} />}
                                Analyze
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.mainContent}>
                {error && (
                    <div className={styles.errorBox}>
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {loading && !data && (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingCircle} />
                        <p>Fetching air quality data…</p>
                    </div>
                )}

                {data && cfg && (
                    <>
                        {/* AQI Hero Card */}
                        <div className={styles.aqiHeroCard} style={{ '--status-color': cfg.color, '--status-gradient': cfg.gradient } as React.CSSProperties}>
                            <div className={styles.aqiHeroLeft}>
                                <div className={styles.aqiBigCircle} style={{ background: cfg.gradient, boxShadow: `0 0 60px ${cfg.color}50` }}>
                                    <span className={styles.aqiBigNum}>{data.aqi}</span>
                                    <span className={styles.aqiBigLabel}>NAQI</span>
                                </div>
                            </div>
                            <div className={styles.aqiHeroRight}>
                                <div className={styles.cityRow}>
                                    <MapPin size={18} style={{ color: cfg.color }} />
                                    <span className={styles.cityName}>{data.city}</span>
                                </div>
                                <div className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + '40' }}>
                                    <span>{cfg.emoji}</span>
                                    <span>{data.status}</span>
                                </div>
                                <p className={styles.stationInfo}>📡 Station: {data.stationName || data.city}</p>
                                {lastUpdated && <p className={styles.updatedAt}>🕐 {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                                <div className={styles.heroActions}>
                                    <button className={styles.refreshBtn} onClick={() => handleSearch()} disabled={loading}>
                                        <RefreshCw size={14} /> Refresh
                                    </button>
                                    <button className={styles.shareAction} onClick={handleShare}>
                                        {copied ? <CheckCircle2 size={14} color="#10b981" /> : <Share2 size={14} />}
                                        {copied ? 'Copied!' : 'Share'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.twoCol}>
                            {/* Health Advice */}
                            <div className={styles.adviceCard}>
                                <h3 className={styles.cardTitle}>💡 Health Advice</h3>
                                <div className={styles.adviceItem}>
                                    <div className={styles.adviceIcon} style={{ color: '#10b981' }}><Wind size={20} /></div>
                                    <div>
                                        <div className={styles.adviceGroup}>General Public</div>
                                        <p className={styles.adviceText}>{data.advice.general}</p>
                                    </div>
                                </div>
                                <div className={styles.adviceItem} style={{ borderColor: '#f9731620' }}>
                                    <div className={styles.adviceIcon} style={{ color: '#f97316' }}><AlertTriangle size={20} /></div>
                                    <div>
                                        <div className={styles.adviceGroup} style={{ color: '#f97316' }}>Sensitive Groups</div>
                                        <p className={styles.adviceText}>{data.advice.sensitive}</p>
                                    </div>
                                </div>
                                <div className={styles.habitsRow}>
                                    {data.habits.map((h, i) => (
                                        <span key={i} className={styles.habitChip}>🌿 {h}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Weather Card */}
                            <div className={styles.weatherCard}>
                                <h3 className={styles.cardTitle}>⛅ Current Weather</h3>
                                <div className={styles.weatherMain}>
                                    <div className={styles.weatherEmoji}>
                                        {data.weather.temperature !== null
                                            ? getWeatherEmoji(0, data.weather.isDay)
                                            : '🌡️'}
                                    </div>
                                    <div className={styles.weatherTempBlock}>
                                        <div className={styles.weatherTemp}>{data.weather.temperature ?? '--'}°C</div>
                                        <div className={styles.weatherCondition}>{data.weather.condition}</div>
                                    </div>
                                </div>
                                <div className={styles.weatherStats}>
                                    <div className={styles.weatherStat}>
                                        <Thermometer size={16} className={styles.weatherStatIcon} />
                                        <span className={styles.weatherStatLabel}>Feels Like</span>
                                        <span className={styles.weatherStatVal}>{data.weather.apparentTemperature ?? '--'}°C</span>
                                    </div>
                                    <div className={styles.weatherStat}>
                                        <Droplets size={16} className={styles.weatherStatIcon} />
                                        <span className={styles.weatherStatLabel}>Humidity</span>
                                        <span className={styles.weatherStatVal}>{data.weather.humidity ?? '--'}%</span>
                                    </div>
                                    <div className={styles.weatherStat}>
                                        <Wind size={16} className={styles.weatherStatIcon} />
                                        <span className={styles.weatherStatLabel}>Wind</span>
                                        <span className={styles.weatherStatVal}>{data.weather.windSpeed ?? '--'} km/h</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pollutants Grid */}
                        <div className={styles.pollutantsSection}>
                            <h3 className={styles.sectionTitle}>🧪 Pollutant Levels</h3>
                            <div className={styles.pollutantsGrid}>
                                {pollutantList.map((p, i) => {
                                    const val = p.val ?? 0;
                                    const pct = Math.min((val / p.limit) * 100, 100);
                                    const col = pct > 80 ? '#7c3aed' : pct > 60 ? '#ef4444' : pct > 40 ? '#f97316' : pct > 20 ? '#eab308' : '#10b981';
                                    return (
                                        <div key={i} className={styles.pollutantCard}>
                                            <div className={styles.pollutantTop}>
                                                <span className={styles.pollutantLabel}>{p.label}</span>
                                                <span className={styles.pollutantSub}>{p.desc}</span>
                                            </div>
                                            <div className={styles.pollutantValue} style={{ color: col }}>
                                                {p.val !== null ? p.val.toFixed(1) : '--'}
                                                <span className={styles.pollutantUnit}>{p.unit}</span>
                                            </div>
                                            <div className={styles.pollutantBar}>
                                                <div className={styles.pollutantFill} style={{ width: `${pct}%`, background: col, boxShadow: `0 0 8px ${col}60` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* AQI Scale */}
                        <div className={styles.scaleSection}>
                            <h3 className={styles.sectionTitle}>📊 India NAQI Scale</h3>
                            <div className={styles.scaleGrid}>
                                {[
                                    { range: '0–50', label: 'Good', color: '#10b981', emoji: '😊' },
                                    { range: '51–100', label: 'Satisfactory', color: '#84cc16', emoji: '🙂' },
                                    { range: '101–200', label: 'Mod. Polluted', color: '#eab308', emoji: '😐' },
                                    { range: '201–300', label: 'Poor', color: '#f97316', emoji: '😷' },
                                    { range: '301–400', label: 'Very Poor', color: '#ef4444', emoji: '😨' },
                                    { range: '401–500', label: 'Severe', color: '#7c3aed', emoji: '🚨' },
                                ].map((s, i) => (
                                    <div
                                        key={i}
                                        className={styles.scaleCard}
                                        style={{
                                            background: `${s.color}10`,
                                            borderColor: `${s.color}30`,
                                            outline: data.status === s.label ? `2px solid ${s.color}` : 'none'
                                        }}
                                    >
                                        <span className={styles.scaleEmoji}>{s.emoji}</span>
                                        <span className={styles.scaleRange} style={{ color: s.color }}>{s.range}</span>
                                        <span className={styles.scaleLabel}>{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Map */}
                        {data.coordinates && (
                            <div className={styles.mapSection}>
                                <h3 className={styles.sectionTitle}>🗺️ Monitoring Station Map</h3>
                                <div className={styles.mapWrapper}>
                                    <AQIMap lat={data.coordinates.lat} lon={data.coordinates.lon} status={data.status} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
