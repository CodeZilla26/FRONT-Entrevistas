'use client';

import { Play, User, BarChart3, Award, FileText, Users } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { InterviewPanel } from '@/components/interview/InterviewPanel';
import { InterviewResultsView } from '@/components/participant/InterviewResultsView';
import { useParticipantDashboard } from '@/hooks/useParticipantDashboard';

interface ParticipantDashboardProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ParticipantInterviewStatus = ({ onShowToast }: ParticipantDashboardProps) => {
  console.log('[ParticipantDashboard] Componente renderizado');
  
  const {
    activeTab,
    interviewResult,
    isLoading,
    error,
    isSidebarCollapsed,
    handleTabChange,
    handleLogout,
    handleSidebarCollapse,
    loadInterviewResults,
    clearError,
    user,
    isAuthenticated
  } = useParticipantDashboard();

  console.log('[ParticipantDashboard] Estado actual:', {
    isAuthenticated,
    userId: user?.id,
    hasInterviewResult: !!interviewResult,
    isLoading,
    error,
    activeTab
  });

  // Definir items del sidebar
  const sidebarItems = [
    {
      id: 'interview',
      label: 'Iniciar Entrevista',
      icon: <Play className="w-5 h-5" />,
      isActive: activeTab === 'interview'
    },
    {
      id: 'results',
      label: 'Mis Resultados',
      icon: <BarChart3 className="w-5 h-5" />,
      isActive: activeTab === 'results'
    }
  ];

  // Manejar logout con toast
  const handleLogoutWithToast = async () => {
    const result = await handleLogout();
    if (result.success) {
      onShowToast('Sesión cerrada exitosamente', 'success');
    } else {
      onShowToast(result.error || 'Error al cerrar sesión', 'error');
    }
  };

  // Manejar carga de resultados con toast
  const handleLoadResultsWithToast = async () => {
    const result = await loadInterviewResults();
    if (result?.success) {
      onShowToast('Resultados cargados correctamente', 'success');
    } else if (result?.status !== 404) {
      onShowToast(result?.error || 'Error al cargar resultados', 'error');
    } else {
      onShowToast('Aún no tienes resultados de entrevista', 'info');
    }
  };


  return (
    <div className="w-full h-full flex">
      {/* Sidebar */}
      <Sidebar
        title="Dashboard Postulante"
        subtitle="Postulante"
        icon={<User className="w-6 h-6" />}
        items={sidebarItems}
        onItemClick={handleTabChange}
        onLogout={handleLogoutWithToast}
        onCollapseChange={handleSidebarCollapse}
        userEmail={user?.email}
        userName={user?.name}
        userLastName={user?.lastName}
      />

      {/* Contenido Principal */}
      <main className={`${isSidebarCollapsed ? 'ml-20' : 'ml-80'} bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-all duration-300 flex-1 ${
        activeTab === 'interview' ? 'h-screen overflow-hidden' : 'p-8 min-h-screen overflow-y-auto custom-scroll-green'
      } relative`}>
        {/* Efecto de gradiente decorativo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        {activeTab === 'interview' ? (
          <div className="h-full w-full">
            <InterviewPanel onShowToast={onShowToast} />
          </div>
        ) : (

          <div className="w-full h-full p-6 relative z-10">
            {/* Header del Dashboard con gradiente y blur mejorado */}
            <div className="bg-gradient-to-r from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50 shadow-xl relative overflow-hidden">
              {/* Efecto de gradiente sutil */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent bg-300% animate-gradient">
                          Dashboard de Calificaciones
                        </h1>
                        <p className="text-slate-400 text-sm mt-1.5">Análisis detallado de tu rendimiento en la entrevista</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="bg-gradient-to-r from-indigo-500/15 to-purple-500/15 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-indigo-500/20 flex items-center shadow-sm hover:shadow-indigo-500/10 transition-all duration-300">
                      <div className="w-2.5 h-2.5 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-indigo-300 text-sm font-medium">Evaluación Completada</span>
                    </div>
                    
                    <button 
                      onClick={handleLoadResultsWithToast}
                      className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 border border-indigo-500/30 hover:border-indigo-400/50 shadow-md hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
                    >
                      <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Actualizar</span>
                    </button>
                  </div>
                </div>
                
                {/* Indicadores rápidos mejorados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Puntuación Total</p>
                        <p className="text-2xl font-bold text-white">
                          {interviewResult?.score || '--'}
                          <span className="text-sm text-slate-400 ml-1.5">/ 100</span>
                        </p>
                        <div className="w-full bg-slate-700/50 rounded-full h-2 mt-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(100, interviewResult?.score || 0)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors duration-300">
                        <Award className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 group hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Preguntas</p>
                        <p className="text-2xl font-bold text-white">
                          {interviewResult?.answers?.length || '0'}
                          <span className="text-sm text-slate-400 ml-1.5">/ {interviewResult?.answers?.length || '0'}</span>
                        </p>
                        <div className="w-full bg-slate-700/50 rounded-full h-2 mt-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: interviewResult?.answers?.length ? '100%' : '0%' }}
                          ></div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors duration-300">
                        <FileText className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Estado</p>
                        <div className="flex items-center">
                          <p className="text-2xl font-bold text-white mr-2">
                            {interviewResult?.state || 'Completada'}
                          </p>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Última actualización: {new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-300">
                        <Users className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido del Dashboard mejorado */}
            <div className="w-full bg-gradient-to-br from-slate-800/50 via-slate-800/40 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl relative overflow-hidden">
              {/* Efecto de gradiente sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-200">Detalles de la Entrevista</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">Vista previa</span>
                    <div className="relative inline-block w-10 h-5">
                      <input type="checkbox" id="toggle-preview" className="opacity-0 w-0 h-0 peer" />
                      <label htmlFor="toggle-preview" className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-slate-700 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-5 peer-checked:bg-indigo-600"></label>
                    </div>
                  </div>
                </div>
                
                <InterviewResultsView
                  interviewResult={interviewResult}
                  isLoading={isLoading}
                  error={error}
                  onRetry={handleLoadResultsWithToast}
                  onRefresh={handleLoadResultsWithToast}
                />
                
                {/* Footer con información adicional */}
                <div className="mt-6 pt-4 border-t border-slate-700/50 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span>ID: {interviewResult?.id?.substring(0, 8) || 'N/A'}</span>
                    <span className="text-slate-600">•</span>
                    <span>{interviewResult?.date ? new Date(interviewResult.date).toLocaleDateString() : 'Fecha no disponible'}</span>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                      Estado: {interviewResult?.state || 'Completada'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
