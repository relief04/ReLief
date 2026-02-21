export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash?: string; // In a real app, never store plain text, but for this mock we still assume hash
    avatar?: string;
    joinedDate: string;
    carbonSaved: number;
    carbonTotal: number;
    streak: number;
    balance: number;
}

export interface Session {
    id: string;
    userId: string;
    expiresAt: string;
}
