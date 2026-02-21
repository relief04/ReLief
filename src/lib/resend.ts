import { Resend } from 'resend';

// Only initialize Resend if the API key exists and we are on the server
// This prevents crashes in client-side Next.js components that might transitively import files that import this
const apiKey = process.env.RESEND_API_KEY;
export const resend = apiKey ? new Resend(apiKey) : null;
