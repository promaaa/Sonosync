import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'mosaic.scdn.co' },
      { protocol: 'https', hostname: 'e-cdns-images.dzcdn.net' },
      { protocol: 'https', hostname: 'is1-ssl.mzstatic.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google profile images
      { protocol: 'https', hostname: 'image-cdn-ak.spotifycdn.com' }, // More Spotify images
      { protocol: 'https', hostname: 'image-cdn-fa.spotifycdn.com' }, // Even more Spotify images
    ],
  },
};

export default nextConfig;
