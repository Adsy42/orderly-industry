/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Prevent pdfjs-dist from being bundled on the server
  serverExternalPackages: ["pdfjs-dist"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Configure webpack for pdf.js (react-pdf)
  webpack: (config, { isServer }) => {
    // Disable canvas for browser (not needed for PDF rendering)
    config.resolve.alias.canvas = false;

    // Handle pdfjs-dist worker
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
      };
    }

    return config;
  },
};

export default nextConfig;
