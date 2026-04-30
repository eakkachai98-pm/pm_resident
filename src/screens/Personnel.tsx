import { useState, useEffect } from 'react';
import { Users, Mail, Phone, Home, Search, MoreVertical, Plus, Filter, X, Edit, Trash2, ShieldCheck, Loader2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function Tenants({ 
  setHeaderAction, 
  user 
}: { 
  setHeaderAction: (a: any) => void, 
  user: any
}) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.userRole !== 'user') {
      setHeaderAction({ 
        label: 'Manage Tenants', 
        onClick: () => {}, 
        customContent: (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-primary-brand text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={16} /> Add Tenant
            </button>
          </div>
        )
      });
    } else {
      setHeaderAction(undefined);
    }
    fetchData();
    return () => setHeaderAction(undefined);
  }, [user.userRole]);

  const filteredTenants = tenants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search tenants by name or email..." className="w-full bg-white border border-gray-200/50 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary-brand/10 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((person) => {
          const activeLease = person.leases?.find((l: any) => l.isActive);
          
          return (
          <motion.div key={person.id} className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                    <Users size={32} />
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px] shadow-sm ${
                    person.role === 'ADMIN' ? 'bg-primary-brand' : person.role === 'STAFF' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`} title={person.role}><ShieldCheck size={12} /></div>
                </div>
                {user.userRole !== 'user' && (
                  <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2.5 bg-gray-50 hover:bg-primary-brand hover:text-white rounded-xl text-gray-400 transition-all"><Edit size={18} /></button>
                  </div>
                )}
              </div>
              <div className="space-y-1 mb-6 min-w-0">
                <h3 className="text-lg font-bold text-on-surface-brand leading-none truncate">{person.name}</h3>
                <div className="inline-flex mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500">{person.role}</div>
              </div>
              <div className="space-y-3 pt-6 border-t border-gray-50 text-xs md:text-sm text-secondary-brand font-medium">
                <div className="flex items-center gap-3"><Phone size={16} className="text-gray-300" /><span>{person.phone || 'No phone'}</span></div>
                <div className="flex items-center gap-3 min-w-0"><Mail size={16} className="text-gray-300" /><span className="truncate">{person.email}</span></div>
              </div>
            </div>
            <div className={`px-6 md:px-8 py-4 flex justify-between items-center border-t border-gray-100 transition-colors ${activeLease ? 'bg-emerald-50/50' : 'bg-[#F9FAFB]'}`}>
              <div className="flex items-center gap-2">
                <Home size={16} className={activeLease ? 'text-emerald-600' : 'text-gray-400'} />
                <span className={`text-sm font-bold ${activeLease ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {activeLease ? `Room ${activeLease.roomId}` : 'No Active Lease'}
                </span>
              </div>
            </div>
          </motion.div>
        )})}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center">
              <h2 className="text-xl font-bold mb-4">Add Tenant Feature</h2>
              <p className="text-gray-500">Tenant creation is currently restricted to Admin backend or during initial data import.</p>
              <button onClick={() => setShowAddModal(false)} className="mt-6 bg-primary-brand text-white px-6 py-2 rounded-xl font-bold">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
