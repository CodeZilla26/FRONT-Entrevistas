/**
 * Utilidades para formateo de datos en el RecruiterPanel
 */

/**
 * Formatear fecha para mostrar en UI
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Verificar si es una fecha válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('[formatters] Error formateando fecha:', dateString, error);
    return 'Fecha inválida';
  }
};

/**
 * Formatear fecha y hora completa
 */
export const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('[formatters] Error formateando fecha y hora:', dateString, error);
    return 'Fecha inválida';
  }
};

/**
 * Formatear duración en segundos a formato legible
 */
export const formatDuration = (seconds: number | undefined): string => {
  if (typeof seconds !== 'number' || seconds < 0) {
    return '0:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

/**
 * Formatear duración en minutos a texto legible
 */
export const formatDurationMinutes = (minutes: number | undefined): string => {
  if (typeof minutes !== 'number' || minutes < 0) {
    return '0 min';
  }
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Formatear puntuación con color y texto
 */
export const formatScore = (score: number | undefined): {
  value: string;
  color: string;
  badge: { text: string; color: string };
} => {
  if (typeof score !== 'number') {
    return {
      value: 'N/A',
      color: 'text-slate-400',
      badge: { text: 'Sin evaluar', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
    };
  }
  
  const roundedScore = Math.round(score * 100) / 100;
  
  if (score >= 80) {
    return {
      value: `${roundedScore}`,
      color: 'text-green-400',
      badge: { text: 'Excelente', color: 'bg-green-500/20 text-green-300 border-green-500/30' }
    };
  } else if (score >= 60) {
    return {
      value: `${roundedScore}`,
      color: 'text-yellow-400',
      badge: { text: 'Bueno', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' }
    };
  } else {
    return {
      value: `${roundedScore}`,
      color: 'text-red-400',
      badge: { text: 'Mejorar', color: 'bg-red-500/20 text-red-300 border-red-500/30' }
    };
  }
};

/**
 * Formatear porcentaje
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  
  const percentage = Math.round((value / total) * 100);
  return `${percentage}%`;
};

/**
 * Formatear número con separadores de miles
 */
export const formatNumber = (num: number | undefined): string => {
  if (typeof num !== 'number') return '0';
  
  return num.toLocaleString('es-ES');
};

/**
 * Truncar texto con puntos suspensivos
 */
export const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Formatear email para mostrar (ocultar parte del dominio si es muy largo)
 */
export const formatEmail = (email: string | undefined): string => {
  if (!email) return 'Sin email';
  
  if (email.length <= 30) return email;
  
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  if (localPart.length > 15) {
    return `${localPart.substring(0, 12)}...@${domain}`;
  }
  
  return email;
};

/**
 * Formatear nombre completo desde partes
 */
export const formatFullName = (firstName: string | undefined, lastName: string | undefined): string => {
  const parts = [firstName, lastName].filter(Boolean);
  
  if (parts.length === 0) return 'Sin nombre';
  
  return parts.join(' ');
};

/**
 * Formatear estado con color
 */
export const formatStatus = (status: string | undefined): {
  text: string;
  color: string;
  dotColor: string;
} => {
  switch (status) {
    case 'Entrevista Completa':
      return {
        text: 'Completada',
        color: 'bg-green-500/20 text-green-300 border-green-500/30',
        dotColor: 'bg-green-400'
      };
    case 'En Proceso':
      return {
        text: 'En Proceso',
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        dotColor: 'bg-blue-400'
      };
    case 'Pendiente':
      return {
        text: 'Pendiente',
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        dotColor: 'bg-yellow-400'
      };
    default:
      return {
        text: status || 'Desconocido',
        color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        dotColor: 'bg-slate-400'
      };
  }
};

/**
 * Formatear tiempo relativo (hace X tiempo)
 */
export const formatRelativeTime = (dateString: string | undefined): string => {
  if (!dateString) return 'Fecha desconocida';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
      return 'Hace un momento';
    } else if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else {
      return formatDate(dateString);
    }
  } catch (error) {
    console.warn('[formatters] Error calculando tiempo relativo:', dateString, error);
    return 'Fecha inválida';
  }
};

/**
 * Formatear tamaño de archivo
 */
export const formatFileSize = (bytes: number | undefined): string => {
  if (typeof bytes !== 'number' || bytes < 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
};
