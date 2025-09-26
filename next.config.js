/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Deshabilitar React StrictMode para evitar llamadas duplicadas en desarrollo
  reactStrictMode: false,
}

module.exports = nextConfig
