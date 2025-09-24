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
      {/* Header del Dashboard */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">Dashboard de Calificaciones</h1>
            <p className="text-slate-400">Análisis completo de tu rendimiento en la entrevista</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 rounded-xl border border-indigo-500/30">
              <span className="text-indigo-300 text-sm font-medium">Evaluación Completada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del Dashboard */}
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
          // Dashboard de Calificaciones
          <div className="space-y-8">
            {/* Tarjeta Principal Unificada */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-600/30 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 border-b border-slate-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100 mb-1">{interviewResult.interviewTitle}</h2>
                    <div className="flex items-center space-x-4 text-slate-400 text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{interviewResult.userName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(interviewResult.date).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{Math.floor(interviewResult.duration / 60)}:{(interviewResult.duration % 60).toString().padStart(2, '0')} min</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                    interviewResult.score >= 80 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    interviewResult.score >= 60
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}>
                    {interviewResult.score >= 80 ? '🏆 EXCELENTE' : 
                     interviewResult.score >= 60 ? '👍 BUENO' : 
                     '📈 MEJORABLE'}
                  </div>
                </div>
              </div>

              {/* Contenido Principal */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Calificación Principal */}
                  <div className="lg:col-span-1 flex flex-col items-center justify-center">
                    <div className={`relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl mb-4 ${
                      interviewResult.score >= 80 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                      interviewResult.score >= 60 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                      'bg-gradient-to-br from-red-500 to-red-600'
                    }`}>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-white">{interviewResult.score}</div>
                        <div className="text-sm text-white/80">de 100</div>
                      </div>
                      {/* Anillo de progreso */}
                      <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="rgba(255,255,255,0.6)"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${(interviewResult.score / 100) * 283} 283`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-400 text-center text-sm">Puntuación General</p>
                  </div>

                  {/* Métricas Integradas */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/20">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-100">{interviewResult.answers.length}</p>
                            <p className="text-xs text-slate-400">Preguntas Respondidas</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/20">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-100">
                              {interviewResult.answers.length > 0 ? 
                                (interviewResult.answers.reduce((acc, ans) => acc + ans.points, 0) / interviewResult.answers.length).toFixed(1) : 
                                '0'}
                            </p>
                            <p className="text-xs text-slate-400">Promedio por Pregunta</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/20">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-100">
                              {interviewResult.answers.filter(ans => ans.points >= 80).length}
                            </p>
                            <p className="text-xs text-slate-400">Respuestas Excelentes</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/20">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-100 capitalize">{interviewResult.state.toLowerCase()}</p>
                            <p className="text-xs text-slate-400">Estado de Evaluación</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis Detallado de Respuestas */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-600/30 shadow-2xl overflow-hidden">
              {/* Header del análisis */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 border-b border-slate-600/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-100">Análisis Detallado</h3>
                      <p className="text-slate-400 text-sm">Rendimiento por pregunta</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-100">{interviewResult.answers.length}</p>
                    <p className="text-slate-400 text-sm">preguntas</p>
                  </div>
                </div>
              </div>

              {/* Grid de preguntas */}
              <div className="p-6">
                <div className="grid gap-4">
                  {interviewResult.answers.map((answer, index) => {
                    const percentage = (answer.points / 100) * 100;
                    return (
                      <div key={index} className="group hover:bg-slate-700/20 transition-all duration-300 rounded-xl p-5 border border-slate-600/20 hover:border-slate-500/40">
                        <div className="flex items-start gap-4">
                          {/* Número y puntuación */}
                          <div className="flex-shrink-0 text-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-2 border border-indigo-500/30">
                              <span className="text-indigo-300 font-bold">{index + 1}</span>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                              answer.points >= 80 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                              answer.points >= 60 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                              'bg-gradient-to-br from-red-500 to-red-600'
                            }`}>
                              {answer.points}
                            </div>
                          </div>

                          {/* Contenido de la pregunta */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-3">
                              <h4 className="font-semibold text-slate-100 mb-2 group-hover:text-indigo-300 transition-colors">
                                {answer.questionText}
                              </h4>
                              
                              {/* Barra de progreso horizontal */}
                              <div className="w-full bg-slate-600/50 rounded-full h-2 mb-3">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-1000 ${
                                    answer.points >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                    answer.points >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                                    'bg-gradient-to-r from-red-500 to-red-400'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Respuesta del usuario */}
                            <div className="bg-slate-800/40 p-4 rounded-lg border-l-4 border-indigo-500/50 mb-3">
                              <p className="text-slate-300 text-sm leading-relaxed">
                                <span className="text-indigo-300 font-medium">Tu respuesta:</span> "{answer.responseText}"
                              </p>
                            </div>

                            {/* Feedback si existe */}
                            {answer.description && (
                              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 rounded-lg border border-blue-500/20">
                                <div className="flex items-start space-x-2">
                                  <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  </div>
                                  <p className="text-blue-200 text-sm leading-relaxed">{answer.description}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Indicador de rendimiento */}
                          <div className="flex-shrink-0 text-right">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                              answer.points >= 80 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              answer.points >= 60
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                              {answer.points >= 80 ? 'EXCELENTE' : 
                               answer.points >= 60 ? 'BUENO' : 
                               'MEJORABLE'}
                            </div>
                            <p className="text-slate-500 text-xs mt-1">{percentage.toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botón de Actualizar */}
            <div className="text-center">
              <button
                onClick={loadInterviewResults}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-8 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🔄 Actualizar Resultados
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
