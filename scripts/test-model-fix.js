
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config({ path: '.env.local' });

async function checkModels() {
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) {
        console.error("No API KEY found!");
        return;
    }

    const ai = new GoogleGenAI({ apiKey: key, httpOptions: { fetch: globalThis.fetch } });
    const modelName = "gemini-2.5-flash";

    console.log(`Testing ${modelName}...`);

    try {
        const result = await ai.models.generateContent({
            model: modelName,
            contents: 'Hello, are you online?',
        });
        console.log(`SUCCESS: ${modelName} works!`);
        console.log(`Response: ${result.text}`);
    } catch (err) {
        console.error(`FAILED: ${modelName} - ${err.message}`);
    }
}

checkModels();
