
import { Playlist, Track } from "@/lib/types";
import { loadAccessToken } from "@/lib/spotify-pkce";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

async function fetchSpotify(endpoint: string) {
    const token = loadAccessToken();
    if (!token) throw new Error("No access token");

    const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (res.status === 401) {
        // Token expired
        // In a real app we would refresh. For now, just throw.
        throw new Error("Token expired");
    }

    if (!res.ok) {
        throw new Error(`Spotify API error: ${res.statusText}`);
    }

    return res.json();
}

export async function getClientSpotifyPlaylists(): Promise<Playlist[]> {
    try {
        const data = await fetchSpotify("/me/playlists?limit=50");

        return data.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            owner: item.owner.display_name,
            trackCount: item.tracks.total,
            image: item.images?.[0]?.url,
            platform: 'spotify',
            externalUrl: item.external_urls.spotify,
        }));
    } catch (e) {
        console.error("Failed to fetch client spotify playlists", e);
        return [];
    }
}
