import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Droplets, 
  Zap, 
  Activity, 
  BookOpen, 
  CheckCircle2, 
  Circle,
  Quote,
  Clock,
  Ban,
  Cross,
  Pill,
  Plus
} from 'lucide-react';
import { User, Challenge, DailyLog } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface DashboardProps {
  user: User;
  challenge: Challenge;
  onUpdateUser: (user: User) => void;
}

export default function Dashboard({ user, challenge, onUpdateUser }: DashboardProps) {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [quote, setQuote] = useState<{ quote: string; reference?: string; author?: string } | null>(null);
  const [streak, setStreak] = useState(0);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchLog();
    fetchQuote();
    calculateStreak();
  }, [user.religious_mode]);

  const fetchLog = async () => {
    const res = await fetch(`/api/logs/daily/${user.id}/${today}`);
    const data = await res.json();
    if (data) {
      setLog(data);
    } else {
      setLog({
        user_id: user.id,
        challenge_id: challenge.id,
        log_date: today,
        water_intake_glasses: 0,
        steps_count: 0,
        workouts_done: 0,
        cardio_done: 0,
        reading_done: 0,
        reading_type: 'regular',
        bible_study_done: 0,
        prayer_done: 0,
        fasting_done: 0,
        nicotine_free: 0,
        alcohol_free: 0,
        porn_free: 0,
        meds_taken: challenge.meds_vitamins.map(m => ({ name: m.name, taken: false })),
        notes: ''
      });
    }
  };

  const fetchQuote = async () => {
    const res = await fetch(`/api/ai/quote?religious=${user.religious_mode}`);
    const data = await res.json();
    setQuote(data);
  };

  const calculateStreak = () => {
    const start = new Date(challenge.start_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setStreak(diffDays);
  };

  const toggleTask = async (field: keyof DailyLog, value: any) => {
    if (!log) return;
    const updatedLog = { ...log, [field]: value };
    setLog(updatedLog);

    await fetch('/api/logs/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        challengeId: challenge.id,
        date: today,
        data: updatedLog
      })
    });
  };

  const TaskItem = ({ icon: Icon, label, completed, onClick, sublabel, color = "brand-accent" }: any) => (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
        completed 
          ? "bg-emerald-500/10 border-emerald-500/30" 
          : "bg-white/5 border-white/10 hover:border-white/20"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          completed ? "bg-emerald-500 text-white" : `bg-white/10 text-brand-muted`
        )}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <p className={cn("font-medium", completed ? "text-white" : "text-brand-muted")}>{label}</p>
          {sublabel && <p className="text-xs text-brand-muted">{sublabel}</p>}
        </div>
      </div>
      {completed ? <CheckCircle2 className="text-emerald-500" size={24} /> : <Circle className="text-white/10" size={24} />}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header & Streak */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Day {streak}</h1>
          <p className="text-brand-muted mt-1">Keep pushing, {user.profile?.name || 'Member'}.</p>
        </div>
        <div className="flex items-center gap-4 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-4 px-6 accent-glow">
          <div className="w-12 h-12 bg-brand-accent rounded-xl flex items-center justify-center">
            <Flame className="text-white" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">Current Streak</p>
            <p className="text-2xl font-display font-bold">{streak} Days</p>
          </div>
        </div>
      </div>

      {/* Quote Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 relative overflow-hidden"
      >
        <Quote className="absolute top-4 right-4 text-brand-accent/10" size={80} />
        <div className="relative z-10">
          <p className="text-xl font-medium italic leading-relaxed">
            "{quote?.quote || 'The only way to achieve the impossible is to believe it is possible.'}"
          </p>
          <p className="text-brand-accent mt-4 font-display font-bold">
            — {quote?.reference || quote?.author || 'Forge75'}
          </p>
        </div>
      </motion.div>

      {/* Daily Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskItem 
          icon={Droplets} 
          label="Water Intake" 
          sublabel={`${log?.water_intake_glasses || 0} / ${challenge.water_goal_glasses} glasses`}
          completed={(log?.water_intake_glasses || 0) >= challenge.water_goal_glasses}
          onClick={() => toggleTask('water_intake_glasses', (log?.water_intake_glasses || 0) + 1)}
        />
        <TaskItem 
          icon={Zap} 
          label="Daily Steps" 
          sublabel={`${log?.steps_count || 0} / ${challenge.steps_goal} steps`}
          completed={(log?.steps_count || 0) >= challenge.steps_goal}
          onClick={() => toggleTask('steps_count', challenge.steps_goal)}
        />
        <TaskItem 
          icon={Activity} 
          label="Workouts" 
          sublabel={`${log?.workouts_done || 0} / ${challenge.workouts_count} sessions`}
          completed={(log?.workouts_done || 0) >= challenge.workouts_count}
          onClick={() => toggleTask('workouts_done', (log?.workouts_done || 0) + 1)}
        />
        <TaskItem 
          icon={Clock} 
          label="Cardio Session" 
          sublabel={`${challenge.cardio_minutes} minutes`}
          completed={!!log?.cardio_done}
          onClick={() => toggleTask('cardio_done', log?.cardio_done ? 0 : 1)}
        />
        <TaskItem 
          icon={BookOpen} 
          label="Reading" 
          sublabel={`${challenge.reading_goal_pages} pages`}
          completed={!!log?.reading_done}
          onClick={() => toggleTask('reading_done', log?.reading_done ? 0 : 1)}
        />
        {user.religious_mode && (
          <TaskItem 
            icon={Cross} 
            label="Bible Study" 
            sublabel="Daily Scripture"
            completed={!!log?.bible_study_done}
            onClick={() => toggleTask('bible_study_done', log?.bible_study_done ? 0 : 1)}
          />
        )}
        {challenge.prayer_devotion && (
          <TaskItem 
            icon={Cross} 
            label="Prayer / Devotion" 
            completed={!!log?.prayer_done}
            onClick={() => toggleTask('prayer_done', log?.prayer_done ? 0 : 1)}
          />
        )}
        {challenge.quit_nicotine && (
          <TaskItem 
            icon={Ban} 
            label="Nicotine Free" 
            completed={!!log?.nicotine_free}
            onClick={() => toggleTask('nicotine_free', log?.nicotine_free ? 0 : 1)}
          />
        )}
        {challenge.quit_alcohol && (
          <TaskItem 
            icon={Ban} 
            label="Alcohol Free" 
            completed={!!log?.alcohol_free}
            onClick={() => toggleTask('alcohol_free', log?.alcohol_free ? 0 : 1)}
          />
        )}
      </div>

      {/* Meds & Vitamins */}
      {challenge.meds_vitamins.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold">Medications & Supplements</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenge.meds_vitamins.map((med, i) => {
              const taken = log?.meds_taken.find(m => m.name === med.name)?.taken;
              return (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const newMeds = [...(log?.meds_taken || [])];
                    const idx = newMeds.findIndex(m => m.name === med.name);
                    if (idx > -1) {
                      newMeds[idx].taken = !newMeds[idx].taken;
                    } else {
                      newMeds.push({ name: med.name, taken: true });
                    }
                    toggleTask('meds_taken', newMeds);
                  }}
                  className={cn(
                    "relative overflow-hidden p-5 rounded-3xl border transition-all text-left group",
                    taken 
                      ? "bg-emerald-500/10 border-emerald-500/30" 
                      : "bg-white/5 border-white/10 hover:border-brand-accent/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      taken ? "bg-emerald-500 text-white" : "bg-white/10 text-brand-muted group-hover:bg-brand-accent/20 group-hover:text-brand-accent"
                    )}>
                      <Pill size={24} />
                    </div>
                    {taken && (
                      <div className="bg-emerald-500 rounded-full p-1">
                        <CheckCircle2 size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className={cn("font-bold text-lg", taken ? "text-white" : "text-brand-text")}>{med.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-brand-muted" />
                      <span className="text-xs text-brand-muted font-medium">{med.time}</span>
                      <span className="text-[10px] text-brand-muted bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                        {med.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      taken ? "text-emerald-400" : "text-brand-muted"
                    )}>
                      {taken ? 'Completed' : 'Pending'}
                    </span>
                    <span className="text-[10px] text-brand-muted opacity-50 uppercase font-bold tracking-widest">
                      {med.type}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
