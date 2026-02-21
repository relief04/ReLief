
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function checkModels() {
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) {
        console.error("No API KEY found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    const modelName = "gemini-2.5-flash";

    console.log(`Testing ${modelName}...`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you online?");
        console.log(`SUCCESS: ${modelName} works!`);
        console.log(`Response: ${result.response.text()}`);
    } catch (err) {
        console.error(`FAILED: ${modelName} - ${err.message}`);
    }
}

checkModels();
