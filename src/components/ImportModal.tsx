import { useState, useRef } from 'react';
import { X, Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ImportModalProps {
  type: 'assets' | 'personnel';
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ type, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    let headers = [];
    let sample = [];

    if (type === 'assets') {
      headers = ['id', 'name', 'type', 'serialNumber', 'spec', 'status', 'purchaseDate', 'location', 'department', 'assignedPersonnelId', 'image'];
      sample = ['ASSET-001', 'MacBook Pro M3', 'Laptop', 'SN12345678', '16GB RAM, 512GB SSD', 'Active', '2023-10-15', 'Office A', 'IT', 'P-001', 'https://example.com/image.jpg'];
    } else {
      headers = ['name', 'username', 'email', 'phone', 'role', 'department', 'userRole', 'joinedDate', 'avatar'];
      sample = ['John Doe', 'johndoe', 'john.d@primus.pro', '0812345678', 'Software Engineer', 'Engineering', 'user', '2023-10-15', 'https://example.com/avatar.jpg'];
    }

    const csv = Papa.unparse([headers, sample]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${type}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 5)); // Preview first 5 rows
        },
        error: (error) => {
          showToast(`Error parsing CSV: ${error.message}`, 'error');
        }
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (type === 'assets') {
            await api.bulkCreateAssets(results.data);
          } else {
            await api.bulkCreatePersonnel(results.data);
          }
          showToast(`Imported ${results.data.length} records successfully`, 'success');
          onSuccess();
          onClose();
        } catch (error) {
          showToast('Failed to import data. Check CSV format.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
          <div>
            <h2 className="text-xl font-extrabold text-[#111827]">Bulk Import {type === 'assets' ? 'Assets' : 'Personnel'}</h2>
            <p className="text-xs text-gray-400 font-medium mt-1">Upload CSV file to import multiple records at once.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all shadow-sm text-gray-400"><X size={20} /></button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          {/* Step 1: Template */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white"><FileText size={24} /></div>
              <div>
                <p className="text-sm font-bold text-blue-900">Don't have a file yet?</p>
                <p className="text-[11px] text-blue-700 font-medium">Download our CSV template to see the required format.</p>
              </div>
            </div>
            <button 
              onClick={handleDownloadTemplate}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <Download size={16} /> Template
            </button>
          </div>

          {/* Step 2: Upload */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all ${file ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 hover:border-primary-brand bg-gray-50/50 hover:bg-primary-brand/5'}`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-400 shadow-sm'}`}>
              <Upload size={32} />
            </div>
            <p className="text-sm font-bold text-gray-900">{file ? file.name : 'Click to select CSV file'}</p>
            <p className="text-xs text-gray-400 mt-1">or drag and drop here</p>
          </div>

          {/* Step 3: Preview */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" /> Data Preview (First 5 rows)
              </h3>
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <tr>
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="px-4 py-3">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-4 py-3 truncate max-w-[150px]">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-xl text-xs font-bold text-gray-500 hover:bg-white hover:shadow-sm transition-all"
          >
            Cancel
          </button>
          <button 
            disabled={!file || loading}
            onClick={handleImport}
            className="flex-[2] bg-primary-brand text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Start Import <CheckCircle size={18} /></>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
