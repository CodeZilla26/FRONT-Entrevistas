"use client";
import React from 'react';

export default function AuthErrorPanel({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl p-10 w-full max-w-xl text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No se pudo validar tu sesión</h2>
        <p className="text-slate-300 mb-6">{message || 'Ocurrió un problema al obtener tus datos. Intenta nuevamente.'}</p>
        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg">
              Reintentar
            </button>
          )}
          <a href="/" className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-5 rounded-lg">
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
