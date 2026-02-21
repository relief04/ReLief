/**
 * API client for ML Bill Scanning Service
 */

export interface BillScanResult {
    success: boolean;
    bill_type: string;
    extracted_data: {
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
    };
    carbon_emissions: number;
    comparisons?: {
        driving_km: number;
        trees_monthly: number;
        smartphone_charges: number;
    };
    confidence: number;
    processing_time_ms: number;
    message?: string;
    emission_factor?: number;
}


// Use local API route for scanning
const SCAN_API_ENDPOINT = '/api/ai/scan';

/**
 * Scan a bill image and extract carbon data
 */
export async function scanBill(
    file: File,
    billType?: 'electricity' | 'lpg' | 'shopping'
): Promise<BillScanResult> {
    const formData = new FormData();
    formData.append('file', file);

    if (billType) {
        formData.append('bill_type', billType);
    }

    const response = await fetch('/api/ai/scan', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.detail || 'Failed to scan bill');
    }

    return await response.json();
}

/**
 * Check if AI scanning is available (Node.js endpoint)
 */
export async function checkMLServiceHealth(): Promise<boolean> {
    try {
        const response = await fetch(SCAN_API_ENDPOINT, {
            method: 'OPTIONS', // Just check if the route exists/is reachable
        });
        return response.ok || response.status === 405; // 405 means route exists but doesn't like OPTIONS
    } catch (error) {
        return false;
    }
}
