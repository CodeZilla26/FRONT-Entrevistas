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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  // Establecer tab inicial según el tipo de usuario y resetear sidebar
  useEffect(() => {
    if (currentUser?.type === 'reclutador') {
      setActiveTab('participants');
    } else if (currentUser?.type === 'postulante') {
      setActiveTab('interview');
    }
    // Resetear sidebar al cambiar de usuario
    setIsSidebarCollapsed(false);
  }, [currentUser]);

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
      setIsSidebarCollapsed(false); // Resetear sidebar al cerrar sesión
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600">
        <ParticipantInterviewStatus onShowToast={showToast} />
        
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
          onCollapseChange={setIsSidebarCollapsed}
          userEmail={currentUser.email}
          userName={currentUser.name}
          userLastName={currentUser.lastName}
        />
        
        <main className={`${isSidebarCollapsed ? 'ml-20' : 'ml-80'} bg-gradient-to-br from-slate-800 to-slate-700 p-8 min-h-screen overflow-y-auto custom-scroll-green transition-all duration-300`}>
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
