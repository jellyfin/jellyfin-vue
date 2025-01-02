import type { Linter } from 'eslint';
import { getBaseConfig, getTSVueConfig, getNodeFiles, tsFiles } from './src/lint';
import pkg from './package.json' with { type: 'json' };

export default [
  ...getBaseConfig(pkg.name),
  ...getTSVueConfig(false, import.meta.dirname),
  ...getNodeFiles(tsFiles)
] satisfies Linter.Config[];
