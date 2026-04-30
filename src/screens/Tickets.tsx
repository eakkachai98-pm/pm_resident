import { useState, useEffect } from 'react';
import { Wrench, Plus, Search, X, ChevronRight, Home, User, Clock, Loader2, CheckCircle, Droplets, Zap, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function Maintenance({ 
  setHeaderAction, 
  user 
}: { 
  setHeaderAction: (a: any) => void, 
  user: any
}) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const { showToast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [category, setCategory] = useState('General');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('Morning');

  const fetchData = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/rooms')
      ]);
      const tData = await tRes.json();
      const rData = await rRes.json();
      
      setTickets(user.userRole === 'user' ? tData.filter((t: any) => t.reporterId === user.id) : tData);
      setRooms(rData);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHeaderAction({ label: 'Report Issue', onClick: () => setShowCreateModal(true) });
    fetchData();
    return () => setHeaderAction(undefined);
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, roomId: selectedRoomId, reporterId: user.id, category, scheduledDate, scheduledSlot })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit request');
      }
      
      showToast('Maintenance request submitted successfully');
      setShowCreateModal(false);
      setTitle(''); setDescription(''); setSelectedRoomId(''); setCategory('General'); setScheduledDate(''); setScheduledSlot('Morning');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Could not submit request', 'error');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const bodyPayload: any = { status };
      if (status === 'IN_PROGRESS') {
        bodyPayload.assigneeId = user.id;
      }
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`Status updated to ${status}`);
      setSelectedTicket(null);
      fetchData();
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Water': return <Droplets size={16} className="text-blue-500" />;
      case 'Electric': return <Zap size={16} className="text-amber-500" />;
      case 'AirCon': return <Wind size={16} className="text-cyan-500" />;
      default: return <Wrench size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
      case 'IN_PROGRESS': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      case 'RESOLVED': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      default: return 'bg-gray-400';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      <div className="flex justify-between items-center"><div className="relative flex-1 max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search maintenance tickets..." className="w-full bg-white border border-gray-200/50 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/10 transition-all shadow-sm" /></div></div>

      <div className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="p-6 md:p-8 hover:bg-[#F9FAFB]/50 transition-all group flex flex-col md:flex-row gap-6 items-start md:items-center cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{ticket.id.substring(0,8)}</span>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-gray-50 border-gray-200 text-gray-700">
                    {getCategoryIcon(ticket.category)} {ticket.category}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-[#111827] mb-2">{ticket.title}</h3>
                <div className="flex flex-wrap gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-primary-brand"><Home size={14} className="opacity-70" />Room {ticket.room?.roomNumber || 'Unknown'}</div>
                  <div className="flex items-center gap-1.5 text-gray-400"><User size={14} className="opacity-70" />{ticket.reporter?.name || 'Unknown'}</div>
                  <div className="flex items-center gap-1.5 text-gray-400"><Clock size={14} className="opacity-70" />{new Date(ticket.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(ticket.status)}`} />
                  <span className="text-sm font-bold text-[#111827]">{ticket.status.replace('_', ' ')}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-brand transition-colors" />
              </div>
            </div>
          ))}
          {tickets.length === 0 && <div className="p-20 text-center text-gray-400 italic">No maintenance tickets found.</div>}
        </div>
      </div>

      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTicket(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{selectedTicket.id.substring(0,8)}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#111827]">{selectedTicket.title}</h2>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white rounded-full text-gray-400 shadow-sm"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedTicket.status)}`} />
                      <span className="text-sm font-bold text-[#111827]">{selectedTicket.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</span>
                    <div className="text-sm font-bold text-[#111827] flex items-center gap-1">{getCategoryIcon(selectedTicket.category)} {selectedTicket.category}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room</span>
                    <div className="text-sm font-bold text-primary-brand">Room {selectedTicket.room?.roomNumber}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reporter</span>
                    <div className="text-sm font-bold text-[#111827]">{selectedTicket.reporter?.name}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</span>
                  <div className="bg-[#F4F6F8] rounded-2xl p-6 text-sm text-[#111827] font-medium leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description || 'No description provided.'}
                  </div>
                </div>

                {user.userRole !== 'user' && selectedTicket.status !== 'RESOLVED' && (
                  <div className="pt-6 border-t border-gray-100 flex gap-4">
                    {selectedTicket.status === 'OPEN' && (
                      <button onClick={() => updateStatus(selectedTicket.id, 'IN_PROGRESS')} className="flex-1 bg-amber-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-amber-600 transition-colors">Start Repair</button>
                    )}
                    {(selectedTicket.status === 'OPEN' || selectedTicket.status === 'IN_PROGRESS') && (
                      <button onClick={() => updateStatus(selectedTicket.id, 'RESOLVED')} className="flex-1 bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-600 transition-colors">Mark as Resolved</button>
                    )}
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
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]"><h2 className="text-xl font-extrabold text-[#111827]">Report Issue</h2><button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white rounded-full text-gray-400 shadow-sm"><X size={20} /></button></div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Issue Title</label><input required className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all" placeholder="e.g. Water leaking in bathroom" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Room</label><select required className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-bold text-primary-brand" value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}><option value="">Select Room</option>{rooms.map(r => <option key={r.id} value={r.id}>Room {r.name.replace('Room ','')}</option>)}</select></div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-bold text-primary-brand" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="Water">Water System</option>
                      <option value="Electric">Electrical</option>
                      <option value="AirCon">Air Conditioning</option>
                      <option value="General">General / Furniture</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Preferred Date</label>
                    <input type="date" required className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-bold text-primary-brand" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Time Slot</label>
                    <select className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-bold text-primary-brand" value={scheduledSlot} onChange={(e) => setScheduledSlot(e.target.value)}>
                      <option value="Morning">Morning (09:00 - 12:00)</option>
                      <option value="Afternoon">Afternoon (13:00 - 17:00)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label><textarea rows={4} className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-medium resize-none" placeholder="Provide more details about the problem..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <button type="submit" className="w-full bg-primary-brand text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">Submit Maintenance Request</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
