import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `cacheComponents` is deliberately off. Enabling it is not a rename-only
  // change: it requires adopting the Cache Components model and surfaces build
  // errors for uncached data outside <Suspense>. This app reads cookies for
  // the session and leans on TanStack Query for interactivity, so the default
  // dynamic rendering model is the predictable fit. Revisit in Outlet 6 if the
  // server-rendered shells need caching.
  //
  // `partialPrefetching` is left unset for the same reason — it requires
  // `cacheComponents` and throws at config validation without it. Unset
  // behaves like `false`.
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
