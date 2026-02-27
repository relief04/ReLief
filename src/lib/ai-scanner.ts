import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
 * Converts a File or Buffer to a Google Generative AI part (base64)
 */
async function fileToGenerativePart(file: Uint8Array, mimeType: string) {
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
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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

        const imagePart = await fileToGenerativePart(fileBuffer, mimeType);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim();

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
                message: "Successfully extracted data using Gemini."
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
        console.error("Gemini Scan Error:", error);
        return {
            success: false,
            bill_type: "unknown",
            fields: {},
            confidence: 0,
            message: error instanceof Error ? error.message : "An error occurred during AI scanning."
        };
    }
}
