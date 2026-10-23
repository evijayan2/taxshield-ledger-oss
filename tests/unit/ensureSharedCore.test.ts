import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ensureSharedCore } = require('../../scripts/ensure-shared-core.cjs');

describe('ensureSharedCore helper', () => {
  it('detects existing shared-core in parent directory without cloning', () => {
    const parentPath = path.resolve('/mock/workspace/shared-core');
    const localPath = path.resolve('/mock/workspace/taxshield-ledger-oss/shared-core');
    const mockFileExists = vi.fn((filePath: string) => {
      return filePath === path.join(parentPath, 'src/index.ts');
    });
    const mockRunCommand = vi.fn();

    const result = ensureSharedCore({
      parentSharedCore: parentPath,
      localSharedCore: localPath,
      fileExists: mockFileExists,
      runCommand: mockRunCommand,
    });

    expect(result.status).toBe('found');
    expect(result.location).toBe(parentPath);
    expect(result.source).toBe('parent');
    expect(mockRunCommand).not.toHaveBeenCalled();
  });

  it('detects existing shared-core in local directory if parent is absent', () => {
    const parentPath = path.resolve('/mock/workspace/shared-core');
    const localPath = path.resolve('/mock/workspace/taxshield-ledger-oss/shared-core');
    const mockFileExists = vi.fn((filePath: string) => {
      return filePath === path.join(localPath, 'src/index.ts');
    });
    const mockRunCommand = vi.fn();

    const result = ensureSharedCore({
      parentSharedCore: parentPath,
      localSharedCore: localPath,
      fileExists: mockFileExists,
      runCommand: mockRunCommand,
    });

    expect(result.status).toBe('found');
    expect(result.location).toBe(localPath);
    expect(result.source).toBe('local');
    expect(mockRunCommand).not.toHaveBeenCalled();
  });

  it('clones to parent directory when missing from both', () => {
    const parentPath = path.resolve('/mock/workspace/shared-core');
    const localPath = path.resolve('/mock/workspace/taxshield-ledger-oss/shared-core');
    let hasCloned = false;
    const mockFileExists = vi.fn((filePath: string) => {
      if (filePath === path.join(parentPath, 'src/index.ts') && hasCloned) {
        return true;
      }
      return false;
    });
    const mockRunCommand = vi.fn(() => {
      hasCloned = true;
    });

    const result = ensureSharedCore({
      parentSharedCore: parentPath,
      localSharedCore: localPath,
      fileExists: mockFileExists,
      runCommand: mockRunCommand,
    });

    expect(result.status).toBe('cloned');
    expect(result.location).toBe(parentPath);
    expect(result.source).toBe('parent');
    expect(mockRunCommand).toHaveBeenCalledWith(
      expect.stringContaining('https://github.com/evijayan2/taxshield-ledger-core.git')
    );
  });

  it('falls back to local clone when parent directory clone throws an error', () => {
    const parentPath = path.resolve('/mock/workspace/shared-core');
    const localPath = path.resolve('/mock/workspace/taxshield-ledger-oss/shared-core');
    let localCloned = false;
    const mockFileExists = vi.fn((filePath: string) => {
      if (filePath === path.join(localPath, 'src/index.ts') && localCloned) {
        return true;
      }
      return false;
    });
    const mockRunCommand = vi.fn((cmd: string) => {
      if (cmd.includes(parentPath)) {
        throw new Error('Permission denied on parent directory');
      }
      localCloned = true;
    });

    const result = ensureSharedCore({
      parentSharedCore: parentPath,
      localSharedCore: localPath,
      fileExists: mockFileExists,
      runCommand: mockRunCommand,
    });

    expect(result.status).toBe('cloned');
    expect(result.location).toBe(localPath);
    expect(result.source).toBe('local');
    expect(mockRunCommand).toHaveBeenCalledTimes(2);
  });
});
