import { defineConfig } from '@neondatabase/config/v1';

export default defineConfig({
  auth: true,
  preview: {
    aiGateway: true,
    buckets: {
      thumbnails: {},
    },
    functions: {
      generate: {
        name: 'YouTube publish helper',
        source: 'functions/generate.ts',
      },
    },
  },
});
