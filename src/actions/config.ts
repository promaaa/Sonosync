"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

const ENV_PATH = path.join(process.cwd(), ".env.local");

export async function getProviderStatus() {
    // Check which providers have potentially valid config
    // We don't expose the keys, just the boolean status
    return {
        spotify: !!process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_ID !== "mock_id",
        deezer: !!process.env.DEEZER_CLIENT_ID && process.env.DEEZER_CLIENT_ID !== "mock_deezer_id",
        apple: !!process.env.APPLE_ID && process.env.APPLE_ID !== "mock_apple_id",
        youtube: !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "mock_google_id",
    };
}

export async function getSpotifyClientId() {
    return process.env.SPOTIFY_CLIENT_ID || "";
}

export async function updateProviderConfig(platform: string, clientId: string, clientSecret: string) {
    try {
        let envContent = "";
        try {
            envContent = await fs.readFile(ENV_PATH, "utf-8");
        } catch (error) {
            // File might not exist
        }

        const envVars = parseEnv(envContent);

        // Map platform to env keys
        const mapping: Record<string, [string, string]> = {
            spotify: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"],
            deezer: ["DEEZER_CLIENT_ID", "DEEZER_CLIENT_SECRET"],
            apple: ["APPLE_ID", "APPLE_SECRET"],
            youtube: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], // YouTube uses Google
        };

        const keys = mapping[platform];
        if (!keys) throw new Error("Invalid platform");

        envVars[keys[0]] = clientId;
        envVars[keys[1]] = clientSecret;

        // Reconstruct .env file
        const newContent = Object.entries(envVars)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");

        await fs.writeFile(ENV_PATH, newContent);

        // CAUTION: In a real production app, changing env vars usually requires a server restart.
        // In dev mode with Next.js, it might reload automatically or require manual restart.
        // We will warn the user about this.

        return { success: true };
    } catch (error) {
        console.error("Failed to update config", error);
        return { success: false, error: "Failed to save configuration" };
    }
}

function parseEnv(content: string): Record<string, string> {
    const vars: Record<string, string> = {};
    content.split("\n").forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (key && !key.startsWith("#")) {
                vars[key] = value;
            }
        }
    });
    return vars;
}
