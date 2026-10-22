import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Whether the viewport is below the mobile breakpoint.
 *
 * Implemented with `useSyncExternalStore` rather than shadcn's stock
 * `useState` + `useEffect` version, because that one calls `setState` inside
 * the effect body — which `react-hooks/set-state-in-effect` forbids. The
 * media-query subscription is "external state", so the store API is the
 * idiomatic fit; the server snapshot is `false` and React re-renders on
 * hydration without a mismatch warning.
 */
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false,
  );
}
