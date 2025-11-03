'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { User, UserApiResponse, ApiErrorResponse } from '@/types';
import { clearSession, getSavedUser, setSession } from '@/lib/auth';
import { buildApiUrl, handleApiError, fetchWithTimeout, isNetworkError, sleep } from '@/lib/api';

interface LoginArgs {
  email: string;
  role?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoadingUserData: boolean;
  isGlobalLoading: boolean;
  isLoginInFlight: boolean;
  userLoadError: string | null;
  login: (args: LoginArgs) => void;
  logout: () => void;
  isRecruiter: boolean;
  isApplicant: boolean;
  hasRole: (role: string) => boolean;
  getAuthFetch: (pathOrUrl: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [isLoginInFlight, setIsLoginInFlight] = useState<boolean>(false);

  // Función para obtener datos del usuario desde la API
  const fetchUserData = useCallback(async (email: string): Promise<User | null> => {
    try {
      setIsLoadingUserData(true);
      setUserLoadError(null);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/findByEmail?email=${encodeURIComponent(email)}`;

      // Sin Authorization (no usamos JWT)
      let response = await fetchWithTimeout(url, { method: 'GET' }, 10000);

      if (response.ok) {
        const userData: UserApiResponse = await response.json();
        const saved = getSavedUser();
        const userType = saved?.role && saved.role.toLowerCase().includes('reclutador') ? 'reclutador' : 'postulante';
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          lastName: userData.lastName,
          password: '',
          type: userType,
        };
      } else {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: 'Error desconocido al obtener datos del usuario',
          details: [],
          timestamp: new Date().toISOString(),
        }));
        setUserLoadError(errorData.message || 'No se pudo cargar el usuario');
        return null;
      }
    } catch (error) {
      setUserLoadError('Error de red al obtener usuario');
      return null;
    } finally {
      setIsLoadingUserData(false);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const saved = getSavedUser();
      
      if (saved) {
        // Obtener datos completos del usuario desde la API
        const userData = await fetchUserData(saved.email);
        if (userData) {
          setUser(userData);
        } else {
          // No autenticar si no pudimos cargar datos del usuario
          clearSession();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsInitializing(false);
    };
    
    initializeAuth();
  }, [fetchUserData]);

  // Keep token in sync when storage changes (other tabs)
  useEffect(() => {
    const handler = () => {
      const saved = getSavedUser();
      if (saved) {
        // Obtener datos completos del usuario desde la API
        fetchUserData(saved.email).then((userData) => {
          if (userData) {
            setUser(userData);
          } else {
            // Fallback si no se pueden obtener los datos
            const u: User = {
              email: saved.email,
              name: saved.email,
              password: '',
              type: saved.role && saved.role.toLowerCase().includes('reclutador') ? 'reclutador' : 'postulante',
            };
            setUser(u);
          }
        });
      } else {
        setUser(null);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [fetchUserData]);

  const login = useCallback((args: LoginArgs) => {
    setSession({ email: args.email, role: args.role });
    
    // Obtener datos completos del usuario desde la API
    fetchUserData(args.email).then((userData) => {
      if (userData) {
        setUser(userData);
      } else {
        // Si no se pudo cargar, limpiar sesión para no permitir acceso parcial
        clearSession();
        setUser(null);
      }
    });
  }, [fetchUserData]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isInitializing,
    isLoadingUserData,
    userLoadError,
    login,
    logout,
    isRecruiter: !!user && user.type === 'reclutador',
    isApplicant: !!user && user.type === 'postulante',
    hasRole: (role: string) => {
      const saved = getSavedUser();
      return !!(saved?.role && saved.role.toLowerCase() === role.toLowerCase());
    },
    getAuthFetch: async (pathOrUrl: string, init?: RequestInit) => {
      const url = pathOrUrl.startsWith('http') ? pathOrUrl : buildApiUrl(pathOrUrl);
      const method = (init?.method || 'GET').toUpperCase();
      const isGet = method === 'GET';
      
      // Timeout especial para envío de entrevistas (archivos multimedia)
      const isInterviewFinish = pathOrUrl.includes('/finishInterview') || pathOrUrl.includes('/finish');
      const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
      
      let defaultTimeout = isGet ? 10000 : 12000;
      if (isInterviewFinish && isFormData) {
        defaultTimeout = 120000; // 2 minutos para archivos multimedia
      }
      
      const maxRetries = isGet ? 2 : 1;

      const isLogin = url.includes('/auth/login');
      setPendingRequests(prev => prev + 1);
      if (isLogin) setIsLoginInFlight(true);
      let attempt = 0;
      let lastError: any = null;
      try {
        while (attempt <= maxRetries) {
          try {
            const res = await fetchWithTimeout(url, {
              ...init,
              headers: {
                // Do not set Content-Type for FormData; browser will set proper boundaries
                ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
                ...(init?.headers || {}),
              },
            }, defaultTimeout);
            if (!res.ok) {
              // Reintentos solo para 5xx en GET; para POST solo si network error/timeout
              if (res.status >= 500 && res.status < 600 && isGet && attempt < maxRetries) {
                attempt++;
                await sleep(400 * attempt); // backoff simple
                continue;
              }
              throw new Error(await handleApiError(res));
            }
            return res;
          } catch (err: any) {
            lastError = err;
            const canRetry = isNetworkError(err) && attempt < maxRetries;
            if (canRetry) {
              attempt++;
              await sleep(400 * attempt);
              continue;
            }
            throw err;
          }
        }
        throw lastError || new Error('Error de red');
      } finally {
        setPendingRequests(prev => Math.max(0, prev - 1));
        if (isLogin) setIsLoginInFlight(false);
      }
    },
    isGlobalLoading: pendingRequests > 0,
    isLoginInFlight,
  }), [user, isInitializing, isLoadingUserData, userLoadError, login, logout, pendingRequests, isLoginInFlight]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
