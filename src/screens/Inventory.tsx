import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, MoreVertical, Laptop, Monitor, Package, Smartphone, X, Edit, Trash2, AlertTriangle, Loader2, User, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Asset, Personnel } from '../types';
import { useToast } from '../context/ToastContext';
import ImportModal from '../components/ImportModal';
import { useLanguage } from '../context/LanguageContext';

export default function Inventory({ 
  onSelectAsset, 
  setHeaderAction, 
  initialFilter = '', 
  user 
}: { 
  onSelectAsset: (id: string) => void, 
  setHeaderAction: (a: any) => void, 
  initialFilter?: string,
  user: Personnel
}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialFilter);
  const [filterType, setFilterType] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const { showToast } = useToast();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const { t } = useLanguage();

  const [formData, setFormData] = useState({ name: '', type: '', spec: '', serialNumber: '', assignedPersonnelId: '' });

  const fetchData = async () => {
    try {
      const [assetsData, personnelData, meta] = await Promise.all([api.getAssets(), api.getPersonnel(), api.getMetadata()]);
      const role = user.userRole || 'user';
      const myAssetsData = role === 'user' ? assetsData.filter(a => a.assignedPersonnelId === user.id) : assetsData;
      setAssets(myAssetsData);
      setFilteredAssets(myAssetsData);
      setPersonnel(personnelData);
      setDepartments(meta.departments);
      setCategories(meta.categories);
      if (meta.categories.length > 0 && !formData.type) {
        setFormData(prev => ({ ...prev, type: meta.categories[0].name }));
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = user.userRole || 'user';
    if (role !== 'user') {
      setHeaderAction({ 
        label: t('inv.actionsTitle' as any), 
        onClick: () => {}, // Handled by buttons
        customContent: (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20"
            >
              <Upload size={16} /> {t('inv.import' as any)}
            </button>
            <button 
              onClick={() => { setEditingAsset(null); setShowAddModal(true); }}
              className="bg-primary-brand text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={16} /> {t('inv.addAsset' as any)}
            </button>
          </div>
        )
      });
    } else {
      setHeaderAction(undefined);
    }
    fetchData();
    return () => setHeaderAction(undefined);
  }, []);

  useEffect(() => { if (initialFilter) setSearchTerm(initialFilter); }, [initialFilter]);

  useEffect(() => {
    let result = assets;
    
    // Global Search (ID, Asset Name, SN)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(lowerSearch) || 
        a.id.toLowerCase().includes(lowerSearch) || 
        a.serialNumber.toLowerCase().includes(lowerSearch)
      );
    }

    // Personnel Name Search
    if (personnelSearch) {
      const lowerP = personnelSearch.toLowerCase();
      result = result.filter(a => a.assignedUser?.name?.toLowerCase().includes(lowerP));
    }

    // Asset Type Filter
    if (filterType !== 'All') {
      result = result.filter(a => a.type === filterType);
    }

    // Department Filter
    if (filterDept !== 'All') {
      result = result.filter(a => a.department === filterDept);
    }

    setFilteredAssets(result);
  }, [searchTerm, filterType, filterDept, personnelSearch, assets]);

  useEffect(() => {
    if (!showAddModal && !editingAsset) {
      setFormData({ 
        name: '', 
        type: categories.length > 0 ? categories[0].name : '', 
        spec: '', 
        serialNumber: '', 
        assignedPersonnelId: '' 
      });
    }
  }, [showAddModal, editingAsset, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await api.updateAsset(editingAsset.id, { ...formData, department: personnel.find(p => p.id === formData.assignedPersonnelId)?.department || 'Unassigned' });
        showToast('Asset record updated successfully');
      } else {
        await api.createAsset({ ...formData, location: 'Bangkok Office', department: personnel.find(p => p.id === formData.assignedPersonnelId)?.department || 'Unassigned', image: 'https://images.unsplash.com/photo-1517336714467-d23623217d99?auto=format&fit=crop&q=80&w=300' });
        showToast('New asset registered to inventory');
      }
      setShowAddModal(false);
      setEditingAsset(null);
      fetchData();
      setFormData({ name: '', type: categories[0]?.name || '', spec: '', serialNumber: '', assignedPersonnelId: '' });
    } catch (error) {
      showToast('Action failed. Please check your data.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Mark this asset as Retired?')) {
      try {
        await api.updateAssetStatus(id, 'Retired');
        showToast('Asset status set to Retired', 'info');
        fetchData();
      } catch (error) {
        showToast('Failed to update status', 'error');
      }
    }
  };

  const openEdit = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAsset(asset);
    setFormData({ name: asset.name, type: asset.type as any, spec: asset.spec || '', serialNumber: asset.serialNumber, assignedPersonnelId: asset.assignedPersonnelId || '' });
    setShowAddModal(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: t('inv.total' as any), value: assets.length, color: 'text-on-surface-brand' }, { label: t('inv.active' as any), value: assets.filter(a => a.status === 'Active').length, color: 'text-emerald-500' }, { label: t('inv.maintenance' as any), value: assets.filter(a => a.status === 'In Maintenance').length, color: 'text-amber-500' }, { label: t('inv.retired' as any), value: assets.filter(a => a.status === 'Retired').length, color: 'text-slate-400' }].map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200/50 shadow-sm"><span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 md:mb-2 block">{stat.label}</span><span className={`text-xl md:text-3xl font-extrabold ${stat.color}`}>{stat.value}</span></div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-gray-200/50 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 flex-1 gap-3">
          {/* Global Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder={t('inv.searchAsset' as any)} 
              className="w-full bg-[#F9FAFB] border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary-brand/10 transition-all font-medium" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
          </div>

          {/* Personnel Name Search */}
          {user.userRole !== 'user' && (
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('inv.searchOwner' as any)} 
                className="w-full bg-[#F9FAFB] border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary-brand/10 transition-all font-medium" 
                value={personnelSearch} 
                onChange={(e) => setPersonnelSearch(e.target.value)} 
              />
              {personnelSearch && <button onClick={() => setPersonnelSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
            </div>
          )}

          {/* Type Filter */}
          <select 
            className="bg-[#F9FAFB] border-none rounded-xl py-3 px-4 text-sm font-bold text-gray-500 cursor-pointer focus:ring-2 focus:ring-primary-brand/10 transition-all" 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">{t('inv.allTypes' as any)}</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          {/* Department Filter */}
          <select 
            className="bg-[#F9FAFB] border-none rounded-xl py-3 px-4 text-sm font-bold text-gray-500 cursor-pointer focus:ring-2 focus:ring-primary-brand/10 transition-all" 
            value={filterDept} 
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="All">{t('inv.allDepartments' as any)}</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><th className="px-6 py-4 min-w-[250px]">{t('inv.assetInfo' as any)}</th><th className="px-6 py-4 hidden md:table-cell">{t('inv.status' as any)}</th><th className="px-6 py-4 min-w-[150px]">{t('inv.assignedTo' as any)}</th><th className="px-6 py-4 text-right">{t('inv.actions' as any)}</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-[#F9FAFB] transition-all cursor-pointer group" onClick={() => onSelectAsset(asset.id)}>
                  <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0"><img src={asset.image} className="w-full h-full object-cover" /></div><div className="min-w-0"><div className="text-sm font-bold text-on-surface-brand truncate">{asset.name}</div><div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-tighter truncate">{asset.type} • {asset.id}</div><div className="md:hidden mt-1 inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-gray-100 text-gray-600">{asset.status}</div></div></div></td>
                  <td className="px-6 py-4 hidden md:table-cell"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${asset.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{asset.status}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2">
                    {asset.assignedUser?.avatar ? (
                      <img src={asset.assignedUser.avatar} className="w-6 h-6 rounded-full border border-white shadow-sm" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><User size={12} className="text-gray-400" /></div>
                    )}
                    <span className="text-xs font-bold text-on-surface-brand truncate max-w-[100px]">
                      {asset.assignedUser?.name ? asset.assignedUser.name.split(' ')[0] : 'Unassigned'}
                    </span>
                  </div></td>
                  <td className="px-6 py-4 text-right">
                    {user.userRole !== 'user' && (
                      <div className="flex justify-end gap-1 md:gap-2">
                        <button onClick={(e) => openEdit(asset, e)} className="p-2 text-gray-400 hover:text-primary-brand hover:bg-white rounded-lg transition-all">
                          <Edit size={16} />
                        </button>
                        {asset.status !== 'Retired' && (
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAssets.length === 0 && <div className="p-20 text-center text-gray-400 italic text-sm">{t('inv.noAssets' as any)}</div>}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAddModal(false); setEditingAsset(null); }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]"><h2 className="text-lg md:text-xl font-extrabold text-[#111827]">{editingAsset ? t('inv.editAsset' as any) : t('inv.addNewAsset' as any)}</h2><button onClick={() => { setShowAddModal(false); setEditingAsset(null); }} className="p-2 hover:bg-white rounded-full transition-all shadow-sm text-gray-400"><X size={20} /></button></div>
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('inv.assetName' as any)}</label><input required type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('inv.type' as any)}</label><select className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-bold text-primary-brand" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('inv.serialNumber' as any)}</label><input required type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium" value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('inv.assignToEmployee' as any)}</label><select required className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-bold text-primary-brand" value={formData.assignedPersonnelId} onChange={(e) => setFormData({...formData, assignedPersonnelId: e.target.value})}><option value="">{t('inv.selectPersonnel' as any)}</option>{personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('inv.technicalSpec' as any)}</label><textarea rows={3} className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm resize-none font-medium" value={formData.spec} onChange={(e) => setFormData({...formData, spec: e.target.value})} /></div>
                <button type="submit" className="w-full bg-primary-brand text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">{editingAsset ? t('inv.updateRecord' as any) : t('inv.registerAsset' as any)}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <ImportModal 
            type="assets" 
            onClose={() => setShowImportModal(false)} 
            onSuccess={fetchData} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
