
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) {
        console.error("No API KEY found!");
        return;
    }
    const genAI = new GoogleGenerativeAI(key);

    // Test gemini-pro (should work for everyone)
    console.log("\nTesting gemini-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log(`SUCCESS: gemini-pro works!`);
    } catch (error) {
        console.error(`FAILED: gemini-pro - ${error.message}`);
    }

    // Test gemini-1.5-flash-001 (specific version)
    console.log("\nTesting gemini-1.5-flash-001...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Hello");
        console.log(`SUCCESS: gemini-1.5-flash-001 works!`);
    } catch (error) {
        console.error(`FAILED: gemini-1.5-flash-001 - ${error.message}`);
    }

    // Test gemini-pro-vision (legacy multimodal)
    // We can't easily test it without an image, but if gemini-pro works, this likely exists.
}

listModels();
