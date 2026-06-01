/**
 * Single source for API URLs — set VITE_API_BASE_URL in .env (local) or Vercel env (production).
 * Accepts either the API origin (https://host) or a full versioned prefix (https://host/api/v1).
 * In dev without .env, falls back to the Vite proxy path /api/v1.
 */
const API_VERSION_PATH = '/api/v1';

function normalizeApiBaseUrl(url) {
  const trimmed = url.replace(/\/$/, '');
  if (/\/api\/v[\d.]+$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}${API_VERSION_PATH}`;
}

export function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return normalizeApiBaseUrl(url);
  if (import.meta.env.DEV) return API_VERSION_PATH;
  throw new Error(
    'VITE_API_BASE_URL is required for production builds (e.g. https://smartqueue-7dxl.onrender.com or https://smartqueue-7dxl.onrender.com/api/v1).'
  );
}

/** SignalR hub root (backend origin without /api/v* path). */
export function getHubBaseUrl() {
  const explicit = import.meta.env.VITE_HUB_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const api = getApiBaseUrl();
  if (api.startsWith('/')) return '';
  return api.replace(/\/api\/v[\d.]+$/i, '');
}
