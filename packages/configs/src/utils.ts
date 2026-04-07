import { globSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { findUpSync } from 'find-up-simple';
import type { LiteralUnion } from 'type-fest';
import { parse } from 'yaml';

const workspaceManifest = findUpSync('pnpm-workspace.yaml', { type: 'file' });
const monorepoRoot = workspaceManifest ? dirname(workspaceManifest) : process.cwd();

/**
 * Gets the workspace packages directly from pnpm configuration
 * @param workspaceManifestPath
 * @returns
 */
function getWorkspacePackagePatterns(workspaceManifestPath: string): string[] {
  const workspace = parse(readFileSync(workspaceManifestPath, 'utf8')) as { packages?: unknown };

  if (!workspace || !Array.isArray(workspace.packages)) {
    return [];
  }

  return workspace.packages.filter((packagePattern): packagePattern is string => typeof packagePattern === 'string');
}

const packagePaths = (() => {
  const relation = new Map<string, string>();
  const packageJsonPaths = new Set(
    workspaceManifest
      ? getWorkspacePackagePatterns(workspaceManifest).flatMap(packagePattern =>
          globSync(join(monorepoRoot, packagePattern, 'package.json'))
        )
      : []
  );

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string };

    if (packageJson.name) {
      relation.set(packageJson.name, dirname(packageJsonPath));
    }
  }

  return relation;
})();

/**
 * Gets the paths of all packages in the monorepo, including the root package
 */
export function getAllPackagePaths() {
  return new Set([monorepoRoot, ...packagePaths.values()]);
}

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
