"use server";

import { auth } from "@/lib/auth";
import { SpotifyProvider } from "@/lib/providers/SpotifyProvider";
import { matchTracks } from "@/lib/matcher";
import { Playlist, Platform } from "@/lib/types";

export async function transferPlaylist(
    sourcePlaylistId: string,
    destinationPlatform: Platform,
    accessToken?: string
) {
    const session = await auth();
    // Prioritize passed token (Client PKCE), then Session Token (NextAuth)
    const token = accessToken || session?.accessToken;

    if (!token) {
        throw new Error("Not authenticated");
    }

    // initialize providers
    // In a real app, we'd look up the specific provider for the destination
    // For this demo, we assume Spotify is both Source and Destination if selected
    // OR we'd throw if keys aren't present.

    // Hack: Use SpotifyProvider for everything for demo purposes 
    // until other providers are implemented with keys

    if (destinationPlatform !== 'spotify') {
        throw new Error(`Provider ${destinationPlatform} not configured yet. Please configure keys.`);
    }

    const spotify = new SpotifyProvider(token as string);

    // 1. Get Source Tracks
    const tracks = await spotify.getPlaylistTracks(sourcePlaylistId);
    const sourcePlaylist = (await spotify.getUserPlaylists()).find(p => p.id === sourcePlaylistId);

    // 2. Match
    // Destination provider is also spotify here
    const matches = await matchTracks(tracks, spotify);

    const idsToAdd = matches
        .filter(m => m.destination)
        .map(m => m.destination!.id);

    // 3. Create Playlist
    const newPlaylistId = await spotify.createPlaylist(
        `${sourcePlaylist?.name} (Transfer)`,
        `Transferred from Spotify via SonoSync.`
    );

    // 4. Add Tracks
    if (idsToAdd.length > 0) {
        await spotify.addTracksToPlaylist(newPlaylistId, idsToAdd);
    }

    return { success: true, newPlaylistId, matchCount: idsToAdd.length, total: tracks.length };
}
