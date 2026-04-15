
import { GoogleGenAI } from '@google/genai';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

if (!geminiKey) {
    console.error('Missing Gemini Key');
    process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ai = new GoogleGenAI({ apiKey: geminiKey!, httpOptions: { fetch: globalThis.fetch } as any });

async function test() {
    console.log('--- Testing REST API (v1) ---');
    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${geminiKey}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: { parts: [{ text: "test" }] } })
        });
        const data = await resp.json() as any;
        if (data.embedding) console.log('v1 SUCCESS!');
        else console.log('v1 FAILED:', JSON.stringify(data));
    } catch (e: any) {
        console.log('v1 ERROR:', e.message);
    }

    console.log('\n--- Testing Library (@google/genai) ---');
    try {
        const result = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: 'test',
        });
        console.log('Library SUCCESS! Embedding length:', result.embeddings?.[0]?.values?.length);
    } catch (e: any) {
        console.log('Library FAILED:', e.message);
    }
}

test();
