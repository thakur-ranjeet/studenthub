import { useCallback, useEffect, useState } from 'react';

// Small data-fetching hook: { data, error, loading, reload }.
// Keeps the previous data while reloading so tables do not flicker.
export function useResource(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher().then(
      (data) => alive && setState({ data, error: null, loading: false, updatedAt: Date.now() }),
      (error) => alive && setState({ data: null, error, loading: false, updatedAt: null }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
