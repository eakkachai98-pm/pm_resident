import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { Ticket } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

export default function TicketDetailModal({ isOpen, onClose, ticket }: TicketDetailModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && ticket) {
      setRating(ticket.rating || 0);
      setFeedback(ticket.feedback || '');
      setHasRated(!!ticket.rating);
    }
  }, [isOpen, ticket]);

  const submitRating = async () => {
    if (!ticket || rating === 0) return;
    setIsSubmitting(true);
    try {
      await api.rateTicket(ticket.id, rating, feedback);
      setHasRated(true);
      showToast('Thank you for your feedback!', 'success');
      // Update local ticket object
      ticket.rating = rating;
      ticket.feedback = feedback;
    } catch (error) {
      showToast('Failed to submit rating', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && ticket && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            className="relative bg-white w-full max-w-lg rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh]"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-[#F9FAFB] shrink-0">
              <div className="pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority} Priority
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-[#111827] leading-tight">{ticket.subject}</h2>
                <p className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1.5">
                  <Clock size={12} /> {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-all shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>

              {ticket.assetId && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-gray-400" />
                    Related Asset
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium text-primary-brand inline-block shadow-sm">
                    {ticket.assetId}
                  </div>
                </div>
              )}

              {ticket.resolution && (
                <div>
                  <h3 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    Resolution
                  </h3>
                  <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-800 leading-relaxed border border-emerald-100">
                    <p>{ticket.resolution}</p>
                    {(ticket.repairImage || ticket.residentSignature) && (
                      <div className="mt-4 flex gap-4 border-t border-emerald-100 pt-4">
                        {ticket.repairImage && (
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Repair Image</p>
                            <img src={ticket.repairImage} alt="Repair Evidence" className="h-20 object-cover rounded-lg border border-emerald-200" />
                          </div>
                        )}
                        {ticket.residentSignature && (
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Signature</p>
                            <img src={ticket.residentSignature} alt="Resident Signature" className="h-20 object-contain rounded-lg border border-emerald-200 bg-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {ticket.status === 'RESOLVED' && (
                <div className="bg-gradient-to-br from-[#F9FAFB] to-white border border-gray-100 rounded-xl p-5 shadow-sm mt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 text-center">
                    {hasRated ? 'Your Feedback' : 'How was your experience?'}
                  </h3>
                  
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        disabled={hasRated || isSubmitting}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className={`p-1 transition-all ${
                          (hoverRating || rating) >= star 
                            ? 'text-amber-400 scale-110' 
                            : 'text-gray-200'
                        } ${hasRated ? 'cursor-default' : 'hover:scale-125'}`}
                      >
                        <Star size={28} fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>

                  {!hasRated ? (
                    <div className="space-y-3">
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us what went well or what could be improved... (Optional)"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all resize-none h-20"
                      />
                      <button
                        onClick={submitRating}
                        disabled={rating === 0 || isSubmitting}
                        className="w-full bg-primary-brand text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </div>
                  ) : (
                    feedback && (
                      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic border border-gray-100">
                        "{feedback}"
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
              <button 
                type="button"
                onClick={onClose}
                className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
