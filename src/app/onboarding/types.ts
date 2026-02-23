export type FlightHaul = 'short' | 'medium' | 'long';
export type FlightClass = 'economy' | 'premium' | 'business' | 'first';

export type FuelType = 'natural_gas' | 'lpg' | 'heating_oil' | 'coal' | 'wood' | 'district';
export type TravelMode = 'car' | 'two_wheeler' | 'bus' | 'metro' | 'bicycle' | 'walking' | 'wfh';
export type DietType = 'vegan' | 'vegetarian' | 'pescatarian' | 'meat_no_beef' | 'meat_high';

export interface TransportData {
    mainMode: TravelMode | null;
    dailyDistanceKm: number | null; // null forces user to input
    flights: Record<FlightHaul, Record<FlightClass, number>>;
}

export interface HouseholdData {
    size: number | null; // Forces user to choose
    electricity: {
        kwh: number | null;
    };
    water: {
        usage: number | null;
        unit: 'm3' | 'litres' | 'gallons';
    };
    fuels: {
        useNonElectric: boolean | null;
        types: FuelType[];
        lpgUsage: {
            amount: number;
            unit: 'litres' | 'kg' | 'kwh';
        };
    };
}

export interface LifestyleData {
    hotelNights: number;
    clothing: {
        tshirts: number;
        jeans: number;
        shoes: number;
        period: 'monthly' | 'yearly';
    };
    devices: {
        smartphone: number;
        laptop: number;
        tv: number;
    };
}

export interface FoodData {
    diet: DietType | null;
    mealsPerDay: number | null;
}

export interface OnboardingData {
    household: HouseholdData;
    transport: TransportData;
    food: FoodData;
    lifestyle: LifestyleData;
}

export const INITIAL_DATA: OnboardingData = {
    household: {
        size: null,
        electricity: { kwh: null },
        water: { usage: null, unit: 'litres' },
        fuels: {
            useNonElectric: null, // Forces user to choose Yes/No
            types: [],
            lpgUsage: { amount: 0, unit: 'kg' }
        }
    },
    transport: {
        mainMode: null, // Forces selection
        dailyDistanceKm: null,
        flights: {
            short: { economy: 0, premium: 0, business: 0, first: 0 },
            medium: { economy: 0, premium: 0, business: 0, first: 0 },
            long: { economy: 0, premium: 0, business: 0, first: 0 },
        }
    },
    food: {
        diet: null, // Forces selection
        mealsPerDay: null
    },
    lifestyle: {
        hotelNights: 0,
        clothing: {
            tshirts: 0,
            jeans: 0,
            shoes: 0,
            period: 'yearly'
        },
        devices: {
            smartphone: 0,
            laptop: 0,
            tv: 0
        }
    }
};
