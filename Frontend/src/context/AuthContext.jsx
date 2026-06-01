import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';
import { getApiError } from '../api/helpers';
import { getRoleFromPayload, getUserIdFromPayload, parseJwt } from '../utils/jwt';

const AuthContext = createContext(null);

function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 > Date.now() + 5000;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && isTokenValid(storedToken)) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          /* ignore */
        }
      }
      const payload = parseJwt(storedToken);
      if (payload) {
        const u = {
          id: getUserIdFromPayload(payload),
          userName: payload.unique_name || payload.name || '',
          email: payload.email || '',
          role: getRoleFromPayload(payload),
        };
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      }
    } else if (storedToken) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    setAuthReady(true);
  }, []);

  const login = useCallback(async (userName, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(userName, password);
      const accessToken = data?.accessToken ?? data?.AccessToken;
      const refreshToken = data?.refreshToken ?? data?.RefreshToken;
      if (!accessToken) {
        throw new Error('Invalid login response');
      }
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      setToken(accessToken);
      const payload = parseJwt(accessToken);
      const u = {
        id: getUserIdFromPayload(payload),
        userName: payload?.unique_name || userName,
        email: payload?.email || '',
        role: getRoleFromPayload(payload),
      };
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
      return u;
    } catch (e) {
      const err = new Error(getApiError(e));
      err.response = e.response;
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      authReady,
      isAuthenticated: !!token && isTokenValid(token),
      login,
      logout,
    }),
    [token, user, loading, authReady, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
