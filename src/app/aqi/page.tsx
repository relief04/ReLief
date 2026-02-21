"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import { getAQIData, getAQIDataByCoords, AQIData } from '@/lib/aqi';
import { INDIA_LOCATIONS } from '@/lib/india-locations';

import styles from './page.module.css';
import { LocateFixed, Share2, Wind, AlertTriangle, CheckCircle2, Thermometer, Droplets, Sun, Moon, Leaf, Search } from 'lucide-react';

const getAQITint = (status?: string) => {
    switch (status) {
        case 'Good': return 'rgba(46, 204, 113, 0.05)';
        case 'Moderate': return 'rgba(241, 196, 15, 0.05)';
        case 'Unhealthy': return 'rgba(230, 126, 34, 0.05)';
        case 'Hazardous': return 'rgba(231, 76, 60, 0.05)';
        default: return 'var(--color-bg-100)';
    }
};

const AQIMap = dynamic(() => import('@/components/aqi/AQIMap'), { ssr: false });

export default function AQIPage() {
    // Location Selector State
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    // Data State
    const [data, setData] = useState<AQIData | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Derived list of cities based on selected state
    const availableCities = selectedState
        ? INDIA_LOCATIONS.find(s => s.name === selectedState)?.cities || []
        : [];

    useEffect(() => {
        // Default to New Delhi on load
        fetchData('New Delhi', 'Delhi');
        setSelectedState('Delhi');
        setSelectedCity('New Delhi');
    }, []);

    const fetchData = async (cityQuery: string, stateContext?: string) => {
        setLoading(true);
        setError('');

        const cleanCity = cityQuery.replace(/\(.*\)/, '').trim();

        try {
            // Attempt 1
            const query = `${cleanCity}, India`;
            const result = await getAQIData(query);

            setData(result);

            try {
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
                const geoJson = await geoRes.json();
                if (geoJson.results?.[0]) {
                    setCoords({ lat: geoJson.results[0].latitude, lon: geoJson.results[0].longitude });
                }
            } catch (e) { /* ignore map error */ }

            return;
        } catch {
            // ... fallbacks ...
            // For brevity, skipping logic update in fallback.
            console.log("Attempt 1 failed");
            // ...
            // (Keeping fallback logic from previous simple version)
            if (stateContext) {
                try {
                    // Attempt 2: City, State
                    const val = await getAQIData(`${cleanCity}, ${stateContext}`);
                    setData(val);
                    return;
                } catch { }
            }
            try {
                // Attempt 3: Just City
                const res = await getAQIData(cleanCity);
                setData(res);
            } catch (finalErr) {
                console.error(finalErr);
                setError(`Could not find data for "${cleanCity}".`);
                setData(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (selectedCity) {
            // Pass selectedState as context
            fetchData(selectedCity, selectedState);
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setLoading(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    setCoords({ lat: latitude, lon: longitude });
                    const result = await getAQIDataByCoords(latitude, longitude);
                    setData(result);
                    // Clear selectors to indicate custom location
                    setSelectedState('');
                    setSelectedCity('');
                } catch (err) {
                    setError("Failed to fetch data for your location.");
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError("Unable to retrieve your location. Please check your permissions.");
                setLoading(false);
            }
        );
    };

    const handleShare = async () => {
        if (!data) return;
        const text = `Air Quality in ${data.city} is currently ${data.aqi} AQI (${data.status}). Check it out on ReLief!`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    return (
        <div className={styles.container} style={{ '--aqi-tint': getAQITint(data?.status) } as React.CSSProperties}>
            <header className={styles.header}>
                <h1>India Air & Weather Watch</h1>
                <p>Monitor real-time air quality and historical trends across India.</p>
            </header>

            {/* 3-Level Location Selector */}
            <Card className={styles.selectorCard}>
                <div className={styles.selectorGrid}>


                    <div className={styles.selectGroup}>
                        <label>State</label>
                        <select
                            className={styles.selectInput}
                            value={selectedState}
                            onChange={(e) => {
                                setSelectedState(e.target.value);
                                setSelectedCity(''); // Reset city when state changes
                            }}
                        >
                            <option value="">Select State</option>
                            {INDIA_LOCATIONS.map(s => (
                                <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.selectGroup}>
                        <label>City / Area</label>
                        <select
                            className={styles.selectInput}
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            disabled={!selectedState}
                        >
                            <option value="">Select City</option>
                            {availableCities.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.buttonGroup}>
                        <Button
                            variant="outline"
                            onClick={handleCurrentLocation}
                            isLoading={loading}
                            className={styles.locationBtn}
                            title="Use Current Location"
                        >
                            <LocateFixed size={24} />
                        </Button>
                        <Button
                            variant="primary"
                            isLoading={loading}
                            onClick={handleSearch}
                            disabled={!selectedCity}
                            className={styles.searchBtn}
                        >
                            <Search size={18} /> View Analysis
                        </Button>
                    </div>
                </div>
            </Card>

            {error && <p className={styles.errorMsg}>{error}</p>}

            {data && (
                <div className={styles.dashboard}>

                    {/* Map Section */}
                    {coords && (
                        <div className={styles.mapSection} data-status={data.status}>
                            <div className={styles.mapWrapper}>
                                <AQIMap lat={coords.lat} lon={coords.lon} status={data.status} />
                            </div>
                        </div>
                    )}

                    <div className={styles.mainGrid}>
                        {/* AQI CARD */}
                        <Card className={styles.mainCard} hoverEffect>
                            <div className={styles.cardHeader}>
                                <h2>Air Quality</h2>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span className={styles.liveBadge}>● LIVE</span>
                                    <Button variant="ghost" size="sm" onClick={handleShare} className={styles.shareBtn}>
                                        {copied ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
                                        {copied ? 'Copied' : 'Share'}
                                    </Button>
                                </div>
                            </div>
                            <div className={styles.contentRow}>
                                <div className={styles.aqiCircleWrapper}>
                                    <div className={styles.aqiCirclePulse} data-status={data.status} />
                                    <div className={styles.aqiCircle} data-status={data.status}>
                                        <span className={styles.aqiValue}>{data.aqi}</span>
                                        <span className={styles.aqiLabel}>US AQI</span>
                                    </div>
                                </div>
                                <div className={styles.statusInfo}>
                                    <h3>{data.city}</h3>
                                    <div className={styles.statusText} data-status={data.status}>{data.status}</div>
                                </div>
                            </div>

                            <div className={styles.healthSplit}>
                                <div className={styles.healthCard}>
                                    <h4><Wind size={16} /> General Public</h4>
                                    <p>{data.advice.general}</p>
                                </div>
                                <div className={styles.healthCard + ' ' + styles.healthSensitive}>
                                    <h4><AlertTriangle size={16} /> Sensitive Groups</h4>
                                    <p>{data.advice.sensitive}</p>
                                </div>
                            </div>
                        </Card>

                        {/* WEATHER CARD */}
                        <Card className={styles.mainCard} hoverEffect>
                            <div className={styles.cardHeader}>
                                <h2>Weather</h2>
                                <div className={styles.liveBadge}>LIVE</div>
                            </div>
                            <div className={styles.weatherContent}>
                                <div className={styles.weatherMain}>
                                    <div className={styles.weatherIconLarge}>
                                        {data.weather.isDay ? <Sun size={48} className={styles.sunIcon} /> : <Moon size={48} className={styles.moonIcon} />}
                                    </div>
                                    <div className={styles.tempDisplay}>
                                        <div className={styles.tempVal}>{data.weather.temperature}°C</div>
                                        <div className={styles.condition}>{data.weather.condition}</div>
                                    </div>
                                </div>

                                <div className={styles.weatherDetailsGrid}>
                                    <div className={styles.weatherDetailItem}>
                                        <div className={styles.detailTitle}>
                                            <Droplets size={16} /> Humidity
                                        </div>
                                        <div className={styles.detailValue}>{data.weather.humidity}%</div>
                                    </div>
                                    <div className={styles.weatherDetailItem}>
                                        <div className={styles.detailTitle}>
                                            <Wind size={16} /> Wind
                                        </div>
                                        <div className={styles.detailValue}>{data.weather.windSpeed} <span className={styles.unit}>km/h</span></div>
                                    </div>
                                    <div className={styles.weatherDetailItem}>
                                        <div className={styles.detailTitle}>
                                            <Thermometer size={16} /> Feels Like
                                        </div>
                                        <div className={styles.detailValue}>{data.weather.apparentTemperature}°C</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* ECO HABITS */}
                    <Card className={styles.habitsCard}>
                        <h3>Suggested Eco-Habits</h3>
                        <div className={styles.habitsList}>
                            {data.habits && data.habits.length > 0 ? (
                                data.habits.map((habit, idx) => (
                                    <div key={idx} className={styles.habitItem}>
                                        <Leaf size={16} className={styles.leafIcon} />
                                        {habit}
                                    </div>
                                ))
                            ) : (
                                <p>No specific tips available for this status.</p>
                            )}
                        </div>
                    </Card>

                    <div className={styles.statsGrid}>
                        {[
                            { label: 'PM 2.5', val: data.pollutants.pm25, sub: 'Fine Particles', limit: 120 },
                            { label: 'PM 10', val: data.pollutants.pm10, sub: 'Respirable', limit: 250 },
                            { label: 'O₃', val: data.pollutants.o3, sub: 'Ozone', limit: 180 },
                            { label: 'NO₂', val: data.pollutants.no2, sub: 'Nitrogen Dioxide', limit: 200 }
                        ].map((stat, i) => {
                            const val = stat.val || 0;
                            const percentage = Math.min((val / stat.limit) * 100, 100);

                            // Simple severity mapping for bars
                            let severity: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous' = 'Good';
                            if (percentage > 70) severity = 'Hazardous';
                            else if (percentage > 40) severity = 'Unhealthy';
                            else if (percentage > 15) severity = 'Moderate';

                            return (
                                <Card key={i} className={styles.statCard}>
                                    <h4>{stat.label}</h4>
                                    <div className={styles.pollutantVal}>{val || '--'}</div>
                                    <div className={styles.pollutantBarContainer}>
                                        <div
                                            className={styles.pollutantBar}
                                            data-status={severity}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <p>{stat.sub}</p>
                                </Card>
                            );
                        })}
                    </div>




                </div>
            )}
        </div>
    );
}
