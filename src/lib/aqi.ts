export interface AQIData {
    city: string;
    aqi: number;
    status: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous';
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
    status: AQIData['status'];
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
            status: 'Moderate',
            advice: {
                general: "Air quality is acceptable for most people.",
                sensitive: "Unusually sensitive people should consider reducing prolonged or heavy exertion."
            },
            habits: ["Reduce car usage", "Avoid burning waste", "Keep indoor plants"]
        };
    } else if (aqi <= 200) {
        return {
            status: 'Unhealthy',
            advice: {
                general: "Everyone may begin to experience health effects. Wear a mask outdoors.",
                sensitive: "Members of sensitive groups may experience more serious health effects. Avoid outdoor exertion."
            },
            habits: ["Wear N95 mask outdoors", "Use public transport", "Run air purifier indoors"]
        };
    } else {
        return {
            status: 'Hazardous',
            advice: {
                general: "Health warnings of emergency conditions. The entire population is more likely to be affected.",
                sensitive: "Avoid all outdoor exertion. Stay indoors and keep activity levels low."
            },
            habits: ["Stay indoors strictly", "Seal windows/doors", "Use high-quality air purifier", "Avoid strenuous exercise"]
        };
    }
};

const getWeatherCondition = (code: number): string => {
    // WMO Weather interpretation codes
    const codes: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
        61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
        71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
        80: 'Slight Rain Showers', 81: 'Moderate Rain Showers', 82: 'Violent Rain Showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with heavy hail'
    };
    return codes[code] || 'Unknown';
};



// --- WAQI Integration ---
interface WAQIResponse {
    status: string;
    data: {
        aqi: number;
        idx: number; // Unique ID
        city: {
            name: string;
            url: string;
        };
        iaqi: {
            pm25?: { v: number };
            pm10?: { v: number };
            o3?: { v: number };
            no2?: { v: number };
            t?: { v: number }; // Temp
            h?: { v: number }; // Humidity
            w?: { v: number }; // Wind
        };
        forecast?: {
            daily?: {
                pm25?: { avg: number; day: string; max: number; min: number }[];
            }
        }
    };
}

const getWAQIData = async (lat: number, lon: number): Promise<AQIData | null> => {
    const token = process.env.NEXT_PUBLIC_WAQI_TOKEN;
    if (!token) return null;

    try {
        console.log(`Fetching WAQI for ${lat}, ${lon}`);
        const res = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`);
        const json: WAQIResponse = await res.json();

        if (json.status !== 'ok') {
            console.warn("WAQI API error:", json);
            return null;
        }

        const d = json.data;
        console.log("WAQI Station Found:", d.city.name); // Log station name
        // WAQI weather is limited, but we can use it or fetch Open-Meteo weather separately if needed.
        // For simplicity and consistency, let's mix WAQI air data with Open-Meteo Weather for full details if WAQI is missing bits.
        // Actually, let's just use what WAQI gives for pollution and fallback to OpenMeteo for weather if we assume OpenMeteo is always called for weather.

        // HOWEVER, to keep it simple: if WAQI works, we use it. 
        // We might need to fetch weather separately if WAQI doesn't provide full weather context (like 'Condition' text).
        // Let's stick to the plan: Use WAQI for pollutants, but we still likely need Open-Meteo for detailed weather conditions.

        // Strategy: Fetch WAQI. If successful, use its AQI/Pollutants. THEN fetch Open-Meteo Weather to complement it.
        // Parse up to 3 days of future forecast from WAQI pm25 array
        let forecast: AQIForecastDay[] = [];
        if (d.forecast?.daily?.pm25) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            forecast = d.forecast.daily.pm25
                .filter(f => f.day >= todayStr)
                .slice(0, 3)
                .map(f => {
                    const { status } = getStatusAndRecommendation(f.avg);
                    return {
                        date: f.day,
                        avgAQI: f.avg, // PM2.5 in WAQI naturally aligns with AQI scales
                        maxAQI: f.max,
                        status
                    };
                });
        }

        const { status, advice, habits } = getStatusAndRecommendation(d.aqi);

        return {
            city: d.city.name,
            aqi: d.aqi,
            status,
            pollutants: {
                pm25: d.iaqi.pm25?.v || 0,
                pm10: d.iaqi.pm10?.v || 0,
                o3: d.iaqi.o3?.v || 0,
                no2: d.iaqi.no2?.v || 0
            },
            weather: {
                temperature: d.iaqi.t?.v || 0,
                humidity: d.iaqi.h?.v || 0,
                windSpeed: d.iaqi.w?.v || 0,
                apparentTemperature: d.iaqi.t?.v || 0, // Fallback to temp if not separately available
                condition: 'Local Station Data', // WAQI doesn't give text conditions
                isDay: true // Assumption or need calculation
            },
            advice,
            habits,
            forecast
        };

    } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
            console.error("WAQI Fetch Error", e);
        }
        return null;
    }
};

// Modified to try WAQI first, then fallback to Open-Meteo
const fetchUnifiedData = async (latitude: number, longitude: number, fallbackName: string): Promise<AQIData> => {
    console.log(`Unified Fetch: ${latitude}, ${longitude} | Fallback Name: ${fallbackName}`);

    // 1. Try WAQI
    const waqiData = await getWAQIData(latitude, longitude);

    // 2. Always fetch Weather from Open-Meteo because it's better (has conditions like "Cloudy", "Rain")
    // and WAQI doesn't strictly provide that.
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m`);
    const weatherJson = await weatherRes.json();
    const omWeather = weatherJson.current;

    const weatherObj = {
        temperature: omWeather.temperature_2m,
        humidity: omWeather.relative_humidity_2m,
        windSpeed: omWeather.wind_speed_10m,
        apparentTemperature: omWeather.apparent_temperature,
        condition: getWeatherCondition(omWeather.weather_code),
        isDay: !!omWeather.is_day
    };

    if (waqiData) {
        console.log(`Using WAQI Data. Station: ${waqiData.city}`);
        return {
            ...waqiData,
            weather: weatherObj,
            city: fallbackName, // Use the requested name (search/geo) instead of Station Name to avoid confusion
            coordinates: {
                lat: latitude,
                lon: longitude
            }
        };
    }

    console.error("WAQI returned null, and no fallback is permitted by user configuration.");
    throw new Error('AQICN API failed to return data for this location.');
};

export const getAQIData = async (city: string): Promise<AQIData> => {
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData: GeocodingResult = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }

        const { latitude, longitude, name, country, admin1 } = geoData.results[0];
        const displayName = `${name}, ${admin1 || ''} ${country ? `(${country})` : ''}`;

        return await fetchUnifiedData(latitude, longitude, displayName);

    } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError' && error.message !== 'City not found') {
            console.error("Error fetching data:", error);
        }
        throw error;
    }
};

export const getAQIDataByCoords = async (latitude: number, longitude: number): Promise<AQIData> => {
    try {
        let displayName = "Your Location";
        try {
            const reverseRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const reverseData = await reverseRes.json();
            if (reverseData.city || reverseData.locality) {
                displayName = `${reverseData.city || reverseData.locality}, ${reverseData.principalSubdivision || ''}`;
                console.log("Reverse Geocoded Name:", displayName);
            }
        } catch (e) {
            console.warn("Reverse geocoding failed");
        }

        return await fetchUnifiedData(latitude, longitude, displayName);
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
