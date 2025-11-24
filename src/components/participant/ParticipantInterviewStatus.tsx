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
      <main className={`${isSidebarCollapsed ? 'ml-20' : 'ml-80'} bg-gradient-to-br from-slate-800 to-slate-700 transition-all duration-300 flex-1 ${
        activeTab === 'interview' ? 'h-screen overflow-hidden' : 'p-8 min-h-screen overflow-y-auto custom-scroll-green'
      }`}>
        {activeTab === 'interview' ? (
          <div className="h-full w-full">
            <InterviewPanel onShowToast={onShowToast} />
          </div>
        ) : (

          <div className="w-full h-full p-6">
            {/* Header del Dashboard con gradiente y blur */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-600/30 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-slate-100 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                        Dashboard de Calificaciones
                      </h1>
                      <p className="text-slate-400 text-sm mt-1">Análisis detallado de tu rendimiento en la entrevista</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-indigo-500/30 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-indigo-300 text-sm font-medium">Evaluación Completada</span>
                  </div>
                  
                  <button 
                    onClick={handleLoadResultsWithToast}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>
              
              {/* Indicadores rápidos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slat};pe-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Puntuación Total</p>
                      <p className="text-2xl font-bold text-white">
                        {interviewResult?.score || '--'}
                        <span className="text-sm text-slate-400 ml-1">/ 100</span>
                      </p>
                    </div>
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <Award className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Preguntas</p>
                      <p className="text-2xl font-bold text-white">
                        {interviewResult?.answers?.length || '0'}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Estado</p>
                      <p className="text-2xl font-bold text-white">
                        {interviewResult?.state || 'Completada'}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido del Dashboard */}
            <div className="w-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30 shadow-lg">
              <InterviewResultsView
                interviewResult={interviewResult}
                isLoading={isLoading}
                error={error}
                onRetry={handleLoadResultsWithToast}
                onRefresh={handleLoadResultsWithToast}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
