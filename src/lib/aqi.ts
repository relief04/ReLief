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



// --- OpenWeather Integration ---
interface OpenWeatherAirPollutionResponse {
    list: {
        dt: number;
        main: { aqi: number };
        components: {
            co: number;
            no: number;
            no2: number;
            o3: number;
            so2: number;
            pm2_5: number;
            pm10: number;
            nh3: number;
        };
    }[];
}

// Helper to convert PM2.5 (μg/m³) to US EPA AQI (0-500)
// using the official breakpoints from AirNow
const calculateUS_EPA_AQI_from_PM25 = (c: number): number => {
    let AQI = 0;
    let bplo = 0, bphi = 0, ilo = 0, ihi = 0;

    if (c <= 12.0) {
        bplo = 0.0; bphi = 12.0; ilo = 0; ihi = 50;
    } else if (c <= 35.4) {
        bplo = 12.1; bphi = 35.4; ilo = 51; ihi = 100;
    } else if (c <= 55.4) {
        bplo = 35.5; bphi = 55.4; ilo = 101; ihi = 150;
    } else if (c <= 150.4) {
        bplo = 55.5; bphi = 150.4; ilo = 151; ihi = 200;
    } else if (c <= 250.4) {
        bplo = 150.5; bphi = 250.4; ilo = 201; ihi = 300;
    } else if (c <= 350.4) {
        bplo = 250.5; bphi = 350.4; ilo = 301; ihi = 400;
    } else if (c <= 500.4) {
        bplo = 350.5; bphi = 500.4; ilo = 401; ihi = 500;
    } else {
        return 500; // Max out at 500
    }

    AQI = Math.round(((ihi - ilo) / (bphi - bplo)) * (c - bplo) + ilo);
    return AQI;
};

const getOpenWeatherData = async (lat: number, lon: number): Promise<AQIData | null> => {
    const token = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!token) {
        console.warn("OpenWeather Token not found in environment variables.");
        return null;
    }

    try {
        console.log(`Fetching OpenWeather Air Pollution for ${lat}, ${lon}`);

        // Fetch Current Pollution
        const res = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${token}`);
        if (!res.ok) {
            console.warn(`OpenWeather API error: ${res.statusText}`);
            return null;
        }

        const json: OpenWeatherAirPollutionResponse = await res.json();
        const currentData = json.list[0];

        if (!currentData) return null;

        // Fetch Forecast
        let forecast: AQIForecastDay[] = [];
        try {
            const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${token}`);
            if (forecastRes.ok) {
                const forecastJson: OpenWeatherAirPollutionResponse = await forecastRes.json();

                // Group forecast by day and find daily max/avg PM2.5 to calculate AQI
                const dailyMap = new Map<string, { sumPM: number, maxPM: number, count: number }>();
                const todayStr = new Date().toLocaleDateString('en-CA');

                forecastJson.list.forEach(f => {
                    const dateStr = new Date(f.dt * 1000).toLocaleDateString('en-CA');
                    if (dateStr >= todayStr) {
                        if (!dailyMap.has(dateStr)) dailyMap.set(dateStr, { sumPM: 0, maxPM: 0, count: 0 });
                        const dayData = dailyMap.get(dateStr)!;
                        const pm25 = f.components.pm2_5;

                        dayData.sumPM += pm25;
                        if (pm25 > dayData.maxPM) dayData.maxPM = pm25;
                        dayData.count += 1;
                    }
                });

                // Extract top 3 future days
                const sortedDays = Array.from(dailyMap.keys()).sort();
                forecast = sortedDays.slice(0, 3).map(day => {
                    const dayData = dailyMap.get(day)!;
                    const avgPM = dayData.sumPM / dayData.count;

                    const avgAQI = calculateUS_EPA_AQI_from_PM25(avgPM);
                    const maxAQI = calculateUS_EPA_AQI_from_PM25(dayData.maxPM);
                    const { status } = getStatusAndRecommendation(avgAQI);

                    return {
                        date: day,
                        avgAQI: avgAQI,
                        maxAQI: maxAQI,
                        status
                    };
                });
            }
        } catch (e) {
            console.warn("Failed to fetch OpenWeather forecast", e);
        }

        // Calculate accurate US EPA AQI from OpenWeather's raw pm2.5 concentration μg/m3
        const epaAQI = calculateUS_EPA_AQI_from_PM25(currentData.components.pm2_5);
        const { status, advice, habits } = getStatusAndRecommendation(epaAQI);

        return {
            city: "OpenWeather Station", // Needs to be overridden by generic fallback
            aqi: epaAQI,
            status,
            pollutants: {
                pm25: currentData.components.pm2_5 || 0,
                pm10: currentData.components.pm10 || 0,
                o3: currentData.components.o3 || 0,
                no2: currentData.components.no2 || 0
            },
            weather: {
                temperature: 0,
                humidity: 0,
                windSpeed: 0,
                apparentTemperature: 0,
                condition: 'Local Station Data',
                isDay: true
            },
            advice,
            habits,
            forecast
        };

    } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
            console.error("OpenWeather Fetch Error", e);
        }
        return null;
    }
};

const fetchUnifiedData = async (latitude: number, longitude: number, fallbackName: string): Promise<AQIData> => {
    console.log(`Unified Fetch: ${latitude}, ${longitude} | Fallback Name: ${fallbackName}`);

    // 1. Try OpenWeather for Air Pollution
    const owData = await getOpenWeatherData(latitude, longitude);

    // 2. Always fetch Weather from Open-Meteo because it's better (has conditions like "Cloudy", "Rain")
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

    if (owData) {
        console.log(`Using OpenWeather API Data.`);
        return {
            ...owData,
            weather: weatherObj,
            city: fallbackName, // Use the requested name (search/geo) 
            coordinates: {
                lat: latitude,
                lon: longitude
            }
        };
    }

    console.error("OpenWeather returned null, and no fallback is permitted by user configuration.");
    throw new Error('API failed to return data for this location.');
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
