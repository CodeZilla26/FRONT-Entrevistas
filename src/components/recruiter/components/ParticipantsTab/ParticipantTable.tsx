import React from 'react';
import { Participant } from '@/types';

interface ParticipantTableProps {
  participants: Participant[];
  onAssignInterview: (participant: Participant) => void;
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({
  participants,
  onAssignInterview
}) => {
  // Debug: verificar estados que llegan
  console.log('[ParticipantTable] Estados de participantes:', participants.map(p => ({ name: p.name, status: p.status })));
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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-600/30">
            <th className="text-left py-4 px-2 text-slate-300 font-semibold">Participante</th>
            <th className="text-left py-4 px-2 text-slate-300 font-semibold">Email</th>
            <th className="text-left py-4 px-2 text-slate-300 font-semibold">Estado</th>
            <th className="text-left py-4 px-2 text-slate-300 font-semibold">Fecha</th>
            <th className="text-left py-4 px-2 text-slate-300 font-semibold">Entrevistas</th>
            <th className="text-left py-4 px-2 text-slate-300 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant) => (
            <tr key={participant.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
              <td className="py-4 px-2">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-700 ${getStatusDotColor(participant.status)}`}></div>
                  </div>
                  <span className="text-slate-100 font-medium">{participant.name}</span>
                </div>
              </td>
              <td className="py-4 px-2 text-slate-400">{participant.email}</td>
              <td className="py-4 px-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(participant.status)}`}>
                  {participant.status}
                </span>
              </td>
              <td className="py-4 px-2 text-slate-400 text-sm">
                {participant.dateRegistered || 'N/A'}
              </td>
              <td className="py-4 px-2">
                {participant.assignedInterviews && participant.assignedInterviews.length > 0 ? (
                  <div className="space-y-1">
                    {participant.assignedInterviews.slice(0, 2).map((assignment, index) => (
                      <div key={index} className="text-xs text-slate-300 bg-slate-700/30 px-2 py-1 rounded truncate max-w-32">
                        {assignment.interview.title}
                      </div>
                    ))}
                    {participant.assignedInterviews.length > 2 && (
                      <div className="text-xs text-slate-500">
                        +{participant.assignedInterviews.length - 2} más
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500 text-xs">Sin asignar</span>
                )}
              </td>
              <td className="py-4 px-2">
                {participant.status === 'Pendiente' ? (
                  <button
                    onClick={() => onAssignInterview(participant)}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium py-1 px-3 rounded-lg transition-all duration-200 text-sm"
                  >
                    Asignar
                  </button>
                ) : participant.status === 'En Proceso' ? (
                  <span className="text-slate-500 text-xs">Asignado</span>
                ) : participant.status === 'Entrevista Completa' ? (
                  <span className="text-slate-500 text-xs">Completado</span>
                ) : (
                  <span className="text-slate-500 text-xs">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
