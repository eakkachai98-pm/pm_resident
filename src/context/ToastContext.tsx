import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className={`
                flex items-center gap-4 p-4 rounded-2xl shadow-2xl border backdrop-blur-md
                ${toast.type === 'success' ? 'bg-white/90 border-emerald-100 text-emerald-900' : 
                  toast.type === 'error' ? 'bg-white/90 border-red-100 text-red-900' : 
                  'bg-white/90 border-blue-100 text-blue-900'}
              `}>
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 
                    toast.type === 'error' ? 'bg-red-500 text-white' : 
                    'bg-blue-500 text-white'}
                `}>
                  {toast.type === 'success' && <CheckCircle2 size={20} />}
                  {toast.type === 'error' && <AlertCircle size={20} />}
                  {toast.type === 'info' && <Info size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight">{toast.message}</p>
                </div>

                <button 
                  onClick={() => removeToast(toast.id)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
