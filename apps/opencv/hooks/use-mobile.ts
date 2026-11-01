import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/**
 * Whether the viewport is phone-width.
 *
 * useSyncExternalStore rather than state updated from an effect: matchMedia
 * is an external store, and this subscribes to one without the extra render
 * that answers wrongly first. The server snapshot is false, because a
 * prerender has no viewport to measure and the wide layout is the one that
 * belongs in the HTML.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
