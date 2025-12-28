export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  image?: string;
  isrc?: string; // Critical for matching
  duration: number; // in seconds
  uri: string; // Platform specific URI
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  owner: string;
  trackCount: number;
  image?: string;
  platform: Platform;
  externalUrl?: string;
}

export type Platform = 'spotify' | 'deezer' | 'apple' | 'youtube';

export interface UserProfile {
    id: string;
    name: string;
    email?: string;
    image?: string;
    platform: Platform;
}

export interface MusicProvider {
  name: Platform;
  authenticate(): Promise<void>;
  getUserPlaylists(): Promise<Playlist[]>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
  searchTrack(query: string, isrc?: string): Promise<Track | null>;
  createPlaylist(name: string, description?: string): Promise<string>; // Returns ID
  addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void>;
}
