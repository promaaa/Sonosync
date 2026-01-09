# Authentication Guide for SonoSync

This guide explains how to set up authentication for each supported music platform.

## Table of Contents
- [Authentication Architecture](#authentication-architecture)
- [Spotify Setup](#spotify-setup)
- [YouTube Music Setup](#youtube-music-setup)
- [Deezer Setup](#deezer-setup)
- [Apple Music Setup](#apple-music-setup)
- [Troubleshooting](#troubleshooting)

---

## Authentication Architecture

SonoSync uses a hybrid authentication approach:

1. **NextAuth.js (Auth.js v5)** - Server-side OAuth for Spotify, Google/YouTube, and Apple
2. **Spotify PKCE Flow** - Client-side authentication for Spotify (recommended)
3. **ARL Cookie Method** - Manual authentication for Deezer (since Deezer closed their API)

### Multi-Provider Token Storage

SonoSync can store tokens from multiple providers simultaneously. This means you can:
- Be connected to Spotify AND YouTube at the same time
- Transfer playlists between services without re-authenticating

---

## Spotify Setup

Spotify offers two authentication methods:

### Method 1: PKCE Flow (Recommended)
This is the client-side flow that keeps tokens in your browser.

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in:
   - App name: `SonoSync` (or any name)
   - App description: `Playlist transfer tool`
   - Redirect URI: `http://127.0.0.1:3000/callback`
4. Select **Web API** when asked which APIs you need
5. Copy your **Client ID**
6. Add it to `.env.local`:
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   NEXT_PUBLIC_REDIRECT_URI=http://127.0.0.1:3000/callback
   ```

### Method 2: NextAuth OAuth
This is the server-side flow that requires a Client Secret.

1. Follow steps 1-5 above
2. Also add Redirect URI: `http://127.0.0.1:3000/api/auth/callback/spotify`
3. Copy both **Client ID** and **Client Secret**
4. Add to `.env.local`:
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

### Important Notes
- ⚠️ Spotify **does not accept `localhost`** - always use `127.0.0.1`
- ⚠️ Access the app via `http://127.0.0.1:3000` (not localhost)
- The PKCE flow doesn't require a Client Secret

---

## YouTube Music Setup

YouTube Music uses Google OAuth with the YouTube Data API v3.

### Step 1: Enable the YouTube API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** > **Library**
4. Search for "YouTube Data API v3"
5. Click **Enable**

### Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Fill in required fields:
   - App name: `SonoSync`
   - User support email: Your email
   - Developer contact: Your email
4. Click **Save and Continue** through scopes
5. In **Test Users**, click **Add Users** and add your email
6. Complete the setup

### Step 3: Create Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Add Authorized redirect URI:
   ```
   http://127.0.0.1:3000/api/auth/callback/google
   ```
5. Copy the **Client ID** and **Client Secret**
6. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### Common Issues
- **"Access Blocked" error**: Add your email as a Test User in OAuth consent screen
- **"API not enabled"**: Make sure YouTube Data API v3 is enabled
- **Redirect mismatch**: Ensure URI uses `127.0.0.1` not `localhost`

---

## Deezer Setup

Deezer has closed their API to new applications, so we use the **ARL Cookie Method**.

### What is ARL?
ARL is an authentication cookie that Deezer sets when you log in. It provides access to your account without needing API credentials.

### How to Get Your ARL
1. Go to [Deezer.com](https://www.deezer.com) and log in
2. Open Developer Tools:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+I`
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Expand **Cookies** > **www.deezer.com**
5. Find the cookie named `arl`
6. Copy its value (it's a long string of characters)
7. Paste it in SonoSync's Deezer setup wizard

### Important Notes
- ⚠️ ARL cookies **expire periodically** - you may need to refresh it
- ⚠️ Keep your ARL **private** - it provides full access to your account
- ⚠️ Do not share your ARL with anyone

### Limitations
- Playlist creation may fail if Deezer enforces CSRF protection
- Reading playlists is more reliable than writing

---

## Apple Music Setup

> ⚠️ **Coming Soon** - Apple Music support is currently in development.

Apple Music integration requires:
1. An Apple Developer Account ($99/year)
2. A MusicKit identifier
3. A private key for generating JWT tokens

When ready, the setup will involve:
1. Creating a Media Identifier in Apple Developer Portal
2. Generating a MusicKit private key
3. Configuring the key Team ID, Key ID, and Private Key in SonoSync

---

## Troubleshooting

### General Issues

#### "Server error" during login
1. Ensure you're accessing via `http://127.0.0.1:3000` (not localhost)
2. Check that all environment variables are set correctly
3. Restart the dev server after changing `.env.local`

#### Token expired
- **Spotify**: Re-authenticate through the app
- **Google/YouTube**: Re-authenticate through the app
- **Deezer**: Get a fresh ARL cookie

### Spotify Issues

#### "Invalid redirect URI"
- Ensure the redirect URI in Spotify Dashboard exactly matches:
  - PKCE: `http://127.0.0.1:3000/callback`
  - NextAuth: `http://127.0.0.1:3000/api/auth/callback/spotify`

#### "Invalid client" error
- Verify Client ID is correct
- If using NextAuth, verify Client Secret is correct

### YouTube/Google Issues

#### "Access blocked" error
You need to add yourself as a test user:
1. Go to Google Cloud Console
2. Navigate to **APIs & Services** > **OAuth consent screen**
3. Click **Test users** > **Add users**
4. Add your email address

Alternatively, **publish** your OAuth app to allow all users.

#### "This app isn't verified"
Click **Advanced** > **Go to [App Name] (unsafe)** to proceed.

#### "API quota exceeded"
YouTube API has quotas. If you hit limits:
1. Wait for quota to reset (usually daily)
2. Or request quota increase in Google Cloud Console

### Deezer Issues

#### "Invalid ARL"
1. Log out and log back into Deezer
2. Get a fresh ARL cookie
3. Make sure you copied the full value

#### Playlist creation fails
This can happen due to CSRF protection. Reading playlists should still work.

---

## Environment Variables Reference

```env
# Required
AUTH_SECRET=generate-a-random-32-char-secret
NEXTAUTH_URL=http://127.0.0.1:3000

# Spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_REDIRECT_URI=http://127.0.0.1:3000/callback

# Google/YouTube
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Deezer (optional - ARL method preferred)
DEEZER_CLIENT_ID=optional
DEEZER_CLIENT_SECRET=optional

# Apple (future)
APPLE_ID=your_apple_id
APPLE_SECRET=your_apple_jwt_secret
```

Generate `AUTH_SECRET` with:
```bash
openssl rand -base64 32
```

---

## Need Help?

- Check the [main README](./README.md) for general setup
- Open an issue on [GitHub](https://github.com/promaaa/sonosync/issues)
- Review server logs for detailed error messages (run with `npm run dev`)
