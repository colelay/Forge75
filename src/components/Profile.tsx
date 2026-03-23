import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Bell, 
  Cross, 
  Activity, 
  Shield, 
  LogOut,
  RefreshCw,
  Settings,
  Pill,
  ShieldCheck,
  Trash2,
  Camera,
  Upload,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { User, Challenge, MedConfig } from '../types';
import { cn, normalizePhone } from '../lib/utils';

interface ProfileViewProps {
  user: User;
  challenge: Challenge | null;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  setActiveTab: (tab: string) => void;
}

export default function ProfileView({ user, challenge, onLogout, onUpdateUser, setActiveTab }: ProfileViewProps) {
  const [isEditingMeds, setIsEditingMeds] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [meds, setMeds] = useState<MedConfig[]>(challenge?.meds_vitamins || []);
  const [newMed, setNewMed] = useState<MedConfig>({
    name: '',
    time: '',
    quantity: '',
    type: 'medicine'
  });

  const handleAddMed = () => {
    if (newMed.name && newMed.time) {
      setMeds([...meds, newMed]);
      setNewMed({ name: '', time: '', quantity: '', type: 'medicine' });
    }
  };

  const toggleReligious = async () => {
    const newVal = !user.religious_mode;
    const res = await fetch(`/api/profile/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...user.profile,
        religious_mode: newVal,
        has_diabetes: user.has_diabetes
      })
    });
    if (res.ok) onUpdateUser({ ...user, religious_mode: newVal });
  };

  const toggleDiabetes = async () => {
    const newVal = !user.has_diabetes;
    const res = await fetch(`/api/profile/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...user.profile,
        religious_mode: user.religious_mode,
        has_diabetes: newVal
      })
    });
    if (res.ok) onUpdateUser({ ...user, has_diabetes: newVal });
  };

  const toggleTheme = async () => {
    const newTheme = user.theme === 'light' ? 'dark' : 'light';
    const res = await fetch(`/api/profile/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme })
    });
    if (res.ok) onUpdateUser({ ...user, theme: newTheme });
  };

  const updateAccentColor = async (color: string) => {
    const res = await fetch(`/api/profile/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accent_color: color })
    });
    if (res.ok) onUpdateUser({ ...user, accent_color: color });
  };

  const toggleNotifications = async () => {
    const newVal = !user.notifications_enabled;
    const res = await fetch(`/api/profile/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications_enabled: newVal })
    });
    if (res.ok) onUpdateUser({ ...user, notifications_enabled: newVal });
  };

  const handleUpdateMeds = async () => {
    if (!challenge) return;
    await fetch('/api/challenge/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        config: { ...challenge, meds_vitamins: meds }
      })
    });
    setIsEditingMeds(false);
    window.location.reload();
  };

  const handleResetChallenge = async () => {
    try {
      const res = await fetch('/api/challenge/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to reset challenge. Please try again.");
      }
    } catch (err) {
      alert("Connection error. Please try again.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const res = await fetch(`/api/profile/photo/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: base64 })
      });
      if (res.ok) {
        onUpdateUser({
          ...user,
          profile: user.profile ? { ...user.profile, starting_photo_url: base64 } : undefined
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const dietaryOptions = [
    'Fish', 'Dairy', 'Gluten', 'Nuts', 'Shellfish', 'Soy', 'Eggs', 'Pork', 'Beef'
  ];

  const toggleDietary = async (option: string) => {
    const current = user.profile?.dietary_restrictions?.split(',') || [];
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    
    const res = await fetch(`/api/profile/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...user.profile,
        religious_mode: user.religious_mode,
        has_diabetes: user.has_diabetes,
        dietary_restrictions: updated.join(',')
      })
    });
    if (res.ok) {
      onUpdateUser({
        ...user,
        profile: user.profile ? { ...user.profile, dietary_restrictions: updated.join(',') } : undefined
      });
    }
  };

  const updatePhone = async (phone: string) => {
    const normalized = normalizePhone(phone);
    const res = await fetch(`/api/profile/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...user.profile,
        religious_mode: user.religious_mode,
        has_diabetes: user.has_diabetes,
        phone: normalized
      })
    });
    if (res.ok) onUpdateUser({ ...user, phone: normalized });
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-brand-accent/30 accent-glow relative group shrink-0">
          {user.profile?.starting_photo_url ? (
            <img src={user.profile.starting_photo_url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-card flex items-center justify-center">
              <UserIcon size={40} className="text-brand-muted" />
            </div>
          )}
          <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
            <Camera size={24} className="text-brand-text-inverse mb-1" />
            <span className="text-[10px] font-bold uppercase text-brand-text-inverse">Update</span>
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-4xl font-display font-black tracking-tighter truncate">{user.profile?.name || 'Member'}</h1>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-brand-muted text-sm truncate font-medium">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <input 
                type="tel"
                placeholder="Add phone number"
                value={user.phone || ''}
                onChange={(e) => onUpdateUser({ ...user, phone: e.target.value })}
                onBlur={(e) => updatePhone(e.target.value)}
                className="bg-transparent text-sm text-brand-muted border-none p-0 focus:ring-0 w-full sm:w-40 text-center sm:text-left placeholder:text-brand-muted/50 font-bold"
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
            <span className="text-[10px] bg-brand-accent/20 text-brand-accent px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] border border-brand-accent/20">
              {challenge ? 'Challenge Active' : 'No Active Challenge'}
            </span>
            {user.profile && (
              <span className="text-[10px] bg-white/10 text-brand-text px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] border border-white/10">
                {Math.floor(user.profile.height / 12)}'{user.profile.height % 12}" | {user.profile.starting_weight} lbs
              </span>
            )}
            {user.is_subscribed && (
              <span className="text-[10px] bg-emerald-400/20 text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] border border-emerald-400/20">
                Premium Member
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
            <h3 className="text-lg font-display font-black mb-6 flex items-center gap-2 tracking-tight">
              <Settings className="text-brand-accent" size={20} />
              Preferences
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Cross size={18} className="text-brand-muted" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Religious Mode</p>
                    <p className="text-[10px] text-brand-muted font-medium">Bible quotes & devotions</p>
                  </div>
                </div>
                <button 
                  onClick={toggleReligious}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative shadow-inner",
                    user.religious_mode ? "bg-brand-accent" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md",
                    user.religious_mode ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-brand-muted" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Diabetes Mode</p>
                    <p className="text-[10px] text-brand-muted font-medium">Low sugar recipe focus</p>
                  </div>
                </div>
                <button 
                  onClick={toggleDiabetes}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative shadow-inner",
                    user.has_diabetes ? "bg-brand-accent" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md",
                    user.has_diabetes ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-brand-muted" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Notifications</p>
                    <p className="text-[10px] text-brand-muted font-medium">Enable daily reminders</p>
                  </div>
                </div>
                <button 
                  onClick={toggleNotifications}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative shadow-inner",
                    user.notifications_enabled ? "bg-brand-accent" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md",
                    user.notifications_enabled ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  {user.theme === 'light' ? <Sun size={18} className="text-brand-muted" /> : <Moon size={18} className="text-brand-muted" />}
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Theme</p>
                    <p className="text-[10px] text-brand-muted font-medium">Switch to {user.theme === 'light' ? 'Dark' : 'Light'} Mode</p>
                  </div>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative shadow-inner",
                    user.theme === 'light' ? "bg-brand-accent" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md",
                    user.theme === 'light' ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 px-1">
                  <Palette size={14} className="text-brand-accent" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted">Accent Color</p>
                </div>
                <div className="flex flex-wrap gap-3 px-1">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#ffffff'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateAccentColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                        user.accent_color === color ? "border-white scale-110 shadow-lg" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted px-1">Dietary Restrictions</p>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map(option => {
                    const isActive = user.profile?.dietary_restrictions?.split(',').includes(option);
                    return (
                      <button
                        key={option}
                        onClick={() => toggleDietary(option)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all",
                          isActive 
                            ? "bg-brand-accent/20 border-brand-accent text-brand-accent" 
                            : "bg-white/5 border-white/10 text-brand-muted hover:border-white/20"
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-light mb-4 flex items-center gap-2">
              <Pill className="text-brand-accent" size={20} />
              Meds & Vitamins
            </h3>
            <div className="space-y-4">
              {meds.map((med, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-sm font-medium">{med.name}</p>
                    <p className="text-xs text-brand-muted">{med.quantity} at {med.time}</p>
                  </div>
                  {isEditingMeds && (
                    <button 
                      onClick={() => setMeds(meds.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {isEditingMeds ? (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="glass-card p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        placeholder="Name"
                        value={newMed.name}
                        onChange={e => setNewMed({...newMed, name: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm"
                      />
                      <input 
                        placeholder="Time"
                        value={newMed.time}
                        onChange={e => setNewMed({...newMed, time: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        placeholder="Quantity"
                        value={newMed.quantity}
                        onChange={e => setNewMed({...newMed, quantity: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm"
                      />
                      <select 
                        value={newMed.type}
                        onChange={e => setNewMed({...newMed, type: e.target.value as any})}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm"
                      >
                        <option value="medicine">Medicine</option>
                        <option value="vitamin">Vitamin</option>
                        <option value="supplement">Supplement</option>
                      </select>
                    </div>
                    <button 
                      onClick={handleAddMed}
                      className="w-full bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditingMeds(false)}
                      className="flex-1 bg-white/5 py-2 rounded-lg text-sm font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpdateMeds}
                      className="flex-1 bg-brand-accent py-2 rounded-lg text-sm font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingMeds(true)}
                  className="w-full bg-white/5 hover:bg-white/10 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Edit Meds
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Challenge Config Section */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Shield className="text-brand-accent" size={20} />
              Challenge Configuration
            </h3>
            {challenge ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-[10px] font-bold text-brand-muted uppercase">Water Goal</p>
                    <p className="text-lg font-display font-bold">{challenge.water_goal_glasses} glasses</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-[10px] font-bold text-brand-muted uppercase">Steps Goal</p>
                    <p className="text-lg font-display font-bold">{challenge.steps_goal}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-[10px] font-bold text-brand-muted uppercase">Workouts</p>
                    <p className="text-lg font-display font-bold">{challenge.workouts_count}/day</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-[10px] font-bold text-brand-muted uppercase">Cardio</p>
                    <p className="text-lg font-display font-bold">{challenge.cardio_minutes} min</p>
                  </div>
                </div>
                {user.profile && (
                  <p className="text-xs text-brand-muted italic">"Variables are locked once a challenge begins. To change these, you must reset your progress."</p>
                )}
                {(user.is_admin || user.email?.toLowerCase() === 'clay8888yt@gmail.com') && (
                  <button 
                    onClick={() => setActiveTab('admin')}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-all font-bold"
                  >
                    <ShieldCheck size={18} />
                    Admin Dashboard
                  </button>
                )}
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-all font-black uppercase tracking-widest text-xs"
                >
                  <RefreshCw size={18} />
                  Reset Challenge
                </button>
              </div>
            ) : (
              <p className="text-brand-muted text-center py-8 font-medium">No active challenge configuration found.</p>
            )}
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 text-brand-muted hover:text-white hover:bg-white/10 transition-all font-black uppercase tracking-widest text-xs"
          >
            <LogOut size={20} />
            Logout from Forge75
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowResetConfirm(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card p-8 max-w-md w-full relative z-10 border-red-500/20"
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-display font-black text-center mb-4">Reset Progress?</h2>
            <p className="text-brand-muted text-center mb-8 font-medium leading-relaxed">
              This will permanently delete ALL your progress, food logs, and photo history. This action <span className="text-red-400 font-bold underline">cannot be undone</span>.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleResetChallenge}
                className="flex-1 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-brand-text-inverse font-black shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all"
              >
                Reset
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
