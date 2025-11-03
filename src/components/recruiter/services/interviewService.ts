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
      
      if (!INTERVIEWS_API_BASE || !this.isAuthenticated) {
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

      return interviews;

    } catch (error) {
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
      
      if (!INTERVIEWS_API_BASE || !this.isAuthenticated) {
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

      return availableInterviews;

    } catch (error) {
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

      const invalidQuestions = interviewData.questions.some(q => 
        !q?.text || typeof q.points !== 'number' || typeof q.time !== 'number'
      );
      
      if (invalidQuestions) {
        throw new Error('Todas las preguntas deben tener texto, puntos y tiempo válidos');
      }

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

      return responseData as CreateInterviewResponse;

    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message
          : 'Error desconocido al crear entrevista'
      );
    }
  }

  /**
   * Generar preguntas para una entrevista
   */
  async generateQuestions(questionsData: GenerateQuestionsData): Promise<GenerateQuestionsResponse> {
    try {
      
      const { position, description, questionCount = 5 } = questionsData;
      if (!position?.trim() || !description?.trim()) {
        throw new Error('Posición y descripción son requeridos para generar preguntas');
      }

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

      return data as GenerateQuestionsResponse;

    } catch (error) {
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
