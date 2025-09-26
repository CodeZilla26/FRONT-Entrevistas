'use client';

import { Play, User, BarChart3 } from 'lucide-react';
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
