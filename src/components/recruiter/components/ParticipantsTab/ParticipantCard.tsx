import React from 'react';
import { Calendar } from 'lucide-react';
import { Participant } from '@/types';

interface ParticipantCardProps {
  participant: Participant;
  onAssignInterview: (participant: Participant) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  onAssignInterview
}) => {
  // Debug: verificar estado del participante
  console.log('[ParticipantCard] Participante:', participant.name, 'Estado:', participant.status);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entrevista Completa':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'En Proceso':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Entrevista Completa':
        return 'bg-green-400';
      case 'En Proceso':
        return 'bg-blue-400';
      default:
        return 'bg-yellow-400';
    }
  };

  return (
    <div className="group relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 shadow-2xl hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-1 overflow-hidden">
      {/* Decorative overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>
      
      {/* Avatar and Info */}
      <div className="relative flex items-start space-x-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25">
            {participant.name.charAt(0).toUpperCase()}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800 ${getStatusDotColor(participant.status)} animate-pulse`}></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-slate-100 font-bold text-lg mb-2 truncate">{participant.name}</h4>
          
          {/* Status Badge - Ahora debajo del nombre */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 ${getStatusColor(participant.status)}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(participant.status)}`}></div>
            {participant.status}
          </div>
          
          <p className="text-slate-400 text-sm flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
            <span className="truncate">{participant.email}</span>
          </p>
          {participant.dateRegistered && (
            <p className="text-slate-500 text-xs flex items-center space-x-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>Registrado: {participant.dateRegistered}</span>
            </p>
          )}
        </div>
      </div>

      {/* Assigned Interviews Info */}
      {participant.assignedInterviews && participant.assignedInterviews.length > 0 && (
        <div className="mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/20">
          <p className="text-slate-300 text-xs font-medium mb-1">Entrevistas Asignadas</p>
          <div className="space-y-1">
            {participant.assignedInterviews.slice(0, 2).map((assignment, index) => (
              <p key={index} className="text-slate-400 text-xs truncate">
                • {assignment.interview.title}
              </p>
            ))}
            {participant.assignedInterviews.length > 2 && (
              <p className="text-slate-500 text-xs">
                +{participant.assignedInterviews.length - 2} más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="relative flex space-x-2 mt-4">
        {participant.status === 'Pendiente' ? (
          <button
            onClick={() => onAssignInterview(participant)}
            className="flex-1 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-700/90 hover:to-purple-700/90 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg backdrop-blur-sm border border-indigo-500/30 hover:shadow-indigo-500/25 hover:shadow-lg hover:scale-105 text-sm"
          >
            Asignar Entrevista
          </button>
        ) : (
          <div className="flex-1 bg-slate-700/50 text-slate-400 font-medium py-3 px-4 rounded-xl text-center text-sm border border-slate-600/30">
            {participant.status === 'Entrevista Completa' ? 'Completado' : 'Asignado'}
          </div>
        )}
      </div>
    </div>
  );
};
