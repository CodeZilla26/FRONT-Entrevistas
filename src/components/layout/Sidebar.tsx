'use client';

import { ReactNode, useState } from 'react';
import { LogOut, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  isActive?: boolean;
}

interface SidebarProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  items: SidebarItem[];
  onItemClick: (id: string) => void;
  onLogout: () => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
  userEmail?: string;
  userName?: string;
  userLastName?: string;
}

export const Sidebar = ({ title, subtitle, icon, items, onItemClick, onLogout, onCollapseChange, userEmail, userName, userLastName }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  const displayName = userName && userLastName 
    ? `${userName} ${userLastName}` 
    : userName 
    ? userName 
    : userEmail 
    ? userEmail.split('@')[0] 
    : title;

  const initials = userName && userLastName 
    ? `${userName[0]}${userLastName[0]}` 
    : userName 
    ? userName.substring(0, 2) 
    : userEmail 
    ? userEmail.substring(0, 2) 
    : title.substring(0, 2);

  return (
    <aside className={`bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl h-screen flex flex-col shadow-2xl fixed left-0 top-0 z-20 border-r border-slate-600/30 transition-all duration-300 ease-in-out overflow-hidden ${
      isCollapsed ? 'w-20' : 'w-80'
    }`}>
      
      {/* Header con botón de colapso */}
      <div className="relative p-6 border-b border-slate-600/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          )}
        </button>

        <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
          {/* Avatar/Icon */}
          <div className={`bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
            isCollapsed ? 'w-12 h-12' : 'w-16 h-16'
          }`}>
            {isCollapsed ? (
              <span className="text-white font-bold text-sm">{initials.toUpperCase()}</span>
            ) : (
              <div className="text-white">
                {icon}
              </div>
            )}
          </div>

          {/* Información del usuario */}
          <div className={`transition-all duration-300 overflow-hidden ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>
            <h1 className="text-xl font-bold text-slate-100 truncate">
              {displayName}
            </h1>
            <p className="text-slate-400 text-sm truncate">{subtitle}</p>
          </div>
        </div>
      </div>
      
      {/* Navegación */}
      <nav className="flex-1 p-4 overflow-y-auto custom-scroll-dark">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onItemClick(item.id)}
                className={`w-full text-left rounded-xl transition-all duration-300 flex items-center group relative ${
                  isCollapsed ? 'p-3 justify-center' : 'px-4 py-4 space-x-3'
                } ${
                  item.isActive 
                    ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-lg backdrop-blur-sm border border-indigo-500/30' 
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`transition-all duration-200 ${item.isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </div>
                
                <span className={`font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}>
                  {item.label}
                </span>

                {/* Tooltip para modo colapsado */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
                    {item.label}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                  </div>
                )}

                {/* Indicador de activo */}
                {item.isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Botón de logout */}
      <div className="p-4 border-t border-slate-600/30">
        <button
          onClick={onLogout}
          className={`w-full bg-gradient-to-r from-red-500/80 to-pink-500/80 hover:from-red-600/90 hover:to-pink-600/90 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg flex items-center group backdrop-blur-sm border border-red-500/30 hover:shadow-red-500/25 hover:shadow-lg ${
            isCollapsed ? 'p-3 justify-center' : 'py-3.5 px-4 space-x-2 justify-center'
          }`}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className={`transition-all duration-200 group-hover:scale-110 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
          <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>
            Cerrar Sesión
          </span>

          {/* Tooltip para logout en modo colapsado */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
              Cerrar Sesión
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45"></div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
