// Simple auth helpers to manage session without JWT

export type SavedUser = { email: string; role?: string };

export function setSession(user: SavedUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authUser', JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authUser');
}

export function getToken(): string {
  // No JWT in use
  return '';
}

export function isAuthenticated(): boolean {
  return !!getSavedUser();
}

export function getSavedUser(): SavedUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('authUser');
  if (!raw) return null;
  try { return JSON.parse(raw) as SavedUser; } catch { return null; }
}
