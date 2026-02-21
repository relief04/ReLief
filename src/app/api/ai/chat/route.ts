
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini
const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(getApiKey());
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const KNOWLEDGE_BASE = `
ReLief Carbon Calculator Logic:
- Transport: Calculates emissions based on distance (km) and vehicle type (Car, Bike, Bus, Train).
- Electricity: Uses kwh * 0.82 (avg emission factor).
- Diet: High Meat (3.3), Average (2.5), Vegetarian (1.7), Vegan (1.5) kg CO2e/day.

Eco Streak Forest:
- 7 Days = 1 Small Tree. 30 Days = Big Oak. 100 Days = Ancient Tree.
- Missing a day resets the streak to 0.

Rewards (Points):
- 1 Action = 10 KP.
- Redeem KP for real tree planting (2000 KP) or eco discounts.

AQI Index:
- 0-50: Good, 51-100: Satisfactory, 101-200: Moderate, 201-300: Poor, 301-400: Very Poor, 401+: Severe.

AI Bill Scanner:
- Extract kWh and Amount using OCR. Awards 50 KP for verified uploads.
`;

export async function POST(req: Request) {
    try {
        const { message, previousMessages } = await req.json();

        if (!getApiKey()) {
            return NextResponse.json({ error: 'Gemini API Key is missing.' }, { status: 500 });
        }

        // 4. Build the Prompt with included Knowledge Base
        const systemPrompt = `
You are the "ReLief AI Assistant", an intelligent eco-conscious guide.
You have complete knowledge of the ReLief platform.

KNOWLEDGE BASE:
${KNOWLEDGE_BASE}

Instructions:
- Use the KNOWLEDGE BASE to answer platform-specific questions accurately.
- Answer general sustainability questions using your general intelligence.
- Be professional, encouraging, and use markdown.
- If asked about "Gemini", acknowledge you are powered by it.
- Never mention your technical limitations (like missing embeddings). Simply provide the best answer possible.
`;

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'I am the ReLief AI Assistant. I am ready to guide users through the platform and provide sustainability expertise.' }] },
                ...(previousMessages || []).map((msg: any) => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }],
                }))
            ],
        });

        const result = await chat.sendMessage(message);
        return NextResponse.json({ reply: result.response.text() });

    } catch (error) {
        console.error("Error in chat route:", error);
        return NextResponse.json(
            { error: "Failed to process chat message", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
