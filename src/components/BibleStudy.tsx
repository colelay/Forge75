import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  BookOpen, 
  Cross, 
  Quote, 
  Save,
  RefreshCw,
  Search,
  Book,
  Sparkles,
  ChevronRight,
  Plus
} from 'lucide-react';
import { User } from '../types';
import { format } from 'date-fns';
import { generateQuote, fetchSpecificVerse } from '../services/geminiService';
import { cn } from '../lib/utils';

interface BibleStudyProps {
  user: User;
  onBack: () => void;
}

export default function BibleStudy({ user, onBack }: BibleStudyProps) {
  const [quote, setQuote] = useState<{ quote: string; reference: string; meaning?: string; reflectionPrompt?: string } | null>(null);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customReference, setCustomReference] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'study' | 'history'>('study');
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchQuote();
    fetchLog();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const res = await fetch(`/api/bible-studies/${user.id}`);
    const data = await res.json();
    setHistory(data);
  };

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const data = await generateQuote(true);
      // Also get meaning for the daily quote
      const detailedData = await fetchSpecificVerse(data.reference);
      setQuote(detailedData);
    } catch (error) {
      console.error("Failed to generate quote", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customReference.trim()) return;
    
    setLoading(true);
    try {
      const data = await fetchSpecificVerse(customReference);
      setQuote(data);
      setShowCustomInput(false);
      setCustomReference('');
      setError(null);
    } catch (error) {
      setError("Could not find that verse. Please check the reference (e.g., 'John 3:16').");
    } finally {
      setLoading(false);
    }
  };

  const fetchLog = async () => {
    const res = await fetch(`/api/logs/daily/${user.id}/${today}`);
    const data = await res.json();
    if (data?.notes) {
      setReflection(data.notes);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/logs/daily/${user.id}/${today}`);
    const currentLog = await res.json();

    const updatedLog = {
      ...currentLog,
      notes: reflection,
      bible_study_done: 1
    };

    await fetch('/api/logs/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        challengeId: currentLog.challenge_id,
        date: today,
        data: updatedLog
      })
    });

    // Save to bible_studies table
    await fetch('/api/bible-studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        date: today,
        scripture: quote?.reference || 'Daily Verse',
        reflection: reflection
      })
    });

    setSaving(false);
    fetchHistory();
  };

  return (
    <div className="space-y-8 pb-32 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter uppercase text-brand-text">Bible Study</h1>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-4">
            <button 
              onClick={() => setActiveTab('study')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest italic transition-all",
                activeTab === 'study' ? "bg-brand-accent text-white" : "text-brand-muted hover:text-white"
              )}
            >
              Study
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest italic transition-all",
                activeTab === 'history' ? "bg-brand-accent text-white" : "text-brand-muted hover:text-white"
              )}
            >
              History
            </button>
          </div>
          <button 
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={cn(
              "p-3 rounded-xl transition-all border",
              showCustomInput ? "bg-brand-accent text-white border-brand-accent" : "bg-white/5 border-white/10 text-brand-muted hover:text-white"
            )}
          >
            <Search size={20} />
          </button>
          <button 
            onClick={fetchQuote}
            disabled={loading}
            className="p-3 bg-white/5 border border-white/10 rounded-xl text-brand-muted hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {activeTab === 'study' ? (
        <>
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs font-bold uppercase tracking-widest mb-6 flex justify-between items-center"
              >
                {error}
                <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded-full">
                  <Plus className="rotate-45" size={14} />
                </button>
              </motion.div>
            )}
            {showCustomInput && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleCustomSearch}
                className="overflow-hidden"
              >
                <div className="glass-card p-4 flex gap-2 mb-6">
                  <input 
                    autoFocus
                    placeholder="Enter verse reference (e.g. Philippians 4:13)"
                    value={customReference}
                    onChange={e => setCustomReference(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-accent transition-all text-sm"
                  />
                  <button 
                    type="submit"
                    className="bg-brand-accent px-6 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all text-brand-text-inverse"
                  >
                    Fetch
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-brand-accent/10 transition-all duration-1000" />
                <Cross className="absolute bottom-4 right-4 text-brand-accent/5" size={160} />
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                      <Book size={20} />
                    </div>
                    <h2 className="micro-label text-brand-accent">Scripture of the Day</h2>
                  </div>

                  {loading ? (
                    <div className="py-12 space-y-4">
                      <div className="h-8 bg-white/5 rounded-lg animate-pulse w-3/4" />
                      <div className="h-8 bg-white/5 rounded-lg animate-pulse w-full" />
                      <div className="h-8 bg-white/5 rounded-lg animate-pulse w-1/2" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-2xl md:text-4xl font-serif italic leading-tight text-brand-text/90">
                        "{quote?.quote || 'Select a verse to begin your study.'}"
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-brand-accent/50 to-transparent" />
                        <p className="text-xl font-display font-black tracking-tight uppercase text-brand-accent">
                          — {quote?.reference || '...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-400">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="micro-label text-emerald-400">What it means</h3>
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
                    <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
                    <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                  </div>
                ) : (
                  <p className="text-brand-muted leading-relaxed font-medium">
                    {quote?.meaning || 'Select a verse to see its deeper meaning and how it applies to your journey.'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="glass-card p-6 border-brand-accent/20">
                <h3 className="text-lg font-display font-black mb-6 flex items-center gap-2 tracking-tight uppercase text-brand-text">
                  <BookOpen className="text-brand-accent" size={20} />
                  Reflection
                </h3>
                
                <div className="space-y-4">
                  {quote?.reflectionPrompt && (
                    <div className="p-4 rounded-xl bg-brand-accent/5 border border-brand-accent/10 mb-4">
                      <p className="text-xs text-brand-accent font-bold uppercase mb-2 tracking-widest">Prompt</p>
                      <p className="text-sm italic text-brand-muted leading-relaxed">
                        "{quote.reflectionPrompt}"
                      </p>
                    </div>
                  )}

                  <textarea 
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="What is God speaking to you through this verse today?"
                    className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-brand-accent resize-none text-sm leading-relaxed transition-all"
                  />
                  
                  <button 
                    onClick={handleSave}
                    disabled={saving || !reflection.trim()}
                    className="w-full bg-brand-accent hover:bg-blue-600 text-brand-text-inverse py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-50 accent-glow"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Complete Study'}
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h4 className="micro-label">Quick Tips</h4>
                <ul className="space-y-3">
                  {[
                    'Read the surrounding context',
                    'Pray before you reflect',
                    'Apply one action point today'
                  ].map((tip, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs text-brand-muted font-medium">
                      <ChevronRight size={14} className="text-brand-accent" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.map((study, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 space-y-4 border-white/10 hover:border-brand-accent/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black italic uppercase tracking-widest text-brand-accent">{study.scripture}</h3>
                <span className="text-[10px] micro-label opacity-50">{format(new Date(study.log_date), 'MMMM d, yyyy')}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 italic font-serif text-brand-text/80 leading-relaxed">
                "{study.reflection}"
              </div>
            </motion.div>
          ))}
          {history.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Book size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
              <p className="text-brand-muted micro-label">No previous studies found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
