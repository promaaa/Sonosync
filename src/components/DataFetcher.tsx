"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMusicStore } from "@/store/useMusicStore";
import { fetchDeezerPlaylists } from "@/actions/deezer";
import { getUserPlaylists } from "@/actions/spotify";
import { getClientSpotifyPlaylists } from "@/lib/spotify-client";
import { getUserYouTubePlaylists } from "@/actions/youtube";
import { loadAccessToken } from "@/lib/spotify-pkce";
import { Playlist } from "@/lib/types";

// Extended session type to include providerTokens
interface ProviderTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}

interface ExtendedSession {
    accessToken?: string;
    provider?: string;
    providerTokens?: Record<string, ProviderTokens>;
}

export function DataFetcher() {
    const { data: session } = useSession();
    const { setSourcePlaylists, setSourcePlatform, spotifyToken, deezerArl, setDeezerArl, setSpotifyToken } = useMusicStore();

    // Type the session
    const extSession = session as ExtendedSession | null;

    // 0. Load persisted data
    useEffect(() => {
        // Deezer
        const storedArl = localStorage.getItem('deezer_arl');
        if (storedArl) {
            setDeezerArl(storedArl);
        }

        // Spotify PKCE
        const storedSpotifyToken = loadAccessToken();
        if (storedSpotifyToken) {
            setSpotifyToken(storedSpotifyToken);
        }
    }, [setDeezerArl, setSpotifyToken]);

    useEffect(() => {
        async function loadAllData() {
            let allPlaylists: Playlist[] = [];
            const platformsFound: string[] = [];

            // 1. Fetch Spotify (PKCE Client-Side) - Preferred for Spotify
            if (spotifyToken) {
                try {
                    const playlists = await getClientSpotifyPlaylists();
                    allPlaylists = [...allPlaylists, ...playlists];
                    platformsFound.push('spotify');
                } catch (e) {
                    console.error("Failed to fetch Spotify playlists (client)", e);
                }
            }
            // Fallback: Fetch Spotify (Server-Side) if no Client Token
            else if (extSession?.providerTokens?.spotify?.accessToken || (extSession?.provider === 'spotify' && extSession.accessToken)) {
                try {
                    // Check if we didn't already fetch via PKCE
                    if (!platformsFound.includes('spotify')) {
                        const playlists = await getUserPlaylists();
                        allPlaylists = [...allPlaylists, ...playlists];
                        platformsFound.push('spotify');
                    }
                } catch (e) {
                    console.error("Failed to fetch Spotify playlists (server)", e);
                }
            }

            // 2. Fetch Deezer (ARL) - Preferred for Deezer
            if (deezerArl) {
                try {
                    const playlists = await fetchDeezerPlaylists(deezerArl);
                    allPlaylists = [...allPlaylists, ...playlists];
                    platformsFound.push('deezer');
                } catch (e) {
                    console.error("Failed to fetch Deezer playlists", e);
                }
            }

            // 3. Fetch YouTube (Server-Side)
            const googleToken = extSession?.providerTokens?.google?.accessToken ||
                (extSession?.provider === 'google' || extSession?.provider === 'youtube' ? extSession.accessToken : null);

            if (googleToken) {
                try {
                    const playlists = await getUserYouTubePlaylists(googleToken);
                    console.log(`[DataFetcher] Fetched ${playlists.length} YouTube playlists`);
                    allPlaylists = [...allPlaylists, ...playlists];
                    platformsFound.push('youtube');
                } catch (e) {
                    console.error("Failed to fetch YouTube playlists", e);
                }
            }

            // Update Store
            setSourcePlaylists(allPlaylists);

            // Set primary platform (just for initial state, though we support mixed now)
            if (platformsFound.length > 0) {
                // Keep existing source platform if it's still valid, otherwise pick the first one found
                // actually setSourcePlatform might be less relevant for "All", but let's keep it consistent
                setSourcePlatform(platformsFound[0] as any);
            }
        }

        if (spotifyToken || deezerArl || extSession?.accessToken || extSession?.providerTokens) {
            loadAllData();
        }
    }, [session, spotifyToken, deezerArl, setSourcePlaylists, setSourcePlatform, extSession]);

    return null;
}

