import React, { useEffect } from 'react';
import { CheckCircle2, Info, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { ToastNotification } from '../../types';

interface ToastProps {
  toast: ToastNotification | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto pointer-events-auto">
      <div className="bg-[#0F4C81] text-white rounded-2xl p-3.5 shadow-xl border border-sky-800/40 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
        {renderIcon()}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-sky-200 tracking-wide uppercase">
            {toast.title}
          </div>
          <div className="text-sm font-medium text-white/95 mt-0.5 leading-snug">
            {toast.message}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
