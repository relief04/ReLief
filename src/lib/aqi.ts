export interface AQIData {
    city: string;
    aqi: number;
    status: 'Good' | 'Satisfactory' | 'Moderately Polluted' | 'Poor' | 'Very Poor' | 'Severe';
    pollutants: {
        pm25: number;
        pm10: number;
        o3: number;
        no2: number;
    };
    weather: {
        temperature: number;
        humidity: number;
        windSpeed: number;
        apparentTemperature: number;
        condition: string;
        isDay: boolean;
    };
    advice: {
        general: string;
        sensitive: string;
    };
    habits: string[];
    forecast?: AQIForecastDay[];
    coordinates?: {
        lat: number;
        lon: number;
    };
}

export interface AQIForecastDay {
    date: string;
    avgAQI: number;
    maxAQI: number;
    status: string;
}

interface GeocodingResult {
    results?: Array<{
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        admin1?: string; // State/Province
    }>;
}

const getStatusAndRecommendation = (aqi: number): { status: AQIData['status'], advice: AQIData['advice'], habits: string[] } => {
    if (aqi <= 50) {
        return {
            status: 'Good',
            advice: {
                general: "Air quality is satisfactory. Enjoy outdoor activities!",
                sensitive: "Air quality is great. No restrictions."
            },
            habits: ["Open windows for fresh air", "Go for a run or walk", "Plant more trees"]
        };
    } else if (aqi <= 100) {
        return {
            status: 'Satisfactory',
            advice: {
                general: "Air quality is acceptable. Enjoy normal activities.",
                sensitive: "Unusually sensitive people should consider reducing prolonged or heavy exertion."
            },
            habits: ["Reduce car usage", "Avoid burning waste", "Keep indoor plants"]
        };
    } else if (aqi <= 200) {
        return {
            status: 'Moderately Polluted',
            advice: {
                general: "Breathing discomfort to the people with lungs, asthma and heart diseases.",
                sensitive: "Avoid outdoor exertion and wear a basic mask."
            },
            habits: ["Wear mask outdoors", "Use public transport", "Avoid heavy traffic areas"]
        };
    } else if (aqi <= 300) {
        return {
            status: 'Poor',
            advice: {
                general: "Breathing discomfort to most people on prolonged exposure.",
                sensitive: "Remain indoors and keep activity levels low."
            },
            habits: ["Wear N95 mask outdoors", "Run air purifier indoors", "Limit outdoor time"]
        };
    } else if (aqi <= 400) {
        return {
            status: 'Very Poor',
            advice: {
                general: "Respiratory illness on prolonged exposure. Avoid strenuous outdoor activities.",
                sensitive: "Avoid all outdoor exertion. Sensitive groups should remain indoors."
            },
            habits: ["Stay indoors", "Seal windows/doors", "Use high-quality air purifier", "Avoid strenuous exercise"]
        };
    } else {
        return {
            status: 'Severe',
            advice: {
                general: "Health warnings of emergency conditions. Severe respiratory impacts even on healthy people.",
                sensitive: "Avoid all physical activity outdoors. Stay strictly indoors."
            },
            habits: ["Stay indoors strictly", "Use N95 mask even for short trips", "Keep air purifier constantly on", "Avoid burning anything"]
        };
    }
};

const cleanLocationString = (str: string) => {
    return str.replace(/\([^)]*\)/g, '').trim();
};

// Helper to convert PM2.5 (μg/m³) to Indian NAQI (0-500)
// using the official breakpoints from CPCB India
const calculateIndian_NAQI_from_PM25 = (c: number): number => {
    let AQI = 0;
    let bplo = 0, bphi = 0, ilo = 0, ihi = 0;

    if (c <= 30.0) {
        bplo = 0.0; bphi = 30.0; ilo = 0; ihi = 50;
    } else if (c <= 60.0) {
        bplo = 31.0; bphi = 60.0; ilo = 51; ihi = 100;
    } else if (c <= 90.0) {
        bplo = 61.0; bphi = 90.0; ilo = 101; ihi = 200;
    } else if (c <= 120.0) {
        bplo = 91.0; bphi = 120.0; ilo = 201; ihi = 300;
    } else if (c <= 250.0) {
        bplo = 121.0; bphi = 250.0; ilo = 301; ihi = 400;
    } else if (c <= 500.0) {
        bplo = 251.0; bphi = 500.0; ilo = 401; ihi = 500;
    } else {
        return 500; // Max out at 500
    }

    AQI = Math.round(((ihi - ilo) / (bphi - bplo)) * (c - bplo) + ilo);
    return AQI;
};

