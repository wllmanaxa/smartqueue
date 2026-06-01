import { useCallback, useMemo, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

export function usePagination(initial = { pageNumber: 1, pageSize: 10 }) {
  const [pageNumber, setPageNumber] = useState(initial.pageNumber);
  const [pageSize] = useState(initial.pageSize);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const params = useMemo(
    () => ({
      pageNumber,
      pageSize,
      search: debouncedSearch.trim() || undefined,
    }),
    [pageNumber, pageSize, debouncedSearch]
  );

  const next = useCallback((totalPages) => {
    setPageNumber((p) => Math.min(p + 1, totalPages || p + 1));
  }, []);

  const prev = useCallback(() => {
    setPageNumber((p) => Math.max(1, p - 1));
  }, []);

  const reset = useCallback(() => setPageNumber(1), []);

  const setSearchAndReset = useCallback((value) => {
    setSearch(value);
    setPageNumber(1);
  }, []);

  return {
    pageNumber,
    pageSize,
    search,
    setSearch,
    setSearchAndReset,
    debouncedSearch,
    params,
    setPageNumber,
    next,
    prev,
    reset,
  };
}
