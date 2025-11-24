import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { INTERVIEWS_API_BASE } from '@/config';
import { Interview } from '@/types';

export interface UseInterviewsProps {
  interviews: Interview[];
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useInterviews = ({ interviews, setInterviews, onShowToast }: UseInterviewsProps) => {
  const { getAuthFetch, isAuthenticated } = useAuth();

  // Estados para creación de entrevistas
  const [newInterview, setNewInterview] = useState({ title: '', description: '', status: 'Activa' as 'Activa' | 'Borrador' | 'Inactiva' });
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [generatedQuestionObjs, setGeneratedQuestionObjs] = useState<Array<{ text: string; points: number; time: number }>>([]);
  const [questionStatus, setQuestionStatus] = useState<('approved' | 'regenerate')[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isCreatingInterview, setIsCreatingInterview] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showCreateInterviewModal, setShowCreateInterviewModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Función para generar preguntas con IA
  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInterview.title.trim() || !newInterview.description.trim()) {
      onShowToast('Por favor, completa todos los campos', 'error');
      return;
    }

    setIsGeneratingQuestions(true);
    
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position: newInterview.title.trim(),
          description: newInterview.description.trim(),
          questionCount: 10
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al generar preguntas');
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No se generaron preguntas válidas');
      }
      // data.questions DEBE venir como objetos { text, points, time }
      const asObjects: Array<{ text: string; points: number; time: number }> = data.questions.map((q: any) => ({
        text: q?.text,
        points: q?.points,
        time: q?.time,
      }));
      // Validar que todas las preguntas tengan estructura correcta
      const invalid = asObjects.some(q => !q?.text || typeof q.points !== 'number' || typeof q.time !== 'number');
      if (invalid) {
        throw new Error('La API de IA no devolvió points/time por pregunta. Corrige la IA y vuelve a intentar.');
      }
      setGeneratedQuestionObjs(asObjects);
      setGeneratedQuestions(asObjects.map(q => q.text));
      setQuestionStatus(new Array(asObjects.length).fill('approved'));
      setShowQuestions(true);
      onShowToast(`¡${data.questions.length} preguntas generadas con IA!`, 'success');
    } catch (error) {
      console.error('Error:', error);
      onShowToast(
        error instanceof Error ? error.message : 'Error al generar preguntas. Inténtalo de nuevo.', 
        'error'
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Función para eliminar una entrevista
  const handleDeleteInterview = async (id: string) => {
    if (!id) {
      onShowToast('ID de entrevista inválido', 'error');
      return;
    }

    if (!isAuthenticated) {
      onShowToast('Inicia sesión para eliminar entrevistas', 'error');
      return;
    }

    try {
      setDeletingId(id);

      const res = await getAuthFetch(`/api/interview/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });

      const raw = await res.text();
      let data: any = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

      if (!res.ok) {
        // Extraer mensaje de error estándar del backend
        const serverMsg = typeof data === 'string' ? data : (data?.message || data?.error || JSON.stringify(data));
        const statusMsg = res.status === 400 ? 'Solicitud inválida'
          : res.status === 401 ? 'No autorizado'
          : res.status === 403 ? 'Prohibido'
          : res.status === 404 ? 'No encontrado'
          : 'Error del servidor';
        throw new Error(serverMsg ? `${statusMsg}: ${serverMsg}` : `${statusMsg} (HTTP ${res.status})`);
      }

      // 200 OK
      setInterviews(prev => prev.filter(it => String(it.id) !== String(id)));
      onShowToast('Entrevista eliminada', 'success');
    } catch (error) {
      console.error('[Eliminar Entrevista] Error:', error);
      onShowToast(error instanceof Error ? error.message : 'Error al eliminar entrevista', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Función para crear entrevista
  const handleCreateInterview = async () => {
    if (generatedQuestions.length === 0) {
      onShowToast('Primero debes generar las preguntas', 'error');
      return;
    }

    try {
      if (!INTERVIEWS_API_BASE || !isAuthenticated) {
        onShowToast('Inicia sesión para crear entrevistas (token no encontrado)', 'error');
        return;
      }
      // Validar que existan objetos de preguntas con text/points/time
      if (!generatedQuestionObjs.length) {
        onShowToast('No hay preguntas con points/time. Genera con la IA nuevamente.', 'error');
        return;
      }
      setIsCreatingInterview(true);
      const targetUrl = `${INTERVIEWS_API_BASE}/api/interview/create`;
      console.log('[Crear Entrevista] URL:', targetUrl, 'JWT presente:', isAuthenticated);
      // Construir payload para API externa
      const payload = {
        title: newInterview.title,
        description: newInterview.description,
        active: newInterview.status === 'Activa',
        questions: generatedQuestionObjs
      };
      console.log('[Crear Entrevista] payload:', payload);
      const res = await getAuthFetch('/api/interview/create', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const raw = await res.text();
      let data: any = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
      if (!res.ok) {
        const serverMsg = typeof data === 'string' ? data : (data?.message || data?.error || JSON.stringify(data));
        throw new Error(serverMsg || `HTTP ${res.status}`);
      }
      // Mapear respuesta a UI
      const created: Interview = {
        id: String((data as any).id),
        title: (data as any).title,
        description: (data as any).description,
        status: (data as any).active ? 'Activa' : 'Borrador',
        createdAt: (data as any).createdAt,
        questions: Array.isArray((data as any).questions) ? (data as any).questions.map((q: any) => q?.text ?? '') : [],
        position: data.title,
        date: data.createdAt
      } as any;
      setInterviews(prev => [...prev, created]);
      
      // Reset form
      setNewInterview({ title: '', description: '', status: 'Activa' });
      setGeneratedQuestions([]);
      setGeneratedQuestionObjs([]);
      setQuestionStatus([]);
      setShowQuestions(false);
      setShowCreateInterviewModal(false);
      onShowToast('¡Entrevista guardada con preguntas en JSON!', 'success');
    } catch (error) {
      console.error('Error:', error);
      onShowToast(
        error instanceof Error ? error.message : 'Error al crear entrevista',
        'error'
      );
    } finally {
      setIsCreatingInterview(false);
    }
  };

  // Función para regenerar preguntas específicas
  const handleRegenerateQuestions = async () => {
    const indicesToRegenerate = questionStatus
      .map((status, index) => status === 'regenerate' ? index : -1)
      .filter(index => index !== -1);
    
    if (indicesToRegenerate.length === 0) {
      onShowToast('No hay preguntas marcadas para regenerar', 'info');
      return;
    }

    setIsGeneratingQuestions(true);
    
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position: newInterview.title.trim(),
          description: newInterview.description.trim(),
          regenerateMode: true,
          existingQuestions: generatedQuestionObjs, // Pasar objetos completos en lugar de solo texto
          indicesToRegenerate
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al regenerar preguntas');
      }

      if (!data.questions || data.questions.length !== indicesToRegenerate.length) {
        throw new Error('No se generaron suficientes preguntas de reemplazo');
      }

      // Validar estructura de las nuevas preguntas
      const regenObjs: Array<{ text: string; points: number; time: number }> = data.questions.map((q: any) => ({
        text: q?.text,
        points: q?.points,
        time: q?.time,
      }));
      const invalid = regenObjs.some(q => !q?.text || typeof q.points !== 'number' || typeof q.time !== 'number');
      if (invalid) {
        throw new Error('La API de IA no devolvió points/time por pregunta (regeneración). Corrige la IA y vuelve a intentar.');
      }
      const newQuestions = [...generatedQuestions];
      const newQuestionObjs = [...generatedQuestionObjs];
      const newStatus = [...questionStatus];
      
      // Reemplazar solo las preguntas marcadas para regenerar
      indicesToRegenerate.forEach((originalIndex, newIndex) => {
        newQuestions[originalIndex] = regenObjs[newIndex].text;
        newQuestionObjs[originalIndex] = regenObjs[newIndex];
        newStatus[originalIndex] = 'approved';
      });
      
      setGeneratedQuestions(newQuestions);
      setGeneratedQuestionObjs(newQuestionObjs);
      setQuestionStatus(newStatus);
      onShowToast(`${indicesToRegenerate.length} pregunta(s) regenerada(s) con IA`, 'success');
    } catch (error) {
      console.error('Error:', error);
      onShowToast(
        error instanceof Error ? error.message : 'Error al regenerar preguntas. Inténtalo de nuevo.', 
        'error'
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Función para cambiar estado de pregunta (aprobada/regenerar)
  const handleToggleQuestionStatus = (index: number) => {
    const newStatus = [...questionStatus];
    newStatus[index] = newStatus[index] === 'approved' ? 'regenerate' : 'approved';
    setQuestionStatus(newStatus);
  };

  // Función para editar pregunta manualmente
  const handleEditQuestion = (index: number, newQuestion: string) => {
    const updatedQuestions = [...generatedQuestions];
    updatedQuestions[index] = newQuestion;
    setGeneratedQuestions(updatedQuestions);
    
    // También actualizar el objeto de pregunta
    const updatedQuestionObjs = [...generatedQuestionObjs];
    if (updatedQuestionObjs[index]) {
      updatedQuestionObjs[index] = {
        ...updatedQuestionObjs[index],
        text: newQuestion
      };
      setGeneratedQuestionObjs(updatedQuestionObjs);
    }
  };

  return {
    // Estados
    newInterview,
    setNewInterview,
    generatedQuestions,
    setGeneratedQuestions,
    generatedQuestionObjs,
    setGeneratedQuestionObjs,
    questionStatus,
    setQuestionStatus,
    isGeneratingQuestions,
    isCreatingInterview,
    showQuestions,
    setShowQuestions,
    showCreateInterviewModal,
    setShowCreateInterviewModal,
    deletingId,
    
    // Funciones
    handleGenerateQuestions,
    handleCreateInterview,
    handleRegenerateQuestions,
    handleToggleQuestionStatus,
    handleEditQuestion,
    handleDeleteInterview,
  };
};
