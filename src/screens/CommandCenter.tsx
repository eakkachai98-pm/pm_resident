import { useState, useEffect } from 'react';
import { TrendingUp, Download, Package, Activity as ActivityIcon, ShieldCheck, Wrench, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Papa from 'papaparse';
import { api } from '../services/api';
import { Asset, Activity, Screen } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CommandCenter({ onNavigate, onSelectAsset, setHeaderAction }: { onNavigate: (s: Screen) => void, onSelectAsset: (id: string) => void, setHeaderAction: (a: any) => void }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('all');
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    setHeaderAction({
      label: t('admin.quickActions' as any),
      customContent: (
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('inventory')} className="bg-[#111827] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-brand transition-all">{t('admin.addAsset' as any)}</button>
          <button onClick={() => onNavigate('personnel')} className="bg-white text-[#111827] border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">{t('admin.addUser' as any)}</button>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="ml-2 bg-white border border-gray-200 text-[#111827] px-4 py-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none cursor-pointer"
          >
            <option value="all">{t('admin.allTime' as any)}</option>
            <option value="7">{t('admin.last7Days' as any)}</option>
            <option value="30">{t('admin.last30Days' as any)}</option>
            <option value="365">{t('admin.thisYear' as any)}</option>
          </select>
        </div>
      )
    });
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [activitiesData, analyticsData] = await Promise.all([
          api.getActivities(dateRange),
          api.getAnalytics(dateRange)
        ]);
        setActivities(activitiesData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching command center data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange, t]);

  const handleExport = () => {
    showToast(t('admin.downloadStarted' as any), 'success');
    const csvData = activities.map(a => ({
      ID: a.id,
      Asset_ID: a.assetId || 'N/A',
      Description: a.description,
      Operator: a.user,
      Time: new Date(a.time).toLocaleString()
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand"></div></div>;

  const { summary, assetDist, ticketStatus } = analytics || { summary: {}, assetDist: [], ticketStatus: [] };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('admin.totalAssets' as any), value: summary.totalAssets, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: t('admin.activeFleet' as any), value: summary.active, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: t('admin.pendingRepairs' as any), value: summary.maintenance, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: t('admin.totalTickets' as any), value: summary.totalTickets, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-extrabold text-[#111827]">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Asset Distribution Chart */}
        <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
          <h4 className="text-lg font-bold text-[#111827] mb-8">{t('admin.assetCategories' as any)}</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Status Chart */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
          <h4 className="text-lg font-bold text-[#111827] mb-8">{t('admin.ticketStatusOverview' as any)}</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketStatus}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                <Tooltip 
                   cursor={{ fill: '#f9fafb' }}
                   contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                  {ticketStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Log (Full Width) */}
        <div className="lg:col-span-12 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-primary-brand rounded-lg"><ActivityIcon size={18} /></div>
              <h4 className="text-lg font-bold text-[#111827]">{t('admin.auditTrail' as any)}</h4>
            </div>
            <button onClick={handleExport} className="text-[11px] font-bold text-gray-400 hover:text-primary-brand transition-colors uppercase tracking-widest flex items-center gap-2">
              <Download size={14} /> {t('admin.exportReport' as any)}
            </button>
          </div>
          
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB] text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-8 py-4">{t('admin.assetTarget' as any)}</th>
                  <th className="px-8 py-4">{t('admin.eventDescription' as any)}</th>
                  <th className="px-8 py-4">{t('admin.operator' as any)}</th>
                  <th className="px-8 py-4 text-right">{t('admin.time' as any)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <button 
                        onClick={() => activity.assetId && onSelectAsset(activity.assetId)}
                        className="font-bold text-primary-brand hover:underline flex items-center gap-2"
                      >
                        <Package size={14} className="opacity-50" />
                        {activity.assetId || 'N/A'}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-[#111827]">{activity.description}</td>
                    <td className="px-8 py-5">
                       <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600 uppercase">
                         {activity.user}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right text-gray-400 font-medium text-xs">{activity.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
