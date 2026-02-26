import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  MessageSquare, 
  Share2, 
  Search, 
  Send,
  ArrowLeft,
  X,
  Shield,
  Cross
} from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface SocialViewProps {
  user: User;
  onBack: () => void;
}

export default function SocialView({ user, onBack }: SocialViewProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSharing, setIsSharing] = useState(user.share_progress || false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    const res = await fetch('/api/social/users');
    const data = await res.json();
    setUsers(data.filter((u: any) => u.id !== user.id));
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    const res = await fetch(`/api/social/messages/${user.id}/${selectedUser.id}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    await fetch('/api/social/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: user.id,
        receiverId: selectedUser.id,
        content: newMessage
      })
    });
    setNewMessage('');
    fetchMessages();
  };

  const toggleSharing = async () => {
    const newVal = !isSharing;
    await fetch('/api/social/share-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, share: newVal })
    });
    setIsSharing(newVal);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-all">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-display font-bold tracking-tight">Social Forge</h1>
          </div>
          <button 
            onClick={toggleSharing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all",
              isSharing ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-brand-muted border border-white/10"
            )}
          >
            <Share2 size={18} />
            {isSharing ? 'Sharing Active' : 'Share Progress'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User List */}
          <div className="md:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
              <input 
                placeholder="Search members..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-brand-accent"
              />
            </div>
            <div className="space-y-2">
              {users.map(u => (
                <button 
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
                    selectedUser?.id === u.id ? "bg-brand-accent/10 border-brand-accent/30" : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-card">
                    {u.starting_photo_url ? (
                      <img src={u.starting_photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-muted">
                        <Users size={20} />
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold truncate">{u.name || u.email.split('@')[0]}</p>
                    <div className="flex items-center gap-2">
                      {u.religious_mode && <Cross size={10} className="text-brand-accent" />}
                      <p className="text-[10px] text-brand-muted uppercase font-bold">Active Member</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat / Profile View */}
          <div className="md:col-span-2">
            {selectedUser ? (
              <div className="glass-card h-[600px] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-brand-card">
                      <img src={selectedUser.starting_photo_url} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold">{selectedUser.name}</p>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase">Online</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex flex-col max-w-[80%]",
                      m.sender_id === user.id ? "ml-auto items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm",
                        m.sender_id === user.id ? "bg-brand-accent text-white rounded-tr-none" : "bg-white/10 text-white rounded-tl-none"
                      )}>
                        {m.content}
                      </div>
                      <span className="text-[10px] text-brand-muted mt-1">
                        {format(new Date(m.created_at), 'h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-white/10 bg-white/5">
                  <div className="flex gap-2">
                    <input 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-accent"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="bg-brand-accent p-3 rounded-xl hover:bg-blue-600 transition-all"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card h-[600px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent mb-6">
                  <MessageSquare size={40} />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">Member Connections</h3>
                <p className="text-brand-muted max-w-sm">
                  Connect with other members, share progress, and keep each other accountable on the forge.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
