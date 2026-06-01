/**
 * Extract user-facing message from Axios or API errors.
 */
export function getApiError(error) {
  if (!error) return 'Something went wrong. Please try again.';
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return 'Unable to reach the server. Check your connection and API URL.';
  }
  const data = error.response?.data;
  if (data?.message) return data.message;
  if (data?.errors && typeof data.errors === 'object') {
    const msgs = Object.values(data.errors).flat();
    if (msgs.length) return msgs.join('. ');
  }
  if (typeof data === 'string') return data;
  if (error.message) return error.message;
  return 'Something went wrong. Please try again.';
}

/**
 * Normalize backend paged payloads from response.data.data
 */
export function normalizePaged(data) {
  if (!data) {
    return { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1 };
  }

  // Double-wrapped: { data: { items: [] } }
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return normalizePaged(data.data);
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      pageNumber: 1,
      pageSize: data.length,
      totalCount: data.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    };
  }

  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.Items)
      ? data.Items
      : [];

  const totalCount = data.totalCount ?? data.TotalCount ?? items.length;
  const pageSize = data.pageSize ?? data.PageSize ?? 10;
  const pageNumber = data.pageNumber ?? data.PageNumber ?? 1;
  const totalPages =
    data.totalPages ??
    data.TotalPages ??
    (pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1);

  return {
    items,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    hasPrevious: data.hasPrevious ?? data.HasPrevious ?? pageNumber > 1,
    hasNext: data.hasNext ?? data.HasNext ?? pageNumber < totalPages,
  };
}
