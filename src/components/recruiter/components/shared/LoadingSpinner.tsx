import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'indigo';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  text,
  fullScreen = false
}) => {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'border-green-500 border-t-transparent';
      case 'purple':
        return 'border-purple-500 border-t-transparent';
      case 'indigo':
        return 'border-indigo-500 border-t-transparent';
      default:
        return 'border-blue-500 border-t-transparent';
    }
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`${getSizeClasses(size)} border-2 ${getColorClasses(color)} rounded-full animate-spin`}></div>
      {text && (
        <p className="text-slate-400 mt-4 text-center">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  color?: 'blue' | 'green' | 'purple' | 'indigo';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = 'Cargando...',
  color = 'blue'
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 rounded-2xl p-8 shadow-2xl">
        <LoadingSpinner size="lg" color={color} text={text} />
      </div>
    </div>
  );
};

interface InlineLoadingProps {
  text?: string;
  color?: 'blue' | 'green' | 'purple' | 'indigo';
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = 'Cargando...',
  color = 'blue',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <LoadingSpinner size="sm" color={color} />
      <span className="text-slate-400 text-sm">{text}</span>
    </div>
  );
};
