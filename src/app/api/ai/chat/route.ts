
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini
const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(getApiKey());
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

const KNOWLEDGE_BASE = `
ReLief is an eco-platform that helps users track, reduce, and heal their carbon footprint.

== PAGES & FEATURES ==

1. Carbon Calculator (/calculator)
   - Calculates your monthly CO₂ footprint based on:
     * Transport: distance (km) × vehicle type (Car, Bike, Bus, Train)
     * Electricity: kWh × 0.82 kg CO₂ emission factor
     * Diet: High Meat 3.3 / Average 2.5 / Vegetarian 1.7 / Vegan 1.5 kg CO₂e per day
   - Result shown in kg CO₂e per month.

2. AI Bill Scanner (/scanner)
   - Upload electricity or utility bills.
   - AI extracts kWh consumption and bill amount using OCR.
   - Automatically calculates and logs the carbon footprint for that bill.

3. Emission History (/history)
   - View a full log of all your carbon activity over time.
   - Filter by source (Bills / Activities) and category.
   - Export as CSV or PDF report.

4. Dashboard (/dashboard)
   - Overview of your total carbon footprint, karma points (balance), and recent activity.

5. Karma Points & Rewards (/rewards)
   - You earn Karma Points (KP) for logging eco-actions and activities on the platform.
   - Spend KP in the Rewards section to unlock available rewards.
   - The available rewards and their costs are shown on the /rewards page.

6. Badges (/badges)
   - Earn badges for completing milestones on the platform (e.g. first login, first bill scan, streaks).

7. Login Streak (on /profile)
   - Log in daily to maintain a login streak.
   - Your streak calendar is visible on your profile page.

8. Leaderboard (/leaderboard)
   - See how you rank against other ReLief users by total carbon reduction and karma points.

9. Community (/feed)
   - Post updates, join groups, share eco-tips with other users.
   - Trending hashtags shown on the feed.

10. Air Quality Index (/aqi)
    - Live AQI data for Indian cities.
    - Scale: 0-50 Good, 51-100 Satisfactory, 101-200 Moderate, 201-300 Poor, 301-400 Very Poor, 401+ Severe.
    - Health recommendations based on current AQI.

11. Quiz (/quiz)
    - Answer eco-awareness quizzes to earn Karma Points.

12. Profile (/profile)
    - View and manage your account, notification preferences, login streak, and badges.
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

        const errorString = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        let errorMessage = "Failed to process chat message";
        let statusCode = 500;

        if (errorString.includes("429") || errorString.includes("quota exceeded") || errorString.includes("too many requests")) {
            errorMessage = "AI chat quota exceeded. Please try again later.";
            statusCode = 429;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}
