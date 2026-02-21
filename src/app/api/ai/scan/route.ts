import { NextRequest, NextResponse } from "next/server";
import { scanBillWithGemini } from "@/lib/ai-scanner";
import { sendBillProcessedEmail } from "@/lib/email";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const billType = formData.get("bill_type") as string;
        const userId = formData.get("userId") as string;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Process with Gemini
        const result = await scanBillWithGemini(
            buffer,
            file.type,
            billType
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.message || "Failed to process bill" },
                { status: 500 }
            );
        }

        // Determine bill type: prefer Gemini's own detection, then user hint, then infer from fields
        const rawBillType = result.bill_type?.toLowerCase();
        let detectedBillType: string;

        if (rawBillType && rawBillType !== 'unknown') {
            detectedBillType = rawBillType;
        } else if (billType) {
            detectedBillType = billType;
        } else if (result.fields.units_consumed !== undefined && result.fields.units_consumed !== null) {
            detectedBillType = 'electricity';
        } else if (result.fields.cylinder_weight !== undefined && result.fields.cylinder_weight !== null) {
            detectedBillType = 'lpg';
        } else if (result.fields.total_amount !== undefined) {
            detectedBillType = 'shopping';
        } else {
            detectedBillType = 'unknown';
        }

        let carbonEmissions = 0;
        let emissionFactor = 0;

        if (detectedBillType === 'electricity') {
            emissionFactor = 0.82;
            const units = result.fields.units_consumed;
            if (units && units > 0) {
                carbonEmissions = parseFloat((units * emissionFactor).toFixed(2));
            } else {
                const billAmount = result.fields.amount || result.fields.total_amount || 0;
                if (billAmount > 0) {
                    const estimatedUnits = billAmount / 8;
                    carbonEmissions = parseFloat((estimatedUnits * emissionFactor).toFixed(2));
                }
            }
        } else if (detectedBillType === 'lpg') {
            const weight = result.fields.cylinder_weight || 14.2;
            emissionFactor = 2.98;
            carbonEmissions = parseFloat((weight * emissionFactor).toFixed(2));
        } else {
            const amount = result.fields.total_amount || result.fields.amount || 0;
            emissionFactor = 0.005; // per Rupee
            carbonEmissions = parseFloat((amount * emissionFactor).toFixed(2));
        }

        // FIRE AND FORGET NOTIFICATIONS
        if (userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, username')
                .eq('id', userId)
                .single();

            if (profile?.email) {
                const userName = profile.username || 'Eco Warrior';
                const units = result.fields.units_consumed || result.fields.cylinder_weight || 1;

                sendBillProcessedEmail(
                    profile.email,
                    userName,
                    units,
                    carbonEmissions,
                    detectedBillType
                ).catch((err) => console.error("Failed to send bill processed email:", err));
            }
        }

        // Prepare response in the format expected by the frontend
        return NextResponse.json({
            success: true,
            bill_type: detectedBillType,
            extracted_data: result.fields,
            carbon_emissions: carbonEmissions,
            emission_factor: emissionFactor,
            confidence: result.confidence,
            processing_time_ms: 0,
            message: result.message
        });

    } catch (error) {
        console.error("Scan API Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
