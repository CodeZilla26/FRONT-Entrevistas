/**
 * Utilidades para filtrado y ordenamiento de datos en el RecruiterPanel
 */

import { Participant, Interview, CompletedInterview } from '@/types';

/**
 * Filtrar participantes por término de búsqueda
 */
export const filterParticipantsBySearch = (
  participants: Participant[], 
  searchTerm: string
): Participant[] => {
  if (!searchTerm.trim()) return participants;
  
  const term = searchTerm.toLowerCase().trim();
  
  return participants.filter(participant => 
    participant.name.toLowerCase().includes(term) ||
    participant.email.toLowerCase().includes(term)
  );
};

/**
 * Filtrar participantes por estado
 */
export const filterParticipantsByStatus = (
  participants: Participant[], 
  status: 'all' | 'Pendiente' | 'En Proceso' | 'Entrevista Completa'
): Participant[] => {
  if (status === 'all') return participants;
  
  return participants.filter(participant => participant.status === status);
};

/**
 * Ordenar participantes
 */
export const sortParticipants = (
  participants: Participant[], 
  sortBy: 'name' | 'date' | 'status'
): Participant[] => {
  const sorted = [...participants];
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
    case 'date':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.dateRegistered || '').getTime();
        const dateB = new Date(b.dateRegistered || '').getTime();
        return dateB - dateA; // Más reciente primero
      });
      
    case 'status':
      return sorted.sort((a, b) => {
        // Orden: Entrevista Completa, En Proceso, Pendiente
        const statusOrder = { 'Entrevista Completa': 0, 'En Proceso': 1, 'Pendiente': 2 };
        const orderA = statusOrder[a.status] ?? 3;
        const orderB = statusOrder[b.status] ?? 3;
        return orderA - orderB;
      });
      
    default:
      return sorted;
  }
};

/**
 * Aplicar todos los filtros y ordenamiento a participantes
 */
export const filterAndSortParticipants = (
  participants: Participant[],
  filters: {
    searchTerm: string;
    statusFilter: 'all' | 'Pendiente' | 'En Proceso' | 'Entrevista Completa';
    sortBy: 'name' | 'date' | 'status';
  }
): Participant[] => {
  let filtered = participants;
  
  // Aplicar filtro de búsqueda
  filtered = filterParticipantsBySearch(filtered, filters.searchTerm);
  
  // Aplicar filtro de estado
  filtered = filterParticipantsByStatus(filtered, filters.statusFilter);
  
  // Aplicar ordenamiento
  filtered = sortParticipants(filtered, filters.sortBy);
  
  return filtered;
};

/**
 * Filtrar entrevistas por término de búsqueda
 */
export const filterInterviewsBySearch = (
  interviews: Interview[], 
  searchTerm: string
): Interview[] => {
  if (!searchTerm.trim()) return interviews;
  
  const term = searchTerm.toLowerCase().trim();
  
  return interviews.filter(interview => 
    interview.title.toLowerCase().includes(term) ||
    interview.description.toLowerCase().includes(term) ||
    interview.questions.some(q => q.toLowerCase().includes(term))
  );
};

/**
 * Filtrar entrevistas por estado
 */
export const filterInterviewsByStatus = (
  interviews: Interview[], 
  status: 'all' | 'Activa' | 'Borrador' | 'Finalizada'
): Interview[] => {
  if (status === 'all') return interviews;
  
  return interviews.filter(interview => interview.status === status);
};

/**
 * Ordenar entrevistas
 */
export const sortInterviews = (
  interviews: Interview[], 
  sortBy: 'title' | 'date' | 'status'
): Interview[] => {
  const sorted = [...interviews];
  
  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
      
    case 'date':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt || '').getTime();
        const dateB = new Date(b.createdAt || '').getTime();
        return dateB - dateA; // Más reciente primero
      });
      
    case 'status':
      return sorted.sort((a, b) => {
        // Orden: Activa, Borrador, Finalizada
        const statusOrder = { 'Activa': 0, 'Borrador': 1, 'Finalizada': 2 };
        const orderA = statusOrder[a.status] ?? 3;
        const orderB = statusOrder[b.status] ?? 3;
        return orderA - orderB;
      });
      
    default:
      return sorted;
  }
};

/**
 * Filtrar entrevistas completadas por término de búsqueda
 */
export const filterCompletedInterviewsBySearch = (
  interviews: CompletedInterview[], 
  searchTerm: string
): CompletedInterview[] => {
  if (!searchTerm.trim()) return interviews;
  
  const term = searchTerm.toLowerCase().trim();
  
  return interviews.filter(interview => 
    interview.userName.toLowerCase().includes(term) ||
    interview.interviewTitle.toLowerCase().includes(term)
  );
};

