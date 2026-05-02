import { useState, useEffect } from 'react';
import { User, FileText, Download, ShieldCheck, Mail, Phone, Calendar, MapPin, Loader2, Globe, FileBadge } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileScreen({ user }: { user: any }) {
  const { t, language } = useLanguage();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [myRoom, setMyRoom] = useState<any>(null);
  const [activeLease, setActiveLease] = useState<any>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch active lease
        const leasesRes = await fetch('/api/leases');
        if (leasesRes.ok) {
          const leasesData = await leasesRes.json();
          const myActiveLease = leasesData.find((l: any) => l.tenantId === user.id && l.isActive);
          if (myActiveLease) {
            setActiveLease(myActiveLease);
            setMyRoom(myActiveLease.room);
          }
        }

        // Fetch documents
        const docsRes = await fetch(`/api/tenants/${user.id}/documents`);
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(docsData);
        }
      } catch (err) {
        console.error('Failed to fetch profile data', err);
      } finally {
        setLoadingDocs(false);
      }
    };
    
    fetchProfileData();
  }, [user.id]);

  const handleDownload = async (docId: string, docName: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      
      const link = document.createElement('a');
      link.href = data.fileData;
      link.download = data.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download document', error);
      alert('Failed to download document');
    }
  };

  const getNationalityLabel = (nat: string) => {
    if (!nat) return '';
    if (nat.toLowerCase() === 'thai') return t('profile.thaiCitizen');
    return t('profile.foreignerCitizen');
  };

  return (
    <div className="space-y-6 md:space-y-8 font-sans pb-10">
      <header className="flex flex-col gap-1 px-1">
        <h2 className="text-xl md:text-2xl font-bold text-on-surface-brand tracking-tight">
          {t('profile.title')}
        </h2>
        <p className="text-xs md:text-sm text-secondary-brand">
          {t('profile.subtitle')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Personal Information */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden relative p-8">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-brand/20 to-blue-50/10"></div>
            
            <div className="relative z-10 flex flex-col items-center mt-4">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white mb-4">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-black text-[#111827] text-center">{user.name}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 mb-2 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-500" /> {user.role === 'RESIDENT' ? t('profile.tenant') : user.role}
              </p>
              
              <div className="bg-primary-brand/5 text-primary-brand border border-primary-brand/10 px-4 py-1.5 rounded-full text-sm font-extrabold flex items-center gap-2 mt-2 shadow-sm">
                <MapPin size={16} />
                {t('profile.room')} {myRoom?.roomNumber || '-'}
              </div>
            </div>

            <div className="mt-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Mail size={12} /> {t('profile.email')}
                  </label>
                  <div className="text-sm font-bold text-[#111827] truncate">{user.email}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Phone size={12} /> {t('profile.phone')}
                  </label>
                  <div className="text-sm font-bold text-[#111827] truncate">{user.phone || '-'}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Globe size={12} /> {t('profile.nationality')}
                  </label>
                  <div className="text-sm font-bold text-[#111827] truncate">{getNationalityLabel(user.nationality)}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <FileBadge size={12} /> {t('profile.idPassport')}
                  </label>
                  <div className="text-sm font-bold text-[#111827] truncate">
                    {user.identityNumber ? user.identityNumber.replace(/(.{3})/g, '$1 ').trim() : '-'}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Calendar size={14} /> {t('profile.leaseInfo')}
                </h4>
                <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('profile.leaseStartDate')}</p>
                    <p className="text-sm font-bold text-[#111827]">
                      {activeLease?.startDate ? new Date(activeLease.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('profile.status')}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-sm font-bold text-emerald-600">{t('profile.active')}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: My Documents */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
              <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
                <FileText size={20} className="text-primary-brand" /> 
                {t('profile.myDocuments')}
              </h3>
              <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-xs font-bold text-gray-500 shadow-sm">
                {documents.length} {t('profile.files')}
              </div>
            </div>

            <div className="p-8 flex-1">
              {loadingDocs ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="animate-spin text-primary-brand" size={32} />
                </div>
              ) : documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-brand/30 transition-all flex flex-col justify-between h-40">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                          <FileText size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#111827] truncate mb-1 group-hover:text-primary-brand transition-colors" title={doc.name}>
                            {doc.name}
                          </h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDownload(doc.id, doc.name)}
                        className="w-full mt-4 bg-[#F4F6F8] text-gray-600 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download size={14} /> {t('profile.download')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <FileText size={32} className="text-gray-300" />
                  </div>
                  <h4 className="text-base font-bold text-[#111827] mb-2">{t('profile.noDocsTitle')}</h4>
                  <p className="text-sm text-gray-500 max-w-sm">
                    {t('profile.noDocsDesc')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
