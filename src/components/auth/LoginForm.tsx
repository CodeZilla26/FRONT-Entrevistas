'use client';

import { useState } from 'react';
import { User } from '@/types';
import { INTERVIEWS_API_BASE } from '@/config';
import { useAuth } from '@/context/AuthContext';

interface LoginFormProps {
  onError: (message: string) => void;
}

export const LoginForm = ({ onError }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });
  
  const AUTH_URL = `${INTERVIEWS_API_BASE}/auth/login`;
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({ email: false, password: false });
    
    if (!email.trim() || !password.trim()) {
      onError('Por favor, completa todos los campos');
      setErrors({
        email: !email.trim(),
        password: !password.trim()
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const raw = await res.text();
      let data: any = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

      if (!res.ok) {
        const serverMsg = (typeof data === 'string') ? data : (data?.message || 'Credenciales incorrectas');
        onError(serverMsg);
        setErrors({ email: true, password: true });
        return;
      }

      // Expected 200: { jwt, email, role }
      const jwt: string | undefined = data?.jwt;
      const respEmail: string | undefined = data?.email;
      const role: string | undefined = data?.role;
      if (!jwt || !respEmail) {
        onError('Respuesta de login inválida');
        return;
      }
      // Persist via context
      login({ email: respEmail, role, jwt });
    } catch (err) {
      console.error('Login error:', err);
      onError('No se pudo conectar con el servicio de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center">
      <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-8 md:p-12 rounded-2xl max-w-md w-full mx-4">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Bienvenido
        </h1>
        <p className="text-slate-300 mb-8">Accede a tu sistema de entrevistas</p>
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.email 
                ? 'border-red-500 bg-red-50/10' 
                : 'border-slate-500'
            } bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            placeholder="Correo electrónico"
            disabled={isLoading}
          />
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.password 
                ? 'border-red-500 bg-red-50/10' 
                : 'border-slate-500'
            } bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            placeholder="Contraseña"
            disabled={isLoading}
          />
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
