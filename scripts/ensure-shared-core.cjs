#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Resolves or clones the shared-core repository location for build environments.
 * @param {object} [options]
 * @param {string} [options.rootDir]
 * @param {string} [options.parentSharedCore]
 * @param {string} [options.localSharedCore]
 * @param {string} [options.repoUrl]
 * @param {(p: string) => boolean} [options.fileExists]
 * @param {(cmd: string) => void} [options.runCommand]
 * @param {(target: string, path: string, type?: string) => void} [options.symlinkSync]
 * @returns {{ status: 'found' | 'cloned', location: string, source: 'parent' | 'local' }}
 */
function ensureSharedCore(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const parentSharedCore = options.parentSharedCore || path.resolve(rootDir, '../shared-core');
  const localSharedCore = options.localSharedCore || path.resolve(rootDir, 'shared-core');
  const repoUrl = options.repoUrl || 'https://github.com/evijayan2/taxshield-ledger-core.git';
  const fileExists = options.fileExists || ((filePath) => fs.existsSync(filePath));
  const runCommand = options.runCommand || ((cmd) => execSync(cmd, { stdio: 'inherit' }));
  const symlinkSync = options.symlinkSync || ((target, p, type) => fs.symlinkSync(target, p, type));

  const parentHasCore = fileExists(path.join(parentSharedCore, 'src/index.ts'));
  const localHasCore = fileExists(path.join(localSharedCore, 'src/index.ts'));

  if (parentHasCore) {
    return { status: 'found', location: parentSharedCore, source: 'parent' };
  }

  if (localHasCore) {
    return { status: 'found', location: localSharedCore, source: 'local' };
  }

  let clonedTo = null;
  try {
    runCommand(`git clone --depth 1 ${repoUrl} "${parentSharedCore}"`);
    if (fileExists(path.join(parentSharedCore, 'src/index.ts'))) {
      clonedTo = parentSharedCore;
    }
  } catch {
    // Parent clone failed (e.g. read-only parent directory on container)
  }

  if (!clonedTo) {
    runCommand(`git clone --depth 1 ${repoUrl} "${localSharedCore}"`);
    if (fileExists(path.join(localSharedCore, 'src/index.ts'))) {
      clonedTo = localSharedCore;
    }
  }

  if (clonedTo) {
    try {
      const sourceNodeModules = path.join(rootDir, 'node_modules');
      const targetNodeModules = path.join(clonedTo, 'node_modules');
      if (fileExists(sourceNodeModules) && !fileExists(targetNodeModules)) {
        symlinkSync(sourceNodeModules, targetNodeModules, 'junction');
      }
    } catch {
      // Best-effort symlink fallback
    }
  }

  return { status: 'cloned', location: clonedTo, source: clonedTo === parentSharedCore ? 'parent' : 'local' };
}

if (require.main === module) {
  try {
    const result = ensureSharedCore();
    console.log(`[ensure-shared-core] Resolved shared-core at (${result.source}): ${result.location}`);
    process.exit(0);
  } catch (err) {
    console.error('[ensure-shared-core] Failed to ensure shared-core:', err);
    process.exit(1);
  }
}

module.exports = { ensureSharedCore };
