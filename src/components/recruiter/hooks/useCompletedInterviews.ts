import { useState } from 'react';
import { CompletedInterview } from '@/types';

export interface UseCompletedInterviewsProps {
  completedInterviews: CompletedInterview[];
  loadInterviewByUserId: (userId: string) => Promise<CompletedInterview | null>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useCompletedInterviews = ({ 
  completedInterviews, 
  loadInterviewByUserId, 
  onShowToast 
}: UseCompletedInterviewsProps) => {
  
  // Estados para modal de video
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedInterviewForVideo, setSelectedInterviewForVideo] = useState<CompletedInterview | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Calcular estadísticas de entrevistas completadas
  const getStatistics = () => {
    const totalInterviews = completedInterviews.length;
    const averageScore = totalInterviews > 0 ? completedInterviews.reduce((acc, i) => acc + i.score, 0) / totalInterviews : 0;
    const excellentCount = completedInterviews.filter(i => i.score >= 80).length;
    const goodCount = completedInterviews.filter(i => i.score >= 60 && i.score < 80).length;
    const needsImprovementCount = completedInterviews.filter(i => i.score < 60).length;

    return {
      totalInterviews,
      averageScore,
      excellentCount,
      goodCount,
      needsImprovementCount,
      excellentPercentage: totalInterviews > 0 ? (excellentCount / totalInterviews) * 100 : 0,
      goodPercentage: totalInterviews > 0 ? (goodCount / totalInterviews) * 100 : 0,
      needsImprovementPercentage: totalInterviews > 0 ? (needsImprovementCount / totalInterviews) * 100 : 0
    };
  };

  // Función para obtener color según puntuación
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Función para obtener badge de puntuación
  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: 'Excelente', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
    if (score >= 60) return { text: 'Bueno', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
    return { text: 'Mejorar', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
  };

  // Función para abrir modal de video
  const handleViewVideo = async (interview: CompletedInterview) => {
    if (!interview.s3KeyPath) {
      onShowToast('No hay video disponible para esta entrevista', 'info');
      return;
    }

    setIsLoadingVideo(true);
    setSelectedInterviewForVideo(interview);
    setShowVideoModal(true);
    
    // Si necesitas cargar datos adicionales del usuario, puedes usar loadInterviewByUserId
    try {
      const detailedInterview = await loadInterviewByUserId(interview.userId);
      if (detailedInterview) {
        setSelectedInterviewForVideo(detailedInterview);
      }
    } catch (error) {
      console.error('[Video Modal] Error cargando detalles:', error);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Función para cerrar modal de video
  const handleCloseVideoModal = () => {
    setShowVideoModal(false);
    setSelectedInterviewForVideo(null);
    setIsLoadingVideo(false);
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no válida';
    }
  };

  // Función para formatear duración
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Función para obtener URL del video
  const getVideoUrl = (s3KeyPath: string) => {
    // Aquí puedes implementar la lógica para generar URLs presignadas de S3
    // Por ahora retornamos la key path directamente
    return s3KeyPath;
  };

  return {
    // Estados
    showVideoModal,
    selectedInterviewForVideo,
    isLoadingVideo,
    
    // Funciones de estadísticas
    getStatistics,
    getScoreColor,
    getScoreBadge,
    
    // Funciones de video
    handleViewVideo,
    handleCloseVideoModal,
    
    // Funciones de utilidad
    formatDate,
    formatDuration,
    getVideoUrl,
  };
};
