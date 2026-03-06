"use client";

import { AuthLayout } from "@/components/auth/AuthLayout";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to continue your eco-journey"
        >
            <SignInForm />
        </AuthLayout>
    );
}
