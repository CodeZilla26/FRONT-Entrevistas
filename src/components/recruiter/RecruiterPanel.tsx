'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

// Importar hooks personalizados
import {
  useRecruiterData,
  useParticipants,
  useInterviews,
  useCompletedInterviews
} from './hooks';

// Importar servicios
import {
  createParticipantService,
  createInterviewService,
  createCompletedInterviewService,
  StorageService
} from './services';

// Importar componentes UI
import {
  LoadingSpinner,
  ParticipantsTab
} from './components';

// Importar utilidades
import {
  filterAndSortParticipants,
  getParticipantStats,
  validateParticipantData,
  formatDate
} from './utils';

interface RecruiterPanelProps {
  activeTab: string;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const RecruiterPanel = ({ activeTab, onShowToast }: RecruiterPanelProps) => {
  const { getAuthFetch, isAuthenticated } = useAuth();

  // Hook principal para gestión de datos
  const recruiterData = useRecruiterData({ activeTab, onShowToast });
  
  // Crear instancias de servicios
  const participantService = React.useMemo(
    () => createParticipantService(getAuthFetch, isAuthenticated),
    [getAuthFetch, isAuthenticated]
  );
  
  const interviewService = React.useMemo(
    () => createInterviewService(getAuthFetch, isAuthenticated),
    [getAuthFetch, isAuthenticated]
  );
  
  const completedInterviewService = React.useMemo(
    () => createCompletedInterviewService(getAuthFetch, isAuthenticated),
    [getAuthFetch, isAuthenticated]
  );

  // Hook para gestión de participantes
  const participantsHook = useParticipants({
    participants: recruiterData.participants,
    setParticipants: recruiterData.setParticipants,
    availableInterviews: recruiterData.availableInterviews,
    assignedInterviews: recruiterData.assignedInterviews,
    setAssignedInterviews: recruiterData.setAssignedInterviews,
    searchTerm: recruiterData.searchTerm,
    statusFilter: recruiterData.statusFilter,
    sortBy: recruiterData.sortBy,
    onShowToast
  });

  // Hook para gestión de entrevistas
  const interviewsHook = useInterviews({
    interviews: recruiterData.interviews,
    setInterviews: recruiterData.setInterviews,
    onShowToast
  });

  // Hook para entrevistas completadas
  const completedInterviewsHook = useCompletedInterviews({
    completedInterviews: recruiterData.completedInterviews,
    loadInterviewByUserId: recruiterData.loadInterviewByUserId,
    onShowToast
  });

  // Renderizar tab de participantes
  if (activeTab === 'participants') {
    return (
      <ParticipantsTab
        // Data
        participants={recruiterData.participants}
        availableInterviews={recruiterData.availableInterviews}
        isLoadingTabData={recruiterData.isLoadingTabData}
        
        // Filters
        searchTerm={recruiterData.searchTerm}
        setSearchTerm={recruiterData.setSearchTerm}
        statusFilter={recruiterData.statusFilter}
        setStatusFilter={recruiterData.setStatusFilter}
        sortBy={recruiterData.sortBy}
        setSortBy={recruiterData.setSortBy}
        viewMode={recruiterData.viewMode}
        setViewMode={recruiterData.setViewMode}
        
        // Functions
        filteredAndSortedParticipants={participantsHook.filteredAndSortedParticipants}
        
        // Add Participant Modal
        showAddParticipantModal={participantsHook.showAddParticipantModal}
        setShowAddParticipantModal={participantsHook.setShowAddParticipantModal}
        newParticipant={participantsHook.newParticipant}
        setNewParticipant={participantsHook.setNewParticipant}
        handleAddParticipant={participantsHook.handleAddParticipant}
        
        // Assign Interview Modal
        showAssignInterviewModal={participantsHook.showAssignInterviewModal}
        setShowAssignInterviewModal={participantsHook.setShowAssignInterviewModal}
        selectedParticipant={participantsHook.selectedParticipant}
        setSelectedParticipant={participantsHook.setSelectedParticipant}
        selectedInterviewForAssignment={participantsHook.selectedInterviewForAssignment}
        setSelectedInterviewForAssignment={participantsHook.setSelectedInterviewForAssignment}
        handleAssignInterview={participantsHook.handleAssignInterview}
        isAssigningInterview={participantsHook.isAssigningInterview}
      />
    );
  }

  // Renderizar tab de entrevistas
  if (activeTab === 'interviews') {
    // Calcular estadísticas reales
    const totalInterviews = recruiterData.interviews.length;
    const activeInterviews = recruiterData.interviews.filter(i => i.status === 'Activa').length;
    const draftInterviews = recruiterData.interviews.filter(i => i.status === 'Borrador').length;
    const archivedInterviews = recruiterData.interviews.filter(i => i.status === 'Finalizada').length;

    return (
      <div className="w-full h-full relative">
        {/* Decorative gradient overlays - similar to sidebar */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        
        <div className="relative p-8">
          {/* Dashboard Header with sidebar-style design */}
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden">
            {/* Header decorative overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Icon with sidebar-style design */}
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/25">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-slate-100 mb-2">Gestión de Entrevistas</h2>
                  <p className="text-slate-400 text-lg">Crea, edita y administra todas las entrevistas del sistema</p>
                </div>
              </div>
              
              {/* Action button with sidebar styling */}
              <button 
                onClick={() => interviewsHook.setShowCreateInterviewModal(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-white/30"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  <span>Nueva Entrevista</span>
                </div>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {recruiterData.isLoadingTabData ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Cargando entrevistas...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards with real data */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { title: 'Total Entrevistas', value: totalInterviews.toString(), icon: '📋', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10' },
                  { title: 'Activas', value: activeInterviews.toString(), icon: '✅', color: 'from-green-500 to-green-600', bg: 'bg-green-500/10' },
                  { title: 'Borradores', value: draftInterviews.toString(), icon: '📝', color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-500/10' },
                  { title: 'Inactivas', value: archivedInterviews.toString(), icon: '📦', color: 'from-slate-500 to-slate-600', bg: 'bg-slate-500/10' }
                ].map((stat, index) => (
                  <div key={index} className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                    <div className={`absolute inset-0 ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`bg-gradient-to-r ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}>
                          {stat.icon}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                        </div>
                      </div>
                      <h3 className="text-slate-300 font-medium">{stat.title}</h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interviews List */}
              {recruiterData.interviews.length > 0 ? (
                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 pointer-events-none"></div>
                  
                  <div className="relative">
                    <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                        📋
                      </div>
                      Lista de Entrevistas
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recruiterData.interviews.map((interview) => (
                        <div key={interview.id} className="bg-slate-700/30 rounded-xl p-6 hover:bg-slate-700/50 transition-all duration-300 border border-slate-600/20">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-slate-100 mb-2">{interview.title}</h4>
                              <p className="text-slate-400 text-sm mb-3 line-clamp-2">{interview.description}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              interview.status === 'Activa' ? 'bg-green-500/20 text-green-400' :
                              interview.status === 'Borrador' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {interview.status}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                            <span>{interview.questions?.length || 0} preguntas</span>
                            <span>{formatDate(interview.createdAt)}</span>
                          </div>
                          
                          <div className="flex">
                            <button
                              onClick={() => interviewsHook.handleDeleteInterview(String(interview.id))}
                              disabled={interviewsHook.deletingId === String(interview.id)}
                              className={`w-full px-4 py-2 rounded-lg transition-all duration-300 ${
                                interviewsHook.deletingId === String(interview.id)
                                  ? 'bg-red-500/10 text-red-300 cursor-not-allowed'
                                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                              }`}
                            >
                              {interviewsHook.deletingId === String(interview.id) ? 'Eliminando…' : '🗑️ Eliminar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 pointer-events-none"></div>
                  
                  <div className="relative text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border-2 border-white/20">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-100 mb-4">No hay entrevistas creadas</h3>
                    <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                      Comienza creando tu primera entrevista. Podrás agregar preguntas personalizadas y configurar todos los detalles.
                    </p>
                    
                    <button 
                      onClick={() => interviewsHook.setShowCreateInterviewModal(true)}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-white/30"
                    >
                      Crear Primera Entrevista
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Interview Modal */}
        {interviewsHook.showCreateInterviewModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-100">
                  {!interviewsHook.showQuestions ? 'Nueva Entrevista' : 'Preguntas Generadas con IA'}
                </h3>
                <button 
                  onClick={() => {
                    interviewsHook.setShowCreateInterviewModal(false);
                    interviewsHook.setShowQuestions(false);
                    interviewsHook.setGeneratedQuestions([]);
                    interviewsHook.setGeneratedQuestionObjs([]);
                  }}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
              
              {!interviewsHook.showQuestions ? (
                /* Paso 1: Formulario inicial */
                <form onSubmit={interviewsHook.handleGenerateQuestions} className="space-y-6">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Título de la Entrevista</label>
                    <input
                      type="text"
                      value={interviewsHook.newInterview.title}
                      onChange={(e) => interviewsHook.setNewInterview(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600/30 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: Entrevista Frontend Developer"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Descripción del Puesto</label>
                    <textarea
                      value={interviewsHook.newInterview.description}
                      onChange={(e) => interviewsHook.setNewInterview(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600/30 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-none"
                      placeholder="Describe las habilidades, experiencia y responsabilidades del puesto para generar preguntas relevantes..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Estado</label>
                    <select
                      value={interviewsHook.newInterview.status}
                      onChange={(e) => interviewsHook.setNewInterview(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full bg-slate-700/50 border border-slate-600/30 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="Activa">Activa</option>
                    </select>
                  </div>
                  
                  <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        🤖
                      </div>
                      <h4 className="text-indigo-300 font-semibold">Generación con IA</h4>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Nuestra IA analizará el título y descripción para generar 10 preguntas personalizadas con puntuación y tiempo estimado.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => interviewsHook.setShowCreateInterviewModal(false)}
                      className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={interviewsHook.isGeneratingQuestions}
                      className="flex-1 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600/90 hover:to-purple-600/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 border border-indigo-500/30 hover:shadow-indigo-500/25 backdrop-blur-sm"
                    >
                      {interviewsHook.isGeneratingQuestions ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Generando con IA...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>🤖</span>
                          <span>Generar Preguntas con IA</span>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Paso 2: Revisión de preguntas generadas */
                <div className="space-y-6">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        ✅
                      </div>
                      <h4 className="text-green-300 font-semibold">¡Preguntas Generadas!</h4>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Revisa las preguntas generadas por IA. Puedes aprobarlas, editarlas o regenerar las que no te convenzan.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {interviewsHook.generatedQuestions.map((question, index) => (
                      <div key={index} className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="text-sm text-slate-400">
                              <span className="text-indigo-400 font-medium">
                                {interviewsHook.generatedQuestionObjs[index]?.points || 0} pts
                              </span>
                              <span className="mx-2">•</span>
                              <span className="text-purple-400 font-medium">
                                {Math.round((interviewsHook.generatedQuestionObjs[index]?.time || 0) / 60)} min
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => interviewsHook.handleToggleQuestionStatus(index)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                              interviewsHook.questionStatus[index] === 'approved'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            }`}
                          >
                            {interviewsHook.questionStatus[index] === 'approved' ? '✅ Aprobada' : '🔄 Regenerar'}
                          </button>
                        </div>
                        <textarea
                          value={question}
                          onChange={(e) => interviewsHook.handleEditQuestion(index, e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-600/30 rounded-lg px-3 py-2 text-slate-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>

                  {interviewsHook.questionStatus.some(status => status === 'regenerate') && (
                    <button
                      onClick={interviewsHook.handleRegenerateQuestions}
                      disabled={interviewsHook.isGeneratingQuestions}
                      className="w-full bg-gradient-to-r from-yellow-600/80 to-orange-600/80 hover:from-yellow-600/90 hover:to-orange-600/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 border border-yellow-500/30"
                    >
                      {interviewsHook.isGeneratingQuestions ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Regenerando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>🔄</span>
                          <span>Regenerar Preguntas Marcadas</span>
                        </div>
                      )}
                    </button>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        interviewsHook.setShowQuestions(false);
                        interviewsHook.setGeneratedQuestions([]);
                        interviewsHook.setGeneratedQuestionObjs([]);
                      }}
                      className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                    >
                      ← Volver a Editar
                    </button>
                    <button
                      onClick={interviewsHook.handleCreateInterview}
                      disabled={interviewsHook.isCreatingInterview}
                      className="flex-1 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600/90 hover:to-emerald-600/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 border border-green-500/30 hover:shadow-green-500/25 backdrop-blur-sm"
                    >
                      {interviewsHook.isCreatingInterview ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Guardando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>💾</span>
                          <span>Crear Entrevista</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Renderizar tab de resultados
  if (activeTab === 'results') {
    // Usar estadísticas del hook especializado
    const stats = completedInterviewsHook.getStatistics();
    const totalCompleted = stats.totalInterviews;
    const averageScore = stats.averageScore.toFixed(1);
    const averageTime = totalCompleted > 0
      ? Math.round(recruiterData.completedInterviews.reduce((sum, i) => sum + i.duration, 0) / totalCompleted)
      : 0;
    const completionRate = recruiterData.participants.length > 0
      ? Math.round((totalCompleted / recruiterData.participants.length) * 100)
      : 0;
    return (
      <div className="w-full h-full relative">
        {/* Decorative gradient overlays - EXACTOS del sidebar */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        
        <div className="relative p-4 sm:p-6 lg:p-8">
          {/* Dashboard Header with sidebar-style design */}
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden">
            {/* Header decorative overlay - EXACTO del sidebar */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Icon with EXACTO estilo del sidebar */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 6.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-slate-100 mb-2">Análisis de Resultados</h2>
                  <p className="text-slate-400 text-lg">Revisa el rendimiento y estadísticas de todas las entrevistas</p>
                </div>
              </div>
              
              {/* Action button con EXACTO estilo del sidebar */}
              <button 
                onClick={() => onShowToast('Función de exportar en desarrollo', 'info')}
                className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600/90 hover:to-purple-600/90 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-500/30 hover:shadow-indigo-500/25 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 6.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Exportar Reporte</span>
                </div>
              </button>
            </div>
          </div>

          {/* Performance Stats Cards with real data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'Entrevistas Completadas', value: totalCompleted.toString(), icon: '✅', color: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-500/10', trend: `${totalCompleted > 0 ? '+' : ''}${totalCompleted}` },
              { title: 'Puntuación Promedio', value: averageScore, icon: '⭐', color: 'from-indigo-600 to-purple-500', bg: 'bg-purple-500/10', trend: `${parseFloat(averageScore) > 5 ? '+' : ''}${averageScore}` },
              { title: 'Tiempo Promedio', value: `${averageTime}m`, icon: '⏱️', color: 'from-purple-500 to-indigo-600', bg: 'bg-indigo-500/10', trend: `${averageTime}min` },
              { title: 'Tasa de Finalización', value: `${completionRate}%`, icon: '📊', color: 'from-purple-600 to-indigo-500', bg: 'bg-purple-500/10', trend: `${completionRate}%` }
            ].map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                <div className={`absolute inset-0 ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`bg-gradient-to-r ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}>
                      {stat.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                      <div className="text-sm text-emerald-400 font-medium">{stat.trend}</div>
                    </div>
                  </div>
                  <h3 className="text-slate-300 font-medium">{stat.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Charts and Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Performance Chart */}
            <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
              
              <div className="relative">
                <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    📈
                  </div>
                  Rendimiento por Mes
                </h3>
                
                <div className="h-64 flex items-end justify-between space-x-2">
                  {[
                    { month: 'Ene', value: stats.excellentPercentage || 65, count: stats.excellentCount },
                    { month: 'Feb', value: stats.goodPercentage || 78, count: stats.goodCount },
                    { month: 'Mar', value: stats.needsImprovementPercentage || 82, count: stats.needsImprovementCount },
                    { month: 'Abr', value: Math.min(stats.averageScore * 10, 100) || 71, count: totalCompleted },
                    { month: 'May', value: completionRate || 89, count: recruiterData.participants.length },
                    { month: 'Jun', value: Math.min((averageTime / 60) * 100, 100) || 94, count: averageTime }
                  ].map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div 
                        className="w-full bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t-lg transition-all duration-1000 hover:from-indigo-400 hover:to-purple-300 cursor-pointer relative"
                        style={{ height: `${Math.max(data.value, 5)}%` }}
                        title={`${data.month}: ${data.value.toFixed(1)}% (${data.count})`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {data.value.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-slate-400 text-sm mt-2">
                        {data.month}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
              
              <div className="relative">
                <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    🏆
                  </div>
                  Mejores Resultados
                </h3>
                
                <div className="space-y-4">
                  {recruiterData.completedInterviews.length > 0 ? (
                    recruiterData.completedInterviews
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 4)
                      .map((interview, index) => (
                      <div key={interview.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                          </div>
                          <div>
                            <div className="text-slate-100 font-semibold">{interview.userName}</div>
                            <div className="text-slate-400 text-sm">{interview.interviewTitle}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-indigo-400 font-bold text-lg">{interview.score}</div>
                          <div className="text-slate-400 text-sm">puntos</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-slate-400 text-lg mb-2">📊</div>
                      <p className="text-slate-400">No hay entrevistas completadas aún</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
            
            <div className="relative text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border-2 border-white/20">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Centro de Análisis</h3>
              <p className="text-slate-400 text-lg mb-6 max-w-2xl mx-auto">
                Explora métricas detalladas, tendencias de rendimiento y insights valiosos sobre el proceso de entrevistas.
              </p>
              
              {/* Estadísticas detalladas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-400">{stats.excellentCount}</div>
                  <div className="text-slate-300 text-sm">Excelentes (≥80)</div>
                  <div className="text-slate-400 text-xs">{stats.excellentPercentage.toFixed(1)}%</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.goodCount}</div>
                  <div className="text-slate-300 text-sm">Buenos (60-79)</div>
                  <div className="text-slate-400 text-xs">{stats.goodPercentage.toFixed(1)}%</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{stats.needsImprovementCount}</div>
                  <div className="text-slate-300 text-sm">A Mejorar (&lt;60)</div>
                  <div className="text-slate-400 text-xs">{stats.needsImprovementPercentage.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => {
                    const stats = completedInterviewsHook.getStatistics();
                    onShowToast(`Análisis actualizado: ${stats.totalInterviews} entrevistas, promedio ${stats.averageScore.toFixed(1)}`, 'success');
                  }}
                  className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600/90 hover:to-purple-600/90 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-500/30 hover:shadow-indigo-500/25 backdrop-blur-sm"
                >
                  Ver Estadísticas Detalladas
                </button>
                <button 
                  onClick={() => onShowToast('Función de exportar reportes en desarrollo', 'info')}
                  className="text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md hover:border-slate-600/50 border border-transparent px-8 py-4 rounded-xl font-semibold transition-all duration-300"
                >
                  Exportar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback para tabs no reconocidos
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-100 mb-2">Tab no encontrado</h3>
        <p className="text-slate-400">El tab &ldquo;{activeTab}&rdquo; no está implementado</p>
      </div>
    </div>
  );
};
