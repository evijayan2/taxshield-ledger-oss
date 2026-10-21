import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test' || Boolean(process.env.VITEST);

  const aliases: Record<string, string> = {
    '@': path.resolve(__dirname, '.'),
    'taxshield-ledger-core/server': path.resolve(__dirname, '../shared-core/src/server.ts'),
    'taxshield-ledger-core/types': path.resolve(__dirname, '../shared-core/src/types.ts'),
    'taxshield-ledger-core': path.resolve(__dirname, '../shared-core/src/index.ts'),
    crypto: path.resolve(__dirname, '../shared-core/src/lib/browserCryptoPolyfill.ts'),
  };

  // In client/browser build, stub Prisma to prevent invalid ESM references to .prisma/client/index-browser
  if (!isTest) {
    aliases['@prisma/client'] = path.resolve(__dirname, 'src/lib/prismaBrowserStub.ts');
    aliases['.prisma/client/index-browser'] = path.resolve(__dirname, 'src/lib/prismaBrowserStub.ts');
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: aliases,
    },
    optimizeDeps: {
      exclude: ['taxshield-ledger-core'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
