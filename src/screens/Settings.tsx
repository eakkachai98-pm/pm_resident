import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Database, Users, Package, Loader2, X, ShieldCheck, Bell, Mail, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Personnel } from '../types';

export default function SettingsScreen({ user, onUpdateUser, setHeaderAction }: { user: Personnel, onUpdateUser: (u: Personnel) => void, setHeaderAction: (a: any) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  const [newCat, setNewCat] = useState('');
  const [newDept, setNewDept] = useState('');
  
  const [smtpSettings, setSmtpSettings] = useState({ smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '' });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [utilityRates, setUtilityRates] = useState({ waterRate: '18', electricRate: '8' });
  const [savingRates, setSavingRates] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'smtp' | 'pricing' | 'roles'>('preferences');

  // Notification states
  const [prefs, setPrefs] = useState({
    notifyEmail: user.notifyEmail ?? true,
    notifyInApp: user.notifyInApp ?? true,
    notifySystem: user.notifySystem ?? true
  });

  const fetchData = async () => {
    try {
      // Pricing configs could be fetched from api.getSettings() if backend supports it
      // For now we will just use the hardcoded state as default
      
      try {
        const settingsData = await api.getSettings();
        setSmtpSettings({
          smtpHost: settingsData?.smtpHost || '',
          smtpPort: settingsData?.smtpPort || '',
          smtpUser: settingsData?.smtpUser || '',
          smtpPass: settingsData?.smtpPass || ''
        });
        if (settingsData?.waterRate) setUtilityRates(prev => ({...prev, waterRate: settingsData.waterRate}));
        if (settingsData?.electricRate) setUtilityRates(prev => ({...prev, electricRate: settingsData.electricRate}));
      } catch (e) {
        console.warn('Settings API not available yet or failed', e);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setHeaderAction(undefined);
    fetchData(); 
  }, []);

  const handleTogglePref = async (key: keyof typeof prefs) => {
    const newVal = !prefs[key];
    const updatedPrefs = { ...prefs, [key]: newVal };
    setPrefs(updatedPrefs);

    try {
      const updatedUser = await api.updatePersonnel(user.id, updatedPrefs);
      onUpdateUser(updatedUser);
      showToast('Preferences updated');
    } catch (error) {
      showToast('Failed to update preferences', 'error');
      setPrefs(prefs); // Revert
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRates(true);
    try {
      await api.saveSettings({ ...smtpSettings, ...utilityRates });
      showToast('Utility rates updated successfully');
    } catch (error) {
      showToast('Failed to update utility rates', 'error');
    } finally {
      setSavingRates(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    try {
      await api.saveSettings(smtpSettings);
      showToast('SMTP Configuration saved successfully');
    } catch (error) {
      showToast('Failed to save SMTP settings', 'error');
    } finally {
      setSavingSmtp(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 font-sans flex flex-col md:flex-row gap-8 md:gap-12">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0 space-y-2">
        <header className="mb-8">
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Settings</h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Manage system configurations.</p>
        </header>

        <button onClick={() => setActiveTab('preferences')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'preferences' ? 'bg-[#111827] text-white shadow-xl shadow-gray-900/20' : 'text-gray-500 hover:bg-white hover:text-[#111827] hover:shadow-sm border border-transparent hover:border-gray-100'}`}>
          <Bell size={18} /> Notifications
        </button>
        <button onClick={() => setActiveTab('smtp')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'smtp' ? 'bg-[#111827] text-white shadow-xl shadow-gray-900/20' : 'text-gray-500 hover:bg-white hover:text-[#111827] hover:shadow-sm border border-transparent hover:border-gray-100'}`}>
          <Mail size={18} /> Email & SMTP
        </button>
        <button onClick={() => setActiveTab('pricing')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'pricing' ? 'bg-[#111827] text-white shadow-xl shadow-gray-900/20' : 'text-gray-500 hover:bg-white hover:text-[#111827] hover:shadow-sm border border-transparent hover:border-gray-100'}`}>
          <Database size={18} /> Utility Pricing
        </button>
        <button onClick={() => setActiveTab('roles')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'roles' ? 'bg-[#111827] text-white shadow-xl shadow-gray-900/20' : 'text-gray-500 hover:bg-white hover:text-[#111827] hover:shadow-sm border border-transparent hover:border-gray-100'}`}>
          <ShieldCheck size={18} /> Access Roles
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {activeTab === 'preferences' && (
            <motion.div key="preferences" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <section className="bg-white rounded-[2rem] p-8 border border-gray-200/50 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Bell size={20} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">Notification Preferences</h3>
                    <p className="text-xs text-gray-400 font-medium">Choose how you want to be alerted.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'notifyEmail', label: 'Email Alerts', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Summary of ticket updates' },
                    { key: 'notifyInApp', label: 'In-App Notifications', icon: Monitor, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Bell icon red dots' },
                    { key: 'notifySystem', label: 'Critical Alerts', icon: ShieldCheck, color: 'text-red-500', bg: 'bg-red-50', desc: 'Security & system changes' },
                  ].map((item) => (
                    <div 
                      key={item.key} 
                      className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between h-44 ${prefs[item.key as keyof typeof prefs] ? 'bg-white border-gray-200 shadow-md' : 'bg-gray-50 border-transparent opacity-60 hover:opacity-100'}`}
                      onClick={() => handleTogglePref(item.key as any)}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}><item.icon size={20} /></div>
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${prefs[item.key as keyof typeof prefs] ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <motion.div 
                            animate={{ x: prefs[item.key as keyof typeof prefs] ? 18 : 2 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">{item.label}</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'smtp' && (
            <motion.div key="smtp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <section className="bg-white rounded-[2rem] p-8 border border-gray-200/50 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm"><Mail size={20} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">Email Server (SMTP)</h3>
                    <p className="text-xs text-gray-400 font-medium">Configure outgoing email server for notifications.</p>
                  </div>
                </div>
                <form onSubmit={handleSaveSmtp} className="space-y-5 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">SMTP Host</label><input type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 transition-all" value={smtpSettings.smtpHost} onChange={e => setSmtpSettings({...smtpSettings, smtpHost: e.target.value})} placeholder="smtp.gmail.com" /></div>
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">SMTP Port</label><input type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 transition-all" value={smtpSettings.smtpPort} onChange={e => setSmtpSettings({...smtpSettings, smtpPort: e.target.value})} placeholder="587" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Username / Email</label><input type="text" className="w-full bg-[#F4F6F8] border-none rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 transition-all" value={smtpSettings.smtpUser} onChange={e => setSmtpSettings({...smtpSettings, smtpUser: e.target.value})} placeholder="email@example.com" /></div>
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Password</label><input type="password" className="w-full bg-[#F4F6F8] border-none rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 transition-all" value={smtpSettings.smtpPass} onChange={e => setSmtpSettings({...smtpSettings, smtpPass: e.target.value})} placeholder="App Password" /></div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 mt-6">
                    <button type="submit" disabled={savingSmtp} className="bg-[#111827] text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:bg-gray-800 disabled:opacity-50 transition-all">
                      {savingSmtp ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              </section>
            </motion.div>
          )}

          {activeTab === 'pricing' && (
            <motion.div key="pricing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <section className="bg-white rounded-[2rem] p-8 border border-gray-200/50 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm"><Database size={20} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">Utility Pricing</h3>
                    <p className="text-xs text-gray-400 font-medium">Configure base rates for electricity and water billing.</p>
                  </div>
                </div>
                <form onSubmit={handleSavePricing} className="space-y-5 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Electric Rate (฿/Unit)</label>
                      <input type="number" step="0.1" className="w-full bg-[#F4F6F8] border-none rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all text-[#111827]" value={utilityRates.electricRate} onChange={e => setUtilityRates({...utilityRates, electricRate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Water Rate (฿/Unit)</label>
                      <input type="number" step="0.1" className="w-full bg-[#F4F6F8] border-none rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all text-[#111827]" value={utilityRates.waterRate} onChange={e => setUtilityRates({...utilityRates, waterRate: e.target.value})} />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 mt-6">
                    <button type="submit" disabled={savingRates} className="bg-[#111827] text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:bg-gray-800 disabled:opacity-50 transition-all">
                      {savingRates ? 'Saving...' : 'Save Rates'}
                    </button>
                  </div>
                </form>
              </section>
            </motion.div>
          )}

          {activeTab === 'roles' && (
            <motion.div key="roles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <section className="bg-[#111827] rounded-[2rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-brand/10 blur-[100px] rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8"><ShieldCheck size={24} className="text-primary-brand" /><h3 className="text-xl font-bold">Access Matrix</h3></div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-sm"><p className="text-[10px] font-extrabold text-primary-brand uppercase tracking-[0.2em] mb-3">Administrator</p><p className="text-xs text-gray-400 leading-relaxed font-medium">Global control, metadata management, system settings, and personnel auditing.</p></div>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-sm"><p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-[0.2em] mb-3">Staff / Technician</p><p className="text-xs text-gray-400 leading-relaxed font-medium">Work order execution, status monitoring, ticket claiming, and inventory tracking.</p></div>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-sm"><p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-[0.2em] mb-3">General User</p><p className="text-xs text-gray-400 leading-relaxed font-medium">Personal asset views, maintenance request tracking, and profile management.</p></div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
