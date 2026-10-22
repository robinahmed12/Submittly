import type { Options } from 'tsup';

/**
 * Two bundles from one build (`npm run build` / `npx tsup`):
 *
 * 1. `dist/server.js` — the long-running production server (Node host).
 *    Bundling replaces the old `tsc + tsc-alias` step: a single ESM file
 *    has no `@/` aliases left to resolve at runtime, so `tsc-alias`'s
 *    `resolveFullPaths` workaround becomes unnecessary.
 * 2. `api/[[...path]].js` — the Vercel Serverless Function entry. Vercel's
 *    file-based routing maps `[[...path]]` to *every* `/api/*` request,
 *    and the file must be self-contained because a deployed function runs
 *    as isolated ESM, where an extensionless relative import
 *    (`../src/app`) cannot resolve. Bundling inlines all internal modules
 *    (aliases resolved through this tsconfig); real dependencies stay as
 *    imports — they exist in the function's own `node_modules`.
 *
 * The Express app factory already lives separately from the listener
 * (`src/server.ts` imports `src/app.ts`), so entry (1) keeps the socket
 * and entry (2) mounts the same middleware chain without one.
 */

/** Production server bundle — replaces the previous tsc/tsc-alias output. */
const serverBuild: Options = {
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'esnext',
  outDir: 'dist',
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  banner: {
    js: `
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
    `,
  },
};

/** Vercel function bundle — a catch-all mounting `createApp()` without a socket. */
const vercelApiBuild: Options = {
  entry: { '[[]...path]': 'src/vercel-entry.ts' },
  outDir: 'api',
  format: ['esm'],
  platform: 'node',
  target: 'esnext',
  tsconfig: 'tsconfig.json',
  clean: false,
  bundle: true,
  splitting: false,
  sourcemap: false,
  dts: false,
  minify: false,
  watch: false,
};

export default [serverBuild, vercelApiBuild];
