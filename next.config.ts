import type { NextConfig } from 'next';

const config: NextConfig = {
  serverExternalPackages: ['pg', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
};

export default config;
