"use server";

import { Playlist, Track } from "@/lib/types";

const DEEZER_GW_URL = "https://www.deezer.com/ajax/gw-light.php";

interface DeezerResponse<T> {
    error: any[];
    results: T;
}

// Helper to make requests to Deezer internal API
async function deezerRequest<T>(
    method: string,
    arl: string,
    apiToken: string = 'null',
    body: any = {},
    sid?: string // Session ID cookie
): Promise<{ results: T; sid?: string }> {
    const params = new URLSearchParams({
        method,
        api_version: "1.0",
        api_token: apiToken,
        input: "3"
    });

    const cookieHeader = `arl=${arl}${sid ? `; sid=${sid}` : ''}`;

    const response = await fetch(`${DEEZER_GW_URL}?${params.toString()}`, {
        method: "POST",
        headers: {
            "Cookie": cookieHeader,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Origin": "https://www.deezer.com",
            "Referer": "https://www.deezer.com/"
        },
        body: JSON.stringify(body),
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`Deezer API error: ${response.statusText}`);
    }

    const data = await response.json() as DeezerResponse<T>;

    if (data.error && Object.keys(data.error).length > 0) {
        // Warning: sometimes VALID_TOKEN_REQUIRED error happens if sid is missing
        // We throw it so the caller knows
        throw new Error(`Deezer Internal API Error: ${JSON.stringify(data.error)}`);
    }

    // Extract 'sid' cookie from Set-Cookie header if present
    const setCookie = response.headers.get("set-cookie");
    let newSid = sid;
    if (setCookie) {
        const match = setCookie.match(/sid=([^;]+)/);
        if (match) {
            newSid = match[1];
        }
    }

    return { results: data.results, sid: newSid };
}

// Get User Data (ID, CSRF Token, and Session ID)
async function getDeezerUserData(arl: string) {
    // Initial call to get checkForm (token) and user ID
    const { results, sid } = await deezerRequest<{ checkForm: string; USER: { USER_ID: string; BLOG_NAME: string } }>(
        "deezer.getUserData",
        arl,
        "null"
    );

    if (!results.USER || !results.checkForm) {
        throw new Error("Invalid ARL or failed to fetch user data");
    }

    return {
        userId: results.USER.USER_ID,
        userName: results.USER.BLOG_NAME,
        token: results.checkForm,
        sid // Return the session ID
    };
}

// Create a new playlist
export async function createDeezerPlaylist(arl: string, name: string, description: string = ""): Promise<string> {
    try {
        const { userId, token, sid } = await getDeezerUserData(arl);

        const { results } = await deezerRequest<any>(
            "playlist.create",
            arl,
            token,
            { title: name, description: description, user_id: userId },
            sid
        );

        console.log("Deezer Create Playlist Result:", results);

        // API sometimes returns the ID directly (as a number or string)
        if (typeof results === 'number' || typeof results === 'string') {
            return String(results);
        }

        // Handle object response case (just in case)
        if (results && results.PLAYLIST_ID) {
            return String(results.PLAYLIST_ID);
        }

        throw new Error(`Failed to create playlist. Deezer response: ${JSON.stringify(results)}`);
    } catch (e) {
        console.error("Failed to create Deezer playlist", e);
        throw e;
    }
}

// Search for a track
export async function searchDeezerTrack(arl: string, query: string): Promise<Track | null> {
    try {
        const { token, sid } = await getDeezerUserData(arl);
        // Using deezer.pageSearch
        const { results } = await deezerRequest<any>(
            "deezer.pageSearch",
            arl,
            token,
            { query: query, types: ["TRACK"] },
            sid
        );

        const trackData = results?.TRACK?.data?.[0];

        if (!trackData) return null;

        return {
            id: String(trackData.SNG_ID),
            title: trackData.SNG_TITLE,
            artist: trackData.ART_NAME,
            album: trackData.ALB_TITLE,
            image: `https://e-cdns-images.dzcdn.net/images/cover/${trackData.ALB_PICTURE}/500x500-000000-80-0-0.jpg`,
            duration: parseInt(trackData.DURATION),
            uri: `deezer:track:${trackData.SNG_ID}`,
            isrc: trackData.ISRC
        };
    } catch (e) {
        console.error("Failed to search Deezer track", e);
        return null; // Return null on failure to not break the batch
    }
}

// Add tracks to a playlist
export async function addTracksToDeezerPlaylist(arl: string, playlistId: string, trackIds: string[]): Promise<void> {
    try {
        const { token, sid } = await getDeezerUserData(arl);

        // API expects nested array of arrays [[song_id, 0]]
        const songs = trackIds.map(id => [id, 0]);

        await deezerRequest<any>(
            "playlist.addSongs",
            arl,
            token,
            { playlist_id: playlistId, songs: songs },
            sid
        );

    } catch (e) {
        console.error("Failed to add tracks to Deezer playlist", e);
        throw e;
    }
}

export async function fetchDeezerPlaylists(arl: string): Promise<Playlist[]> {
    try {
        const { userId, userName, token, sid } = await getDeezerUserData(arl);

        const { results: profileData } = await deezerRequest<any>(
            "deezer.pageProfile",
            arl,
            token,
            { tab: "playlists", user_id: userId },
            sid
        );

        const playlistsData = profileData?.TAB?.playlists?.data || [];

        return playlistsData.map((p: any) => ({
            id: String(p.PLAYLIST_ID),
            name: p.TITLE,
            description: p.DESCRIPTION || "",
            owner: p.PARENT_USERNAME || userName,
            trackCount: p.NB_SONG,
            image: `https://e-cdns-images.dzcdn.net/images/cover/${p.PICTURE_TYPE}/${p.PICTURE_MD5}/500x500-000000-80-0-0.jpg`,
            platform: 'deezer',
            externalUrl: `https://www.deezer.com/playlist/${p.PLAYLIST_ID}`
        }));

    } catch (e) {
        console.error("Failed to fetch Deezer playlists", e);
        throw e;
    }
}

export async function getDeezerPlaylistTracks(arl: string, playlistId: string): Promise<Track[]> {
    try {
        const { token, sid } = await getDeezerUserData(arl);

        const { results: response } = await deezerRequest<any>(
            "deezer.pagePlaylist",
            arl,
            token,
            { playlist_id: playlistId, lang: "en", header: true },
            sid
        );

        const tracks = response?.SONGS?.data || [];

        return tracks.map((t: any) => ({
            id: String(t.SNG_ID),
            title: t.SNG_TITLE,
            artist: t.ART_NAME,
            album: t.ALB_TITLE,
            image: `https://e-cdns-images.dzcdn.net/images/cover/${t.ALB_PICTURE}/500x500-000000-80-0-0.jpg`,
            duration: parseInt(t.DURATION),
            isrc: t.ISRC,
            uri: `deezer:track:${t.SNG_ID}`
        }));

    } catch (e) {
        console.error("Failed to fetch Deezer playlist tracks", e);
        throw e;
    }
}
