/**
 * Normalizes a repository URL for storage and duplicate comparison
 * (the documented duplicate rule, docs/implementation-plan.md §6.2):
 * trims whitespace, strips `#hash` and `?query`, drops trailing slashes.
 * Scheme/host/path case is preserved — repository paths are case-sensitive.
 */
export function normalizeRepoUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    // Zod's `z.url()` already rejected invalid URLs; graceful fallback keeps
    // the behaviour total if this helper is called elsewhere.
    return rawUrl.trim().replace(/\/+$/, '');
  }
}