/**
 * Filtrar entrevistas completadas por puntuación
 */
export const filterCompletedInterviewsByScore = (
  interviews: CompletedInterview[], 
  scoreRange: 'all' | 'excellent' | 'good' | 'needs_improvement'
): CompletedInterview[] => {
  if (scoreRange === 'all') return interviews;
  
  return interviews.filter(interview => {
    switch (scoreRange) {
      case 'excellent':
        return interview.score >= 80;
      case 'good':
        return interview.score >= 60 && interview.score < 80;
      case 'needs_improvement':
        return interview.score < 60;
      default:
        return true;
    }
  });
};

/**
 * Ordenar entrevistas completadas
 */
export const sortCompletedInterviews = (
  interviews: CompletedInterview[], 
  sortBy: 'date' | 'score' | 'name'
): CompletedInterview[] => {
  const sorted = [...interviews];
  
  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.date || '').getTime();
        const dateB = new Date(b.date || '').getTime();
        return dateB - dateA; // Más reciente primero
      });
      
    case 'score':
      return sorted.sort((a, b) => b.score - a.score); // Mayor puntuación primero
      
    case 'name':
      return sorted.sort((a, b) => a.userName.localeCompare(b.userName));
      
    default:
      return sorted;
  }
};

/**
 * Obtener estadísticas de participantes
 */
export const getParticipantStats = (participants: Participant[]) => {
  const total = participants.length;
  const completed = participants.filter(p => p.status === 'Entrevista Completa').length;
  const inProcess = participants.filter(p => p.status === 'En Proceso').length;
  const pending = participants.filter(p => p.status === 'Pendiente').length;
  
  return {
    total,
    completed,
    inProcess,
    pending,
    completedPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    inProcessPercentage: total > 0 ? Math.round((inProcess / total) * 100) : 0,
    pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0
  };
};

/**
 * Obtener estadísticas de entrevistas
 */
export const getInterviewStats = (interviews: Interview[]) => {
  const total = interviews.length;
  const active = interviews.filter(i => i.status === 'Activa').length;
  const draft = interviews.filter(i => i.status === 'Borrador').length;
  const finished = interviews.filter(i => i.status === 'Finalizada').length;
  
  const totalQuestions = interviews.reduce((acc, interview) => acc + interview.questions.length, 0);
  const averageQuestions = total > 0 ? Math.round(totalQuestions / total) : 0;
  
  return {
    total,
    active,
    draft,
    finished,
    averageQuestions,
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
    draftPercentage: total > 0 ? Math.round((draft / total) * 100) : 0,
    finishedPercentage: total > 0 ? Math.round((finished / total) * 100) : 0
  };
};

/**
 * Obtener estadísticas de entrevistas completadas
 */
export const getCompletedInterviewStats = (interviews: CompletedInterview[]) => {
  const total = interviews.length;
  
  if (total === 0) {
    return {
      total: 0,
      averageScore: 0,
      excellent: 0,
      good: 0,
      needsImprovement: 0,
      excellentPercentage: 0,
      goodPercentage: 0,
      needsImprovementPercentage: 0,
      videosAvailable: 0,
      videosPercentage: 0
    };
  }
  
  const scores = interviews.map(i => i.score);
  const averageScore = scores.reduce((acc, score) => acc + score, 0) / total;
  
  const excellent = interviews.filter(i => i.score >= 80).length;
  const good = interviews.filter(i => i.score >= 60 && i.score < 80).length;
  const needsImprovement = interviews.filter(i => i.score < 60).length;
  
  const videosAvailable = interviews.filter(i => i.s3KeyPath && i.s3KeyPath.trim()).length;
  
  return {
    total,
    averageScore: Math.round(averageScore * 100) / 100,
    excellent,
    good,
    needsImprovement,
    excellentPercentage: Math.round((excellent / total) * 100),
    goodPercentage: Math.round((good / total) * 100),
    needsImprovementPercentage: Math.round((needsImprovement / total) * 100),
    videosAvailable,
    videosPercentage: Math.round((videosAvailable / total) * 100)
  };
};

/**
 * Buscar participantes con entrevistas asignadas
 */
export const getParticipantsWithAssignments = (participants: Participant[]): Participant[] => {
  return participants.filter(p => p.assignedInterviews && p.assignedInterviews.length > 0);
};

/**
 * Buscar participantes sin entrevistas asignadas
 */
export const getParticipantsWithoutAssignments = (participants: Participant[]): Participant[] => {
  return participants.filter(p => !p.assignedInterviews || p.assignedInterviews.length === 0);
};

/**
 * Obtener entrevistas activas disponibles para asignar
 */
export const getAvailableInterviewsForAssignment = (interviews: Interview[]): Interview[] => {
  return interviews.filter(interview => interview.status === 'Activa');
};
