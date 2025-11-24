import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PARTICIPANTS_CREATE_URL, INTERVIEWS_API_BASE } from '@/config';
import { Participant, AvailableInterview, AssignedInterview } from '@/types';

export interface UseParticipantsProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  availableInterviews: AvailableInterview[];
  assignedInterviews: AssignedInterview[];
  setAssignedInterviews: React.Dispatch<React.SetStateAction<AssignedInterview[]>>;
  searchTerm: string;
  statusFilter: 'all' | 'Pendiente' | 'En Proceso' | 'Entrevista Completa';
  sortBy: 'name' | 'date' | 'status';
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useParticipants = ({
  participants,
  setParticipants,
  availableInterviews,
  assignedInterviews,
  setAssignedInterviews,
  searchTerm,
  statusFilter,
  sortBy,
  onShowToast
}: UseParticipantsProps) => {
  const { getAuthFetch, getAuthHeader, isAuthenticated } = useAuth();

  // Estados para modales y formularios
  const [newParticipant, setNewParticipant] = useState({ name: '', lastName: '', email: '', password: '' });
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showAssignInterviewModal, setShowAssignInterviewModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [selectedInterviewForAssignment, setSelectedInterviewForAssignment] = useState<string>('');
  const [isAssigningInterview, setIsAssigningInterview] = useState(false);

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

  // Función para agregar participante
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
      const url = `${INTERVIEWS_API_BASE}/api/userinterview/assignInterviewToPracticante?userId=${selectedParticipant.id}&interviewId=${selectedInterviewForAssignment}`;
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

  return {
    // Estados
    newParticipant,
    setNewParticipant,
    showAddParticipantModal,
    setShowAddParticipantModal,
    showAssignInterviewModal,
    setShowAssignInterviewModal,
    selectedParticipant,
    setSelectedParticipant,
    selectedInterviewForAssignment,
    setSelectedInterviewForAssignment,
    isAssigningInterview,
    
    // Funciones
    filteredAndSortedParticipants,
    loadAssignmentsFromStorage,
    saveAssignmentsToStorage,
    handleAddParticipant,
    handleAssignInterview,
  };
};
