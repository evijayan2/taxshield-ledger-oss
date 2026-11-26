#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Resolves the branch name to clone from options or CI/Vercel environment variables.
 * @param {object} options
 * @param {string} [options.branch]
 * @param {Record<string, string | undefined>} [options.env]
 * @returns {string}
 */
function resolveTargetBranch(options = {}) {
  if (typeof options.branch === 'string') {
    return options.branch.trim();
  }
  const env = options.env || process.env;
  return (
    env.SHARED_CORE_BRANCH ||
    env.VERCEL_GIT_COMMIT_REF ||
    env.GITHUB_HEAD_REF ||
    env.GITHUB_REF_NAME ||
    ''
  ).trim();
}

/**
 * Clones the shared-core repository into targetDir, trying branch first if specified
 * and falling back to the repository's default branch if that branch does not exist.
 * @param {string} targetDir
 * @param {string} repoUrl
 * @param {string} branch
 * @param {(cmd: string) => void} runCommand
 * @param {(p: string) => boolean} fileExists
 * @returns {string | null}
 */
function cloneIntoTarget(targetDir, repoUrl, branch, runCommand, fileExists) {
  const indexFile = path.join(targetDir, 'src/index.ts');
  if (branch) {
    try {
      runCommand(`git clone --depth 1 --branch "${branch}" ${repoUrl} "${targetDir}"`);
      if (fileExists(indexFile)) {
        return targetDir;
      }
    } catch {
      // Branch may not exist in shared-core; fall back to default branch
    }
  }
  try {
    runCommand(`git clone --depth 1 ${repoUrl} "${targetDir}"`);
    return fileExists(indexFile) ? targetDir : null;
  } catch {
    return null;
  }
}

/**
 * Resolves or clones the shared-core repository location for build environments.
 * @param {object} [options]
 * @param {string} [options.rootDir]
 * @param {string} [options.parentSharedCore]
 * @param {string} [options.localSharedCore]
 * @param {string} [options.repoUrl]
 * @param {string} [options.branch]
 * @param {Record<string, string | undefined>} [options.env]
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
  const branch = resolveTargetBranch(options);
  const fileExists = options.fileExists || ((filePath) => fs.existsSync(filePath));
  const runCommand = options.runCommand || ((cmd) => execSync(cmd, { stdio: 'inherit' }));
  const symlinkSync = options.symlinkSync || ((target, p, type) => fs.symlinkSync(target, p, type));

  if (fileExists(path.join(parentSharedCore, 'src/index.ts'))) {
    return { status: 'found', location: parentSharedCore, source: 'parent' };
  }
  if (fileExists(path.join(localSharedCore, 'src/index.ts'))) {
    return { status: 'found', location: localSharedCore, source: 'local' };
  }

  const clonedTo =
    cloneIntoTarget(parentSharedCore, repoUrl, branch, runCommand, fileExists) ||
    cloneIntoTarget(localSharedCore, repoUrl, branch, runCommand, fileExists);

  if (!clonedTo) {
    throw new Error(`Unable to clone shared-core from ${repoUrl}`);
  }

  try {
    const sourceNodeModules = path.join(rootDir, 'node_modules');
    const targetNodeModules = path.join(clonedTo, 'node_modules');
    if (fileExists(sourceNodeModules) && !fileExists(targetNodeModules)) {
      symlinkSync(sourceNodeModules, targetNodeModules, 'junction');
    }
  } catch {
    // Best-effort symlink fallback
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
