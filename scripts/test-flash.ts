
import { GoogleGenerativeAI } from '@google/generative-ai';
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

const genAI = new GoogleGenerativeAI(geminiKey);

async function test() {
    console.log('Testing gemini-2.5-flash...');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent('Hi');
        console.log('Success:', result.response.text());
        fs.writeFileSync('test-log.json', JSON.stringify({ success: true, text: result.response.text() }));
    } catch (e: any) {
        console.log('Failed:', e.message);
        fs.writeFileSync('test-log.json', JSON.stringify({ success: false, message: e.message, stack: e.stack, details: e }, null, 2));
    }
}

test();
