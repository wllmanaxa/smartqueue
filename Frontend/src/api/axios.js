import axios from 'axios';
import { getApiBaseUrl } from './config';
import { getApiError, normalizePaged } from './helpers';

const baseURL = getApiBaseUrl();

const api = axios.create({
  baseURL: baseURL || undefined,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

let refreshPromise = null;

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

function redirectToLogin() {
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh || !baseURL) return null;

  if (!refreshPromise) {
    refreshPromise = api
      .post('Auth/refresh', { refreshToken: refresh }, { _skipAuthRetry: true })
      .then((res) => {
        const body = res.data;
        const tokenData = body?.data ?? body;
        const accessToken = tokenData?.accessToken ?? tokenData?.AccessToken;
        const newRefresh = tokenData?.refreshToken ?? tokenData?.RefreshToken;
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
          return accessToken;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  if (!config._skipAuthRetry) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (original._skipAuthRetry) {
      clearAuthStorage();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (!original._retry) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    clearAuthStorage();
    redirectToLogin();
    return Promise.reject(error);
  }
);

/** Unwrap { success, message, data } from axios response */
export function unwrap(response) {
  const body = response?.data;
  if (body && typeof body.success === 'boolean') {
    if (!body.success) {
      const err = new Error(body.message || 'Request failed');
      err.response = response;
      throw err;
    }
    return body.data;
  }
  return body;
}

/** Unwrap paginated list: response.data.data.items */
export function unwrapPaged(response) {
  const body = response?.data;
  if (body && typeof body.success === 'boolean') {
    if (!body.success) {
      const err = new Error(body.message || 'Request failed');
      err.response = response;
      throw err;
    }
    return normalizePaged(body.data);
  }
  return normalizePaged(body);
}

export { getApiError, normalizePaged, baseURL as apiBaseUrl };
export default api;
