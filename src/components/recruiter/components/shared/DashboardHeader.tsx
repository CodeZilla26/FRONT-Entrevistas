import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionButton?: {
    icon: LucideIcon;
    text: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success';
  };
  showStatus?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  actionButton,
  showStatus = true
}) => {
  const getButtonStyles = (variant: string = 'primary') => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700';
      case 'secondary':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700';
      default:
        return 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden">
      {/* Header decorative overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Icon with sidebar-style design */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25">
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-slate-100 mb-2">{title}</h2>
            <p className="text-slate-400 text-lg">{subtitle}</p>
            {/* Status indicator */}
            {showStatus && (
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 ml-2">Sistema activo</span>
              </div>
            )}
          </div>
        </div>
        
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className={`${getButtonStyles(actionButton.variant)} text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg backdrop-blur-sm border border-indigo-500/30 hover:shadow-indigo-500/25 hover:shadow-xl hover:scale-105 flex items-center space-x-3`}
          >
            <actionButton.icon className="w-5 h-5" />
            <span>{actionButton.text}</span>
          </button>
        )}
      </div>
    </div>
  );
};
