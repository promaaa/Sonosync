"use server";

import { auth } from "@/lib/auth";
import { SpotifyProvider } from "@/lib/providers/SpotifyProvider";
import { matchTracks } from "@/lib/matcher";
import { Playlist, Platform, Track } from "@/lib/types";

import { createDeezerPlaylist, searchDeezerTrack, addTracksToDeezerPlaylist, getDeezerPlaylistTracks } from "./deezer";
import { createYouTubePlaylist, searchYouTubeTrack, addTracksToYouTubePlaylist, getYouTubePlaylistTracks } from "./youtube";

// Extended session type for multi-provider support
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

// Helper to get the appropriate token for a platform
function getTokenForPlatform(
    platform: Platform,
    session: ExtendedSession | null,
    clientSpotifyToken?: string
): string | null {
    // Client-side PKCE token for Spotify takes priority
    if (platform === 'spotify' && clientSpotifyToken) {
        return clientSpotifyToken;
    }

    // Check multi-provider tokens first (new system)
    if (session?.providerTokens) {
        if (platform === 'spotify' && session.providerTokens.spotify?.accessToken) {
            return session.providerTokens.spotify.accessToken;
        }
        if (platform === 'youtube' && session.providerTokens.google?.accessToken) {
            return session.providerTokens.google.accessToken;
        }
        if (platform === 'deezer' && session.providerTokens.deezer?.accessToken) {
            return session.providerTokens.deezer.accessToken;
        }
        if (platform === 'apple' && session.providerTokens.apple?.accessToken) {
            return session.providerTokens.apple.accessToken;
        }
    }

    // Fallback to legacy single-provider session
    if (session?.accessToken) {
        if (platform === 'spotify' && session.provider === 'spotify') {
            return session.accessToken;
        }
        if (platform === 'youtube' && (session.provider === 'google' || session.provider === 'youtube')) {
            return session.accessToken;
        }
        if (platform === 'deezer' && session.provider === 'deezer') {
            return session.accessToken;
        }
    }

    return null;
}

export async function transferPlaylist(
    sourcePlaylistId: string,
    sourcePlatform: Platform,
    destinationPlatform: Platform,
    playlistName: string,
    accessToken?: string,
    deezerArl?: string
) {
    const session = await auth() as ExtendedSession | null;

    // Get tokens for both source and destination platforms
    const sourceToken = getTokenForPlatform(sourcePlatform, session, accessToken);
    const destToken = getTokenForPlatform(destinationPlatform, session, accessToken);

    let tracks: Track[] = [];

    // 1. Fetch Source Tracks
    if (sourcePlatform === 'spotify') {
        if (!sourceToken) throw new Error("Missing Spotify Access Token for Source. Please connect Spotify first.");

        const sourceProvider = new SpotifyProvider(sourceToken);
        tracks = await sourceProvider.getPlaylistTracks(sourcePlaylistId);

    } else if (sourcePlatform === 'deezer') {
        if (!deezerArl) throw new Error("Missing Deezer ARL for Source. Please configure Deezer (ARL cookie method).");
        tracks = await getDeezerPlaylistTracks(deezerArl, sourcePlaylistId);

    } else if (sourcePlatform === 'youtube') {
        if (!sourceToken) throw new Error("Missing Google Access Token for Source. Please sign in with Google.");

        tracks = await getYouTubePlaylistTracks(sourceToken, sourcePlaylistId);
    } else {
        throw new Error(`Source Platform ${sourcePlatform} not supported yet.`);
    }

    console.log(`[Transfer] Fetched ${tracks.length} tracks from ${sourcePlatform}`);

    // 2. Destination Logic
    if (destinationPlatform === 'deezer') {
        if (!deezerArl) throw new Error("Deezer ARL missing for destination. Please configure Deezer (ARL cookie method).");

        const matchedIds: string[] = [];
        for (const track of tracks) {
            let found = null;
            // Try ISRC first (most accurate)
            if (track.isrc) {
                found = await searchDeezerTrack(deezerArl, `isrc:${track.isrc}`);
            }
            // Fallback to artist + title search
            if (!found) {
                found = await searchDeezerTrack(deezerArl, `artist:"${track.artist}" track:"${track.title}"`);
            }
            // Simpler fallback
            if (!found) {
                found = await searchDeezerTrack(deezerArl, `${track.artist} ${track.title}`);
            }

            if (found) {
                matchedIds.push(found.id);
            }
        }

        console.log(`[Transfer] Matched ${matchedIds.length}/${tracks.length} tracks for Deezer`);

        const newId = await createDeezerPlaylist(deezerArl, `${playlistName} (Transfer)`, "Transferred via SonoSync");

        if (matchedIds.length > 0) {
            const chunkSize = 50;
            for (let i = 0; i < matchedIds.length; i += chunkSize) {
                const chunk = matchedIds.slice(i, i + chunkSize);
                await addTracksToDeezerPlaylist(deezerArl, newId, chunk);
            }
        }

        return { success: true, newPlaylistId: newId, matchCount: matchedIds.length, total: tracks.length };

    } else if (destinationPlatform === 'youtube') {
        if (!destToken) {
            throw new Error("Not authenticated with YouTube/Google. Please sign in with Google.");
        }

        const matchedIds: string[] = [];
        for (const track of tracks) {
            const query = `${track.artist} - ${track.title}`;
            const found = await searchYouTubeTrack(destToken, query);

            if (found) {
                matchedIds.push(found.id);
            }
        }

        console.log(`[Transfer] Matched ${matchedIds.length}/${tracks.length} tracks for YouTube`);

        const newId = await createYouTubePlaylist(destToken, `${playlistName} (Transfer)`, "Transferred via SonoSync");

        if (matchedIds.length > 0) {
            await addTracksToYouTubePlaylist(destToken, newId, matchedIds);
        }

        return { success: true, newPlaylistId: newId, matchCount: matchedIds.length, total: tracks.length };

    } else if (destinationPlatform === 'spotify') {
        if (!destToken) throw new Error("Missing Spotify Access Token for Destination. Please connect Spotify first.");

        const destProvider = new SpotifyProvider(destToken);

        const matches = await matchTracks(tracks, destProvider);
        const idsToAdd = matches.filter(m => m.destination).map(m => m.destination!.id);

        console.log(`[Transfer] Matched ${idsToAdd.length}/${tracks.length} tracks for Spotify`);

        const newPlaylistId = await destProvider.createPlaylist(
            `${playlistName} (Transfer)`,
            `Transferred from ${sourcePlatform} via SonoSync.`
        );

        if (idsToAdd.length > 0) {
            await destProvider.addTracksToPlaylist(newPlaylistId, idsToAdd);
        }

        return { success: true, newPlaylistId: newPlaylistId, matchCount: idsToAdd.length, total: tracks.length };

    } else if (destinationPlatform === 'apple') {
        throw new Error("Apple Music transfer is not yet implemented. Please check back soon!");

    } else {
        throw new Error(`Provider ${destinationPlatform} not implemented yet.`);
    }
}

