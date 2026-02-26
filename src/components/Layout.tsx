import React from 'react';
import { 
  LayoutDashboard, 
  Utensils, 
  TrendingUp, 
  User, 
  LogOut,
  Flame,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, onLogout }: LayoutProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'food', label: 'Food Log', icon: Utensils },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col md:flex-row">
      {/* Sidebar / Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-64 bg-brand-card border-t md:border-t-0 md:border-r border-white/10 z-50">
        <div className="flex md:flex-col h-full p-4">
          <div className="hidden md:flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center accent-glow">
              <Flame className="text-white" size={24} />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">Forge75</span>
          </div>

          <div className="flex md:flex-col flex-1 justify-around md:justify-start gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-brand-accent/10 text-brand-accent" 
                      : "text-brand-muted hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon size={20} />
                  <span className="text-xs md:text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onLogout}
            className="hidden md:flex items-center gap-3 px-4 py-3 mt-auto text-brand-muted hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-0 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
