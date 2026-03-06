/**
 * Formats a date string or Date object into "DD - MM - YYYY" format.
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day} - ${month} - ${year}`;
}

/**
 * Formats a date string or Date object into "DD - MM - YYYY • HH:MM" format.
 * Useful for history entries with time.
 * @param date - The date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} - ${month} - ${year} • ${hours}:${minutes}`;
}
