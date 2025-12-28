"use client";

import { useSession } from "next-auth/react";
import { ObsidianLogo } from "@/components/ObsidianLogo";

export function Header() {
    const { data: session } = useSession();

    return (
        <header className="fixed top-0 z-50 w-full bg-[#111111]/95 backdrop-blur-md border-b border-[#333] transition-colors duration-500 shadow-sm">
            <div className="container flex h-16 items-center justify-between px-6 mx-auto max-w-7xl">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 text-[#a882ff]">
                        <ObsidianLogo className="w-full h-full drop-shadow-[0_0_10px_rgba(168,130,255,0.5)]" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-xl font-bold tracking-tight text-[#dcddde] font-mono leading-none">
                            SONOSYNC
                        </span>
                    </div>
                </div>

                {/* User Profile */}
                {session?.user && (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#999] hidden md:inline-block font-mono">
                            {session.user.name || session.user.email}
                        </span>
                        {session.user.image ? (
                            <img src={session.user.image} alt="User" className="h-8 w-8 rounded-full border border-[#a882ff]/50" />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-[#a882ff]/20 flex items-center justify-center border border-[#a882ff]/50">
                                <span className="text-xs font-bold text-[#a882ff]">{session.user.name?.[0] || 'U'}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
