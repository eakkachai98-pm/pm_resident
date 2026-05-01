import { useState, useEffect } from 'react';
import { Search, Plus, Upload, Loader2, Home, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
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
      // Temporary: we mapped GET /api/rooms to return array of rooms
      const response = await fetch('/api/rooms');
      const data = await response.json();
      
      // Parse the roomNumber and floor back out since server formatted it for legacy compatibility
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
          <div className="flex gap-2">
            <button className="bg-primary-brand text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2">
              <Plus size={16} /> Add Room
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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;

  // Filter rooms
  const filteredRooms = rooms.filter(r => {
    if (filterFloor !== 'All' && r.floor.toString() !== filterFloor) return false;
    if (searchTerm) {
      return r.roomNumber.includes(searchTerm) || (r.tenantName && r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  // Group by floor
  const floors = [...new Set(filteredRooms.map(r => r.floor))].sort((a, b) => b - a); // Top floor first

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Rooms', value: rooms.length, color: 'text-on-surface-brand', icon: Home },
          { label: 'Available', value: rooms.filter(r => r.status === 'AVAILABLE').length, color: 'text-emerald-500', icon: CheckCircle2 },
          { label: 'Occupied', value: rooms.filter(r => r.status === 'OCCUPIED').length, color: 'text-red-500', icon: AlertCircle },
          { label: 'Maintenance', value: rooms.filter(r => r.status === 'MAINTENANCE').length, color: 'text-amber-500', icon: Wrench }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200/50 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 md:mb-2 block">{stat.label}</span>
              <span className={`text-xl md:text-3xl font-extrabold ${stat.color}`}>{stat.value}</span>
            </div>
            <div className={`p-3 rounded-full bg-gray-50 ${stat.color.replace('text-', 'text-opacity-80 text-')}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-gray-200/50 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 flex-1 gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Room or Tenant..." 
              className="w-full bg-[#F9FAFB] border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary-brand/10 transition-all font-medium" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <select 
            className="bg-[#F9FAFB] border-none rounded-xl py-3 px-4 text-sm font-bold text-gray-500 cursor-pointer focus:ring-2 focus:ring-primary-brand/10 transition-all" 
            value={filterFloor} 
            onChange={(e) => setFilterFloor(e.target.value)}
          >
            <option value="All">All Floors</option>
            {[...new Set(rooms.map(r => r.floor))].sort((a,b)=>a-b).map(f => (
              <option key={f} value={f.toString()}>Floor {f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Floors Grid */}
      <div className="space-y-8">
        {floors.map(floor => (
          <div key={floor} className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-6">
            <h2 className="text-lg font-black text-[#111827] mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] flex items-center justify-center text-primary-brand font-bold">F{floor}</div>
              Floor {floor}
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredRooms.filter(r => r.floor === floor).map(room => (
                <motion.div 
                  key={room.id}
                  onClick={() => onSelectAsset(room.id)}
                  whileHover={{ y: -4 }}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm
                    ${room.status === 'AVAILABLE' ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300' : 
                      room.status === 'OCCUPIED' ? 'bg-red-50/50 border-red-100 hover:border-red-300' : 
                      'bg-amber-50/50 border-amber-100 hover:border-amber-300'
                    }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-lg font-black tracking-tighter
                      ${room.status === 'AVAILABLE' ? 'text-emerald-700' : 
                        room.status === 'OCCUPIED' ? 'text-red-700' : 
                        'text-amber-700'
                      }`}
                    >
                      {room.roomNumber}
                    </span>
                    <span className={`w-2 h-2 rounded-full mt-2
                      ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : 
                        room.status === 'OCCUPIED' ? 'bg-red-500' : 
                        'bg-amber-500 animate-pulse'
                      }`}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{room.type}</p>
                    <p className="text-xs font-semibold text-[#111827] truncate">
                      {room.status === 'OCCUPIED' ? room.tenantName : 'Empty'}
                    </p>
                    {room.status === 'AVAILABLE' && (
                      <p className="text-[10px] font-bold text-gray-400 mt-2">฿{room.price.toLocaleString()}/mo</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {floors.length === 0 && (
          <div className="p-20 text-center text-gray-400 italic font-medium bg-white rounded-2xl border border-gray-200/50">
            No rooms found.
          </div>
        )}
      </div>
    </div>
  );
}
