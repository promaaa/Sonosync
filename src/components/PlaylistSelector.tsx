"use client";

import { useMusicStore } from "@/store/useMusicStore";
import { Playlist } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function PlaylistSelector() {
    const { sourcePlaylists, selectedPlaylist, selectPlaylist } = useMusicStore();

    if (sourcePlaylists.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed border-white/10 rounded-xl">
                <p className="text-muted-foreground">No playlists found. Connect a source first.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-2">
            {sourcePlaylists.map((playlist) => (
                <button
                    key={playlist.id}
                    onClick={() => selectPlaylist(playlist)}
                    className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                        selectedPlaylist?.id === playlist.id
                            ? "border-primary bg-primary/10"
                            : "border-white/5 bg-card hover:bg-white/5"
                    )}
                >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-white/10">
                        {playlist.image && (
                            <Image
                                src={playlist.image}
                                alt={playlist.name}
                                fill
                                className="object-cover"
                            />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-medium truncate">{playlist.name}</h3>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                            {playlist.trackCount} tracks • {playlist.owner}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
}
