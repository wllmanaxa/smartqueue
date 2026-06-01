import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../api/helpers';

export const emptyPaged = {
  items: [],
  totalPages: 1,
  totalCount: 0,
  pageNumber: 1,
  pageSize: 10,
};

/**
 * Stable paginated list fetching with abort, stale-while-revalidate, and auth gate.
 */
export function usePagedList(fetcher, { params, enabled = true, onError } = {}) {
  const { isAuthenticated, authReady } = useAuth();
  const [data, setData] = useState(emptyPaged);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchIdRef = useRef(0);
  const abortRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const paramsKey = JSON.stringify(params ?? {});

  const reload = useCallback(async () => {
    if (!enabled || !authReady || !isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++fetchIdRef.current;

    const isRefresh = hasLoadedRef.current;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetcher(params, { signal: controller.signal });
      if (requestId !== fetchIdRef.current) return;
      const next = result ?? emptyPaged;
      setData(next);
      hasLoadedRef.current = (next.items?.length ?? 0) > 0;
    } catch (e) {
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return;
      if (requestId !== fetchIdRef.current) return;
      const message = getApiError(e);
      setError(message);
      onErrorRef.current?.(message);
      if (!isRefresh) {
        setData(emptyPaged);
        hasLoadedRef.current = false;
      }
    } finally {
      if (requestId === fetchIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetcher, paramsKey, enabled, authReady, isAuthenticated]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { data, loading, refreshing, error, reload };
}
