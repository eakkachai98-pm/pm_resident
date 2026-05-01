import { useState, useEffect } from 'react';
import { ChevronRight, Home, CheckCircle2, AlertCircle, Wrench, FileText, Activity, Zap, Droplets, User, Calendar, CreditCard, History, Phone, X, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '../context/LanguageContext';

export default function AssetDetail({ 
  id, 
  onNavigate, 
  user,
  setHeaderAction
}: { 
  id: string | null, 
  onNavigate: (s: any) => void, 
  user: any,
  setHeaderAction: (a: any) => void
}) {
  const [room, setRoom] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [meterData, setMeterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [roomData, ticketsData, metersResponse] = await Promise.all([
        api.getRoomById(id),
        api.getAssetTickets(id),
        fetch(`/api/meters/${id}?admin=true`)
      ]);
      const metersData = await metersResponse.json();
      setRoom(roomData);
      setTickets(ticketsData);
      setMeterData(metersData);
    } catch (error) {
      console.error('Error fetching room details:', error);
      showToast('Could not load room details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setHeaderAction(undefined);
    fetchData(); 
  }, [id]);

  if (!id) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No room selected</div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;
  if (!room) return <div className="p-8 text-center text-gray-400">Room not found</div>;

  const activeLease = room.leases?.length > 0 ? room.leases[0] : null;
  const tenant = activeLease?.tenant;

  const chartData = meterData?.history?.map((d: any, index: number, arr: any[]) => {
    const prev = index > 0 ? arr[index - 1] : null;
    const electricUsage = prev ? d.electricMeter - prev.electricMeter : 0;
    const waterUsage = prev ? d.waterMeter - prev.waterMeter : 0;
    
    return {
      ...d,
      shortMonth: new Date(d.billingMonth + '-01').toLocaleDateString('en-US', { month: 'short' }),
      electricUsage: Math.max(0, parseFloat(electricUsage.toFixed(1))),
      waterUsage: Math.max(0, parseFloat(waterUsage.toFixed(1))),
      isFirstRecord: index === 0
    };
  }) || [];

  return (
    <div className="space-y-8 font-sans">
      <header className="flex flex-wrap gap-4 items-center text-gray-400 font-bold text-xs uppercase tracking-[0.2em] border-b border-gray-100 pb-6">
        <button onClick={() => onNavigate('inventory')} className="hover:text-primary-brand transition-colors">Rooms</button>
        <ChevronRight size={14} className="opacity-40" />
        <span className="text-[#111827]">Room {room.roomNumber}</span>
      </header>

      {/* Top Banner */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-200/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg
            ${room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-500 shadow-emerald-500/20' : 
              room.status === 'OCCUPIED' ? 'bg-red-50 text-red-500 shadow-red-500/20' : 
              'bg-amber-50 text-amber-500 shadow-amber-500/20'}`}>
            <Home size={36} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-[#111827] tracking-tighter mb-2">Room {room.roomNumber}</h1>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                ${room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                  room.status === 'OCCUPIED' ? 'bg-red-50 text-red-700 border-red-100' : 
                  'bg-amber-50 text-amber-700 border-amber-100'}`}>
                {room.status}
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Floor {room.floor} • {room.roomType}</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 bg-[#F9FAFB] p-4 rounded-2xl border border-gray-100 text-right min-w-[200px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Rent</p>
          <p className="text-2xl font-black text-primary-brand">฿{room.price.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tenant & Maintenance */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Tenant Info */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-200/50 shadow-sm">
            <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2 mb-6">
              <User size={18} className="text-primary-brand" /> Current Tenant
            </h2>
            {tenant ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-primary-brand font-black text-xl border border-blue-200 shadow-sm">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#111827]">{tenant.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tenant.nationality || 'Thai'} Citizen</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-[#F9FAFB] p-4 rounded-2xl border border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone</p>
                    <p className="text-sm font-bold text-[#111827]">{tenant.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lease Start</p>
                    <p className="text-sm font-bold text-[#111827]">{new Date(activeLease.startDate).toLocaleDateString()}</p>
                  </div>
                  {tenant.identityNumber && (
                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID / Passport No.</p>
                      <p className="text-sm font-bold text-[#111827]">{tenant.identityNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-[#F9FAFB] rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Active Tenant</p>
              </div>
            )}
          </div>

          {/* Maintenance History */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-200/50 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Wrench size={18} className="text-amber-500" /> Maintenance History
              </h2>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tickets.length} Records</span>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {tickets.length > 0 ? tickets.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-[#F9FAFB] border border-gray-100 flex gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {t.status === 'RESOLVED' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827] mb-1">{t.title}</h4>
                    <p className="text-[10px] font-medium text-gray-500 mb-2 line-clamp-2">{t.description}</p>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-8">No maintenance history</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Utilities */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Real-time Flow */}
          <div className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Activity size={18} className="text-emerald-500" /> Real-time Utilities
              </h3>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold flex items-center gap-1.5 border border-emerald-100 uppercase tracking-widest">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                LIVE
              </span>
            </div>
            
            <div className="p-4 md:p-8 flex items-center justify-center w-full bg-white overflow-x-auto custom-scrollbar">
              <div className="min-w-[320px] w-full max-w-md mx-auto">
                <svg viewBox="0 0 400 280" className="w-full h-auto drop-shadow-sm">
                  <defs>
                    <marker id="arrow-electric" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
                    </marker>
                    <marker id="arrow-water" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
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
                      stroke: #3b82f6;
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
                  <text x="200" y="180" textAnchor="middle" fontSize="11" fontWeight="800" fill="#9ca3af" className="uppercase tracking-widest">Room {room.roomNumber}</text>
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

          {/* Historical Graph */}
          <div className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <History size={18} className="text-primary-brand" /> Usage History
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase"><div className="w-3 h-3 rounded-sm bg-amber-400"></div> Electric</div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase"><div className="w-3 h-3 rounded-sm bg-blue-400"></div> Water</div>
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '1rem', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="electricUsage" name="Electricity Used (Units)" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={24} />
                    <Bar dataKey="waterUsage" name="Water Used (Units)" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] w-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No meter history</p>
              </div>
            )}
          </div>
          
          {/* Data Table */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <FileText size={18} className="text-primary-brand" /> Detailed Usage Data
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-8 py-4">Billing Month</th>
                      <th className="px-8 py-4 text-right">Electricity (Units)</th>
                      <th className="px-8 py-4 text-right">Water (Units)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...chartData].reverse().map((data: any, index: number) => (
                      <tr key={index} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-4 text-sm font-bold text-[#111827]">
                          {new Date(data.billingMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-4 text-sm font-bold text-amber-600 text-right">
                          {data.isFirstRecord ? '-' : data.electricUsage.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          <div className="text-[10px] font-medium text-gray-400 mt-1">Reading: {data.electricMeter.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                        </td>
                        <td className="px-8 py-4 text-sm font-bold text-blue-600 text-right">
                          {data.isFirstRecord ? '-' : data.waterUsage.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          <div className="text-[10px] font-medium text-gray-400 mt-1">Reading: {data.waterMeter.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
