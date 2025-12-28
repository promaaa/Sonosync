import { PlatformCard } from "@/components/PlatformCard";
import { PlaylistSelector } from "@/components/PlaylistSelector";
import { DataFetcher } from "@/components/DataFetcher";
import { TransferFlow } from "@/components/TransferFlow";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { Header } from "@/components/Header";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-8 py-12 max-w-7xl">
        <section className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-16">
          <div className="text-center mb-16 relative">
            <h1 className="relative text-5xl md:text-7xl font-medium tracking-tight mb-6 text-[#dcddde] drop-shadow-sm">
              Free Your <span className="text-[#a882ff] font-mono">Music</span>.
            </h1>
            <p className="relative text-xl text-[#999] max-w-2xl mx-auto font-normal">
              The seamless standard for playlist transfer.
              Move tracks between Spotify, Apple, and Google.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            <PlatformCard
              platform="spotify"
              name="Spotify"
            />
            <PlatformCard
              platform="deezer"
              name="Deezer"
            />
            <PlatformCard
              platform="apple"
              name="Apple Music"
            />
            <PlatformCard
              platform="youtube"
              name="YouTube Music"
            />
          </div>
        </section>

        <section className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <h2 className="text-xl font-semibold mb-6">Your Playlists</h2>
          <PlaylistSelector />
        </section>

        {/* Transfer Interface */}
        <div className="mt-12">
          <TransferFlow />
        </div>
        <DataFetcher />
      </main>
    </div>
  );
}
