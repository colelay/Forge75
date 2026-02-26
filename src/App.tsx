import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import FoodLogView from './components/FoodLog';
import ProgressView from './components/Progress';
import ProfileView from './components/Profile';
import AdminView from './components/Admin.tsx';
import SocialView from './components/Social.tsx';
import { User, Challenge } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('forge_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      fetchUserData(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (userId: number) => {
    try {
      const [userRes, challengeRes] = await Promise.all([
        fetch(`/api/profile/${userId}`),
        fetch(`/api/challenge/active/${userId}`)
      ]);
      
      const userData = await userRes.json();
      const challengeData = await challengeRes.json();
      
      // Normalize booleans from SQLite (0/1 to false/true)
      const normalizedUser = {
        ...userData,
        is_subscribed: !!userData.is_subscribed,
        religious_mode: !!userData.religious_mode,
        has_diabetes: !!userData.has_diabetes,
        is_admin: !!userData.is_admin
      };
      
      setUser(normalizedUser);
      setChallenge(challengeData.id ? challengeData : null);
    } catch (err) {
      console.error('Failed to fetch user data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (userData: User) => {
    setUser(userData);
    localStorage.setItem('forge_user', JSON.stringify(userData));
    fetchUserData(userData.id);
  };

  const handleLogout = () => {
    setUser(null);
    setChallenge(null);
    localStorage.removeItem('forge_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuth={handleAuth} />;
  }

  if (!challenge || !user.profile) {
    return <Onboarding user={user} onComplete={() => fetchUserData(user.id)} />;
  }

  if (activeTab === 'admin' && user) {
    return <AdminView user={user} onBack={() => setActiveTab('profile')} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onLogout={handleLogout}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && <Dashboard user={user} challenge={challenge} onUpdateUser={setUser} />}
          {activeTab === 'social' && <SocialView user={user} onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'food' && <FoodLogView user={user} challenge={challenge!} />}
          {activeTab === 'progress' && <ProgressView user={user} />}
          {activeTab === 'profile' && (
            <ProfileView 
              user={user} 
              challenge={challenge} 
              onLogout={handleLogout} 
              onUpdateUser={setUser}
              setActiveTab={setActiveTab}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
