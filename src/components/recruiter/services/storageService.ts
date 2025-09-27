import { AssignedInterview, Participant } from '@/types';

export class StorageService {
  private static readonly ASSIGNMENTS_KEY = 'recruiter_assignments';
  private static readonly RECRUITER_SETTINGS_KEY = 'recruiter_settings';

  /**
   * Cargar asignaciones desde localStorage
   */
  static loadAssignments(): AssignedInterview[] {
    try {
      const storedAssignments = localStorage.getItem(this.ASSIGNMENTS_KEY);
      if (storedAssignments) {
        const assignments: AssignedInterview[] = JSON.parse(storedAssignments);
        console.log('[StorageService] Asignaciones cargadas desde localStorage:', assignments.length);
        
        // Validar estructura de cada asignación
        const validAssignments = assignments.filter(assignment => {
          return assignment.id && 
                 assignment.interviewId && 
                 assignment.participantId && 
                 assignment.assignedAt;
        });

        if (validAssignments.length !== assignments.length) {
          console.warn('[StorageService] Se encontraron asignaciones inválidas, filtrando...');
        }

        return validAssignments;
      }
    } catch (error) {
      console.error('[StorageService] Error cargando asignaciones desde localStorage:', error);
    }
    return [];
  }

  /**
   * Guardar asignaciones en localStorage
   */
  static saveAssignments(assignments: AssignedInterview[]): void {
    try {
      localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(assignments));
      console.log('[StorageService] Asignaciones guardadas en localStorage:', assignments.length);
    } catch (error) {
      console.error('[StorageService] Error guardando asignaciones en localStorage:', error);
      throw new Error('No se pudieron guardar las asignaciones localmente');
    }
  }

  /**
   * Agregar nueva asignación
   */
  static addAssignment(newAssignment: AssignedInterview): AssignedInterview[] {
    try {
      const currentAssignments = this.loadAssignments();
      
      // Verificar que no exista duplicado
      const existingAssignment = currentAssignments.find(
        assignment => assignment.participantId === newAssignment.participantId &&
                     assignment.interviewId === newAssignment.interviewId
      );

      if (existingAssignment) {
        throw new Error('Esta asignación ya existe');
      }

      const updatedAssignments = [...currentAssignments, newAssignment];
      this.saveAssignments(updatedAssignments);
      
      return updatedAssignments;
    } catch (error) {
      console.error('[StorageService] Error agregando asignación:', error);
      throw error;
    }
  }

  /**
   * Remover asignación
   */
  static removeAssignment(assignmentId: string): AssignedInterview[] {
    try {
      const currentAssignments = this.loadAssignments();
      const updatedAssignments = currentAssignments.filter(
        assignment => assignment.id !== assignmentId
      );
      
      this.saveAssignments(updatedAssignments);
      console.log('[StorageService] Asignación removida:', assignmentId);
      
      return updatedAssignments;
    } catch (error) {
      console.error('[StorageService] Error removiendo asignación:', error);
      throw new Error('No se pudo remover la asignación');
    }
  }

  /**
   * Actualizar participantes con sus asignaciones
   */
  static updateParticipantsWithAssignments(
    participants: Participant[], 
    assignments: AssignedInterview[]
  ): Participant[] {
    return participants.map(participant => {
      const participantAssignments = assignments.filter(
        assignment => assignment.participantId === participant.id
      );
      
      return {
        ...participant,
        assignedInterviews: participantAssignments
      };
    });
  }

  /**
   * Obtener asignaciones por participante
   */
  static getAssignmentsByParticipant(participantId: string): AssignedInterview[] {
    const assignments = this.loadAssignments();
    return assignments.filter(assignment => assignment.participantId === participantId);
  }

  /**
   * Obtener asignaciones por entrevista
   */
  static getAssignmentsByInterview(interviewId: string): AssignedInterview[] {
    const assignments = this.loadAssignments();
    return assignments.filter(assignment => assignment.interviewId === interviewId);
  }

  /**
   * Verificar si un participante ya tiene asignación
   */
  static hasParticipantAssignment(participantId: string): boolean {
    const assignments = this.loadAssignments();
    return assignments.some(assignment => assignment.participantId === participantId);
  }

  /**
   * Limpiar todas las asignaciones
   */
  static clearAllAssignments(): void {
    try {
      localStorage.removeItem(this.ASSIGNMENTS_KEY);
      console.log('[StorageService] Todas las asignaciones han sido limpiadas');
    } catch (error) {
      console.error('[StorageService] Error limpiando asignaciones:', error);
    }
  }

  /**
   * Guardar configuraciones del reclutador
   */
  static saveRecruiterSettings(settings: {
    viewMode?: 'grid' | 'table';
    sortBy?: 'name' | 'date' | 'status';
    statusFilter?: 'all' | 'Pendiente' | 'En Proceso' | 'Entrevista Completa';
    lastActiveTab?: string;
  }): void {
    try {
      const currentSettings = this.loadRecruiterSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      localStorage.setItem(this.RECRUITER_SETTINGS_KEY, JSON.stringify(updatedSettings));
      console.log('[StorageService] Configuraciones guardadas:', updatedSettings);
    } catch (error) {
      console.error('[StorageService] Error guardando configuraciones:', error);
    }
  }

  /**
   * Cargar configuraciones del reclutador
   */
  static loadRecruiterSettings(): {
    viewMode: 'grid' | 'table';
    sortBy: 'name' | 'date' | 'status';
    statusFilter: 'all' | 'Pendiente' | 'En Proceso' | 'Entrevista Completa';
    lastActiveTab: string;
  } {
    try {
      const storedSettings = localStorage.getItem(this.RECRUITER_SETTINGS_KEY);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        return {
          viewMode: settings.viewMode || 'grid',
          sortBy: settings.sortBy || 'name',
          statusFilter: settings.statusFilter || 'all',
          lastActiveTab: settings.lastActiveTab || 'participants'
        };
      }
    } catch (error) {
      console.error('[StorageService] Error cargando configuraciones:', error);
    }
    
    // Valores por defecto
    return {
      viewMode: 'grid',
      sortBy: 'name',
      statusFilter: 'all',
      lastActiveTab: 'participants'
    };
  }

  /**
   * Exportar datos para backup
   */
  static exportData(): {
    assignments: AssignedInterview[];
    settings: any;
    exportedAt: string;
  } {
    return {
      assignments: this.loadAssignments(),
      settings: this.loadRecruiterSettings(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Importar datos desde backup
   */
  static importData(data: {
    assignments?: AssignedInterview[];
    settings?: any;
  }): void {
    try {
      if (data.assignments) {
        this.saveAssignments(data.assignments);
      }
      
      if (data.settings) {
        this.saveRecruiterSettings(data.settings);
      }
      
      console.log('[StorageService] Datos importados exitosamente');
    } catch (error) {
      console.error('[StorageService] Error importando datos:', error);
      throw new Error('No se pudieron importar los datos');
    }
  }

  /**
   * Obtener estadísticas de almacenamiento
   */
  static getStorageStats(): {
    assignmentsCount: number;
    storageUsed: number;
    lastUpdate: string | null;
  } {
    const assignments = this.loadAssignments();
    const assignmentsData = localStorage.getItem(this.ASSIGNMENTS_KEY);
    const settingsData = localStorage.getItem(this.RECRUITER_SETTINGS_KEY);
    
    const storageUsed = (assignmentsData?.length || 0) + (settingsData?.length || 0);
    
    // Buscar la asignación más reciente para determinar última actualización
    const lastUpdate = assignments.length > 0 
      ? assignments.reduce((latest, assignment) => {
          const assignmentDate = new Date(assignment.assignedAt);
          return assignmentDate > new Date(latest) ? assignment.assignedAt : latest;
        }, assignments[0].assignedAt)
      : null;

    return {
      assignmentsCount: assignments.length,
      storageUsed,
      lastUpdate
    };
  }
}
