"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthErrorPanel from './AuthErrorPanel';

export default function RequireAuth({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Array<'reclutador' | 'postulante'> }) {
  const { isAuthenticated, isInitializing, user, userLoadError } = useAuth();

  // Mostrar nada mientras inicializa (GlobalLoader cubrirá)
  if (isInitializing) return null;

  // Si hubo error cargando el usuario, mostrar panel de error
  if (userLoadError) {
    return (
      <AuthErrorPanel
        message={userLoadError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // No autenticado
  if (!isAuthenticated || !user) {
    return (
      <AuthErrorPanel
        message="No estás autenticado. Inicia sesión para continuar."
      />
    );
  }

  // Roles
  if (allowedRoles && !allowedRoles.includes(user.type as any)) {
    return (
      <AuthErrorPanel
        message="No tienes permisos para acceder a esta sección."
      />
    );
  }

  return <>{children}</>;
}
