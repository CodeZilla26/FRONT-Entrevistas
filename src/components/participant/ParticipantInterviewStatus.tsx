'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { PracticanteInterview, ApiErrorResponse } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface ParticipantInterviewStatusProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ParticipantInterviewStatus = ({ onShowToast }: ParticipantInterviewStatusProps) => {
  const { getAuthFetch, isAuthenticated, user } = useAuth();
  const [interviews, setInterviews] = useState<PracticanteInterview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar entrevistas asignadas al practicante
  const loadPracticanteInterviews = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('[Practicante Entrevistas] No autenticado o sin ID de usuario');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Practicante Entrevistas] Cargando entrevistas para practicante:', user.id);
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/interview/listInterviewPracticante?practicanteId=${user.id}`;
      console.log('[Practicante Entrevistas] URL:', url);
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });

      console.log('[Practicante Entrevistas] Respuesta status:', res.status);

      if (res.ok) {
        const data: PracticanteInterview = await res.json();
        console.log('[Practicante Entrevistas] Datos recibidos:', data);
        
        // La API devuelve un solo objeto, no un array
        setInterviews([data]);
        onShowToast('Entrevistas cargadas correctamente', 'success');
      } else {
        const errorData: ApiErrorResponse = await res.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: 'Error desconocido al cargar entrevistas',
          details: [],
          timestamp: new Date().toISOString()
        }));

        console.error('[Practicante Entrevistas] Error del servidor:', {
          status: res.status,
          statusText: res.statusText,
          errorData,
          url
        });

        let errorMessage = 'Error al cargar entrevistas';
        
        switch (res.status) {
          case 400:
            errorMessage = `Error de validación: ${errorData.message || 'Datos inválidos'}`;
            break;
          case 401:
            errorMessage = 'No autorizado. Por favor inicia sesión nuevamente';
            break;
          case 403:
            errorMessage = 'No tienes permisos para ver estas entrevistas';
            break;
          case 404:
            errorMessage = 'No se encontraron entrevistas asignadas';
            setInterviews([]); // Limpiar entrevistas si no hay ninguna
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
          onShowToast('No tienes entrevistas asignadas aún', 'info');
        }
      }
    } catch (error) {
      console.error('[Practicante Entrevistas] Error de red:', error);
      const errorMessage = 'Error de conexión al cargar entrevistas';
      setError(errorMessage);
      onShowToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar entrevistas al montar el componente
  useEffect(() => {
    loadPracticanteInterviews();
  }, [isAuthenticated, user?.id]);

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

  if (error && interviews.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Estado de Postulación</h2>
        <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-8 rounded-xl w-full max-w-2xl">
          <div className="p-6 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl border-l-4 border-red-400">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div>
                <p className="font-semibold text-xl text-red-300">Error</p>
                <p className="text-sm text-red-200 mt-1">{error}</p>
              </div>
            </div>
          </div>
          <button
            onClick={loadPracticanteInterviews}
            className="mt-4 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Estado de Postulación</h2>
        <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-8 rounded-xl w-full max-w-2xl">
          <div className="p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border-l-4 border-yellow-400">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="font-semibold text-xl text-yellow-300">Sin Entrevistas Asignadas</p>
                <p className="text-sm text-yellow-200 mt-1">Aún no tienes entrevistas asignadas. Espera a que un reclutador te asigne una.</p>
              </div>
            </div>
          </div>
          <button
            onClick={loadPracticanteInterviews}
            className="mt-4 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <h2 className="text-3xl font-bold mb-6 text-slate-100">Estado de Postulación</h2>
      
      <div className="grid gap-6">
        {interviews.map((interview) => (
          <div key={interview.id} className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-6 rounded-xl">
            {/* Header de la entrevista */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">{interview.title}</h3>
                <p className="text-slate-300 text-sm">{interview.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {interview.active ? (
                  <div className="flex items-center space-x-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                    <CheckCircle size={16} />
                    <span>Activa</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-sm">
                    <AlertCircle size={16} />
                    <span>Inactiva</span>
                  </div>
                )}
              </div>
            </div>

            {/* Información de la entrevista */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-slate-300">
                <Calendar size={16} />
                <span className="text-sm">Creada: {new Date(interview.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <FileText size={16} />
                <span className="text-sm">{interview.questions.length} preguntas</span>
              </div>
            </div>

            {/* Preguntas */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-slate-100 mb-3">Preguntas de la Entrevista</h4>
              <div className="space-y-3">
                {interview.questions.map((question, index) => (
                  <div key={index} className="bg-slate-600/30 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-slate-200 font-medium">Pregunta {index + 1}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{question.time}s</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText size={14} />
                          <span>{question.points} pts</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">{question.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-4 flex justify-end">
              {interview.active ? (
                <button className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-xl hover:bg-indigo-700 transition-colors">
                  Iniciar Entrevista
                </button>
              ) : (
                <button disabled className="bg-gray-600 text-gray-400 font-semibold py-2 px-6 rounded-xl cursor-not-allowed">
                  Entrevista No Disponible
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botón de actualizar */}
      <div className="mt-6 text-center">
        <button
          onClick={loadPracticanteInterviews}
          className="bg-slate-700 text-slate-200 font-medium py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
        >
          Actualizar Estado
        </button>
      </div>
    </div>
  );
};
