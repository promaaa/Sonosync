"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, { title: string; description: string; solutions: string[] }> = {
    Configuration: {
        title: "Configuration Error",
        description: "The OAuth provider is not correctly configured.",
        solutions: [
            "Make sure you have added the correct Client ID and Client Secret",
            "Verify the redirect URIs in your provider's dashboard match: http://127.0.0.1:3000/api/auth/callback/{provider}",
            "Restart the development server after making changes to .env.local",
        ]
    },
    AccessDenied: {
        title: "Access Denied",
        description: "You don't have permission to access this resource.",
        solutions: [
            "For Google: Make sure you're added as a Test User in the OAuth Consent Screen",
            "Or publish your Google OAuth app to allow all users",
            "Check that you've granted all requested permissions",
        ]
    },
    Verification: {
        title: "Verification Error",
        description: "The OAuth state/token could not be verified.",
        solutions: [
            "Make sure you're accessing the app via http://127.0.0.1:3000 (not localhost)",
            "Clear your browser cookies and try again",
            "The OAuth flow may have expired - try signing in again",
        ]
    },
    OAuthSignin: {
        title: "OAuth Sign-in Error",
        description: "There was a problem starting the OAuth flow.",
        solutions: [
            "Check that your Client ID is correct",
            "Verify the provider is enabled in your configuration",
            "Make sure you have an internet connection",
        ]
    },
    OAuthCallback: {
        title: "OAuth Callback Error",
        description: "There was a problem processing the OAuth response.",
        solutions: [
            "Verify the Client Secret is correct",
            "Check that the redirect URI exactly matches your provider settings",
            "The authorization code may have expired - try again",
        ]
    },
    OAuthCreateAccount: {
        title: "Account Creation Error",
        description: "Could not create an account with the OAuth provider.",
        solutions: [
            "This can happen if your account doesn't have a verified email",
            "Try signing in with a different account",
        ]
    },
    EmailCreateAccount: {
        title: "Email Account Error",
        description: "Could not create an email account.",
        solutions: [
            "Check that this email isn't already registered",
            "Try with a different email address",
        ]
    },
    Callback: {
        title: "Callback Error",
        description: "There was a problem with the authentication callback.",
        solutions: [
            "This may be a temporary issue - try again",
            "Clear cookies and try signing in again",
            "Check the server logs for more details",
        ]
    },
    OAuthAccountNotLinked: {
        title: "Account Not Linked",
        description: "This email is already associated with another account.",
        solutions: [
            "Try signing in with the provider you originally used",
            "Contact support if you need to link accounts",
        ]
    },
    Default: {
        title: "Authentication Error",
        description: "An unexpected error occurred during authentication.",
        solutions: [
            "Try signing in again",
            "Clear your browser cookies",
            "Check if the provider's service is available",
            "Review the console/server logs for more details",
        ]
    }
};

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error") || "Default";

    const errorInfo = ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-xl">
                {/* Error Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg
                        className="w-8 h-8 text-destructive"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Error Title */}
                <h1 className="text-2xl font-bold text-center mb-2 text-foreground">
                    {errorInfo.title}
                </h1>

                {/* Error Description */}
                <p className="text-muted-foreground text-center mb-6">
                    {errorInfo.description}
                </p>

                {/* Error Code */}
                <div className="bg-secondary/30 rounded-md px-3 py-2 mb-6 text-center">
                    <span className="text-xs font-mono text-muted-foreground">
                        Error Code: <span className="text-foreground">{error}</span>
                    </span>
                </div>

                {/* Solutions */}
                <div className="mb-8">
                    <h2 className="text-sm font-semibold text-foreground mb-3">
                        Possible Solutions:
                    </h2>
                    <ul className="space-y-2">
                        {errorInfo.solutions.map((solution, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                                <span className="text-primary mt-0.5">•</span>
                                {solution}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Link
                        href="/"
                        className="w-full py-2 px-4 bg-primary text-primary-foreground text-center rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                        Back to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full py-2 px-4 border border-border text-foreground text-center rounded-md font-medium hover:bg-secondary transition-colors"
                    >
                        Go Back
                    </button>
                </div>

                {/* Help Text */}
                <p className="text-xs text-muted-foreground text-center mt-6">
                    If problems persist, check the{" "}
                    <a
                        href="https://github.com/promaaa/sonosync#troubleshooting"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        troubleshooting guide
                    </a>
                </p>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
