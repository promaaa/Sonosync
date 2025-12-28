import { MusicProvider, Track } from "@/lib/types";

interface MatchResult {
    source: Track;
    destination: Track | null;
    matchType: 'isrc' | 'strict' | 'fuzzy' | 'none';
}

export async function matchTracks(
    sourceTracks: Track[],
    destinationProvider: MusicProvider
): Promise<MatchResult[]> {
    const results: MatchResult[] = [];

    // Parallelize requests with a limit to avoid rate limiting
    // For simplicity, we'll process sequentially or in small batches
    const BATCH_SIZE = 5;

    for (let i = 0; i < sourceTracks.length; i += BATCH_SIZE) {
        const batch = sourceTracks.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (sourceTrack) => {
            let match: Track | null = null;
            let matchType: 'isrc' | 'strict' | 'fuzzy' | 'none' = 'none';

            // 1. ISRC Match
            if (sourceTrack.isrc) {
                match = await destinationProvider.searchTrack('', sourceTrack.isrc);
                if (match) matchType = 'isrc';
            }

            // 2. Metadata Match (if no ISRC match)
            if (!match) {
                const query = `${sourceTrack.artist} ${sourceTrack.title}`;
                match = await destinationProvider.searchTrack(query);
                if (match) {
                    // Simple strict check override
                    if (match.title.toLowerCase() === sourceTrack.title.toLowerCase()) {
                        matchType = 'strict';
                    } else {
                        matchType = 'fuzzy';
                    }
                }
            }

            results.push({
                source: sourceTrack,
                destination: match,
                matchType
            });
        }));
    }

    return results;
}
