
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) {
        console.error("No API KEY found!");
        return;
    }
    const ai = new GoogleGenAI({ apiKey: key, httpOptions: { fetch: globalThis.fetch } });

    const models = ['gemini-2.0-flash', 'gemini-2.5-flash'];

    for (const modelName of models) {
        console.log(`\nTesting ${modelName}...`);
        try {
            const result = await ai.models.generateContent({
                model: modelName,
                contents: 'Hello',
            });
            console.log(`SUCCESS: ${modelName} works! Response: ${result.text?.slice(0, 80)}`);
        } catch (error) {
            console.error(`FAILED: ${modelName} - ${error.message}`);
        }
    }
}

listModels();
