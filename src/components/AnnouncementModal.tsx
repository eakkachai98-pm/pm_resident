import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Megaphone, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function AnnouncementModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getSettings().then(settings => {
        setMessage(settings?.system_announcement_message || '');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveSettings({ system_announcement_message: message });
      showToast(t('announcement.successUpdate'));
      onClose();
    } catch (error) {
      showToast(t('announcement.errorUpdate'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setMessage('');
    setSaving(true);
    try {
      await api.saveSettings({ system_announcement_message: '' });
      showToast(t('announcement.successClear'));
      onClose();
    } catch (error) {
      showToast(t('announcement.errorClear'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#F9FAFB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm"><Megaphone size={20} /></div>
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">{t('announcement.title')}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('announcement.subtitle')}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-[#111827] hover:bg-gray-100 rounded-xl transition-all"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-primary-brand" size={24} /></div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#111827]">{t('announcement.messageLabel')}</label>
                  <textarea 
                    className="w-full bg-[#F4F6F8] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all resize-none h-32"
                    placeholder={t('announcement.messagePlaceholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 font-medium">
                    {t('announcement.helperText')}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-between gap-3">
              <button onClick={handleClear} disabled={loading || saving} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                {t('announcement.clear')}
              </button>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors">
                  {t('announcement.cancel')}
                </button>
                <button onClick={handleSave} disabled={loading || saving} className="bg-[#111827] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-gray-900/20 hover:bg-primary-brand disabled:opacity-50 transition-all">
                  {saving ? t('announcement.saving') : t('announcement.broadcast')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
