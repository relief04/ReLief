
import { GoogleGenAI } from '@google/genai';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

if (!geminiKey) {
    console.error('Missing Gemini Key');
    process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ai = new GoogleGenAI({ apiKey: geminiKey, httpOptions: { fetch: globalThis.fetch } as any });

async function test() {
    console.log('Testing gemini-2.5-flash...');
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hi',
        });
        console.log('Success:', result.text);
        fs.writeFileSync('test-log.json', JSON.stringify({ success: true, text: result.text }));
    } catch (e: any) {
        console.log('Failed:', e.message);
        fs.writeFileSync('test-log.json', JSON.stringify({ success: false, message: e.message, stack: e.stack, details: e }, null, 2));
    }
}

test();
