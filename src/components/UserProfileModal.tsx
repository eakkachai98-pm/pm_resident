import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Upload, User, Mail, Phone, Briefcase, Lock, Shield } from 'lucide-react';
import { Personnel } from '../types';
import { useToast } from '../context/ToastContext';

interface UserProfileModalProps {
  user: Personnel;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: Personnel) => void;
}

export default function UserProfileModal({ user, isOpen, onClose, onUserUpdated }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Profile Form State
  const [formData, setFormData] = useState({
    name: user.name || '',
    avatar: user.avatar || '',
    phone: user.phone || '',
    email: user.email || '',
    role: user.role || ''
  });
  
  // Security Form State
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name || '',
        avatar: user.avatar || '',
        phone: user.phone || '',
        email: user.email || '',
        role: user.role || ''
      });
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setActiveTab('profile');
    }
  }, [isOpen, user]);

  const canEditAdvanced = user.userRole === 'admin' || user.userRole === 'staff';

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a temporary object URL for immediate display
      // Ideally this would be uploaded to a backend
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedUser = { ...user, ...formData };
      onUserUpdated(updatedUser);
      showToast('Profile updated successfully', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (securityData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setIsSaving(true);
    try {
      // Simulate API call for password change
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast('Password changed successfully', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to change password', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB] shrink-0">
              <h2 className="text-xl font-extrabold text-[#111827]">Settings</h2>
              <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex border-b border-gray-100 shrink-0 relative">
              <button 
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors relative ${activeTab === 'profile' ? 'text-primary-brand' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <User size={16} /> My Profile
                {activeTab === 'profile' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-brand" />}
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors relative ${activeTab === 'security' ? 'text-primary-brand' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Shield size={16} /> Security
                {activeTab === 'security' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-brand" />}
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar relative">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.form key="profile" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative group mb-4 cursor-pointer" onClick={handleAvatarClick}>
                        <img src={formData.avatar || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-full object-cover border-4 border-[#F4F6F8] shadow-sm transition-all group-hover:border-primary-brand/30" alt="Profile" />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <Upload size={24} className="text-white" />
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <input 
                        type="text" 
                        placeholder="Or paste Avatar URL" 
                        className="w-full max-w-xs bg-[#F4F6F8] border-none rounded-xl py-2 px-4 text-xs font-medium text-center focus:ring-2 focus:ring-primary-brand/20 transition-all text-gray-500"
                        value={formData.avatar}
                        onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          required
                          type="text" 
                          placeholder="Full Name" 
                          className="w-full bg-[#F9FAFB] border-none rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>

                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="tel" 
                          placeholder="Phone Number" 
                          className="w-full bg-[#F9FAFB] border-none rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>

                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          required
                          type="email" 
                          placeholder="Email Address" 
                          disabled={!canEditAdvanced}
                          className={`w-full border-none rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all ${canEditAdvanced ? 'bg-[#F9FAFB]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                        {!canEditAdvanced && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Read-only</span>}
                      </div>

                      <div className="relative">
                        <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          required
                          type="text" 
                          placeholder="Role / Title" 
                          disabled={!canEditAdvanced}
                          className={`w-full border-none rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all ${canEditAdvanced ? 'bg-[#F9FAFB]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                        />
                        {!canEditAdvanced && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Read-only</span>}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="w-full bg-primary-brand text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-70 transition-all flex justify-center items-center gap-2 mt-4"
                    >
                      {isSaving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Save size={16} />}
                      {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </motion.form>
                )}
                
                {activeTab === 'security' && (
                  <motion.form key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} onSubmit={handleSecuritySubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          required
                          type="password" 
                          placeholder="Current Password" 
                          className="w-full bg-[#F9FAFB] border-none rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all"
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                        />
                      </div>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          required
                          type="password" 
                          placeholder="New Password" 
                          className="w-full bg-[#F9FAFB] border-none rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all"
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                        />
                      </div>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          required
                          type="password" 
                          placeholder="Confirm New Password" 
                          className="w-full bg-[#F9FAFB] border-none rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-brand/20 transition-all"
                          value={securityData.confirmPassword}
                          onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="w-full bg-[#111827] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:bg-gray-800 disabled:opacity-70 transition-all flex justify-center items-center gap-2 mt-4"
                    >
                      {isSaving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Shield size={16} />}
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
