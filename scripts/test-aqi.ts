import { getAQIData } from '../src/lib/aqi';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    try {
        console.log("Testing Pune...");
        const res = await getAQIData('Pune');
        console.log(JSON.stringify(res, null, 2));

        console.log("\nTesting Delhi...");
        const res2 = await getAQIData('Delhi');
        console.log(JSON.stringify(res2, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
