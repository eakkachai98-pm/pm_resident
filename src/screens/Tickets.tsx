import { useState, useEffect } from 'react';
import { Wrench, Plus, Search, X, ChevronLeft, ChevronRight, Home, User, Clock, Loader2, CheckCircle, Droplets, Zap, Wind, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { TechnicianAvailability, TimeSlot } from '../types';
import { SLOT_CAPACITY, getAvailableTechniciansForSlot, getDateAvailability, getSlotCapacity } from '../utils/technicianAvailability';

export default function Maintenance({ 
  setHeaderAction, 
  user,
  initialTicketId,
  onSelectAsset,
  refreshKey
}: { 
  setHeaderAction: (a: any) => void, 
  user: any,
  initialTicketId?: string | null,
  onSelectAsset?: (id: string) => void,
  refreshKey?: number
}) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [technicianAvailability, setTechnicianAvailability] = useState<TechnicianAvailability[]>([]);
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
  const [ratingValue, setRatingValue] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [pickerDate, setPickerDate] = useState(new Date());
  const hasAvailabilityData = technicianAvailability.length > 0;

  const getSlotBookingCount = (dateString: string, slot: TimeSlot) =>
    allTickets.filter((ticket: any) => ticket.scheduledDate === dateString && ticket.scheduledSlot === slot).length;

  const getEffectiveSlotCapacity = (dateString: string, slot: TimeSlot) =>
    hasAvailabilityData ? getSlotCapacity(technicianAvailability, dateString, slot) : SLOT_CAPACITY;

  const getSlotIndicatorColor = (bookingCount: number, capacity: number) => {
    if (capacity === 0) {
      return 'bg-gray-300';
    }

    const remaining = Math.max(0, capacity - bookingCount);
    const warningThreshold = Math.max(1, Math.ceil(capacity / 3));

    if (remaining === 0) {
      return 'bg-red-400';
    }

    if (remaining <= warningThreshold) {
      return 'bg-amber-400';
    }

    return 'bg-emerald-400';
  };

  const fetchData = async () => {
    try {
      const [tRes, rRes, availabilityData] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/rooms'),
        api.getTechnicianAvailability()
      ]);
      const tData = await tRes.json();
      const rData = await rRes.json();
      
      setAllTickets(tData);
      const filteredTickets = user.userRole === 'user' ? tData.filter((t: any) => t.reporterId === user.id) : tData;
      setTickets(filteredTickets);
      setRooms(rData);
      setTechnicianAvailability(availabilityData);

      if (initialTicketId) {
        const ticketToOpen = filteredTickets.find((t: any) => t.id === initialTicketId);
        if (ticketToOpen) {
          setSelectedTicket(ticketToOpen);
          setRatingValue(0);
          setHoveredStar(0);
        }
      }
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
  }, [user.id, refreshKey, initialTicketId]);

  useEffect(() => {
    if (!scheduledDate) {
      return;
    }

    const currentSlotBookings = getSlotBookingCount(scheduledDate, scheduledSlot as TimeSlot);
    const currentSlotHasCapacity = currentSlotBookings < getEffectiveSlotCapacity(scheduledDate, scheduledSlot as TimeSlot);
    const currentSlotHasTechnician = !hasAvailabilityData
      || getAvailableTechniciansForSlot(technicianAvailability, scheduledDate, scheduledSlot as TimeSlot).length > 0;

    if (currentSlotHasCapacity && currentSlotHasTechnician) {
      return;
    }

    const nextAvailableSlot = (['Morning', 'Afternoon'] as const).find((slot) => {
      const slotBookings = getSlotBookingCount(scheduledDate, slot);
      const slotHasCapacity = slotBookings < getEffectiveSlotCapacity(scheduledDate, slot);
      const slotHasTechnician = !hasAvailabilityData
        || getAvailableTechniciansForSlot(technicianAvailability, scheduledDate, slot).length > 0;

      return slotHasCapacity && slotHasTechnician;
    });

    if (nextAvailableSlot) {
      setScheduledSlot(nextAvailableSlot);
    }
  }, [allTickets, hasAvailabilityData, scheduledDate, scheduledSlot, technicianAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!scheduledDate) {
        throw new Error('Please select a preferred date before submitting.');
      }

      if (getSlotBookingCount(scheduledDate, scheduledSlot as TimeSlot) >= getEffectiveSlotCapacity(scheduledDate, scheduledSlot as TimeSlot)) {
        throw new Error('This slot is already full. Please choose another time.');
      }

      if (
        hasAvailabilityData
        && getAvailableTechniciansForSlot(technicianAvailability, scheduledDate, scheduledSlot as TimeSlot).length === 0
      ) {
        throw new Error('No technician is available for the selected date and slot.');
      }

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
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update');
      showToast('Status updated successfully', 'success');
      fetchData();
      setSelectedTicket(null);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const submitRating = async (ticketId: string, rating: number, feedback: string) => {
    try {
      const res = await fetch(`/api/maintenance/${ticketId}/rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback })
      });
      if (!res.ok) throw new Error('Failed to rate');
      showToast('Rating submitted successfully', 'success');
      fetchData();
      setSelectedTicket((prev: any) => ({ ...prev, rating, feedback }));
    } catch (err) {
      showToast('Failed to submit rating', 'error');
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

  const pickerYear = pickerDate.getFullYear();
  const pickerMonth = pickerDate.getMonth() + 1;
  const pickerDaysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
  const pickerFirstDay = new Date(pickerYear, pickerMonth - 1, 1).getDay();
  const pickerMonthStr = `${pickerYear}-${pickerMonth.toString().padStart(2, '0')}`;
  const selectedDateAvailability = scheduledDate && hasAvailabilityData
    ? getDateAvailability(technicianAvailability, scheduledDate)
    : null;

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      <div className="flex justify-between items-center"><div className="relative flex-1 max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search maintenance tickets..." className="w-full bg-white border border-gray-200/50 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/10 transition-all shadow-sm" /></div></div>

      <div className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="p-6 md:p-8 hover:bg-[#F9FAFB]/50 transition-all group flex flex-col md:flex-row gap-6 items-start md:items-center cursor-pointer"
              onClick={() => { setSelectedTicket(ticket); setRatingValue(0); setHoveredStar(0); }}
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
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB] shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{selectedTicket.id.substring(0,8)}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#111827]">{selectedTicket.title}</h2>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white rounded-full text-gray-400 shadow-sm transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
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

                {selectedTicket.status === 'RESOLVED' && (selectedTicket.repairImage || selectedTicket.repairNotes) && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resolution Details</h4>
                    {selectedTicket.repairImage && (
                      <img src={selectedTicket.repairImage} alt="Repair Evidence" className="w-full max-h-[300px] object-cover rounded-xl border border-gray-200" />
                    )}
                    {selectedTicket.repairNotes && (
                      <div className="bg-emerald-50 rounded-2xl p-4 text-sm text-emerald-800 font-medium whitespace-pre-wrap border border-emerald-100">
                        {selectedTicket.repairNotes}
                      </div>
                    )}
                  </div>
                )}

                {selectedTicket.status === 'RESOLVED' && user.userRole === 'user' && !selectedTicket.rating && (
                  <div className="pt-6 border-t border-gray-100 flex flex-col items-center">
                    <h4 className="text-sm font-extrabold text-[#111827] mb-4">Rate this Repair</h4>
                    <div className="flex justify-center gap-2 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          onClick={() => setRatingValue(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className={`transition-all ${star <= (hoveredStar || ratingValue) ? 'text-amber-400 scale-110' : 'text-gray-200 hover:text-amber-200'}`}
                        >
                          <Star size={32} fill="currentColor" />
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => submitRating(selectedTicket.id, ratingValue, '')} 
                      disabled={ratingValue === 0}
                      className="px-8 py-3 bg-primary-brand text-white text-xs font-bold uppercase tracking-widest rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors shadow-sm"
                    >
                      Submit Rating
                    </button>
                  </div>
                )}
                
                {selectedTicket.rating && (
                  <div className="pt-6 border-t border-gray-100 flex flex-col items-center">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Rating</h4>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={20} className={star <= selectedTicket.rating ? "text-amber-400" : "text-gray-200"} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                )}

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
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB] shrink-0"><h2 className="text-xl font-extrabold text-[#111827]">Report Issue</h2><button type="button" onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white rounded-full text-gray-400 shadow-sm transition-colors"><X size={20} /></button></div>
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
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

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Calendar size={11}/> เลือกวันและ Slot ที่สะดวก
                  </label>

                  {/* Mini Calendar */}
                  <div className="bg-[#F4F6F8] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <button type="button" onClick={()=>setPickerDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-gray-700"><ChevronLeft size={15}/></button>
                      <span className="text-sm font-bold text-gray-700">{pickerDate.toLocaleString('th-TH',{month:'long',year:'numeric'})}</span>
                      <button type="button" onClick={()=>setPickerDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-gray-700"><ChevronRight size={15}/></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['อา','จ','อ','พ','พฤ','ศ','ส'].map((d,i)=>(
                        <div key={d} className={`text-center text-[9px] font-bold pb-1 ${i===0||i===6?'text-red-400':'text-gray-400'}`}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({length:pickerFirstDay}).map((_,i)=><div key={`e-${i}`}/>)}
                      {Array.from({length:pickerDaysInMonth},(_,i)=>i+1).map(date=>{
                        const now=new Date(); now.setHours(0,0,0,0);
                        const cell=new Date(pickerYear,pickerMonth-1,date);
                        const isPast=cell<now;
                        const fds=`${pickerMonthStr}-${date.toString().padStart(2,'0')}`;
                        const isSel=scheduledDate===fds;
                        const mc=getSlotBookingCount(fds, 'Morning');
                        const ac=getSlotBookingCount(fds, 'Afternoon');
                        const mcCapacity=getEffectiveSlotCapacity(fds, 'Morning');
                        const acCapacity=getEffectiveSlotCapacity(fds, 'Afternoon');
                        const dayAvailability = hasAvailabilityData ? getDateAvailability(technicianAvailability, fds) : null;
                        const unavailableBySchedule = hasAvailabilityData && !dayAvailability?.isDateAvailable;
                        const full=(mcCapacity === 0 || mc >= mcCapacity) && (acCapacity === 0 || ac >= acCapacity);
                        let cls='bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer border border-transparent hover:border-emerald-200';
                        if(isSel) cls='bg-blue-500 text-white shadow-md shadow-blue-200';
                        else if(isPast||full||unavailableBySchedule) cls='text-gray-300 cursor-not-allowed bg-transparent';
                        else if(mc>=2||ac>=2) cls='bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer border border-amber-100';
                        return (
                          <button key={date} type="button" disabled={isPast||full||unavailableBySchedule} onClick={()=>setScheduledDate(fds)}
                            className={`h-9 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${cls}`}
                          >
                            <span>{date}</span>
                            {!isPast&&!isSel&&!unavailableBySchedule&&(
                              <div className="flex gap-px">
                                <span className={`w-1 h-1 rounded-full ${getSlotIndicatorColor(mc, mcCapacity)}`}/>
                                <span className={`w-1 h-1 rounded-full ${getSlotIndicatorColor(ac, acCapacity)}`}/>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-5 mt-3 pt-3 border-t border-gray-200/60 justify-center">
                      {[{c:'bg-emerald-400',l:'ว่าง'},{c:'bg-amber-400',l:'กำลังจอง'},{c:'bg-red-400',l:'เต็ม'},{c:'bg-gray-300',l:'OFF'}].map(({c,l})=>(
                        <div key={l} className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${c}`}/>
                          <span className="text-[9px] text-gray-500 font-medium">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Slot Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    {(['Morning','Afternoon'] as const).map((slot) => {
                      const cnt = scheduledDate ? getSlotBookingCount(scheduledDate, slot) : null;
                      const capacity = scheduledDate ? getEffectiveSlotCapacity(scheduledDate, slot) : null;
                      const avail = cnt !== null && capacity !== null ? Math.max(0, capacity - cnt) : null;
                      const availableTechnicians = scheduledDate && hasAvailabilityData
                        ? getAvailableTechniciansForSlot(technicianAvailability, scheduledDate, slot).length
                        : null;
                      const blockedBySchedule = scheduledDate ? hasAvailabilityData && availableTechnicians === 0 : false;
                      const isFull = avail === 0 && capacity !== null && capacity > 0;
                      const warningThreshold = capacity !== null ? Math.max(1, Math.ceil(capacity / 3)) : 1;
                      const isAct = scheduledSlot === slot;
                      const isDisabled = !scheduledDate || !!isFull || blockedBySchedule;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setScheduledSlot(slot)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${isAct && !isDisabled ? 'border-blue-500 bg-blue-50' : isDisabled ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'}`}
                        >
                          <p className={`text-xs font-bold ${isAct && !isDisabled ? 'text-blue-700' : isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                            {slot === 'Morning' ? '☀️ เช้า 09:00-12:00' : '🌤 บ่าย 13:00-17:00'}
                          </p>
                          {avail !== null && (
                            <p className={`text-[10px] mt-1 font-bold ${blockedBySchedule ? 'text-gray-400' : isFull ? 'text-red-400' : avail <= warningThreshold ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {blockedBySchedule ? 'No technician available' : isFull ? 'เต็มแล้ว' : `ว่างอีก ${avail} จาก ${capacity} slot`}
                            </p>
                          )}
                          {avail === null && <p className="text-[10px] mt-1 text-gray-400">เลือกวันก่อน</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label><textarea rows={4} className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 px-6 text-sm font-medium resize-none" placeholder="Provide more details about the problem..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                {scheduledDate && selectedDateAvailability && !selectedDateAvailability.isDateAvailable && (
                  <p className="text-xs font-medium text-red-500">No technician is available on the selected date.</p>
                )}
                <button type="submit" disabled={!scheduledDate || (selectedDateAvailability ? !selectedDateAvailability.isDateAvailable : false)} className="w-full bg-primary-brand text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:hover:scale-100">Submit Maintenance Request</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
