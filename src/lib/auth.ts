// Simple auth helpers to manage session and JWT
import { INTERVIEWS_JWT as CONFIG_JWT } from '@/config';

export type SavedUser = { email: string; role?: string };

export function setSession(jwt: string, user: SavedUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('jwt', jwt);
  localStorage.setItem('authUser', JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('jwt');
  localStorage.removeItem('authUser');
}

// Decode JWT payload (unsafe, no signature verification, only for reading exp)
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const json = typeof window === 'undefined'
      ? Buffer.from(payload, 'base64').toString('utf-8')
      : decodeURIComponent(atob(payload).split('').map(c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const data = decodeJwtPayload(token);
  if (!data || typeof data.exp !== 'number') return false; // if no exp, assume not expired
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= data.exp;
}

export function getToken(): string {
  // Prefer runtime token
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt');
    if (token && token.trim()) {
      if (isTokenExpired(token)) {
        // auto clear expired token
        clearSession();
        return '';
      }
      return token;
    }
  }
  // Fallback (dev only). If fallback is expired, just return empty
  if (CONFIG_JWT && CONFIG_JWT.trim() && !isTokenExpired(CONFIG_JWT)) return CONFIG_JWT;
  return '';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getSavedUser(): SavedUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('authUser');
  if (!raw) return null;
  try { return JSON.parse(raw) as SavedUser; } catch { return null; }
}
