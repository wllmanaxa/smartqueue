/**
 * Single source for API URLs — prefer VITE_API_BASE_URL from .env
 * In dev without .env, falls back to Vite proxy path /api/v1.0
 */
export function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  if (import.meta.env.DEV) return '/api/v1.0';
  console.warn('[Smart Queue] Set VITE_API_BASE_URL in Frontend/.env');
  return '';
}

/** SignalR hub root */
export function getHubBaseUrl() {
  const api = getApiBaseUrl();
  if (!api) return '';
  if (api.startsWith('/')) return '';
  return api.replace(/\/api\/v[\d.]+$/i, '');
}
