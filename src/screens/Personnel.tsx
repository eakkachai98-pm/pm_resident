import { useState, useEffect } from 'react';
import { Users, Mail, Briefcase, Calendar, Package, Search, MoreVertical, Plus, Filter, ExternalLink, X, Edit, Trash2, ShieldCheck, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Personnel } from '../types';
import { useToast } from '../context/ToastContext';
import ImportModal from '../components/ImportModal';

export default function PersonnelScreen({ 
  setHeaderAction, 
  onViewAssets, 
  user 
}: { 
  setHeaderAction: (a: any) => void, 
  onViewAssets: (name: string) => void,
  user: Personnel
}) {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const { showToast } = useToast();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);

  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: '', department: '', email: '', phone: '', userRole: 'user' });

  const fetchData = async () => {
    try {
      const [pData, meta] = await Promise.all([api.getPersonnel(), api.getMetadata()]);
      setPersonnel(pData);
      setDepartments(meta.departments);
      if (meta.departments.length > 0 && !formData.department) {
        setFormData(prev => ({ ...prev, department: meta.departments[0].name }));
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHeaderAction({ 
      label: 'Personnel Actions', 
      onClick: () => {}, 
      customContent: (
        <div className="flex gap-2">
          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20"
          >
            <Upload size={16} /> Import
          </button>
          <button 
            onClick={() => { setEditingPerson(null); setShowAddModal(true); }}
            className="bg-primary-brand text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={16} /> Add Personnel
          </button>
        </div>
      )
    });
    fetchData();
    return () => setHeaderAction(undefined);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPerson) {
        await api.updatePersonnel(editingPerson.id, formData);
        showToast('Personnel profile updated');
      } else {
        await api.createPersonnel(formData);
        showToast('New personnel added to directory');
      }
      setShowAddModal(false);
      setEditingPerson(null);
      fetchData();
      setFormData({ name: '', username: '', password: '', role: '', department: departments[0]?.name || '', email: '', phone: '', userRole: 'user' });
    } catch (error) {
      showToast('Failed to save profile', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this person?')) {
      try {
        await api.deletePersonnel(id);
        showToast('Personnel removed successfully', 'info');
        fetchData();
      } catch (error) {
        showToast('Failed to remove personnel', 'error');
      }
    }
  };

  const openEdit = (person: Personnel) => {
    setEditingPerson(person);
    setFormData({ name: person.name, username: person.username || '', password: '', role: person.role, department: person.department, email: person.email, phone: person.phone || '', userRole: person.userRole || 'user' });
    setShowAddModal(true);
  };

  const filteredPersonnel = personnel.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search personnel..." className="w-full bg-white border border-gray-200/50 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary-brand/10 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPersonnel.map((person) => (
          <motion.div key={person.id} className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="relative">
                  <img src={person.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-gray-100 shadow-sm" />
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px] shadow-sm ${
                    person.userRole === 'admin' ? 'bg-primary-brand' : person.userRole === 'staff' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} title={person.userRole}><ShieldCheck size={12} /></div>
                </div>
                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(person)} className="p-2.5 bg-gray-50 hover:bg-primary-brand hover:text-white rounded-xl text-gray-400 transition-all"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(person.id)} className="p-2.5 bg-gray-50 hover:bg-red-500 hover:text-white rounded-xl text-gray-400 transition-all"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="space-y-1 mb-6 min-w-0">
                <h3 className="text-lg font-bold text-on-surface-brand leading-none truncate">{person.name}</h3>
                <p className="text-sm font-medium text-primary-brand truncate">{person.role}</p>
                <div className="inline-flex mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500">{person.userRole}</div>
              </div>
              <div className="space-y-3 pt-6 border-t border-gray-50 text-xs md:text-sm text-secondary-brand font-medium">
                <div className="flex items-center gap-3"><Briefcase size={16} className="text-gray-300" /><span>{person.department}</span></div>
                <div className="flex items-center gap-3 min-w-0"><Mail size={16} className="text-gray-300" /><span className="truncate">{person.email}</span></div>
              </div>
            </div>
            <div className="bg-[#F9FAFB] px-6 md:px-8 py-4 flex justify-between items-center border-t border-gray-100 group-hover:bg-primary-brand/5 transition-colors">
              <div className="flex items-center gap-2"><Package size={16} className="text-primary-brand" /><span className="text-sm font-bold text-on-surface-brand">{person.assetCount} <span className="hidden sm:inline">Assets</span></span></div>
              <button onClick={() => onViewAssets(person.name)} className="text-[10px] font-bold uppercase tracking-widest text-primary-brand flex items-center gap-1 hover:underline">View <ExternalLink size={12} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]"><h2 className="text-lg md:text-xl font-extrabold text-[#111827]">{editingPerson ? 'Edit Personnel' : 'Add New Personnel'}</h2><button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full transition-all text-gray-400 shadow-sm"><X size={20} /></button></div>
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label><input required type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label><input type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium" placeholder="Optional" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label><input type="password" placeholder={editingPerson ? "Leave blank to keep current" : "••••••••"} className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!editingPerson} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Job Role</label><input required type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Work Email</label><input required type="email" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Telephone</label><input type="tel" className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-medium" placeholder="Optional" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Department</label><select required className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-bold text-primary-brand cursor-pointer" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>{departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Access Role</label><select required className="w-full bg-[#F4F6F8] border-none rounded-xl py-3.5 px-5 text-sm font-bold text-primary-brand cursor-pointer" value={formData.userRole} onChange={(e) => setFormData({...formData, userRole: e.target.value})}><option value="user">User</option><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
                </div>
                <button type="submit" className="w-full bg-primary-brand text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">{editingPerson ? 'Save Changes' : 'Create Profile'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <ImportModal 
            type="personnel" 
            onClose={() => setShowImportModal(false)} 
            onSuccess={fetchData} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
