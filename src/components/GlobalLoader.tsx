"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function GlobalLoader() {
  const { isInitializing, isLoadingUserData, isGlobalLoading, isLoginInFlight } = useAuth();
  const visible = isInitializing || isLoadingUserData || isGlobalLoading;

  const title = isLoginInFlight
    ? 'Iniciando sesión...'
    : isLoadingUserData || isInitializing
    ? 'Cargando sesión...'
    : 'Cargando...';

  const subtitle = isLoginInFlight
    ? 'Validando credenciales'
    : isLoadingUserData || isInitializing
    ? 'Cargando datos de usuario'
    : 'Procesando solicitud';

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, padding: 20, borderRadius: 12,
        background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(148,163,184,0.25)'
      }}>
        <div className="animate-spin" style={{
          width: 36, height: 36,
          border: '3px solid rgba(255,255,255,0.35)',
          borderTopColor: 'transparent', borderRadius: '50%'
        }} />
        <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{title}</div>
        <div style={{ color: '#94a3b8', fontSize: 12 }}>{subtitle}</div>
      </div>
    </div>
  );
}
