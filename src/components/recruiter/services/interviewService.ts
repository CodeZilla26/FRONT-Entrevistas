import { INTERVIEWS_API_BASE } from '@/config';
import { Interview, AvailableInterview, AssignedInterview } from '@/types';

export interface CreateInterviewData {
  title: string;
  description: string;
  active: boolean;
  questions: Array<{ text: string; points: number; time: number }>;
}

export interface CreateInterviewResponse {
  id: string;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  questions: Array<{ text: string; points: number; time: number }>;
  message?: string;
  error?: string;
}

export interface AssignInterviewData {
  userId: string;
  interviewId: string;
}

export interface AssignInterviewResponse {
  interviewAsignedId: string;
  creationDate: string;
  message?: string;
  error?: string;
}

export interface GenerateQuestionsData {
  position: string;
  description: string;
  questionCount?: number;
  regenerateMode?: boolean;
  existingQuestions?: string[];
  indicesToRegenerate?: number[];
}

export interface GenerateQuestionsResponse {
  success: boolean;
  questions: Array<{ text: string; points: number; time: number }>;
  error?: string;
}

export class InterviewService {
  constructor(
    private getAuthFetch: (url: string, options?: RequestInit) => Promise<Response>,
    private isAuthenticated: boolean
  ) {}

  /**
   * Obtener lista de todas las entrevistas
   */
  async getInterviews(): Promise<Interview[]> {
    try {
      console.log('[InterviewService] Obteniendo lista de entrevistas...');
      
      if (!INTERVIEWS_API_BASE || !this.isAuthenticated) {
        console.log('[InterviewService] API no configurada o no autenticado');
        return [];
      }

      const response = await this.getAuthFetch('/api/interview/listInterviews');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => []);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta no es un array válido');
      }

