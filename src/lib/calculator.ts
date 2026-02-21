export type EmissionType = 'travel' | 'electricity' | 'food' | 'waste' | 'water';
export type TravelMode = 'car' | 'bus' | 'train' | 'bike' | 'walk' | 'motorcycle' | 'flight' | 'ebike';
export type DietType = 'meat' | 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';

export interface CalculationResult {
    total: number;
    breakdown: Record<EmissionType, number>;
    unit: 'kg CO2';
    savings?: number; // Compared to baseline
}

// --- New Daily Log Types ---
export type UsageLevel = 'low' | 'typical' | 'high';

export interface Trip {
    id: string;
    mode: TravelMode;
    distance: number;
}

export interface Flight {
    id: string;
    type: 'short' | 'long';
    count: number;
}

export interface HotelStay {
    id: string;
    nights: number;
}

export interface DailyLogInput {
    trips: Trip[];
    electricityUsage: UsageLevel;
    waterUsage: UsageLevel;
    meals: number;
    mealType?: DietType;
    dietDifferent: boolean;
    appliances: string[]; // New: list of high-load appliances used
    flights: Flight[];
    hotelStays: HotelStay[];
}

interface EmissionInput {
    // Travel
    travelKm?: number | string;
    travelMode?: TravelMode;

    // Electricity
    electricityKwh?: number | string;
    renewablePercent?: number; // 0-100

    // Food
    dietType?: DietType;
    localFoodPercent?: number; // 0-100

    // Waste
    wasteKg?: number | string;
    recyclingPercent?: number; // 0-100

    // Water
    waterLiters?: number | string;
}

/**
 * Enhanced Carbon Emission Factors (kg CO2 per unit)
 * Based on research from EPA, IPCC, and carbon footprint databases
 */
const EMISSION_FACTORS = {
    // Travel (kg CO2 per km)
    travel: {
        car: 0.192,          // Average gasoline car
        motorcycle: 0.113,   // Average motorcycle
        bus: 0.089,          // Public bus per passenger
        train: 0.041,        // Electric train per passenger
        flight: 0.255,       // Short-haul flight per passenger
        ebike: 0.01,         // E-bike (electricity consumption)
        bike: 0,             // Zero emissions
        walk: 0              // Zero emissions
    },

    // Electricity (kg CO2 per kWh)
    electricity: {
        grid: 0.475,         // Average grid mix (India)
        renewable: 0.02      // Solar/wind (minimal lifecycle emissions)
    },

    // Food (kg CO2 per week)
    food: {
        meat: 28.5,          // High meat consumption
        omnivore: 17.5,      // Balanced diet
        pescatarian: 12.0,   // Fish-based
        vegetarian: 9.5,     // No meat/fish
        vegan: 6.0,          // Plant-based only
        localBonus: 0.85     // Multiplier for local food (15% reduction)
    },

    // Waste (kg CO2 per kg of waste)
    waste: {
        landfill: 0.57,      // Waste to landfill
        recycled: 0.02       // Recycled waste (minimal)
    },

    // Water (kg CO2 per 1000 liters)
    water: {
        treated: 0.344       // Water treatment and distribution
    },

    // Daily Usage Levels (Approximate daily values for quick selection)
    daily: {
        electricity: {
            low: 2,         // 2 kWh
            typical: 5,     // 5 kWh
            high: 12        // 12 kWh (AC/High usage)
        },
        water: {
            low: 50,        // 50 Liters
            typical: 150,   // 150 Liters
            high: 400       // 400 Liters (bath etc)
        },
        appliances: {
            ac: 1.5,        // 1.5 kWh extra for AC usage (avg hours)
            heater: 2.0,    // 2.0 kWh for water heater
            oven: 0.8,      // 0.8 kWh for oven/induction
            ev_charge: 5.0  // 5.0 kWh for EV charging
        }
    }
};

/**
 * Calculate carbon emissions with enhanced accuracy
 */
export function calculateEmissions(data: EmissionInput): CalculationResult {
    let travelEmission = 0;
    let electricityEmission = 0;
    let foodEmission = 0;
    let wasteEmission = 0;
    let waterEmission = 0;

    // 1. TRAVEL EMISSIONS
    const travelKm = Number(data.travelKm || 0);
    const travelMode = data.travelMode || 'car';
    travelEmission = travelKm * EMISSION_FACTORS.travel[travelMode];

    // 2. ELECTRICITY EMISSIONS
    const electricityKwh = Number(data.electricityKwh || 0);
    const renewablePercent = Number(data.renewablePercent || 0) / 100;
    const gridPercent = 1 - renewablePercent;

    electricityEmission =
        (electricityKwh * gridPercent * EMISSION_FACTORS.electricity.grid) +
        (electricityKwh * renewablePercent * EMISSION_FACTORS.electricity.renewable);

    // 3. FOOD EMISSIONS
    const dietType = data.dietType || 'omnivore';
    const localFoodPercent = Number(data.localFoodPercent || 0) / 100;

    foodEmission = EMISSION_FACTORS.food[dietType];
    // Apply local food bonus
    if (localFoodPercent > 0) {
        foodEmission *= (1 - (localFoodPercent * (1 - EMISSION_FACTORS.food.localBonus)));
    }

    // 4. WASTE EMISSIONS
    const wasteKg = Number(data.wasteKg || 0);
    const recyclingPercent = Number(data.recyclingPercent || 0) / 100;
    const landfillPercent = 1 - recyclingPercent;

    wasteEmission =
        (wasteKg * landfillPercent * EMISSION_FACTORS.waste.landfill) +
        (wasteKg * recyclingPercent * EMISSION_FACTORS.waste.recycled);

    // 5. WATER EMISSIONS
    const waterLiters = Number(data.waterLiters || 0);
    waterEmission = (waterLiters / 1000) * EMISSION_FACTORS.water.treated;

    const total = travelEmission + electricityEmission + foodEmission + wasteEmission + waterEmission;

    return {
        total: parseFloat(total.toFixed(2)),
        breakdown: {
            travel: parseFloat(travelEmission.toFixed(2)),
            electricity: parseFloat(electricityEmission.toFixed(2)),
            food: parseFloat(foodEmission.toFixed(2)),
            waste: parseFloat(wasteEmission.toFixed(2)),
            water: parseFloat(waterEmission.toFixed(2))
        },
        unit: 'kg CO2'
    };
}

