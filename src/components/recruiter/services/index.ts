// Exportar todos los servicios del RecruiterPanel
export { 
  ParticipantService, 
  createParticipantService,
  type CreateParticipantData,
  type CreateParticipantResponse
} from './participantService';

export { 
  InterviewService, 
  createInterviewService,
  type CreateInterviewData,
  type CreateInterviewResponse,
  type AssignInterviewData,
  type AssignInterviewResponse,
  type GenerateQuestionsData,
  type GenerateQuestionsResponse
} from './interviewService';

export { 
  CompletedInterviewService, 
  createCompletedInterviewService,
  type CompletedInterviewsResponse,
  type UserInterviewResponse,
  type VideoUrlResponse
} from './completedInterviewService';

export { StorageService } from './storageService';

// Re-exportar tipos comunes
export type {
  Participant,
  Interview,
  AvailableInterview,
  AssignedInterview,
  CompletedInterview
} from '@/types';
