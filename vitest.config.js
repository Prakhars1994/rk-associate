import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-plugin';

export default defineConfig({
  test: { testTimeout: 30000 },
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        bindings: {
          SUPABASE_URL: 'https://sb.test',
          SUPABASE_ANON_KEY: 'test-anon-key',
          SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        },
      },
    }),
  ],
});
