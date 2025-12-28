"use server";

import { auth } from "@/lib/auth";
import { SpotifyProvider } from "@/lib/providers/SpotifyProvider";
import { Playlist } from "@/lib/types";

export async function getUserPlaylists(): Promise<Playlist[]> {
    const session = await auth();

    if (!session?.accessToken || session.provider !== 'spotify') {
        return [];
    }

    try {
        const provider = new SpotifyProvider(session.accessToken as string);
        // Add a small delay/simulated wait if needed, or straight call
        const playlists = await provider.getUserPlaylists();
        return playlists;
    } catch (error) {
        console.error("Error fetching playlists:", error);
        return [];
    }
}
