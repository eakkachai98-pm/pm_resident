import { useState, useEffect } from 'react';
import { Laptop, Monitor, BookOpen, Calendar, ArrowRight, Wrench, Package, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { Asset, Activity, Screen, Personnel, Ticket } from '../types';
import { useToast } from '../context/ToastContext';
import TicketCreationModal from '../components/TicketCreationModal';
import TicketDetailModal from '../components/TicketDetailModal';
import SystemAnnouncements from '../components/SystemAnnouncements';
import { useLanguage } from '../context/LanguageContext';

export default function UserDashboard({ onSelectAsset, onNavigate, user, setHeaderAction }: { onSelectAsset: (id: string) => void, onNavigate: (s: Screen) => void, user: Personnel, setHeaderAction: (a: any) => void }) {
  const { t } = useLanguage();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [reportAssetId, setReportAssetId] = useState<string | undefined>();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketDetailModalOpen, setIsTicketDetailModalOpen] = useState(false);
  const { showToast } = useToast();

  const getDuration = (start: string, end: string | null | undefined) => {
    if (!end) return 'Ongoing';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0 && minutes === 0) return 'Just now';
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  useEffect(() => {
    setHeaderAction(undefined);
    const fetchData = async () => {
      try {
        const [assetsData, activitiesData, ticketsData] = await Promise.all([
          api.getAssets(), 
          api.getActivities(),
          api.getTickets()
        ]);
        setAssets(assetsData.filter(a => a.assignedPersonnelId === user.id));
        setActivities(activitiesData);
        setRecentTickets(ticketsData.filter(t => t.reporterId === user.id).slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'laptop': return Laptop;
      case 'monitor': return Monitor;
      default: return Package;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand"></div></div>;

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      <header className="flex flex-col gap-1 px-1">
        <h2 className="text-xl md:text-2xl font-bold text-on-surface-brand tracking-tight">{t('dashboard.agencyOverview' as any)}</h2>
        <p className="text-xs md:text-sm text-secondary-brand">{t('dashboard.welcomeBack' as any)} {user.name}.</p>
      </header>

      <SystemAnnouncements />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* My Assets */}
        <div className="lg:col-span-8 bg-white rounded-2xl md:rounded-[2rem] border border-gray-200/50 shadow-sm h-full flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm md:text-base font-bold text-on-surface-brand">{t('dashboard.myAssets' as any)}</h3>
            <button onClick={() => onNavigate('inventory')} className="text-primary-brand text-xs font-bold hover:underline">{t('dashboard.viewAll' as any)}</button>
          </div>
          
          <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {assets.length > 0 ? assets.map((asset) => {
              const Icon = getIcon(asset.type);
              return (
                <motion.div 
                  key={asset.id}
                  whileHover={{ y: -2 }}
                  onClick={() => onSelectAsset(asset.id)}
                  className="bg-[#F9FAFB] rounded-xl p-5 flex flex-col justify-between group cursor-pointer border border-transparent hover:border-primary-brand/20 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-white rounded-lg border border-gray-100 text-primary-brand group-hover:bg-primary-brand group-hover:text-white transition-all">
                      <Icon size={18} />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      asset.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                    }`}>{asset.status}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5 tracking-widest uppercase font-bold">{asset.name}</p>
                      <h4 className="text-sm md:text-[15px] font-bold text-on-surface-brand">{asset.id}</h4>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportAssetId(asset.id);
                        setIsTicketModalOpen(true);
                      }}
                      className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                      title={t('dashboard.reportIssue' as any)}
                    >
                      <AlertTriangle size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="col-span-full flex flex-col items-center justify-center py-10 opacity-30">
                <Package size={48} className="mb-4" />
                <p className="text-sm font-medium">{t('dashboard.noAssetsAssigned' as any)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Track */}
        <div className="lg:col-span-4 bg-white rounded-2xl md:rounded-[2rem] border border-gray-200/50 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm md:text-base font-bold text-on-surface-brand">{t('dashboard.recentTickets' as any)}</h3>
            <button onClick={() => onNavigate('tickets')} className="text-primary-brand text-xs font-bold hover:underline">{t('dashboard.viewAll' as any)}</button>
          </div>
          
          <div className="p-6 space-y-5 flex-1">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="group cursor-pointer" onClick={() => { setSelectedTicket(ticket); setIsTicketDetailModalOpen(true); }}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-on-surface-brand group-hover:text-primary-brand transition-colors truncate pr-2">{ticket.subject}</h4>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter ${
                    ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>{ticket.status}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400 mb-2">
                  <span>{ticket.id}</span>
                  <span>•</span>
                  {ticket.status === 'Resolved' && ticket.resolvedAt ? (
                    <span className="text-emerald-600 font-bold">{t('dashboard.resolvedIn' as any)} {getDuration(ticket.createdAt, ticket.resolvedAt)}</span>
                  ) : (
                    <span>{t('dashboard.created' as any)} {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
                {ticket.status === 'Resolved' && ticket.resolution && (
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
                    <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-1">{t('dashboard.resolutionNote' as any)}</p>
                    <p className="text-[11px] text-emerald-800 font-medium line-clamp-2 italic leading-relaxed">
                      "{ticket.resolution}"
                    </p>
                  </div>
                )}
              </div>
            ))}
            {recentTickets.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 py-10">
                <Wrench size={32} className="mb-2" />
                <p className="text-xs font-medium">{t('dashboard.noRecentTickets' as any)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button onClick={() => showToast(t('dashboard.knowledgeBaseSoon' as any), 'info')} className="bg-white rounded-2xl p-6 flex items-center gap-5 border border-gray-200/50 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group text-left">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#F4F6F8] flex items-center justify-center text-primary-brand group-hover:bg-primary-brand group-hover:text-white transition-all shrink-0">
            <BookOpen size={24} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-on-surface-brand group-hover:text-primary-brand transition-colors truncate">{t('dashboard.knowledgeBase' as any)}</h4>
            <p className="text-xs text-gray-400 truncate mt-0.5">{t('dashboard.knowledgeBaseDesc' as any)}</p>
          </div>
        </button>
      </div>

      <TicketCreationModal 
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        user={user}
        initialAssetId={reportAssetId}
        onSuccess={() => onNavigate('tickets')}
      />
      
      <TicketDetailModal
        isOpen={isTicketDetailModalOpen}
        onClose={() => setIsTicketDetailModalOpen(false)}
        ticket={selectedTicket}
      />
    </div>
  );
}
