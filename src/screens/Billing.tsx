import { useState, useEffect } from 'react';
import { DollarSign, Search, FileText, CheckCircle, AlertCircle, Plus, Loader2, Home, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';

export default function Billing({ 
  setHeaderAction, 
  user 
}: { 
  setHeaderAction: (a: any) => void, 
  user: any
}) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.userRole !== 'user') {
      setHeaderAction({ 
        label: 'Manage Billing', 
        onClick: () => {}, 
        customContent: (
          <div className="flex gap-2">
            <button className="bg-primary-brand text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2">
              <Plus size={16} /> Record Meters
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

  const filteredInvoices = invoices.filter(i => 
    i.lease?.room?.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.billingMonth.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.lease?.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'PENDING_VERIFICATION': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-red-50 text-red-700 border-red-100';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-brand" size={32} /></div>;

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Unpaid', value: `฿${invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.totalAmount, 0).toLocaleString()}`, color: 'text-red-500', icon: AlertCircle },
          { label: 'Pending Verification', value: invoices.filter(i => i.status === 'PENDING_VERIFICATION').length, color: 'text-amber-500', icon: FileText },
          { label: 'Total Revenue (Paid)', value: `฿${invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0).toLocaleString()}`, color: 'text-emerald-500', icon: CheckCircle }
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

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by Room, Month, or Tenant..." className="w-full bg-white border border-gray-200/50 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary-brand/10 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="p-6 md:p-8 hover:bg-[#F9FAFB]/50 transition-all group flex flex-col md:flex-row gap-6 items-start md:items-center cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{invoice.id.substring(0,8)}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(invoice.status)}`}>{invoice.status.replace('_', ' ')}</span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-[#111827] mb-2">Invoice: {invoice.billingMonth}</h3>
                <div className="flex flex-wrap gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-primary-brand"><Home size={14} className="opacity-70" />Room {invoice.lease?.room?.roomNumber}</div>
                  <div className="flex items-center gap-1.5 text-gray-400"><User size={14} className="opacity-70" />{invoice.lease?.tenant?.name}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                <span className="text-xl font-black text-[#111827]">฿{invoice.totalAmount.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</span>
              </div>
            </div>
          ))}
          {filteredInvoices.length === 0 && <div className="p-20 text-center text-gray-400 italic">No invoices found.</div>}
        </div>
      </div>
    </div>
  );
}
