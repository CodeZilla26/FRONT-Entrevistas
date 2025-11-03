import React from 'react';
import { Calendar, Clock, FileText } from 'lucide-react';
import { Participant, AvailableInterview } from '@/types';

interface AssignInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedParticipant: Participant | null;
  availableInterviews: AvailableInterview[];
  selectedInterviewId: string;
  setSelectedInterviewId: (id: string) => void;
  onAssign: () => void;
  isAssigning?: boolean;
}

export const AssignInterviewModal: React.FC<AssignInterviewModalProps> = ({
  isOpen,
  onClose,
  selectedParticipant,
  availableInterviews,
  selectedInterviewId,
  setSelectedInterviewId,
  onAssign,
  isAssigning = false
}) => {
  if (!isOpen || !selectedParticipant) return null;

  const activeInterviews = availableInterviews.filter(interview => interview.status === 'Activa');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600/30 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-green-400" />
            <span>Asignar Entrevista</span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={isAssigning}
          >
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* Participant Info */}
        <div className="bg-slate-700/50 p-4 rounded-xl mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              {selectedParticipant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-slate-100 font-semibold">{selectedParticipant.name}</h4>
              <p className="text-slate-400 text-sm">{selectedParticipant.email}</p>
            </div>
          </div>
        </div>

        {/* Interview Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Selecciona una entrevista disponible
            </label>
            
            {activeInterviews.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No hay entrevistas activas disponibles</p>
                <p className="text-slate-500 text-sm">Crea y activa una entrevista primero</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scroll-green">
                {activeInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedInterviewId === interview.id
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-slate-600/30 bg-slate-700/30 hover:border-slate-500/50 hover:bg-slate-700/50'
                    }`}
                    onClick={() => setSelectedInterviewId(interview.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-slate-100 font-semibold mb-1">{interview.title}</h5>
                        <p className="text-slate-400 text-sm mb-2 line-clamp-2">{interview.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{interview.duration || 30} min</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>{interview.questions.length} preguntas</span>
                          </span>
                          {interview.difficulty && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              interview.difficulty === 'Fácil' ? 'bg-green-500/10 text-green-400' :
                              interview.difficulty === 'Intermedio' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {interview.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedInterviewId === interview.id && (
                        <div className="ml-3">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedInterviewId && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="text-blue-300 font-medium text-sm">Información de la asignación</p>
                  <p className="text-blue-200 text-xs mt-1">
                    La entrevista será asignada inmediatamente. El participante podrá acceder desde su panel.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
            disabled={isAssigning}
          >
            Cancelar
          </button>
          <button
            onClick={onAssign}
            disabled={!selectedInterviewId || isAssigning}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isAssigning ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Asignando...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Asignar Entrevista</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
