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
    console.log(`[useParticipantDashboard #${requestId}] INICIO - loadInterviewResults ejecutado`, { force });
    console.log(`[useParticipantDashboard #${requestId}] Estado:`, { isAuthenticated, userId: user?.id, hasData: !!interviewResult });
    
    // No cargar si ya hay una carga en curso (a menos que se fuerce)
    if (isLoading && !force) {
      console.log(`[useParticipantDashboard #${requestId}] Ya hay una carga en curso, omitiendo`);
      return { success: false, error: 'Carga en curso' };
    }

    if (!isAuthenticated || !user?.id) {
      console.log(`[useParticipantDashboard #${requestId}] No autenticado o sin ID de usuario`);
      return { success: false, error: 'No autenticado' };
    }

    // Evitar cargar si ya tenemos datos y no se fuerza la recarga
    if (interviewResult && !force) {
      console.log(`[useParticipantDashboard #${requestId}] Ya hay datos cargados, omitiendo carga`);
      return { success: true, data: interviewResult };
    }

    console.log('[useParticipantDashboard] Iniciando carga...');
    const loadingStartTime = performance.now();
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
    
    // Actualizar la pestaña activa primero
    setActiveTab(tabId as 'interview' | 'results');
    
    // Solo cargar resultados si vamos a la pestaña de resultados
    if (tabId === 'results') {
      // Siempre cargar al cambiar a la pestaña de resultados
      // pero solo si no hay datos o hay un error
      const shouldLoad = !interviewResult || !!error;
      console.log(`[useParticipantDashboard] Debería cargar resultados? ${shouldLoad}`, {
        hasData: !!interviewResult,
        hasError: !!error
      });
      
      if (shouldLoad) {
        loadInterviewResults(true); // Forzar recarga para asegurar datos actualizados
      }
    } else {
      // Limpiar solo el error, mantener los datos cargados
      setError(null);
    }
  }, [loadInterviewResults, interviewResult, error]);

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

  // Efecto de montaje - ya no carga datos automáticamente
  // La carga ahora se maneja exclusivamente a través del cambio de pestaña
  useEffect(() => {
    console.log('[useParticipantDashboard] Efecto de montaje ejecutado');
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
