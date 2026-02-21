import { CarbonLog } from './carbonReportUtils';

/**
 * Generate CSV string from carbon logs
 */
export function generateCarbonCSV(logs: CarbonLog[]): string {
    // CSV header
    const headers = ['Date', 'Category', 'Activity', 'CO2 Amount (kg)', 'Notes'];
    const csvRows = [headers.join(',')];

    // Add data rows
    logs.forEach((log) => {
        const row = [
            formatDateForCSV(log.created_at),
            escapeCSVField(log.category),
            escapeCSVField(log.activity),
            log.co2_amount.toFixed(2),
            escapeCSVField(log.notes || '')
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
}

/**
 * Format date for CSV (YYYY-MM-DD HH:MM:SS)
 */
function formatDateForCSV(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSVField(field: string): string {
    if (!field) return '';

    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
    }

    return field;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvString: string, filename: string): void {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Export carbon logs as CSV
 */
export function exportCarbonLogsToCSV(logs: CarbonLog[]): void {
    if (logs.length === 0) return;

    const csv = generateCarbonCSV(logs);
    const filename = `carbon-logs-${new Date().toISOString().split('T')[0]}.csv`;

    downloadCSV(csv, filename);
}

/**
 * Generate summary CSV (aggregated by category)
 */
export function generateSummaryCSV(
    categoryData: { category: string; total_co2: number; count: number }[]
): string {
    const headers = ['Category', 'Total CO2 (kg)', 'Number of Activities', 'Average CO2 per Activity (kg)'];
    const csvRows = [headers.join(',')];

    categoryData.forEach((item) => {
        const average = item.total_co2 / item.count;
        const row = [
            item.category,
            item.total_co2.toFixed(2),
            item.count.toString(),
            average.toFixed(2)
        ];
        csvRows.push(row.join(','));
    });

    // Add total row
    const totalCO2 = categoryData.reduce((sum, item) => sum + item.total_co2, 0);
    const totalCount = categoryData.reduce((sum, item) => sum + item.count, 0);
    const totalAvg = totalCount > 0 ? totalCO2 / totalCount : 0;

    csvRows.push(''); // Empty row
    csvRows.push([
        'TOTAL',
        totalCO2.toFixed(2),
        totalCount.toString(),
        totalAvg.toFixed(2)
    ].join(','));

    return csvRows.join('\n');
}

/**
 * Export category summary as CSV
 */
export function exportSummaryToCSV(
    categoryData: { category: string; total_co2: number; count: number }[]
): void {
    if (categoryData.length === 0) return;

    const csv = generateSummaryCSV(categoryData);
    const filename = `carbon-summary-${new Date().toISOString().split('T')[0]}.csv`;

    downloadCSV(csv, filename);
}