const fetchWAQIData = async (url: string, fallbackName?: string): Promise<AQIData> => {
    const token = process.env.NEXT_PUBLIC_AQICN_API_KEY;
    if (!token) throw new Error("AQICN Token not found in environment variables.");

    const res = await fetch(`${url}/?token=${token}`);
    if (!res.ok) throw new Error(`WAQI API error: ${res.statusText}`);

    const json = await res.json();
    if (json.status !== "ok") throw new Error(json.data || "Unknown WAQI Error");

    const w = json.data;
    const { status, advice, habits } = getStatusAndRecommendation(w.aqi);

    // Some endpoints may not return forecast data
    const forecast: AQIForecastDay[] = [];
    if (w.forecast?.daily?.pm25) {
        w.forecast.daily.pm25.slice(0, 3).forEach((f: any) => {
            // Convert their PM2.5 forecast cleanly into NAQI statuses
            const aq = calculateIndian_NAQI_from_PM25(f.avg);
            const maxAq = calculateIndian_NAQI_from_PM25(f.max);
            const { status: fStatus } = getStatusAndRecommendation(aq);
            forecast.push({
                date: f.day,
                avgAQI: aq,
                maxAQI: maxAq,
                status: fStatus
            });
        });
    }

    // Try to get weather from Open Meteo for better conditions, fallback to WAQI basic if needed
    let weatherObj = {
        temperature: w.iaqi.t?.v || 0,
        humidity: w.iaqi.h?.v || 0,
        windSpeed: w.iaqi.w?.v || 0,
        apparentTemperature: w.iaqi.t?.v || 0,
        condition: 'Unknown',
        isDay: true
    };

    try {
        if (w.city.geo && w.city.geo.length === 2) {
            const [lat, lon] = w.city.geo;
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m`);
            if (weatherRes.ok) {
                const weatherJson = await weatherRes.json();
                const omWeather = weatherJson.current;
                weatherObj = {
                    temperature: omWeather.temperature_2m,
                    humidity: omWeather.relative_humidity_2m,
                    windSpeed: omWeather.wind_speed_10m,
                    apparentTemperature: omWeather.apparent_temperature,
                    condition: 'Available',
                    isDay: !!omWeather.is_day
                };
            }
        }
    } catch (e) { console.warn("Open Meteo fallback failed", e); }

    const cityName = cleanLocationString(w.city.name) || fallbackName || "Local Station";

    return {
        city: cityName,
        aqi: w.aqi,
        status,
        pollutants: {
            pm25: w.iaqi.pm25?.v || 0,
            pm10: w.iaqi.pm10?.v || 0,
            o3: w.iaqi.o3?.v || 0,
            no2: w.iaqi.no2?.v || 0
        },
        weather: weatherObj,
        advice,
        habits,
        forecast,
        coordinates: w.city.geo ? { lat: w.city.geo[0], lon: w.city.geo[1] } : undefined
    };
};

export const getAQIData = async (city: string): Promise<AQIData> => {
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }

        const { latitude, longitude, name, country, admin1 } = geoData.results[0];
        const displayName = `${name}, ${admin1 || ''} ${country ? `(${country})` : ''}`;

        return await fetchWAQIData(`https://api.waqi.info/feed/geo:${latitude};${longitude}`, displayName);

    } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError' && error.message !== 'City not found') {
            console.error("Error fetching data:", error);
        }
        throw error;
    }
};

