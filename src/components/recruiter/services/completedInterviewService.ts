import { INTERVIEWS_API_BASE } from '@/config';
import { CompletedInterview } from '@/types';

export interface CompletedInterviewsResponse {
  data: CompletedInterview[];
  total: number;
  message?: string;
  error?: string;
}

export interface UserInterviewResponse extends CompletedInterview {
  message?: string;
  error?: string;
}

export interface VideoUrlResponse {
  url: string;
  expiresAt: string;
  message?: string;
  error?: string;
}

export class CompletedInterviewService {
  constructor(
    private getAuthFetch: (url: string, options?: RequestInit) => Promise<Response>,
    private isAuthenticated: boolean
  ) {}

  /**
   * Obtener todas las entrevistas completadas
   */
  async getCompletedInterviews(): Promise<CompletedInterview[]> {
    try {
      console.log('[CompletedInterviewService] Obteniendo entrevistas completadas...');
      
      if (!INTERVIEWS_API_BASE || !this.isAuthenticated) {
        console.log('[CompletedInterviewService] API no configurada o no autenticado');
        return [];
      }

      const url = `${INTERVIEWS_API_BASE}/api/userinterview/findAll`;
      console.log('[CompletedInterviewService] URL:', url);
      
      const response = await this.getAuthFetch(url, {
        method: 'GET'
      });

      console.log('[CompletedInterviewService] Respuesta status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[CompletedInterviewService] Error en respuesta:', errorData);
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data: CompletedInterview[] = await response.json();
      console.log('[CompletedInterviewService] Datos recibidos:', data.length, 'entrevistas');
      console.log('[CompletedInterviewService] Videos disponibles:', data.filter(d => d.s3KeyPath).length);
      
      // Validar estructura de datos
      if (!Array.isArray(data)) {
        throw new Error('La respuesta no es un array válido');
      }

      // Mapear y validar cada entrevista
      const validatedInterviews: CompletedInterview[] = data.map((interview, index) => {
        try {
          return this.validateAndMapInterview(interview);
        } catch (error) {
          console.warn(`[CompletedInterviewService] Entrevista ${index} inválida:`, error);
          // Retornar estructura mínima válida según el tipo CompletedInterview
          return {
            id: interview.id || `invalid_${index}`,
            userId: interview.userId || 'unknown',
            interviewId: interview.interviewId || 'unknown',
            interviewTitle: interview.interviewTitle || 'Entrevista sin título',
            userName: interview.userName || 'Usuario desconocido',
            score: interview.score || 0,
            state: interview.state || 'PENDIENTE',
            date: interview.date || new Date().toISOString(),
            duration: interview.duration || 0,
            s3KeyPath: interview.s3KeyPath || '',
            answers: interview.answers || []
          };
        }
      });

      console.log('[CompletedInterviewService] Entrevistas completadas cargadas:', validatedInterviews.length);
      return validatedInterviews;

    } catch (error) {
      console.error('[CompletedInterviewService] Error obteniendo entrevistas completadas:', error);
      throw new Error(
        error instanceof Error 
          ? `Error al cargar entrevistas completadas: ${error.message}`
          : 'Error desconocido al cargar entrevistas completadas'
      );
    }
  }

