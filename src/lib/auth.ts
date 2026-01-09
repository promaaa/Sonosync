import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import type { JWT } from "next-auth/jwt";

// Define scopes for Spotify
const spotifyScopes = [
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
].join(" ");

// Google/YouTube scopes for YouTube Music access
const googleScopes = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

// Custom Deezer OAuth provider (Note: Deezer closed API to new apps, ARL method preferred)
const DeezerProvider = {
    id: "deezer",
    name: "Deezer",
    type: "oauth" as const,
    authorization: {
        url: "https://connect.deezer.com/oauth/auth.php",
        params: {
            perms: "basic_access,email,manage_library,delete_library,listening_history",
            app_id: process.env.DEEZER_CLIENT_ID,
        }
    },
    token: {
        url: "https://connect.deezer.com/oauth/access_token.php",
        async request({ params, provider }: any) {
            // Deezer uses non-standard token exchange
            const response = await fetch(`https://connect.deezer.com/oauth/access_token.php?app_id=${provider.clientId}&secret=${provider.clientSecret}&code=${params.code}&output=json`);
            const text = await response.text();
            try {
                const json = JSON.parse(text);
                return { tokens: { access_token: json.access_token, expires_in: json.expires } };
            } catch {
                // Deezer sometimes returns URL-encoded format
                const parsed = new URLSearchParams(text);
                return { tokens: { access_token: parsed.get('access_token'), expires_in: parsed.get('expires') } };
            }
        }
    },
    userinfo: {
        url: "https://api.deezer.com/user/me",
        async request({ tokens }: any) {
            const response = await fetch(`https://api.deezer.com/user/me?access_token=${tokens.access_token}`);
            return await response.json();
        }
    },
    clientId: process.env.DEEZER_CLIENT_ID || "",
    clientSecret: process.env.DEEZER_CLIENT_SECRET || "",
    profile(profile: any) {
        return {
            id: String(profile.id),
            name: profile.name,
            email: profile.email,
            image: profile.picture_medium || profile.picture,
        }
    },
};

// Extended token type for multi-provider support
interface ProviderTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}

interface ExtendedToken extends JWT {
    provider?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    // Store tokens per provider
    providerTokens?: Record<string, ProviderTokens>;
    [key: string]: unknown;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    basePath: "/api/auth",
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            authorization: {
                params: { scope: spotifyScopes },
            },
        }),
        DeezerProvider,
        // Apple Music provider (requires Apple Developer Account)
        ...(process.env.APPLE_ID && process.env.APPLE_SECRET && process.env.APPLE_ID !== "mock_apple_id" ? [
            AppleProvider({
                clientId: process.env.APPLE_ID,
                clientSecret: process.env.APPLE_SECRET,
            })
        ] : []),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "", // FIXED: was using GOOGLE_CLIENT_ID
            authorization: {
                params: {
                    scope: googleScopes,
                    access_type: "offline",
                    prompt: "consent",
                    include_granted_scopes: true,
                }
            },
        })
    ],
    callbacks: {
        async jwt({ token, account }) {
            const extToken = token as ExtendedToken;

            if (account) {
                // Initialize providerTokens if not exists
                if (!extToken.providerTokens) {
                    extToken.providerTokens = {};
                }

                // Store tokens for this specific provider
                extToken.providerTokens[account.provider] = {
                    accessToken: account.access_token!,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at,
                };

                // Also set current provider info for backward compatibility
                extToken.accessToken = account.access_token;
                extToken.refreshToken = account.refresh_token;
                extToken.expiresAt = account.expires_at;
                extToken.provider = account.provider;
            }
            return extToken;
        },
        async session({ session, token }: any) {
            const extToken = token as ExtendedToken;

            // Add current provider info
            session.accessToken = extToken.accessToken;
            session.provider = extToken.provider;

            // Add all provider tokens for multi-platform support
            session.providerTokens = extToken.providerTokens || {};

            return session;
        },
    },
    pages: {
        error: '/auth/error', // Custom error page
    },
    debug: process.env.NODE_ENV === 'development',
    // In NextAuth v5, when AUTH_URL/NEXTAUTH_URL is set, it overrides the detected host
    // trustHost: true is required for development (non-HTTPS)
    trustHost: true,
    secret: process.env.AUTH_SECRET,
});
