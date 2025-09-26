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
  const loadInterviewResults = useCallback(async () => {
    console.log('[useParticipantDashboard] INICIO - loadInterviewResults ejecutado');
    console.log('[useParticipantDashboard] Estado:', { isAuthenticated, userId: user?.id });
    
    if (!isAuthenticated || !user?.id) {
      console.log('[useParticipantDashboard] No autenticado o sin ID de usuario');
      return;
    }

    console.log('[useParticipantDashboard] Iniciando carga...');
    setIsLoading(true);
    setError(null);

    try {
      console.log('[useParticipantDashboard] Cargando resultados para usuario:', user.id);
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/userinterview/findByUserId?userId=${user.id}`;
      console.log('[useParticipantDashboard] URL completa:', url);
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });

      console.log('[useParticipantDashboard] Respuesta status:', res.status);

      if (res.ok) {
        const data: CompletedInterview = await res.json();
        console.log('[useParticipantDashboard] Datos recibidos:', data);
        console.log('[useParticipantDashboard] Estructura de datos completa:', {
          hasAnswers: !!data.answers,
          answersType: typeof data.answers,
          answersLength: data.answers?.length,
          hasState: !!data.state,
          stateValue: data.state,
          hasScore: !!data.score,
          scoreValue: data.score,
          hasInterviewTitle: !!data.interviewTitle,
          hasUserName: !!data.userName,
          hasDate: !!data.date,
          hasDuration: !!data.duration,
          fullData: data
        });
        
        setInterviewResult(data);
        return { success: true, data };
      } else {
        const errorData: ApiErrorResponse = await res.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: 'Error desconocido al cargar resultados',
          details: [],
          timestamp: new Date().toISOString()
        }));

        console.error('[useParticipantDashboard] Error del servidor:', {
          status: res.status,
          statusText: res.statusText,
          errorData,
          url
        });

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
      console.error('[useParticipantDashboard] Error de red:', error);
      const errorMessage = 'Error de conexión al cargar resultados';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [getAuthFetch, isAuthenticated, user?.id]);

  // Manejar cambio de tab
  const handleTabChange = useCallback((tabId: string) => {
    console.log('[useParticipantDashboard] Cambiando a tab:', tabId);
    setActiveTab(tabId as 'interview' | 'results');
    
    // Limpiar estados al cambiar de tab
    if (tabId === 'results') {
      loadInterviewResults();
    } else {
      setError(null);
    }
  }, [loadInterviewResults]);

  // Manejar logout
  const handleLogout = useCallback(async () => {
    try {
      console.log('[useParticipantDashboard] Cerrando sesión...');
      
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
      console.error('[useParticipantDashboard] Error al cerrar sesión:', error);
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

  // Cargar datos según el tab activo
  useEffect(() => {
    console.log('[useParticipantDashboard] useEffect ejecutado', {
      isAuthenticated,
      userId: user?.id,
      activeTab
    });
    
    if (activeTab === 'results' && isAuthenticated && user?.id) {
      console.log('[useParticipantDashboard] Cargando resultados automáticamente...');
      loadInterviewResults();
    }
  }, [activeTab, isAuthenticated, user?.id, loadInterviewResults]);

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
