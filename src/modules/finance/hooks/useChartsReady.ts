import { useState, useEffect } from 'react';

/**
 * Defers chart rendering until after 2× requestAnimationFrame.
 *
 * Why double rAF?
 * - useEffect fires in the microtask queue, BEFORE the browser has completed
 *   its layout pass. At that point container dimensions are -1.
 * - First rAF: browser schedules the next paint.
 * - Second rAF: browser has finished layout and containers have real px sizes.
 *   Recharts can now measure correctly.
 *
 * Usage:
 *   const chartsReady = useChartsReady();
 *   return chartsReady ? <ResponsiveContainer ...> : null;
 */
export function useChartsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true))
    );
    return () => cancelAnimationFrame(id);
  }, []);
  return ready;
}
