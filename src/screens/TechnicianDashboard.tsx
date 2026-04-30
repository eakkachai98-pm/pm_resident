import { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Search, QrCode, Cpu, Cable, Play, Check, Package, FileText, ChevronDown, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Asset, Ticket, Personnel } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function TechnicianDashboard({ onSelectAsset, setHeaderAction, user, refreshKey }: { onSelectAsset: (id: string) => void, setHeaderAction: (a: any) => void, user: Personnel, refreshKey?: number }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [unassignedPool, setUnassignedPool] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const { showToast } = useToast();

  const toggleTaskDescription = (id: string) => {
    setExpandedTasks(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
  };

  const fetchData = async () => {
    try {
      const [statsData, allTickets, assetsData, personnelData] = await Promise.all([
        api.getStats(),
        api.getTickets(),
        api.getAssets(),
        api.getPersonnel()
      ]);

      const mappedTickets = allTickets.map((t: Ticket) => {
        const reporter = personnelData.find(p => p.id === t.reporterId);
        return {
          id: t.id,
          title: t.subject,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assetId: t.assetId,
          assigneeId: t.assigneeId,
          resolution: t.resolution,
          resolvedAt: t.resolvedAt,
          person: reporter ? `${reporter.name} (${reporter.department})` : 'Unknown User'
        };
      });

      const activeMyTasks = mappedTickets.filter(t => t.status === 'In Progress' && t.assigneeId === user.id);
      const openUnassigned = mappedTickets.filter(t => t.status === 'Open' && !t.assigneeId).sort((a, b) => {
        const pScore = (p: string) => {
          if (p === 'Urgent') return 3;
          if (p === 'High') return 2;
          if (p === 'Medium') return 1;
          return 0;
        };
        return pScore(b.priority) - pScore(a.priority);
      });
      const myCompleted = mappedTickets.filter(t => t.status === 'Resolved' && t.assigneeId === user.id);

      setMyTasks(activeMyTasks);
      setUnassignedPool(openUnassigned);
      setCompletedTasks(myCompleted);

      setStats([
        { label: t('tech.activeTasks' as any), value: activeMyTasks.length.toString(), detail: 'In Progress', icon: Wrench, color: 'text-amber-500' },
        { label: t('tech.unassignedPool' as any), value: openUnassigned.length.toString(), detail: 'Needs Attention', icon: AlertTriangle, color: 'text-red-500' },
        { label: t('tech.myCompleted' as any), value: myCompleted.length.toString(), detail: 'Click to view history', icon: CheckCircle, color: 'text-primary-brand', isClickable: true },
      ]);

      setQueue(assetsData.filter(a => a.status === 'In Maintenance').map(a => {
        const relatedTicket = allTickets.find(t => t.assetId === a.id && t.status !== 'Resolved');
        return {
          id: a.id,
          type: a.type,
          issue: relatedTicket ? relatedTicket.subject : 'General Maintenance Required',
          description: relatedTicket ? relatedTicket.description : '',
          status: 'In Maintenance',
          date: 'Just now'
        };
      }));
    } catch (error) {
      console.error('Error fetching technician data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setHeaderAction(undefined);
    fetchData(); 
  }, [refreshKey, user.id]);

  const handleUpdateStatus = async (e: React.MouseEvent, id: string, status: string, claim: boolean = false) => {
    e.stopPropagation();
    if (status === 'Resolved') {
      setResolvingTicketId(id);
      setShowResolveModal(true);
      return;
    }
    try {
      await api.updateTicketStatus(id, status, undefined, claim ? user.id : undefined);
      showToast(`Task ${claim ? 'claimed and ' : ''}moved to ${status}`, 'success');
      await fetchData();
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const submitResolution = async () => {
    if (!resolvingTicketId) return;
    try {
      await api.updateTicketStatus(resolvingTicketId, 'Resolved', resolutionNotes, user.id);
      showToast('Ticket resolved successfully', 'success');
      setShowResolveModal(false);
      setResolvingTicketId(null);
      setResolutionNotes('');
      await fetchData();
    } catch (error) {
      showToast('Failed to resolve ticket', 'error');
    }
  };

  const renderTask = (task: any, isUnassigned: boolean) => (
    <div 
      key={task.id} 
      className="p-6 md:p-8 hover:bg-[#F9FAFB]/50 transition-all flex flex-col gap-6 border-b border-gray-50 last:border-0"
    >
      <div className="flex flex-col sm:flex-row gap-6 sm:items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{task.id}</span>
            <div className="flex gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${task.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{task.status}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${task.priority === 'High' || task.priority === 'Urgent' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{task.priority}</span>
            </div>
          </div>
          <h3 className="text-base font-bold text-[#111827] mb-1.5">{task.title}</h3>
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-gray-400 font-bold">
            <span className="text-gray-600 font-bold">{task.person}</span>
            <button 
              onClick={() => onSelectAsset(task.assetId)} 
              className="flex items-center gap-1.5 text-primary-brand hover:underline"
            >
              <Package size={12} /> {task.assetId}
            </button>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {isUnassigned ? (
            <button onClick={(e) => handleUpdateStatus(e, task.id, 'In Progress', true)} className="px-5 py-2.5 bg-primary-brand text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold flex items-center gap-2"><Play size={14} /> {t('tech.claimTask' as any)}</button>
          ) : (
            <button onClick={(e) => handleUpdateStatus(e, task.id, 'Resolved')} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold flex items-center gap-2"><Check size={14} /> {t('tech.resolve' as any)}</button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={() => toggleTaskDescription(task.id)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all text-[10px] font-bold uppercase tracking-wider w-fit border border-slate-200/60"
        >
          <FileText size={14} />
          {expandedTasks.includes(task.id) ? t('tech.hideDescription' as any) : t('tech.viewDescription' as any)}
          <ChevronDown size={14} className={`transition-transform duration-200 ${expandedTasks.includes(task.id) ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {expandedTasks.includes(task.id) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-slate-200/60">
                <div className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  {task.description || t('tech.noDetailedDescription' as any)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand"></div></div>;

  return (
    <div className="space-y-8 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            onClick={() => stat.isClickable && setShowHistoryModal(true)}
            className={`bg-white rounded-2xl p-6 border border-gray-200/50 shadow-sm ${stat.isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary-brand/30 transition-all' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-3"><span className="text-3xl font-extrabold text-[#111827]">{stat.value}</span></div>
            {stat.detail && <div className="mt-2 text-[11px] font-bold flex items-center gap-1"><span className={stat.color}>{stat.detail}</span></div>}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-8">
          {/* My Assigned Tasks */}
          <section className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-blue-50/30">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <h2 className="text-lg font-bold text-[#111827]">{t('tech.activeTasks' as any)}</h2>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{myTasks.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {myTasks.map(t => renderTask(t, false))}
              {myTasks.length === 0 && <div className="p-12 text-center text-gray-400 italic text-sm">{t('tech.noActiveTasks' as any)}</div>}
            </div>
          </section>

          {/* Unassigned Pool */}
          <section className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#111827]">{t('tech.unassignedPool' as any)}</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{unassignedPool.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {unassignedPool.map(t => renderTask(t, true))}
              {unassignedPool.length === 0 && <div className="p-12 text-center text-gray-400 italic text-sm">{t('tech.noPendingTasks' as any)}</div>}
            </div>
          </section>
        </div>

        <section className="md:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-200/50 shadow-sm relative overflow-hidden">
            <h2 className="text-xl font-extrabold text-[#111827] mb-6">{t('tech.deviceSearch' as any)}</h2>
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/10 transition-all" placeholder={t('tech.enterAssetId' as any)} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button className="flex flex-col items-center p-6 rounded-2xl bg-[#F9FAFB] hover:bg-primary-brand hover:text-white transition-all gap-2 border border-gray-100 group"><Cpu size={24} className="text-primary-brand group-hover:text-white" /><span className="text-[10px] font-bold uppercase tracking-widest">{t('tech.inventory' as any)}</span></button>
              <button className="flex flex-col items-center p-6 rounded-2xl bg-[#F9FAFB] hover:bg-primary-brand hover:text-white transition-all gap-2 border border-gray-100 group"><Cable size={24} className="text-primary-brand group-hover:text-white" /><span className="text-[10px] font-bold uppercase tracking-widest">{t('tech.cables' as any)}</span></button>
            </div>
          </div>
        </section>

        <section className="md:col-span-12 bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center"><h2 className="text-lg font-bold text-[#111827]">{t('tech.maintenancePool' as any)}</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB] text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-50"><th className="px-8 py-4">{t('tech.assetId' as any)}</th><th className="px-8 py-4">{t('tech.subject' as any)}</th><th className="px-8 py-4">{t('tech.description' as any)}</th><th className="px-8 py-4 text-right">{t('tech.status' as any)}</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9FAFB]/50 transition-colors cursor-pointer" onClick={() => onSelectAsset(item.id)}>
                    <td className="px-8 py-5 font-bold text-primary-brand hover:underline">{item.id}</td>
                    <td className="px-8 py-5 text-[#111827] font-bold text-sm">{item.issue}</td>
                    <td className="px-8 py-5 text-gray-500 font-medium text-xs max-w-md truncate">{item.description}</td>
                    <td className="px-8 py-5 text-right"><span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700">{t('tech.underRepair' as any)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showResolveModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResolveModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
              <h3 className="text-xl font-extrabold text-[#111827] mb-6">{t('tech.resolveTicket' as any)}</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-400 font-medium">{t('tech.resolveTicketDesc' as any)}</p>
                <textarea 
                  className="w-full bg-[#F4F6F8] border-none rounded-2xl py-4 px-6 text-sm font-medium resize-none" 
                  rows={4} 
                  placeholder={t('tech.resolveTicketPlaceholder' as any)} 
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
                <div className="flex gap-4">
                  <button onClick={() => setShowResolveModal(false)} className="flex-1 py-4 rounded-2xl bg-[#F9FAFB] text-gray-400 text-xs font-bold uppercase tracking-widest border border-gray-100 hover:bg-gray-50 transition-all">{t('tech.cancel' as any)}</button>
                  <button onClick={submitResolution} className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">{t('tech.completeRepair' as any)}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showHistoryModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><History size={20} /></div>
                  <h3 className="text-xl font-extrabold text-[#111827]">{t('tech.historyTitle' as any)}</h3>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
              </div>
              <div className="overflow-y-auto p-8 flex-1 custom-scrollbar">
                {completedTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm font-medium">{t('tech.noCompletedTasks' as any)}</div>
                ) : (
                  <div className="space-y-4">
                    {completedTasks.map(t => (
                      <div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 block">{t.id}</span>
                            <h4 className="text-sm font-bold text-[#111827]">{t.title}</h4>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Check size={12} /> Resolved</span>
                        </div>
                        {t.resolution && (
                          <div className="mt-3 bg-[#F9FAFB] p-3 rounded-xl border border-gray-50">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('tech.resolutionNotes' as any)}</p>
                            <p className="text-xs text-gray-600 font-medium">{t.resolution}</p>
                          </div>
                        )}
                        <div className="mt-3 flex justify-between items-center text-[11px] font-bold text-gray-400">
                          <span>{t('tech.asset' as any)} <span className="text-primary-brand cursor-pointer hover:underline" onClick={() => {setShowHistoryModal(false); onSelectAsset(t.assetId);}}>{t.assetId}</span></span>
                          {t.resolvedAt && <span>{new Date(t.resolvedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
