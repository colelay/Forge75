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
  Trash2
} from 'lucide-react';
import { User, Challenge, MedConfig } from '../types';
import { cn } from '../lib/utils';

interface ProfileViewProps {
  user: User;
  challenge: Challenge | null;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  setActiveTab: (tab: string) => void;
}

export default function ProfileView({ user, challenge, onLogout, onUpdateUser, setActiveTab }: ProfileViewProps) {
  const [isEditingMeds, setIsEditingMeds] = useState(false);
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
    if (window.confirm("Are you sure? This will delete ALL your progress and food logs. This cannot be undone.")) {
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
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-brand-accent/30 accent-glow">
          {user.profile?.starting_photo_url ? (
            <img src={user.profile.starting_photo_url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-card flex items-center justify-center">
              <UserIcon size={40} className="text-brand-muted" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">{user.profile?.name || 'Member'}</h1>
          <p className="text-brand-muted">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[10px] bg-brand-accent/20 text-brand-accent px-2 py-1 rounded-full font-bold uppercase tracking-wider">
              {challenge ? 'Challenge Active' : 'No Active Challenge'}
            </span>
            {user.profile && (
              <span className="text-[10px] bg-white/10 text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                {Math.floor(user.profile.height / 12)}'{user.profile.height % 12}" | {user.profile.starting_weight} lbs
              </span>
            )}
            {user.is_subscribed && (
              <span className="text-[10px] bg-emerald-400/20 text-emerald-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                Premium Member
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings Section */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Settings className="text-brand-accent" size={20} />
              Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <Cross size={18} className="text-brand-muted" />
                  <div>
                    <p className="text-sm font-medium">Religious Mode</p>
                    <p className="text-xs text-brand-muted">Bible quotes & devotions</p>
                  </div>
                </div>
                <button 
                  onClick={toggleReligious}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    user.religious_mode ? "bg-brand-accent" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    user.religious_mode ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-brand-muted" />
                  <div>
                    <p className="text-sm font-medium">Diabetes Mode</p>
                    <p className="text-xs text-brand-muted">Low sugar recipe focus</p>
                  </div>
                </div>
                <button 
                  onClick={toggleDiabetes}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    user.has_diabetes ? "bg-brand-accent" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    user.has_diabetes ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-brand-muted" />
                  <div>
                    <p className="text-sm font-medium">Notifications</p>
                    <p className="text-xs text-brand-muted">Reminders for tasks & meds</p>
                  </div>
                </div>
                <button className="w-12 h-6 rounded-full bg-brand-accent relative">
                  <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
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
                <div className="p-4 rounded-xl bg-brand-accent/5 border border-brand-accent/20">
                  <p className="text-xs text-brand-muted italic">"Variables are locked once a challenge begins. To change these, you must reset your progress."</p>
                </div>
                {user.is_admin && (
                  <button 
                    onClick={() => setActiveTab('admin')}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-all font-bold"
                  >
                    <ShieldCheck size={18} />
                    Admin Dashboard
                  </button>
                )}
                <button 
                  onClick={handleResetChallenge}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-all font-bold"
                >
                  <RefreshCw size={18} />
                  Reset Challenge
                </button>
              </div>
            ) : (
              <p className="text-brand-muted text-center py-8">No active challenge configuration found.</p>
            )}
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 text-brand-muted hover:text-white hover:bg-white/10 transition-all font-bold"
          >
            <LogOut size={20} />
            Logout from Forge75
          </button>
        </div>
      </div>
    </div>
  );
}
