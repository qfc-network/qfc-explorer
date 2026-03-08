'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { getApiBaseUrl } from './api-client';

type AuthUser = {
  userId: string;
  email: string;
  displayName?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AUTH_TOKEN_KEY = 'qfc-auth-token';
const AUTH_USER_KEY = 'qfc-auth-user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const savedUser = localStorage.getItem(AUTH_USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {}
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const base = getApiBaseUrl();
    const url = base ? `${base}/auth/login` : '/api/auth/login';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Login failed');

    const newToken = data.data.accessToken;
    const newUser: AuthUser = {
      userId: data.data.user.id,
      email: data.data.user.email,
      displayName: data.data.user.displayName,
    };
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/**
 * Authenticated fetch — adds Bearer token if available.
 */
export async function authFetch(
  token: string | null,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const base = getApiBaseUrl();
  const isExternal = base.includes(':3001') ||
    (process.env.NEXT_PUBLIC_API_URL || '').length > 0;

  let url: string;
  if (isExternal && path.startsWith('/api/')) {
    url = `${base}${path.slice(4)}`;
  } else if (isExternal && path.startsWith('/api')) {
    url = `${base}${path.slice(4) || '/'}`;
  } else {
    url = `${base}${path}`;
  }

  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...init, headers });
}
