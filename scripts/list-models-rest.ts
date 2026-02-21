
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface GeminiModel {
    name: string;
    supportedGenerationMethods: string[];
}

async function checkModels() {
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) {
        console.error("No API KEY found in .env.local!");
        return;
    }

    console.log(`Checking models with key: ${key.substring(0, 5)}...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Models supporting generateContent:");
            const validModels = ((data.models as GeminiModel[]) || [])
                .filter((m: GeminiModel) => m.supportedGenerationMethods.includes('generateContent'));

            validModels.forEach((m: GeminiModel) => {
                console.log(`- ${m.name}`);
            });

            if (validModels.length === 0) {
                console.log("No models support generateContent!");
                console.log("All models:", (data.models as GeminiModel[])?.map((m: GeminiModel) => m.name));
            }
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

checkModels();
