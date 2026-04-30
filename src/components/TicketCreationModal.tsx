import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Personnel } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface TicketCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Personnel;
  initialAssetId?: string;
  onSuccess?: () => void;
}

export default function TicketCreationModal({ isOpen, onClose, user, initialAssetId, onSuccess }: TicketCreationModalProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assetId, setAssetId] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setDescription('');
      setPriority('Medium');
      setAssetId(initialAssetId || '');
    }
  }, [isOpen, initialAssetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast(t('ticketCreate.errorRequired' as any), 'error');
      return;
    }
    
    setLoading(true);
    try {
      await api.createTicket({
        subject,
        description,
        status: 'Open',
        priority: priority,
        reporterId: user.id,
        assetId: assetId || undefined,
        createdAt: new Date().toISOString()
      });
      showToast(t('ticketCreate.successCreate' as any), 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create ticket:', error);
      showToast(t('ticketCreate.errorCreate' as any), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col font-sans"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB] shrink-0">
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-[#111827]">{t('ticketCreate.title' as any)}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t('ticketCreate.subtitle' as any)}</p>
              </div>
              <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
              {initialAssetId && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
                  <div className="text-sm">
                    <span className="font-bold">{t('ticketCreate.reportingForAsset' as any)}</span>
                    {initialAssetId}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('ticketCreate.subjectLabel' as any)}</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#F9FAFB] border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-brand/20 transition-all text-sm font-medium"
                  placeholder={t('ticketCreate.subjectPlaceholder' as any)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('ticketCreate.priorityLabel' as any)}</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#F9FAFB] border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-brand/20 transition-all text-sm font-bold text-gray-700 cursor-pointer"
                >
                  <option value="Low">{t('ticketCreate.priorityLow' as any)}</option>
                  <option value="Medium">{t('ticketCreate.priorityMedium' as any)}</option>
                  <option value="High">{t('ticketCreate.priorityHigh' as any)}</option>
                  <option value="Urgent">{t('ticketCreate.priorityUrgent' as any)}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('ticketCreate.descriptionLabel' as any)}</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F9FAFB] border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-brand/20 transition-all text-sm font-medium min-h-[120px] resize-none"
                  placeholder={t('ticketCreate.descriptionPlaceholder' as any)}
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-xs uppercase tracking-widest"
                >
                  {t('ticketCreate.cancel' as any)}
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold bg-primary-brand text-white hover:bg-blue-600 transition-colors disabled:opacity-50 text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2"
                >
                  {loading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  {t('ticketCreate.submit' as any)}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
