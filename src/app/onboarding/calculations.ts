import { OnboardingData, FuelType, DietType, TravelMode, FlightHaul, FlightClass } from './types';

// --- Emission Factors (kg CO2e per unit) ---

// Electricity: Global average approx 0.475 kg/kWh (India is higher ~0.82, but using a generic baseline or user's specific context if available later. Using 0.8 for "grid" average)
const ELECTRICITY_FACTOR = 0.85;

// Water: Pumping and treatment. Approx 0.3 kg/m3 (0.0003 kg/litre)
const WATER_FACTOR_PER_LITRE = 0.001;

// Fuels
const FUEL_FACTORS: Record<FuelType, number> = {
    natural_gas: 2.03, // kg per m3 (approx) - simplified to generic "unit" if user enters kWh or similar. 
    // actually Step 6 asks for LPG/Fuel Quantity.
    // LPG: ~1.5 kg CO2 per Litre, ~3.0 kg CO2 per Kg.
    // Let's standardise Step 6 to "LPG equivalent" for simplicity unless we branch complexly.
    lpg: 1.51,         // kg CO2 per Litre
    heating_oil: 2.5,  // kg/L
    coal: 2.4,         // kg/kg
    wood: 0.1,         // Biomass (low net CO2)
    district: 0.2,     // per kWh
};

// Transport (kg CO2 per km)
const TRANSPORT_FACTORS: Record<TravelMode, number> = {
    car: 0.19,
    two_wheeler: 0.08,
    bus: 0.10,
    metro: 0.04,
    bicycle: 0,
    walking: 0,
    wfh: 0,
};

// Flights (kg CO2 per flight)
const FLIGHT_FACTORS: Record<FlightHaul, number> = {
    short: 150,
    medium: 400,
    long: 1000,
};

const CLASS_MULTIPLIERS: Record<FlightClass, number> = {
    economy: 1,
    premium: 1.5,
    business: 3,
    first: 4,
};

// Diet (kg CO2e per day)
const DIET_FACTORS_DAILY: Record<DietType, number> = {
    vegan: 2.89,
    vegetarian: 3.81,
    pescatarian: 3.91,
    meat_no_beef: 5.63,
    meat_high: 7.19,
};

// Lifestyle / Shopping (kg CO2e per item)
const SHOPPING_FACTORS = {
    tshirt: 5,
    jeans: 25,
    shoes: 15,
    smartphone: 60, // amortized annual
    laptop: 200,    // amortized annual
    tv: 150,        // amortized annual
    hotel: 25,      // kg per night
};

export function calculateFootprint(data: OnboardingData) {
    let dailyTotal = 0;

    const breakdown = {
        electricity: 0,
        homeFuels: 0,
        transport: 0,
        flights: 0,
        food: 0,
        lifestyle: 0
    };

    // 1. Household Energy (divided by household size)
    // Electricity
    const monthlyElec = data.household.electricity.kwh * ELECTRICITY_FACTOR;
    breakdown.electricity = (monthlyElec * 12) / 365 / data.household.size;

    // Water
    let monthlyWaterLitres = data.household.water.usage;
    if (data.household.water.unit === 'm3') monthlyWaterLitres *= 1000;
    if (data.household.water.unit === 'gallons') monthlyWaterLitres *= 3.785;
    const waterCarbon = monthlyWaterLitres * WATER_FACTOR_PER_LITRE;
    // Water is usually grouped with home or lifestyle, putting in homeFuels for now as "Home Utilities"
    breakdown.homeFuels += (waterCarbon * 12) / 365 / data.household.size;

    // Heating/Cooking Fuels
    if (data.household.fuels.useNonElectric) {
        let monthlyFuelCarbon = 0;
        const amount = data.household.fuels.lpgUsage.amount;
        // Simplified: Assuming primary fuel selected is the one quantified
        // If multiple selected, we'd need complex inputs. 
        // For now, taking the first selected type or defaulting to LPG factor
        const mainFuel = data.household.fuels.types[0] || 'lpg';
        let factor = FUEL_FACTORS[mainFuel];

        // Adjust factor based on unit
        if (data.household.fuels.lpgUsage.unit === 'kg' && mainFuel === 'lpg') factor = 2.96; // LPG kg factor
        if (data.household.fuels.lpgUsage.unit === 'kwh') factor = 0.2; // Generic kWh factor

        monthlyFuelCarbon = amount * factor;
        breakdown.homeFuels += (monthlyFuelCarbon * 12) / 365 / data.household.size;
    }

    // 2. Transport
    // Daily commute
    const mode = data.transport.mainMode || 'car'; // Safety default
    const dailyCommute = data.transport.dailyDistanceKm * TRANSPORT_FACTORS[mode];
    breakdown.transport = dailyCommute;

    // Flights (Annual)
    let annualFlightCarbon = 0;
    Object.entries(data.transport.flights).forEach(([haul, classes]) => {
        Object.entries(classes).forEach(([cls, count]) => {
            // @ts-ignore
            annualFlightCarbon += count * FLIGHT_FACTORS[haul] * CLASS_MULTIPLIERS[cls];
        });
    });
    breakdown.flights = annualFlightCarbon / 365;

    // 3. Food
    const diet = data.food.diet || 'meat_no_beef'; // Safety default
    let dailyFood = DIET_FACTORS_DAILY[diet];
    // Adjust for meals per day (assuming standard is 3)
    if (data.food.mealsPerDay <= 1) dailyFood *= 0.6;
    if (data.food.mealsPerDay === 2) dailyFood *= 0.85;
    if (data.food.mealsPerDay >= 4) dailyFood *= 1.15;
    breakdown.food = dailyFood;

    // 4. Lifestyle
    let annualLifestyle = 0;

    // Hotel
    annualLifestyle += data.lifestyle.hotelNights * SHOPPING_FACTORS.hotel;


    // Clothing
    let clothingFactor = 1; // if period is yearly
    if (data.lifestyle.clothing.period === 'monthly') clothingFactor = 12;

    annualLifestyle += data.lifestyle.clothing.tshirts * clothingFactor * SHOPPING_FACTORS.tshirt;
    annualLifestyle += data.lifestyle.clothing.jeans * clothingFactor * SHOPPING_FACTORS.jeans;
    annualLifestyle += data.lifestyle.clothing.shoes * clothingFactor * SHOPPING_FACTORS.shoes;

    // Devices (Amortized per year footprint)
    annualLifestyle += (data.lifestyle.devices.smartphone * SHOPPING_FACTORS.smartphone) / 3; // replace every 3 yrs approx
    annualLifestyle += (data.lifestyle.devices.laptop * SHOPPING_FACTORS.laptop) / 5;
    annualLifestyle += (data.lifestyle.devices.tv * SHOPPING_FACTORS.tv) / 7;

    breakdown.lifestyle = annualLifestyle / 365;

    // Sum it up
    dailyTotal =
        breakdown.electricity +
        breakdown.homeFuels +
        breakdown.transport +
        breakdown.flights +
        breakdown.food +
        breakdown.lifestyle;

    return { dailyTotal, breakdown };
}
