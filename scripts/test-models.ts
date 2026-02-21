
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

if (!geminiKey) {
    console.error('Missing Gemini Key');
    process.exit(1);
}

async function test() {
    console.log('--- Testing REST API (v1) ---');
    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${geminiKey}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: { parts: [{ text: "test" }] } })
        });
        const data = await resp.json();
        if (data.embedding) console.log('v1 SUCCESS!');
        else console.log('v1 FAILED:', JSON.stringify(data));
    } catch (e: any) {
        console.log('v1 ERROR:', e.message);
    }

    console.log('\n--- Testing Library (@google/generative-ai) ---');
    const genAI = new GoogleGenerativeAI(geminiKey!);
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const res = await model.embedContent("test");
        console.log('Library SUCCESS!');
    } catch (e: any) {
        console.log('Library FAILED:', e.message);
    }
}

test();
