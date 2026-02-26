import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  User as UserIcon
} from 'lucide-react';
import { User, StatHistory } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface ProgressViewProps {
  user: User;
}

export default function ProgressView({ user }: ProgressViewProps) {
  const [stats, setStats] = useState<StatHistory[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
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
  }, []);

  const fetchStats = async () => {
    const res = await fetch(`/api/stats/${user.id}`);
    const data = await res.json();
    setStats(data);
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold tracking-tight">Transformation</h1>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-brand-accent hover:bg-blue-600 text-white flex items-center gap-2 px-6 py-3 rounded-xl accent-glow transition-all font-bold"
        >
          <Plus size={20} />
          Log Stats
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-400/20 rounded-xl flex items-center justify-center">
              <Scale className="text-blue-400" size={20} />
            </div>
            <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Weight</span>
          </div>
          <p className="text-3xl font-display font-bold">{currentWeight} <span className="text-sm text-brand-muted">lbs</span></p>
          <p className={cn("text-sm mt-1 font-medium", weightChange <= 0 ? "text-emerald-400" : "text-red-400")}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} lbs from start
          </p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-400/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-purple-400" size={20} />
            </div>
            <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Body Fat</span>
          </div>
          <p className="text-3xl font-display font-bold">{stats.length > 0 ? stats[stats.length - 1].body_fat : '--'} <span className="text-sm text-brand-muted">%</span></p>
          <p className="text-sm mt-1 text-brand-muted font-medium">Last updated {stats.length > 0 ? format(new Date(stats[stats.length - 1].log_date.replace(' ', 'T')), 'MMM d') : 'never'}</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-400/20 rounded-xl flex items-center justify-center">
              <Dna className="text-emerald-400" size={20} />
            </div>
            <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Muscle Mass</span>
          </div>
          <p className="text-3xl font-display font-bold">{stats.length > 0 ? stats[stats.length - 1].muscle_mass : '--'} <span className="text-sm text-brand-muted">lbs</span></p>
          <p className="text-sm mt-1 text-brand-muted font-medium">InBody Scan data</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-400/20 rounded-xl flex items-center justify-center">
              <UserIcon className="text-orange-400" size={20} />
            </div>
            <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">BMI</span>
          </div>
          <p className={cn("text-3xl font-display font-bold", getBMIColor(calculateBMI(currentWeight)))}>
            {calculateBMI(currentWeight).toFixed(1)}
          </p>
          <p className="text-sm mt-1 text-brand-muted font-medium">Auto-calculated</p>
        </div>
      </div>

      {/* ECW/TBW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 flex justify-between items-center">
          <div>
            <p className="text-xs text-brand-muted uppercase font-bold mb-1 tracking-wider">Extracellular Water (ECW)</p>
            <p className="text-2xl font-display font-bold">{stats.length > 0 ? stats[stats.length - 1].ecw : '--'} <span className="text-sm text-brand-muted">L</span></p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
            <Activity size={24} />
          </div>
        </div>
        <div className="glass-card p-6 flex justify-between items-center">
          <div>
            <p className="text-xs text-brand-muted uppercase font-bold mb-1 tracking-wider">Total Body Water (TBW)</p>
            <p className="text-2xl font-display font-bold">{stats.length > 0 ? stats[stats.length - 1].tbw : '--'} <span className="text-sm text-brand-muted">L</span></p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
            <Activity size={24} />
          </div>
        </div>
      </div>

      {/* Weight Graph */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-2">
          <TrendingUp className="text-brand-accent" />
          Weight Progression
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="log_date" 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickFormatter={(str) => format(new Date(str.replace(' ', 'T')), 'MMM d')}
              />
              <YAxis stroke="#a1a1aa" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#161616', border: '1px solid #ffffff20', borderRadius: '12px' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Photos */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-bold flex items-center gap-2">
          <Camera className="text-brand-accent" />
          Progress Gallery
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.filter(s => s.photo_url).map((stat, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="glass-card overflow-hidden aspect-[3/4] relative group"
            >
              <img src={stat.photo_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                  {format(new Date(stat.log_date.replace(' ', 'T')), 'MMMM d, yyyy')}
                </p>
                <p className="text-[10px] text-white/60">
                  {format(new Date(stat.log_date.replace(' ', 'T')), 'h:mm a')}
                </p>
                <p className="text-sm font-bold">{stat.weight} lbs</p>
              </div>
            </motion.div>
          ))}
          {stats.filter(s => s.photo_url).length === 0 && (
            <div className="col-span-full glass-card p-12 text-center">
              <Camera className="mx-auto text-brand-muted mb-4" size={48} />
              <p className="text-brand-muted">No progress photos yet. Upload your first one!</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6">Log New Stats</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-brand-muted">Current Weight (lbs)</label>
                <input 
                  type="number"
                  value={newStat.weight}
                  onChange={e => setNewStat({...newStat, weight: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  placeholder="182.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-brand-muted">Body Fat %</label>
                  <input 
                    type="number"
                    value={newStat.body_fat}
                    onChange={e => setNewStat({...newStat, body_fat: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                    placeholder="15.2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-brand-muted">Muscle Mass (lbs)</label>
                  <input 
                    type="number"
                    value={newStat.muscle_mass}
                    onChange={e => setNewStat({...newStat, muscle_mass: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                    placeholder="85.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-brand-muted">ECW (L)</label>
                  <input 
                    type="number"
                    value={newStat.ecw}
                    onChange={e => setNewStat({...newStat, ecw: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                    placeholder="15.5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-brand-muted">TBW (L)</label>
                  <input 
                    type="number"
                    value={newStat.tbw}
                    onChange={e => setNewStat({...newStat, tbw: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                    placeholder="45.2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-brand-muted">Progress Photo</label>
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
                        <Camera className="text-brand-muted mb-2" size={24} />
                        <span className="text-xs text-brand-muted">Upload Photo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl bg-brand-accent hover:bg-blue-600 text-white font-bold accent-glow transition-all"
              >
                Save Stats
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
