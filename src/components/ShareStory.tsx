import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Download, Flame, Quote, Activity, TrendingUp } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { User } from '../types';
import { format } from 'date-fns';

interface ShareStoryProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  stats: any[];
  streak: number;
  verse?: { quote: string; reference?: string };
  reflection?: string;
}

export default function ShareStory({ isOpen, onClose, user, stats, streak, verse, reflection }: ShareStoryProps) {
  const heightInMeters = (user.profile?.height || 175) / 100;
  const latestStat = stats[stats.length - 1] || {};
  const currentWeight = latestStat.weight || user.profile?.starting_weight || 0;
  const bmi = currentWeight / (heightInMeters * heightInMeters);

  const chartData = stats.slice(-7).map(s => ({
    date: format(new Date(s.log_date), 'MM/dd'),
    weight: s.weight,
    bodyFat: s.body_fat,
    muscleMass: s.muscle_mass
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-[400px] aspect-[9/16] bg-brand-bg border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Story Content */}
            <div className="flex-1 p-8 space-y-6 overflow-y-auto no-scrollbar dot-pattern">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-4xl font-sans font-black tracking-tighter uppercase italic">
                    Day <span className="text-brand-accent">{streak}</span>
                  </h2>
                  <p className="micro-label text-brand-muted">Forge75 Challenge</p>
                </div>
                <div className="w-12 h-12 bg-brand-accent/20 rounded-2xl flex items-center justify-center border border-brand-accent/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <Flame className="text-brand-accent" size={24} />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="micro-label opacity-50 mb-1">Weight</p>
                  <p className="text-2xl font-black">{currentWeight} <span className="text-xs opacity-50">kg</span></p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="micro-label opacity-50 mb-1">BMI</p>
                  <p className="text-2xl font-black">{bmi.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="micro-label opacity-50 mb-1">Body Fat</p>
                  <p className="text-2xl font-black">{latestStat.body_fat || '--'} <span className="text-xs opacity-50">%</span></p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="micro-label opacity-50 mb-1">Muscle</p>
                  <p className="text-2xl font-black">{latestStat.muscle_mass || '--'} <span className="text-xs opacity-50">kg</span></p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-40 bg-white/5 rounded-3xl border border-white/10 p-4 relative overflow-hidden">
                <p className="micro-label opacity-30 absolute top-4 left-4">7-Day Weight Trend</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="weight" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Verse */}
              {verse && (
                <div className="bg-brand-accent/10 p-6 rounded-3xl border border-brand-accent/20 relative overflow-hidden">
                  <Quote className="absolute -top-2 -right-2 text-brand-accent/10" size={60} />
                  <p className="text-sm font-serif italic leading-relaxed relative z-10">"{verse.quote}"</p>
                  <p className="micro-label text-brand-accent mt-4 font-black">-- {verse.reference}</p>
                </div>
              )}

              {/* Reflection */}
              {reflection && (
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <p className="micro-label opacity-50 mb-2">Today's Reflection</p>
                  <p className="text-xs italic leading-relaxed opacity-80">"{reflection}"</p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 text-center">
                <p className="text-[10px] micro-label opacity-30 tracking-[0.3em] uppercase">Forged in Resilience</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-white/5 border-t border-white/10 flex gap-3">
              <button 
                onClick={() => {
                  // In a real app, this would use html2canvas or similar
                  alert('Screenshot this view to share to your story!');
                }}
                className="flex-1 bg-brand-accent py-4 rounded-2xl font-black uppercase tracking-widest italic flex items-center justify-center gap-2"
              >
                <Share2 size={18} /> Share Story
              </button>
              <button onClick={onClose} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                <X size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
