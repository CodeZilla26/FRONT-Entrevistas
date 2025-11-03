'use client';

import { useState, useEffect, useCallback } from 'react';
import { CompletedInterview, ApiErrorResponse } from '@/types';
import { useAuth } from '@/context/AuthContext';

export const useParticipantDashboard = () => {
  const { getAuthFetch, isAuthenticated, user, logout } = useAuth();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState<'interview' | 'results'>('interview');
  const [interviewResult, setInterviewResult] = useState<CompletedInterview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Cargar resultados de la entrevista del participante
  const loadInterviewResults = useCallback(async (force = false) => {
    const requestId = Date.now();
    
    // No cargar si ya hay una carga en curso (a menos que se fuerce)
    if (isLoading && !force) {
      return { success: false, error: 'Carga en curso' };
    }

    if (!isAuthenticated || !user?.id) {
      return { success: false, error: 'No autenticado' };
    }

    // Evitar cargar si ya tenemos datos y no se fuerza la recarga
    if (interviewResult && !force) {
      return { success: true, data: interviewResult };
    }

    const loadingStartTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/userinterview/findByUserId?userId=${user.id}`;
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });


      if (res.ok) {
        const data: CompletedInterview = await res.json();
        
        setInterviewResult(data);
        return { success: true, data };
      } else {
        const errorData: ApiErrorResponse = await res.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: 'Error desconocido al cargar resultados',
          details: [],
          timestamp: new Date().toISOString()
        }));

        let errorMessage = 'Error al cargar resultados';
        
        switch (res.status) {
          case 400:
            errorMessage = `Error de validación: ${errorData.message || 'Datos inválidos'}`;
            break;
          case 401:
            errorMessage = 'No autorizado. Por favor inicia sesión nuevamente';
            break;
          case 403:
            errorMessage = 'No tienes permisos para ver estos resultados';
            break;
          case 404:
            errorMessage = 'No se encontraron resultados de entrevista';
            setInterviewResult(null);
            break;
          case 500:
            errorMessage = `Error del servidor: ${errorData.message || 'Error interno'}`;
            break;
          default:
            errorMessage = `Error ${res.status}: ${errorData.message || 'Error desconocido'}`;
        }

        setError(errorMessage);
        return { success: false, error: errorMessage, status: res.status };
      }
    } catch (error) {
      const errorMessage = 'Error de conexión al cargar resultados';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [getAuthFetch, isAuthenticated, user?.id, interviewResult, isLoading]);

  // Manejar cambio de tab
  const handleTabChange = useCallback((tabId: string) => {
    // Actualizar la pestaña activa primero
    setActiveTab(tabId as 'interview' | 'results');
    
    // Solo cargar resultados si vamos a la pestaña de resultados
    if (tabId === 'results' && (!interviewResult || !!error)) {
      loadInterviewResults(true); // Forzar recarga para asegurar datos actualizados
    } else if (tabId !== 'results') {
      // Limpiar solo el error, mantener los datos cargados
      setError(null);
    }
  }, [loadInterviewResults, interviewResult, error]);
  // Manejar logout
  const handleLogout = useCallback(async () => {
    try {
      
      // Limpiar estados locales
      setInterviewResult(null);
      setError(null);
      setIsLoading(false);
      setActiveTab('interview');
      setIsSidebarCollapsed(false);
      
      // Ejecutar logout del contexto
      logout();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cerrar sesión' };
    }
  }, [logout]);

  // Manejar colapso del sidebar
  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  }, []);
  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Efecto de montaje - ya no carga datos automáticamente
  // La carga ahora se maneja exclusivamente a través del cambio de pestaña
  useEffect(() => {
    // No cargamos datos aquí, solo en handleTabChange
  }, []);

  return {
    // Estados
    activeTab,
    interviewResult,
    isLoading,
    error,
    isSidebarCollapsed,
    
    // Acciones
    handleTabChange,
    handleLogout,
    handleSidebarCollapse,
    loadInterviewResults,
    clearError,
    
    // Datos del usuario
    user,
    isAuthenticated
  };
};
