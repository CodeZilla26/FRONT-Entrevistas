import { PARTICIPANTS_LIST_URL, PARTICIPANTS_CREATE_URL } from '@/config';
import { Participant } from '@/types';

export interface CreateParticipantData {
  name: string;
  lastName: string;
  email: string;
  password: string;
  rolName?: string;
}

export interface CreateParticipantResponse {
  id: string;
  name: string;
  lastName: string;
  email: string;
  status: string;
  creationDate?: string;
  dateRegistered?: string;
  createdAt?: string;
  message?: string;
}

export class ParticipantService {
  constructor(
    private getAuthFetch: (url: string, options?: RequestInit) => Promise<Response>,
    private isAuthenticated: boolean
  ) {}

  /**
   * Obtener lista de todos los participantes
   */
  async getParticipants(): Promise<Participant[]> {
    try {
      console.log('[ParticipantService] Obteniendo lista de participantes...');
      
      if (!PARTICIPANTS_LIST_URL || !this.isAuthenticated) {
        console.log('[ParticipantService] URL no configurada o no autenticado');
        return [];
      }

      console.log('[ParticipantService] URL:', PARTICIPANTS_LIST_URL);
      const response = await this.getAuthFetch(PARTICIPANTS_LIST_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => []);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta no es un array válido');
      }

      // Helper: mapear estado backend -> etiqueta de UI
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

      // Mapear datos de API v2 a formato UI
      const participants: Participant[] = data.map((item: any) => ({
        id: String(item.id), // Asegurar que sea string
        name: [item.name, item.lastName].filter(Boolean).join(' ') || 'N/A',
        email: item.email ?? 'sin-email@local',
        status: mapInterviewStatusToUI(item.interviewStatus),
        dateRegistered: item.dateRegistered || item.createdAt || undefined,
      }));

      console.log('[ParticipantService] Participantes cargados:', participants.length);
      return participants;

    } catch (error) {
      console.error('[ParticipantService] Error obteniendo participantes:', error);
      throw new Error(
        error instanceof Error 
          ? `Error al cargar participantes: ${error.message}`
          : 'Error desconocido al cargar participantes'
      );
    }
  }

  /**
   * Crear un nuevo participante
   */
  async createParticipant(participantData: CreateParticipantData): Promise<CreateParticipantResponse> {
    try {
      console.log('[ParticipantService] Creando nuevo participante...');
      
      if (!this.isAuthenticated) {
        throw new Error('Debes iniciar sesión para crear participantes');
      }

      if (!PARTICIPANTS_CREATE_URL) {
        throw new Error('URL de creación no configurada. Configura PARTICIPANTS_CREATE_URL en src/config.ts');
      }

      // Validar datos requeridos
      const { name, lastName, email, password } = participantData;
      if (!name?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
        throw new Error('Todos los campos son requeridos: nombre, apellidos, email y contraseña');
      }

      // Preparar payload
      const payload = {
        name: name.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: password.trim(),
        rolName: participantData.rolName || 'ROLE_PRACTICANTE',
      };

      console.log('[ParticipantService] Enviando datos:', { ...payload, password: '***' });
      console.log('[ParticipantService] URL:', PARTICIPANTS_CREATE_URL);

      const response = await this.getAuthFetch(PARTICIPANTS_CREATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = responseData?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      console.log('[ParticipantService] Participante creado exitosamente:', responseData);
      return responseData as CreateParticipantResponse;

    } catch (error) {
      console.error('[ParticipantService] Error creando participante:', error);
      throw new Error(
        error instanceof Error 
          ? error.message
          : 'Error desconocido al crear participante'
      );
    }
  }

  /**
   * Validar email único
   */
  async validateUniqueEmail(email: string, existingParticipants: Participant[]): Promise<boolean> {
    try {
      // Validación local primero (más rápida)
      const emailExists = existingParticipants.some(p => 
        p.email.toLowerCase() === email.toLowerCase()
      );

      if (emailExists) {
        throw new Error('Este email ya está registrado');
      }

      // Aquí podrías agregar validación del servidor si existe endpoint
      // const response = await this.getAuthFetch(`/api/participants/validate-email?email=${encodeURIComponent(email)}`);
      
      return true;

    } catch (error) {
      console.error('[ParticipantService] Error validando email:', error);
      throw error;
    }
  }

  /**
   * Mapear participante de API a formato UI
   */
  static mapParticipantFromAPI(apiData: any): Participant {
    return {
      id: String(apiData.id),
      name: [apiData.name, apiData.lastName].filter(Boolean).join(' ') || 'N/A',
      email: apiData.email ?? 'sin-email@local',
      status: (apiData.status as Participant['status']) || 'Pendiente',
      dateRegistered: apiData.dateRegistered || apiData.createdAt || undefined,
    };
  }

  /**
   * Mapear participante de respuesta de creación a formato UI
   */
  static mapCreatedParticipantToUI(
    responseData: CreateParticipantResponse, 
    originalData: CreateParticipantData
  ): Participant {
    return {
      id: responseData.id || `temp_${Date.now()}`,
      name: (responseData.name && responseData.lastName) 
        ? `${responseData.name} ${responseData.lastName}` 
        : `${originalData.name} ${originalData.lastName}`.trim(),
      email: responseData.email ?? originalData.email,
      status: (responseData.status as Participant['status']) || 'Pendiente',
      dateRegistered: responseData.creationDate || responseData.dateRegistered || responseData.createdAt || new Date().toLocaleDateString(),
    };
  }
}

/**
 * Factory function para crear instancia del servicio
 */
export const createParticipantService = (
  getAuthFetch: (url: string, options?: RequestInit) => Promise<Response>,
  isAuthenticated: boolean
) => {
  return new ParticipantService(getAuthFetch, isAuthenticated);
};
