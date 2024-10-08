/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ZADARMA_SECRET_KEY: process.env.ZADARMA_SECRET_KEY,
  },
  async headers() {
    return [
      {
        // This applies to the API route for the Zadarma webhook
        source: "/api/webhook/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
};

export default nextConfig;