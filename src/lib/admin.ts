// Central admin configuration
// Add email addresses here to grant full admin access to the site.

export const ADMIN_EMAILS = [
    'reliefearth0@gmail.com',
];

/**
 * Returns true if the given email belongs to a site admin.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
