import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Package, Wrench, Users, BarChart3, Settings, Search, Bell, Menu, ChevronRight, Trash2, Edit, User, Ticket as TicketIcon, ShieldCheck, Zap, LogOut, Loader2, Plus, X, Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen, UserRole, Personnel, Asset, Notification } from './types';
import { api } from './services/api';
import NotificationPopover from './components/NotificationPopover';
import UserProfileModal from './components/UserProfileModal';
import { useToast } from './context/ToastContext';
import { useLanguage } from './context/LanguageContext';
import AnnouncementModal from './components/AnnouncementModal';

// Main Screens
import UserDashboard from './screens/UserDashboard';
import TechnicianDashboard from './screens/TechnicianDashboard';
import CommandCenter from './screens/CommandCenter';
import AssetDetail from './screens/AssetDetail';
import Inventory from './screens/Inventory';
import PersonnelScreen from './screens/Personnel';
import Tickets from './screens/Tickets';
import Login from './screens/Login';
import SettingsScreen from './screens/Settings';
import Billing from './screens/Billing';
import ProfileScreen from './screens/Profile';

// --- Components ---

const Sidebar = ({ 
  currentScreen, 
  onNavigate, 
  user, 
  isOpen, 
  isDesktopOpen = true,
  onClose,
  onSignOut
}: { 
  currentScreen: Screen, 
  onNavigate: (s: Screen) => void, 
  user: Personnel,
  isOpen: boolean,
  isDesktopOpen?: boolean,
  onClose: () => void,
  onSignOut: () => void
}) => {
  const { t } = useLanguage();
  const role = user.userRole || 'user';
  const navItems = useMemo(() => {
    const allItems = [
      { id: 'user-dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard, roles: ['user'] },
      { id: 'technician-dashboard', label: t('sidebar.technician'), icon: Wrench, roles: ['staff', 'admin'] },
      { id: 'command-center', label: t('sidebar.commandCenter'), icon: BarChart3, roles: ['admin'] },
      { id: 'inventory', label: t('sidebar.inventory'), icon: Package, roles: ['admin'] },
      { id: 'personnel', label: t('sidebar.personnel'), icon: Users, roles: ['admin'] },
      { id: 'billing', label: t('sidebar.billing'), icon: Zap, roles: ['admin'] },
      { id: 'tickets', label: t('sidebar.tickets'), icon: TicketIcon, roles: ['user', 'staff', 'admin'] },
      { id: 'profile', label: t('sidebar.profile'), icon: User, roles: ['user'] },
      { id: 'settings', label: t('sidebar.settings'), icon: Settings, roles: ['admin'] },
    ];
    return allItems.filter(item => item.roles.includes(role));
  }, [role, t]);

  const handleSignOut = () => {
    if(confirm('Are you sure you want to sign out?')) {
      sessionStorage.removeItem('primus_user');
      window.location.reload();
    }
  };

  const renderSidebarContent = (expanded: boolean, isMobile: boolean = false) => (
    <div className={`h-full bg-[#111827] flex flex-col pt-8 pb-6 border-r border-white/5 font-sans shadow-2xl transition-all duration-300 overflow-hidden ${expanded ? 'w-64' : 'w-20'}`}>
      <div className={`mb-10 flex items-center ${expanded ? 'px-8 justify-between' : 'px-0 justify-center'}`}>
        <div className={`group cursor-pointer flex flex-col ${expanded ? '' : 'items-center w-full'}`} onClick={() => { onNavigate('user-dashboard'); onClose(); }}>
          <div className={`flex items-center ${expanded ? 'gap-3 mb-1' : 'justify-center'}`}>
            <div className={`bg-primary-brand shrink-0 transition-all ${expanded ? 'w-3 h-3 rounded-[3px]' : 'w-6 h-6 rounded-[6px]'}`} />
            {expanded && <span className="font-headline font-bold text-white text-xl tracking-tight whitespace-nowrap">Resident soft</span>}
          </div>
          {expanded && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary-brand/60 ml-6 flex items-center gap-1 whitespace-nowrap">
              <ShieldCheck size={10} /> {role} {t('sidebar.mode')}
            </div>
          )}
        </div>
        {(expanded && isMobile) && (
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className={`flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar ${expanded ? 'px-4' : 'px-3'}`}>
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              title={!expanded ? item.label : undefined}
              onClick={() => { onNavigate(item.id as Screen); onClose(); }}
              className={`py-3 flex items-center rounded-xl transition-all relative group text-sm ${expanded ? 'px-4 gap-3' : 'px-0 justify-center'} ${
                isActive 
                  ? 'text-primary-brand font-bold bg-primary-brand/10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <item.icon size={expanded ? 18 : 22} className={`shrink-0 transition-transform ${isActive ? 'text-primary-brand' : 'group-hover:scale-110'}`} />
              {expanded && <span className="tracking-wide whitespace-nowrap">{item.label}</span>}
              {isActive && <motion.div layoutId={`activeNav-${isMobile ? 'mob' : 'desk'}`} className="absolute left-0 w-1 h-6 bg-primary-brand rounded-r-full" />}
            </button>
          );
        })}
      </div>

      <div className={`mt-auto flex flex-col gap-1 pt-6 border-t border-white/5 ${expanded ? 'px-4' : 'px-3 items-center'}`}>
        <div className={`py-4 mb-4 rounded-2xl transition-all ${expanded ? 'px-4 bg-white/5 border border-white/5' : 'px-0 bg-transparent flex justify-center w-full'}`}>
          <div className={`flex items-center ${expanded ? 'gap-3' : 'justify-center'}`}>
            <img src={user.avatar} className={`rounded-full border border-white/10 object-cover shrink-0 transition-all ${expanded ? 'w-8 h-8' : 'w-10 h-10'}`} alt="" title={!expanded ? user.name : undefined} />
            {expanded && (
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{user.name}</p>
                <p className="text-[9px] text-gray-500 truncate uppercase tracking-tighter">{user.role}</p>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={onSignOut}
          title={!expanded ? t('sidebar.signOut') : undefined}
          className={`text-gray-400 py-3 flex items-center hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-sm font-bold group ${expanded ? 'px-4 gap-3' : 'px-0 justify-center w-full'}`}
        >
          <LogOut size={expanded ? 18 : 22} className="shrink-0 transition-transform group-hover:scale-110" />
          {expanded && <span className="whitespace-nowrap">{t('sidebar.signOut')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden md:flex fixed left-0 top-0 bottom-0 z-50`}>
        {renderSidebarContent(isDesktopOpen, false)}
      </aside>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl">
              {renderSidebarContent(true, true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const Header = ({ 
  user, 
  action, 
  onMenuOpen,
  onSelectAsset,
  onViewPersonnelAssets,
  onNavigate,
  onNotificationUpdate,
  isDesktopSidebarOpen,
  onToggleDesktopSidebar,
  onSignOut,
  onOpenProfile,
  onOpenAnnouncement
}: { 
  user: Personnel, 
  action?: { label: string, onClick: () => void, customContent?: React.ReactNode }, 
  onMenuOpen: () => void,
  onSelectAsset: (id: string) => void,
  onViewPersonnelAssets: (name: string) => void,
  onNavigate: (s: Screen) => void,
  onNotificationUpdate: () => void,
  isDesktopSidebarOpen?: boolean,
  onToggleDesktopSidebar?: () => void,
  onSignOut: () => void,
  onOpenProfile: () => void,
  onOpenAnnouncement: () => void
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [searchQuery, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ assets: Asset[], personnel: Personnel[] }>({ assets: [], personnel: [] });
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { showToast } = useToast();

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(user.id);
      // Check if there are new notifications compared to previous state
      if (data.length > notifications.length) {
        onNotificationUpdate();
      }
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      showToast('Failed to mark notification as read', 'error');
    }
  };

  const handleNotificationNavigate = (link: string) => {
    setShowNotifications(false);
    if (link === '/tickets') onNavigate('tickets');
    else if (link === '/inventory') onNavigate('inventory');
    else if (link === '/user-dashboard') onNavigate('user-dashboard');
    else if (link.startsWith('/asset/')) {
      const assetId = link.split('/').pop();
      if (assetId) onSelectAsset(assetId);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-surface-brand/80 backdrop-blur-xl flex justify-between items-center w-full px-4 md:px-8 h-20 md:h-24 font-sans border-b border-gray-200/50 md:border-none">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button onClick={onMenuOpen} className="md:hidden p-2 text-secondary-brand hover:bg-gray-100 rounded-lg transition-colors shrink-0"><Menu size={22} /></button>
        <div className="title-group flex items-center gap-1 md:gap-2 min-w-0">
          <button 
            onClick={onToggleDesktopSidebar} 
            className="hidden md:block p-1 text-gray-400 hover:text-primary-brand transition-colors rounded-md hover:bg-gray-100 shrink-0"
          >
            <ChevronRight size={20} className={`transition-transform duration-300 ${isDesktopSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-on-surface-brand leading-none pr-2">
              Resident soft
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="hidden md:flex relative" ref={searchRef}>
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('header.searchPlaceholder')} 
            className="w-48 lg:w-80 bg-white border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary-brand/5 focus:border-primary-brand transition-all shadow-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          />
          
          <AnimatePresence>
            {showResults && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 py-2">
                {searchResults.assets.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('header.assets')}</p>
                    {searchResults.assets.map(a => (
                      <button key={a.id} onClick={() => { onSelectAsset(a.id); setSearchTerm(''); setShowResults(false); }} className="w-full text-left p-3 hover:bg-[#F9FAFB] rounded-xl flex items-center gap-3 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary-brand"><Package size={16} /></div>
                        <div className="min-w-0"><p className="text-xs font-bold text-[#111827] truncate">{a.name}</p><p className="text-[10px] text-gray-400 font-medium">{a.id}</p></div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.personnel.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-2">{t('header.personnel')}</p>
                    {searchResults.personnel.map(p => (
                      <button key={p.id} onClick={() => { onViewPersonnelAssets(p.name); setSearchTerm(''); setShowResults(false); }} className="w-full text-left p-3 hover:bg-[#F9FAFB] rounded-xl flex items-center gap-3 transition-colors">
                        <img src={p.avatar} className="w-8 h-8 rounded-full object-cover" />
                        <div className="min-w-0"><p className="text-xs font-bold text-[#111827] truncate">{p.name}</p><p className="text-[10px] text-gray-400 font-medium">{p.role}</p></div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.assets.length === 0 && searchResults.personnel.length === 0 && (
                  <div className="px-8 py-10 text-center"><p className="text-sm font-medium text-gray-400">{t('header.noMatches')}</p></div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {action && (
          action.customContent ? action.customContent : (
            <button onClick={action.onClick} className="bg-[#111827] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary-brand transition-all shadow-lg flex items-center gap-2">
              <Plus size={16} /> <span className="hidden sm:inline">{action.label}</span>
            </button>
          )
        )}
        
        <div className="flex items-center gap-1 ml-2 pl-4 border-l border-gray-100">
          <button 
            onClick={() => {
              if (language === 'en') setLanguage('th');
              else if (language === 'th') setLanguage('zh-CN');
              else if (language === 'zh-CN') setLanguage('zh-TW');
              else setLanguage('en');
            }}
            className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 transition-colors mr-2"
            title="Switch Language"
          >
            {language === 'en' ? (
              <><img src="https://flagcdn.com/w20/us.png" alt="EN" className="w-4 h-auto rounded-[2px]" /> EN</>
            ) : language === 'th' ? (
              <><img src="https://flagcdn.com/w20/th.png" alt="TH" className="w-4 h-auto rounded-[2px]" /> TH</>
            ) : language === 'zh-CN' ? (
              <><img src="https://flagcdn.com/w20/cn.png" alt="CN" className="w-4 h-auto rounded-[2px]" /> 简</>
            ) : (
              <><img src="https://flagcdn.com/w20/tw.png" alt="TW" className="w-4 h-auto rounded-[2px]" /> 繁</>
            )}
          </button>
          
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`flex p-2 rounded-full transition-all relative ${showNotifications ? 'text-primary-brand bg-primary-brand/5' : 'text-gray-400 hover:text-primary-brand'}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <NotificationPopover 
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onNavigate={handleNotificationNavigate}
                />
              )}
              </AnimatePresence>
            </div>
          
            <div className="relative ml-2" ref={profileMenuRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)} 
                className="focus:outline-none focus:ring-2 focus:ring-primary-brand/50 rounded-full block"
              >
                <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
              </button>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 py-2">
                    <div className="px-4 py-3 border-b border-gray-100 mb-1">
                      <p className="text-sm font-bold text-on-surface-brand truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium truncate uppercase">{user.role}</p>
                    </div>
                    <div className="py-1">
                      {user.userRole !== 'user' && (
                        <button onClick={() => { setShowProfileMenu(false); onOpenAnnouncement(); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-[#F9FAFB] hover:text-primary-brand flex items-center gap-3 transition-colors">
                          <Megaphone size={16} /> {t('announcement.headerMenu')}
                        </button>
                      )}
                      <button onClick={() => { setShowProfileMenu(false); onOpenProfile(); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-[#F9FAFB] hover:text-primary-brand flex items-center gap-3 transition-colors">
                        <User size={16} /> {t('header.myProfile')}
                      </button>
                      <button onClick={() => { setShowProfileMenu(false); onSignOut(); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                        <LogOut size={16} /> {t('header.signOut')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
    </header>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<Personnel | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('user-dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [inventoryInitialFilter, setInventoryInitialFilter] = useState<string>('');
  const [headerAction, setHeaderAction] = useState<{ label: string, onClick: () => void } | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { setLanguage } = useLanguage();

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('primus_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      if (parsedUser.userRole === 'admin') setCurrentScreen('command-center');
      else if (parsedUser.userRole === 'staff') setCurrentScreen('technician-dashboard');
      else setCurrentScreen('user-dashboard');
    }
    setIsAuthChecking(false);
  }, []);

  const handleLogin = (user: Personnel) => { 
    setCurrentUser(user); 
    sessionStorage.setItem('primus_user', JSON.stringify(user)); 
    
    // Auto switch language based on user's preference
    if (user.preferredLanguage) {
      setLanguage(user.preferredLanguage as any);
    }
    
    if (user.userRole === 'admin') setCurrentScreen('command-center');
    else if (user.userRole === 'staff') setCurrentScreen('technician-dashboard');
    else setCurrentScreen('user-dashboard');
  };
  
  const handleUpdateUser = (updatedUser: Personnel) => { 
    setCurrentUser(updatedUser); 
    sessionStorage.setItem('primus_user', JSON.stringify(updatedUser)); 
  };

  const handleSignOut = () => {
    if(confirm('Are you sure you want to sign out?')) {
      sessionStorage.removeItem('primus_user');
      window.location.reload();
    }
  };

  const handleNavigate = (screen: Screen) => { setCurrentScreen(screen); setSelectedAssetId(null); setSelectedTicketId(null); if (screen !== 'inventory') setInventoryInitialFilter(''); };
  const handleSelectAsset = (id: string) => { setSelectedAssetId(id); setCurrentScreen('asset-detail'); };
  const handleViewTicket = (id: string) => { setSelectedTicketId(id); setCurrentScreen('tickets'); };
  const handleViewPersonnelAssets = (personName: string) => { setInventoryInitialFilter(personName); setCurrentScreen('inventory'); };

  if (isAuthChecking) return <div className="h-screen flex items-center justify-center bg-[#F4F6F8]"><Loader2 className="animate-spin text-primary-brand" size={40} /></div>;
  if (!currentUser) return <Login onLogin={handleLogin} />;

  const role = currentUser.userRole || 'user';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F8]">
      <Sidebar currentScreen={currentScreen} onNavigate={handleNavigate} user={currentUser} isOpen={isMobileMenuOpen} isDesktopOpen={isDesktopSidebarOpen} onClose={() => setIsMobileMenuOpen(false)} onSignOut={handleSignOut} />
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isDesktopSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <Header 
          user={currentUser} 
          action={headerAction} 
          onMenuOpen={() => setIsMobileMenuOpen(true)}
          onSelectAsset={handleSelectAsset}
          onViewPersonnelAssets={handleViewPersonnelAssets}
          onNavigate={handleNavigate}
          onNotificationUpdate={triggerRefresh}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          onSignOut={handleSignOut}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenAnnouncement={() => setIsAnnouncementModalOpen(true)}
        />
        <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={currentScreen} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="p-4 md:p-8 pb-20">
              <div className="max-w-7xl mx-auto">
                {currentScreen === 'user-dashboard' && (role === 'user' ? <UserDashboard onViewTicket={handleViewTicket} onNavigate={handleNavigate} user={currentUser} setHeaderAction={setHeaderAction} /> : <AccessDenied />)}
                {currentScreen === 'technician-dashboard' && (role !== 'user' ? <TechnicianDashboard onSelectAsset={handleSelectAsset} setHeaderAction={setHeaderAction} user={currentUser} refreshKey={refreshKey} /> : <AccessDenied />)}
                {currentScreen === 'command-center' && (role === 'admin' ? <CommandCenter onNavigate={handleNavigate} setHeaderAction={setHeaderAction} /> : <AccessDenied />)}
                {currentScreen === 'inventory' && <Inventory setHeaderAction={setHeaderAction} user={currentUser} onSelectAsset={handleSelectAsset} />}
                {currentScreen === 'personnel' && (role !== 'user' ? <PersonnelScreen setHeaderAction={setHeaderAction} user={currentUser} /> : <AccessDenied />)}
                {currentScreen === 'billing' && (role !== 'user' ? <Billing setHeaderAction={setHeaderAction} user={currentUser} /> : <AccessDenied />)}
                {currentScreen === 'profile' && (role === 'user' ? <ProfileScreen user={currentUser} /> : <AccessDenied />)}
                {currentScreen === 'tickets' && <Tickets initialTicketId={selectedTicketId} setHeaderAction={setHeaderAction} onSelectAsset={handleSelectAsset} user={currentUser} refreshKey={refreshKey} />}
                {currentScreen === 'settings' && (role === 'admin' ? <SettingsScreen user={currentUser} onUpdateUser={handleLogin} setHeaderAction={setHeaderAction} /> : <AccessDenied />)}
                {currentScreen === 'asset-detail' && <AssetDetail id={selectedAssetId} onNavigate={handleNavigate} user={currentUser} setHeaderAction={setHeaderAction} />}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      {currentUser && (
        <>
          <UserProfileModal 
            user={currentUser}
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            onUserUpdated={handleUpdateUser}
          />
          <AnnouncementModal
            isOpen={isAnnouncementModalOpen}
            onClose={() => setIsAnnouncementModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}

const AccessDenied = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-error-brand/10 text-error-brand rounded-full flex items-center justify-center mb-6"><ShieldCheck size={40} /></div>
      <h2 className="text-xl md:text-2xl font-bold text-on-surface-brand mb-2">{t('common.accessDenied')}</h2>
      <p className="text-secondary-brand max-w-sm text-sm font-medium">{t('common.accessDeniedDesc')}</p>
    </div>
  );
};
