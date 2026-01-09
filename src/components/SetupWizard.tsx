"use client";

import { useState } from "react";
import { updateProviderConfig } from "@/actions/config";
import { Icons } from "@/components/Icons";
import { cn } from "@/lib/utils";

interface SetupWizardProps {
    platform: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const INSTRUCTIONS: Record<string, { title: string, steps: string[], links: { label: string, url: string }[], warnings?: string[] }> = {
    spotify: {
        title: "Spotify Setup",
        steps: [
            "Log in to the Spotify Developer Dashboard.",
            "Click 'Create App' and give it a name.",
            "Select 'Web API' when asked which API/SDKs to use.",
            "In Settings, set Redirect URI to: http://127.0.0.1:3000/api/auth/callback/spotify",
            "Also add: http://127.0.0.1:3000/callback (for PKCE flow)",
            "Copy the Client ID and Client Secret below.",
        ],
        warnings: [
            "Spotify no longer accepts 'localhost'. You MUST use 127.0.0.1.",
            "After saving, access this site via http://127.0.0.1:3000"
        ],
        links: [{ label: "Open Spotify Dashboard", url: "https://developer.spotify.com/dashboard" }]
    },
    deezer: {
        title: "Deezer Setup (ARL Cookie Method)",
        steps: [
            "Deezer closed their API to new applications.",
            "Instead, we use the 'ARL Cookie' method for authentication.",
            "Open Deezer.com in a new tab and log in.",
            "Open Developer Tools (F12 or ⌘+Option+I on Mac).",
            "Go to Application tab > Cookies > www.deezer.com.",
            "Find the cookie named 'arl' and copy its full value.",
            "Paste the 'arl' value below."
        ],
        warnings: [
            "ARL cookies expire periodically. You may need to refresh it.",
            "Keep your ARL private - it provides full access to your account."
        ],
        links: [{ label: "Open Deezer", url: "https://www.deezer.com" }]
    },
    youtube: {
        title: "YouTube Music Setup (Google OAuth)",
        steps: [
            "Step 1: Enable the YouTube Data API v3 (use link below).",
            "Step 2: Go to 'APIs & Services' > 'Credentials'.",
            "Step 3: Click 'Create Credentials' > 'OAuth Client ID'.",
            "Step 4: Select 'Web Application' as Application Type.",
            "Step 5: Add this Redirect URI: http://127.0.0.1:3000/api/auth/callback/google",
            "Step 6: Copy the Client ID and Client Secret below.",
            "Step 7: Go to 'OAuth Consent Screen' > 'Test Users' and ADD YOUR EMAIL.",
        ],
        warnings: [
            "If you see 'Access Blocked': add your email as a Test User, OR publish the app.",
            "The API must be enabled BEFORE creating credentials.",
            "Make sure the redirect URI EXACTLY matches (127.0.0.1, not localhost)."
        ],
        links: [
            { label: "1. Enable YouTube API", url: "https://console.cloud.google.com/apis/library/youtube.googleapis.com" },
            { label: "2. Create Credentials", url: "https://console.cloud.google.com/apis/credentials" },
            { label: "3. OAuth Consent Screen", url: "https://console.cloud.google.com/apis/credentials/consent" }
        ]
    },
    apple: {
        title: "Apple Music Setup (Coming Soon)",
        steps: [
            "Apple Music integration requires an Apple Developer Account ($99/year).",
            "This feature is currently in development.",
            "When ready, you'll need to:",
            "• Create a Media Identifier (MusicKit ID)",
            "• Create a Private Key for MusicKit",
            "• Generate a JWT token for API authentication"
        ],
        warnings: [
            "Full Apple Music support coming in a future update."
        ],
        links: [
            { label: "Apple Developer Portal", url: "https://developer.apple.com/account/resources/identifiers/list" },
            { label: "MusicKit Documentation", url: "https://developer.apple.com/documentation/musickitjs" }
        ]
    }
};

export function SetupWizard({ platform, isOpen, onClose, onSuccess }: SetupWizardProps) {
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    // Deezer specific
    const [arl, setArl] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Import store to save ARL
    const { setDeezerArl } = require("@/store/useMusicStore").useMusicStore();

    if (!isOpen) return null;

    const config = INSTRUCTIONS[platform] || INSTRUCTIONS.spotify;
    const Icon = Icons[platform as keyof typeof Icons] || Icons.google;

    const handleSave = async () => {
        setLoading(true);
        setError("");

        if (platform === 'deezer') {
            // Save ARL to store/localstorage
            if (!arl) {
                setError("ARL is required");
                setLoading(false);
                return;
            }
            setDeezerArl(arl);
            localStorage.setItem('deezer_arl', arl);
            onSuccess();
            onClose();
            setLoading(false);
            return;
        }

        const res = await updateProviderConfig(platform, clientId, clientSecret);

        if (res.success) {
            onSuccess();
            onClose();
            // Force reload or just alert
            alert("Configuration saved! You may need to RESTART the server terminal (Ctrl+C then npm run dev) for changes to take effect.");
        } else {
            setError(res.error || "Failed to save");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-white/10 bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{config.title}</h2>
                        <p className="text-sm text-muted-foreground">Configure access</p>
                    </div>
                </div>

                <div className="space-y-4 mb-6 text-sm text-muted-foreground bg-secondary/20 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <ol className="list-decimal list-inside space-y-1.5">
                        {config.steps.map((step, i) => (
                            <li key={i} className="leading-relaxed">{step}</li>
                        ))}
                    </ol>
                    <div className="pt-3 flex flex-wrap gap-2">
                        {config.links.map(link => (
                            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline font-medium text-xs bg-primary/10 px-2 py-1 rounded">
                                {link.label} →
                            </a>
                        ))}
                    </div>
                    {config.warnings && config.warnings.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-yellow-500/20 bg-yellow-500/5 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                            <p className="text-yellow-500 text-xs font-semibold mb-2 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Important Notes
                            </p>
                            <ul className="space-y-1">
                                {config.warnings.map((warning, i) => (
                                    <li key={i} className="text-yellow-500/90 text-xs">• {warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {platform === 'deezer' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ARL Cookie</label>
                            <input
                                type="text"
                                value={arl}
                                onChange={e => setArl(e.target.value)}
                                className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Paste ARL here..."
                            />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Client ID</label>
                                <input
                                    type="text"
                                    value={clientId}
                                    onChange={e => setClientId(e.target.value)}
                                    className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Paste Client ID here"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Client Secret</label>
                                <input
                                    type="password"
                                    value={clientSecret}
                                    onChange={e => setClientSecret(e.target.value)}
                                    className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Paste Client Secret here"
                                />
                            </div>
                        </>
                    )}
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-md transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || (platform === 'deezer' ? !arl : (!clientId || !clientSecret))}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
