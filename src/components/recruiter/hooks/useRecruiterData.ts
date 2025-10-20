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
    console.log('[RecruiterPanel] LIMPIEZA COMPLETA DE TODOS LOS DATOS');
    
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
      
      // Cargar todas las entrevistas completadas de todos los usuarios
      const url = `${INTERVIEWS_API_BASE}/api/userinterview/findAll`;
      console.log('[Entrevistas Completadas] URL:', url);
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });

      console.log('[Entrevistas Completadas] Respuesta status:', res.status);

      if (res.ok) {
        const data: CompletedInterview[] = await res.json();
        console.log('[Entrevistas Completadas] Datos recibidos:', data);
        console.log('[Entrevistas Completadas] Videos disponibles:', data.filter(d => d.s3KeyPath).length);
        
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

  // Función para cargar entrevista específica por userId (con video)
  const loadInterviewByUserId = async (userId: string): Promise<CompletedInterview | null> => {
    try {
      console.log('[Entrevista Usuario] Cargando para userId:', userId);
      
      const url = `${INTERVIEWS_API_BASE}/api/userinterview/findByUserId?userId=${userId}`;
      console.log('[Entrevista Usuario] URL:', url);
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });

      console.log('[Entrevista Usuario] Respuesta status:', res.status);

      if (res.ok) {
        const data: CompletedInterview = await res.json();
        console.log('[Entrevista Usuario] Datos recibidos:', data);
        console.log('[Entrevista Usuario] Video disponible:', !!data.s3KeyPath);
        
        return data;
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[Entrevista Usuario] Error en respuesta:', errorData);
        onShowToast(`Error cargando entrevista del usuario: ${errorData.message || res.statusText}`, 'error');
        return null;
      }
    } catch (error) {
      console.error('[Entrevista Usuario] Error:', error);
      onShowToast('Error de conexión al cargar entrevista del usuario', 'error');
      return null;
    }
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
        
        console.log('[RecruiterPanel] Estado limpiado, cargando datos para tab:', activeTab);
        
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
              console.log('[Participantes] Cargados:', mapped.length, 'participantes');
              setTimeout(() => {
                // Verificar que aún estemos en el tab de participantes antes de cargar
                if (activeTab === 'participants') {
                  loadAvailableInterviews();
                } else {
                  console.log('[Participantes] Tab cambió antes de cargar entrevistas disponibles, cancelando');
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
