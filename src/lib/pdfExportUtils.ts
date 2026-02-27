import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UserData {
    name: string;
    email?: string;
}

interface CarbonData {
    totalEmissions: number;
}

interface LogEntry {
    created_at: string;
    category: string;
    description: string;
    emissions: number;
}

/**
 * Generate a comprehensive carbon summary PDF report
 */
export async function generateCarbonSummaryPDF(
    userData: UserData,
    carbonData: CarbonData,
    chartElements?: {
        timeline?: HTMLElement | null;
        category?: HTMLElement | null;
        trend?: HTMLElement | null;
    },
    logs?: LogEntry[]
): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with branding
    pdf.setFillColor(34, 197, 94); // ReLief green
    pdf.rect(0, 0, pageWidth, 30, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ReLief Carbon Report', pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Track. Reduce. Heal.', pageWidth / 2, 22, { align: 'center' });

    // Reset text color for body
    pdf.setTextColor(0, 0, 0);
    yPosition = 40;

    // User info
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Generated for:', 15, yPosition);

    pdf.setFont('helvetica', 'normal');
    yPosition += 7;
    pdf.text(userData.name, 15, yPosition);

    if (userData.email) {
        yPosition += 5;
        pdf.setFontSize(10);
        pdf.text(userData.email, 15, yPosition);
    }

    yPosition += 10;
    pdf.setFontSize(10);
    pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, yPosition);

    // Divider line
    yPosition += 7;
    pdf.setDrawColor(229, 231, 235); // Light gray
    pdf.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 10;

    // Carbon summary stats
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Carbon Footprint Summary', 15, yPosition);
    yPosition += 10;

    // Stats boxes
    const totalEntries = logs?.length ?? 0;
    const stats = [
        { label: 'Total Emissions', value: `${carbonData.totalEmissions.toFixed(2)} kg CO₂` },
        { label: 'Total Entries', value: `${totalEntries} record${totalEntries !== 1 ? 's' : ''}` },
    ];

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    stats.forEach((stat, index) => {
        const xPos = 15 + index * 90;
        const yPos = yPosition;

        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(xPos, yPos - 5, 85, 15, 2, 2, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.text(stat.label, xPos + 3, yPos);

        pdf.setFont('helvetica', 'normal');
        pdf.text(stat.value, xPos + 3, yPos + 7);
    });

    yPosition += 25;

    // Add charts if provided
    if (chartElements) {
        if (chartElements.timeline) {
            yPosition = await addChartToPDF(chartElements.timeline, pdf, yPosition, '7-Day Timeline');
        }

        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
            pdf.addPage();
            yPosition = 20;
        }

        if (chartElements.category) {
            yPosition = await addChartToPDF(chartElements.category, pdf, yPosition, 'Category Breakdown');
        }

        if (yPosition > pageHeight - 100) {
            pdf.addPage();
            yPosition = 20;
        }

        if (chartElements.trend) {
            yPosition = await addChartToPDF(chartElements.trend, pdf, yPosition, 'Monthly Trend');
        }
    }

    // ── Emission History Table ────────────────────────────────────
    if (logs && logs.length > 0) {
        if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Emission History', 15, yPosition);
        yPosition += 8;

        // Table header
        const colWidths = [30, 35, 85, 30]; // Date | Category | Description | Emissions
        const colX = [15, 45, 80, 165];
        const headers = ['Date', 'Category', 'Description', 'kg CO\u2082'];

        pdf.setFillColor(34, 197, 94);
        pdf.rect(15, yPosition - 5, 180, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        headers.forEach((h, i) => pdf.text(h, colX[i] + 1, yPosition));
        yPosition += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        let rowShade = false;

        for (const log of logs) {
            if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
                // Repeat header on new page
                pdf.setFillColor(34, 197, 94);
                pdf.rect(15, yPosition - 5, 180, 8, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                headers.forEach((h, i) => pdf.text(h, colX[i] + 1, yPosition));
                yPosition += 6;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                rowShade = false;
            }

            if (rowShade) {
                pdf.setFillColor(249, 250, 251);
                pdf.rect(15, yPosition - 4, 180, 6, 'F');
            }
            rowShade = !rowShade;

            pdf.setTextColor(30, 30, 30);
            const date = new Date(log.created_at).toLocaleDateString();
            const category = log.category === 'calculator' ? 'Carbon Footprint'
                : log.category === 'bill_upload' ? 'Bill Scan' : log.category;
            const desc = log.description?.slice(0, 55) ?? '';
            const em = log.emissions.toFixed(2);

            pdf.text(date, colX[0] + 1, yPosition);
            pdf.text(category.slice(0, 20), colX[1] + 1, yPosition);
            pdf.text(desc, colX[2] + 1, yPosition);
            pdf.text(em, colX[3] + 1, yPosition);

            // Row separator
            pdf.setDrawColor(229, 231, 235);
            pdf.line(15, yPosition + 2, 195, yPosition + 2);

            yPosition += 6;
        }
    }

    // Footer on last page
    const finalYPosition = pdf.internal.pageSize.getHeight() - 15;
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128); // Gray
    pdf.text('Generated by ReLief - Your Carbon Footprint Companion', pageWidth / 2, finalYPosition, { align: 'center' });

    // Download the PDF
    const filename = `carbon-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
}

/**
 * Add a chart element to PDF as an image
 */
async function addChartToPDF(
    chartElement: HTMLElement,
    pdf: jsPDF,
    yPosition: number,
    title: string
): Promise<number> {
    try {
        // Add chart title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, 15, yPosition);
        yPosition += 7;

        // Convert chart to canvas
        const canvas = await html2canvas(chartElement, {
            scale: 2,
            backgroundColor: '#ffffff'
        });

        // Add canvas as image to PDF
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 180; // PDF width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);

        return yPosition + imgHeight + 15; // Return new Y position
    } catch (error) {
        console.error('Error adding chart to PDF:', error);
        return yPosition + 10; // Skip if error
    }
}

/**
 * Generate a weekly summary PDF (simpler version)
 */
export async function generateWeeklySummaryPDF(
    userData: UserData,
    weekData: {
        startDate: string;
        endDate: string;
        totalEmissions: number;
        dailyAverage: number;
        improvement: number;
    }
): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header
    pdf.setFillColor(34, 197, 94);
    pdf.rect(0, 0, pageWidth, 25, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Weekly Carbon Summary', pageWidth / 2, 15, { align: 'center' });

    let yPosition = 40;

    // Date range
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${weekData.startDate} - ${weekData.endDate}`, 15, yPosition);

    yPosition += 15;

    // Stats
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total Emissions: ${weekData.totalEmissions.toFixed(2)} kg CO₂`, 15, yPosition);

    yPosition += 10;
    pdf.text(`Daily Average: ${weekData.dailyAverage.toFixed(2)} kg CO₂`, 15, yPosition);

    yPosition += 10;
    const improvementText = weekData.improvement > 0
        ? `🎉 ${weekData.improvement}% reduction from last week!`
        : `⚠️ ${Math.abs(weekData.improvement)}% increase from last week`;
    pdf.text(improvementText, 15, yPosition);

    // Download
    const filename = `weekly-summary-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
}

/**
 * Download a PDF blob
 */
export function downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
