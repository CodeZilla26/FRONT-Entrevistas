'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Users, Calendar, Clock, FileText } from 'lucide-react';
import { Participant, Interview, AvailableInterview, AssignedInterview, CompletedInterview } from '@/types';
import { INTERVIEWS_API_BASE, PARTICIPANTS_LIST_URL, PARTICIPANTS_CREATE_URL } from '@/config';
import { useAuth } from '@/context/AuthContext';

interface RecruiterPanelProps {
  activeTab: string;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const RecruiterPanel = ({ activeTab, onShowToast }: RecruiterPanelProps) => {
  const { getAuthFetch, getAuthHeader, isAuthenticated, token } = useAuth();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [availableInterviews, setAvailableInterviews] = useState<AvailableInterview[]>([]);
  const [assignedInterviews, setAssignedInterviews] = useState<AssignedInterview[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<CompletedInterview[]>([]);
  const [newParticipant, setNewParticipant] = useState({ name: '', lastName: '', email: '', password: '' });
  const [newInterview, setNewInterview] = useState({ title: '', description: '', status: 'Activa' as 'Activa' | 'Borrador' | 'Inactiva' });
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [generatedQuestionObjs, setGeneratedQuestionObjs] = useState<Array<{ text: string; points: number; time: number }>>([]);
  const [questionStatus, setQuestionStatus] = useState<('approved' | 'regenerate')[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isCreatingInterview, setIsCreatingInterview] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showCreateInterviewModal, setShowCreateInterviewModal] = useState(false);
  const [showAssignInterviewModal, setShowAssignInterviewModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [selectedInterviewForAssignment, setSelectedInterviewForAssignment] = useState<string>('');
  const [isAssigningInterview, setIsAssigningInterview] = useState(false);
  const [isLoadingTabData, setIsLoadingTabData] = useState(false);

  // Estados para filtros del dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pendiente' | 'En Proceso' | 'Entrevista Completa'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name');

  // Limpiar COMPLETAMENTE el estado al cambiar de tab
  const clearAllData = () => {
    console.log('[RecruiterPanel] LIMPIEZA COMPLETA DE TODOS LOS DATOS');
    
    // Limpiar TODOS los datos sin excepción
    setParticipants([]);
    setInterviews([]);
    setAvailableInterviews([]);
    setAssignedInterviews([]);
    setCompletedInterviews([]);
    setGeneratedQuestions([]);
    setGeneratedQuestionObjs([]);
    setQuestionStatus([]);
    
    // Limpiar TODOS los estados de UI
    setSelectedParticipant(null);
    setSelectedInterviewForAssignment('');
    setShowAssignInterviewModal(false);
    setShowAddParticipantModal(false);
    setShowCreateInterviewModal(false);
    setShowQuestions(false);
    setIsAssigningInterview(false);
    setIsGeneratingQuestions(false);
    setIsCreatingInterview(false);
    
    // Limpiar TODOS los formularios
    setNewParticipant({ name: '', lastName: '', email: '', password: '' });
    setNewInterview({ title: '', description: '', status: 'Activa' });
  };

  // Cargar datos según el tab activo
  useEffect(() => {
    const loadDataForTab = async () => {
      try {
        console.log('[RecruiterPanel] Iniciando carga para tab:', activeTab);
        setIsLoadingTabData(true);
        setParticipants([]);
        setInterviews([]);
        setAvailableInterviews([]);
        setAssignedInterviews([]);
        setGeneratedQuestions([]);
        setGeneratedQuestionObjs([]);
        setQuestionStatus([]);
        setSelectedParticipant(null);
        setSelectedInterviewForAssignment('');
        setShowAssignInterviewModal(false);
        setShowAddParticipantModal(false);
        setShowCreateInterviewModal(false);
        setShowQuestions(false);
        setIsAssigningInterview(false);
        setIsGeneratingQuestions(false);
        setIsCreatingInterview(false);
        setNewParticipant({ name: '', lastName: '', email: '', password: '' });
        setNewInterview({ title: '', description: '', status: 'Activa' });
        
        console.log('[RecruiterPanel] Estado limpiado, cargando datos para tab:', activeTab);
        
        if (activeTab === 'participants') {
          if (PARTICIPANTS_LIST_URL && isAuthenticated) {
            const pRes = await getAuthFetch(PARTICIPANTS_LIST_URL);
            const pData = await pRes.json().catch(() => []);
            if (pRes.ok && Array.isArray(pData)) {
              const mapped: Participant[] = pData.map((it: any, idx: number) => {
                const realId = it.id;
                
                return {
                  id: realId, // Mantener como string: "68c31b1c6ddbff39734c26c7"
                  name: [it.name, it.lastName].filter(Boolean).join(' ') || 'N/A',
                  email: it.email ?? 'sin-email@local',
                  status: (it.status as Participant['status']) || 'Pendiente',
                  dateRegistered: it.dateRegistered || it.createdAt || undefined,
                };
              });
              setParticipants(mapped);
              console.log('[Participantes] Cargados:', mapped.length, 'participantes');
              setTimeout(() => {
                // Verificar que aún estemos en el tab de participantes antes de cargar
                if (activeTab === 'participants') {
                  loadAvailableInterviews();
                } else {
                  console.log('[Participantes] Tab cambió antes de cargar entrevistas disponibles, cancelando');
                }
              }, 100);

              setTimeout(() => {
                // Verificar que aún estemos en el tab de participantes antes de cargar
                if (activeTab === 'participants') {
                  loadAssignmentsFromStorage();
                } else {
                  console.log('[Participantes] Tab cambió antes de cargar asignaciones, cancelando');
                }
              }, 200);
            } else {
              onShowToast('No se pudieron cargar participantes externos', 'info');
            }
          } else {
            setParticipants([]);
          }
        }
        
        if (activeTab === 'interviews') {
          // Solo cargar entrevistas cuando estemos en el tab de entrevistas
          if (!INTERVIEWS_API_BASE || !isAuthenticated) {
            console.log('[Entrevistas] No configurado o no autenticado');
            setInterviews([]);
            return;
          }
          const res = await getAuthFetch('/api/interview/listInterviews');
          const list = await res.json().catch(() => []);
          if (!res.ok || !Array.isArray(list)) throw new Error('No se pudieron cargar entrevistas externas');
          // Mapear al tipo UI
          const mapped: Interview[] = list.map((it: any) => ({
            id: String(it.id),
            title: it.title,
            description: it.description,
            status: it.active ? 'Activa' : 'Borrador',
            createdAt: it.createdAt,
            questions: Array.isArray(it.questions) ? it.questions.map((q: any) => q?.text ?? '') : [],
            // Campos de compatibilidad para UI existente
            position: it.title,
            date: it.createdAt
          }));
          setInterviews(mapped);
          console.log('[Entrevistas] Cargadas:', mapped.length, 'entrevistas');
          console.log('[Entrevistas] Datos:', mapped);
        }
        
        if (activeTab === 'results') {
          // Cargar entrevistas completadas para el tab de resultados
          console.log('[Resultados] Cargando entrevistas completadas...');
          await loadCompletedInterviews();
        }
        
      } catch (e) {
        console.error('Error cargando datos para tab:', activeTab, e);
        onShowToast(`No se pudieron cargar datos para ${activeTab}`, 'error');
      } finally {
        setIsLoadingTabData(false);
      }
    };
    
    if (isAuthenticated) {
      loadDataForTab();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated]);

  // Nota: Las entrevistas disponibles se cargan dentro del useEffect principal según el tab activo

  // useEffect para detectar cambios inesperados en los datos
  useEffect(() => {
    console.log('[ESTADO] Cambio detectado - Tab actual:', activeTab);
    console.log('[ESTADO] Participantes:', participants.length);
    console.log('[ESTADO] Entrevistas:', interviews.length);
    
    // Detectar mezcla de datos
    if (activeTab === 'participants' && interviews.length > 0) {
      console.warn('⚠️ PROBLEMA: Hay entrevistas en el tab de participantes!');
    }
    if (activeTab === 'interviews' && participants.length > 0) {
      console.warn('⚠️ PROBLEMA: Hay participantes en el tab de entrevistas!');
    }
  }, [participants, interviews, activeTab]);

  // Función para cargar entrevistas disponibles
  const loadAvailableInterviews = async () => {
    try {
      console.log('[Entrevistas Disponibles] Iniciando carga...');
      console.log('[Entrevistas Disponibles] INTERVIEWS_API_BASE:', INTERVIEWS_API_BASE);
      console.log('[Entrevistas Disponibles] isAuthenticated:', isAuthenticated);
      
      if (!INTERVIEWS_API_BASE || !isAuthenticated) {
        console.log('[Entrevistas Disponibles] API no configurada o no autenticado');
        return;
      }
      
      console.log('[Entrevistas Disponibles] Cargando desde /api/interview/listInterviews');
      const res = await getAuthFetch('/api/interview/listInterviews');
      const list = await res.json().catch(() => []);
      
      if (res.ok && Array.isArray(list)) {
        const mapped: AvailableInterview[] = list.map((it: any) => ({
          id: String(it.id),
          title: it.title,
          description: it.description,
          status: it.active ? 'Activa' : 'Borrador',
          createdAt: it.createdAt,
          questions: Array.isArray(it.questions) ? it.questions.map((q: any) => q?.text ?? '') : [],
          duration: it.duration || 30, // duración por defecto
          difficulty: it.difficulty || 'Intermedio'
        }));
        setAvailableInterviews(mapped);
        console.log('[Entrevistas Disponibles] Cargadas:', mapped.length, 'entrevistas');
      } else {
        throw new Error('No se pudieron cargar entrevistas disponibles');
      }
    } catch (error) {
      console.error('Error cargando entrevistas disponibles:', error);
      // Fallback: usar las entrevistas existentes como disponibles
      const fallback: AvailableInterview[] = interviews.map(interview => ({
        id: interview.id,
        title: interview.title,
        description: interview.description,
        status: interview.status as 'Activa' | 'Borrador' | 'Finalizada',
        createdAt: interview.createdAt,
        questions: interview.questions,
        duration: 30,
        difficulty: 'Intermedio' as const
      }));
      setAvailableInterviews(fallback);
      console.log('[Entrevistas Disponibles] Usando fallback:', fallback.length, 'entrevistas');
    }
  };

  // Función para cargar entrevistas completadas
  const loadCompletedInterviews = async () => {
    try {
      console.log('[Entrevistas Completadas] Cargando desde API...');
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/userinterview/findAll`;
      console.log('[Entrevistas Completadas] URL:', url);
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });

      console.log('[Entrevistas Completadas] Respuesta status:', res.status);

      if (res.ok) {
        const data: CompletedInterview[] = await res.json();
        console.log('[Entrevistas Completadas] Datos recibidos:', data);
        
        setCompletedInterviews(data);
        console.log('[Entrevistas Completadas] Cargadas exitosamente:', data.length, 'entrevistas');
        
        return data;
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[Entrevistas Completadas] Error en respuesta:', errorData);
        onShowToast(`Error cargando entrevistas completadas: ${errorData.message || res.statusText}`, 'error');
        return [];
      }
    } catch (error) {
      console.error('[Entrevistas Completadas] Error:', error);
      onShowToast('Error de conexión al cargar entrevistas completadas', 'error');
      return [];
    }
  };

  // Función para cargar asignaciones desde localStorage
  const loadAssignmentsFromStorage = () => {
    try {
      const storedAssignments = localStorage.getItem('recruiter_assignments');
      if (storedAssignments) {
        const assignments: AssignedInterview[] = JSON.parse(storedAssignments);
        console.log('[Asignaciones] Cargadas desde localStorage:', assignments.length);
        
        setAssignedInterviews(assignments);
        
        // Actualizar participantes con sus asignaciones
        setParticipants(prev => prev.map(participant => {
          const participantAssignments = assignments.filter(a => a.participantId === participant.id);
          return {
            ...participant,
            assignedInterviews: participantAssignments
          };
        }));
        
        return assignments;
      }
    } catch (error) {
      console.error('[Asignaciones] Error cargando desde localStorage:', error);
    }
    return [];
  };

  // Función para guardar asignaciones en localStorage
  const saveAssignmentsToStorage = (assignments: AssignedInterview[]) => {
    try {
      localStorage.setItem('recruiter_assignments', JSON.stringify(assignments));
      console.log('[Asignaciones] Guardadas en localStorage:', assignments.length);
    } catch (error) {
      console.error('[Asignaciones] Error guardando en localStorage:', error);
    }
  };

  // Función para asignar entrevista a participante
  const handleAssignInterview = async () => {
    if (!selectedParticipant || !selectedInterviewForAssignment) {
      onShowToast('Por favor selecciona una entrevista', 'error');
      return;
    }

    // 🔒 VALIDACIÓN: Verificar si ya tiene una entrevista asignada (estado local)
    const alreadyHasInterview = assignedInterviews.some(assignment => assignment.participantId === selectedParticipant.id);
    if (alreadyHasInterview) {
      onShowToast(`${selectedParticipant.name} ya tiene una entrevista asignada en esta sesión`, 'error');
      return;
    }

    setIsAssigningInterview(true);
    try {
      if (!INTERVIEWS_API_BASE || !isAuthenticated) {
        onShowToast('Inicia sesión para asignar entrevistas', 'error');
        return;
      }

      const selectedInterview = availableInterviews.find(i => i.id === selectedInterviewForAssignment);
      if (!selectedInterview) {
        onShowToast('Entrevista no encontrada', 'error');
        return;
      }

      console.log('[Asignar Entrevista] Participante seleccionado completo:', selectedParticipant);
      console.log('[Asignar Entrevista] ID del participante:', selectedParticipant.id);
      console.log('[Asignar Entrevista] Entrevista seleccionada:', selectedInterviewForAssignment);
      
      // Verificar que el JWT esté disponible
      const authHeader = getAuthHeader();
      console.log('[Asignar Entrevista] JWT disponible:', !!authHeader.Authorization);
      
      // Usar POST con query parameters (no body JSON)
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/userinterview/assignInterviewToPracticante?userId=${selectedParticipant.id}&interviewId=${selectedInterviewForAssignment}`;
      console.log('[Asignar Entrevista] URL con parámetros:', url);
      
      const res = await getAuthFetch(url, {
        method: 'POST'
      });

      console.log('[Asignar Entrevista] Respuesta status:', res.status);

      if (res.ok) {
        const assignmentData = await res.json();
        console.log('[Asignar Entrevista] Respuesta exitosa:', assignmentData);
      
        // Crear la asignación local usando la respuesta del servidor
        const newAssignment: AssignedInterview = {
          id: assignmentData.interviewAsignedId, // ✅ Usar el ID real de la asignación
          interviewId: selectedInterviewForAssignment,
          participantId: selectedParticipant.id,
          assignedAt: assignmentData.creationDate || new Date().toISOString(),
          status: 'Asignada',
          interview: selectedInterview
        };

        console.log('[Asignaciones] Nueva asignación creada:', {
          assignmentId: assignmentData.interviewAsignedId,
          participantId: selectedParticipant.id,
          participantName: selectedParticipant.name,
          interviewId: selectedInterviewForAssignment,
          interviewTitle: selectedInterview.title
        });

        // Actualizar estado local
        const updatedAssignments = [...assignedInterviews, newAssignment];
        setAssignedInterviews(updatedAssignments);
        
        // Actualizar el participante con la nueva asignación
        setParticipants(prev => prev.map(p => 
          p.id === selectedParticipant.id 
            ? { ...p, assignedInterviews: [...(p.assignedInterviews || []), newAssignment] }
            : p
        ));

        // ✅ PERSISTIR en localStorage
        saveAssignmentsToStorage(updatedAssignments);

        onShowToast('Entrevista asignada exitosamente', 'success');
        setShowAssignInterviewModal(false);
        setSelectedParticipant(null);
        setSelectedInterviewForAssignment('');

        console.log('[Asignaciones] Asignación completada y guardada en localStorage');
      } else {
        // Manejar errores específicos según el status code
        const errorData = await res.json().catch(() => ({ 
          message: 'Error desconocido',
          code: 'UNKNOWN_ERROR' 
        }));
        
        console.error('[Asignar Entrevista] Error del servidor:', {
          status: res.status,
          statusText: res.statusText,
          errorData,
          url: url,
          userId: selectedParticipant.id,
          interviewId: selectedInterviewForAssignment
        });

        let errorMessage = 'Error al asignar entrevista';
        
        switch (res.status) {
          case 400:
            errorMessage = `Error de validación: ${errorData.message || 'Datos inválidos'}`;
            break;
          case 401:
            errorMessage = 'No autorizado. Por favor inicia sesión nuevamente';
            break;
          case 403:
            errorMessage = 'No tienes permisos para asignar entrevistas';
            break;
          case 404:
            errorMessage = 'Usuario o entrevista no encontrada';
            break;
          case 500:
            errorMessage = `Error del servidor: ${errorData.message || 'Error interno'}`;
            break;
          default:
            errorMessage = `Error ${res.status}: ${errorData.message || 'Error desconocido'}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error asignando entrevista:', error);
      onShowToast(`Error al asignar entrevista: ${error?.message || 'Error desconocido'}`, 'error');
    } finally {
      setIsAssigningInterview(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant.name.trim() || !newParticipant.lastName.trim() || !newParticipant.email.trim() || !newParticipant.password.trim()) {
      onShowToast('Por favor, completa todos los campos (Nombre, Apellidos, Email y Contraseña)', 'error');
      return;
    }
    if (participants.some(p => p.email === newParticipant.email.trim())) {
      onShowToast('Este email ya está registrado', 'error');
      return;
    }
    try {
      if (!isAuthenticated) {
        onShowToast('Inicia sesión para crear participantes (token no encontrado)', 'error');
        return;
      }
      if (!PARTICIPANTS_CREATE_URL) {
        onShowToast('Configura PARTICIPANTS_CREATE_URL en src/config.ts para crear participantes', 'error');
        return;
      }
      console.log('[Participantes] CREATE URL:', PARTICIPANTS_CREATE_URL, 'JWT presente:', isAuthenticated);
      const res = await getAuthFetch(PARTICIPANTS_CREATE_URL, {
        method: 'POST',
        body: JSON.stringify({
          name: newParticipant.name.trim(),
          lastName: newParticipant.lastName.trim(),
          email: newParticipant.email.trim(),
          password: newParticipant.password.trim(),
          rolName: 'ROLE_PRACTICANTE',
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo crear participante externo');
      }
      // Añadir al estado local con mapeo básico
      setParticipants(prev => [...prev, {
        id: data.id || `temp_${Date.now()}`, // Mantener como string
        name: (data.name && data.lastName) ? `${data.name} ${data.lastName}` : `${newParticipant.name} ${newParticipant.lastName}`.trim(),
        email: data.email ?? newParticipant.email,
        status: (data.status as Participant['status']) || 'Pendiente',
        dateRegistered: data.creationDate || data.dateRegistered || data.createdAt || new Date().toLocaleDateString(),
      }]);
      setNewParticipant({ name: '', lastName: '', email: '', password: '' });
      setShowAddParticipantModal(false);
      onShowToast('¡Participante registrado exitosamente!', 'success');
    } catch (err) {
      console.error('Add participant error:', err);
      onShowToast(err instanceof Error ? err.message : 'Error al registrar participante', 'error');
    }
  };

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
          questionCount: 5
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
          existingQuestions: generatedQuestions,
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

  const handleToggleQuestionStatus = (index: number) => {
    const newStatus = [...questionStatus];
    newStatus[index] = newStatus[index] === 'approved' ? 'regenerate' : 'approved';
    setQuestionStatus(newStatus);
  };

  const handleEditQuestion = (index: number, newQuestion: string) => {
    const updatedQuestions = [...generatedQuestions];
    updatedQuestions[index] = newQuestion;
    setGeneratedQuestions(updatedQuestions);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entrevista Completa': return 'text-green-400';
      case 'Pendiente': return 'text-yellow-400';
      case 'En Proceso': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  // Función para filtrar y ordenar participantes
  const filteredAndSortedParticipants = () => {
    let filtered = participants.filter(participant => {
      // Filtro por búsqueda
      const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           participant.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por estado
      const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.dateRegistered || '').getTime() - new Date(a.dateRegistered || '').getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Mostrar loading mientras se limpia y carga el estado
  if (isLoadingTabData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando {activeTab}...</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'participants') {
    console.log('[RENDER] Tab Participantes - Participantes en estado:', participants.length);
    console.log('[RENDER] Tab Participantes - Entrevistas en estado:', interviews.length);
    
    return (
      <div className="w-full h-full p-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-100">Dashboard de Participantes</h2>
            <p className="text-slate-400 mt-1">Gestiona y supervisa todos los participantes del proceso</p>
          </div>
          <button
            onClick={() => setShowAddParticipantModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Users className="w-5 h-5" />
            <span>Agregar Participante</span>
          </button>
        </div>

        {/* Statistics Cards */}

        {/* Participants List with Filters */}
        <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl rounded-xl overflow-hidden">
          {/* Header with Search and Filters */}
          <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/30 p-6 border-b border-slate-600/30">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold text-slate-100">
                  Participantes ({filteredAndSortedParticipants().length} de {participants.length})
                </h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 w-full sm:w-64"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="all">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Entrevista Completa">Completada</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="name">Ordenar por nombre</option>
                  <option value="date">Ordenar por fecha</option>
                  <option value="status">Ordenar por estado</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex bg-slate-700/50 rounded-lg p-1 border border-slate-600/50">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
          
            {filteredAndSortedParticipants().length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">
                  {participants.length === 0 ? 'No hay participantes registrados' : 'No se encontraron participantes'}
                </p>
                <p className="text-slate-500 text-sm">
                  {participants.length === 0 
                    ? 'Agrega el primer participante usando el botón de arriba' 
                    : 'Intenta ajustar los filtros de búsqueda'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAndSortedParticipants().map((participant, index) => (
                      <div
                        key={participant.id}
                        className="group relative bg-gradient-to-br from-slate-700/40 to-slate-600/20 p-6 rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/25 hover:-translate-y-1"
                      >
                        {/* Status Badge */}
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
                          participant.status === 'Entrevista Completa' 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                          participant.status === 'En Proceso' 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 
                            'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {participant.status}
                        </div>

                        {/* Avatar */}
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {participant.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-slate-700 ${
                              participant.status === 'Entrevista Completa' ? 'bg-green-400' :
                              participant.status === 'En Proceso' ? 'bg-blue-400' : 'bg-yellow-400'
                            }`}></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-slate-100 font-bold text-lg mb-1 truncate">{participant.name}</h4>
                            <p className="text-slate-400 text-sm flex items-center space-x-2 mb-2">
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                              </svg>
                              <span className="truncate">{participant.email}</span>
                            </p>
                            {participant.dateRegistered && (
                              <p className="text-slate-500 text-xs flex items-center space-x-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>Registrado: {participant.dateRegistered}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => {
                              setSelectedParticipant(participant);
                              setShowAssignInterviewModal(true);
                            }}
                            className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                          >
                            Asignar Entrevista
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-600/30">
                          <th className="text-left py-4 px-2 text-slate-300 font-semibold">Participante</th>
                          <th className="text-left py-4 px-2 text-slate-300 font-semibold">Email</th>
                          <th className="text-left py-4 px-2 text-slate-300 font-semibold">Estado</th>
                          <th className="text-left py-4 px-2 text-slate-300 font-semibold">Fecha</th>
                          <th className="text-left py-4 px-2 text-slate-300 font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedParticipants().map((participant, index) => (
                          <tr key={participant.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                            <td className="py-4 px-2">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                                    {participant.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-700 ${
                                    participant.status === 'Entrevista Completa' ? 'bg-green-400' :
                                    participant.status === 'En Proceso' ? 'bg-blue-400' : 'bg-yellow-400'
                                  }`}></div>
                                </div>
                                <span className="text-slate-100 font-medium">{participant.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-slate-400">{participant.email}</td>
                            <td className="py-4 px-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                participant.status === 'Entrevista Completa' 
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                participant.status === 'En Proceso' 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 
                                  'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              }`}>
                                {participant.status}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-slate-400 text-sm">
                              {participant.dateRegistered || 'N/A'}
                            </td>
                            <td className="py-4 px-2">
                              <button
                                onClick={() => {
                                  setSelectedParticipant(participant);
                                  setShowAssignInterviewModal(true);
                                }}
                                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium py-1 px-3 rounded-lg transition-all duration-200 text-sm"
                              >
                                Asignar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Participant Modal */}
        {showAddParticipantModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-600/30 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
                  <Users className="w-6 h-6 text-blue-400" />
                  <span>Nuevo Participante</span>
                </h3>
                <button
                  onClick={() => setShowAddParticipantModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddParticipant} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ingresa el nombre"
                    className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={newParticipant.lastName}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Ingresa los apellidos"
                    className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ejemplo@correo.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={newParticipant.password}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Ingresa una contraseña temporal"
                    className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddParticipantModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
                  >
                    Registrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Interview Modal */}
        {showAssignInterviewModal && selectedParticipant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-600/30 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-green-400" />
                  <span>Asignar Entrevista</span>
                </h3>
                <button
                  onClick={() => {
                    setShowAssignInterviewModal(false);
                    setSelectedParticipant(null);
                    setSelectedInterviewForAssignment('');
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              {/* Participant Info */}
              <div className="bg-slate-700/50 p-4 rounded-xl mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedParticipant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-slate-100 font-semibold">{selectedParticipant.name}</h4>
                    <p className="text-slate-400 text-sm">{selectedParticipant.email}</p>
                  </div>
                </div>
              </div>

              {/* Interview Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Selecciona una entrevista disponible
                  </label>
                  
                  {availableInterviews.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">No hay entrevistas disponibles</p>
                      <p className="text-slate-500 text-sm">Crea una entrevista primero</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scroll-green">
                      {availableInterviews
                        .filter(interview => interview.status === 'Activa')
                        .map((interview) => (
                        <div
                          key={interview.id}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedInterviewForAssignment === interview.id
                              ? 'border-green-500/50 bg-green-500/10'
                              : 'border-slate-600/30 bg-slate-700/30 hover:border-slate-500/50 hover:bg-slate-700/50'
                          }`}
                          onClick={() => setSelectedInterviewForAssignment(interview.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="text-slate-100 font-semibold mb-1">{interview.title}</h5>
                              <p className="text-slate-400 text-sm mb-2 line-clamp-2">{interview.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-slate-500">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{interview.duration || 30} min</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{interview.questions.length} preguntas</span>
                                </span>
                                {interview.difficulty && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    interview.difficulty === 'Fácil' ? 'bg-green-500/10 text-green-400' :
                                    interview.difficulty === 'Intermedio' ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-red-500/10 text-red-400'
                                  }`}>
                                    {interview.difficulty}
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedInterviewForAssignment === interview.id && (
                              <div className="ml-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedInterviewForAssignment && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                      </svg>
                      <div>
                        <p className="text-blue-300 font-medium text-sm">Información de la asignación</p>
                        <p className="text-blue-200 text-xs mt-1">
                          La entrevista será programada para las próximas 24 horas. El participante recibirá una notificación por email.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignInterviewModal(false);
                    setSelectedParticipant(null);
                    setSelectedInterviewForAssignment('');
                  }}
                  className="flex-1 px-4 py-3 border border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignInterview}
                  disabled={!selectedInterviewForAssignment || isAssigningInterview}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isAssigningInterview ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Asignando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Asignar Entrevista</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'interviews') {
    console.log('[RENDER] Tab Entrevistas - Participantes en estado:', participants.length);
    console.log('[RENDER] Tab Entrevistas - Entrevistas en estado:', interviews.length);
    
    return (
      <div className="w-full h-full p-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-100">Dashboard de Entrevistas</h2>
            <p className="text-slate-400 mt-1">Gestiona y configura entrevistas personalizadas con IA</p>
          </div>
          <button
            onClick={() => setShowCreateInterviewModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <FileText className="w-5 h-5" />
            <span>Nueva Entrevista</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-6 rounded-xl border border-purple-500/20 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Total Entrevistas</p>
                <p className="text-3xl font-bold text-purple-400">{interviews.length}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-6 rounded-xl border border-blue-500/20 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Activas</p>
                <p className="text-3xl font-bold text-blue-400">
                  {interviews.filter(i => i.status === 'Activa').length}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-6 rounded-xl border border-emerald-500/20 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm font-medium">Posiciones Únicas</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {new Set(interviews.map(i => i.position)).size}
                </p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-100 flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              <span>Entrevistas Configuradas ({interviews.length})</span>
            </h3>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Activa</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Borrador</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Inactiva</span>
              </div>
            </div>
          </div>
          
          {interviews.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No hay entrevistas configuradas</p>
              <p className="text-slate-500 text-sm">Crea tu primera entrevista personalizada con IA</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {interviews.map((interview, index) => (
                <div
                  key={interview.id}
                  className="group relative bg-gradient-to-r from-slate-700/50 to-slate-600/30 p-6 rounded-xl border border-slate-600/20 hover:border-slate-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          interview.status === 'Activa' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                          interview.status === 'Borrador' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                          'bg-gradient-to-br from-red-500 to-pink-600'
                        }`}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-700 ${
                          interview.status === 'Activa' ? 'bg-emerald-400' :
                          interview.status === 'Borrador' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-slate-100 font-semibold text-lg">{interview.position}</h4>
                        <p className="text-slate-400 text-sm flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/>
                          </svg>
                          <span>Estado: {interview.status || 'Activa'}</span>
                        </p>
                        {interview.date && (
                          <p className="text-slate-500 text-xs mt-1 flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                            </svg>
                            <span>Fecha: {interview.date}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        interview.status === 'Activa' 
                          ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                        interview.status === 'Borrador'
                          ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                          'bg-red-400/10 text-red-400 border-red-400/20'
                      }`}>
                        {interview.status || 'Activa'}
                      </span>
                      
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                        </button>
                        <button className="p-2 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-200 text-sm font-medium mb-1">Descripción:</p>
                    <p className="text-slate-300 text-sm line-clamp-2">{interview.description || 'Entrevista para la posición de ' + interview.position}</p>
                  </div>
                  
                  <div className="absolute top-2 right-2 text-xs text-slate-500 font-mono">
                    #{String(index + 1).padStart(3, '0')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Interview Modal */}
        {showCreateInterviewModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-600/30 rounded-2xl p-8 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll-dark">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
                  <FileText className="w-6 h-6 text-green-400" />
                  <span>Nueva Entrevista</span>
                </h3>
                <button
                  onClick={() => setShowCreateInterviewModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
              
              {!showQuestions ? (
                <form onSubmit={handleGenerateQuestions} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Título de la Entrevista
                    </label>
                    <input
                      type="text"
                      value={newInterview.title}
                      onChange={(e) => setNewInterview(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Desarrollador Full Stack"
                      className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Descripción y Requisitos para la IA
                    </label>
                    <textarea
                      value={newInterview.description}
                      onChange={(e) => setNewInterview(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe el puesto, habilidades técnicas requeridas (ej: React, Node.js, bases de datos), habilidades blandas (liderazgo, comunicación), años de experiencia, etc. La IA utilizará esta información para generar preguntas personalizadas."
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Estado de la Entrevista
                    </label>
                    <select
                      value={newInterview.status}
                      onChange={(e) => setNewInterview(prev => ({ ...prev, status: e.target.value as 'Activa' | 'Borrador' | 'Inactiva' }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="Activa">Activa - Lista para usar</option>
                      <option value="Borrador">Borrador - En desarrollo</option>
                      <option value="Inactiva">Inactiva - No disponible</option>
                    </select>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                      </svg>
                      <div>
                        <p className="text-blue-300 font-medium text-sm">Consejo para mejores resultados</p>
                        <p className="text-blue-200 text-xs mt-1">
                          Sé específico sobre las tecnologías, nivel de experiencia y competencias blandas. 
                          La IA generará preguntas más relevantes y precisas.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateInterviewModal(false)}
                      className="flex-1 px-4 py-3 border border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isGeneratingQuestions}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isGeneratingQuestions ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                          </svg>
                          <span>Generar Preguntas con IA</span>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-100">Preguntas Generadas</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRegenerateQuestions}
                        className="px-3 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors text-sm"
                      >
                        🔄 Regenerar
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto custom-scroll-green">
                    {generatedQuestions.map((question, index) => (
                      <div key={index} className={`p-4 rounded-lg border transition-all duration-300 ${
                        questionStatus[index] === 'approved' 
                          ? 'bg-slate-700/50 border-slate-600/20' 
                          : 'bg-orange-500/10 border-orange-500/30'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400">Pregunta {index + 1}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleQuestionStatus(index)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                questionStatus[index] === 'approved'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                              }`}
                              title={questionStatus[index] === 'approved' ? 'Marcar para regenerar' : 'Mantener pregunta'}
                            >
                              {questionStatus[index] === 'approved' ? '✓ Aprobada' : '🔄 Regenerar'}
                            </button>
                            <button
                              onClick={() => {
                                const newQuestion = prompt('Editar pregunta:', question);
                                if (newQuestion && newQuestion.trim()) {
                                  handleEditQuestion(index, newQuestion.trim());
                                }
                              }}
                              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-600/30"
                              title="Editar pregunta"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-200 text-sm leading-relaxed">{question}</p>
                        {questionStatus[index] === 'regenerate' && (
                          <div className="mt-2 text-xs text-orange-400 flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                            <span>Esta pregunta será regenerada</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <div>
                        <p className="text-green-300 font-medium text-sm">¡Preguntas listas!</p>
                        <p className="text-green-200 text-xs mt-1">
                          Revisa las preguntas generadas. Puedes editarlas haciendo clic en el ícono de edición o regenerarlas si no estás conforme.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowQuestions(false);
                        setGeneratedQuestions([]);
                        setQuestionStatus([]);
                      }}
                      className="flex-1 px-4 py-3 border border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                      ← Volver a Editar
                    </button>
                    <button
                      onClick={handleCreateInterview}
                      disabled={isCreatingInterview}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isCreatingInterview ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Creando...</span>
                        </div>
                      ) : (
                        <span>✅ Crear Entrevista</span>
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

  if (activeTab === 'results') {
    const totalInterviews = completedInterviews.length;
    const averageScore = totalInterviews > 0 ? completedInterviews.reduce((acc, i) => acc + i.score, 0) / totalInterviews : 0;
    const excellentCount = completedInterviews.filter(i => i.score >= 80).length;
    const goodCount = completedInterviews.filter(i => i.score >= 60 && i.score < 80).length;
    const needsImprovementCount = completedInterviews.filter(i => i.score < 60).length;
    
    return (
      <div className="w-full h-full p-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-100">Dashboard de Resultados</h2>
            <p className="text-slate-400 mt-1">Analiza el rendimiento y resultados de las entrevistas completadas</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              <span>Exportar Reporte</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 p-6 rounded-xl border border-indigo-500/20 backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-indigo-300 text-sm font-medium">Total Entrevistas</p>
                <p className="text-3xl font-bold text-indigo-100">{totalInterviews}</p>
              </div>
              <div className="p-3 bg-indigo-500/20 rounded-lg">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div className="text-xs text-indigo-200">Completadas exitosamente</div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-6 rounded-xl border border-emerald-500/20 backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-emerald-300 text-sm font-medium">Excelentes (80+)</p>
                <p className="text-3xl font-bold text-emerald-100">{excellentCount}</p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div className="text-xs text-emerald-200">
              {totalInterviews > 0 ? ((excellentCount / totalInterviews) * 100).toFixed(1) : 0}% del total
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-6 rounded-xl border border-amber-500/20 backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-amber-300 text-sm font-medium">Puntuación Media</p>
                <p className="text-3xl font-bold text-amber-100">{averageScore.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="text-xs text-amber-200">de 100 puntos</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-6 rounded-xl border border-purple-500/20 backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-300 text-sm font-medium">Duración Promedio</p>
                <p className="text-2xl font-bold text-purple-100">
                  {totalInterviews > 0 ? 
                    Math.floor(completedInterviews.reduce((acc, i) => acc + i.duration, 0) / totalInterviews / 60) : 0}min
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="text-xs text-purple-200">Tiempo por entrevista</div>
          </div>
        </div>

        {/* Results List */}
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600/30">
          <h3 className="text-xl font-semibold text-slate-100 mb-6 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Entrevistas Completadas ({totalInterviews})</span>
          </h3>
          
          {completedInterviews.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No hay resultados disponibles</p>
              <p className="text-slate-500 text-sm">Los resultados aparecerán aquí una vez que se completen las entrevistas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedInterviews.map((interview, index) => (
                <div
                  key={interview.id}
                  className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 p-6 rounded-xl border border-slate-600/20 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-900/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Score Badge */}
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                          interview.score >= 80 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                          interview.score >= 60 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                          'bg-gradient-to-br from-red-500 to-red-600'
                        }`}>
                          {interview.score}
                        </div>
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800 ${
                          interview.score >= 80 ? 'bg-emerald-300' :
                          interview.score >= 60 ? 'bg-amber-300' : 'bg-red-300'
                        }`}></div>
                      </div>
                      
                      {/* Interview Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-xl font-bold text-slate-100 mb-1">
                              {interview.interviewTitle}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                interview.score >= 80 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                interview.score >= 60
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {interview.score >= 80 ? 'Excelente' : 
                                 interview.score >= 60 ? 'Bueno' : 
                                 'Necesita Mejora'}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-400 capitalize">{interview.state.toLowerCase()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Participant Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-slate-300">
                            <Users className="w-4 h-4 text-indigo-400" />
                            <span className="font-medium">{interview.userName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-300">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span>{new Date(interview.date).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-300">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>{Math.floor(interview.duration / 60)}:{(interview.duration % 60).toString().padStart(2, '0')} min</span>
                          </div>
                        </div>
                        
                        {/* Answers Summary */}
                        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-600/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">
                              Resumen de Respuestas ({interview.answers.length} preguntas)
                            </span>
                            <span className="text-xs text-slate-500">
                              Promedio: {interview.answers.length > 0 ? 
                                (interview.answers.reduce((acc, ans) => acc + ans.points, 0) / interview.answers.length).toFixed(1) : 
                                '0'} pts
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {interview.answers.slice(0, 3).map((answer, idx) => (
                              <div key={idx} className="flex items-center space-x-2 bg-slate-700/30 px-3 py-1 rounded-full">
                                <span className="text-xs text-slate-400">P{idx + 1}:</span>
                                <span className={`text-xs font-medium ${
                                  answer.points >= 80 ? 'text-emerald-400' :
                                  answer.points >= 60 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  {answer.points}pts
                                </span>
                              </div>
                            ))}
                            {interview.answers.length > 3 && (
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                <span>+{interview.answers.length - 3} más</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score Display */}
                    <div className="text-right ml-6">
                      <p className="text-3xl font-bold text-slate-100">{interview.score}</p>
                      <p className="text-sm text-slate-400">de 100</p>
                      <div className="mt-2 w-16 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            interview.score >= 80 ? 'bg-emerald-500' :
                            interview.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${interview.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
