import react from '@vitejs/plugin-react';
import { defineConfig, PluginOption } from 'vite';
import circleDependency from 'vite-plugin-circular-dependency';
import vitePluginFaviconsInject from 'vite-plugin-favicons-inject';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => {
  const outDir = 'build';

  return {
    plugins: [
      react(),
      circleDependency(),
      process.env.BRAND_APP_FAVICON && vitePluginFaviconsInject(process.env.BRAND_APP_FAVICON),
      process.env.BRAND_APP_LOGO &&
        viteStaticCopy({
          targets: [
            {
              src: process.env.BRAND_APP_LOGO,
              dest: ''
            }
          ]
        })
    ].filter(Boolean) as PluginOption[], // remove conditional plugins if undefined

    define: {
      'process.env.OBSERVER_URL': JSON.stringify(process.env.OBSERVER_URL || ''),
      'process.env.BRAND_APP_LOGO': JSON.stringify(process.env.BRAND_APP_LOGO || ''),
      'process.env.API_VERSION': JSON.stringify(process.env.API_VERSION || ''),
      'process.env.USE_MOCK_SERVER': JSON.stringify(process.env.USE_MOCK_SERVER),
      'process.env.MOCK_ITEM_COUNT': JSON.stringify(process.env.MOCK_ITEM_COUNT),
      'process.env.MOCK_RESPONSE_DELAY': JSON.stringify(process.env.MOCK_RESPONSE_DELAY)
    },

    base: './',

    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: true,
      chunkSizeWarningLimit: 1500
    },

    server: {
      port: 3000
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vite.setup.ts'],
      coverage: {
        reporter: ['text', 'lcov'],
        all: false,
        include: ['**/src/**'],
        exclude: ['**/src/config/**']
      }
    }
  };
});