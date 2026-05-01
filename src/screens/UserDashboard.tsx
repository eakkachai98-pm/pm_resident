import { useState, useEffect } from 'react';
import { Home, FileText, Wrench, AlertTriangle, CheckCircle, Zap, Droplets, Activity, TrendingUp, TrendingDown, Clock, Star, X, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import SystemAnnouncements from '../components/SystemAnnouncements';
import { useLanguage } from '../context/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function UserDashboard({ onViewTicket, onNavigate, user, setHeaderAction }: { onViewTicket?: (id: string) => void, onNavigate: (s: any) => void, user: any, setHeaderAction: (a: any) => void }) {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [myRoom, setMyRoom] = useState<any>(null);
  const [meterData, setMeterData] = useState<any>(null);
  const [lastPolled, setLastPolled] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  const submitRating = async (ticketId: string, rating: number, feedback: string) => {
    try {
      const res = await fetch(`/api/maintenance/${ticketId}/rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback })
      });
      if (!res.ok) throw new Error('Failed to rate');
      showToast('Rating submitted successfully', 'success');
      
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, rating, feedback } : t));
      setSelectedTicket((prev: any) => ({ ...prev, rating, feedback }));
    } catch (err) {
      showToast('Failed to submit rating', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500';
      case 'IN_PROGRESS': return 'bg-amber-500';
      case 'RESOLVED': return 'bg-emerald-500';
      case 'CLOSED': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Electric': return <Zap size={12} />;
      case 'Water': return <Droplets size={12} />;
      case 'AirCon': return <Wind size={12} />;
      default: return <Wrench size={12} />;
    }
  };

  useEffect(() => {
    setHeaderAction(undefined);
    const fetchData = async () => {
      try {
        const [invRes, tktRes] = await Promise.all([
          fetch('/api/invoices'),
          fetch('/api/maintenance')
        ]);
        const invData = await invRes.json();
        const tktData = await tktRes.json();
        
        const myInvoices = invData.filter((i: any) => i.lease?.tenant?.id === user.id);
        const myTickets = tktData.filter((t: any) => t.reporterId === user.id);
        
        setInvoices(myInvoices);
        setTickets(myTickets);
        
        let roomInfo = null;
        if (myInvoices.length > 0) {
          roomInfo = myInvoices[0].lease?.room;
          setMyRoom(roomInfo);
        }

        if (roomInfo) {
          const meterRes = await fetch(`/api/meters/${roomInfo.id}`);
          const mData = await meterRes.json();
          setMeterData(mData);
          setLastPolled(new Date());
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Polling Real-time IoT data every 20 minutes (1,200,000 ms)
    const pollInterval = setInterval(async () => {
      if (myRoom?.id) {
        try {
          const res = await fetch(`/api/meters/${myRoom.id}`);
          const mData = await res.json();
          setMeterData(mData);
          setLastPolled(new Date());
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
    }, 20 * 60 * 1000);

    return () => clearInterval(pollInterval);
  }, [user.id, myRoom?.id]);

  // If no meter history, generate dummy data for the chart to look nice
  const chartData = meterData?.history?.length > 0 
    ? meterData.history 
    : [
      { billingMonth: '2024-05', electricMeter: 120, waterMeter: 4 },
      { billingMonth: '2024-06', electricMeter: 135, waterMeter: 5 },
      { billingMonth: '2024-07', electricMeter: 150, waterMeter: 6 },
      { billingMonth: '2024-08', electricMeter: 140, waterMeter: 4.5 },
      { billingMonth: '2024-09', electricMeter: 160, waterMeter: 5.5 },
      { billingMonth: '2024-10', electricMeter: 155, waterMeter: 5 }
    ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand"></div></div>;

  const unpaidInvoices = invoices.filter(i => i.status !== 'PAID');
  const recentTickets = tickets.slice(0, 3);
  
  const currentElectric = chartData[chartData.length - 1]?.electricMeter || 0;
  const prevElectric = chartData[chartData.length - 2]?.electricMeter || 0;
  const electricTrend = prevElectric ? ((currentElectric - prevElectric) / prevElectric) * 100 : 0;

  const currentWater = chartData[chartData.length - 1]?.waterMeter || 0;
  const prevWater = chartData[chartData.length - 2]?.waterMeter || 0;
  const waterTrend = prevWater ? ((currentWater - prevWater) / prevWater) * 100 : 0;

  // Format month for charts
  const formattedChartData = chartData.map((d: any) => ({
    ...d,
    shortMonth: new Date(d.billingMonth + '-01').toLocaleDateString('en-US', { month: 'short' })
  }));

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      <header className="flex flex-col gap-1 px-1">
        <h2 className="text-xl md:text-2xl font-bold text-on-surface-brand tracking-tight">Resident Dashboard</h2>
        <p className="text-xs md:text-sm text-secondary-brand">Welcome back, {user.name}.</p>
      </header>

      <SystemAnnouncements />

      <div className="space-y-6">
        {/* Top Row: IoT Flow & My Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left: IoT Flow (8 cols) */}
          <div className="lg:col-span-8 h-full flex flex-col">
          {/* Real-time IoT Flow */}
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden flex flex-col relative">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
              <h3 className="text-sm md:text-base font-bold text-on-surface-brand flex items-center gap-2">
                <Activity size={18} className="text-emerald-500" /> Real-time IoT Flow
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hidden sm:block">Updated: {lastPolled.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold flex items-center gap-1.5 border border-emerald-100 uppercase tracking-widest">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                  LIVE
                </span>
              </div>
            </div>
            
            <div className="p-4 md:p-8 flex items-center justify-center w-full bg-white overflow-x-auto custom-scrollbar">
              <div className="min-w-[320px] w-full max-w-md mx-auto">
                <svg viewBox="0 0 400 280" className="w-full h-auto drop-shadow-sm">
                  <defs>
                    <marker id="arrow-electric" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
                    </marker>
                    <marker id="arrow-water" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
                    </marker>
                  </defs>
                  <style>{`
                    @keyframes flow {
                      from { stroke-dashoffset: 24; }
                      to { stroke-dashoffset: 0; }
                    }
                    .path-flow-electric {
                      stroke-dasharray: 6 6;
                      animation: flow 1s linear infinite;
                      stroke: #fbbf24;
                    }
                    .path-flow-water {
                      stroke-dasharray: 6 6;
                      animation: flow 1.5s linear infinite;
                      stroke: #60a5fa;
                    }
                  `}</style>

                  {/* Base Tracks */}
                  <path d="M 100 130 V 210 Q 100 230 120 230 H 150" fill="none" stroke="#f3f4f6" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 300 130 V 210 Q 300 230 280 230 H 250" fill="none" stroke="#f3f4f6" strokeWidth="8" strokeLinecap="round" />

                  {/* Animated Flows */}
                  <path d="M 100 130 V 210 Q 100 230 120 230 H 150" fill="none" strokeWidth="3" strokeLinecap="round" className="path-flow-electric" markerEnd="url(#arrow-electric)" />
                  <path d="M 300 130 V 210 Q 300 230 280 230 H 250" fill="none" strokeWidth="3" strokeLinecap="round" className="path-flow-water" markerEnd="url(#arrow-water)" />

                  {/* Power Node */}
                  <foreignObject x="50" y="10" width="100" height="100">
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="w-[80px] h-[80px] rounded-full bg-white border border-amber-100 flex flex-col items-center justify-center shadow-lg relative">
                        <div className="absolute inset-1 rounded-full border border-amber-300/30" />
                        <Zap size={20} className="text-amber-500 mb-0.5" />
                        <span className="text-sm font-black text-amber-600 leading-none">{meterData?.realtime?.electric?.currentPower || '0.00'}</span>
                        <span className="text-[8px] font-bold text-amber-500/70 uppercase">kW</span>
                      </div>
                    </div>
                  </foreignObject>
                  <text x="100" y="125" textAnchor="middle" fontSize="10" fontWeight="800" fill="#9ca3af" className="uppercase tracking-widest">Power</text>

                  {/* Water Node */}
                  <foreignObject x="250" y="10" width="100" height="100">
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="w-[80px] h-[80px] rounded-full bg-white border border-blue-100 flex flex-col items-center justify-center shadow-lg relative">
                        <div className="absolute inset-1 rounded-full border border-blue-300/30" />
                        <Droplets size={20} className="text-blue-500 mb-0.5" />
                        <span className="text-sm font-black text-blue-600 leading-none">{meterData?.realtime?.water?.currentFlow || '0.0'}</span>
                        <span className="text-[8px] font-bold text-blue-500/70 uppercase">L/min</span>
                      </div>
                    </div>
                  </foreignObject>
                  <text x="300" y="125" textAnchor="middle" fontSize="10" fontWeight="800" fill="#9ca3af" className="uppercase tracking-widest">Water</text>

                  {/* Room Node */}
                  <text x="200" y="180" textAnchor="middle" fontSize="11" fontWeight="800" fill="#9ca3af" className="uppercase tracking-widest">Room {myRoom?.roomNumber || '...'}</text>
                  <foreignObject x="155" y="190" width="90" height="90">
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="w-[80px] h-[80px] rounded-full bg-white border-2 border-emerald-100 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] relative">
                        <div className="absolute inset-1 rounded-full border border-emerald-300/50" />
                        <Home size={24} className="text-emerald-500 mb-1" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Load</span>
                      </div>
                    </div>
                  </foreignObject>
                </svg>
              </div>
            </div>
          </div>
        </div>

          {/* Right: My Requests (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl md:rounded-[2rem] border border-gray-200/50 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm md:text-base font-bold text-on-surface-brand">My Requests</h3>
              <button onClick={() => onNavigate('tickets')} className="text-primary-brand text-xs font-bold hover:underline">View All</button>
            </div>
            
            <div className="p-6 space-y-5 flex-1 flex flex-col">
              <div className="flex-1 space-y-5">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} onClick={() => { setSelectedTicket(ticket); setRatingValue(0); setHoveredStar(0); }} className="group cursor-pointer border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-on-surface-brand group-hover:text-primary-brand transition-colors truncate pr-2">{ticket.title}</h4>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter ${
                        ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>{ticket.status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400 mb-2">
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{ticket.category}</span>
                    </div>
                  </div>
                ))}
                {recentTickets.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 py-4">
                    <Wrench size={32} className="mb-2" />
                    <p className="text-xs font-medium">No maintenance requests</p>
                  </div>
                )}
              </div>
              
              <button onClick={() => onNavigate('tickets')} className="w-full mt-auto bg-[#F4F6F8] text-gray-500 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shrink-0">
                <AlertTriangle size={14} /> Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Charts and Bills */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Electric Summary Card */}
            <div className="bg-white rounded-2xl md:rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden p-6 relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Electricity (This Month)</h3>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-[#111827]">{currentElectric} <span className="text-sm font-bold text-gray-400">Units</span></h2>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl border border-amber-100"><Zap size={20} /></div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold mb-6 ${electricTrend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {electricTrend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{Math.abs(electricTrend).toFixed(1)}% {electricTrend > 0 ? 'higher' : 'lower'} than last month</span>
              </div>
              <div className="h-[100px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={5} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                    <Bar dataKey="electricMeter" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Water Summary Card */}
            <div className="bg-white rounded-2xl md:rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden p-6 relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Water (This Month)</h3>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-[#111827]">{currentWater} <span className="text-sm font-bold text-gray-400">Units</span></h2>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl border border-blue-100"><Droplets size={20} /></div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold mb-6 ${waterTrend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {waterTrend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{Math.abs(waterTrend).toFixed(1)}% {waterTrend > 0 ? 'higher' : 'lower'} than last month</span>
              </div>
              <div className="h-[100px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={5} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                    <Bar dataKey="waterMeter" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Unpaid Invoices */}
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm md:text-base font-bold text-on-surface-brand flex items-center gap-2">
                <FileText size={18} className="text-red-500" /> Outstanding Bills
              </h3>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 gap-4">
              {unpaidInvoices.length > 0 ? unpaidInvoices.map((inv) => (
                <div key={inv.id} className="bg-red-50/50 rounded-xl p-5 border border-red-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-red-900 mb-1">Invoice: {inv.billingMonth}</h4>
                    <p className="text-xs text-red-700/70 font-medium">Please pay by the 5th of the month.</p>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="text-xl font-black text-red-600">฿{inv.totalAmount.toLocaleString()}</div>
                    <button onClick={() => showToast('Payment gateway coming soon', 'info')} className="flex-1 md:flex-none bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-colors">Pay Now</button>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-6 text-emerald-500 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <CheckCircle size={28} className="mb-2" />
                  <p className="text-sm font-bold">All caught up!</p>
                  <p className="text-[10px] font-medium opacity-70">No outstanding bills.</p>
                </div>
              )}
            </div>
          </div>
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
                    <div className="text-sm font-bold text-primary-brand">Room {selectedTicket.room?.roomNumber || myRoom?.roomNumber || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reporter</span>
                    <div className="text-sm font-bold text-[#111827]">{selectedTicket.reporter?.name || user.name}</div>
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

                {selectedTicket.status === 'RESOLVED' && !selectedTicket.rating && (
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
