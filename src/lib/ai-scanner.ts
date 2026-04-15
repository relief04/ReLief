import { GoogleGenAI } from "@google/genai";

// We will fetch keys dynamically in the function
// Add multiple keys in .env.local: GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.

export interface ExtractedBillData {
    units_consumed?: number;
    bill_date?: string;
    bill_number?: string;
    provider?: string;
    amount?: number;
    cylinder_weight?: number;
    refill_date?: string;
    total_amount?: number;
    purchase_date?: string;
    item_count?: number;
}

export interface ScanResponse {
    success: boolean;
    bill_type: string;
    fields: ExtractedBillData;
    confidence: number;
    message?: string;
}

/**
 * Converts a Uint8Array to a Google GenAI inline data part (base64)
 */
function fileToInlinePart(file: Uint8Array, mimeType: string) {
    return {
        inlineData: {
            data: Buffer.from(file).toString("base64"),
            mimeType,
        },
    };
}

/**
 * Main function to scan a bill using Gemini Multimodal
 */
export async function scanBillWithGemini(
    fileBuffer: Uint8Array,
    mimeType: string,
    billTypeHint?: string
): Promise<ScanResponse> {
    // 1. Gather all available Gemini API Keys
    const keys: string[] = [];
    if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);

    // Check for indexed keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
    for (let i = 1; i <= 10; i++) {
        const key = process.env[`GEMINI_API_KEY_${i}`];
        if (key && !keys.includes(key)) {
            keys.push(key);
        }
    }

    if (keys.length === 0) {
        return {
            success: false,
            bill_type: "unknown",
            fields: {},
            confidence: 0,
            message: "No Gemini API keys configured. Please add GEMINI_API_KEY to your environment variables."
        };
    }

    const prompt = `
      You are a bill data extraction AI. Analyze this bill image carefully.
      The document may be in English, Hindi, or Marathi.

      ${billTypeHint ? `The user has indicated this is a "${billTypeHint}" bill. Use this as a strong hint.` : 'Identify the bill type from the image content.'}

      Return ONLY a valid JSON object (no markdown, no code blocks, no extra text).

      The JSON MUST always include these fields:
      - "bill_type": one of "electricity", "lpg", or "shopping" (required, always include this)
      - "confidence": a number from 0.0 to 1.0 representing your extraction confidence

      Additionally include these fields based on bill_type:
      - If "electricity": "units_consumed" (number, kWh), "bill_date" (YYYY-MM-DD string), "bill_number" (string), "amount" (number in INR), "provider" (string)
      - If "lpg": "cylinder_weight" (number in kg), "refill_date" (YYYY-MM-DD string), "provider" (string), "total_amount" (number in INR)
      - If "shopping": "total_amount" (number in INR), "purchase_date" (YYYY-MM-DD string), "item_count" (number)

      IMPORTANT: For electricity bills, "units_consumed" must be the kWh reading (e.g. 120), NOT the bill amount in rupees.
      If you cannot find units_consumed for electricity, set it to null and include "amount" (total bill amount in INR) instead.

      Example for electricity:
      {"bill_type":"electricity","units_consumed":120,"bill_date":"2024-01-15","bill_number":"EL123","amount":960,"provider":"MSEB","confidence":0.95}
    `;

    const imagePart = fileToInlinePart(fileBuffer, mimeType);

    // Models to try in order of preference (most available first)
    const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash-latest"];

    // 2. Loop through keys and models until success or exhaustion
    let lastError: any = null;

    for (let i = 0; i < keys.length; i++) {
        const currentKey = keys[i];

        for (let m = 0; m < MODELS.length; m++) {
            const modelName = MODELS[m];
            console.log(`[AI-Scanner] Attempting scan with Key ${i + 1}/${keys.length}, Model: ${modelName}`);

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const genAI = new GoogleGenAI({
                    apiKey: currentKey,
                    httpOptions: { fetch: globalThis.fetch, apiVersion: 'v1' } as any,
                });

                const result = await genAI.models.generateContent({
                    model: modelName,
                    contents: [
                        { role: 'user', parts: [{ text: prompt }, imagePart] },
                    ],
                });
                const text = (result.text ?? '').trim();

                // Clean up potential markdown code blocks
                let jsonText = text;
                if (jsonText.startsWith("```json")) {
                    jsonText = jsonText.replace(/^```json/, "");
                }
                if (jsonText.startsWith("```")) {
                    jsonText = jsonText.replace(/^```/, "");
                }
                if (jsonText.endsWith("```")) {
                    jsonText = jsonText.replace(/```$/, "");
                }

                try {
                    const data = JSON.parse(jsonText.trim());
                    return {
                        success: true,
                        bill_type: data.bill_type || billTypeHint || "unknown",
                        fields: data,
                        confidence: data.confidence || 0.9,
                        message: `Successfully extracted data using Gemini (${modelName}).`
                    };
                } catch (parseError) {
                    console.error("Failed to parse Gemini response as JSON:", text);
                    return {
                        success: false,
                        bill_type: "unknown",
                        fields: {},
                        confidence: 0,
                        message: "Failed to parse AI response. The document might be unclear."
                    };
                }
            } catch (error) {
                console.error(`Gemini Scan Error (Key ${i + 1}, Model ${modelName}):`, error);
                lastError = error;

                const errorString = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

                // If it's a quota/rate limit or service unavailable error, try next model/key
                if (
                    errorString.includes("429") ||
                    errorString.includes("503") ||
                    errorString.includes("service unavailable") ||
                    errorString.includes("high demand") ||
                    errorString.includes("quota exceeded") ||
                    errorString.includes("too many requests") ||
                    errorString.includes("overloaded")
                ) {
                    console.warn(`[AI-Scanner] Model ${modelName} unavailable (Key ${i + 1}). Trying next...`);
                    continue;
                }

                // If it's another type of error (e.g. invalid image), break model loop since other models will likely fail too
                break;
            }
        }
    }

    // 3. Extracted data failed for all keys or encountered a critical error
    let errorMessage = "An error occurred during AI scanning.";
    if (lastError) {
        const errorString = lastError instanceof Error ? lastError.message.toLowerCase() : String(lastError).toLowerCase();
        if (errorString.includes("429") || errorString.includes("quota exceeded") || errorString.includes("too many requests")) {
            errorMessage = "All AI scanning quotas exceeded. Please try again later or add more API keys.";
        } else if (lastError instanceof Error) {
            errorMessage = lastError.message;
        }
    }

    return {
        success: false,
        bill_type: "unknown",
        fields: {},
        confidence: 0,
        message: errorMessage
    };
}
