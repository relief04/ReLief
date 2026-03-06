"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "@/app/auth.module.css";
import Link from "next/link";

export default function SignInForm() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [verifying, setVerifying] = React.useState(false);
    const [error, setError] = React.useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setVerifying(true);
        setError("");

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                router.push("/dashboard");
            } else {
                console.log(result);
                setError("Something went wrong. Please check your credentials.");
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || "Failed to sign in");
        } finally {
            setVerifying(false);
        }
    };

    const signInWithGoogle = () => {
        if (!isLoaded) return;
        signIn.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: "/sso-callback",
            redirectUrlComplete: "/dashboard",
            // @ts-ignore - Some Clerk versions use different property names for OAuth params
            additionalOAuthParameters: {
                prompt: "select_account",
            },
        });
    };

    return (
        <div className={styles.formContainer}>
            <button
                type="button"
                onClick={signInWithGoogle}
                className={styles.googleButton}
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} height={18} />
                Continue with Google
            </button>

            <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>or</span>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <div className={styles.errorAlert}>{error}</div>}

                <Button type="submit" isLoading={verifying} className={styles.submitButton}>
                    Sign In
                </Button>
            </form>

            <div className={styles.footer}>
                Don't have an account?{" "}
                <Link href="/sign-up" className={styles.link}>
                    Sign Up
                </Link>
            </div>
        </div>
    );
}
