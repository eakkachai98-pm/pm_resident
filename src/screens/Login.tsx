import { useState } from 'react';
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { Personnel } from '../types';
import { useToast } from '../context/ToastContext';

export default function Login({ onLogin }: { onLogin: (u: Personnel) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await api.login({ email, password });
      showToast(`Welcome back, ${user.name}!`, 'success');
      onLogin(user);
    } catch (err) {
      console.warn('API Login failed, trying local fallback...', err);
      const localUsers = [
        { id: 'P-001', name: 'Alex Rivera', role: 'Senior Designer', department: 'Design', email: 'alex.r@primus.pro', avatar: 'https://picsum.photos/seed/alex/100/100', joinedDate: '2022-03-12', userRole: 'admin' },
        { id: 'P-002', name: 'Sarah Jenkins', role: 'Marketing Manager', department: 'Marketing', email: 'sarah.j@primus.pro', avatar: 'https://picsum.photos/seed/sarah/100/100', joinedDate: '2023-01-15', userRole: 'staff' },
        { id: 'P-003', name: 'Marcus Wade', role: 'Lead Developer', department: 'Engineering', email: 'marcus.w@primus.pro', avatar: 'https://picsum.photos/seed/marcus/100/100', joinedDate: '2021-11-05', userRole: 'user' }
      ];

      const foundUser = localUsers.find(u => u.email === email && password === 'password123');
      if (foundUser) {
        showToast('Login successful (Local Mode)', 'info');
        onLogin(foundUser as any);
      } else {
        setError('Invalid credentials.');
        showToast('Login failed. Check your email and password.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="flex flex-col items-center gap-5"
          >
            <img 
              src="/images/logo.png" 
              alt="Primus Pro Logo" 
              className="h-20 w-auto object-contain drop-shadow-md" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
            <div>
              <h1 className="text-4xl font-black text-[#111827] tracking-tighter leading-none mb-2">Primus Pro</h1>
              <p className="text-gray-400 font-bold uppercase tracking-[0.25em] text-[10px]">Infrastructure OS</p>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-200/50 shadow-2xl shadow-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Username or Email</label><div className="relative group"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#3B82F6] transition-colors" /><input required type="text" placeholder="name@primus.pro or username" className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
            <div className="space-y-1.5"><div className="flex justify-between items-center ml-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Password</label><button type="button" className="text-[10px] font-bold text-[#3B82F6] hover:underline">Forgot?</button></div><div className="relative group"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#3B82F6] transition-colors" /><input required type="password" placeholder="••••••••" className="w-full bg-[#F4F6F8] border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" value={password} onChange={(e) => setPassword(e.target.value)} /></div></div>
            <button type="submit" disabled={loading} className="w-full bg-[#3B82F6] text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={18} /> : <>Sign In <ArrowRight size={18} /></>}</button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mb-4">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" className="bg-emerald-50 text-emerald-700 p-2 rounded-xl text-[9px] font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors" onClick={() => { setEmail('alex.r@primus.pro'); setPassword('password123'); }}>Admin</button>
              <button type="button" className="bg-blue-50 text-blue-700 p-2 rounded-xl text-[9px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors" onClick={() => { setEmail('sarah.j@primus.pro'); setPassword('password123'); }}>Staff</button>
              <button type="button" className="bg-purple-50 text-purple-700 p-2 rounded-xl text-[9px] font-bold border border-purple-100 hover:bg-purple-100 transition-colors" onClick={() => { setEmail('marcus.w@primus.pro'); setPassword('password123'); }}>User</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
