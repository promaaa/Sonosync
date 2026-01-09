"use client";

import { useMusicStore } from "@/store/useMusicStore";
import { Playlist, Platform } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMemo } from "react";

export function PlaylistSelector() {
    const { sourcePlaylists, selectedPlaylist, selectPlaylist } = useMusicStore();

    // Group playlists by platform
    const groupedPlaylists = useMemo(() => {
        const groups: Record<string, Playlist[]> = {
            spotify: [],
            deezer: [],
            youtube: [],
            apple: []
        };

        sourcePlaylists.forEach(playlist => {
            const platform = playlist.platform || 'spotify'; // fallback
            if (!groups[platform]) groups[platform] = [];
            groups[platform].push(playlist);
        });

        // Filter out empty groups
        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }, [sourcePlaylists]);

    if (sourcePlaylists.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed border-white/10 rounded-xl">
                <p className="text-muted-foreground">No playlists found. Connect a source first.</p>
            </div>
        );
    }

    return (
        <div className="max-h-[600px] overflow-y-auto p-2 space-y-6">
            {groupedPlaylists.map(([platform, playlists]) => (
                <div key={platform}>
                    <h3 className="text-lg font-bold capitalize mb-3 flex items-center gap-2 text-white/80 sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b border-white/5">
                        <span className={cn(
                            "w-2 h-2 rounded-full",
                            platform === 'spotify' && "bg-green-500",
                            platform === 'youtube' && "bg-red-500",
                            platform === 'deezer' && "bg-purple-500",
                            platform === 'apple' && "bg-pink-500"
                        )} />
                        {platform === 'youtube' ? 'YouTube Music' : platform}
                        <span className="text-xs font-normal text-muted-foreground ml-2">({playlists.length})</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {playlists.map((playlist) => (
                            <button
                                key={`${playlist.platform}-${playlist.id}`}
                                onClick={() => selectPlaylist(playlist)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                                    selectedPlaylist?.id === playlist.id && selectedPlaylist?.platform === playlist.platform
                                        ? "border-primary bg-primary/10 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]"
                                        : "border-white/5 bg-card hover:bg-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-white/10 shadow-sm group">
                                    {playlist.image ? (
                                        <Image
                                            src={playlist.image}
                                            alt={playlist.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <span className="text-xs text-muted-foreground">No Cover</span>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-sm truncate text-white/90">{playlist.name}</h3>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                                        <span className="truncate max-w-[60%]">{playlist.owner}</span>
                                        <span className="font-mono opacity-70">{playlist.trackCount} tracks</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
