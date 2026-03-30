import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vite';
import BaseConfig from '@jellyfin-vue/frontend/configs/vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(
  mergeConfig(BaseConfig, {
    // Prevent vite from obscuring rust errors
    clearScreen: false,
    build: {
      outDir: resolve(import.meta.dirname, 'dist'),
      rolldownOptions: {
        input: {
          main: resolve(import.meta.dirname, 'entrypoint.ts')
        }
      },
      // Don't minify for debug builds
      ...(process.env.TAURI_ENV_DEBUG ? { minify: false } : {}),
      // Produce sourcemaps for debug builds
      sourcemap: !!process.env.TAURI_ENV_DEBUG
    },
    server: {
    // Tauri expects a fixed port, fail if that port is not available
      strictPort: true,
      // if the host Tauri is expecting is set, use it
      ...(host ? { host } : {})
    },
    // Env variables starting with the item of `envPrefix` will be exposed in tauri's source code through `import.meta.env`.
    envPrefix: ['VITE_', 'TAURI_ENV_*']
  })
);
