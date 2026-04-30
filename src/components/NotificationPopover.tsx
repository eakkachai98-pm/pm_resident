import { Bell, Ticket, Package, Info, Check, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Notification } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onNavigate: (link: string) => void;
}

export default function NotificationPopover({ 
  notifications, 
  onMarkAsRead, 
  onNavigate 
}: NotificationPopoverProps) {
  const { t, language } = useLanguage();

  const translatePriority = (p: string) => {
    if (language !== 'th') return p;
    const map: Record<string, string> = {
      'Low': 'ต่ำ',
      'Medium': 'ปานกลาง',
      'High': 'สูง',
      'Urgent': 'ด่วน',
      'Critical': 'วิกฤต'
    };
    return map[p] || p;
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return t('notify.justNow' as any);
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return t('notify.justNow' as any);
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return t('notify.minutesAgo' as any).replace('{m}', diffInMinutes.toString());
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('notify.hoursAgo' as any).replace('{h}', diffInHours.toString());
    
    const diffInDays = Math.floor(diffInHours / 24);
    return t('notify.daysAgo' as any).replace('{d}', diffInDays.toString());
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full mt-2 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col max-h-[500px]"
    >
      <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{t('notify.title' as any)}</h3>
          <p className="text-[10px] text-gray-500 font-medium">{t('notify.unreadMessages' as any).replace('{count}', unreadCount.toString())}</p>
        </div>
        <Bell size={16} className="text-primary-brand" />
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell size={20} className="text-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-400">{t('notify.empty' as any)}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${!n.isRead ? 'bg-primary-brand/5' : ''}`}
                onClick={() => {
                  if (n.link) onNavigate(n.link);
                  if (!n.isRead) onMarkAsRead(n.id);
                }}
              >
                {!n.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-brand" />
                )}
                <div className="flex gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'ticket' ? 'bg-amber-100 text-amber-600' :
                    n.type === 'asset' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {n.type === 'ticket' ? <Ticket size={16} /> :
                     n.type === 'asset' ? <Package size={16} /> :
                     <Info size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="text-xs font-bold text-gray-900 truncate pr-2">
                        {n.title === 'New Urgent Ticket' ? t('notify.newTicket' as any).replace('{priority}', translatePriority('Urgent')) : 
                         n.title.startsWith('New Ticket (') ? t('notify.newTicket' as any).replace('{priority}', translatePriority(n.title.match(/\((.+)\)/)?.[1] || '')) :
                         n.title === 'New Asset Assigned' ? t('notify.newAsset' as any) :
                         n.title.startsWith('Ticket Update: ') ? t('notify.ticketUpdate' as any).replace('{status}', n.title.split(': ')[1] || '') :
                         n.title}
                      </p>
                      <span className="text-[9px] text-gray-400 font-medium flex items-center gap-1 shrink-0">
                        <Clock size={10} /> {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed mb-2">
                      {n.message.includes('created a new ticket:') 
                        ? n.message.replace(/(.+) created a new ticket: "(.+)"/, (_, user, subject) => t('notify.ticketCreated' as any).replace('{user}', user).replace('{subject}', subject))
                        : n.message.includes('status has been updated to:')
                        ? n.message.replace(/Your ticket "(.+)" status has been updated to: (.+)/, (_, subject, status) => t('notify.ticketStatusUpdated' as any).replace('{subject}', subject).replace('{status}', status))
                        : n.message.includes('assigned a new asset:')
                        ? n.message.replace(/You have been assigned a new asset: (.+) \((.+)\)/, (_, name, id) => t('notify.assetAssigned' as any).replace('{name}', name).replace('{id}', id))
                        : n.message}
                    </p>
                    
                    {!n.isRead && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(n.id);
                        }}
                        className="text-[10px] font-bold text-primary-brand hover:underline flex items-center gap-1"
                      >
                        <Check size={10} /> {t('notify.markRead' as any)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 bg-gray-50/50 border-t border-gray-50 text-center">
          <button className="text-[11px] font-bold text-gray-500 hover:text-gray-700 transition-colors">
            {t('notify.viewAll' as any)}
          </button>
        </div>
      )}
    </motion.div>
  );
}
