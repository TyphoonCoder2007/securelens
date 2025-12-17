import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, Loader2, LogIn, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    confirmEmail: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In with robust error handling
  useEffect(() => {
    if (isOpen && window.google) {
      try {
        // We use the provided Client ID. If this throws invalid_client, it is likely an authorized origin issue.
        window.google.accounts.id.initialize({
          client_id: '319623617280-o1bv5ik7qktqasvppbagand57ivh3jm4.apps.googleusercontent.com',
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: isLogin ? 'signin_with' : 'signup_with'
          });
        }
      } catch (err) {
        console.error("Google Auth Init Error:", err);
      }
    }
  }, [isOpen, isLogin]);

  const handleGoogleResponse = (response: any) => {
    setLoading(true);
    setError(null);
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      
      const newUser: UserProfile = {
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        joinedDate: Date.now()
      };

      if (rememberMe) {
        localStorage.setItem('securelens_user', JSON.stringify(newUser));
      } else {
        sessionStorage.setItem('securelens_user', JSON.stringify(newUser));
      }
      
      onLogin(newUser);
      setLoading(false);
      onClose();
    } catch (err) {
      setError("Google authentication failed. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && formData.email !== formData.confirmEmail) {
      setError("Emails do not match.");
      return;
    }

    setLoading(true);

    // Simulate API logic
    setTimeout(() => {
      const name = isLogin ? (formData.name || formData.email.split('@')[0]) : formData.name;
      const newUser: UserProfile = {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: formData.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff`,
        joinedDate: Date.now()
      };

      if (rememberMe) {
        localStorage.setItem('securelens_user', JSON.stringify(newUser));
      } else {
        sessionStorage.setItem('securelens_user', JSON.stringify(newUser));
      }

      onLogin(newUser);
      setLoading(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
              <LogIn className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              {isLogin ? 'Log in to access your secure scans' : 'Create an account for personalized safety reports'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 animate-shake">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm" 
                    placeholder="John Doe"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input 
                  type="email" 
                  required 
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm" 
                  placeholder="name@example.com"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    type="email" 
                    required 
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm" 
                    placeholder="Verify your email"
                    value={formData.confirmEmail} 
                    onChange={e => setFormData({...formData, confirmEmail: e.target.value})} 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm" 
                  placeholder="••••••••"
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <div className="w-5 h-5 border-2 border-slate-200 rounded-md bg-white transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 group-hover:border-blue-300"></div>
                  <CheckCircle2 className={`absolute inset-0 w-5 h-5 text-white scale-0 transition-transform peer-checked:scale-75`} />
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Remember Me</span>
              </label>
              {isLogin && (
                <button type="button" className="text-xs font-bold text-blue-600 hover:underline">Forgot Password?</button>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-400 bg-white px-2 tracking-widest">Or continue with</div>
            </div>
            <div className="w-full flex justify-center overflow-hidden">
                <div ref={googleBtnRef} className="w-full"></div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }} 
                className="text-blue-600 font-bold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default LoginModal;