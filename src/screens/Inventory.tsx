import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, Home, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { motion } from 'motion/react';
import { Personnel } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function Rooms({ 
  setHeaderAction, 
  user,
  onSelectAsset
}: { 
  setHeaderAction: (a: any) => void, 
  user: Personnel,
  onSelectAsset: (id: string) => void
}) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloor, setFilterFloor] = useState('All');
  const { showToast } = useToast();
  const { t } = useLanguage();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      const parsedRooms = data.map((r: any) => ({
        ...r,
        roomNumber: r.name.replace('Room ', ''),
        floor: parseInt(r.location.replace('Floor ', '')) || 1,
        status: r.status === 'Active' ? 'AVAILABLE' : (r.status === 'Assigned' ? 'OCCUPIED' : 'MAINTENANCE'),
        tenantName: r.assignedUser.name === 'Unoccupied' ? null : r.assignedUser.name
      }));
      setRooms(parsedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showToast('Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.userRole !== 'user') {
      setHeaderAction({
        label: 'Manage Rooms',
        onClick: () => {},
        customContent: (
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200">
            <Plus size={15} /> Add Room
          </button>
        )
      });
    } else {
      setHeaderAction(undefined);
    }
    fetchData();
    return () => setHeaderAction(undefined);
  }, [user.userRole]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  // Filter rooms
  const filteredRooms = rooms.filter(r => {
    if (filterFloor !== 'All' && r.floor.toString() !== filterFloor) return false;
    if (searchTerm) {
      return r.roomNumber.includes(searchTerm) || (r.tenantName && r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  // Group by floor — top floor first
  const floors = [...new Set(filteredRooms.map(r => r.floor))].sort((a, b) => b - a);

  // Stat helpers
  const countByStatus = (s: string) => rooms.filter(r => r.status === s).length;

  const statCards = [
    { label: 'Total Rooms',  value: rooms.length,              color: 'text-indigo-600',  iconBg: 'bg-indigo-50',  Icon: Home },
    { label: 'Available',    value: countByStatus('AVAILABLE'), color: 'text-emerald-600', iconBg: 'bg-emerald-50', Icon: CheckCircle2 },
    { label: 'Occupied',     value: countByStatus('OCCUPIED'),  color: 'text-red-500',     iconBg: 'bg-red-50',     Icon: AlertCircle },
    { label: 'Maintenance',  value: countByStatus('MAINTENANCE'), color: 'text-amber-500', iconBg: 'bg-amber-50',   Icon: Wrench },
  ];

  // Room card style maps
  const roomStyle = {
    AVAILABLE:   { card: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400', num: 'text-emerald-800', dot: 'bg-emerald-500', dotAnim: '' },
    OCCUPIED:    { card: 'bg-red-50 border-red-200 hover:border-red-400',             num: 'text-red-800',     dot: 'bg-red-500',     dotAnim: '' },
    MAINTENANCE: { card: 'bg-amber-50 border-amber-200 hover:border-amber-400',       num: 'text-amber-800',   dot: 'bg-amber-500',   dotAnim: 'animate-pulse' },
  } as const;

  return (
    <div className="space-y-5 font-sans">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color, iconBg, Icon }, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            </div>
            <div className={`${iconBg} ${color} w-11 h-11 rounded-xl flex items-center justify-center`}>
              <Icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3 shadow-sm border border-gray-100">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search room or tenant…"
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
          {[...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b).map(f => (
            <option key={f} value={f.toString()}>Floor {f}</option>
          ))}
        </select>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 ml-auto">
          {[
            { dot: 'bg-emerald-500', label: 'Available' },
            { dot: 'bg-red-500',     label: 'Occupied' },
            { dot: 'bg-amber-500',   label: 'Maintenance' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${l.dot}`} />
              <span className="text-xs font-semibold text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FLOOR SECTIONS ── */}
      <div className="space-y-5">
        {floors.map(floor => {
          const floorRooms = filteredRooms.filter(r => r.floor === floor);
          const availCount = floorRooms.filter(r => r.status === 'AVAILABLE').length;

          return (
            <div key={floor} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {/* Floor header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center">
                  F{floor}
                </div>
                <div>
                  <p className="text-[15px] font-black text-gray-900 leading-tight">Floor {floor}</p>
                  <p className="text-xs font-medium text-gray-400">
                    {floorRooms.length} rooms · {availCount} available
                  </p>
                </div>
              </div>

              {/* Room grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {floorRooms.map(room => {
                  const s = roomStyle[room.status as keyof typeof roomStyle] ?? roomStyle.AVAILABLE;
                  return (
                    <motion.div
                      key={room.id}
                      onClick={() => onSelectAsset(room.id)}
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.15 }}
                      className={`relative p-4 rounded-[14px] border-[1.5px] cursor-pointer transition-colors ${s.card}`}
                    >
                      {/* Room number + status dot */}
                      <div className="flex items-start justify-between mb-2.5">
                        <span className={`text-[17px] font-black tracking-tight leading-none ${s.num}`}>
                          {room.roomNumber}
                        </span>
                        <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${s.dot} ${s.dotAnim}`} />
                      </div>

                      {/* Type & tenant */}
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        {room.type ?? 'Standard'}
                      </p>
                      <p className={`text-[12px] font-semibold truncate ${room.status === 'OCCUPIED' ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                        {room.status === 'OCCUPIED' ? room.tenantName : room.status === 'MAINTENANCE' ? 'Under Repair' : 'Empty'}
                      </p>

                      {/* Price — available only */}
                      {room.status === 'AVAILABLE' && room.price && (
                        <p className="text-[11px] font-bold text-gray-400 mt-2">
                          ฿{Number(room.price).toLocaleString()}/mo
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {floors.length === 0 && (
          <div className="py-20 text-center text-gray-400 text-sm font-medium bg-white rounded-2xl border border-gray-100">
            No rooms match your search.
          </div>
        )}
      </div>
    </div>
  );
}
