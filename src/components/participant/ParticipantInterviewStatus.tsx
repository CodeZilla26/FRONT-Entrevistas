'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, AlertCircle, CheckCircle, BarChart3, Users, Award } from 'lucide-react';
import { CompletedInterview, ApiErrorResponse } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface ParticipantInterviewStatusProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ParticipantInterviewStatus = ({ onShowToast }: ParticipantInterviewStatusProps) => {
  console.log('[ParticipantInterviewStatus] Componente renderizado');
  
  const { getAuthFetch, isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'status' | 'results'>('results'); // Empezar en resultados
  const [interviewResult, setInterviewResult] = useState<CompletedInterview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('[ParticipantInterviewStatus] Estado actual:', {
    isAuthenticated,
    userId: user?.id,
    hasInterviewResult: !!interviewResult,
    isLoading,
    error,
    activeTab
  });


  // Cargar resultados de la entrevista del participante
  const loadInterviewResults = async () => {
    console.log('[Resultados Entrevista] INICIO - loadInterviewResults ejecutado');
    console.log('[Resultados Entrevista] Estado:', { isAuthenticated, userId: user?.id });
    
    if (!isAuthenticated || !user?.id) {
      console.log('[Resultados Entrevista] No autenticado o sin ID de usuario');
      return;
    }

    console.log('[Resultados Entrevista] Iniciando carga...');
    setIsLoading(true);
    setError(null);

    try {
      console.log('[Resultados Entrevista] Cargando resultados para usuario:', user.id);
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/userinterview/findByUserId?userId=${user.id}`;
      console.log('[Resultados Entrevista] URL completa:', url);
      console.log('[Resultados Entrevista] API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });

      console.log('[Resultados Entrevista] Respuesta status:', res.status);

      if (res.ok) {
        const data: CompletedInterview = await res.json();
        console.log('[Resultados Entrevista] Datos recibidos:', data);
        
        setInterviewResult(data);
        onShowToast('Resultados cargados correctamente', 'success');
      } else {
        const errorData: ApiErrorResponse = await res.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: 'Error desconocido al cargar resultados',
          details: [],
          timestamp: new Date().toISOString()
        }));

        console.error('[Resultados Entrevista] Error del servidor:', {
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
        if (res.status !== 404) {
          onShowToast(errorMessage, 'error');
        } else {
          onShowToast('Aún no tienes resultados de entrevista', 'info');
        }
      }
    } catch (error) {
      console.error('[Resultados Entrevista] Error de red:', error);
      const errorMessage = 'Error de conexión al cargar resultados';
      setError(errorMessage);
      onShowToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('[ParticipantInterviewStatus] useEffect ejecutado', {
      isAuthenticated,
      userId: user?.id,
      activeTab
    });
    // Usar la misma API para ambos casos
    loadInterviewResults();
  }, [isAuthenticated, user?.id]);

  // Cargar resultados cuando se cambie al tab de resultados
  useEffect(() => {
    console.log('[ParticipantInterviewStatus] useEffect resultados ejecutado', {
      activeTab,
      isAuthenticated,
      userId: user?.id
    });
    if (activeTab === 'results') {
      console.log('[ParticipantInterviewStatus] Llamando loadInterviewResults...');
      loadInterviewResults();
    }
  }, [activeTab, isAuthenticated, user?.id]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Estado de Postulación</h2>
        <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-8 rounded-xl w-full max-w-2xl">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
            <p className="text-slate-300">Cargando tus entrevistas...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-100">Mi Panel</h2>
        
        {/* Tab Navigation */}
        <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-600/30">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'status'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Estado</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'results'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Resultados</span>
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'status' ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-300 mb-2">Entrevista Completada</h3>
          <p className="text-slate-400 mb-4">Ya completaste tu entrevista. Ve al tab "Resultados" para ver tu puntuación.</p>
          <button
            onClick={() => setActiveTab('results')}
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Ver Resultados
          </button>
        </div>
      ) : (
        // Tab de Resultados
        <div className="w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
              <p className="text-slate-300 ml-3">Cargando resultados...</p>
            </div>
          ) : error && !interviewResult ? (
            <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-600/30 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-300 mb-2">Error al cargar resultados</h3>
              <p className="text-slate-400 mb-4">{error}</p>
              <button
                onClick={loadInterviewResults}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : !interviewResult ? (
            <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-600/30 text-center">
              <BarChart3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Sin Resultados</h3>
              <p className="text-slate-400 mb-4">Aún no tienes resultados de entrevista disponibles</p>
              <button
                onClick={loadInterviewResults}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Verificar Resultados
              </button>
            </div>
          ) : (
            // Mostrar resultados de la entrevista
            <div className="space-y-6">
              {/* Header con puntuación */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 p-8 rounded-xl border border-slate-600/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                      interviewResult.score >= 80 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                      interviewResult.score >= 60 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                      'bg-gradient-to-br from-red-500 to-red-600'
                    }`}>
                      {interviewResult.score}
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-slate-100 mb-2">
                        {interviewResult.interviewTitle}
                      </h3>
                      <div className="flex items-center space-x-4 text-slate-300">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-indigo-400" />
                          <span>{interviewResult.userName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <span>{new Date(interviewResult.date).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span>{Math.floor(interviewResult.duration / 60)}:{(interviewResult.duration % 60).toString().padStart(2, '0')} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-4xl font-bold text-slate-100">{interviewResult.score}</p>
                    <p className="text-slate-400">de 100</p>
                    <div className={`mt-2 px-4 py-2 rounded-full text-sm font-medium ${
                      interviewResult.score >= 80 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      interviewResult.score >= 60
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {interviewResult.score >= 80 ? 'Excelente' : 
                       interviewResult.score >= 60 ? 'Bueno' : 
                       'Necesita Mejora'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas de respuestas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Total Preguntas</p>
                      <p className="text-3xl font-bold text-slate-100">{interviewResult.answers.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-indigo-400" />
                  </div>
                </div>
                
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Promedio por Pregunta</p>
                      <p className="text-3xl font-bold text-slate-100">
                        {interviewResult.answers.length > 0 ? 
                          (interviewResult.answers.reduce((acc, ans) => acc + ans.points, 0) / interviewResult.answers.length).toFixed(1) : 
                          '0'}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Estado</p>
                      <p className="text-xl font-bold text-slate-100 capitalize">{interviewResult.state.toLowerCase()}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Detalles de respuestas */}
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600/30">
                <h4 className="text-xl font-semibold text-slate-100 mb-6 flex items-center space-x-2">
                  <FileText className="w-6 h-6 text-indigo-400" />
                  <span>Detalles de Respuestas</span>
                </h4>
                
                <div className="space-y-4">
                  {interviewResult.answers.map((answer, index) => (
                    <div key={index} className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-slate-100 mb-2">
                            Pregunta {index + 1}
                          </h5>
                          <p className="text-slate-300 text-sm mb-3">{answer.questionText}</p>
                          <p className="text-slate-400 text-sm italic">"{answer.responseText}"</p>
                        </div>
                        
                        <div className="ml-4 text-right">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${
                            answer.points >= 80 ? 'bg-emerald-500' :
                            answer.points >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}>
                            {answer.points}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">puntos</p>
                        </div>
                      </div>
                      
                      {answer.description && (
                        <div className="bg-slate-800/40 p-3 rounded-lg border-l-4 border-indigo-500">
                          <p className="text-slate-300 text-sm">{answer.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de actualizar resultados */}
              <div className="text-center">
                <button
                  onClick={loadInterviewResults}
                  className="bg-slate-700 text-slate-200 font-medium py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Actualizar Resultados
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
