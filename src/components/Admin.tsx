import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Users, 
  Ticket, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';

interface AdminViewProps {
  user: User;
  onBack: () => void;
}

export default function AdminView({ user, onBack }: AdminViewProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'promos'>('users');
  const [newPromo, setNewPromo] = useState({ code: '', discount_type: 'free', discount_value: 0 });
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchPromos();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
  };

  const fetchPromos = async () => {
    const res = await fetch('/api/admin/promo-codes');
    const data = await res.json();
    setPromoCodes(data);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;
    setStatus(null);
    const res = await fetch('/api/admin/set-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: user.id, email: newAdminEmail.trim(), isAdmin: true })
    });
    
    if (res.ok) {
      setNewAdminEmail('');
      setStatus({ type: 'success', message: 'Admin added successfully' });
      fetchUsers();
    } else {
      const data = await res.json();
      setStatus({ type: 'error', message: data.error || 'Failed to add admin' });
    }
  };

  const handleToggleAdmin = async (email: string, currentStatus: boolean) => {
    if (email.toLowerCase() === 'clay8888yt@gmail.com') return;
    setStatus(null);
    const res = await fetch('/api/admin/set-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: user.id, email: email.trim(), isAdmin: !currentStatus })
    });
    
    if (res.ok) {
      setStatus({ type: 'success', message: `Admin ${!currentStatus ? 'added' : 'removed'} successfully` });
      fetchUsers();
    } else {
      const data = await res.json();
      setStatus({ type: 'error', message: data.error || 'Failed to update admin' });
    }
  };

  const handleTogglePromo = async (id: number, currentStatus: boolean) => {
    await fetch('/api/admin/toggle-promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !currentStatus })
    });
    fetchPromos();
  };

  const handleCreatePromo = async () => {
    await fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPromo)
    });
    setNewPromo({ code: '', discount_type: 'free', discount_value: 0 });
    fetchPromos();
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-display font-bold tracking-tight">Admin Control</h1>
        </div>

        <div className="flex gap-4 border-b border-white/10">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "pb-4 px-2 font-bold transition-all relative",
              activeTab === 'users' ? "text-brand-accent" : "text-brand-muted"
            )}
          >
            Users
            {activeTab === 'users' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-accent" />}
          </button>
          <button 
            onClick={() => setActiveTab('promos')}
            className={cn(
              "pb-4 px-2 font-bold transition-all relative",
              activeTab === 'promos' ? "text-brand-accent" : "text-brand-muted"
            )}
          >
            Promo Codes
            {activeTab === 'promos' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-accent" />}
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4">Add New Administrator</h3>
              <div className="flex gap-2 mb-4">
                <input 
                  placeholder="Email address"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-accent"
                />
                <button 
                  onClick={handleAddAdmin}
                  className="bg-brand-accent px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"
                >
                  Add Admin
                </button>
              </div>
              {status && (
                <div className={cn(
                  "p-3 rounded-xl text-xs font-bold flex items-center gap-2",
                  status.type === 'success' ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                )}>
                  {status.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {status.message}
                </div>
              )}
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-4 text-xs font-bold uppercase text-brand-muted">User</th>
                    <th className="p-4 text-xs font-bold uppercase text-brand-muted">Role</th>
                    <th className="p-4 text-xs font-bold uppercase text-brand-muted">Subscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => {
                    const isFounder = u.email.toLowerCase() === 'clay8888yt@gmail.com';
                    return (
                      <tr key={u.id} className="hover:bg-white/5 transition-all">
                        <td className="p-4">{u.email}</td>
                        <td className="p-4">
                          {isFounder ? (
                            <span className="text-brand-accent flex items-center gap-1 text-sm font-bold">
                              <Shield size={14} /> Founder
                            </span>
                          ) : u.is_admin ? (
                            <div className="flex items-center gap-3">
                              <span className="text-emerald-400 flex items-center gap-1 text-sm font-bold">
                                <Shield size={14} /> Admin
                              </span>
                              <button 
                                onClick={() => handleToggleAdmin(u.email, true)}
                                className="text-[10px] text-red-400 hover:underline font-bold uppercase"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleToggleAdmin(u.email, false)}
                              className="text-brand-muted hover:text-white text-sm transition-all"
                            >
                              Make Admin
                            </button>
                          )}
                        </td>
                        <td className="p-4">
                          {u.is_subscribed ? (
                            <span className="text-emerald-400 text-sm font-bold">Active</span>
                          ) : (
                            <span className="text-brand-muted text-sm">Free</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'promos' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4">Create Promo Code</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input 
                  placeholder="CODE"
                  value={newPromo.code}
                  onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-accent"
                />
                <select 
                  value={newPromo.discount_type}
                  onChange={e => setNewPromo({...newPromo, discount_type: e.target.value})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-accent"
                >
                  <option value="free">Free Subscription</option>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
                <input 
                  type="number"
                  placeholder="Value"
                  value={newPromo.discount_value}
                  onChange={e => setNewPromo({...newPromo, discount_value: parseFloat(e.target.value)})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-accent"
                  disabled={newPromo.discount_type === 'free'}
                />
                <button 
                  onClick={handleCreatePromo}
                  className="bg-brand-accent px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"
                >
                  Create
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promoCodes.map(p => (
                <div key={p.id} className="glass-card p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xl font-display font-bold text-brand-accent">{p.code}</p>
                    <p className="text-sm text-brand-muted capitalize">{p.discount_type} {p.discount_type !== 'free' ? `(${p.discount_value})` : ''}</p>
                  </div>
                  <button 
                    onClick={() => handleTogglePromo(p.id, p.is_active)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all",
                      p.is_active ? "bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30" : "bg-red-400/20 text-red-400 hover:bg-red-400/30"
                    )}
                  >
                    {p.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
