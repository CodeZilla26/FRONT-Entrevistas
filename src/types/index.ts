export interface User {
  email: string;
  password: string;
  type: 'reclutador' | 'postulante';
  name: string;
  lastName?: string;
  id?: string;
}

export interface Participant {
  id: string; // Cambiado de number a string para MongoDB IDs
  name: string;
  email: string;
  status: 'Entrevista Completa' | 'Pendiente' | 'En Proceso';
  dateRegistered?: string;
  assignedInterviews?: AssignedInterview[];
}

export interface Interview {
  id: string;
  title: string;
  description: string;
  status: 'Activa' | 'Borrador' | 'Finalizada';
  createdAt: string;
  questions: string[];
  // Legacy fields for existing interviews
  applicant?: string;
  score?: number;
  position?: string;
  summary?: string;
  transcript?: string;
  date?: string;
}

export interface InterviewState {
  currentQuestionIndex: number;
  responseTimeLeft: number;
  isRecording: boolean;
  isCompleted: boolean;
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  currentUtterance: SpeechSynthesisUtterance | null;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface AvailableInterview {
  id: string;
  title: string;
  description: string;
  status: 'Activa' | 'Borrador' | 'Finalizada';
  createdAt: string;
  questions: string[];
  duration?: number; // duración estimada en minutos
  difficulty?: 'Fácil' | 'Intermedio' | 'Avanzado';
}

export interface AssignedInterview {
  id: string;
  interviewId: string;
  participantId: string; // Cambiado de number a string para consistencia con Participant.id
  assignedAt: string;
  scheduledFor?: string;
  status: 'Asignada' | 'En Progreso' | 'Completada' | 'Cancelada';
  interview: AvailableInterview;
}

export interface UserApiResponse {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details: string[];
  timestamp: string;
}

export interface PracticanteInterviewQuestion {
  id: string;
  text: string;
  points: number;
  time: number;
}

export interface PracticanteInterview {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  active: boolean;
  questions: PracticanteInterviewQuestion[];
}

export interface CompletedInterview {
  id: string;
  score: number;
  state: string;
  date: string;
  userId: string;
  userName: string;
  interviewId: string;
  interviewTitle: string;
  s3KeyPath: string;
  duration: number;
  answers: Array<{
    questionText: string;
    responseText: string;
    points: number;
    description: string;
  }>;
}





