import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vite';
// @ts-expect-error - This error will be fixed once the Vite team adds monorepo support for config files
import BaseConfig from '../../frontend/vite.config.ts';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(
  mergeConfig(BaseConfig, {
    // prevent vite from obscuring rust errors
    clearScreen: false,
    build: {
      outDir: resolve(import.meta.dirname, 'dist'),
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, 'entrypoint.ts')
        }
      },
      // don't minify for debug builds
      ...(process.env.TAURI_ENV_DEBUG ? { minify: false } : {}),
      // produce sourcemaps for debug builds
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
