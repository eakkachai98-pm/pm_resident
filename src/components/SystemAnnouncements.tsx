import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function SystemAnnouncements() {
  const [announcement, setAnnouncement] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const settings = await api.getSettings();
        const msg = settings?.system_announcement_message;
        if (msg) {
          setAnnouncement(msg);
          // Check session storage to see if user already dismissed THIS specific announcement in the current session
          const dismissedMsg = sessionStorage.getItem('dismissed_announcement');
          if (dismissedMsg !== msg) {
            setIsVisible(true);
          }
        }
      } catch (e) {
        console.error('Failed to fetch announcement:', e);
      }
    };
    fetchAnnouncement();
    // Poll every minute
    const interval = setInterval(fetchAnnouncement, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('dismissed_announcement', announcement);
  };

  if (!announcement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ height: 0, opacity: 0, marginBottom: 0 }}
          animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
          className="bg-blue-500/10 border border-blue-500/20 text-blue-700 px-4 py-3 rounded-xl md:rounded-2xl flex items-center justify-between overflow-hidden"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-600 shrink-0">
              <Megaphone size={16} />
            </div>
            <span className="text-sm truncate">
              <strong className="mr-2">{t('announcement.prefix')}</strong> 
              {announcement}
            </span>
          </div>
          <button 
            onClick={handleDismiss} 
            className="p-1.5 opacity-60 hover:opacity-100 hover:bg-blue-500/10 rounded-lg transition-all shrink-0 ml-4"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
