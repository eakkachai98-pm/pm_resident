import { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Search, QrCode, Play, Check, Package, FileText, ChevronDown, History, X, Home, ClipboardList, Calendar, Settings as SettingsIcon, Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  
  const currentYear = currentCalendarDate.getFullYear();
  const currentMonth = currentCalendarDate.getMonth() + 1;
  const monthName = currentCalendarDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

  const nextMonth = () => {
    setCurrentCalendarDate(new Date(currentYear, currentMonth, 1));
    setSelectedDate(1);
  };
  
  const prevMonth = () => {
    setCurrentCalendarDate(new Date(currentYear, currentMonth - 2, 1));
    setSelectedDate(1);
  };
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [blockedSlots, setBlockedSlots] = useState<{id: string, date: string, type: string, reason: string}[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({ date: '', type: 'Full Day', reason: '' });
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImage, setResolutionImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG with 70% quality to save space
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setResolutionImage(compressedBase64);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const { showToast } = useToast();

  const toggleTaskDescription = (id: string) => {
    setExpandedTasks(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
  };

  const fetchData = async () => {
    try {
      const [allTickets, assetsData, personnelData] = await Promise.all([
        api.getTickets(),
        api.getAssets(),
        api.getPersonnel()
      ]);

      const mappedTickets = allTickets.map((t: any) => {
        const reporter = personnelData.find(p => p.id === t.reporterId);
        return {
          id: t.id,
          title: t.title || t.subject,
          description: t.description,
          status: t.status,
          priority: t.priority || 'Medium',
          assetId: t.assetId,
          assigneeId: t.assigneeId,
          resolution: t.resolution,
          resolvedAt: t.resolvedAt,
          scheduledDate: t.scheduledDate,
          scheduledSlot: t.scheduledSlot,
          room: t.room,
          person: reporter ? `${reporter.name} (${reporter.department})` : 'Unknown User'
        };
      });

      const activeMyTasks = mappedTickets.filter(t => (t.status === 'IN_PROGRESS' || t.status === 'RESOLVED') && t.assigneeId === user.id);
      const openUnassigned = mappedTickets.filter(t => t.status === 'OPEN' && !t.assigneeId).sort((a, b) => {
        const pScore = (p: string) => {
          if (p === 'Urgent') return 3;
          if (p === 'High') return 2;
          if (p === 'Medium') return 1;
          return 0;
        };
        return pScore(b.priority) - pScore(a.priority);
      });
      const myCompleted = mappedTickets.filter(t => t.status === 'RESOLVED' && t.assigneeId === user.id);

      setMyTasks(activeMyTasks);
      setUnassignedPool(openUnassigned);
      setCompletedTasks(myCompleted);

      setStats([
        { label: t('tech.activeTasks' as any), value: activeMyTasks.length.toString(), detail: 'In Progress', icon: Wrench, color: 'text-amber-500' },
        { label: t('tech.unassignedPool' as any), value: openUnassigned.length.toString(), detail: 'Needs Attention', icon: AlertTriangle, color: 'text-red-500' },
        { label: t('tech.myCompleted' as any), value: myCompleted.length.toString(), detail: 'Click to view history', icon: CheckCircle, color: 'text-primary-brand', isClickable: true },
      ]);

      setQueue(assetsData.filter(a => a.status === 'In Maintenance').map(a => {
        const relatedTicket = allTickets.find(t => t.assetId === a.id && t.status !== 'RESOLVED');
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

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Water': return <span className="text-blue-500">💧</span>;
      case 'Electric': return <span className="text-amber-500">⚡</span>;
      case 'AirCon': return <span className="text-cyan-500">❄️</span>;
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

  const handleClaimTask = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/maintenance/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS', assigneeId: user.id })
      });
      if (!res.ok) throw new Error('Failed to claim');
      showToast('Task claimed successfully!', 'success');
      fetchData(); // Reload data
    } catch (err) {
      showToast('Failed to claim task', 'error');
    }
  };

  useEffect(() => { 
    setHeaderAction(undefined);
    fetchData(); 
  }, [refreshKey, user.id]);

  const handleUpdateStatus = async (e: React.MouseEvent, id: string, status: string, claim: boolean = false) => {
    e.stopPropagation();
    if (status === 'RESOLVED') {
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
      await api.updateTicketStatus(resolvingTicketId, 'RESOLVED', resolutionNotes, user.id, resolutionImage || undefined);
      showToast('Ticket resolved successfully', 'success');
      setShowResolveModal(false);
      setResolvingTicketId(null);
      setResolutionNotes('');
      setResolutionImage(null);
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
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{task.status.replace('_', ' ')}</span>
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
            <button onClick={(e) => handleUpdateStatus(e, task.id, 'IN_PROGRESS', true)} className="px-5 py-2.5 bg-primary-brand text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold flex items-center gap-2"><Play size={14} /> {t('tech.claimTask' as any)}</button>
          ) : task.status !== 'RESOLVED' && task.status !== 'CLOSED' ? (
            <button onClick={(e) => handleUpdateStatus(e, task.id, 'RESOLVED')} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold flex items-center gap-2"><Check size={14} /> {t('tech.resolve' as any)}</button>
          ) : null}
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
        <div className="md:col-span-12 space-y-8">
          
          {/* Smart Calendar Section (NEW - Monthly Hybrid) */}
          <section className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden mb-8">
            <div className="px-8 py-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Calendar size={20} /></div>
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Monthly Booking Schedule</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-emerald-200/50 rounded-md transition-colors"><ChevronLeft size={14} className="text-emerald-700" /></button>
                    <p className="text-xs text-gray-500 font-medium min-w-[100px] text-center">{monthName} {currentYear}</p>
                    <button onClick={nextMonth} className="p-1 hover:bg-emerald-200/50 rounded-md transition-colors"><ChevronRight size={14} className="text-emerald-700" /></button>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowScheduleSettings(true)} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-xs font-bold flex items-center gap-2 shadow-sm whitespace-nowrap">
                <SettingsIcon size={14} /> Set Availability
              </button>
            </div>
            
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              {/* Monthly Overview */}
              <div className="flex-1 p-6 md:p-8">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 md:gap-3">
                  {/* Empty slots before first day */}
                  {Array.from({length: firstDayOfMonth}).map((_, i) => <div key={`empty-${i}`} className="h-12 md:h-16"></div>)}
                  
                  {Array.from({length: daysInMonth}, (_, i) => i + 1).map(date => {
                    const dayIndex = (date + firstDayOfMonth - 1) % 7; // 0=Sun, 1=Mon, ..., 6=Sat
                    const dayStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
                    const isOffDay = !workingDays.includes(dayStr);
                    const isSelected = selectedDate === date;
                    
                    const morningBlocks = blockedSlots.filter(b => {
                      const [y, m, d] = b.date.split('-');
                      const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
                      return dateObj.getDate() === date && (b.type === 'Full Day' || b.type === 'Morning');
                    });
                    const afternoonBlocks = blockedSlots.filter(b => {
                      const [y, m, d] = b.date.split('-');
                      const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
                      return dateObj.getDate() === date && (b.type === 'Full Day' || b.type === 'Afternoon');
                    });

                    const isMorningBlocked = isOffDay || morningBlocks.length > 0;
                    const isAfternoonBlocked = isOffDay || afternoonBlocks.length > 0;

                    // Actual Data
                    const fullDateStr = `${currentMonthStr}-${date.toString().padStart(2, '0')}`;
                    
                    const mUnassigned = unassignedPool.filter(t => t.scheduledDate === fullDateStr && t.scheduledSlot === 'Morning');
                    const aUnassigned = unassignedPool.filter(t => t.scheduledDate === fullDateStr && t.scheduledSlot === 'Afternoon');
                    const mMyTasks = myTasks.filter(t => t.scheduledDate === fullDateStr && t.scheduledSlot === 'Morning');
                    const aMyTasks = myTasks.filter(t => t.scheduledDate === fullDateStr && t.scheduledSlot === 'Afternoon');

                    const hasMorningMyTask = mMyTasks.some(t => t.status !== 'RESOLVED') && !isMorningBlocked;
                    const hasAfternoonMyTask = aMyTasks.some(t => t.status !== 'RESOLVED') && !isAfternoonBlocked;
                    const hasMorningCompletedTask = mMyTasks.some(t => t.status === 'RESOLVED') && !isMorningBlocked;
                    const hasAfternoonCompletedTask = aMyTasks.some(t => t.status === 'RESOLVED') && !isAfternoonBlocked;
                    const hasMorningUnassigned = mUnassigned.length > 0 && !isMorningBlocked;
                    const hasAfternoonUnassigned = aUnassigned.length > 0 && !isAfternoonBlocked;

                    return (
                      <button 
                        key={date} 
                        onClick={() => setSelectedDate(date)} 
                        className={`h-12 md:h-16 rounded-xl border flex flex-col items-center justify-center relative transition-all 
                          ${isSelected ? 'bg-[#111827] text-white border-[#111827] shadow-md shadow-gray-900/20 hover:scale-[1.02]' 
                            : (isMorningBlocked && isAfternoonBlocked) ? 'bg-gray-50 border-transparent text-gray-400 border-dashed' 
                            : 'bg-white border-gray-100 text-gray-700 hover:border-primary-brand/30 hover:bg-blue-50/30'}`}
                      >
                        <span className={`text-sm md:text-base font-bold ${isSelected ? 'text-white' : ''}`}>{date}</span>
                        <div className="flex gap-1 mt-1">
                          {hasMorningCompletedTask && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} title="Morning Completed"></span>}
                          {hasMorningMyTask && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} title="My Morning Task"></span>}
                          {hasMorningUnassigned && !hasMorningMyTask && !hasMorningCompletedTask && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} title="Unassigned Morning"></span>}
                          
                          {hasAfternoonCompletedTask && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} title="Afternoon Completed"></span>}
                          {hasAfternoonMyTask && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} title="My Afternoon Task"></span>}
                          {hasAfternoonUnassigned && !hasAfternoonMyTask && !hasAfternoonCompletedTask && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} title="Unassigned Afternoon"></span>}
                          
                          {(isMorningBlocked && isAfternoonBlocked) && !hasMorningMyTask && !hasAfternoonMyTask && !hasMorningCompletedTask && !hasAfternoonCompletedTask && !hasMorningUnassigned && !hasAfternoonUnassigned && <span className={`text-[8px] font-bold uppercase mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>OFF</span>}
                          {((isMorningBlocked && !isAfternoonBlocked) || (!isMorningBlocked && isAfternoonBlocked)) && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-red-400'}`} title="Partially Blocked"></span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Detail Pane */}
              <div className="w-full lg:w-[350px] bg-gray-50/50 p-6 md:p-8 flex flex-col">
                 <h3 className="text-sm font-extrabold text-[#111827] mb-6 flex items-center gap-2"><Calendar size={16}/> Details for {monthName} {selectedDate}</h3>
                 
                 <div className="space-y-4 flex-1">
                    {/* Morning Slot Detail */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 min-h-[140px]">
                      <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Clock size={12} /> 09:00 - 12:00</span>
                      {(() => {
                        const dayIndex = (selectedDate + firstDayOfMonth - 1) % 7;
                        const dayStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
                        const isOffDay = !workingDays.includes(dayStr);
                        const mBlocks = blockedSlots.filter(b => {
                          const [y, m, d] = b.date.split('-');
                          const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
                          return dateObj.getDate() === selectedDate && (b.type === 'Full Day' || b.type === 'Morning');
                        });
                        const blocked = isOffDay || mBlocks.length > 0;

                        const fullDateStr = `${currentMonthStr}-${selectedDate.toString().padStart(2, '0')}`;
                        const mMyTasks = myTasks.filter(t => t.scheduledDate === fullDateStr && t.scheduledSlot === 'Morning');
                        const mUnassigned = unassignedPool.filter(t => t.scheduledDate === fullDateStr && t.scheduledSlot === 'Morning');

                        if (blocked) {
                          return (
                            <div className="flex-1 flex flex-col items-center justify-center p-3 bg-red-50/50 rounded-xl border border-red-100 border-dashed">
                               <span className="text-xs font-bold text-red-400 uppercase">Blocked</span>
                               {mBlocks[0]?.reason && <span className="text-[10px] font-medium text-red-300 mt-1 text-center">{mBlocks[0].reason}</span>}
                             </div>
                          );
                        }

                        if (mMyTasks.length > 0) {
                          return (
                            <div className="flex flex-col gap-2">
                              {mMyTasks.map(t => (
                                <div key={t.id} onClick={() => setSelectedTaskDetail(t)} className={`p-3 border rounded-xl cursor-pointer hover:ring-2 transition-all ${t.status === 'RESOLVED' ? 'bg-green-50 border-green-100 hover:ring-green-200' : 'bg-blue-50 border-blue-100 hover:ring-blue-200'}`}>
                                  <div className="flex justify-between items-start mb-1">
                                    <p className={`text-xs font-bold flex items-center gap-1 ${t.status === 'RESOLVED' ? 'text-green-800' : 'text-blue-800'}`}><Home size={12}/> {t.room?.roomNumber ? `Room ${t.room.roomNumber}` : 'Room'}</p>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${t.status === 'RESOLVED' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>{t.status === 'RESOLVED' ? 'Done' : 'My Task'}</span>
                                  </div>
                                  <p className={`text-[10px] font-medium line-clamp-2 mt-1 ${t.status === 'RESOLVED' ? 'text-green-600' : 'text-blue-600'}`}>{t.title}</p>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        if (mUnassigned.length > 0) {
                          return (
                            <div className="flex flex-col gap-2">
                              {mUnassigned.map(t => (
                                <div key={t.id} onClick={() => setSelectedTaskDetail(t)} className="p-3 bg-amber-50 border border-amber-100 rounded-xl cursor-pointer hover:ring-2 hover:ring-amber-200 transition-all relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400"></div>
                                  <div className="flex justify-between items-start mb-1">
                                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1"><Home size={12}/> {t.room?.roomNumber ? `Room ${t.room.roomNumber}` : 'Room'}</p>
                                  </div>
                                  <p className="text-[10px] font-medium text-amber-600 line-clamp-2 mt-1">{t.title}</p>
                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded text-[9px] font-extrabold uppercase shadow-sm">Pool</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleClaimTask(t.id); }} className="px-2 py-1 bg-white text-amber-700 text-[9px] font-bold rounded shadow-sm border border-amber-200 hover:bg-amber-100">Claim</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        return <div className="flex-1 flex items-center justify-center"><span className="text-xs font-bold text-gray-300">Available</span></div>;
                      })()}
                    </div>

                    {/* Afternoon Slot Detail */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 min-h-[140px] max-h-[250px] overflow-y-auto custom-scrollbar">
                      <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Clock size={12} /> 13:00 - 17:00</span>
                      {(() => {
                        const dayIndex = (selectedDate + firstDayOfMonth - 1) % 7;
                        const dayStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
                        const isOffDay = !workingDays.includes(dayStr);
                        const aBlocks = blockedSlots.filter(b => {
                          const [y, m, d] = b.date.split('-');
                          const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
                          return dateObj.getDate() === selectedDate && (b.type === 'Full Day' || b.type === 'Afternoon');
                        });
                        const blocked = isOffDay || aBlocks.length > 0;

                        const fullDateStr = `${currentMonthStr}-${selectedDate.toString().padStart(2, '0')}`;
                        const aMyTasks = myTasks.filter(t => t.scheduledDate === fullDateStr && t.scheduledSlot === 'Afternoon');
                        const aUnassigned = unassignedPool.filter(t => t.scheduledDate === fullDateStr && t.scheduledSlot === 'Afternoon');

                        if (blocked) {
                          return (
                            <div className="flex-1 flex flex-col items-center justify-center p-3 bg-red-50/50 rounded-xl border border-red-100 border-dashed">
                               <span className="text-xs font-bold text-red-400 uppercase">Blocked</span>
                               {aBlocks[0]?.reason && <span className="text-[10px] font-medium text-red-300 mt-1 text-center">{aBlocks[0].reason}</span>}
                             </div>
                          );
                        }

                        if (aMyTasks.length > 0) {
                          return (
                            <div className="flex flex-col gap-2">
                              {aMyTasks.map(t => (
                                <div key={t.id} onClick={() => setSelectedTaskDetail(t)} className={`p-3 border rounded-xl cursor-pointer hover:ring-2 transition-all ${t.status === 'RESOLVED' ? 'bg-green-50 border-green-100 hover:ring-green-200' : 'bg-blue-50 border-blue-100 hover:ring-blue-200'}`}>
                                  <div className="flex justify-between items-start mb-1">
                                    <p className={`text-xs font-bold flex items-center gap-1 ${t.status === 'RESOLVED' ? 'text-green-800' : 'text-blue-800'}`}><Home size={12}/> {t.room?.roomNumber ? `Room ${t.room.roomNumber}` : 'Room'}</p>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${t.status === 'RESOLVED' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>{t.status === 'RESOLVED' ? 'Done' : 'My Task'}</span>
                                  </div>
                                  <p className={`text-[10px] font-medium line-clamp-2 mt-1 ${t.status === 'RESOLVED' ? 'text-green-600' : 'text-blue-600'}`}>{t.title}</p>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        if (aUnassigned.length > 0) {
                          return (
                            <div className="flex flex-col gap-2">
                              {aUnassigned.map(t => (
                                <div key={t.id} onClick={() => setSelectedTaskDetail(t)} className="p-3 bg-amber-50 border border-amber-100 rounded-xl cursor-pointer hover:ring-2 hover:ring-amber-200 transition-all relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400"></div>
                                  <div className="flex justify-between items-start mb-1">
                                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1"><Home size={12}/> {t.room?.roomNumber ? `Room ${t.room.roomNumber}` : 'Room'}</p>
                                  </div>
                                  <p className="text-[10px] font-medium text-amber-600 line-clamp-2 mt-1">{t.title}</p>
                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded text-[9px] font-extrabold uppercase shadow-sm">Pool</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleClaimTask(t.id); }} className="px-2 py-1 bg-white text-amber-700 text-[9px] font-bold rounded shadow-sm border border-amber-200 hover:bg-amber-100">Claim</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        return <div className="flex-1 flex items-center justify-center"><span className="text-xs font-bold text-gray-300">Available</span></div>;
                      })()}
                    </div>
                 </div>
              </div>
            </div>
          </section>

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

        <section className="md:col-span-12 bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center"><h2 className="text-lg font-bold text-[#111827]">{t('tech.maintenancePool' as any)}</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB] text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-50"><th className="px-8 py-4">Room No.</th><th className="px-8 py-4">{t('tech.subject' as any)}</th><th className="px-8 py-4">{t('tech.description' as any)}</th><th className="px-8 py-4 text-right">{t('tech.status' as any)}</th></tr>
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
        {showScheduleSettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowScheduleSettings(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-[#111827]">Set Availability</h3>
                <button onClick={() => setShowScheduleSettings(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-[#111827] mb-3">Working Days</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const isActive = workingDays.includes(day);
                      return (
                      <button 
                        key={day} 
                        onClick={() => setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isActive ? 'bg-primary-brand text-white border-primary-brand shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {day}
                      </button>
                    )})}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#111827] mb-3">Time Slots per Day</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                      <span className="text-xs font-bold text-gray-600 flex items-center gap-2"><Clock size={14}/> Morning (09:00 - 12:00)</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max capacity:</span>
                        <input type="number" defaultValue={3} className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-center" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                      <span className="text-xs font-bold text-gray-600 flex items-center gap-2"><Clock size={14}/> Afternoon (13:00 - 17:00)</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max capacity:</span>
                        <input type="number" defaultValue={4} className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-center" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#111827] mb-3">Block Time (Time-off)</h4>
                  
                  {blockedSlots.length > 0 && (
                    <div className="mb-3 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {blockedSlots.map(block => (
                        <div key={block.id} className="flex items-center justify-between p-2.5 bg-red-50 border border-red-100 rounded-xl">
                          <div>
                            <p className="text-xs font-bold text-red-800">{block.date} <span className="text-[10px] bg-red-200 px-1.5 py-0.5 rounded ml-1">{block.type}</span></p>
                            <p className="text-[10px] text-red-600 font-medium mt-0.5">{block.reason || 'No reason provided'}</p>
                          </div>
                          <button onClick={() => setBlockedSlots(prev => prev.filter(b => b.id !== block.id))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isAddingBlock ? (
                    <button onClick={() => setIsAddingBlock(true)} className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-50 hover:text-gray-600 transition-all flex items-center justify-center gap-2">
                      <span className="text-lg">+</span> Add Leave / Block Slot
                    </button>
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                          <input type="date" value={newBlock.date} onChange={e => setNewBlock({...newBlock, date: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary-brand/20 transition-all" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Duration</label>
                          <select value={newBlock.type} onChange={e => setNewBlock({...newBlock, type: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary-brand/20 transition-all">
                            <option>Full Day</option>
                            <option>Morning</option>
                            <option>Afternoon</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Reason (Optional)</label>
                        <input type="text" placeholder="e.g. Sick Leave, Buying parts" value={newBlock.reason} onChange={e => setNewBlock({...newBlock, reason: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary-brand/20 transition-all" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => { setIsAddingBlock(false); setNewBlock({ date: '', type: 'Full Day', reason: '' }); }} className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                        <button onClick={() => { 
                          if(newBlock.date) {
                            setBlockedSlots([...blockedSlots, { ...newBlock, id: Date.now().toString() }]);
                            setIsAddingBlock(false);
                            setNewBlock({ date: '', type: 'Full Day', reason: '' });
                          }
                        }} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 shadow-md shadow-red-500/20 transition-all disabled:opacity-50" disabled={!newBlock.date}>Block Slot</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 mt-2">
                  <button onClick={() => { setShowScheduleSettings(false); showToast('Availability schedule updated', 'success'); }} className="w-full py-4 rounded-2xl bg-[#111827] text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-95 transition-all">
                    Save Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

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
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Attach Image (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer px-4 py-3 bg-[#F4F6F8] rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 transition-colors border border-dashed border-gray-300 w-full text-center">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      {resolutionImage ? 'Image Attached' : 'Click to Upload Image'}
                    </label>
                    {resolutionImage && <img src={resolutionImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />}
                  </div>
                </div>
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

        {selectedTaskDetail && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTaskDetail(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB] shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{selectedTaskDetail.id.substring(0,8)}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#111827]">{selectedTaskDetail.title}</h2>
                </div>
                <button type="button" onClick={() => setSelectedTaskDetail(null)} className="p-2 hover:bg-white rounded-full text-gray-400 shadow-sm transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedTaskDetail.status)}`} />
                      <span className="text-sm font-bold text-[#111827]">{selectedTaskDetail.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</span>
                    <div className="text-sm font-bold text-[#111827] flex items-center gap-1">{getCategoryIcon(selectedTaskDetail.category)} {selectedTaskDetail.category}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room</span>
                    <div className="text-sm font-bold text-primary-brand">Room {selectedTaskDetail.room?.roomNumber}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reporter</span>
                    <div className="text-sm font-bold text-[#111827]">{selectedTaskDetail.reporter?.name}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</span>
                  <div className="bg-[#F4F6F8] rounded-2xl p-6 text-sm text-[#111827] font-medium leading-relaxed whitespace-pre-wrap">
                    {selectedTaskDetail.description || 'No description provided.'}
                  </div>
                </div>

                {(selectedTaskDetail.status === 'RESOLVED' || selectedTaskDetail.status === 'CLOSED') && (selectedTaskDetail.repairImage || selectedTaskDetail.repairNotes) && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resolution Details</h4>
                    {selectedTaskDetail.repairImage && (
                      <img src={selectedTaskDetail.repairImage} alt="Repair Evidence" className="w-full max-h-[300px] object-cover rounded-xl border border-gray-200" />
                    )}
                    {selectedTaskDetail.repairNotes && (
                      <div className="bg-emerald-50 rounded-2xl p-4 text-sm text-emerald-800 font-medium whitespace-pre-wrap border border-emerald-100">
                        {selectedTaskDetail.repairNotes}
                      </div>
                    )}
                  </div>
                )}

                {(selectedTaskDetail.status === 'RESOLVED' || selectedTaskDetail.status === 'CLOSED') && selectedTaskDetail.rating && (
                  <div className="pt-6 border-t border-gray-100 flex flex-col items-center">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Resident Rating</h4>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={star <= selectedTaskDetail.rating ? "text-amber-400" : "text-gray-200"}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTaskDetail.status !== 'RESOLVED' && (
                  <div className="pt-6 border-t border-gray-100 flex gap-4">
                    {selectedTaskDetail.status === 'OPEN' && (
                      <button onClick={() => { setSelectedTaskDetail(null); handleClaimTask(selectedTaskDetail.id); }} className="flex-1 bg-amber-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-amber-600 transition-colors">Start Repair</button>
                    )}
                    {(selectedTaskDetail.status === 'OPEN' || selectedTaskDetail.status === 'IN_PROGRESS') && (
                      <button onClick={(e) => { setSelectedTaskDetail(null); handleUpdateStatus(e as any, selectedTaskDetail.id, 'RESOLVED'); }} className="flex-1 bg-emerald-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-600 transition-colors">Mark as Resolved</button>
                    )}
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
