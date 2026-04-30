import { useState, useEffect } from 'react';
import { Ticket as TicketIcon, Plus, Search, Filter, X, ChevronRight, Package, User, Clock, Loader2, CheckCircle, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Asset, Personnel, Ticket } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function Tickets({ 
  setHeaderAction, 
  onSelectAsset, 
  user, 
  refreshKey 
}: { 
  setHeaderAction: (a: any) => void, 
  onSelectAsset: (id: string) => void, 
  user: Personnel, 
  refreshKey?: number 
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');

  const fetchData = async () => {
    try {
      const [tData, aData, pData] = await Promise.all([api.getTickets(), api.getAssets(), api.getPersonnel()]);
      setTickets(user.userRole === 'user' ? tData.filter(t => t.reporterId === user.id) : tData);
      setAssets(aData);
      setPersonnel(pData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHeaderAction({ label: 'Create Ticket', onClick: () => setShowCreateModal(true) });
    fetchData();
    return () => setHeaderAction(undefined);
  }, [user.id, refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTicket({ subject, description, assetId: selectedAsset, reporterId: user.id, priority });
      showToast('Maintenance ticket created successfully');
      setShowCreateModal(false);
      setSubject(''); setDescription(''); setSelectedAsset('');
      fetchData();
    } catch (error) {
      showToast('Could not create ticket', 'error');
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Urgent': return 'bg-red-50 text-red-700 border-red-100';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
      case 'In Progress': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      case 'Resolved': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      default: return 'bg-gray-400';
    }
  };

  const getDuration = (start: string, end: string | null | undefined) => {
    if (!end) return 'Unknown';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0 && minutes === 0) return 'Just now';
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      <div className="flex justify-between items-center"><div className="relative flex-1 max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search tickets..." className="w-full bg-white border border-gray-200/50 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/10 transition-all shadow-sm" /></div></div>

      <div className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {tickets.map((ticket) => {
            const asset = assets.find(a => a.id === ticket.assetId);
            const reporter = personnel.find(p => p.id === ticket.reporterId);
            return (
              <div 
                key={ticket.id} 
                className="p-6 md:p-8 hover:bg-[#F9FAFB]/50 transition-all group flex flex-col md:flex-row gap-6 items-start md:items-center cursor-pointer"
                onClick={() => setSelectedTicketForDetail(ticket)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{ticket.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                    {ticket.status === 'Resolved' && ticket.resolvedAt && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        <Clock size={10} /> Resolved in {getDuration(ticket.createdAt, ticket.resolvedAt)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-[#111827] mb-2">{ticket.subject}</h3>
                  <div className="flex flex-wrap gap-4 text-xs font-bold">
                    <button onClick={(e) => { e.stopPropagation(); onSelectAsset(ticket.assetId); }} className="flex items-center gap-1.5 text-primary-brand hover:underline"><Package size={14} className="opacity-70" />{asset?.name || ticket.assetId}</button>
                    <div className="flex items-center gap-1.5 text-gray-400"><User size={14} className="opacity-70" />{reporter?.name || 'Unknown'}</div>
                    <div className="flex items-center gap-1.5 text-gray-400"><Clock size={14} className="opacity-70" />{new Date(ticket.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(ticket.status)}`} />
                    <span className="text-sm font-bold text-[#111827]">{ticket.status}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-brand transition-colors" />
                </div>
              </div>
            );
          })}
          {tickets.length === 0 && <div className="p-20 text-center text-gray-400 italic">No tickets found.</div>}
        </div>
      </div>

      <AnimatePresence>
        {selectedTicketForDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTicketForDetail(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{selectedTicketForDetail.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getPriorityColor(selectedTicketForDetail.priority)}`}>{selectedTicketForDetail.priority}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#111827]">{selectedTicketForDetail.subject}</h2>
                </div>
                <button onClick={() => setSelectedTicketForDetail(null)} className="p-2 hover:bg-white rounded-full text-gray-400 shadow-sm"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('ticket.status' as any)}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedTicketForDetail.status)}`} />
                      <span className="text-sm font-bold text-[#111827]">{selectedTicketForDetail.status}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('ticket.created' as any)}</span>
                    <div className="text-sm font-bold text-[#111827]">{new Date(selectedTicketForDetail.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('ticket.asset' as any)}</span>
                    <div className="text-sm font-bold text-primary-brand hover:underline cursor-pointer" onClick={() => { onSelectAsset(selectedTicketForDetail.assetId); setSelectedTicketForDetail(null); }}>
                      {assets.find(a => a.id === selectedTicketForDetail.assetId)?.name || selectedTicketForDetail.assetId}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('ticket.reporter' as any)}</span>
                    <div className="text-sm font-bold text-[#111827]">{personnel.find(p => p.id === selectedTicketForDetail.reporterId)?.name || 'Unknown'}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('ticket.description' as any)}</span>
                  <div className="bg-[#F4F6F8] rounded-2xl p-6 text-sm text-[#111827] font-medium leading-relaxed whitespace-pre-wrap">
                    {selectedTicketForDetail.description || t('ticket.noDescription' as any)}
                  </div>
                </div>

                {selectedTicketForDetail.status === 'Resolved' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t('ticket.resolutionSummary' as any)}</span>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-6 text-sm text-emerald-900 font-bold leading-relaxed border border-emerald-100 shadow-sm whitespace-pre-wrap">
                      {selectedTicketForDetail.resolution || t('ticket.noResolutionNotes' as any)}
                    </div>
                  </div>
                )}

                {selectedTicketForDetail.status === 'Resolved' && selectedTicketForDetail.resolvedAt && (
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-center gap-3 text-emerald-700">
                      <CheckCircle size={20} />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest">{t('ticket.resolutionInfo' as any)}</p>
                        <p className="text-sm font-medium">{t('ticket.resolvedIn' as any)} {getDuration(selectedTicketForDetail.createdAt, selectedTicketForDetail.resolvedAt)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTicketForDetail.rating && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Star size={16} fill="currentColor" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t('ticket.userRating' as any)}</span>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      <div className="flex bg-white rounded-xl px-4 py-2 shadow-sm shrink-0 border border-amber-100">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={20} fill={s <= selectedTicketForDetail.rating! ? '#F59E0B' : 'none'} className={s <= selectedTicketForDetail.rating! ? 'text-amber-500' : 'text-gray-200'} />
                        ))}
                      </div>
                      {selectedTicketForDetail.feedback ? (
                        <div className="text-sm text-amber-900 font-medium italic mt-2 sm:mt-0">
                          "{selectedTicketForDetail.feedback}"
                        </div>
                      ) : (
                        <div className="text-sm text-amber-700/50 italic mt-2 sm:mt-0">{t('ticket.noFeedback' as any)}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]"><h2 className="text-xl font-extrabold text-[#111827]">Create New Ticket</h2><button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white rounded-full text-gray-400 shadow-sm"><X size={20} /></button></div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Subject</label><input required className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all" placeholder="Brief summary of the issue" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Asset with Issue</label><select required className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-bold text-primary-brand" value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)}><option value="">Select Asset</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}</select></div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                  <div className="flex gap-2">
                    {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                      <button key={p} type="button" onClick={() => setPriority(p as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${priority === p ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label><textarea rows={4} className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-medium resize-none" placeholder="Provide more details..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <button type="submit" className="w-full bg-primary-brand text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">Submit Maintenance Request</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
