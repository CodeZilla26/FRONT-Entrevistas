'use client';

import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';

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
  userEmail?: string;
  userName?: string;
  userLastName?: string;
}

export const Sidebar = ({ title, subtitle, icon, items, onItemClick, onLogout, userEmail, userName, userLastName }: SidebarProps) => {
  return (
    <aside className="bg-gradient-to-b from-slate-900 to-slate-800 w-72 h-screen p-6 flex flex-col items-center shadow-2xl fixed left-0 top-0 z-10 overflow-y-auto custom-scroll-dark">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          {icon}
        </div>
        {userName && userLastName ? (
          <h1 className="text-2xl font-bold text-white">{userName} {userLastName}</h1>
        ) : userName ? (
          <h1 className="text-2xl font-bold text-white">{userName}</h1>
        ) : userEmail ? (
          <h1 className="text-xl font-bold text-white">{userEmail.split('@')[0]}</h1>
        ) : (
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        )}
        <p className="text-slate-300 text-sm">{subtitle}</p>
      </div>
      
      <nav className="w-full flex-1">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onItemClick(item.id)}
                className={`w-full text-left px-4 py-4 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                  item.isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-white hover:bg-opacity-10'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <button
        onClick={onLogout}
        className="mt-2 w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 transform hover:scale-105"
      >
        <LogOut size={18} />
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  );
};
