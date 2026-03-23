import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { 
  Camera, 
  Plus, 
  TrendingUp, 
  Scale, 
  Dna, 
  Waves,
  Calendar,
  Activity,
  User as UserIcon,
  CheckCircle2,
  Award
} from 'lucide-react';
import { User, StatHistory, Challenge, DailyLog } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface ProgressViewProps {
  user: User;
  challenge: Challenge;
}

export default function ProgressView({ user, challenge }: ProgressViewProps) {
  const [stats, setStats] = useState<StatHistory[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [newStat, setNewStat] = useState({
    weight: '',
    body_fat: '',
    muscle_mass: '',
    ecw: '',
    tbw: '',
    photo: null as string | null
  });

  const calculateBMI = (weight: number) => {
    if (!user.profile?.height) return 0;
    const heightInMeters = user.profile.height / 100;
    // Assuming weight is in lbs, convert to kg for BMI: lbs * 0.453592
    const weightInKg = weight * 0.453592;
    return weightInKg / (heightInMeters * heightInMeters);
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-400';
    if (bmi < 25) return 'text-emerald-400';
    if (bmi < 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, []);

  const fetchStats = async () => {
    const res = await fetch(`/api/stats/${user.id}`);
    const data = await res.json();
    setStats(data);
  };

  const fetchLogs = async () => {
    const res = await fetch(`/api/logs/${user.id}`);
    const data = await res.json();
    setDailyLogs(data);
  };

  const calculateDailyCompletion = (log: DailyLog) => {
    let total = 5; // Base tasks
    let completed = 0;

    if ((log.water_intake_glasses || 0) >= challenge.water_goal_glasses) completed++;
    if ((log.steps_count || 0) >= challenge.steps_goal) completed++;
    if ((log.workouts_done || 0) >= challenge.workouts_count) completed++;
    if (log.cardio_done) completed++;
    if (log.reading_done) completed++;

    if (user.religious_mode) {
      total++;
      if (log.bible_study_done) completed++;
    }
    if (challenge.prayer_devotion) {
      total++;
      if (log.prayer_done) completed++;
    }
    if (challenge.quit_nicotine) {
      total++;
      if (log.nicotine_free) completed++;
    }
    if (challenge.quit_alcohol) {
      total++;
      if (log.alcohol_free) completed++;
    }

    // Meds
    if (challenge.meds_vitamins.length > 0) {
      total += challenge.meds_vitamins.length;
      completed += (log.meds_taken || []).filter(m => m.taken).length;
    }

    return Math.round((completed / total) * 100);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewStat({ ...newStat, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        weight: parseFloat(newStat.weight),
        body_fat: parseFloat(newStat.body_fat),
        muscle_mass: parseFloat(newStat.muscle_mass),
        ecw: parseFloat(newStat.ecw) || 0,
        tbw: parseFloat(newStat.tbw) || 0,
        photo_url: newStat.photo
      })
    });
    fetchStats();
    setShowUploadModal(false);
  };

  const currentWeight = stats.length > 0 ? stats[stats.length - 1].weight : user.profile?.starting_weight || 0;
  const weightChange = currentWeight - (user.profile?.starting_weight || 0);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-display font-light tracking-tight">Transformation</h1>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="w-full sm:w-auto bg-brand-accent hover:bg-blue-600 text-white flex items-center justify-center gap-2 px-6 py-3 rounded-2xl accent-glow transition-all"
        >
          <Plus size={18} strokeWidth={1.5} />
          <span className="micro-label text-white">Log Stats</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-400/10 rounded-2xl flex items-center justify-center">
              <Scale className="text-blue-400" size={16} strokeWidth={1.5} />
            </div>
            <span className="micro-label">Weight</span>
          </div>
          <p className="text-3xl font-display font-light tracking-tight">{currentWeight} <span className="text-xs text-brand-muted font-normal">lbs</span></p>
          <p className={cn("text-[10px] mt-2 font-medium uppercase tracking-wider", weightChange <= 0 ? "text-emerald-400" : "text-red-400")}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} lbs from start
          </p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-purple-400/10 rounded-2xl flex items-center justify-center">
              <TrendingUp className="text-purple-400" size={16} strokeWidth={1.5} />
            </div>
            <span className="micro-label">Body Fat</span>
          </div>
          <p className="text-3xl font-display font-light tracking-tight">{stats.length > 0 ? stats[stats.length - 1].body_fat : '--'} <span className="text-xs text-brand-muted font-normal">%</span></p>
          <p className="text-[10px] mt-2 text-brand-muted font-medium uppercase tracking-wider">Last updated {stats.length > 0 ? format(new Date(stats[stats.length - 1].log_date.replace(' ', 'T')), 'MMM d') : 'never'}</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-emerald-400/10 rounded-2xl flex items-center justify-center">
              <Dna className="text-emerald-400" size={16} strokeWidth={1.5} />
            </div>
            <span className="micro-label">Muscle Mass</span>
          </div>
          <p className="text-3xl font-display font-light tracking-tight">{stats.length > 0 ? stats[stats.length - 1].muscle_mass : '--'} <span className="text-xs text-brand-muted font-normal">lbs</span></p>
          <p className="text-[10px] mt-2 text-brand-muted font-medium uppercase tracking-wider">InBody Scan data</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-orange-400/10 rounded-2xl flex items-center justify-center">
              <UserIcon className="text-orange-400" size={16} strokeWidth={1.5} />
            </div>
            <span className="micro-label">BMI</span>
          </div>
          <p className={cn("text-3xl font-display font-light tracking-tight", getBMIColor(calculateBMI(currentWeight)))}>
            {calculateBMI(currentWeight).toFixed(1)}
          </p>
          <p className="text-[10px] mt-2 text-brand-muted font-medium uppercase tracking-wider">Auto-calculated</p>
        </div>
      </div>

      {/* ECW/TBW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 flex justify-between items-center">
          <div>
            <p className="micro-label mb-2">Extracellular Water (ECW)</p>
            <p className="text-2xl font-display font-light tracking-tight">{stats.length > 0 ? stats[stats.length - 1].ecw : '--'} <span className="text-xs text-brand-muted font-normal">L</span></p>
          </div>
          <div className="w-12 h-12 bg-blue-500/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/5">
            <Activity size={20} strokeWidth={1.5} />
          </div>
        </div>
        <div className="glass-card p-6 flex justify-between items-center">
          <div>
            <p className="micro-label mb-2">Total Body Water (TBW)</p>
            <p className="text-2xl font-display font-light tracking-tight">{stats.length > 0 ? stats[stats.length - 1].tbw : '--'} <span className="text-xs text-brand-muted font-normal">L</span></p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/5">
            <Activity size={20} strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Weight Graph */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-display font-light tracking-tight mb-10 flex items-center gap-3">
          <TrendingUp className="text-brand-accent" size={20} strokeWidth={1.5} />
          Weight Progression
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="log_date" 
                stroke="#ffffff20" 
                fontSize={10} 
                tickFormatter={(str) => format(new Date(str.replace(' ', 'T')), 'MMM d')}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#ffffff20" 
                fontSize={10} 
                domain={['dataMin - 5', 'dataMax + 5']} 
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Completion History */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-display font-light tracking-tight mb-8 flex items-center gap-3">
          <Calendar className="text-brand-accent" size={20} strokeWidth={1.5} />
          Daily Completion History
        </h3>
        <div className="space-y-6">
          {dailyLogs.slice().reverse().map((log, i) => {
            const pct = calculateDailyCompletion(log);
            return (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedLog(log)}
                className="flex items-center gap-6 cursor-pointer group"
              >
                <div className="w-24 shrink-0">
                  <p className="text-sm font-medium text-brand-muted group-hover:text-brand-accent transition-colors">{format(new Date(log.log_date), 'MMM d')}</p>
                  <p className="text-[10px] micro-label opacity-50">{format(new Date(log.log_date), 'EEEE')}</p>
                </div>
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full accent-glow",
                      (pct === 100 || log.is_finalized) ? "bg-emerald-400" : "bg-brand-accent"
                    )}
                  />
                  {log.is_finalized && (
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <CheckCircle2 size={10} className="text-white/50" />
                    </div>
                  )}
                </div>
                <div className="w-16 text-right flex items-center justify-end gap-2">
                  <span className="text-sm font-display font-light tracking-tight">{pct}%</span>
                  {log.is_finalized && <Award size={14} className="text-emerald-400" />}
                </div>
              </motion.div>
            );
          })}
          {dailyLogs.length === 0 && (
            <div className="text-center py-10">
              <p className="text-brand-muted micro-label">No history available yet</p>
            </div>
          )}
        </div>
      </div>
      {/* Progress Photos */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-light tracking-tight flex items-center gap-3">
            <Camera className="text-brand-accent" size={20} strokeWidth={1.5} />
            Progress Gallery
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.filter(s => s.photo_url).map((stat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="glass-card overflow-hidden group relative aspect-[3/4]"
            >
              <img 
                src={stat.photo_url} 
                alt={`Progress ${stat.log_date}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white text-sm font-medium">{format(new Date(stat.log_date.replace(' ', 'T')), 'MMMM d, yyyy')}</p>
                <p className="text-white/60 text-[10px] micro-label mt-1">{stat.weight} lbs</p>
              </div>
            </motion.div>
          ))}
          {stats.filter(s => s.photo_url).length === 0 && (
            <div className="col-span-full glass-card p-12 text-center">
              <Camera className="mx-auto text-brand-muted mb-4" size={32} strokeWidth={1} />
              <p className="text-brand-muted micro-label">No progress photos yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-2xl p-8 relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-display font-black tracking-tighter italic uppercase text-brand-accent">
                    Day Log: {format(new Date(selectedLog.log_date), 'MMMM d, yyyy')}
                  </h2>
                  <p className="micro-label text-brand-muted mt-1">
                    {calculateDailyCompletion(selectedLog)}% Completion • {selectedLog.is_finalized ? 'Finalized' : 'In Progress'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <Plus className="rotate-45 text-brand-muted" size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="micro-label text-brand-accent border-b border-brand-accent/20 pb-2">Daily Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] micro-label text-brand-muted mb-1">Water</p>
                      <p className="text-xl font-bold">{selectedLog.water_intake_glasses} / {challenge.water_goal_glasses} <span className="text-[10px] font-normal opacity-50">glasses</span></p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] micro-label text-brand-muted mb-1">Steps</p>
                      <p className="text-xl font-bold">{selectedLog.steps_count} / {challenge.steps_goal}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] micro-label text-brand-muted mb-1">Workouts</p>
                      <p className="text-xl font-bold">{selectedLog.workouts_done} / {challenge.workouts_count}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] micro-label text-brand-muted mb-1">Cardio</p>
                      <p className="text-xl font-bold">{selectedLog.cardio_done ? 'YES' : 'NO'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-muted">Reading Done</span>
                      <span className={selectedLog.reading_done ? "text-emerald-400" : "text-red-400"}>{selectedLog.reading_done ? 'YES' : 'NO'}</span>
                    </div>
                    {user.religious_mode && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-brand-muted">Bible Study</span>
                        <span className={selectedLog.bible_study_done ? "text-emerald-400" : "text-red-400"}>{selectedLog.bible_study_done ? 'YES' : 'NO'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="micro-label text-brand-accent border-b border-brand-accent/20 pb-2">Daily Reflection</h3>
                  {selectedLog.notes ? (
                    <div className="bg-white/5 p-6 rounded-xl border border-white/5 italic font-serif text-brand-text/80 leading-relaxed whitespace-pre-wrap">
                      "{selectedLog.notes}"
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                      <p className="text-brand-muted micro-label">No reflection recorded</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10"
            >
              <h2 className="text-2xl font-display font-light tracking-tight mb-8">Log Daily Stats</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="micro-label mb-2 block">Weight (lbs)</label>
                  <input 
                    type="number" 
                    value={newStat.weight}
                    onChange={(e) => setNewStat({...newStat, weight: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="0.0"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="micro-label mb-2 block">Body Fat %</label>
                    <input 
                      type="number" 
                      value={newStat.body_fat}
                      onChange={(e) => setNewStat({...newStat, body_fat: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="micro-label mb-2 block">Muscle Mass (lbs)</label>
                    <input 
                      type="number" 
                      value={newStat.muscle_mass}
                      onChange={(e) => setNewStat({...newStat, muscle_mass: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="micro-label mb-2 block">ECW (L)</label>
                    <input 
                      type="number" 
                      value={newStat.ecw}
                      onChange={(e) => setNewStat({...newStat, ecw: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="micro-label mb-2 block">TBW (L)</label>
                    <input 
                      type="number" 
                      value={newStat.tbw}
                      onChange={(e) => setNewStat({...newStat, tbw: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div>
                  <label className="micro-label mb-2 block">Progress Photo</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center group-hover:border-brand-accent transition-all">
                      {newStat.photo ? (
                        <img src={newStat.photo} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <>
                          <Camera className="text-brand-muted mb-2" size={24} strokeWidth={1.5} />
                          <span className="micro-label">Upload Photo</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-6 py-3 rounded-2xl border border-white/10 text-brand-muted hover:bg-white/5 transition-colors micro-label"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={!newStat.weight}
                    className="flex-1 bg-brand-accent hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-2xl accent-glow transition-all micro-label"
                  >
                    Save Stats
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
