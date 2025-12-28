"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCodeForToken } from "@/lib/spotify-pkce";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    useEffect(() => {
        if (error) {
            console.error("Spotify Auth Error:", error);
            router.push("/?error=spotify_auth_failed");
            return;
        }

        if (code) {
            exchangeCodeForToken(code)
                .then(() => {
                    // Success! Redirect home
                    router.push("/");
                })
                .catch((err) => {
                    console.error("Token exchange failed:", err);
                    router.push("/?error=token_exchange_failed");
                });
        } else {
            // access denied or no code
            router.push("/");
        }
    }, [code, error, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Connecting to Spotify...</h2>
                <p className="text-muted-foreground">Please wait while we complete the secure connection.</p>
            </div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
