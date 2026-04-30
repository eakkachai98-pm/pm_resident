import { useState, useEffect } from 'react';
import { ChevronRight, MapPin, Edit, Trash2, History, ShieldCheck, CreditCard, ChevronDown, CheckCircle, Clock, Package, Monitor, Laptop, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Asset, Ticket, Screen, Personnel } from '../types';
import { useToast } from '../context/ToastContext';

export default function AssetDetail({ 
  id, 
  onNavigate, 
  user,
  setHeaderAction
}: { 
  id: string | null, 
  onNavigate: (s: Screen) => void, 
  user: Personnel,
  setHeaderAction: (a: any) => void
}) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: '', spec: '', serialNumber: '', assignedPersonnelId: '' });

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [assetData, ticketsData, pData, meta] = await Promise.all([api.getAssetById(id), api.getAssetTickets(id), api.getPersonnel(), api.getMetadata()]);
      setAsset(assetData);
      setTickets(ticketsData);
      setPersonnel(pData);
      setCategories(meta.categories);
      setFormData({ name: assetData.name, type: assetData.type, spec: assetData.spec || '', serialNumber: assetData.serialNumber, assignedPersonnelId: assetData.assignedPersonnelId || '' });
    } catch (error) {
      console.error('Error fetching asset details:', error);
      showToast('Could not load asset details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setHeaderAction(undefined);
    fetchData(); 
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.updateAsset(id, { ...formData, department: personnel.find(p => p.id === formData.assignedPersonnelId)?.department || 'Unassigned' });
      showToast('Asset record updated');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      showToast('Update failed', 'error');
    }
  };

  const handleRetire = async () => {
    if (!id || !asset) return;
    if (confirm(`Are you sure you want to retire ${asset.name}? This will mark it as inactive but keep its history.`)) {
      try {
        await api.updateAssetStatus(id, 'Retired');
        showToast('Asset status updated to Retired', 'info');
        fetchData();
      } catch (error) {
        showToast('Action failed', 'error');
      }
    }
  };

  if (!id) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No asset selected</div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;
  if (!asset) return <div className="p-8 text-center text-gray-400">Asset not found</div>;

  const specs = [{ label: 'Serial Number', value: asset.serialNumber }, { label: 'Purchase Date', value: new Date(asset.purchaseDate).toLocaleDateString() }, { label: 'Location', value: asset.location, icon: MapPin }, { label: 'Department', value: asset.department }];

  return (
    <div className="space-y-10 font-sans">
      <header className="flex flex-wrap gap-4 items-center text-gray-400 font-bold text-xs uppercase tracking-[0.2em] border-b border-gray-100 pb-6"><button onClick={() => onNavigate('inventory')} className="hover:text-primary-brand transition-colors">Inventory</button><ChevronRight size={14} className="opacity-40" /><span className="text-[#111827]">{asset.id}</span></header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-7"><motion.div className="aspect-[16/9] w-full rounded-[2.5rem] overflow-hidden bg-white border border-gray-200/50 relative shadow-2xl shadow-gray-200/50 group"><img src={asset.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute top-6 left-6 flex gap-3"><span className={`px-5 py-2 bg-white/90 backdrop-blur-md text-[10px] font-extrabold rounded-full tracking-widest uppercase flex items-center gap-2 shadow-sm ${asset.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}><span className={`w-2 h-2 rounded-full animate-pulse ${asset.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span> {asset.status}</span></div></motion.div></div>
        <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-200/50 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight leading-none mb-4 truncate">{asset.name}</h1>
              <p className="text-lg text-gray-400 font-medium italic">{asset.type}</p>
            </div>
            {user.userRole !== 'user' && (
              <div className="flex gap-2">
                <button onClick={() => setShowEditModal(true)} className="p-3 bg-[#F9FAFB] hover:bg-primary-brand hover:text-white rounded-2xl text-gray-400 transition-all border border-gray-100">
                  <Edit size={20} />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-8 mb-10">{specs.map(s => (<div key={s.label}><p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">{s.label}</p><p className="text-sm font-bold text-[#111827] flex items-center gap-2">{s.icon && <s.icon size={14} className="text-primary-brand" />}{s.value}</p></div>))}</div>
          <div className="p-6 bg-[#F9FAFB] rounded-3xl border border-gray-100 mb-10"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Assigned Personnel</p><div className="flex items-center gap-4"><img src={asset.assignedUser.avatar} className="w-12 h-12 rounded-xl border border-white shadow-md object-cover" /><div className="min-w-0"><p className="text-sm font-extrabold text-[#111827] truncate">{asset.assignedUser.name}</p><p className="text-xs text-gray-400 font-medium truncate">{asset.assignedUser.role}</p></div></div></div>
          {user.userRole !== 'user' && asset.status !== 'Retired' && (
            <div className="mt-auto pt-6 border-t border-gray-50 flex gap-4">
              <button onClick={handleRetire} className="flex-1 py-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                Retire Asset
              </button>
            </div>
          )}
          {asset.status === 'Retired' && (
            <div className="mt-auto pt-6 border-t border-gray-50 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                This asset has been decommissioned
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-200/50 shadow-sm">
        <div className="flex items-center gap-4 mb-12"><div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary-brand shadow-sm"><History size={28} /></div><div><h2 className="text-xl font-extrabold text-[#111827]">Maintenance History</h2><p className="text-sm text-gray-400 font-medium">Lifecycle events and logs.</p></div></div>
        <div className="space-y-8">
          {tickets.length > 0 ? tickets.map((t, i) => (
            <div key={t.id} className="flex gap-8 relative">{i < tickets.length - 1 && <div className="absolute left-7 top-14 bottom-[-32px] w-px bg-gray-100"></div>}<div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center border-2 ${t.status === 'Resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-blue-600'} shadow-sm`}>{t.status === 'Resolved' ? <CheckCircle size={24} /> : <Clock size={24} />}</div><div className="flex-1 pt-1">
              <div className="flex justify-between items-start mb-2"><h4 className="text-lg font-bold text-[#111827]">{t.subject}</h4><span className="text-[10px] font-extrabold text-gray-400 uppercase bg-[#F9FAFB] px-3 py-1 rounded-lg border border-gray-100">{new Date(t.createdAt).toLocaleDateString()}</span></div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-2xl">{t.description}</p>
              {t.resolution && (
                <div className="mb-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-emerald-800 font-medium whitespace-pre-wrap">
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest mb-1 opacity-60">Resolution Summary</span>
                  {t.resolution}
                </div>
              )}
              <div className="flex gap-2"><span className="px-3 py-1 bg-[#F9FAFB] rounded-lg text-[9px] font-extrabold text-gray-400 border border-gray-100 uppercase tracking-widest">{t.id}</span><span className={`px-3 py-1 rounded-lg text-[9px] font-extrabold border uppercase tracking-widest ${t.priority === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{t.priority}</span></div></div></div>
          )) : (<div className="text-center py-16 bg-[#F9FAFB] rounded-3xl border border-dashed border-gray-200"><Package size={48} className="mx-auto text-gray-300 mb-4 opacity-50" /><p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No history recorded.</p></div>)}
        </div>
      </div>

      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]"><h2 className="text-xl font-extrabold text-[#111827]">Edit Asset</h2><button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white rounded-full text-gray-400 shadow-sm"><X size={20} /></button></div>
              <form onSubmit={handleUpdate} className="p-8 space-y-6">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Asset Name</label><input required type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type</label><select className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-bold text-primary-brand" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Serial Number</label><input required type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium" value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assigned To</label><select required className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-bold text-primary-brand" value={formData.assignedPersonnelId} onChange={(e) => setFormData({...formData, assignedPersonnelId: e.target.value})}><option value="">Select Personnel</option>{personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <button type="submit" className="w-full bg-primary-brand text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">Save Changes</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
