"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "@/app/auth.module.css";
import Link from "next/link";
import { Eye, EyeOff, ChevronRight } from "lucide-react";

export default function SignUpForm() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [username, setUsername] = React.useState("");
    const [emailAddress, setEmailAddress] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [pendingVerification, setPendingVerification] = React.useState(false);
    const [code, setCode] = React.useState("");
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [googleLoading, setGoogleLoading] = React.useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        // Basic validation
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await signUp.create({
                firstName,
                lastName,
                username,
                emailAddress,
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || "Failed to sign up");
        } finally {
            setLoading(false);
        }
    };

    const onPressVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setLoading(true);
        setError("");

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId });
                router.push("/dashboard");
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2));
                setError("Verification failed. Please try again.");
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || "Failed to verify email");
        } finally {
            setLoading(false);
        }
    };

    const signUpWithGoogle = async () => {
        if (!isLoaded) return;
        setGoogleLoading(true);
        try {
            await signUp.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard",
            });
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || "Google sign up failed");
            setGoogleLoading(false);
        }
    };

    if (pendingVerification) {
        return (
            <div className={styles.formContainer}>
                <p className={styles.verificationText}>
                    A verification code has been sent to <strong>{emailAddress}</strong>.
                    Please enter it below to complete your registration.
                </p>
                <form onSubmit={onPressVerify} className={styles.form}>
                    <Input
                        label="Verification Code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="123456"
                        required
                    />
                    {error && <div className={styles.errorAlert}>{error}</div>}
                    <Button type="submit" isLoading={loading} className={styles.submitButton}>
                        Verify Email
                    </Button>
                </form>
            </div>
        );
    }

    return (
        <div className={styles.formContainer}>
            <button
                type="button"
                onClick={signUpWithGoogle}
                className={styles.googleButton}
                disabled={googleLoading || loading}
            >
                {googleLoading ? (
                    <span className={styles.spinner} />
                ) : (
                    <>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} height={18} />
                        Continue with Google
                    </>
                )}
            </button>

            <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>or</span>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.row}>
                    <div className={styles.inputWithTag}>
                        <Input
                            label="First name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="ReLief"
                        />
                        <span className={styles.optionalTag}>Optional</span>
                    </div>
                    <div className={styles.inputWithTag}>
                        <Input
                            label="Last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last name"
                        />
                        <span className={styles.optionalTag}>Optional</span>
                    </div>
                </div>

                <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="athrva417"
                    required
                />

                <Input
                    label="Email address"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="reliefearth0@gmail.com"
                    required
                />

                <div style={{ position: 'relative' }}>
                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={styles.passwordToggle}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {error && <div className={styles.errorAlert}>{error}</div>}

                <Button type="submit" isLoading={loading} className={styles.submitButton}>
                    Continue
                    <ChevronRight size={18} />
                </Button>
            </form>

            <div className={styles.footer}>
                Already have an account?{" "}
                <Link href="/sign-in" className={styles.link}>
                    Sign in
                </Link>
            </div>
        </div>
    );
}
