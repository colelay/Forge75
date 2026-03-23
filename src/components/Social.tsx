import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MessageSquare, 
  Share2, 
  Search, 
  Send,
  ArrowLeft,
  X,
  Shield,
  Cross,
  Plus,
  Phone,
  Globe,
  Music,
  Heart,
  MessageCircle,
  Trophy,
  UserPlus,
  Activity,
  Trash2,
  Hash,
  Crown,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { User } from '../types';
import { cn, normalizePhone } from '../lib/utils';
import { format } from 'date-fns';
import ShareStory from './ShareStory';

interface SocialViewProps {
  user: User;
  onBack: () => void;
}

export default function SocialView({ user, onBack }: SocialViewProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'playlists' | 'connections'>('feed');
  const [users, setUsers] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState('general');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [globalMessages, setGlobalMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSharing, setIsSharing] = useState(user.share_progress || false);
  const [phoneToChallenge, setPhoneToChallenge] = useState('');
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showSharePlaylistModal, setShowSharePlaylistModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [viewingUserProgress, setViewingUserProgress] = useState<any | null>(null);
  const [remoteLogs, setRemoteLogs] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [editingChannel, setEditingChannel] = useState<any | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showShareStory, setShowShareStory] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchConnections();
    fetchGroups();
    fetchPlaylists();
    fetchGlobalMessages();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const res = await fetch(`/api/stats/history/${user.id}`);
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMessages();
      fetchGroupMembers();
      fetchChannels();
    }
  }, [selectedGroup, activeChannel]);

  const fetchChannels = async () => {
    if (!selectedGroup) return;
    const res = await fetch(`/api/social/groups/${selectedGroup.id}/channels`);
    const data = await res.json();
    setChannels(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/social/users');
    const data = await res.json();
    setUsers(data.filter((u: any) => u.id !== user.id));
  };

  const fetchConnections = async () => {
    const res = await fetch(`/api/social/connections/${user.id}`);
    const data = await res.json();
    setConnections(data);
  };

  const fetchGroups = async () => {
    const res = await fetch('/api/social/groups');
    const data = await res.json();
    setGroups(data);
  };

  const fetchPlaylists = async () => {
    const res = await fetch('/api/social/playlists');
    const data = await res.json();
    setPlaylists(data);
  };

  const fetchGlobalMessages = async () => {
    const res = await fetch(`/api/social/messages/global`);
    const data = await res.json();
    setGlobalMessages(data);
  };

  const fetchGroupMessages = async () => {
    if (!selectedGroup) return;
    const res = await fetch(`/api/social/groups/${selectedGroup.id}/messages?channelId=${activeChannel}`);
    const data = await res.json();
    setGroupMessages(data);
  };

  const fetchGroupMembers = async () => {
    if (!selectedGroup) return;
    const res = await fetch(`/api/social/groups/${selectedGroup.id}/members`);
    const data = await res.json();
    setGroupMembers(data);
  };

  const handleChallengeByPhone = async () => {
    const normalized = normalizePhone(phoneToChallenge);
    if (!normalized) return;
    try {
      const res = await fetch('/api/social/challenge-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, phone: normalized })
      });
      if (res.ok) {
        alert("Challenge request sent!");
        setPhoneToChallenge('');
        setShowChallengeModal(false);
        fetchConnections();
      } else {
        const err = await res.json();
        alert(err.error || "User not found or error occurred");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendGlobalMessage = async () => {
    if (!newMessage.trim() && !newImage) return;
    await fetch('/api/social/messages/global', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        content: newMessage,
        imageUrl: newImage
      })
    });
    setNewMessage('');
    setNewImage(null);
    fetchGlobalMessages();
  };

  const handleSendGroupMessage = async () => {
    if ((!newMessage.trim() && !newImage) || !selectedGroup) return;
    await fetch(`/api/social/groups/${selectedGroup.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        content: newMessage,
        channelId: activeChannel,
        imageUrl: newImage
      })
    });
    setNewMessage('');
    setNewImage(null);
    fetchGroupMessages();
  };

  const handleDeleteMessage = async (messageId: number) => {
    await fetch(`/api/social/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    fetchGlobalMessages();
    fetchGroupMessages();
  };

  const handleJoinGroup = async (groupId: number) => {
    const res = await fetch(`/api/social/groups/${groupId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    if (res.ok) {
      alert("Joined group!");
      fetchGroups();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to join group");
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    await fetch(`/api/social/playlists/${playlistId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    fetchPlaylists();
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    await fetch('/api/social/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newGroupName,
        description: newGroupDesc,
        category: 'general',
        userId: user.id
      })
    });
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateGroupModal(false);
    fetchGroups();
  };

  const handleSharePlaylist = async () => {
    if (!newPlaylistName.trim() || !newPlaylistUrl.trim()) return;
    await fetch('/api/social/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        name: newPlaylistName,
        url: newPlaylistUrl,
        category: 'motivation'
      })
    });
    setNewPlaylistName('');
    setNewPlaylistUrl('');
    setShowSharePlaylistModal(false);
    fetchPlaylists();
  };

  const handleViewProgress = async (targetUser: any) => {
    setViewingUserProgress(targetUser);
    setShowProgressModal(true);
    const res = await fetch(`/api/logs/user/${targetUser.connected_user_id || targetUser.id}`);
    const data = await res.json();
    setRemoteLogs(data);
  };

  const currentUserMember = groupMembers.find(m => m.user_id === user.id);
  const isGroupAdmin = currentUserMember?.role === 'admin' || currentUserMember?.role === 'founder' || user.is_admin;

  const handleAddChannel = async () => {
    if (!newChannelName.trim() || !selectedGroup) return;
    await fetch(`/api/social/groups/${selectedGroup.id}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newChannelName.toLowerCase().replace(/\s+/g, '-') })
    });
    setNewChannelName('');
    fetchChannels();
  };

  const handleDeleteChannel = async (channelId: number) => {
    await fetch(`/api/social/channels/${channelId}`, { method: 'DELETE' });
    fetchChannels();
  };

  const handleRenameChannel = async (channelId: number, name: string) => {
    await fetch(`/api/social/channels/${channelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.toLowerCase().replace(/\s+/g, '-') })
    });
    fetchChannels();
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white p-4 md:p-8 dot-pattern">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-2xl transition-all">
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <h1 className="text-4xl font-display font-black tracking-tighter italic uppercase text-brand-accent">Social Forge</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowShareStory(true)}
              className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] italic flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <Share2 size={14} />
              Share Story
            </button>
            <button 
              onClick={() => setShowChallengeModal(true)}
              className="bg-brand-accent px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] italic flex items-center gap-2 accent-glow"
            >
              <Trophy size={14} />
              Challenge Someone
            </button>
            <button 
              onClick={toggleSharing}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] italic",
                isSharing ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-brand-muted border border-white/10"
              )}
            >
              <Share2 size={14} strokeWidth={2} />
              {isSharing ? 'Sharing Active' : 'Share Progress'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          {[
            { id: 'feed', label: 'Feed', icon: Globe },
            { id: 'groups', label: 'Groups', icon: Users },
            { id: 'playlists', label: 'Playlists', icon: Music },
            { id: 'connections', label: 'Connections', icon: UserPlus }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] italic",
                activeTab === tab.id ? "bg-brand-accent text-white shadow-lg" : "text-brand-muted hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[500px]">
          {activeTab === 'feed' && (
            <div className="glass-card flex flex-col h-[600px] overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <Globe className="text-brand-accent" size={20} />
                <h3 className="font-display font-black italic uppercase tracking-widest text-sm">Global Message Board</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {globalMessages.map((m, i) => (
                  <div key={i} className={cn(
                    "flex gap-4",
                    m.user_id === user.id ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/10">
                      {m.starting_photo_url ? (
                        <img src={m.starting_photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-muted">
                          <Users size={16} />
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "flex flex-col max-w-[80%]",
                      m.user_id === user.id ? "items-end" : "items-start"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent flex items-center gap-1">
                          {m.user_name || 'Member'}
                          {m.is_admin === 1 && m.email !== 'clay8888yt@gmail.com' && <span className="bg-brand-accent/20 px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1"><Shield size={8} /> Admin</span>}
                          {m.email === 'clay8888yt@gmail.com' && <span className="bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1"><Crown size={8} /> Founder</span>}
                        </span>
                        <span className="text-[8px] opacity-30">{format(new Date(m.created_at), 'h:mm a')}</span>
                      </div>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed group relative",
                          m.user_id === user.id ? "bg-brand-accent text-white rounded-tr-none" : "bg-white/10 text-white/90 rounded-tl-none"
                        )}>
                          {m.content}
                          {m.image_url && (
                            <img src={m.image_url} className="mt-2 rounded-lg max-w-full h-auto border border-white/10" referrerPolicy="no-referrer" />
                          )}
                          {(m.user_id === user.id || user.is_admin) && (
                          <button 
                            onClick={() => handleDeleteMessage(m.id)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                {newImage && (
                  <div className="mb-4 relative inline-block">
                    <img src={newImage} className="h-20 w-20 object-cover rounded-xl border border-white/10" />
                    <button onClick={() => setNewImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  <label className="bg-white/5 p-3.5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border border-white/10">
                    <Plus size={20} strokeWidth={2} className="text-brand-muted" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <input 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendGlobalMessage()}
                    placeholder="Post to the global board..."
                    className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3.5 outline-none focus:border-brand-accent/50 transition-all text-sm font-medium"
                  />
                  <button 
                    onClick={handleSendGlobalMessage}
                    disabled={isUploading}
                    className="bg-brand-accent p-3.5 rounded-2xl hover:bg-blue-600 transition-all accent-glow disabled:opacity-50"
                  >
                    <Send size={20} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'groups' && !selectedGroup && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="glass-card p-6 flex flex-col justify-between border-white/10 hover:border-brand-accent/30 transition-all"
                >
                  <div onClick={() => setSelectedGroup(group)} className="cursor-pointer">
                    <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent mb-4">
                      {group.category === 'run-club' ? <Activity size={24} /> : 
                       group.category === 'bible-study' ? <Cross size={24} /> : 
                       <Users size={24} />}
                    </div>
                    <h3 className="text-xl font-display font-black italic uppercase tracking-tight mb-2">{group.name}</h3>
                    <p className="text-brand-muted text-sm mb-6">{group.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] micro-label opacity-50">{group.member_count || 0} Members</span>
                    <button 
                      onClick={() => handleJoinGroup(group.id)}
                      className="text-brand-accent font-black uppercase tracking-widest text-[10px] italic hover:underline"
                    >
                      Join Group
                    </button>
                  </div>
                </motion.div>
              ))}
              <button 
                onClick={() => setShowCreateGroupModal(true)}
                className="glass-card p-6 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-brand-accent/50 transition-all group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-brand-muted group-hover:text-brand-accent transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-black uppercase tracking-widest text-[10px] italic text-brand-muted group-hover:text-white">Create New Group</span>
              </button>
            </div>
          )}

          {activeTab === 'groups' && selectedGroup && (
            <div className="glass-card flex flex-col h-[700px] overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h3 className="font-display font-black italic uppercase tracking-widest text-sm">{selectedGroup.name}</h3>
                    <p className="text-[8px] micro-label opacity-50">#{activeChannel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {groupMembers.slice(0, 3).map((m, i) => (
                      <div key={i} className="w-8 h-8 rounded-lg border-2 border-brand-card overflow-hidden bg-white/5">
                        {m.starting_photo_url ? <img src={m.starting_photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">{m.name[0]}</div>}
                      </div>
                    ))}
                    {groupMembers.length > 3 && (
                      <div className="w-8 h-8 rounded-lg border-2 border-brand-card bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        +{groupMembers.length - 3}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowChannelSettings(true)}
                    className="p-2 hover:bg-white/5 rounded-xl transition-all text-brand-muted"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                {/* Channels Sidebar */}
                <div className="w-48 border-r border-white/5 bg-white/[0.01] p-4 space-y-2 hidden md:block">
                  <div className="flex items-center justify-between mb-4">
                    <p className="micro-label opacity-30">Channels</p>
                    {isGroupAdmin && (
                      <button 
                        onClick={() => setShowChannelSettings(true)}
                        className="p-1 hover:bg-white/5 rounded text-brand-muted hover:text-white transition-all"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                  {channels.map(ch => (
                    <button 
                      key={ch.id || ch.name}
                      onClick={() => setActiveChannel(ch.name)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest italic transition-all",
                        activeChannel === ch.name ? "bg-brand-accent text-white" : "text-brand-muted hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Hash size={12} />
                      {ch.name}
                    </button>
                  ))}
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {groupMessages.slice().reverse().map((m, i) => (
                      <div key={i} className={cn(
                        "flex gap-4",
                        m.user_id === user.id ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/10">
                          {m.starting_photo_url ? (
                            <img src={m.starting_photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-muted">
                              <Users size={16} />
                            </div>
                          )}
                        </div>
                        <div className={cn(
                          "flex flex-col max-w-[80%]",
                          m.user_id === user.id ? "items-end" : "items-start"
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent flex items-center gap-1">
                              {m.user_name || 'Member'}
                              {m.group_role === 'founder' && <span className="bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1"><Crown size={8} /> Founder</span>}
                              {m.group_role === 'admin' && <span className="bg-brand-accent/20 px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1"><Shield size={8} /> Host</span>}
                              {m.is_admin === 1 && m.group_role !== 'founder' && m.group_role !== 'admin' && <span className="bg-brand-accent/20 px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1"><Shield size={8} /> Admin</span>}
                            </span>
                            <span className="text-[8px] opacity-30">{format(new Date(m.created_at), 'h:mm a')}</span>
                          </div>
                          <div className={cn(
                            "px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed group relative",
                            m.user_id === user.id ? "bg-brand-accent text-white rounded-tr-none" : "bg-white/10 text-white/90 rounded-tl-none"
                          )}>
                            {m.content}
                            {m.image_url && (
                              <img src={m.image_url} className="mt-2 rounded-lg max-w-full h-auto border border-white/10" />
                            )}
                            {(m.user_id === user.id || user.is_admin) && (
                              <button 
                                onClick={() => handleDeleteMessage(m.id)}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                    {newImage && (
                      <div className="mb-4 relative inline-block">
                        <img src={newImage} className="h-20 w-20 object-cover rounded-xl border border-white/10" />
                        <button onClick={() => setNewImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <label className="bg-white/5 p-3.5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border border-white/10">
                        <Plus size={20} strokeWidth={2} className="text-brand-muted" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <input 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendGroupMessage()}
                        placeholder={`Message #${activeChannel}...`}
                        className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3.5 outline-none focus:border-brand-accent/50 transition-all text-sm font-medium"
                      />
                      <button 
                        onClick={handleSendGroupMessage}
                        disabled={isUploading}
                        className="bg-brand-accent p-3.5 rounded-2xl hover:bg-blue-600 transition-all accent-glow disabled:opacity-50"
                      >
                        <Send size={20} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {playlists.map((playlist, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="glass-card p-6 border-white/10 hover:border-brand-accent/30 transition-all group relative"
                >
                  {(playlist.user_id === user.id || user.is_admin) && (
                    <button 
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="aspect-square bg-white/5 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                    <Music size={48} className="text-brand-muted group-hover:text-brand-accent transition-colors relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-display font-black italic uppercase tracking-tight mb-1">{playlist.name}</h3>
                  <p className="text-[10px] micro-label text-brand-muted mb-4">{playlist.platform || 'Link'} • By {playlist.user_name || 'Member'}</p>
                  <a 
                    href={playlist.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-white/5 rounded-lg font-black uppercase tracking-widest text-center text-[8px] italic hover:bg-white/10 transition-all block"
                  >
                    Open Playlist
                  </a>
                </motion.div>
              ))}
              <button 
                onClick={() => setShowSharePlaylistModal(true)}
                className="glass-card p-6 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-brand-accent/50 transition-all group aspect-square"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-brand-muted group-hover:text-brand-accent transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-black uppercase tracking-widest text-[10px] italic text-brand-muted group-hover:text-white">Share Playlist</span>
              </button>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="space-y-12">
              {/* My Connections */}
              {connections.length > 0 && (
                <div className="space-y-6">
                  <h3 className="font-display font-black italic uppercase tracking-widest text-sm text-brand-accent flex items-center gap-2">
                    <Heart size={16} />
                    My Connections
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {connections.map(c => (
                      <motion.div 
                        key={c.id}
                        whileHover={{ y: -5 }}
                        className="glass-card p-6 flex items-center gap-4 border-brand-accent/20 bg-brand-accent/5"
                      >
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-card border border-white/5 shrink-0">
                          {c.starting_photo_url ? (
                            <img src={c.starting_photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-muted">
                              <Users size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-black italic uppercase tracking-tight truncate">{c.name}</p>
                          <p className="text-[10px] micro-label opacity-50">Connected</p>
                          <div className="flex gap-3 mt-3">
                            <button 
                              onClick={() => handleViewProgress(c)}
                              className="text-brand-accent font-black uppercase tracking-widest text-[8px] italic hover:underline flex items-center gap-1"
                            >
                              <Trophy size={10} />
                              View Progress
                            </button>
                            <button className="text-brand-muted font-black uppercase tracking-widest text-[8px] italic hover:underline flex items-center gap-1">
                              <MessageCircle size={10} />
                              Message
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Connections */}
              <div className="space-y-6">
                <h3 className="font-display font-black italic uppercase tracking-widest text-sm text-brand-muted flex items-center gap-2">
                  <Search size={16} />
                  Suggested Connections
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.filter(u => !connections.some(c => c.connected_user_id === u.id)).map(u => (
                    <motion.div 
                      key={u.id}
                      whileHover={{ y: -5 }}
                      className="glass-card p-6 flex items-center gap-4 border-white/10 hover:border-brand-accent/30 transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-card border border-white/5 shrink-0">
                        {u.starting_photo_url ? (
                          <img src={u.starting_photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-muted">
                            <Users size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-black italic uppercase tracking-tight truncate">{u.name || u.email.split('@')[0]}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {u.religious_mode && <Cross size={10} className="text-brand-accent" />}
                          <p className="text-[10px] micro-label opacity-50">Active Member</p>
                        </div>
                        <button 
                          onClick={async () => {
                            await fetch('/api/social/challenge-phone', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.id, phone: u.phone })
                            });
                            fetchConnections();
                          }}
                          className="mt-3 text-brand-accent font-black uppercase tracking-widest text-[8px] italic hover:underline flex items-center gap-1"
                        >
                          <UserPlus size={10} />
                          Request Connection
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {users.length === 0 && connections.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-brand-muted micro-label">No other members sharing data yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Challenge Modal */}
        <AnimatePresence>
          {showChallengeModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowChallengeModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-display font-black tracking-tighter italic uppercase text-brand-accent">Challenge Someone</h2>
                  <button onClick={() => setShowChallengeModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                    <X size={20} className="text-brand-muted" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="micro-label mb-2 block">Member Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                      <input 
                        type="tel" 
                        value={phoneToChallenge}
                        onChange={(e) => setPhoneToChallenge(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors font-medium"
                        placeholder="(555) 000-0000"
                      />
                    </div>
                    <p className="text-[10px] text-brand-muted mt-3 leading-relaxed">
                      Enter the phone number of the person you want to challenge. They must have an active Forge75 account.
                    </p>
                  </div>

                  <button 
                    onClick={handleChallengeByPhone}
                    disabled={!phoneToChallenge}
                    className="w-full bg-brand-accent hover:bg-blue-600 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest italic accent-glow transition-all"
                  >
                    Send Challenge Request
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Group Modal */}
        <AnimatePresence>
          {showCreateGroupModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateGroupModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-display font-black tracking-tighter italic uppercase text-brand-accent">Create Group</h2>
                  <button onClick={() => setShowCreateGroupModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                    <X size={20} className="text-brand-muted" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="micro-label mb-2 block">Group Name</label>
                    <input 
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors font-medium"
                      placeholder="e.g. Morning Warriors"
                    />
                  </div>
                  <div>
                    <label className="micro-label mb-2 block">Description</label>
                    <textarea 
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors font-medium h-32 resize-none"
                      placeholder="What is this group about?"
                    />
                  </div>

                  <button 
                    onClick={handleCreateGroup}
                    disabled={!newGroupName}
                    className="w-full bg-brand-accent hover:bg-blue-600 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest italic accent-glow transition-all"
                  >
                    Create Group
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Share Playlist Modal */}
        <AnimatePresence>
          {showSharePlaylistModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSharePlaylistModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-display font-black tracking-tighter italic uppercase text-brand-accent">Share Playlist</h2>
                  <button onClick={() => setShowSharePlaylistModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                    <X size={20} className="text-brand-muted" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="micro-label mb-2 block">Playlist Name</label>
                    <input 
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors font-medium"
                      placeholder="e.g. Morning Motivation"
                    />
                  </div>
                  <div>
                    <label className="micro-label mb-2 block">Playlist URL (Spotify/Apple Music)</label>
                    <input 
                      value={newPlaylistUrl}
                      onChange={(e) => setNewPlaylistUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-accent transition-colors font-medium"
                      placeholder="https://open.spotify.com/..."
                    />
                  </div>

                  <button 
                    onClick={handleSharePlaylist}
                    disabled={!newPlaylistName || !newPlaylistUrl}
                    className="w-full bg-brand-accent hover:bg-blue-600 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest italic accent-glow transition-all"
                  >
                    Share Playlist
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* View Progress Modal */}
        <AnimatePresence>
          {showProgressModal && viewingUserProgress && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowProgressModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card w-full max-w-2xl p-8 relative z-10 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-accent/10 border border-brand-accent/20">
                      {viewingUserProgress.starting_photo_url ? (
                        <img src={viewingUserProgress.starting_photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-accent">
                          <Trophy size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-black tracking-tighter italic uppercase text-brand-accent">{viewingUserProgress.name}'s Progress</h2>
                      <p className="micro-label opacity-50">Challenge Stats</p>
                    </div>
                  </div>
                  <button onClick={() => setShowProgressModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                    <X size={20} className="text-brand-muted" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {remoteLogs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {remoteLogs.slice().reverse().map((log, i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] micro-label text-brand-muted">{format(new Date(log.log_date), 'MMMM d, yyyy')}</p>
                            <p className="text-sm font-bold mt-1">
                              {log.is_finalized ? 'Day Finalized' : 'In Progress'}
                            </p>
                          </div>
                          <div className="flex gap-4 items-center">
                            <div className="text-right">
                              <p className="text-[10px] micro-label opacity-50">Water</p>
                              <p className="text-xs font-bold">{log.water_intake_glasses} gl</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] micro-label opacity-50">Steps</p>
                              <p className="text-xs font-bold">{log.steps_count}</p>
                            </div>
                            {log.is_finalized && <Trophy size={16} className="text-brand-accent" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-brand-muted micro-label">No progress data shared yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
          {/* Channel Settings Modal */}
          <AnimatePresence>
            {showChannelSettings && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowChannelSettings(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="glass-card w-full max-w-md p-8 relative z-10"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-black italic uppercase tracking-widest">Channel Settings</h3>
                    <button onClick={() => setShowChannelSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                      <X size={20} className="text-brand-muted" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {isGroupAdmin && (
                      <div className="space-y-4">
                        <p className="micro-label opacity-50">Add New Channel</p>
                        <div className="flex gap-2">
                          <input 
                            value={newChannelName}
                            onChange={e => setNewChannelName(e.target.value)}
                            placeholder="channel-name"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-accent text-sm"
                          />
                          <button 
                            onClick={handleAddChannel}
                            className="bg-brand-accent p-3 rounded-xl hover:bg-blue-600 transition-all"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="micro-label opacity-50">Existing Channels</p>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {channels.map(ch => (
                          <div key={ch.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                            {editingChannel?.id === ch.id ? (
                              <div className="flex-1 flex gap-2">
                                <input 
                                  value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  className="flex-1 bg-white/10 border border-brand-accent rounded-lg px-2 py-1 text-xs outline-none"
                                  autoFocus
                                />
                                <button 
                                  onClick={() => {
                                    handleRenameChannel(ch.id, renameValue);
                                    setEditingChannel(null);
                                  }}
                                  className="text-emerald-400 hover:text-emerald-300"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button onClick={() => setEditingChannel(null)} className="text-brand-muted">
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <Hash size={14} className="text-brand-muted" />
                                  <span className="text-sm font-bold">{ch.name}</span>
                                </div>
                                {isGroupAdmin && ch.name !== 'general' && (
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => {
                                        setEditingChannel(ch);
                                        setRenameValue(ch.name);
                                      }}
                                      className="p-1 hover:bg-white/10 rounded text-brand-muted hover:text-white"
                                    >
                                      <Settings size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteChannel(ch.id)}
                                      className="p-1 hover:bg-white/10 rounded text-red-400 hover:text-red-500"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </div>
      <ShareStory 
        isOpen={showShareStory}
        onClose={() => setShowShareStory(false)}
        user={user}
        stats={stats}
        streak={0} // Streak will be handled in Dashboard or I can pass it here if I fetch it
      />
    </div>
  );
}