  /**
   * Obtener entrevista específica por userId
   */
  async getInterviewByUserId(userId: string): Promise<CompletedInterview | null> {
    try {
      console.log('[CompletedInterviewService] Obteniendo entrevista para userId:', userId);
      
      if (!INTERVIEWS_API_BASE || !this.isAuthenticated) {
        throw new Error('API no configurada o no autenticado');
      }

      if (!userId?.trim()) {
        throw new Error('ID de usuario es requerido');
      }

      const url = `${INTERVIEWS_API_BASE}/api/userinterview/findByUserId?userId=${encodeURIComponent(userId)}`;
      console.log('[CompletedInterviewService] URL:', url);
      
      const response = await this.getAuthFetch(url, {
        method: 'GET'
      });

      console.log('[CompletedInterviewService] Respuesta status:', response.status);

      if (response.status === 404) {
        console.log('[CompletedInterviewService] No se encontró entrevista para el usuario');
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[CompletedInterviewService] Error en respuesta:', errorData);
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data: CompletedInterview = await response.json();
      console.log('[CompletedInterviewService] Datos de entrevista recibidos:', {
        id: data.id,
        userId: data.userId,
        hasVideo: !!data.s3KeyPath
      });

      const validatedInterview = this.validateAndMapInterview(data);
      return validatedInterview;

    } catch (error) {
      console.error('[CompletedInterviewService] Error obteniendo entrevista por userId:', error);
      throw new Error(
        error instanceof Error 
          ? `Error al cargar entrevista del usuario: ${error.message}`
          : 'Error desconocido al cargar entrevista del usuario'
      );
    }
  }

  /**
   * Obtener URL presignada para video de S3
   */
  async getVideoUrl(s3KeyPath: string): Promise<VideoUrlResponse> {
    try {
      console.log('[CompletedInterviewService] Obteniendo URL de video para:', s3KeyPath);
      
      if (!INTERVIEWS_API_BASE || !this.isAuthenticated) {
        throw new Error('API no configurada o no autenticado');
      }

      if (!s3KeyPath?.trim()) {
        throw new Error('Ruta de video S3 es requerida');
      }

      // Endpoint hipotético para obtener URL presignada
      const url = `${INTERVIEWS_API_BASE}/api/userinterview/video-url?s3Key=${encodeURIComponent(s3KeyPath)}`;
      
      const response = await this.getAuthFetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data: VideoUrlResponse = await response.json();
      console.log('[CompletedInterviewService] URL de video obtenida exitosamente');
      
      return data;

    } catch (error) {
      console.error('[CompletedInterviewService] Error obteniendo URL de video:', error);
      // Fallback: retornar la key path directamente (para desarrollo)
      return {
        url: s3KeyPath,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Calcular estadísticas de entrevistas completadas
   */
  calculateStatistics(completedInterviews: CompletedInterview[]) {
    const totalInterviews = completedInterviews.length;
    
    if (totalInterviews === 0) {
      return {
        totalInterviews: 0,
        averageScore: 0,
        excellentCount: 0,
        goodCount: 0,
        needsImprovementCount: 0,
        excellentPercentage: 0,
        goodPercentage: 0,
        needsImprovementPercentage: 0,
        averageDuration: 0,
        videosAvailable: 0,
        videosPercentage: 0
      };
    }

    const scores = completedInterviews.map(i => i.score);
    const durations = completedInterviews.map(i => i.duration || 0);
    const videosAvailable = completedInterviews.filter(i => i.s3KeyPath).length;

    const averageScore = scores.reduce((acc, score) => acc + score, 0) / totalInterviews;
    const averageDuration = durations.reduce((acc, duration) => acc + duration, 0) / totalInterviews;

    const excellentCount = completedInterviews.filter(i => i.score >= 80).length;
    const goodCount = completedInterviews.filter(i => i.score >= 60 && i.score < 80).length;
    const needsImprovementCount = completedInterviews.filter(i => i.score < 60).length;

    return {
      totalInterviews,
      averageScore: Math.round(averageScore * 100) / 100,
      excellentCount,
      goodCount,
      needsImprovementCount,
      excellentPercentage: Math.round((excellentCount / totalInterviews) * 100),
      goodPercentage: Math.round((goodCount / totalInterviews) * 100),
      needsImprovementPercentage: Math.round((needsImprovementCount / totalInterviews) * 100),
      averageDuration: Math.round(averageDuration),
      videosAvailable,
      videosPercentage: Math.round((videosAvailable / totalInterviews) * 100)
    };
  }

  /**
   * Validar y mapear entrevista desde API
   */
  private validateAndMapInterview(interview: any): CompletedInterview {
    // Validaciones básicas
    if (!interview.id) {
      throw new Error('ID de entrevista requerido');
    }

    if (!interview.userId) {
      throw new Error('ID de usuario requerido');
    }

    // Mapear con valores por defecto según el tipo CompletedInterview
    return {
      id: String(interview.id),
      userId: String(interview.userId),
      interviewId: String(interview.interviewId || 'unknown'),
      interviewTitle: interview.interviewTitle || 'Entrevista sin título',
      userName: interview.userName || 'Usuario desconocido',
      score: typeof interview.score === 'number' ? interview.score : 0,
      state: interview.state || 'PENDIENTE',
      date: interview.date || interview.completedAt || new Date().toISOString(),
      duration: typeof interview.duration === 'number' ? interview.duration : 0,
      s3KeyPath: interview.s3KeyPath || '',
      answers: Array.isArray(interview.answers) ? interview.answers : []
    };
  }

  /**
   * Formatear fecha para mostrar
   */
  static formatDate(dateString: string): string {
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
  }

  /**
   * Formatear duración en segundos a mm:ss
   */
  static formatDuration(seconds: number): string {
    if (typeof seconds !== 'number' || seconds < 0) {
      return '0:00';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Obtener color según puntuación
   */
  static getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  }

  /**
   * Obtener badge según puntuación
   */
  static getScoreBadge(score: number): { text: string; color: string } {
    if (score >= 80) return { text: 'Excelente', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
    if (score >= 60) return { text: 'Bueno', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
    return { text: 'Mejorar', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
  }
}

/**
 * Factory function para crear instancia del servicio
 */
export const createCompletedInterviewService = (
  getAuthFetch: (url: string, options?: RequestInit) => Promise<Response>,
  isAuthenticated: boolean
) => {
  return new CompletedInterviewService(getAuthFetch, isAuthenticated);
};
