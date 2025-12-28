import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SonoSync",
  description: "Transfer playlists freely",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/iosevka-web@latest/dist/iosevka/iosevka.css" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-[#111111] text-[#dcddde] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
