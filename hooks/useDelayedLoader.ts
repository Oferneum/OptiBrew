import { useState, useEffect } from 'react';

/**
 * Returns true only if `isLoading` has been true for longer than `delayMs`.
 * This avoids flashing a loader for fast fetches while still showing one
 * for slow loads.
 */
export function useDelayedLoader(isLoading: boolean, delayMs = 1000): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [isLoading, delayMs]);

  return show;
}
