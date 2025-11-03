import { useState, useCallback, useRef } from 'react';
import { ToastMessage } from '@/types';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  // Verbosidad centralizada: 'silent' | 'errors' | 'reduced' | 'normal'
  // reduced = solo error y success (ignora info)
  const verbosity: 'silent' | 'errors' | 'reduced' | 'normal' = (process.env.NEXT_PUBLIC_TOAST_VERBOSITY as any) || 'reduced';

  // Throttle y dedupe por mensaje+tipo
  const lastShownRef = useRef<Record<string, number>>({});
  const THROTTLE_MS = 1500; // evitar spam

  const showToast = useCallback((
    message: string, 
    type: ToastMessage['type'] = 'info', 
    duration: number = 3000
  ) => {
    // Filtrado por verbosidad
    if (verbosity === 'silent') return;
    if (verbosity === 'errors' && type !== 'error') return;
    if (verbosity === 'reduced' && !(type === 'error' || type === 'success')) return;

    // Clave para dedupe/throttle
    const key = `${type}::${message}`;
    const now = Date.now();
    const last = lastShownRef.current[key] || 0;
    if (now - last < THROTTLE_MS) {
      // Ignorar duplicados en ventana de throttle
      return;
    }
    lastShownRef.current[key] = now;

    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, [verbosity]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};
