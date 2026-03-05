import { NextRequest, NextResponse } from 'next/server';

const AQICN_TOKEN = process.env.NEXT_PUBLIC_AQICN_API_KEY;
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;

function getStatusAndRecommendation(aqi: number) {
    if (aqi <= 50) return { status: 'Good', general: "Air quality is satisfactory. Enjoy outdoor activities!", sensitive: "Air quality is great. No restrictions.", habits: ["Open windows for fresh air", "Go for a run or walk", "Plant more trees"] };
    if (aqi <= 100) return { status: 'Satisfactory', general: "Air quality is acceptable. Enjoy normal activities.", sensitive: "Unusually sensitive people should consider reducing heavy exertion.", habits: ["Reduce car usage", "Avoid burning waste", "Keep indoor plants"] };
    if (aqi <= 200) return { status: 'Moderately Polluted', general: "Breathing discomfort to people with lung, asthma and heart diseases.", sensitive: "Avoid outdoor exertion and wear a basic mask.", habits: ["Wear mask outdoors", "Use public transport", "Avoid heavy traffic areas"] };
    if (aqi <= 300) return { status: 'Poor', general: "Breathing discomfort to most people on prolonged exposure.", sensitive: "Remain indoors and keep activity levels low.", habits: ["Wear N95 mask outdoors", "Run air purifier indoors", "Limit outdoor time"] };
    if (aqi <= 400) return { status: 'Very Poor', general: "Respiratory illness on prolonged exposure. Avoid strenuous outdoor activities.", sensitive: "Avoid all outdoor exertion. Sensitive groups should remain indoors.", habits: ["Stay indoors", "Seal windows/doors", "Use high-quality air purifier"] };
    return { status: 'Severe', general: "Health warnings of emergency conditions. Severe respiratory impacts even on healthy people.", sensitive: "Avoid all physical activity outdoors. Stay strictly indoors.", habits: ["Stay indoors strictly", "Use N95 mask even for short trips", "Keep air purifier constantly on"] };
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const city = searchParams.get('city');

    if (!AQICN_TOKEN) {
        return NextResponse.json({ error: 'AQICN API key not configured' }, { status: 500 });
    }

    try {
        let latitude: number, longitude: number, cityName: string = '';

        if (lat && lon) {
            latitude = parseFloat(lat);
            longitude = parseFloat(lon);

            // Reverse geocode to get city name from coordinates
            try {
                const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`, {
                    headers: { 'User-Agent': 'ReLief-AQI/1.0' }
                });
                if (nomRes.ok) {
                    const nomData = await nomRes.json();
                    const addr = nomData.address || {};
                    const city = addr.city || addr.town || addr.village || addr.county || '';
                    const state = addr.state || '';
                    if (city) cityName = `${city}${state ? ', ' + state : ''}`;
                }
            } catch { }
        } else if (city) {
            // Geocode the city — try full query first, then just city name as fallback
            let geoData: any = null;
            const queries = [city, city.split(',')[0].trim()];

            for (const q of queries) {
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`);
                geoData = await geoRes.json();
                if (geoData.results?.length) break;
            }

            if (!geoData?.results?.length) {
                return NextResponse.json({ error: `City "${city}" not found` }, { status: 404 });
            }

            const result = geoData.results[0];
            latitude = result.latitude;
            longitude = result.longitude;
            cityName = `${result.name}, ${result.admin1 || ''}, India`;
        } else {
            return NextResponse.json({ error: 'Provide either lat/lon or city parameter' }, { status: 400 });
        }

        // Fetch AQICN Air Quality
        const aqiRes = await fetch(`https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=${AQICN_TOKEN}`);
        const aqiJson = await aqiRes.json();

        if (aqiJson.status !== 'ok') {
            return NextResponse.json({ error: 'AQI data unavailable for this location' }, { status: 404 });
        }

        const w = aqiJson.data;
        const aqi = w.aqi;
        const { status, general, sensitive, habits } = getStatusAndRecommendation(aqi);

        // Fetch weather from OpenWeatherMap
        let weather = {
            temperature: w.iaqi?.t?.v ?? null,
            humidity: w.iaqi?.h?.v ?? null,
            windSpeed: w.iaqi?.w?.v ?? null,
            apparentTemperature: w.iaqi?.t?.v ?? null,
            condition: 'Clear',
            weatherCode: 0,
            isDay: true
        };

        if (OPENWEATHER_KEY) {
            try {
                const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_KEY}`);
                if (weatherRes.ok) {
                    const ow = await weatherRes.json();
                    const sunriseTs = ow.sys?.sunrise ?? 0;
                    const sunsetTs = ow.sys?.sunset ?? 0;
                    const nowTs = Math.floor(Date.now() / 1000);
                    weather = {
                        temperature: ow.main?.temp ?? null,
                        humidity: ow.main?.humidity ?? null,
                        windSpeed: ow.wind?.speed ? Math.round(ow.wind.speed * 3.6 * 10) / 10 : null, // m/s → km/h
                        apparentTemperature: ow.main?.feels_like ?? null,
                        condition: ow.weather?.[0]?.description
                            ? ow.weather[0].description.charAt(0).toUpperCase() + ow.weather[0].description.slice(1)
                            : 'Clear',
                        weatherCode: ow.weather?.[0]?.id ?? 0,
                        isDay: nowTs >= sunriseTs && nowTs < sunsetTs
                    };
                }
            } catch { }
        }

        // Extract pollutants
        const pollutants = {
            pm25: w.iaqi?.pm25?.v ?? null,
            pm10: w.iaqi?.pm10?.v ?? null,
            o3: w.iaqi?.o3?.v ?? null,
            no2: w.iaqi?.no2?.v ?? null,
            so2: w.iaqi?.so2?.v ?? null,
            co: w.iaqi?.co?.v ?? null,
        };

        const resolvedCityName = cityName || w.city?.name?.replace(/\([^)]*\)/g, '').trim() || 'Your Location';

        return NextResponse.json({
            city: resolvedCityName,
            aqi,
            status,
            pollutants,
            weather,
            advice: { general, sensitive },
            habits,
            coordinates: { lat: latitude, lon: longitude },
            stationName: w.city?.name || '',
            updatedAt: w.time?.iso || new Date().toISOString()
        });

    } catch (err: any) {
        console.error('AQI API Error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

function getWeatherCondition(code: number): string {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 9) return 'Foggy';
    if (code <= 19) return 'Drizzle';
    if (code <= 29) return 'Rainy';
    if (code <= 39) return 'Snowy';
    if (code <= 49) return 'Foggy';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rainy';
    if (code <= 79) return 'Snowy';
    if (code <= 82) return 'Heavy Rain';
    if (code <= 86) return 'Heavy Snow';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
}
