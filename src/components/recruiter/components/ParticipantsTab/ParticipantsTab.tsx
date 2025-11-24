import React from 'react';
import { Users, Clock, FileText, CheckCircle } from 'lucide-react';
import { Participant, AvailableInterview } from '@/types';
import { DashboardHeader } from '../shared/DashboardHeader';
import { StatCard } from '../shared/StatCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ParticipantsFilters } from './ParticipantsFilters';
import { ParticipantCard } from './ParticipantCard';
import { ParticipantTable } from './ParticipantTable';
import { AddParticipantModal } from './AddParticipantModal';
import { AssignInterviewModal } from './AssignInterviewModal';

interface ParticipantsTabProps {
  // Data
  participants: Participant[];
  availableInterviews: AvailableInterview[];
  isLoadingTabData: boolean;
  
  // Filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'Pendiente' | 'En Proceso' | 'Entrevista Completa';
  setStatusFilter: (filter: 'all' | 'Pendiente' | 'En Proceso' | 'Entrevista Completa') => void;
  sortBy: 'name' | 'date' | 'status';
  setSortBy: (sort: 'name' | 'date' | 'status') => void;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  
  // Participants functions
  filteredAndSortedParticipants: () => Participant[];
  
  // Add Participant Modal
  showAddParticipantModal: boolean;
  setShowAddParticipantModal: (show: boolean) => void;
  newParticipant: { name: string; lastName: string; email: string; password: string };
  setNewParticipant: React.Dispatch<React.SetStateAction<{ name: string; lastName: string; email: string; password: string }>>;
  handleAddParticipant: (e: React.FormEvent) => void;
  
  // Assign Interview Modal
  showAssignInterviewModal: boolean;
  setShowAssignInterviewModal: (show: boolean) => void;
  selectedParticipant: Participant | null;
  setSelectedParticipant: (participant: Participant | null) => void;
  selectedInterviewForAssignment: string;
  setSelectedInterviewForAssignment: (id: string) => void;
  handleAssignInterview: () => void;
  isAssigningInterview: boolean;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  // Data
  participants,
  availableInterviews,
  isLoadingTabData,
  
  // Filters
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  
  // Functions
  filteredAndSortedParticipants,
  
  // Add Participant Modal
  showAddParticipantModal,
  setShowAddParticipantModal,
  newParticipant,
  setNewParticipant,
  handleAddParticipant,
  
  // Assign Interview Modal
  showAssignInterviewModal,
  setShowAssignInterviewModal,
  selectedParticipant,
  setSelectedParticipant,
  selectedInterviewForAssignment,
  setSelectedInterviewForAssignment,
  handleAssignInterview,
  isAssigningInterview
}) => {
  const handleOpenAssignModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setShowAssignInterviewModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignInterviewModal(false);
    setSelectedParticipant(null);
    setSelectedInterviewForAssignment('');
  };

  const filteredParticipants = filteredAndSortedParticipants();

  if (isLoadingTabData) {
    return <LoadingSpinner size="lg" text="Cargando participantes..." fullScreen />;
  }

  return (
    <div className="w-full h-full relative">
      {/* Decorative gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
      
      <div className="relative p-8">
        {/* Dashboard Header */}
        <DashboardHeader
          icon={Users}
          title="Dashboard de Participantes"
          subtitle="Gestiona y supervisa todos los participantes del proceso"
          actionButton={{
            icon: Users,
            text: 'Agregar Participante',
            onClick: () => setShowAddParticipantModal(true),
            variant: 'primary'
          }}
        />

        {/* Statistics Cards - Métricas más relevantes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Participantes"
            value={participants.length}
            subtitle="Registrados en el sistema"
            icon={Users}
            color="indigo"
          />
          
          <StatCard
            title="Pendientes"
            value={participants.filter(p => p.status === 'Pendiente').length}
            subtitle="Sin entrevista asignada"
            icon={Clock}
            color="yellow"
          />
          
          <StatCard
            title="En Proceso"
            value={participants.filter(p => p.status === 'En Proceso').length}
            subtitle="Entrevistas activas"
            icon={FileText}
            color="blue"
          />
          
          <StatCard
            title="Completadas"
            value={participants.filter(p => p.status === 'Entrevista Completa').length}
            subtitle="Proceso finalizado"
            icon={CheckCircle}
            color="green"
          />
        </div>

        {/* Participants List with Filters */}
        <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 shadow-2xl rounded-2xl overflow-hidden relative">
          {/* Decorative overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          
          {/* Filters */}
          <ParticipantsFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
            totalCount={participants.length}
            filteredCount={filteredParticipants.length}
          />
          
          {/* Content */}
          <div className="relative p-4 sm:p-6 overflow-y-auto custom-scroll-green max-h-[500px]">
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">
                  {participants.length === 0 ? 'No hay participantes registrados' : 'No se encontraron participantes'}
                </p>
                <p className="text-slate-500 text-sm">
                  {participants.length === 0 
                    ? 'Agrega el primer participante usando el botón de arriba' 
                    : 'Intenta ajustar los filtros de búsqueda'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredParticipants.map((participant) => (
                      <ParticipantCard
                        key={participant.id}
                        participant={participant}
                        onAssignInterview={handleOpenAssignModal}
                      />
                    ))}
                  </div>
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                  <ParticipantTable
                    participants={filteredParticipants}
                    onAssignInterview={handleOpenAssignModal}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
        
      {/* Add Participant Modal */}
      <AddParticipantModal
        isOpen={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        newParticipant={newParticipant}
        setNewParticipant={setNewParticipant}
        onSubmit={handleAddParticipant}
      />

      {/* Assign Interview Modal */}
      <AssignInterviewModal
        isOpen={showAssignInterviewModal}
        onClose={handleCloseAssignModal}
        selectedParticipant={selectedParticipant}
        availableInterviews={availableInterviews}
        selectedInterviewId={selectedInterviewForAssignment}
        setSelectedInterviewId={setSelectedInterviewForAssignment}
        onAssign={handleAssignInterview}
        isAssigning={isAssigningInterview}
      />
    </div>
  );
};
