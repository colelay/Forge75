import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  CreditCard, 
  User as UserIcon, 
  Settings, 
  Camera,
  ArrowRight,
  ArrowLeft,
  Cross,
  Droplets,
  Activity,
  BookOpen,
  Zap,
  Clock,
  Ban,
  Flame
} from 'lucide-react';
import { User, MedConfig } from '../types';
import { cn } from '../lib/utils';

interface OnboardingProps {
  user: User;
  onComplete: () => void;
}

type Step = 'payment' | 'profile' | 'challenge';

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('payment');
  const [profile, setProfile] = useState({
    name: '',
    phone: user.phone || '',
    height_ft: '',
    height_in: '',
    starting_weight: '',
    goal_weight: '',
    why_statement: '',
    religious_mode: false,
    has_diabetes: false,
    dietary_restrictions: [] as string[],
    photo: null as string | null
  });

  const dietaryOptions = [
    'Fish', 'Dairy', 'Gluten', 'Nuts', 'Shellfish', 'Soy', 'Eggs', 'Pork', 'Beef'
  ];

  const toggleDietary = (option: string) => {
    setProfile(prev => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.includes(option)
        ? prev.dietary_restrictions.filter(o => o !== option)
        : [...prev.dietary_restrictions, option]
    }));
  };

  const [challenge, setChallenge] = useState({
    water_goal_glasses: 16,
    steps_goal: 10000,
    workouts_count: 2,
    cardio_minutes: 45,
    reading_goal_pages: 10,
    prayer_devotion: false,
    fasting_hours: 0,
    quit_nicotine: false,
    quit_alcohol: false,
    quit_porn: false,
    meds_vitamins: [] as MedConfig[],
    macro_calories: 2000,
    macro_protein: 150,
    macro_carbs: 200,
    macro_fat: 70
  });

  const handlePayment = () => setStep('profile');

  const [newMed, setNewMed] = useState<MedConfig>({
    name: '',
    time: '',
    quantity: '',
    type: 'medicine'
  });

  const handleAddMed = () => {
    if (newMed.name && newMed.time) {
      setChallenge({
        ...challenge,
        meds_vitamins: [...challenge.meds_vitamins, newMed]
      });
      setNewMed({ name: '', time: '', quantity: '', type: 'medicine' });
    }
  };

  const removeMed = (index: number) => {
    setChallenge({
      ...challenge,
      meds_vitamins: challenge.meds_vitamins.filter((_, i) => i !== index)
    });
  };

  const handleProfileSubmit = async () => {
    if (!profile.name || !profile.phone || !profile.height_ft || !profile.starting_weight || !profile.goal_weight || !profile.why_statement || !profile.photo) {
      alert('Please fill in all required fields (Name, Phone, Height, Weight, Goal Weight, Why, and Photo)');
      return;
    }
    const totalInches = (parseInt(profile.height_ft) * 12) + parseInt(profile.height_in || '0');
    await fetch(`/api/profile/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...profile,
        height: totalInches,
        starting_weight: parseFloat(profile.starting_weight),
        goal_weight: parseFloat(profile.goal_weight),
        starting_photo_url: profile.photo,
        dietary_restrictions: profile.dietary_restrictions.join(',')
      })
    });
    setStep('challenge');
  };

  const generateMacros = () => {
    const goalWeight = parseFloat(profile.goal_weight) || 150;
    const calories = Math.round(goalWeight * 12);
    const protein = Math.round(goalWeight * 1.0);
    const fat = Math.round(goalWeight * 0.35);
    const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4);

    setChallenge(prev => ({
      ...prev,
      macro_calories: calories,
      macro_protein: protein,
      macro_carbs: carbs,
      macro_fat: fat
    }));
  };

  const handleChallengeSubmit = async () => {
    if (!challenge.water_goal_glasses || !challenge.steps_goal || !challenge.workouts_count || !challenge.cardio_minutes || !challenge.macro_calories) {
      alert('Please fill in all required challenge goals (Water, Steps, Workouts, Cardio, and Macros)');
      return;
    }
    await fetch('/api/challenge/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        config: challenge
      })
    });
    onComplete();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile({ ...profile, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {step === 'payment' && (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 text-center"
            >
              <div className="w-16 h-16 bg-brand-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CreditCard className="text-brand-accent" size={32} />
              </div>
              <h2 className="text-3xl font-display font-black mb-4 tracking-tighter">Forge Your Future</h2>
              <p className="text-brand-muted mb-8 font-medium">Unlock the full Forge75 experience with a premium subscription. Track macros, get AI recipes, and visualize your progress.</p>
              
              <div className="bg-white/5 border border-brand-accent/30 rounded-2xl p-6 mb-8 text-left relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <span className="font-black text-xl tracking-tight uppercase">Forge Premium</span>
                  <span className="text-brand-accent font-display font-black text-3xl">$9.99<span className="text-sm text-brand-muted font-bold">/mo</span></span>
                </div>
                <ul className="space-y-3">
                  {[
                    'Customizable 75-Day Challenge',
                    'AI-Powered Recipe Generation',
                    'Advanced Macro & Food Tracking',
                    'Progress Visualizations & Graphs',
                    'Religious/Devotion Mode'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-brand-muted">
                      <CheckCircle2 className="text-brand-accent" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={handlePayment}
                className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all accent-glow flex items-center justify-center gap-2"
              >
                Subscribe Now
                <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 technical-lines pt-12"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-xl flex items-center justify-center">
                  <UserIcon className="text-brand-accent" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-black tracking-tighter">Your Profile</h2>
                  <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.3em]">Let's set your baseline stats.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Full Name</label>
                  <input 
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-accent font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Phone Number</label>
                  <input 
                    value={profile.phone}
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-accent font-medium"
                    placeholder="+1 123 456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      value={profile.height_ft}
                      onChange={e => setProfile({...profile, height_ft: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-accent font-medium"
                      placeholder="ft"
                    />
                    <input 
                      type="number"
                      value={profile.height_in}
                      onChange={e => setProfile({...profile, height_in: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-accent font-medium"
                      placeholder="in"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Starting Weight (lbs)</label>
                  <input 
                    type="number"
                    value={profile.starting_weight}
                    onChange={e => setProfile({...profile, starting_weight: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-accent font-medium"
                    placeholder="185"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Goal Weight (lbs)</label>
                  <input 
                    type="number"
                    value={profile.goal_weight}
                    onChange={e => setProfile({...profile, goal_weight: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-accent font-medium"
                    placeholder="170"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Foods you won't eat (Dietary Restrictions)</label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => toggleDietary(option)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs transition-all",
                        profile.dietary_restrictions.includes(option)
                          ? "bg-brand-accent/20 border-brand-accent text-brand-accent"
                          : "bg-white/5 border-white/10 text-brand-muted hover:border-white/20"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-sm font-medium text-brand-muted">Your "Why"</label>
                <textarea 
                  value={profile.why_statement}
                  onChange={e => setProfile({...profile, why_statement: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-accent h-24 resize-none"
                  placeholder="Why are you doing this challenge? What is your motivation?"
                />
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <button 
                  onClick={() => setProfile({...profile, religious_mode: !profile.religious_mode})}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all",
                    profile.religious_mode ? "bg-brand-accent/20 border-brand-accent text-brand-accent" : "bg-white/5 border-white/10 text-brand-muted"
                  )}
                >
                  <Cross size={18} />
                  Religious Mode
                </button>
                <button 
                  onClick={() => setProfile({...profile, has_diabetes: !profile.has_diabetes})}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all",
                    profile.has_diabetes ? "bg-brand-accent/20 border-brand-accent text-brand-accent" : "bg-white/5 border-white/10 text-brand-muted"
                  )}
                >
                  <Activity size={18} />
                  Diabetes Mode
                </button>
              </div>

              <div className="mb-8">
                <label className="text-sm font-medium text-brand-muted block mb-2">Starting Photo</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-48 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center group-hover:border-brand-accent transition-all">
                    {profile.photo ? (
                      <img src={profile.photo} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <>
                        <Camera className="text-brand-muted mb-2" size={32} />
                        <span className="text-sm text-brand-muted">Upload Progress Photo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleProfileSubmit}
                className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all accent-glow flex items-center justify-center gap-2"
              >
                Continue to Setup
                <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'challenge' && (
            <motion.div 
              key="challenge"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 technical-lines pt-12"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-xl flex items-center justify-center">
                  <Settings className="text-brand-accent" size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-black tracking-tighter italic uppercase text-brand-accent">Challenge Setup</h2>
                  <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.3em]">Customize your 75-day journey.</p>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted flex items-center gap-2">
                      <Droplets size={14} /> Water Goal (glasses)
                    </label>
                    <input 
                      type="number"
                      value={challenge.water_goal_glasses}
                      onChange={e => setChallenge({...challenge, water_goal_glasses: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted flex items-center gap-2">
                      <Zap size={14} /> Daily Steps
                    </label>
                    <input 
                      type="number"
                      value={challenge.steps_goal}
                      onChange={e => setChallenge({...challenge, steps_goal: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted flex items-center gap-2">
                      <Activity size={14} /> Workouts/Day
                    </label>
                    <input 
                      type="number"
                      value={challenge.workouts_count}
                      onChange={e => setChallenge({...challenge, workouts_count: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted flex items-center gap-2">
                      <Clock size={14} /> Cardio (min)
                    </label>
                    <input 
                      type="number"
                      value={challenge.cardio_minutes}
                      onChange={e => setChallenge({...challenge, cardio_minutes: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'quit_nicotine', label: 'Quit Nicotine', icon: Ban },
                    { id: 'quit_alcohol', label: 'Quit Alcohol', icon: Ban },
                    { id: 'quit_porn', label: 'Quit Porn', icon: Ban },
                    { id: 'prayer_devotion', label: 'Prayer/Devotion', icon: Cross },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setChallenge({...challenge, [item.id]: !challenge[item.id as keyof typeof challenge]})}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border text-sm transition-all font-light",
                        challenge[item.id as keyof typeof challenge] ? "bg-brand-accent/20 border-brand-accent text-brand-accent" : "bg-white/5 border-white/10 text-brand-muted"
                      )}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-brand-muted flex items-center gap-2">
                    <BookOpen size={14} /> Reading (pages/day)
                  </label>
                  <input 
                    type="number"
                    value={challenge.reading_goal_pages}
                    onChange={e => setChallenge({...challenge, reading_goal_pages: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-light"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <label className="text-xs font-medium uppercase tracking-wider text-brand-muted flex items-center gap-2">
                    <Activity size={14} /> Medications & Supplements
                  </label>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {challenge.meds_vitamins.map((med, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <p className="font-medium text-sm">{med.name}</p>
                          <p className="text-xs text-brand-muted font-light">{med.quantity} at {med.time} ({med.type})</p>
                        </div>
                        <button 
                          onClick={() => removeMed(i)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="glass-card p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        placeholder="Name (e.g. Vitamin D)"
                        value={newMed.name}
                        onChange={e => setNewMed({...newMed, name: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm font-light"
                      />
                      <input 
                        placeholder="Time (e.g. 8:00 AM)"
                        value={newMed.time}
                        onChange={e => setNewMed({...newMed, time: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm font-light"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        placeholder="Quantity (e.g. 1 pill)"
                        value={newMed.quantity}
                        onChange={e => setNewMed({...newMed, quantity: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm font-light"
                      />
                      <select 
                        value={newMed.type}
                        onChange={e => setNewMed({...newMed, type: e.target.value as any})}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm font-light"
                      >
                        <option value="medicine">Medicine</option>
                        <option value="vitamin">Vitamin</option>
                        <option value="supplement">Supplement</option>
                      </select>
                    </div>
                    <button 
                      onClick={handleAddMed}
                      className="w-full bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      + Add Medication/Supplement
                    </button>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-black text-2xl italic uppercase text-brand-accent flex items-center gap-2">
                      <Flame className="text-brand-accent" size={24} />
                      Daily Macro Targets
                    </h3>
                    <button 
                      onClick={generateMacros}
                      className="text-xs bg-brand-accent/10 text-brand-accent px-3 py-1.5 rounded-lg font-medium hover:bg-brand-accent/20 transition-all"
                    >
                      Auto Generate
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-brand-muted uppercase font-medium">Calories</label>
                      <input 
                        type="number"
                        value={challenge.macro_calories || ''}
                        onChange={e => setChallenge({...challenge, macro_calories: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-muted uppercase font-medium">Protein (g)</label>
                      <input 
                        type="number"
                        value={challenge.macro_protein || ''}
                        onChange={e => setChallenge({...challenge, macro_protein: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-muted uppercase font-medium">Carbs (g)</label>
                      <input 
                        type="number"
                        value={challenge.macro_carbs || ''}
                        onChange={e => setChallenge({...challenge, macro_carbs: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-brand-muted uppercase font-medium">Fat (g)</label>
                      <input 
                        type="number"
                        value={challenge.macro_fat || ''}
                        onChange={e => setChallenge({...challenge, macro_fat: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep('profile')}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
                <button 
                  onClick={handleChallengeSubmit}
                  className="flex-[2] bg-brand-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all accent-glow flex items-center justify-center gap-2"
                >
                  Start Challenge
                  <Flame size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
