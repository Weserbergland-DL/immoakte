import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Needed for html2pdf.js and other client-only packages
  serverExternalPackages: ['jspdf'],
}

export default nextConfig
