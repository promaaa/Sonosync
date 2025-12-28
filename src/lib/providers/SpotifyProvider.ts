import SpotifyWebApi from 'spotify-web-api-node';
import { MusicProvider, Playlist, Track, Platform } from '@/lib/types';

export class SpotifyProvider implements MusicProvider {
    name: Platform = 'spotify';
    private api: SpotifyWebApi;

    constructor(accessToken?: string) {
        this.api = new SpotifyWebApi();
        if (accessToken) {
            this.api.setAccessToken(accessToken);
        }
    }

    async authenticate(): Promise<void> {
        // Auth is handled by NextAuth, this validates the token or refreshes if we had logic here
        if (!this.api.getAccessToken()) {
            throw new Error('No access token provided');
        }
    }

    async getUserPlaylists(): Promise<Playlist[]> {
        const data = await this.api.getUserPlaylists();
        return data.body.items.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            owner: p.owner.display_name || 'Unknown',
            trackCount: p.tracks.total,
            image: p.images[0]?.url,
            platform: 'spotify',
            externalUrl: p.external_urls.spotify
        }));
    }

    async getPlaylistTracks(playlistId: string): Promise<Track[]> {
        const data = await this.api.getPlaylistTracks(playlistId);
        return data.body.items
            .filter(item => item.track) // Filter null tracks
            .map(item => {
                const t = item.track as SpotifyApi.TrackObjectFull;
                return {
                    id: t.id,
                    title: t.name,
                    artist: t.artists.map(a => a.name).join(', '),
                    album: t.album.name,
                    image: t.album.images[0]?.url,
                    isrc: t.external_ids?.isrc,
                    duration: Math.round(t.duration_ms / 1000),
                    uri: t.uri
                };
            });
    }

    async searchTrack(query: string, isrc?: string): Promise<Track | null> {
        // Strategy: Try ISRC first if available
        if (isrc) {
            const isrcResults = await this.api.searchTracks(`isrc:${isrc}`);
            if (isrcResults.body.tracks?.items.length && isrcResults.body.tracks?.items.length > 0) {
                const t = isrcResults.body.tracks.items[0];
                return this.mapSpotifyTrack(t);
            }
        }

        // Fallback to metadata search
        const results = await this.api.searchTracks(query);
        if (results.body.tracks?.items.length && results.body.tracks.items.length > 0) {
            return this.mapSpotifyTrack(results.body.tracks.items[0]);
        }

        return null;
    }

    async createPlaylist(name: string, description?: string): Promise<string> {
        const me = await this.api.getMe();
        const result = await (this.api as any).createPlaylist(me.body.id, name, {
            description: description || 'Created by SonoSync'
        });
        return result.body.id;
    }

    async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
        // Spotify URIs are 'spotify:track:ID'
        const uris = trackIds.map(id => id.startsWith('spotify:') ? id : `spotify:track:${id}`);

        // Batch in chunks of 100 if needed (Spotify generic limit)
        // For now simple implementation
        await this.api.addTracksToPlaylist(playlistId, uris);
    }

    private mapSpotifyTrack(t: SpotifyApi.TrackObjectFull): Track {
        return {
            id: t.id,
            title: t.name,
            artist: t.artists.map(a => a.name).join(', '),
            album: t.album.name,
            image: t.album.images[0]?.url,
            isrc: t.external_ids?.isrc,
            duration: Math.round(t.duration_ms / 1000),
            uri: t.uri
        };
    }
}
