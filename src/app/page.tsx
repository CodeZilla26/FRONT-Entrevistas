'use client';

import { useState, useEffect } from 'react';
import { Eye, Play, FileText } from 'lucide-react';
import { User } from '@/types';
import { LoginForm } from '@/components/auth/LoginForm';
import { Sidebar } from '@/components/layout/Sidebar';
import { InterviewPanel } from '@/components/interview/InterviewPanel';
import { RecruiterPanel } from '@/components/recruiter/RecruiterPanel';
import { ParticipantInterviewStatus } from '@/components/participant/ParticipantInterviewStatus';
import { ToastContainer } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user: currentUser, logout, isAuthenticated, isInitializing } = useAuth();
  const [activeTab, setActiveTab] = useState('interview');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const { toasts, showToast, removeToast } = useToast();

  const handleLoginError = (message: string) => {
    showToast(message, 'error');
  };

  const handleLogout = async () => {
    try {
      logout();
      showToast('Sesión cerrada', 'success');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setActiveTab('interview');
    }
  };

  const showMessage = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
  };

  // Proteger acceso si no hay sesión válida
  useEffect(() => {
    if (!isAuthenticated && currentUser) {
      setActiveTab('interview');
      showToast('Tu sesión no es válida o expiró. Inicia sesión nuevamente.', 'info');
    }
  }, [isAuthenticated, currentUser]);

  // Mostrar loading mientras se inicializa la autenticación
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Cargando sesión...</p>
          <p className="text-slate-300 text-sm mt-2">Verificando autenticación</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600">
        <LoginForm onError={handleLoginError} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  if (currentUser.type === 'postulante') {
    const sidebarItems = [
      {
        id: 'interview',
        label: 'Iniciar Entrevista',
        icon: <Play size={20} />,
        isActive: activeTab === 'interview'
      },
      {
        id: 'status',
        label: 'Estado de Postulación',
        icon: <FileText size={20} />,
        isActive: activeTab === 'status'
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600">
        <Sidebar
          title="Panel Postulante"
          subtitle="Postulante"
          icon={<Eye className="w-8 h-8 text-white" />}
          items={sidebarItems}
          onItemClick={setActiveTab}
          onLogout={handleLogout}
          userEmail={currentUser.email}
          userName={currentUser.name}
          userLastName={currentUser.lastName}
        />
        
        <main className="ml-72 bg-gradient-to-br from-slate-800 to-slate-700 p-8 min-h-screen overflow-y-auto custom-scroll-green">
          {activeTab === 'interview' && (
            <InterviewPanel onShowToast={showToast} />
          )}
          
          {activeTab === 'status' && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl font-bold mb-6 text-slate-100">Estado de Postulación</h2>
              <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-8 rounded-xl w-full max-w-2xl">
                <div className="p-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl border-l-4 border-blue-400">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <p className="font-semibold text-xl text-blue-300">Entrevista Disponible</p>
                      <p className="text-sm text-blue-200 mt-1">Ve al tab "Iniciar Entrevista" para comenzar tu entrevista asignada.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
        
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Información"
        >
          <p className="text-slate-300 mb-4">{modalMessage}</p>
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Cerrar
          </button>
        </Modal>
      </div>
    );
  }

  // Panel del Reclutador
  if (currentUser.type === 'reclutador') {
    const sidebarItems = [
      {
        id: 'participants',
        label: 'Participantes',
        icon: <Eye size={20} />,
        isActive: activeTab === 'participants'
      },
      {
        id: 'interviews',
        label: 'Entrevistas',
        icon: <Play size={20} />,
        isActive: activeTab === 'interviews'
      },
      {
        id: 'results',
        label: 'Resultados',
        icon: <FileText size={20} />,
        isActive: activeTab === 'results'
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600">
        <Sidebar
          title="Panel Reclutador"
          subtitle="Reclutador"
          icon={<Eye className="w-8 h-8 text-white" />}
          items={sidebarItems}
          onItemClick={setActiveTab}
          onLogout={handleLogout}
          userEmail={currentUser.email}
          userName={currentUser.name}
          userLastName={currentUser.lastName}
        />
        
        <main className="ml-72 bg-gradient-to-br from-slate-800 to-slate-700 p-8 min-h-screen overflow-y-auto custom-scroll-green">
          <RecruiterPanel activeTab={activeTab} onShowToast={showToast} />
        </main>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
        
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Información"
        >
          <p className="text-slate-300 mb-4">{modalMessage}</p>
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Cerrar
          </button>
        </Modal>
      </div>
    );
  }

  return null;
}
