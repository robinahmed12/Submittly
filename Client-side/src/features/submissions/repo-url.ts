/**
 * Normalises a repository URL the same way the server does.
 *
 * The server's `lib/repo-url.ts` trims whitespace, strips `#hash` and
 * `?query`, and drops trailing slashes before storing and comparing. This
 * is a **client-side mirror** used only to warn the student early — the
 * authoritative duplicate check is the database unique constraint.
 */
export function normalizeRepoUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    // The Zod schema already rejected invalid URLs; this fallback keeps the
    // helper total if it is called elsewhere.
    return rawUrl.trim().replace(/\/+$/, '');
  }
}