export const getAQIDataByCoords = async (latitude: number, longitude: number): Promise<AQIData> => {
    try {
        const rawData = await fetchWAQIData(`https://api.waqi.info/feed/geo:${latitude};${longitude}`);
        
        // Reverse Geocode for actual precise user locality instead of generic Station logic
        try {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            if (geoRes.ok) {
                const geoJson = await geoRes.json();
                const addressArr = [geoJson.locality, geoJson.city, geoJson.principalSubdivision].filter(Boolean);
                // Unique filtering to avoid duplicates like "Mumbai, Mumbai"
                const uniqueAddress = Array.from(new Set(addressArr)).join(', ');
                if (uniqueAddress) {
                    rawData.city = uniqueAddress;
                }
            }
        } catch (geoError) {
            console.warn("Reverse geocode failed, falling back to station name.", geoError);
        }

        return rawData;
    } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
            console.error("Error fetching data by coords:", error);
        }
        throw error;
    }
};

// --- Historical Data ---

export interface AQIHistoryPoint {
    date: string;
    aqi: number;
    category: AQIData['status'];
}

export interface AQIHistoryData {
    trends: AQIHistoryPoint[];
    summary: {
        avgAQI: number;
        bestDate: string;
        bestAQI: number;
        worstDate: string;
        worstAQI: number;
    };
}

export const getHistoricalAQIData = async (city: string, daysBack: number = 365): Promise<AQIHistoryData> => {
    try {
        // 1. Get Coordinates
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData: GeocodingResult = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }
        const { latitude, longitude } = geoData.results[0];

        // 2. Calculate Dates
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - daysBack);

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        // 3. Fetch Historical Data
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=us_aqi&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;

        const historyRes = await fetch(url);
        const historyJson = await historyRes.json();

        if (!historyJson.hourly || !historyJson.hourly.us_aqi) {
            throw new Error('No historical data available');
        }

        const times = historyJson.hourly.time as string[];
        const aqis = historyJson.hourly.us_aqi as number[];

        // 4. Aggregation: Daily Averages
        const dailyMap = new Map<string, { sum: number, count: number }>();

        times.forEach((t, i) => {
            const dateStr = t.split('T')[0]; // YYYY-MM-DD
            if (!dailyMap.has(dateStr)) {
                dailyMap.set(dateStr, { sum: 0, count: 0 });
            }
            const current = dailyMap.get(dateStr)!;
            if (aqis[i] !== null && aqis[i] !== undefined) {
                current.sum += aqis[i];
                current.count += 1;
            }
        });

        const trends: AQIHistoryPoint[] = [];
        let totalSum = 0;
        let totalCount = 0;
        let bestBest = { aqi: 9999, date: '' };
        let worstBest = { aqi: -1, date: '' };

        dailyMap.forEach((val, key) => {
            if (val.count > 0) {
                const avg = Math.round(val.sum / val.count);
                const { status } = getStatusAndRecommendation(avg);

                trends.push({
                    date: key,
                    aqi: avg,
                    category: status
                });

                totalSum += avg;
                totalCount++;

                if (avg < bestBest.aqi) bestBest = { aqi: avg, date: key };
                if (avg > worstBest.aqi) worstBest = { aqi: avg, date: key };
            }
        });

        // Sort by date
        trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            trends,
            summary: {
                avgAQI: totalCount > 0 ? Math.round(totalSum / totalCount) : 0,
                bestAQI: bestBest.aqi === 9999 ? 0 : bestBest.aqi,
                bestDate: bestBest.date,
                worstAQI: worstBest.aqi === -1 ? 0 : worstBest.aqi,
                worstDate: worstBest.date
            }
        };

    } catch (error) {
        // Suppress "City not found" error logs as this is a handled case (returns empty data)
        // Also suppress AbortError
        const err = error as Error; // Cast to Error for property access
        if (err.message !== 'City not found' && err.name !== 'AbortError') {
            console.error("Error fetching historical AQI:", error);
        }
        return {
            trends: [],
            summary: { avgAQI: 0, bestAQI: 0, bestDate: '', worstAQI: 0, worstDate: '' }
        };
    }
};
