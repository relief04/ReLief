
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env vars using dotenv
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading .env.local from:', envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

console.log('Supabase URL found:', !!supabaseUrl);
console.log('Supabase Key found:', !!supabaseKey);
console.log('Gemini Key found:', !!geminiKey);

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "embedding-001" });

const KNOWLEDGE_BASE = [
    {
        category: 'Calculator',
        content: `ReLief Carbon Calculator Logic:
        - Transport: Calculates emissions based on distance (km) and vehicle type (Car, Bike, Bus, Train).
        - Electricity: Uses kwh * 0.82 (avg emission factor) to estimate carbon.
        - Diet: 
          - High Meat: 3.3 kg CO2e/day
          - Average: 2.5 kg CO2e/day
          - Vegetarian: 1.7 kg CO2e/day
          - Vegan: 1.5 kg CO2e/day
        - Result is displayed in kg CO2e/month.
        - "Zero Waste" means producing less than 1kg of trash per week.`
    },
    {
        category: 'Forest',
        content: `Eco Streak Forest:
        - Users grow virtual trees by maintaining a daily streak of logging eco-actions.
        - 1 Action = 1 Day Streak.
        - Missing a day resets the streak to zero (strict rule).
        - 7 Days = 1 Small Tree.
        - 30 Days = 1 Big Oak Tree.
        - 100 Days = 1 Magical Ancient Tree + 'Forest Guardian' Badge.`
    },
    {
        category: 'Rewards',
        content: `ReLief Rewards System:
        - Karma Points (KP) are earned by logging actions, completing challenges, and taking quizzes.
        - 1 Action = 10 KP.
        - Challenge Completion = 100-500 KP (varies by difficulty).
        - Marketplace: Users can redeem KP for:
          - Real Tree Planting (2000 KP)
          - Eco Store Discounts (500 KP)
          - Profile Borders (200+ KP)
          - Digital E-books (800 KP)`
    },
    {
        category: 'AQI',
        content: `Air Quality Index (AQI) Module:
        - Shows live AQI data for major Indian cities.
        - 0-50: Good (Green)
        - 51-100: Satisfactory (Yellow)
        - 101-200: Moderate (Orange)
        - 201-300: Poor (Red)
        - 301-400: Very Poor (Purple)
        - 401+: Severe (Maroon)
        - Provides health recommendations based on current AQI.`
    },
    {
        category: 'Bill Scanner',
        content: `AI Bill Scanner:
        - Users upload electricity bills to track consumption.
        - Uses OCR to extract 'Units Consumed (kWh)' and 'Bill Amount'.
        - Verifies data against previous months.
        - Auto-calculates carbon footprint for the month.
        - Awards 50 KP for verified bill uploads.`
    }
];

async function seed() {
    const logs: any[] = [];
    const log = (msg: string, data?: any) => {
        const entry = data ? `${msg} ${JSON.stringify(data)}` : msg;
        console.log(entry);
        logs.push({ timestamp: new Date().toISOString(), message: msg, data });
    };

    log('Starting Knowledge Seeding...');

    try {
        for (const item of KNOWLEDGE_BASE) {
            log(`Processing: ${item.category}`);

            // 2. Generate Embedding
            const result = await model.embedContent(item.content);
            const embedding = result.embedding.values;
            log(`Generated embedding for ${item.category}, length: ${embedding.length}`);

            // 3. Insert into DB
            const { error } = await supabase.from('relief_knowledge').insert({
                content: item.content,
                category: item.category,
                embedding: embedding
            });

            if (error) {
                log(`Error inserting ${item.category}:`, error);
                throw error;
            } else {
                log(`Saved ${item.category}.`);
            }
        }
        log('Seeding Complete!');
    } catch (err: any) {
        log('CRITICAL SEED ERROR:', { message: err.message, stack: err.stack, details: err });
    } finally {
        fs.writeFileSync('seed-log.json', JSON.stringify(logs, null, 2));
    }
}

seed();
