import { globSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { findUpSync } from 'find-up-simple';
import type { LiteralUnion } from 'type-fest';

const workspaceManifest = findUpSync('pnpm-workspace.yaml', { type: 'file' });
const monorepoRoot = workspaceManifest ? dirname(workspaceManifest) : process.cwd();

const packagePaths = (() => {
  const relation = new Map<string, string>();
  const packageJsonPaths = [
    join(monorepoRoot, 'frontend/package.json'),
    join(monorepoRoot, 'packaging/tauri/package.json'),
    ...globSync(join(monorepoRoot, 'packages/*/package.json'))
  ];

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string };

    if (packageJson.name) {
      relation.set(packageJson.name, dirname(packageJsonPath));
    }
  }

  return relation;
})();

/**
 * Gets the path of a monorepo package
 */
export function getPackagePath(
  packageName: LiteralUnion<'jellyfin-vue', string>
): string | undefined {
  return packageName === 'jellyfin-vue'
    ? monorepoRoot
    : packagePaths.get(packageName);
}
