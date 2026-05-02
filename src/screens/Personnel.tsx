import { useState, useEffect } from 'react';
import { Users, Mail, Phone, Home, Search, Plus, X, Edit, ShieldCheck, Loader2, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';

// ── helpers ──────────────────────────────────────────────
function getInitial(name: string) {
  return name?.trim()?.[0]?.toUpperCase() ?? '?';
}

const AVATAR_PALETTES = [
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#dbeafe', color: '#1e40af' },
  { bg: '#ffedd5', color: '#9a3412' },
];
function palette(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[h];
}

// Derive floor from lease — mirrors Inventory.tsx logic EXACTLY
function floorFromLease(lease: any): number | null {
  if (!lease) return null; // Tenants without a lease don't belong to a floor

  // 1. Use location field if available
  const loc: string | undefined = lease?.room?.location;
  if (loc) {
    const f = parseInt(loc.replace('Floor ', '').trim(), 10);
    if (!isNaN(f) && f >= 1) return f;
  }
  
  // 2. Fall back to room number logic
  const roomNum: string | undefined = lease?.room?.roomNumber;
  if (roomNum) {
    const digits = roomNum.replace(/\D/g, '');
    if (digits) {
      const n = parseInt(digits, 10);
      if (!isNaN(n) && n >= 100) return Math.floor(n / 100);
    }
  }

  // 3. Exact match to Inventory.tsx: if we have a room but can't parse floor, default to Floor 1
  return 1;
}

// ── component ─────────────────────────────────────────────
export default function Tenants({
  setHeaderAction,
  user,
}: {
  setHeaderAction: (a: any) => void;
  user: any;
}) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloor, setFilterFloor] = useState('All');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', roomId: '',
    startDate: new Date().toISOString().split('T')[0],
    nationality: 'Thai', identityNumber: '', preferredLanguage: 'th',
    emergencyContact: '', visaExpiryDate: '', tm30Reported: false,
  });

  const { showToast } = useToast();

  // fetch available rooms when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetch('/api/rooms')
        .then(r => r.json())
        .then(data => setAvailableRooms(data.filter((r: any) => r.status === 'Active')))
        .catch(console.error);
    }
  }, [showAddModal]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/users');
      setTenants(await res.json());
    } catch (e) {
      console.error(e);
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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={15} /> Add Tenant
          </button>
        ),
      });
    } else {
      setHeaderAction(undefined);
    }
    fetchData();
    return () => setHeaderAction(undefined);
  }, [user.userRole]);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast('Tenant and Lease created successfully', 'success');
        setShowAddModal(false);
        fetchData();
        setFormData({ name: '', email: '', phone: '', roomId: '', startDate: new Date().toISOString().split('T')[0], nationality: 'Thai', identityNumber: '', preferredLanguage: 'th', emergencyContact: '', visaExpiryDate: '', tm30Reported: false });
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to add tenant', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  // ── derive floors from data (use room.location, same as Inventory.tsx) ──
  const allFloors = [...new Set(
    tenants
      .map(t => {
        const lease = t.leases?.find((l: any) => l.isActive);
        return floorFromLease(lease);
      })
      .filter((f): f is number => f !== null)
  )].sort((a, b) => a - b);

  // ── filter ───────────────────────────────────────────────────────────────
  const filtered = tenants.filter(t => {
    const lease = t.leases?.find((l: any) => l.isActive);
    const roomNum: string = lease?.room?.roomNumber ?? '';

    if (filterFloor !== 'All') {
      const f = floorFromLease(lease);
      if (f?.toString() !== filterFloor) return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.phone?.includes(searchTerm) ||
        roomNum.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── stat counts ──────────────────────────────────────────
  const activeCount = tenants.filter(t => t.leases?.some((l: any) => l.isActive)).length;
  const foreignerCount = tenants.filter(t => t.nationality === 'Foreigner').length;

  // ── nationality badge ────────────────────────────────────
  const NatBadge = ({ nationality, lang }: { nationality: string; lang: string }) => {
    if (nationality === 'Foreigner') {
      if (lang === 'zh-CN') return <span className="pill bg-red-50 text-red-700 border border-red-100">🇨🇳 CN</span>;
      if (lang === 'zh-TW') return <span className="pill bg-orange-50 text-orange-700 border border-orange-100">🇹🇼 TW</span>;
      return <span className="pill bg-amber-50 text-amber-700 border border-amber-100">🌍 Foreigner</span>;
    }
    return <span className="pill bg-blue-50 text-blue-700 border border-blue-100">🇹🇭 Thai</span>;
  };

  return (
    <div className="space-y-5 font-sans">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tenants',  value: tenants.length, color: 'text-indigo-600',  bg: 'bg-indigo-50',  icon: '👥' },
          { label: 'Active Leases',  value: activeCount,    color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🏠' },
          { label: 'Foreigners',     value: foreignerCount, color: 'text-amber-500',   bg: 'bg-amber-50',   icon: '🌍' },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            </div>
            <div className={`${bg} w-11 h-11 rounded-xl flex items-center justify-center text-xl`}>{icon}</div>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl px-5 py-3.5 flex flex-wrap items-center gap-3 shadow-sm border border-gray-100">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, room, or phone…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 pl-9 pr-4 text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:bg-white transition"
          />
        </div>

        {/* Floor filter */}
        <select
          value={filterFloor}
          onChange={e => setFilterFloor(e.target.value)}
          className="bg-gray-50 border border-transparent rounded-xl py-2.5 px-4 text-sm font-semibold text-gray-600 focus:outline-none focus:border-indigo-300 focus:bg-white transition cursor-pointer"
        >
          <option value="All">All Floors</option>
          {allFloors.map(f => (
            <option key={f} value={f.toString()}>Floor {f}</option>
          ))}
        </select>

        {/* Add Tenant — shown inline for non-admin too */}
        {user.userRole !== 'user' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200 ml-auto"
          >
            <Plus size={14} /> Add Tenant
          </button>
        )}
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Tenant', 'Room', 'Phone', 'Move-in', 'Type', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(person => {
              const lease = person.leases?.find((l: any) => l.isActive);
              const roomNum: string = lease?.room?.roomNumber ?? lease?.roomId ?? '';
              const pal = palette(person.id);
              const moveIn = lease?.startDate
                ? new Date(lease.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—';

              return (
                <motion.tr
                  key={person.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedTenant(person)}
                  className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                >
                  {/* Name + email */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                        style={{ background: pal.bg, color: pal.color }}
                      >
                        {getInitial(person.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-700 text-gray-900 font-semibold truncate leading-tight">{person.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{person.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Room */}
                  <td className="px-5 py-3.5">
                    {roomNum ? (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                        🚪 {roomNum}
                      </span>
                    ) : (
                      <span className="text-xs italic text-gray-400">No lease</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-3.5 text-gray-600 tabular-nums">{person.phone || '—'}</td>

                  {/* Move-in */}
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{moveIn}</td>

                  {/* Type */}
                  <td className="px-5 py-3.5">
                    <NatBadge nationality={person.nationality} lang={person.preferredLanguage} />
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      View →
                    </button>
                  </td>
                </motion.tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-gray-400 italic text-sm">
                  No tenants match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADD TENANT MODAL (logic unchanged) ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Plus size={18} className="text-indigo-500" /> Add New Tenant
                </h2>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <form onSubmit={handleAddTenant} className="space-y-5">
                  <Field label="Full Name">
                    <input required type="text" className={inp} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. สมชาย ใจดี" />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Email (Username)">
                      <input required type="email" className={inp} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="name@example.com" />
                    </Field>
                    <Field label="Phone">
                      <input required type="text" className={inp} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="081-xxx-xxxx" />
                    </Field>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nationality">
                      <select className={inp} value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value, identityNumber: '', visaExpiryDate: '', tm30Reported: false })}>
                        <option value="Thai">Thai (คนไทย)</option>
                        <option value="Foreigner">Foreigner (ต่างชาติ)</option>
                      </select>
                    </Field>
                    <Field label="UI Language">
                      <select className={inp} value={formData.preferredLanguage} onChange={e => setFormData({ ...formData, preferredLanguage: e.target.value })}>
                        <option value="th">ภาษาไทย</option>
                        <option value="en">English</option>
                        <option value="zh-CN">中文 - 简体</option>
                        <option value="zh-TW">中文 - 繁體</option>
                      </select>
                    </Field>
                  </div>

                  <Field label={formData.nationality === 'Thai' ? 'ID Card Number' : 'Passport Number'}>
                    <input type="text" className={inp} value={formData.identityNumber} onChange={e => setFormData({ ...formData, identityNumber: e.target.value })} placeholder={formData.nationality === 'Thai' ? 'เลขบัตรประชาชน 13 หลัก' : 'Passport No.'} />
                  </Field>

                  {formData.nationality === 'Foreigner' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Visa Expiry Date">
                        <input type="date" className={inp} value={formData.visaExpiryDate} onChange={e => setFormData({ ...formData, visaExpiryDate: e.target.value })} />
                      </Field>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-3 p-3 border border-orange-200 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors">
                          <input type="checkbox" className="w-4 h-4 rounded text-orange-500" checked={formData.tm30Reported} onChange={e => setFormData({ ...formData, tm30Reported: e.target.checked })} />
                          <span className="text-sm font-bold text-orange-800">TM.30 Reported?</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <Field label="Emergency Contact">
                    <input type="text" className={inp} value={formData.emergencyContact} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} placeholder="Name & Phone" />
                  </Field>

                  <hr className="border-gray-100" />

                  <Field label="Select Room">
                    <select required className={inp} value={formData.roomId} onChange={e => setFormData({ ...formData, roomId: e.target.value })}>
                      <option value="">-- Choose Available Room --</option>
                      {availableRooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name} — ฿{r.price}/mo</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Move-in Date">
                    <input required type="date" className={inp} value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                  </Field>

                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs font-medium border border-blue-100 flex items-start gap-3">
                    <span className="text-base">⚡</span>
                    <p>Initial meter readings will be automatically fetched and synced with the move-in date.</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center text-sm">
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Move-in'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TENANT DETAIL SLIDE-OVER ── */}
      <AnimatePresence>
        {selectedTenant && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTenant(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col"
            >
              {/* Header */}
              <div className="p-8 border-b border-gray-100 relative bg-gray-50/30">
                <button onClick={() => setSelectedTenant(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-200 bg-gray-100 text-gray-500 rounded-full transition">
                  <X size={16} />
                </button>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold flex-shrink-0"
                    style={{ background: palette(selectedTenant.id).bg, color: palette(selectedTenant.id).color }}
                  >
                    {getInitial(selectedTenant.name)}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 leading-tight mb-1.5">{selectedTenant.name}</h2>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Lease
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 flex-1 overflow-y-auto space-y-8">
                
                {/* Personal Info */}
                <section>
                  <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <div><p className="text-xs font-bold text-gray-500 mb-1">Phone</p><p className="text-sm font-bold text-gray-900">{selectedTenant.phone || '—'}</p></div>
                    <div><p className="text-xs font-bold text-gray-500 mb-1">Email</p><p className="text-sm font-bold text-gray-900 truncate" title={selectedTenant.email}>{selectedTenant.email}</p></div>
                    <div><p className="text-xs font-bold text-gray-500 mb-1">Nationality</p><p className="text-sm font-bold text-gray-900">{selectedTenant.nationality === 'Foreigner' ? '🌍 Foreigner' : '🇹🇭 Thai'}</p></div>
                    <div><p className="text-xs font-bold text-gray-500 mb-1">ID / Passport</p><p className="text-sm font-bold text-gray-900">{selectedTenant.identityNumber || '—'}</p></div>
                    <div className="col-span-2"><p className="text-xs font-bold text-gray-500 mb-1">Emergency Contact</p><p className="text-sm font-bold text-gray-900">{selectedTenant.emergencyContact || '—'}</p></div>
                  </div>
                </section>

                {/* Current Lease */}
                <section>
                  <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Current Lease</h3>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                    {selectedTenant.leases?.find((l:any)=>l.isActive) ? (() => {
                      const l = selectedTenant.leases.find((l:any)=>l.isActive);
                      return (
                        <>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-gray-500">Assigned Room</span>
                            <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm shadow-indigo-200">🚪 {l.room?.roomNumber || l.roomId}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div><p className="text-xs font-bold text-gray-500 mb-1">Move-in Date</p><p className="text-sm font-bold text-gray-900">{new Date(l.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
                            <div className="text-right"><p className="text-xs font-bold text-gray-500 mb-1">Monthly Rent</p><p className="text-sm font-extrabold text-emerald-600">฿{l.room?.price?.toLocaleString() || '0'}</p></div>
                          </div>
                        </>
                      )
                    })() : (
                      <p className="text-sm text-gray-500 italic text-center py-2">No active lease found.</p>
                    )}
                  </div>
                </section>

                {/* Documents (Mockup UI) */}
                <section>
                  <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Documents & Contracts</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-black text-xs">PDF</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">Lease_Agreement_2025.pdf</p>
                        <p className="text-[11px] text-gray-400">Signed on 1 Jan 2025 • 2.4 MB</p>
                      </div>
                      <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Download size={16} /></button>
                    </div>
                    <div className="flex items-center gap-3 bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">IMG</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">ID_Card_Copy.jpg</p>
                        <p className="text-[11px] text-gray-400">Uploaded 1 Jan 2025 • 850 KB</p>
                      </div>
                      <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Download size={16} /></button>
                    </div>
                    
                    <button className="w-full mt-3 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2">
                      <Plus size={16} /> Upload New Document
                    </button>
                  </div>
                </section>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <button className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-3.5 rounded-xl font-extrabold text-sm transition-colors shadow-sm">
                  Terminate Lease (Move Out)
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── tiny helpers ─────────────────────────────────────────
const inp = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
