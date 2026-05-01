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
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', roomId: '', startDate: new Date().toISOString().split('T')[0],
    nationality: 'Thai', identityNumber: '', preferredLanguage: 'th', emergencyContact: '', visaExpiryDate: '', tm30Reported: false
  });

  useEffect(() => {
    if (showAddModal) {
      fetch('/api/rooms').then(res => res.json()).then(data => setAvailableRooms(data.filter((r: any) => r.status === 'Active'))).catch(console.error);
    }
  }, [showAddModal]);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showToast('Tenant and Lease created successfully', 'success');
        setShowAddModal(false);
        fetchData();
        setFormData({ name: '', email: '', phone: '', roomId: '', startDate: new Date().toISOString().split('T')[0], nationality: 'Thai', identityNumber: '', preferredLanguage: 'th', emergencyContact: '', visaExpiryDate: '', tm30Reported: false });
      } else {
        const err = await response.json();
        showToast(err.message || 'Failed to add tenant', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500">{person.role}</div>
                  
                  {person.nationality === 'Foreigner' ? (
                    <div className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-purple-50 text-purple-600 border border-purple-100" title="Foreigner">🌍 FGN</div>
                  ) : person.nationality === 'Thai' ? (
                    <div className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100" title="Thai">🇹🇭 THA</div>
                  ) : null}

                  {person.preferredLanguage === 'zh-CN' && <div className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100" title="Simplified Chinese">🇨🇳 简</div>}
                  {person.preferredLanguage === 'zh-TW' && <div className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100" title="Traditional Chinese">🇹🇼 繁</div>}
                  {person.preferredLanguage === 'en' && <div className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-200" title="English">🇺🇸 EN</div>}
                  {person.preferredLanguage === 'th' && <div className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100" title="Thai Language">🇹🇭 TH</div>}
                </div>
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
                  {activeLease ? `Room ${activeLease.room?.roomNumber || activeLease.roomId}` : 'No Active Lease'}
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
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-on-surface-brand flex items-center gap-2">
                  <Plus size={20} className="text-primary-brand" /> Add New Tenant
                </h2>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-2 bg-white hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-all shadow-sm">
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto">
                <form onSubmit={handleAddTenant} className="space-y-5">
                  <div className="space-y-1.5 text-left">
                    <label className="text-sm font-bold text-gray-700">Full Name</label>
                    <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">Email (Username)</label>
                      <input required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">Phone</label>
                      <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="081-xxx-xxxx" />
                    </div>
                  </div>

                  <div className="pt-4 pb-2"><div className="h-px w-full bg-gray-100"></div></div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">Nationality</label>
                      <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value, identityNumber: '', visaExpiryDate: '', tm30Reported: false})}>
                        <option value="Thai">Thai (คนไทย)</option>
                        <option value="Foreigner">Foreigner (ต่างชาติ)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">Preferred UI Language</label>
                      <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.preferredLanguage} onChange={e => setFormData({...formData, preferredLanguage: e.target.value})}>
                        <option value="th">ภาษาไทย (Thai)</option>
                        <option value="en">English</option>
                        <option value="zh-CN">中文 - 简体 (Simplified)</option>
                        <option value="zh-TW">中文 - 繁體 (Traditional)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-sm font-bold text-gray-700">{formData.nationality === 'Thai' ? 'ID Card Number' : 'Passport Number'}</label>
                    <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.identityNumber} onChange={e => setFormData({...formData, identityNumber: e.target.value})} placeholder={formData.nationality === 'Thai' ? "เลขบัตรประชาชน 13 หลัก" : "Passport No."} />
                  </div>

                  {formData.nationality === 'Foreigner' && (
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">Visa Expiry Date</label>
                        <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.visaExpiryDate} onChange={e => setFormData({...formData, visaExpiryDate: e.target.value})} />
                      </div>
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="flex items-center gap-3 p-3 border border-orange-200 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors">
                          <input type="checkbox" className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500" checked={formData.tm30Reported} onChange={e => setFormData({...formData, tm30Reported: e.target.checked})} />
                          <span className="text-sm font-bold text-orange-800">TM.30 Reported?</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <label className="text-sm font-bold text-gray-700">Emergency Contact</label>
                    <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} placeholder="Name & Phone Number" />
                  </div>

                  <div className="pt-4 pb-2"><div className="h-px w-full bg-gray-100"></div></div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-sm font-bold text-gray-700">Select Room</label>
                    <select required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}>
                      <option value="">-- Choose Available Room --</option>
                      {availableRooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name} - ฿{r.price}/mo</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-sm font-bold text-gray-700">Move-in Date</label>
                    <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-brand/20 transition-all" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>

                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs font-medium border border-blue-100 flex items-start gap-3 text-left">
                    <span className="text-lg">⚡</span>
                    <p>Initial meter readings will be automatically fetched from the digital smart meters and synchronized with the move-in date.</p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-600 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 bg-primary-brand text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary-brand/20 disabled:opacity-50 flex items-center justify-center">
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Move-in'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
