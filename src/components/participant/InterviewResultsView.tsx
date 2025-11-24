'use client';

import { Calendar, Clock, FileText, AlertCircle, CheckCircle, BarChart3, Users, Award } from 'lucide-react';
import { CompletedInterview } from '@/types';

interface InterviewResultsViewProps {
  interviewResult: CompletedInterview | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onRefresh: () => void;
}

export const InterviewResultsView = ({ 
  interviewResult, 
  isLoading, 
  error, 
  onRetry, 
  onRefresh 
}: InterviewResultsViewProps) => {
  
  // Debug logging
  console.log('[InterviewResultsView] Props recibidos:', {
    hasInterviewResult: !!interviewResult,
    isLoading,
    error,
    interviewResultData: interviewResult
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
        <p className="text-slate-300 ml-3">Cargando resultados...</p>
      </div>
    );
  }

  if (error && !interviewResult) {
    return (
      <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-600/30 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-300 mb-2">Error al cargar resultados</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!interviewResult) {
    return (
      <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-600/30 text-center">
        <BarChart3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">Sin Resultados</h3>
        <p className="text-slate-400 mb-4">Aún no tienes resultados de entrevista disponibles</p>
        <button
          onClick={onRetry}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Verificar Resultados
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tarjeta Principal Unificada */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-600/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 border-b border-slate-600/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-1">{interviewResult.interviewTitle || 'Entrevista sin título'}</h2>
              <div className="flex items-center space-x-4 text-slate-400 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{interviewResult.userName || 'Usuario desconocido'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{interviewResult.date ? new Date(interviewResult.date).toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  }) : 'Fecha no disponible'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{interviewResult.duration ? `${Math.floor(interviewResult.duration / 60)}:${(interviewResult.duration % 60).toString().padStart(2, '0')} min` : 'Duración no disponible'}</span>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${
              (interviewResult.score || 0) >= 80 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
              (interviewResult.score || 0) >= 60
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}>
              {(interviewResult.score || 0) >= 80 ? '🏆 EXCELENTE' : 
               (interviewResult.score || 0) >= 60 ? '👍 BUENO' : 
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
                (interviewResult.score || 0) >= 80 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                (interviewResult.score || 0) >= 60 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                'bg-gradient-to-br from-red-500 to-red-600'
              }`}>
                <div className="text-center">
                  <div className="text-5xl font-bold text-white">{interviewResult.score || 0}</div>
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
                    strokeDasharray={`${((interviewResult.score || 0) / 100) * 283} 283`}
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
                      <p className="text-2xl font-bold text-slate-100">{interviewResult.answers?.length || 0}</p>
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
                        {interviewResult.answers && interviewResult.answers.length > 0 ? 
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
                        {interviewResult.answers?.filter(ans => ans.points >= 80).length || 0}
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
                      <p className="text-lg font-bold text-slate-100 capitalize">{interviewResult.state?.toLowerCase() || 'Sin estado'}</p>
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
              <p className="text-2xl font-bold text-slate-100">{interviewResult.answers?.length || 0}</p>
              <p className="text-slate-400 text-sm">preguntas</p>
            </div>
          </div>
        </div>

        {/* Grid de preguntas */}
        <div className="p-6">
          <div className="grid gap-4">
            {!interviewResult.answers || interviewResult.answers.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Sin respuestas disponibles</h3>
                <p className="text-slate-400">No se encontraron respuestas para esta entrevista.</p>
              </div>
            ) : (
              interviewResult.answers.map((answer, index) => {
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
                          <span className="text-indigo-300 font-medium">Tu respuesta:</span> &ldquo;{(() => {
                            try {
                              const parsed = JSON.parse(answer.responseText);
                              return parsed.text || answer.responseText;
                            } catch {
                              return answer.responseText;
                            }
                          })()}&rdquo;
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
            }))}
          </div>
        </div>
      </div>

      {/* Botón de Actualizar */}
      <div className="text-center">
        <button
          onClick={onRefresh}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-8 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          🔄 Actualizar Resultados
        </button>
      </div>
    </div>
  );
};
