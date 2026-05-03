import { useState, useEffect, useRef } from 'react';
import { Wrench, AlertTriangle, CheckCircle, CheckCircle2, Search, QrCode, Play, Check, Package, FileText, ChevronDown, History, X, Home, ClipboardList, Calendar, Settings as SettingsIcon, Clock, Trash2, ChevronLeft, ChevronRight, Sun, Moon, Camera, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Asset, Ticket, Personnel, TechnicianAvailability, TechnicianBlockedSlot } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_WORKING_DAYS, getDayCodeFromDateString } from '../utils/technicianAvailability';

const WEEKDAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WORKDAY_SORT_INDEX = WEEKDAY_OPTIONS.reduce<Record<string, number>>((acc, day, index) => {
  acc[day] = index;
  return acc;
}, {});

export default function TechnicianDashboard({ onSelectAsset, setHeaderAction, user, refreshKey }: { onSelectAsset: (id: string) => void, setHeaderAction: (a: any) => void, user: Personnel, refreshKey?: number }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [unassignedPool, setUnassignedPool] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [allHistoricalTickets, setAllHistoricalTickets] = useState<any[]>([]);
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
  const [workingDays, setWorkingDays] = useState<string[]>([...DEFAULT_WORKING_DAYS]);
  const [blockedSlots, setBlockedSlots] = useState<TechnicianBlockedSlot[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({ date: '', type: 'Full Day', reason: '' });
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [blockSaving, setBlockSaving] = useState(false);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImage, setResolutionImage] = useState<string | null>(null);
  const [residentSignature, setResidentSignature] = useState<string | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingSig = useRef(false);
  const [calDark, setCalDark] = useState(true);
  const [showRoomHistory, setShowRoomHistory] = useState(false);

  const startDrawingSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingSig.current = true;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawingSig = () => {
    if (isDrawingSig.current) {
      isDrawingSig.current = false;
      const canvas = sigCanvasRef.current;
      if (canvas) {
        setResidentSignature(canvas.toDataURL('image/png'));
      }
    }
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setResidentSignature(null);
  };

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

  const applyAvailabilityToState = (availabilityList: TechnicianAvailability[]) => {
    const myAvailability = availabilityList.find((availability) => availability.staffId === user.id);
    setWorkingDays(myAvailability ? [...myAvailability.workingDays] : [...DEFAULT_WORKING_DAYS]);
    setBlockedSlots(myAvailability?.blockedSlots ?? []);
  };

  const fetchData = async () => {
    try {
      const [allTickets, assetsData, personnelData, availabilityList] = await Promise.all([
        api.getTickets(),
        api.getAssets(),
        api.getPersonnel(),
        api.getTechnicianAvailability()
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
          resolution: t.repairNotes,
          resolvedAt: t.resolvedAt,
          repairImage: t.repairImage,
          residentSignature: t.residentSignature,
          rating: t.rating,
          feedback: t.feedback,
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
      setAllHistoricalTickets(mappedTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED'));
      applyAvailabilityToState(availabilityList);

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

  const toggleWorkingDay = (day: string) => {
    setWorkingDays((prev) => {
      const next = prev.includes(day)
        ? prev.filter((currentDay) => currentDay !== day)
        : [...prev, day];

      return next.sort((a, b) => WORKDAY_SORT_INDEX[a] - WORKDAY_SORT_INDEX[b]);
    });
  };

  const saveSchedule = async () => {
    try {
      setScheduleSaving(true);
      await api.saveTechnicianAvailability(user.id, workingDays);
      showToast('Availability schedule updated', 'success');
      setShowScheduleSettings(false);
      await fetchData();
    } catch (error) {
      showToast('Failed to save availability schedule', 'error');
    } finally {
      setScheduleSaving(false);
    }
  };

  const addBlockedSlot = async () => {
    if (!newBlock.date) {
      return;
    }

    try {
      setBlockSaving(true);
      await api.createTechnicianBlockedSlot({
        staffId: user.id,
        date: newBlock.date,
        type: newBlock.type as 'Full Day' | 'Morning' | 'Afternoon',
        reason: newBlock.reason
      });
      setIsAddingBlock(false);
      setNewBlock({ date: '', type: 'Full Day', reason: '' });
      showToast('Blocked slot added', 'success');
      await fetchData();
    } catch (error: any) {
      showToast(error?.message || 'Failed to add blocked slot', 'error');
    } finally {
      setBlockSaving(false);
    }
  };

  const removeBlockedSlot = async (blockedSlotId: string) => {
    try {
      setBlockSaving(true);
      await api.deleteTechnicianBlockedSlot(blockedSlotId);
      showToast('Blocked slot removed', 'success');
      await fetchData();
    } catch (error) {
      showToast('Failed to remove blocked slot', 'error');
    } finally {
      setBlockSaving(false);
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
      await api.updateTicketStatus(resolvingTicketId, 'RESOLVED', resolutionNotes, user.id, resolutionImage || undefined, residentSignature || undefined);
      showToast('Ticket resolved successfully', 'success');
      setShowResolveModal(false);
      setResolvingTicketId(null);
      setResolutionNotes('');
      setResolutionImage(null);
      setResidentSignature(null);
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

  // --- Start Room History Calculation ---
  const selectedTaskRoomId = selectedTaskDetail?.room?.id;
  const selectedTaskCategory = selectedTaskDetail?.category;
  
  const roomHistory = selectedTaskRoomId 
    ? allHistoricalTickets.filter(t => t.room?.id === selectedTaskRoomId && t.id !== selectedTaskDetail.id).sort((a,b) => new Date(b.resolvedAt || b.updatedAt).getTime() - new Date(a.resolvedAt || a.updatedAt).getTime()) 
    : [];
  
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const recentSameCategoryWarning = roomHistory.find(t => 
    t.category === selectedTaskCategory && 
    (new Date().getTime() - new Date(t.resolvedAt || t.updatedAt).getTime() < THIRTY_DAYS)
  );
  // --- End Room History Calculation ---

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
          {/* ── Premium Calendar ── */}
          <section className={`rounded-[2rem] overflow-hidden shadow-xl border mb-2 transition-all duration-500 ${calDark?'border-white/10':'border-gray-200/60 shadow-gray-200/60'}`} style={{background:calDark?'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f2027 100%)':'#ffffff'}}>
            {/* Header */}
            <div className="px-8 py-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl" style={{background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.25)'}}>
                  <Calendar size={22} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight transition-colors" style={{color:calDark?'#ffffff':'#111827'}}>Monthly Schedule</h2>
                  <p className="text-xs font-medium mt-0.5 transition-colors" style={{color:calDark?'#94a3b8':'#6b7280'}}>ตารางงานประจำเดือน</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={()=>setCalDark(d=>!d)} title={calDark?'Switch to Light':'Switch to Dark'} className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105" style={{background:calDark?'rgba(255,255,255,0.08)':'#f3f4f6',border:calDark?'1px solid rgba(255,255,255,0.15)':'1px solid #e5e7eb'}}>
                  {calDark ? <Sun size={15} color="#fcd34d"/> : <Moon size={15} color="#6366f1"/>}
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300" style={{background:calDark?'rgba(255,255,255,0.07)':'#f3f4f6',border:calDark?'1px solid rgba(255,255,255,0.1)':'1px solid #e5e7eb'}}>
                  <button onClick={prevMonth} className="p-1.5 rounded-lg transition-colors" style={{color:calDark?'#94a3b8':'#6b7280'}}><ChevronLeft size={16}/></button>
                  <span className="text-sm font-bold min-w-[110px] text-center transition-colors" style={{color:calDark?'#ffffff':'#111827'}}>{monthName} {currentYear}</span>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg transition-colors" style={{color:calDark?'#94a3b8':'#6b7280'}}><ChevronRight size={16}/></button>
                </div>
                <button onClick={() => setShowScheduleSettings(true)} className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02]" style={{background:calDark?'rgba(255,255,255,0.08)':'#f9fafb',border:calDark?'1px solid rgba(255,255,255,0.12)':'1px solid #e5e7eb',color:calDark?'#cbd5e1':'#374151'}}>
                  <SettingsIcon size={14}/> Availability
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="px-8 pb-4 flex flex-wrap gap-4">
            <div className="px-8 pb-4 flex flex-wrap gap-5">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5"><span className="w-4 h-1.5 rounded-sm bg-emerald-500"/><span className="w-4 h-1.5 rounded-sm bg-emerald-500"/></div>
                <span className="text-[10px] font-medium transition-colors" style={{color:calDark?'#94a3b8':'#6b7280'}}>ว่าง (AM/PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5"><span className="w-4 h-1.5 rounded-sm bg-blue-500"/><span className="w-4 h-1.5 rounded-sm bg-emerald-500"/></div>
                <span className="text-[10px] font-medium transition-colors" style={{color:calDark?'#94a3b8':'#6b7280'}}>งานของฉัน</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
                <span className="text-[10px] font-medium transition-colors" style={{color:calDark?'#94a3b8':'#6b7280'}}>Pool รออยู่</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5"><span className="w-4 h-1.5 rounded-sm" style={{background:'#4b5563'}}/><span className="w-4 h-1.5 rounded-sm" style={{background:'#4b5563'}}/></div>
                <span className="text-[10px] font-medium transition-colors" style={{color:calDark?'#94a3b8':'#6b7280'}}>วันหยุด/ล็อค</span>
              </div>
            </div>
            </div>

            {/* Body */}
            <div className="flex flex-col lg:flex-row transition-all duration-300" style={{borderTop:calDark?'1px solid rgba(255,255,255,0.06)':'1px solid #f3f4f6'}}>
              {/* Grid */}
              <div className="flex-1 p-6">
                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {['อา','จ','อ','พ','พฤ','ศ','ส'].map((d,i)=>(
                    <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider pb-1 transition-colors" style={{color:i===0||i===6?(calDark?'#f87171':'#dc2626'):(calDark?'#64748b':'#9ca3af')}}>{d}</div>
                  ))}
                </div>
                        <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({length: firstDayOfMonth}).map((_,i)=><div key={`e-${i}`}/>)}
                   {Array.from({length: daysInMonth},(_,i)=>i+1).map(date=>{
                    const today = new Date();
                    const isToday = date===today.getDate()&&currentMonth===today.getMonth()+1&&currentYear===today.getFullYear();
                    const dayIndex=(date+firstDayOfMonth-1)%7;
                    const isSelected=selectedDate===date;
                    const fullDateStr=`${currentMonthStr}-${date.toString().padStart(2,'0')}`;
                    const dayStr = getDayCodeFromDateString(fullDateStr);
                    const isOff=!workingDays.includes(dayStr);
                    const mBlocked=blockedSlots.some((blockedSlot)=>blockedSlot.date===fullDateStr&&(blockedSlot.type==='Full Day'||blockedSlot.type==='Morning'));
                    const aBlocked=blockedSlots.some((blockedSlot)=>blockedSlot.date===fullDateStr&&(blockedSlot.type==='Full Day'||blockedSlot.type==='Afternoon'));
                    const isMorningBlocked=isOff||mBlocked;
                    const isAfternoonBlocked=isOff||aBlocked;
                    const allBlocked=isMorningBlocked&&isAfternoonBlocked;
                    // Per-slot task counts
                    const mTaskCount=myTasks.filter(t=>t.scheduledDate===fullDateStr&&t.scheduledSlot==='Morning'&&t.status!=='RESOLVED').length;
                    const aTaskCount=myTasks.filter(t=>t.scheduledDate===fullDateStr&&t.scheduledSlot==='Afternoon'&&t.status!=='RESOLVED').length;
                    const mPoolCount=unassignedPool.filter(t=>t.scheduledDate===fullDateStr&&t.scheduledSlot==='Morning').length;
                    const aPoolCount=unassignedPool.filter(t=>t.scheduledDate===fullDateStr&&t.scheduledSlot==='Afternoon').length;
                    const hasPool=(mPoolCount+aPoolCount)>0;
                    const isWeekend=dayIndex===0||dayIndex===6;
                    const isFullyAvailable=!allBlocked&&mTaskCount===0&&aTaskCount===0;
                    // Slot bar colors: green=free, blue=my task, amber=pool, gray=blocked
                    const mBar=isMorningBlocked?'#374151':mTaskCount>0?'#3b82f6':mPoolCount>0?'#f59e0b':'#10b981';
                    const aBar=isAfternoonBlocked?'#374151':aTaskCount>0?'#3b82f6':aPoolCount>0?'#f59e0b':'#10b981';
                    let bg=calDark?'rgba(255,255,255,0.04)':'#f9fafb', border=calDark?'rgba(255,255,255,0.07)':'#e5e7eb', textColor=isWeekend?(calDark?'#f87171':'#dc2626'):(calDark?'#94a3b8':'#374151');
                    if(isSelected){bg='#3b82f6';border='#60a5fa';textColor='#fff';}
                    else if(allBlocked){bg=calDark?'rgba(255,255,255,0.02)':'#f3f4f6';border=calDark?'rgba(255,255,255,0.04)':'#e9ecef';textColor=calDark?'#334155':'#d1d5db';}
                    else if(isToday){bg='rgba(99,102,241,0.2)';border='#6366f1';textColor='#a5b4fc';}
                    else if(isFullyAvailable){bg=calDark?'rgba(16,185,129,0.07)':'rgba(16,185,129,0.05)';border=calDark?'rgba(16,185,129,0.22)':'rgba(16,185,129,0.3)';}
                    return (
                      <motion.button key={date} onClick={()=>setSelectedDate(date)}
                        whileHover={{scale:allBlocked?1:1.05}} whileTap={{scale:0.97}}
                        className="relative h-12 md:h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-150"
                        style={{background:bg,border:`1px solid ${border}`}}
                      >
                        {isToday&&!isSelected&&<span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400"/>}
                        {hasPool&&!isSelected&&<span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-400"/>}
                        <span className="text-sm font-bold" style={{color:textColor}}>{date}</span>
                        {!allBlocked ? (
                          <div className="flex gap-0.5 mt-1">
                            <span className="w-3.5 h-1 rounded-sm transition-colors" style={{background:isSelected?'rgba(255,255,255,0.5)':mBar}} title="Morning"/>
                            <span className="w-3.5 h-1 rounded-sm transition-colors" style={{background:isSelected?'rgba(255,255,255,0.5)':aBar}} title="Afternoon"/>
                          </div>
                        ) : (
                          <span className="text-[7px] font-bold mt-0.5" style={{color:isSelected?'#fff':calDark?'#334155':'#d1d5db'}}>OFF</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Detail */}
              <div className="w-full lg:w-[340px] flex flex-col transition-all duration-300" style={{borderLeft:calDark?'1px solid rgba(255,255,255,0.06)':'1px solid #f3f4f6'}}>
                <div className="px-6 py-4 flex items-center gap-3" style={{borderBottom:calDark?'1px solid rgba(255,255,255,0.06)':'1px solid #f3f4f6',background:calDark?'transparent':'#fafafa'}}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold transition-colors" style={{background:calDark?'rgba(52,211,153,0.12)':'rgba(16,185,129,0.1)',color:calDark?'#34d399':'#059669'}}>{selectedDate}</div>
                  <div>
                    <p className="text-sm font-bold transition-colors" style={{color:calDark?'#ffffff':'#111827'}}>{monthName} {selectedDate}</p>
                    <p className="text-[10px] font-medium transition-colors" style={{color:calDark?'#475569':'#9ca3af'}}>รายละเอียดงานวันนี้</p>
                  </div>
                </div>

                <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar" style={{maxHeight:'380px'}}>
                  {(['Morning','Afternoon'] as const).map(slot=>{
                    const label = slot==='Morning'?'☀️ เช้า  09:00–12:00':'🌤 บ่าย  13:00–17:00';
                    const fullDateStr=`${currentMonthStr}-${selectedDate.toString().padStart(2,'0')}`;
                    const dayStr = getDayCodeFromDateString(fullDateStr);
                    const isOff=!workingDays.includes(dayStr);
                    const blocks=blockedSlots.filter((blockedSlot)=>blockedSlot.date===fullDateStr&&(blockedSlot.type==='Full Day'||blockedSlot.type===slot));
                    const blocked=isOff||blocks.length>0;
                    const slotMyTasks=myTasks.filter(t=>t.scheduledDate===fullDateStr&&t.scheduledSlot===slot);
                    const slotPool=unassignedPool.filter(t=>t.scheduledDate===fullDateStr&&t.scheduledSlot===slot);

                    return (
                      <div key={slot} className="rounded-2xl overflow-hidden transition-all duration-300" style={{border:calDark?'1px solid rgba(255,255,255,0.08)':'1px solid #e5e7eb'}}>
                        <div className="px-4 py-2.5 flex items-center justify-between" style={{background:calDark?'rgba(255,255,255,0.05)':'#f9fafb'}}>
                          <span className="text-[11px] font-bold transition-colors" style={{color:calDark?'#cbd5e1':'#374151'}}>{label}</span>
                          {blocked
                            ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{background:'rgba(248,113,113,0.15)',color:'#f87171',border:'1px solid rgba(248,113,113,0.2)'}}>Blocked</span>
                            : slotMyTasks.length>0
                              ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{background:'rgba(59,130,246,0.15)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.2)'}}>{slotMyTasks.length} งาน</span>
                              : slotPool.length>0
                                ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{background:'rgba(245,158,11,0.15)',color:'#fcd34d',border:'1px solid rgba(245,158,11,0.2)'}}>{slotPool.length} pool</span>
                                : <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{background:'rgba(16,185,129,0.12)',color:'#6ee7b7',border:'1px solid rgba(16,185,129,0.15)'}}>ว่าง</span>
                          }
                        </div>
                        <div className="p-3 space-y-2 min-h-[70px]">
                          {blocked ? (
                            <div className="flex items-center justify-center h-10">
                              <span className="text-[11px] transition-colors" style={{color:calDark?'#475569':'#9ca3af'}}>{blocks[0]?.reason||'วันหยุด / ล็อคไว้'}</span>
                            </div>
                          ) : slotMyTasks.length>0 ? slotMyTasks.map(t=>(
                            <div key={t.id} onClick={()=>setSelectedTaskDetail(t)}
                              className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                              style={{background:t.status==='RESOLVED'?'rgba(16,185,129,0.1)':'rgba(59,130,246,0.1)',border:t.status==='RESOLVED'?'1px solid rgba(16,185,129,0.2)':'1px solid rgba(59,130,246,0.2)'}}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold flex items-center gap-1" style={{color:t.status==='RESOLVED'?'#6ee7b7':'#93c5fd'}}><Home size={10}/> ห้อง {t.room?.roomNumber||'–'}</span>
                                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded" style={{background:t.status==='RESOLVED'?'rgba(16,185,129,0.2)':'rgba(59,130,246,0.2)',color:t.status==='RESOLVED'?'#34d399':'#60a5fa'}}>{t.status==='RESOLVED'?'Done':'Active'}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{t.title}</p>
                            </div>
                          )) : slotPool.length>0 ? slotPool.map(t=>(
                            <div key={t.id} onClick={()=>setSelectedTaskDetail(t)}
                              className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] relative overflow-hidden"
                              style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.18)'}}
                            >
                              <div className="absolute left-0 top-0 w-1 h-full" style={{background:'#f59e0b'}}/>
                              <div className="pl-2 flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1"><Home size={10}/> ห้อง {t.room?.roomNumber||'–'}</span>
                                <button onClick={e=>{e.stopPropagation();handleClaimTask(t.id);}} className="text-[8px] font-bold px-2 py-1 rounded-lg transition-colors hover:bg-amber-400/20" style={{color:'#fcd34d',border:'1px solid rgba(245,158,11,0.3)'}}>Claim</button>
                              </div>
                              <p className="pl-2 text-[10px] text-slate-400 line-clamp-1">{t.title}</p>
                            </div>
                          )) : (
                            <div className="flex items-center justify-center h-10">
                              <span className="text-[11px] transition-colors" style={{color:calDark?'#475569':'#9ca3af'}}>ว่าง — ไม่มีงาน</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                    {WEEKDAY_OPTIONS.map((day) => {
                      const isActive = workingDays.includes(day);
                      return (
                      <button 
                        key={day} 
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
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
                          <button type="button" disabled={blockSaving} onClick={() => removeBlockedSlot(block.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={14} /></button>
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
                        <button type="button" onClick={() => { setIsAddingBlock(false); setNewBlock({ date: '', type: 'Full Day', reason: '' }); }} className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                        <button type="button" onClick={addBlockedSlot} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 shadow-md shadow-red-500/20 transition-all disabled:opacity-50" disabled={!newBlock.date || blockSaving}>{blockSaving ? 'Saving...' : 'Block Slot'}</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 mt-2">
                  <button type="button" disabled={scheduleSaving} onClick={saveSchedule} className="w-full py-4 rounded-2xl bg-[#111827] text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:hover:scale-100">
                    {scheduleSaving ? 'Saving...' : 'Save Schedule'}
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Resident Signature (Optional)</label>
                    <button onClick={clearSignature} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-widest transition-colors">Clear</button>
                  </div>
                  <div className="border border-gray-200 rounded-2xl overflow-hidden bg-[#F4F6F8]">
                    <canvas 
                      ref={sigCanvasRef} 
                      width={450}
                      height={120}
                      className="w-full h-[120px] cursor-crosshair touch-none bg-white" 
                      onMouseDown={startDrawingSig} 
                      onMouseMove={drawSig} 
                      onMouseUp={stopDrawingSig} 
                      onMouseLeave={stopDrawingSig}
                      onTouchStart={startDrawingSig}
                      onTouchMove={drawSig}
                      onTouchEnd={stopDrawingSig}
                    />
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
                    {completedTasks.map(task => (
                      <div key={task.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 block">{task.id}</span>
                            <h4 className="text-sm font-bold text-[#111827]">{task.title}</h4>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Check size={12} /> Resolved</span>
                        </div>
                        {task.resolution && (
                          <div className="mt-3 bg-[#F9FAFB] p-3 rounded-xl border border-gray-50">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('tech.resolutionNotes' as any)}</p>
                            <p className="text-xs text-gray-600 font-medium">{task.resolution}</p>
                            {(task.repairImage || task.residentSignature) && (
                              <div className="mt-3 flex gap-4">
                                {task.repairImage && (
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Repair Image</p>
                                    <img src={task.repairImage} alt="Repair" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                  </div>
                                )}
                                {task.residentSignature && (
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Signature</p>
                                    <img src={task.residentSignature} alt="Signature" className="h-16 object-contain rounded-lg border border-gray-200 bg-white" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex justify-between items-center text-[11px] font-bold text-gray-400">
                          <span>{t('tech.asset' as any)} <span className="text-primary-brand cursor-pointer hover:underline" onClick={() => {setShowHistoryModal(false); onSelectAsset(task.assetId);}}>{task.assetId}</span></span>
                          {task.resolvedAt && <span>{new Date(task.resolvedAt).toLocaleDateString()}</span>}
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
                    {selectedTaskRoomId ? (
                      <button onClick={() => setShowRoomHistory(!showRoomHistory)} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-primary-brand rounded-full hover:bg-blue-100 transition-colors shadow-sm border border-blue-100 group">
                        <Clock size={12} className="group-hover:-rotate-45 transition-transform" />
                        <span className="text-sm font-bold">Room {selectedTaskDetail.room?.roomNumber}</span>
                      </button>
                    ) : (
                      <div className="text-sm font-bold text-primary-brand">Room {selectedTaskDetail.room?.roomNumber}</div>
                    )}
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

                {recentSameCategoryWarning && (
                  <div className="bg-[#FEF9C3] border border-[#FEF08A] rounded-2xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400" />
                    <div className="text-yellow-500 mt-0.5 bg-white rounded-full p-1 shadow-sm"><AlertTriangle size={18} /></div>
                    <div>
                      <h4 className="text-sm font-extrabold text-yellow-800">Warning: Repeated Issue</h4>
                      <p className="text-xs text-yellow-700 mt-1 font-medium leading-relaxed">This room had a similar <b>{selectedTaskCategory}</b> issue <span className="font-bold underline decoration-yellow-400 underline-offset-2">{(new Date().getTime() - new Date(recentSameCategoryWarning.resolvedAt || recentSameCategoryWarning.updatedAt).getTime()) / (1000 * 3600 * 24) | 0} days ago</span>. Please investigate thoroughly.</p>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {showRoomHistory && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm mt-4">
                        <h4 className="text-sm font-extrabold text-[#111827] mb-6 flex items-center gap-2"><History size={16} className="text-gray-400" /> Room Repair History</h4>
                        {roomHistory.length === 0 ? (
                          <div className="text-center py-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                            <p className="text-xs text-gray-400 font-medium">No past repairs found for this room.</p>
                          </div>
                        ) : (
                          <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                            {roomHistory.map((task) => (
                              <div key={task.id} className="relative pl-6">
                                <div className="absolute -left-[13px] top-1 bg-white p-1 rounded-full">
                                  <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  </div>
                                </div>
                                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:bg-white transition-all group">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-[#111827]">Resolved - {task.category}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">{new Date(task.resolvedAt || task.updatedAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{task.title}</p>
                                  <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 bg-white p-2 rounded-lg border border-gray-100">
                                    <span className="text-emerald-600 font-bold">Tech: {task.assigneeId || 'Unknown'}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="truncate text-gray-400">{task.resolution || 'No notes left'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {(selectedTaskDetail.status === 'RESOLVED' || selectedTaskDetail.status === 'CLOSED') && (selectedTaskDetail.repairImage || selectedTaskDetail.repairNotes || selectedTaskDetail.residentSignature) && (
                  <div className="mt-8 bg-gradient-to-br from-white to-gray-50/50 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        </div>
                        <h4 className="text-sm font-extrabold text-[#111827]">Resolution Summary</h4>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">Completed</span>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-8">
                      {/* Notes Section */}
                      {selectedTaskDetail.repairNotes && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Technician's Note</p>
                          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 text-sm text-gray-700 leading-relaxed font-medium relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400" />
                            {selectedTaskDetail.repairNotes}
                          </div>
                        </div>
                      )}

                      {/* Evidence & Signature Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {selectedTaskDetail.repairImage && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Camera size={12} /> Repair Evidence
                            </p>
                            <div className="group relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 aspect-video">
                              <img src={selectedTaskDetail.repairImage} alt="Repair Evidence" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
                            </div>
                          </div>
                        )}
                        
                        {selectedTaskDetail.residentSignature && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <PenTool size={12} /> Resident Signature
                            </p>
                            <div className="rounded-2xl border border-gray-100 shadow-sm bg-white aspect-video flex items-center justify-center p-4 relative overflow-hidden">
                              {/* Background pattern for authenticity */}
                              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                              <img src={selectedTaskDetail.residentSignature} alt="Resident Signature" className="h-full object-contain mix-blend-multiply relative z-10" />
                              <div className="absolute bottom-4 left-6 right-6 border-b border-gray-200 border-dashed" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
