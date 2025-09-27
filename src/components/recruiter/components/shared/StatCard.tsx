import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color: 'indigo' | 'green' | 'yellow' | 'purple' | 'blue' | 'emerald';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'indigo':
        return {
          gradient: 'from-indigo-500/20 to-indigo-600/10',
          border: 'border-indigo-500/20',
          iconBg: 'bg-indigo-500/20',
          iconBorder: 'border-indigo-500/20',
          iconColor: 'text-indigo-400',
          valueColor: 'text-indigo-400',
          subtitleColor: 'text-indigo-300',
          hover: 'hover:shadow-indigo-500/10'
        };
      case 'green':
        return {
          gradient: 'from-green-500/20 to-green-600/10',
          border: 'border-green-500/20',
          iconBg: 'bg-green-500/20',
          iconBorder: 'border-green-500/20',
          iconColor: 'text-green-400',
          valueColor: 'text-green-400',
          subtitleColor: 'text-green-300',
          hover: 'hover:shadow-green-500/10'
        };
      case 'yellow':
        return {
          gradient: 'from-yellow-500/20 to-yellow-600/10',
          border: 'border-yellow-500/20',
          iconBg: 'bg-yellow-500/20',
          iconBorder: 'border-yellow-500/20',
          iconColor: 'text-yellow-400',
          valueColor: 'text-yellow-400',
          subtitleColor: 'text-yellow-300',
          hover: 'hover:shadow-yellow-500/10'
        };
      case 'purple':
        return {
          gradient: 'from-purple-500/20 to-purple-600/10',
          border: 'border-purple-500/20',
          iconBg: 'bg-purple-500/20',
          iconBorder: 'border-purple-500/20',
          iconColor: 'text-purple-400',
          valueColor: 'text-purple-400',
          subtitleColor: 'text-purple-300',
          hover: 'hover:shadow-purple-500/10'
        };
      case 'blue':
        return {
          gradient: 'from-blue-500/20 to-blue-600/10',
          border: 'border-blue-500/20',
          iconBg: 'bg-blue-500/20',
          iconBorder: 'border-blue-500/20',
          iconColor: 'text-blue-400',
          valueColor: 'text-blue-400',
          subtitleColor: 'text-blue-300',
          hover: 'hover:shadow-blue-500/10'
        };
      case 'emerald':
        return {
          gradient: 'from-emerald-500/20 to-emerald-600/10',
          border: 'border-emerald-500/20',
          iconBg: 'bg-emerald-500/20',
          iconBorder: 'border-emerald-500/20',
          iconColor: 'text-emerald-400',
          valueColor: 'text-emerald-400',
          subtitleColor: 'text-emerald-300',
          hover: 'hover:shadow-emerald-500/10'
        };
      default:
        return {
          gradient: 'from-slate-500/20 to-slate-600/10',
          border: 'border-slate-500/20',
          iconBg: 'bg-slate-500/20',
          iconBorder: 'border-slate-500/20',
          iconColor: 'text-slate-400',
          valueColor: 'text-slate-400',
          subtitleColor: 'text-slate-300',
          hover: 'hover:shadow-slate-500/10'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border ${colorClasses.border} rounded-2xl p-6 shadow-2xl relative overflow-hidden ${colorClasses.hover} transition-all duration-300 hover:scale-105`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses.gradient} pointer-events-none`}></div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colorClasses.valueColor}`}>{value}</p>
          {subtitle && (
            <div className="flex items-center mt-2">
              <div className={`w-1.5 h-1.5 ${colorClasses.valueColor.replace('text-', 'bg-')} rounded-full animate-pulse`}></div>
              <span className={`text-xs ${colorClasses.subtitleColor} ml-2`}>{subtitle}</span>
            </div>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <svg 
                className={`w-4 h-4 mr-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'} ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className={`${colorClasses.iconBg} p-4 rounded-xl border ${colorClasses.iconBorder}`}>
          <Icon className={`w-8 h-8 ${colorClasses.iconColor}`} />
        </div>
      </div>
    </div>
  );
};
