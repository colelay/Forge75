import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Mail, Lock, ArrowRight, Phone, Smartphone } from 'lucide-react';
import { User } from '../types';
import { auth, googleProvider } from '../firebase';
import { normalizePhone } from '../lib/utils';
import { 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

interface AuthProps {
  onAuth: (user: User) => void;
}

type AuthMethod = 'email' | 'phone' | 'google';

export default function Auth({ onAuth }: AuthProps) {
  const [method, setMethod] = useState<AuthMethod>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (method === 'phone') {
      const initRecaptcha = () => {
        try {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
          }
          
          const container = document.getElementById('recaptcha-container');
          if (!container) {
            console.warn('reCAPTCHA container not found yet, retrying...');
            return false;
          }

          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
              console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
              console.log('reCAPTCHA expired');
              setError('reCAPTCHA expired. Please try again.');
              initRecaptcha();
            }
          });
          console.log('reCAPTCHA initialized');
          return true;
        } catch (err: any) {
          console.error('reCAPTCHA init error:', err);
          setError('Failed to initialize security check: ' + err.message);
          return false;
        }
      };

      // Small delay to ensure DOM element is ready
      const timer = setTimeout(() => {
        const success = initRecaptcha();
        if (!success) {
          // One more try if it failed (e.g. DOM not ready)
          setTimeout(initRecaptcha, 1000);
        }
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [method]);

  const handleFirebaseUser = async (firebaseUser: any) => {
    console.log('Syncing Firebase user with server:', firebaseUser.uid);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          phone: firebaseUser.phoneNumber,
          displayName: firebaseUser.displayName
        }),
      });
      
      const data = await res.json();
      console.log('Server sync response:', data);
      
      if (res.ok) {
        // Normalize before passing to onAuth
        const normalized = {
          ...data,
          is_subscribed: !!data.is_subscribed,
          religious_mode: !!data.religious_mode,
          has_diabetes: !!data.has_diabetes,
          is_admin: !!data.is_admin
        };
        onAuth(normalized);
      } else {
        setError(data.error || 'Failed to sync with server');
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Starting Google Sign-In...');
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google Sign-In success:', result.user.uid);
      await handleFirebaseUser(result.user);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      let msg = err.message || 'Google Sign-In failed';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completion.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not authorized for Firebase Auth. Please add it to your Firebase Console settings.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'Only one sign-in popup can be open at a time.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const normalized = normalizePhone(phone);
    if (!normalized.startsWith('+')) {
      setError('Phone number must start with + and include country code (e.g., +11234567890)');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting Phone Sign-In for:', normalized);
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) {
        throw new Error('reCAPTCHA not initialized. Please refresh or try again.');
      }
      const result = await signInWithPhoneNumber(auth, normalized, appVerifier);
      console.log('Verification code sent');
      setConfirmationResult(result);
    } catch (err: any) {
      console.error('Phone sign-in error:', err);
      let msg = err.message || 'Phone sign-in failed.';
      if (err.code === 'auth/invalid-phone-number') {
        msg = 'The phone number is invalid. Please use E.164 format (e.g. +11234567890).';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Phone authentication is not enabled in your Firebase project. Please enable it in the Firebase Console.';
      } else if (err.code === 'auth/quota-exceeded') {
        msg = 'SMS quota exceeded for this project. Please try again later.';
      } else if (err.code === 'auth/captcha-check-failed') {
        msg = 'reCAPTCHA check failed. Please refresh and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many requests. Please wait a while before trying again.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not authorized for Firebase Auth. Please add it to your Firebase Console settings.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(verificationCode);
      await handleFirebaseUser(result.user);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        onAuth(data);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-bg relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center accent-glow mb-4">
            <Flame className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Forge75</h1>
          <p className="text-brand-muted mt-2 text-center">
            {method === 'phone' ? 'Verify your identity.' : isLogin ? 'Welcome back, warrior.' : 'Start your transformation today.'}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setMethod('email')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${method === 'email' ? 'bg-brand-accent text-white' : 'bg-white/5 text-brand-muted'}`}
          >
            Email
          </button>
          <button 
            onClick={() => setMethod('phone')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${method === 'phone' ? 'bg-brand-accent text-white' : 'bg-white/5 text-brand-muted'}`}
          >
            Phone
          </button>
        </div>

        <AnimatePresence mode="wait">
          {method === 'email' ? (
            <motion.form 
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-muted px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-brand-accent transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-muted px-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-brand-accent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm px-1">{error}</p>}

              <button 
                disabled={loading}
                className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all accent-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                {!loading && <ArrowRight size={18} />}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={confirmationResult ? handleVerifyCode : handlePhoneSignIn} 
              className="space-y-4"
            >
              {!confirmationResult ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-muted px-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-brand-accent transition-all"
                      placeholder="+1 123 456 7890"
                    />
                  </div>
                  <p className="text-[10px] text-brand-muted px-1">Include country code (e.g. +1 for USA)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-muted px-1">Verification Code</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                    <input 
                      type="text" 
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-brand-accent transition-all"
                      placeholder="123456"
                    />
                  </div>
                </div>
              )}

              <div id="recaptcha-container"></div>

              {error && <p className="text-red-400 text-sm px-1">{error}</p>}

              <button 
                disabled={loading}
                className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all accent-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (confirmationResult ? 'Verify Code' : 'Send Code')}
                {!loading && <ArrowRight size={18} />}
              </button>
              
              {confirmationResult && (
                <button 
                  type="button"
                  onClick={() => setConfirmationResult(null)}
                  className="w-full text-brand-muted hover:text-white text-xs transition-all"
                >
                  Change Phone Number
                </button>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brand-bg px-2 text-brand-muted">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 border border-white/10"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-muted hover:text-white text-sm transition-all"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
