import React from 'react';
import { Users } from 'lucide-react';

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  newParticipant: {
    name: string;
    lastName: string;
    email: string;
    password: string;
  };
  setNewParticipant: React.Dispatch<React.SetStateAction<{
    name: string;
    lastName: string;
    email: string;
    password: string;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  isOpen,
  onClose,
  newParticipant,
  setNewParticipant,
  onSubmit,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600/30 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>Nuevo Participante</span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={newParticipant.name}
              onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ingresa el nombre"
              className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Apellidos *
            </label>
            <input
              type="text"
              value={newParticipant.lastName}
              onChange={(e) => setNewParticipant(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Ingresa los apellidos"
              className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Correo Electrónico *
            </label>
            <input
              type="email"
              value={newParticipant.email}
              onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Contraseña Temporal *
            </label>
            <input
              type="password"
              value={newParticipant.password}
              onChange={(e) => setNewParticipant(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Ingresa una contraseña temporal"
              className="w-full px-4 py-3 rounded-xl border border-slate-500 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 mt-1">
              El participante podrá cambiar esta contraseña después del primer acceso
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <div>
                <p className="text-blue-300 font-medium text-sm">Información importante</p>
                <p className="text-blue-200 text-xs mt-1">
                  Se creará una cuenta de participante con rol &ldquo;PRACTICANTE&rdquo;. 
                  El usuario recibirá las credenciales por email.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Registrando...</span>
                </div>
              ) : (
                'Registrar Participante'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
