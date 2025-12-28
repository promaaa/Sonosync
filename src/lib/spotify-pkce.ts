
import { getSpotifyClientId } from "@/actions/config";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SCOPES = "playlist-read-private playlist-read-collaborative user-library-read playlist-modify-public playlist-modify-private";

// Access token management
export function loadAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('spotify_access_token');
}

export function saveAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('spotify_access_token', token);
}

export function clearAccessToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_code_verifier');
}

// Generate code verifier for PKCE flow
function generateCodeVerifier(): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomValues = crypto.getRandomValues(new Uint8Array(64));
    return Array.from(randomValues)
        .map((value) => possible[value % possible.length])
        .join("");
}

// Generate code challenge from verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashed = await crypto.subtle.digest("SHA-256", data);
    return base64urlencode(hashed);
}

// Encode array buffer to base64 URL
function base64urlencode(arrayBuffer: ArrayBuffer): string {
    const bytes = new Uint8Array(arrayBuffer);
    let str = "";
    bytes.forEach((byte) => {
        str += String.fromCharCode(byte);
    });
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Get the redirect URI for the current location
// Get the redirect URI for the current location
function getRedirectUri(): string {
    // Spotify strictly allows http for localhost but might reject 127.0.0.1 or other variants.
    // ACTUAL UPDATE: Spotify NOW blocks 'localhost' for new apps. We MUST use 127.0.0.1.
    // We dynamically grab the port because npm run dev might spawn on 3001, 3002 etc.
    const port = window.location.port || '3000';
    return process.env.NEXT_PUBLIC_REDIRECT_URI || `http://127.0.0.1:${port}/callback`;
}

// Initiate Spotify OAuth authorization flow
export async function initiateSpotifyAuth(): Promise<void> {
    let clientId: string = "";
    try {
        clientId = await getSpotifyClientId();
    } catch (e) {
        // Fallback or ignore
    }

    // Fallback to NEXT_PUBLIC if available (though getSpotifyClientId checks env)
    if (!clientId) {
        clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
    }

    if (!clientId) {
        console.error("Spotify Client ID is missing. Please check your configuration.");
        alert("Spotify Client ID is missing.");
        return;
    }

    // Generate and store PKCE code verifier
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem("spotify_code_verifier", codeVerifier);

    // Construct authorization URL
    const authUrl = new URL(SPOTIFY_AUTH_URL);
    const params = {
        response_type: "code",
        client_id: clientId,
        scope: SPOTIFY_SCOPES,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        redirect_uri: getRedirectUri(),
        show_dialog: "true"
    };

    authUrl.search = new URLSearchParams(params).toString();

    // Redirect to Spotify authorization page
    window.location.href = authUrl.toString();
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<string> {
    let clientId: string = "";
    try {
        clientId = await getSpotifyClientId();
    } catch (e) { }

    if (!clientId) clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";

    if (!clientId) throw new Error("Client ID missing for token exchange");

    const redirectUri = getRedirectUri();
    const codeVerifier = localStorage.getItem('spotify_code_verifier');

    if (!codeVerifier) {
        throw new Error('Code verifier not found in localStorage');
    }

    const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Failed to exchange token');
    }

    const data = await response.json();
    const accessToken = data.access_token;

    // Save token and clean up code verifier
    saveAccessToken(accessToken);
    localStorage.removeItem('spotify_code_verifier'); // Clean up

    return accessToken;
}

export function logoutSpotify() {
    clearAccessToken();
    window.location.reload();
}
