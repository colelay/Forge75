import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import FoodLogView from './components/FoodLog';
import ProgressView from './components/Progress';
import ProfileView from './components/Profile';
import AdminView from './components/Admin';
import SocialView from './components/Social';
import BibleStudyView from './components/BibleStudy';
import { User, Challenge } from './types';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-8 text-center dot-pattern">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-8">
            <X size={40} strokeWidth={1} />
          </div>
          <h1 className="text-2xl font-display font-light tracking-tight mb-4">Something went wrong</h1>
          <p className="text-brand-muted mb-10 max-w-md font-light leading-relaxed">{this.state.error?.message || "An unexpected error occurred."}</p>
          <button 
            onClick={() => {
              localStorage.removeItem('forge_user');
              window.location.reload();
            }}
            className="bg-brand-accent px-8 py-4 rounded-2xl font-light tracking-widest micro-label text-white accent-glow"
          >
            Reset Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoadingError("Loading is taking longer than expected. There might be a connection issue.");
      }
    }, 10000);

    const savedUser = localStorage.getItem('forge_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.id) {
          fetchUserData(parsedUser.id);
        } else {
          localStorage.removeItem('forge_user');
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('forge_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (user) {
      // Apply theme
      if (user.theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }

      // Apply accent color
      if (user.accent_color) {
        document.documentElement.style.setProperty('--brand-accent', user.accent_color);
        // Generate a glow color (semi-transparent version of accent)
        const glowColor = user.accent_color.startsWith('#') 
          ? `${user.accent_color}4d` // 30% opacity in hex
          : user.accent_color.replace('rgb', 'rgba').replace(')', ', 0.3)');
        document.documentElement.style.setProperty('--brand-accent-glow', glowColor);
      }
    }
  }, [user?.theme, user?.accent_color]);

  const fetchUserData = async (userId: number) => {
    if (!userId || isNaN(userId)) {
      console.error('Invalid userId in fetchUserData:', userId);
      setLoading(false);
      return;
    }
    try {
      const id = Number(userId);
      if (isNaN(id)) {
        throw new Error('Invalid user ID format');
      }
      console.log('Fetching user data for:', id);
      const [userRes, challengeRes] = await Promise.all([
        fetch(`/api/profile/${id}`).catch(err => {
          console.error('Fetch profile error:', err);
          throw new Error('Network error while fetching profile');
        }),
        fetch(`/api/challenge/active/${id}`).catch(err => {
          console.error('Fetch challenge error:', err);
          return { ok: false } as Response;
        })
      ]);
      
      if (!userRes.ok) {
        let errorMessage = 'Failed to fetch user';
        try {
          const errorData = await userRes.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      let userData;
      try {
        userData = await userRes.json();
      } catch (e) {
        console.error('Failed to parse user data:', e);
        throw new Error('Invalid response format from server');
      }

      if (!userData || !userData.id) {
        throw new Error('User not found or invalid data');
      }

      let challengeData = null;
      if (challengeRes.ok) {
        try {
          challengeData = await challengeRes.json();
        } catch (e) {
          console.error('Failed to parse challenge data:', e);
        }
      }
      
      // Normalize booleans from SQLite (0/1 to false/true)
      const normalizedUser = {
        ...userData,
        is_subscribed: !!userData.is_subscribed,
        religious_mode: !!userData.religious_mode,
        has_diabetes: !!userData.has_diabetes,
        is_admin: !!userData.is_admin
      };
      
      setUser(normalizedUser);
      setChallenge(challengeData?.id ? challengeData : null);
    } catch (err) {
      console.error('Failed to fetch user data', err);
      // If fetch fails, we might want to clear the user so they can login again
      // But maybe it's just a network error. 
      // For now, we just stop loading.
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
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-8 dot-pattern">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border border-white/5 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-16 h-16 border-t border-brand-accent rounded-full"
          />
        </div>
        <div className="text-center space-y-6 max-w-xs px-4">
          <p className="micro-label animate-pulse text-brand-accent">Forging your experience</p>
          {loadingError && (
            <p className="text-red-400 text-[10px] font-light tracking-wide">{loadingError}</p>
          )}
          <button 
            onClick={() => {
              localStorage.removeItem('forge_user');
              window.location.reload();
            }}
            className="micro-label opacity-40 hover:opacity-100 transition-opacity underline block mx-auto"
          >
            Reset session
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!user ? (
        <Auth onAuth={handleAuth} />
      ) : !challenge || !user.profile ? (
        <Onboarding user={user} onComplete={() => fetchUserData(user.id)} />
      ) : activeTab === 'admin' ? (
        <AdminView user={user} onBack={() => setActiveTab('profile')} />
      ) : activeTab === 'bible' ? (
        <BibleStudyView user={user} onBack={() => setActiveTab('dashboard')} />
      ) : (
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
              {activeTab === 'dashboard' && <Dashboard user={user} challenge={challenge} onUpdateUser={setUser} setActiveTab={setActiveTab} />}
              {activeTab === 'social' && <SocialView user={user} onBack={() => setActiveTab('dashboard')} />}
              {activeTab === 'food' && <FoodLogView user={user} challenge={challenge!} />}
              {activeTab === 'progress' && <ProgressView user={user} challenge={challenge!} />}
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
      )}
      <Analytics />
    </ErrorBoundary>
  );
}
