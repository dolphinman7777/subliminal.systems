/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'your-image-domain.com', // Existing domains
      'your-cloudfront-distribution.cloudfront.net' // Add your CloudFront domain
    ],
  },
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    NEXT_PUBLIC_CLOUDFRONT_URL: process.env.NEXT_PUBLIC_CLOUDFRONT_URL,
    // Add other public environment variables here
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'ffmpeg-static', 'ffprobe-static'];
    return config;
  },
}

module.exports = nextConfig
