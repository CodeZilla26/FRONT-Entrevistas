import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PARTICIPANTS_LIST_URL, INTERVIEWS_API_BASE } from '@/config';
import { Participant, Interview, AvailableInterview, AssignedInterview, CompletedInterview } from '@/types';

export interface UseRecruiterDataProps {
  activeTab: string;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useRecruiterData = ({ activeTab, onShowToast }: UseRecruiterDataProps) => {
  const { getAuthFetch, isAuthenticated } = useAuth();

  // Estados principales
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [availableInterviews, setAvailableInterviews] = useState<AvailableInterview[]>([]);
  const [assignedInterviews, setAssignedInterviews] = useState<AssignedInterview[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<CompletedInterview[]>([]);
  const [isLoadingTabData, setIsLoadingTabData] = useState(false);

  // Estados para filtros del dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pendiente' | 'En Proceso' | 'Entrevista Completa'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name');

  // Limpiar COMPLETAMENTE el estado al cambiar de tab
  const clearAllData = () => {
    
    // Limpiar TODOS los datos sin excepción
    setParticipants([]);
    setInterviews([]);
    setAvailableInterviews([]);
    setAssignedInterviews([]);
    setCompletedInterviews([]);
  };

  // Función para cargar entrevistas disponibles
  const loadAvailableInterviews = async () => {
    try {
      
      if (!INTERVIEWS_API_BASE || !isAuthenticated) {
        return;
      }
      
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
      } else {
        throw new Error('No se pudieron cargar entrevistas disponibles');
      }
    } catch (error) {
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
    }
  };

  // Función para cargar entrevistas completadas
  const loadCompletedInterviews = async () => {
    try {
      
      // Cargar todas las entrevistas completadas de todos los usuarios
      const url = `${INTERVIEWS_API_BASE}/api/userinterview/findAll`;
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });


      if (res.ok) {
        const data: CompletedInterview[] = await res.json();
        
        setCompletedInterviews(data);
        
        return data;
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Error desconocido' }));
        onShowToast(`Error cargando entrevistas completadas: ${errorData.message || res.statusText}`, 'error');
        return [];
      }
    } catch (error) {
      onShowToast('Error de conexión al cargar entrevistas completadas', 'error');
      return [];
    }
  };

  // Función para cargar entrevista específica por userId (con video)
  const loadInterviewByUserId = async (userId: string): Promise<CompletedInterview | null> => {
    try {
      
      const url = `${INTERVIEWS_API_BASE}/api/userinterview/findByUserId?userId=${userId}`;
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });


      if (res.ok) {
        const data: CompletedInterview = await res.json();
        
        return data;
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Error desconocido' }));
        onShowToast(`Error cargando entrevista del usuario: ${errorData.message || res.statusText}`, 'error');
        return null;
      }
    } catch (error) {
      onShowToast('Error de conexión al cargar entrevista del usuario', 'error');
      return null;
    }
  };

  // Cargar datos según el tab activo
  useEffect(() => {
    const loadDataForTab = async () => {
      try {
        setIsLoadingTabData(true);
        setParticipants([]);
        setInterviews([]);
        setAvailableInterviews([]);
        setAssignedInterviews([]);
        
        
        if (activeTab === 'participants') {
          if (PARTICIPANTS_LIST_URL && isAuthenticated) {
            const pRes = await getAuthFetch(PARTICIPANTS_LIST_URL);
            const pData = await pRes.json().catch(() => []);
            if (pRes.ok && Array.isArray(pData)) {
              const mapInterviewStatusToUI = (backendStatus?: string): Participant['status'] => {
                switch ((backendStatus || '').toUpperCase()) {
                  case 'COMPLETADA':
                    return 'Entrevista Completa';
                  case 'PENDIENTE':
                    return 'En Proceso';
                  case 'NO_ASIGNADA':
                    return 'Pendiente';
                  default:
                    return 'Pendiente';
                }
              };

              const mapped: Participant[] = pData.map((it: any) => {
                const realId = String(it.id);
                return {
                  id: realId,
                  name: [it.name, it.lastName].filter(Boolean).join(' ') || 'N/A',
                  email: it.email ?? 'sin-email@local',
                  status: mapInterviewStatusToUI(it.interviewStatus),
                  dateRegistered: it.dateRegistered || it.createdAt || undefined,
                };
              });
              setParticipants(mapped);
              setTimeout(() => {
                // Verificar que aún estemos en el tab de participantes antes de cargar
                if (activeTab === 'participants') {
                  loadAvailableInterviews();
                } else {
                }
              }, 100);
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
        }
        
        if (activeTab === 'results') {
          // Cargar entrevistas completadas para el tab de resultados
          await loadCompletedInterviews();
        }
        
      } catch (e) {
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

  // useEffect para detectar cambios inesperados en los datos
  useEffect(() => {
    
    // Detectar mezcla de datos
    if (activeTab === 'participants' && interviews.length > 0) {
    }
    if (activeTab === 'interviews' && participants.length > 0) {
    }
  }, [participants, interviews, activeTab]);

  return {
    // Estados
    participants,
    setParticipants,
    interviews,
    setInterviews,
    availableInterviews,
    setAvailableInterviews,
    assignedInterviews,
    setAssignedInterviews,
    completedInterviews,
    setCompletedInterviews,
    isLoadingTabData,
    
    // Estados de filtros
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    
    // Funciones
    clearAllData,
    loadAvailableInterviews,
    loadCompletedInterviews,
    loadInterviewByUserId,
  };
};