/**
 * Calculate emissions for a structured daily log
 */
export function calculateDailyLogEmissions(data: DailyLogInput, baseDiet: DietType = 'omnivore'): CalculationResult {
    let travelEmission = 0;
    let electricityEmission = 0;
    let foodEmission = 0;
    let waterEmission = 0;

    // 1. Trips
    data.trips.forEach(trip => {
        travelEmission += (trip.distance * EMISSION_FACTORS.travel[trip.mode]);
    });

    // 2. Flights (simplified weekly/daily)
    data.flights.forEach(f => {
        const factor = f.type === 'short' ? 250 : 1000; // rough kg CO2
        travelEmission += (factor * f.count);
    });

    // 3. Electricity
    let elecKwh = EMISSION_FACTORS.daily.electricity[data.electricityUsage];

    // Add appliance specific usage
    data.appliances.forEach(app => {
        const factor = (EMISSION_FACTORS.daily.appliances as any)[app] || 0;
        elecKwh += factor;
    });

    electricityEmission = elecKwh * EMISSION_FACTORS.electricity.grid;

    // 4. Water
    const waterL = EMISSION_FACTORS.daily.water[data.waterUsage];
    waterEmission = (waterL / 1000) * EMISSION_FACTORS.water.treated;

    // 5. Food (per meal basis or daily adjustment)
    // Diet factor is weekly usually, we divide by 21 (3 meals/day * 7 days) to get per-meal emission
    const activeDiet = data.mealType || baseDiet;
    const dailyFoodBase = EMISSION_FACTORS.food[activeDiet] / 7;

    // Calculate based on number of meals
    foodEmission = (data.meals / 3) * dailyFoodBase;

    // 6. Hotels
    data.hotelStays.forEach(h => {
        travelEmission += (h.nights * 15); // Avg 15kg CO2 per night
    });

    const total = travelEmission + electricityEmission + foodEmission + waterEmission;

    return {
        total: parseFloat(total.toFixed(2)),
        breakdown: {
            travel: parseFloat(travelEmission.toFixed(2)),
            electricity: parseFloat(electricityEmission.toFixed(2)),
            food: parseFloat(foodEmission.toFixed(2)),
            waste: 0,
            water: parseFloat(waterEmission.toFixed(2))
        },
        unit: 'kg CO2'
    };
}

/**
 * Calculate carbon savings compared to baseline
 */
export function calculateSavings(
    currentEmissions: number,
    baselineEmissions: number
): number {
    const savings = baselineEmissions - currentEmissions;
    return parseFloat(Math.max(0, savings).toFixed(2));
}

/**
 * Get average baseline emissions for comparison
 * Based on typical user behavior
 */
export function getAverageBaseline(): number {
    // Average weekly emissions for typical user
    const avgTravel = 100 * EMISSION_FACTORS.travel.car; // 100km by car
    const avgElectricity = 150 * EMISSION_FACTORS.electricity.grid; // 150 kWh
    const avgFood = EMISSION_FACTORS.food.omnivore; // Omnivore diet
    const avgWaste = 10 * EMISSION_FACTORS.waste.landfill; // 10kg to landfill
    const avgWater = (500 / 1000) * EMISSION_FACTORS.water.treated; // 500L

    return parseFloat((avgTravel + avgElectricity + avgFood + avgWaste + avgWater).toFixed(2));
}

/**
 * Get emission reduction tips based on current emissions
 */
export function getReductionTips(breakdown: Record<EmissionType, number>): string[] {
    const tips: string[] = [];

    if (breakdown.travel > 20) {
        tips.push("🚴 Try cycling or public transport for short trips");
    }
    if (breakdown.electricity > 70) {
        tips.push("💡 Switch to LED bulbs and unplug unused devices");
    }
    if (breakdown.food > 15) {
        tips.push("🥗 Consider reducing meat consumption or buying local produce");
    }
    if (breakdown.waste > 5) {
        tips.push("♻️ Increase recycling and composting to reduce landfill waste");
    }
    if (breakdown.water > 0.5) {
        tips.push("💧 Fix leaks and use water-efficient appliances");
    }

    return tips;
}

