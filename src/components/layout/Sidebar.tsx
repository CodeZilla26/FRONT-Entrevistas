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
    <aside className={`bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl h-screen flex flex-col shadow-2xl fixed left-0 top-0 z-20 border-r border-slate-600/30 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-20 overflow-hidden' : 'w-80 overflow-y-auto'
    }`}>
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
      
      {/* Header con botón de colapso */}
      <div className={`relative border-b border-slate-600/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 ${
        isCollapsed ? 'p-4' : 'p-6'
      }`}>
        <button
          onClick={toggleSidebar}
          className={`absolute w-8 h-8 bg-slate-700/50 hover:bg-indigo-600/50 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group border border-slate-600/30 hover:border-indigo-500/50 ${
            isCollapsed ? 'top-2 right-2' : 'top-4 right-4'
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-300 transition-colors" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-300 transition-colors" />
          )}
        </button>

        <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
          {/* Avatar/Icon */}
          <div className={`bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 border-2 border-white/20 hover:border-white/40 hover:shadow-xl hover:shadow-indigo-500/25 ${
            isCollapsed ? 'w-10 h-10' : 'w-16 h-16'
          }`}>
            {isCollapsed ? (
              <span className="text-white font-bold text-xs">{initials.toUpperCase()}</span>
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
            {/* Status indicator */}
            <div className="flex items-center mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 ml-2">En línea</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navegación */}
      <nav className={`flex-1 overflow-hidden ${isCollapsed ? 'p-2' : 'p-4 overflow-y-auto custom-scroll-dark'}`}>
        {!isCollapsed && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
              Navegación
            </h3>
          </div>
        )}
        <ul className={`${isCollapsed ? 'space-y-1' : 'space-y-2'}`}>
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onItemClick(item.id)}
                className={`w-full text-left rounded-xl transition-all duration-300 flex items-center group relative ${
                  isCollapsed ? 'p-2 justify-center' : 'px-4 py-4 space-x-3'
                } ${
                  item.isActive 
                    ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-lg backdrop-blur-sm border border-indigo-500/30 shadow-indigo-500/25' 
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md hover:border-slate-600/50 border border-transparent'
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
                {item.isActive && !isCollapsed && (
                  <div className="absolute right-3 flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
                
                {/* Barra lateral de activo */}
                {item.isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full"></div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Botón de logout */}
      <div className={`border-t border-slate-600/30 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <button
          onClick={onLogout}
          className={`w-full bg-gradient-to-r from-red-500/80 to-pink-500/80 hover:from-red-600/90 hover:to-pink-600/90 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg flex items-center group backdrop-blur-sm border border-red-500/30 hover:shadow-red-500/25 hover:shadow-lg hover:scale-105 ${
            isCollapsed ? 'p-2 justify-center' : 'py-3.5 px-4 space-x-2 justify-center'
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