      // Mapear datos de API a formato UI
      const interviews: Interview[] = data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        description: item.description,
        status: item.active ? 'Activa' : 'Borrador',
        createdAt: item.createdAt,
        questions: Array.isArray(item.questions) ? item.questions.map((q: any) => q?.text ?? '') : [],
        // Campos de compatibilidad para UI existente
        position: item.title,
        date: item.createdAt
      }));

      console.log('[InterviewService] Entrevistas cargadas:', interviews.length);
      return interviews;

    } catch (error) {
      console.error('[InterviewService] Error obteniendo entrevistas:', error);
      throw new Error(
        error instanceof Error 
          ? `Error al cargar entrevistas: ${error.message}`
          : 'Error desconocido al cargar entrevistas'
      );
    }
  }

  /**
   * Obtener entrevistas disponibles para asignar
   */
  async getAvailableInterviews(): Promise<AvailableInterview[]> {
    try {
      console.log('[InterviewService] Obteniendo entrevistas disponibles...');
      
      if (!INTERVIEWS_API_BASE || !this.isAuthenticated) {
        console.log('[InterviewService] API no configurada o no autenticado');
        return [];
      }

      const response = await this.getAuthFetch('/api/interview/listInterviews');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => []);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta no es un array válido');
      }

      // Mapear a formato AvailableInterview
      const availableInterviews: AvailableInterview[] = data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        description: item.description,
        status: item.active ? 'Activa' : 'Borrador',
        createdAt: item.createdAt,
        questions: Array.isArray(item.questions) ? item.questions.map((q: any) => q?.text ?? '') : [],
        duration: item.duration || 30, // duración por defecto
        difficulty: item.difficulty || 'Intermedio'
      }));

      console.log('[InterviewService] Entrevistas disponibles cargadas:', availableInterviews.length);
      return availableInterviews;

    } catch (error) {
      console.error('[InterviewService] Error obteniendo entrevistas disponibles:', error);
      throw new Error(
        error instanceof Error 
          ? `Error al cargar entrevistas disponibles: ${error.message}`
          : 'Error desconocido al cargar entrevistas disponibles'
      );
    }
  }

  /**
   * Crear una nueva entrevista
   */
  async createInterview(interviewData: CreateInterviewData): Promise<CreateInterviewResponse> {
    try {
      console.log('[InterviewService] Creando nueva entrevista...');
      
      if (!this.isAuthenticated) {
        throw new Error('Debes iniciar sesión para crear entrevistas');
      }

      if (!INTERVIEWS_API_BASE) {
        throw new Error('API de entrevistas no configurada');
      }

      // Validar datos requeridos
      if (!interviewData.title?.trim() || !interviewData.description?.trim()) {
        throw new Error('Título y descripción son requeridos');
      }

      if (!interviewData.questions || interviewData.questions.length === 0) {
        throw new Error('Debe incluir al menos una pregunta');
      }

      // Validar estructura de preguntas
      const invalidQuestions = interviewData.questions.some(q => 
        !q?.text || typeof q.points !== 'number' || typeof q.time !== 'number'
      );
      
      if (invalidQuestions) {
        throw new Error('Todas las preguntas deben tener texto, puntos y tiempo válidos');
      }

      console.log('[InterviewService] Datos de entrevista:', {
        ...interviewData,
        questions: `${interviewData.questions.length} preguntas`
      });

      const response = await this.getAuthFetch('/api/interview/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify(interviewData)
      });

      const rawResponse = await response.text();
      let responseData: any = null;
      
      try { 
        responseData = rawResponse ? JSON.parse(rawResponse) : null; 
      } catch { 
        responseData = rawResponse; 
      }

      if (!response.ok) {
        const errorMessage = typeof responseData === 'string' 
          ? responseData 
          : (responseData?.message || responseData?.error || JSON.stringify(responseData));
        throw new Error(errorMessage || `HTTP ${response.status}`);
      }

      console.log('[InterviewService] Entrevista creada exitosamente:', responseData);
      return responseData as CreateInterviewResponse;

    } catch (error) {
      console.error('[InterviewService] Error creando entrevista:', error);
      throw new Error(
        error instanceof Error 
          ? error.message
          : 'Error desconocido al crear entrevista'
      );
    }
  }

  /**
   * Asignar entrevista a un participante
   */
  async assignInterview(assignmentData: AssignInterviewData): Promise<AssignInterviewResponse> {
    try {
      console.log('[InterviewService] Asignando entrevista...');
      
      if (!this.isAuthenticated) {
        throw new Error('Debes iniciar sesión para asignar entrevistas');
      }

      if (!INTERVIEWS_API_BASE) {
        throw new Error('API de entrevistas no configurada');
      }

      const { userId, interviewId } = assignmentData;
      
      if (!userId || !interviewId) {
        throw new Error('ID de usuario e ID de entrevista son requeridos');
      }

      // Construir URL con query parameters
      const url = `${INTERVIEWS_API_BASE}/api/userinterview/assignInterviewToPracticante?userId=${userId}&interviewId=${interviewId}`;
      
      console.log('[InterviewService] URL de asignación:', url);
      console.log('[InterviewService] Datos:', { userId, interviewId });

      const response = await this.getAuthFetch(url, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: 'Error desconocido',
          code: 'UNKNOWN_ERROR' 
        }));
        
        console.error('[InterviewService] Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url,
          userId,
          interviewId
        });

        let errorMessage = 'Error al asignar entrevista';
        
        switch (response.status) {
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
            errorMessage = `Error ${response.status}: ${errorData.message || 'Error desconocido'}`;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('[InterviewService] Entrevista asignada exitosamente:', responseData);
      
      return responseData as AssignInterviewResponse;

    } catch (error) {
      console.error('[InterviewService] Error asignando entrevista:', error);
      throw new Error(
        error instanceof Error 
          ? error.message
          : 'Error desconocido al asignar entrevista'
      );
    }
  }

  /**
   * Generar preguntas con IA
   */
  async generateQuestions(questionsData: GenerateQuestionsData): Promise<GenerateQuestionsResponse> {
    try {
      console.log('[InterviewService] Generando preguntas con IA...');
      
      const { position, description, questionCount = 5 } = questionsData;
      
      if (!position?.trim() || !description?.trim()) {
        throw new Error('Posición y descripción son requeridos para generar preguntas');
      }

      console.log('[InterviewService] Datos para IA:', {
        position,
        description: description.substring(0, 100) + '...',
        questionCount
      });

      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionsData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al generar preguntas');
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No se generaron preguntas válidas');
      }

      // Validar estructura de preguntas generadas
      const invalidQuestions = data.questions.some((q: any) => 
        !q?.text || typeof q.points !== 'number' || typeof q.time !== 'number'
      );
      
      if (invalidQuestions) {
        throw new Error('La API de IA no devolvió preguntas con estructura válida (text, points, time)');
      }

      console.log('[InterviewService] Preguntas generadas exitosamente:', data.questions.length);
      return data as GenerateQuestionsResponse;

    } catch (error) {
      console.error('[InterviewService] Error generando preguntas:', error);
      throw new Error(
        error instanceof Error 
          ? error.message
          : 'Error desconocido al generar preguntas'
      );
    }
  }

  /**
   * Mapear entrevista de API a formato UI
   */
  static mapInterviewFromAPI(apiData: any): Interview {
    return {
      id: String(apiData.id),
      title: apiData.title,
      description: apiData.description,
      status: apiData.active ? 'Activa' : 'Borrador',
      createdAt: apiData.createdAt,
      questions: Array.isArray(apiData.questions) ? apiData.questions.map((q: any) => q?.text ?? '') : [],
      position: apiData.title,
      date: apiData.createdAt
    };
  }

  /**
   * Mapear respuesta de creación a formato UI
   */
  static mapCreatedInterviewToUI(responseData: CreateInterviewResponse): Interview {
    return {
      id: String(responseData.id),
      title: responseData.title,
      description: responseData.description,
      status: responseData.active ? 'Activa' : 'Borrador',
      createdAt: responseData.createdAt,
      questions: Array.isArray(responseData.questions) ? responseData.questions.map((q: any) => q?.text ?? '') : [],
      position: responseData.title,
      date: responseData.createdAt
    };
  }

  /**
   * Crear asignación local desde respuesta del servidor
   */
  static createAssignmentFromResponse(
    responseData: AssignInterviewResponse,
    userId: string,
    interviewId: string,
    interview: AvailableInterview
  ): AssignedInterview {
    return {
      id: responseData.interviewAsignedId,
      interviewId: interviewId,
      participantId: userId,
      assignedAt: responseData.creationDate || new Date().toISOString(),
      status: 'Asignada',
      interview: interview
    };
  }
}

/**
 * Factory function para crear instancia del servicio
 */
export const createInterviewService = (
  getAuthFetch: (url: string, options?: RequestInit) => Promise<Response>,
  isAuthenticated: boolean
) => {
  return new InterviewService(getAuthFetch, isAuthenticated);
};
