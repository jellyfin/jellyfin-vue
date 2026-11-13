import { defineConfig } from 'vitest/config';

/**
 * Base Vitest configuration: unit tests under `test/` named `*.spec.ts`, run in plain Node (no DOM environment), so the
 * modules they cover stay pure
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts']
  }
});
