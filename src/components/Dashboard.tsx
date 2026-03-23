import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Plus,
  RefreshCw,
  Award,
  Lock,
  Share2
} from 'lucide-react';
import { User, Challenge, DailyLog } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { generateQuote } from '../services/geminiService';
import ShareStory from './ShareStory';

interface DashboardProps {
  user: User;
  challenge: Challenge;
  onUpdateUser: (user: User) => void;
  setActiveTab: (tab: string) => void;
}

const TaskItem = ({ icon: Icon, label, completed, onClick, sublabel }: any) => (
  <motion.button 
    whileHover={{ scale: 1.005 }}
    whileTap={{ scale: 0.995 }}
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 text-left",
      completed 
        ? "bg-emerald-500/5 border-emerald-500/20" 
        : "bg-white/[0.02] border-white/5 hover:border-white/10"
    )}
  >
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
        completed ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]" : `bg-white/5 text-brand-muted`
      )}>
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div>
        <p className={cn("text-sm font-medium tracking-tight", completed ? "text-white" : "text-brand-muted")}>{label}</p>
        {sublabel && <p className="text-[10px] micro-label mt-0.5">{sublabel}</p>}
      </div>
    </div>
    <div className={cn(
      "w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0",
      completed ? "bg-emerald-500 border-emerald-500" : "border-white/10"
    )}>
      {completed && <CheckCircle2 className="text-white" size={12} />}
    </div>
  </motion.button>
);

