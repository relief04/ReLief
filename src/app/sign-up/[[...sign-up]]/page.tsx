"use client";

import { AuthLayout } from "@/components/auth/AuthLayout";
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
    return (
        <AuthLayout
            title="Create your account"
            subtitle="Welcome! Please fill in the details to get started."
        >
            <SignUpForm />
        </AuthLayout>
    );
}