export default function Dashboard({ user, challenge, onUpdateUser, setActiveTab }: DashboardProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [log, setLog] = useState<DailyLog>({
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
  const [quote, setQuote] = useState<{ quote: string; reference?: string; author?: string } | null>(null);
  const [streak, setStreak] = useState(0);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ whatWorked: '', whatDidntWork: '' });
  const [hasReportedToday, setHasReportedToday] = useState(false);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showShareStory, setShowShareStory] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    fetchLog();
    fetchQuote();
    calculateStreak();
    fetchReports();
    fetchStats();
  }, [user.religious_mode]);

  const fetchStats = async () => {
    const res = await fetch(`/api/stats/history/${user.id}`);
    const data = await res.json();
    setStats(data);
  };

  const fetchReports = async () => {
    const res = await fetch(`/api/social/reports/${user.id}`);
    const data = await res.json();
    setAllReports(data);
    const todayReport = data.find((r: any) => r.day_number === streak);
    if (todayReport) setHasReportedToday(true);
  };

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
    setLoadingQuote(true);
    try {
      const data = await generateQuote(user.religious_mode);
      setQuote(data);
    } catch (error) {
      console.error("Failed to generate quote", error);
    } finally {
      setLoadingQuote(false);
    }
  };

  const calculateStreak = () => {
    const start = new Date(challenge.start_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setStreak(Math.max(1, diffDays));
  };

  const toggleTask = async (field: keyof DailyLog, value: any) => {
    setLog(prev => {
      const updated = { ...prev, [field]: value };
      
      fetch('/api/logs/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          challengeId: challenge.id,
          date: today,
          data: updated
        })
      }).catch(err => console.error("Failed to update task", err));

      return updated;
    });
  };
  const calculateCompletion = () => {
    if (!log) return 0;
    let total = 5; // Base tasks: Water, Steps, 2 Workouts (counted as 1 goal), Cardio, Reading
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
      completed += log.meds_taken.filter(m => m.taken).length;
    }

    return Math.round((completed / total) * 100);
  };


  const handleFinalize = async () => {
    try {
      const res = await fetch('/api/logs/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, date: today })
      });
      if (res.ok) {
        setLog(prev => ({ ...prev, is_finalized: true }));
        // Check for periodic report
        if ((streak === 1 || streak % 5 === 0) && !hasReportedToday) {
          setShowReportModal(true);
        }
      }
    } catch (err) {
      console.error("Failed to finalize day", err);
    }
  };

  const handleSubmitReport = async () => {
    await fetch('/api/social/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        dayNumber: streak,
        whatWorked: reportData.whatWorked,
        whatDidntWork: reportData.whatDidntWork
      })
    });
    setHasReportedToday(true);
    setShowReportModal(false);
    fetchReports();
  };

  const completion = calculateCompletion();

  if (log.is_finalized) {
    return (
      <div className="space-y-8 md:space-y-12 pb-32 dot-pattern">
        {/* Header & Streak */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 technical-lines pt-8 relative">
          <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-brand-accent/20 rounded-tl-lg pointer-events-none" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-6xl font-sans font-black tracking-tighter uppercase">Day <span className="text-brand-accent drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">{streak}</span></h1>
              <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 backdrop-blur-sm">
                COMPLETED
              </div>
            </div>
            <p className="text-brand-muted text-sm font-medium tracking-wide">Forging resilience, <span className="text-brand-text font-bold">{user.profile?.name || 'Member'}</span>.</p>
          </div>
          <div className="flex items-center gap-6 bg-white/[0.03] border border-white/10 rounded-xl p-6 px-10 backdrop-blur-xl shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-16 h-16 bg-brand-accent/20 rounded-lg flex items-center justify-center border border-brand-accent/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Flame className="text-brand-accent" size={32} strokeWidth={2} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            </div>
            <div className="relative">
              <p className="micro-label mb-1 font-black text-brand-accent/80">Current Streak</p>
              <p className="text-4xl font-sans font-black tracking-tighter">{streak} <span className="text-sm text-brand-muted font-bold uppercase tracking-widest">Days</span></p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center space-y-6 border-emerald-500/20 bg-emerald-500/5"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <Award className="text-white" size={40} />
          </div>
          <h2 className="text-3xl font-display font-black tracking-tighter italic uppercase">Your challenge today has been completed</h2>
          <p className="text-brand-muted max-w-md mx-auto">You've successfully forged another day of discipline. Rest well, warrior. Tomorrow we go again.</p>
          
          {log?.notes && (
            <div className="max-w-md mx-auto p-6 bg-white/5 rounded-2xl border border-white/10 text-left">
              <p className="micro-label opacity-50 mb-2">Today's Reflection</p>
              <p className="text-sm italic text-brand-text leading-relaxed">"{log.notes}"</p>
            </div>
          )}

          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <button 
              onClick={() => setShowShareStory(true)}
              className="w-full bg-brand-accent py-4 rounded-2xl font-black uppercase tracking-widest italic flex items-center justify-center gap-2 accent-glow transition-all"
            >
              <Share2 size={18} /> Share Today's Forge
            </button>
            <button 
              onClick={() => setActiveTab('progress')}
              className="text-brand-muted font-bold uppercase tracking-widest text-xs hover:underline"
            >
              View Progress History
            </button>
          </div>
        </motion.div>

        <ShareStory 
          isOpen={showShareStory}
          onClose={() => setShowShareStory(false)}
          user={user}
          stats={stats}
          streak={streak}
          verse={quote}
          reflection={log?.notes}
        />

        {/* Quote Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent/30 to-violet-500/30 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="glass-card p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-10 border-white/10 shadow-2xl !rounded-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Quote size={80} className="text-white" />
            </div>
            <div className="w-1.5 h-16 bg-brand-accent rounded-full hidden md:block shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
            <div className="relative z-10 flex-1">
              <p className="text-xl md:text-2xl font-serif leading-relaxed text-brand-text font-medium selection:bg-brand-accent/30 text-center md:text-left">
                "{quote?.quote || 'The only way to achieve the impossible is to believe it is possible.'}"
              </p>
              <div className="flex items-center gap-4 mt-8 justify-center md:justify-start">
                <div className="h-px w-8 bg-brand-accent/30" />
                <p className="text-brand-accent micro-label font-black text-xs">
                  {quote?.reference || quote?.author || 'Forge75'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 pb-32 dot-pattern">
      {/* Header & Streak */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 technical-lines pt-8 relative">
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-brand-accent/20 rounded-tl-lg pointer-events-none" />
        <div className="flex-1">
          <h1 className="text-4xl md:text-6xl font-sans font-black tracking-tighter uppercase mb-2">Day <span className="text-brand-accent drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">{streak}</span></h1>
          <p className="text-brand-muted text-sm font-medium tracking-wide">Forging resilience, <span className="text-brand-text font-bold">{user.profile?.name || 'Member'}</span>.</p>
        </div>
        <div className="flex items-center gap-6 bg-white/[0.03] border border-white/10 rounded-xl p-6 px-10 backdrop-blur-xl shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="w-16 h-16 bg-brand-accent/20 rounded-lg flex items-center justify-center border border-brand-accent/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Flame className="text-brand-accent" size={32} strokeWidth={2} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
          </div>
          <div className="relative">
            <p className="micro-label mb-1 font-black text-brand-accent/80">Current Streak</p>
            <p className="text-4xl font-sans font-black tracking-tighter">{streak} <span className="text-sm text-brand-muted font-bold uppercase tracking-widest">Days</span></p>
          </div>
        </div>
      </div>

      {/* Quote Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent/30 to-violet-500/30 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="glass-card p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-10 border-white/10 shadow-2xl !rounded-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Quote size={80} className="text-white" />
          </div>
          <button 
            onClick={fetchQuote}
            disabled={loadingQuote}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-brand-muted hover:text-white transition-all disabled:opacity-50 z-20"
          >
            <RefreshCw size={16} className={loadingQuote ? "animate-spin" : ""} />
          </button>
          <div className="w-1.5 h-16 bg-brand-accent rounded-full hidden md:block shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
          <div className="relative z-10 flex-1">
            <p className="text-xl md:text-2xl font-serif leading-relaxed text-brand-text font-medium selection:bg-brand-accent/30 text-center md:text-left">
              "{quote?.quote || 'The only way to achieve the impossible is to believe it is possible.'}"
            </p>
            <div className="flex items-center gap-4 mt-8 justify-center md:justify-start">
              <div className="h-px w-8 bg-brand-accent/30" />
              <p className="text-brand-accent micro-label font-black text-xs">
                {quote?.reference || quote?.author || 'Forge75'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Daily Tasks */}
      <div className="space-y-6 pt-8 technical-lines">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm micro-label">Daily Objectives</h3>
          <p className="text-[10px] text-brand-muted/40 font-medium uppercase tracking-widest">Interactive Log</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TaskItem 
            icon={Droplets} 
            label="Water Intake" 
            sublabel={`${log?.water_intake_glasses || 0} / ${challenge.water_goal_glasses} glasses`}
            completed={(log?.water_intake_glasses || 0) >= challenge.water_goal_glasses}
            onClick={() => toggleTask('water_intake_glasses', (log?.water_intake_glasses || 0) >= challenge.water_goal_glasses ? 0 : (log?.water_intake_glasses || 0) + 1)}
          />
          <TaskItem 
            icon={Zap} 
            label="Daily Steps" 
            sublabel={`${log?.steps_count || 0} / ${challenge.steps_goal} steps`}
            completed={(log?.steps_count || 0) >= challenge.steps_goal}
            onClick={() => toggleTask('steps_count', (log?.steps_count || 0) >= challenge.steps_goal ? 0 : challenge.steps_goal)}
          />
          <TaskItem 
            icon={Activity} 
            label="Workouts" 
            sublabel={`${log?.workouts_done || 0} / ${challenge.workouts_count} sessions`}
            completed={(log?.workouts_done || 0) >= challenge.workouts_count}
            onClick={() => toggleTask('workouts_done', (log?.workouts_done || 0) >= challenge.workouts_count ? 0 : (log?.workouts_done || 0) + 1)}
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
              sublabel="Daily Scripture & Reflection"
              completed={!!log?.bible_study_done}
              onClick={() => setActiveTab('bible')}
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
      </div>

      {/* Meds & Vitamins */}
      {challenge.meds_vitamins.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm micro-label">Medications & Supplements</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenge.meds_vitamins.map((med, i) => {
              const taken = log?.meds_taken.find(m => m.name === med.name)?.taken;
              return (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
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
                    "flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 text-left group",
                    taken 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500",
                    taken ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 text-brand-muted group-hover:bg-brand-accent/10 group-hover:text-brand-accent"
                  )}>
                    <Pill size={18} strokeWidth={1.5} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("text-sm font-medium tracking-tight truncate", taken ? "text-white" : "text-brand-text")}>{med.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] micro-label tracking-widest">{med.time}</span>
                      <span className="text-[10px] text-brand-muted/30">•</span>
                      <span className="text-[10px] micro-label tracking-widest">{med.quantity}</span>
                    </div>
                  </div>

                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0",
                    taken ? "bg-emerald-500 border-emerald-500" : "border-white/10"
                  )}>
                    {taken && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Finalize Day Button */}
      <div className="pt-8 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFinalize}
          className={cn(
            "w-full max-w-md py-4 rounded-2xl font-black uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 shadow-2xl",
            completion >= 100 
              ? "bg-brand-accent text-white accent-glow" 
              : "bg-white/5 text-brand-muted border border-white/10 hover:border-brand-accent/30"
          )}
        >
          <Flame size={20} />
          Forge the Day
        </motion.button>
      </div>

      {/* Milestones Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-black tracking-tighter italic uppercase text-brand-accent flex items-center gap-3">
            <Award size={20} />
            Milestones
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {[1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75].map((day) => {
            const report = allReports.find(r => r.day_number === day);
            const isLocked = streak < day;
            return (
              <motion.button
                key={day}
                whileHover={!isLocked ? { scale: 1.05, y: -2 } : {}}
                whileTap={!isLocked ? { scale: 0.95 } : {}}
                onClick={() => report && setSelectedReport(report)}
                className={cn(
                  "relative aspect-square rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 overflow-hidden group",
                  isLocked 
                    ? "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed" 
                    : report 
                      ? "bg-brand-accent/10 border-brand-accent/30 hover:bg-brand-accent/20" 
                      : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                {isLocked ? (
                  <Lock size={16} className="text-brand-muted" />
                ) : report ? (
                  <CheckCircle2 size={16} className="text-brand-accent" />
                ) : (
                  <RefreshCw size={16} className="text-brand-muted group-hover:text-brand-accent transition-colors" />
                )}
                <span className="text-xs font-black italic uppercase tracking-widest">Day {day}</span>
                {report && (
                  <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-display font-black tracking-tighter italic uppercase text-brand-accent">Day {selectedReport.day_number} Reflection</h2>
                  <p className="micro-label text-brand-muted mt-1">Forge Check-in</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <Plus className="rotate-45 text-brand-muted" size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="micro-label text-brand-accent mb-3 border-b border-brand-accent/20 pb-1">What worked well</h4>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm leading-relaxed italic text-brand-text/80">
                    "{selectedReport.what_worked}"
                  </div>
                </div>
                <div>
                  <h4 className="micro-label text-brand-accent mb-3 border-b border-brand-accent/20 pb-1">What needs adjustment</h4>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm leading-relaxed italic text-brand-text/80">
                    "{selectedReport.what_didnt_work}"
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Periodic Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-accent/30">
                  <RefreshCw className="text-brand-accent" size={32} />
                </div>
                <h2 className="text-2xl font-display font-black tracking-tighter italic uppercase text-brand-accent">Time to check on your forge</h2>
                <p className="text-brand-muted text-xs mt-2 uppercase tracking-widest font-bold">Day {streak} Milestone</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="micro-label mb-2 block">What has worked well so far?</label>
                  <textarea 
                    value={reportData.whatWorked}
                    onChange={(e) => setReportData({ ...reportData, whatWorked: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors font-medium h-24 resize-none"
                    placeholder="Share your wins..."
                  />
                </div>
                <div>
                  <label className="micro-label mb-2 block">What hasn't worked or needs adjustment?</label>
                  <textarea 
                    value={reportData.whatDidntWork}
                    onChange={(e) => setReportData({ ...reportData, whatDidntWork: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors font-medium h-24 resize-none"
                    placeholder="Identify the friction..."
                  />
                </div>

                <button 
                  onClick={handleSubmitReport}
                  disabled={!reportData.whatWorked || !reportData.whatDidntWork}
                  className="w-full bg-brand-accent hover:bg-blue-600 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest italic accent-glow transition-all"
                >
                  Submit Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
