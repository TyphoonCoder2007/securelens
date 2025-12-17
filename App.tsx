import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock, Menu, Clock, Trash2, HelpCircle, X, User, LogOut, Settings, ChevronDown, Loader2 } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import AnalyzerForm from './components/AnalyzerForm';
import AnalysisReport from './components/AnalysisReport';
import AboutModal from './components/AboutModal';
import LoginModal from './components/LoginModal';
import ChatWidget from './components/ChatWidget';
import { analyzeContent } from './services/geminiService';
import { AnalysisResult, AnalysisHistoryItem, UserProfile } from './types';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  // User Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check for persisted user session and initial splash screen
  useEffect(() => {
    const storedUser = localStorage.getItem('securelens_user') || sessionStorage.getItem('securelens_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    // Click outside handler for dropdown
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsProfileDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Initial Loading Transition
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2500);

    return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('mousedown', handleClickOutside);
        clearTimeout(timer);
    };
  }, []);

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('securelens_user');
    sessionStorage.removeItem('securelens_user');
    setIsProfileDropdownOpen(false);
  };

  const handleAnalyze = async (text: string, imageBase64?: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeContent(text, imageBase64);
      setResult(data);
      
      const newItem: AnalysisHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        snippet: text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : 'Image Analysis',
        result: data
      };
      
      setHistory(prev => [newItem, ...prev]);
      
      const mainContainer = document.getElementById('main-scroll-container');
      if(mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      setError("Analysis failed. Please try again later or check your connection.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
  };

  const loadHistoryItem = (item: AnalysisHistoryItem) => {
    setResult(item.result);
    setError(null);
    const mainContainer = document.getElementById('main-scroll-container');
    if(mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'High Risk': return 'text-red-700 bg-red-50 border-red-200';
      case 'Medium Risk': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Low Risk': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'Safe': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  if (isAppLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white animate-fade-in relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="z-10 flex flex-col items-center">
          <div className="relative group">
            <div className="bg-blue-600 p-6 rounded-[2.5rem] shadow-2xl shadow-blue-600/40 animate-pulse transition-transform duration-700 scale-110">
              <ShieldCheck className="w-20 h-20 text-white" />
            </div>
            {/* Pulsing ring around logo */}
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-[2.5rem] animate-ping opacity-50"></div>
          </div>
          
          <div className="mt-12 text-center space-y-3">
            <h1 className="text-4xl font-black tracking-tighter animate-fade-in" style={{ animationDelay: '300ms' }}>
              SECURE<span className="text-blue-500">LENS</span>
            </h1>
            <div className="flex items-center gap-2 justify-center text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-fade-in" style={{ animationDelay: '600ms' }}>
               <span className="w-8 h-[1px] bg-slate-700"></span>
               AI Fraud Detection
               <span className="w-8 h-[1px] bg-slate-700"></span>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="absolute bottom-32 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '900ms' }}>
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Initializing Security Core</p>
        </div>

        {/* Requested Signature */}
        <div className="absolute bottom-8 left-0 w-full text-center animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <p className="text-xs font-bold text-slate-500 tracking-wider">
            Created by <span className="text-slate-300">Nirmalya</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50/50 overflow-hidden font-inter text-slate-900 animate-fade-in">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 flex-shrink-0 z-50 sticky top-0 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all active:scale-95 border border-transparent hover:border-slate-200"
                aria-label="Toggle Menu"
             >
                <Menu className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-3 cursor-pointer group select-none" onClick={resetAnalysis}>
                <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight block leading-none">SecureLens</span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">AI Fraud Detector</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm">
                    <Lock className="w-3.5 h-3.5" /> Private & Secure
                </span>
            </div>
            
            <div className="hidden md:block w-px h-8 bg-slate-200"></div>

            <button 
               onClick={() => setIsAboutOpen(true)}
               className="p-2 md:p-0 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2 group hidden sm:flex"
            >
               <span>About</span>
               <HelpCircle className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
            </button>

            {user ? (
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-8 h-8 rounded-full bg-blue-100 object-cover"
                        />
                        <div className="hidden lg:block text-left mr-1">
                            <p className="text-xs font-bold text-slate-700">{user.name}</p>
                        </div>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {isProfileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in z-50">
                            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                            <div className="p-1">
                                <button className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                    <User className="w-4 h-4" /> Profile
                                </button>
                                <button className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                    <Settings className="w-4 h-4" /> Settings
                                </button>
                            </div>
                            <div className="p-1 border-t border-slate-100">
                                <button 
                                    onClick={handleLogout}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <button 
                    onClick={() => setIsLoginOpen(true)}
                    className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:scale-95"
                >
                    Log In
                </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

        {/* Mobile Backdrop - High Z-index to cover header if needed, but below sidebar */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden animate-fade-in"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        {/* Responsive Sidebar - Z-index 60 to float above everything on mobile */}
        <aside 
            className={`
                bg-white border-r border-slate-200 
                flex flex-col 
                fixed lg:static inset-y-0 left-0 h-full z-[60] lg:z-auto
                w-80
                transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                ${isSidebarOpen 
                    ? 'translate-x-0 shadow-2xl lg:shadow-none' 
                    : '-translate-x-full lg:w-0 lg:translate-x-0 lg:opacity-0 lg:overflow-hidden'}
            `}
        >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Scan History
                </h2>
                <div className="flex items-center gap-2">
                    {history.length > 0 && (
                        <button 
                            onClick={() => setHistory([])}
                            className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors px-2 py-1 hover:bg-red-50 rounded-md"
                        >
                            Clear
                        </button>
                    )}
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="text-center py-20 px-4 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-slate-100 border-dashed">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-600 font-semibold">No recent analysis</p>
                        <p className="text-xs text-slate-400 mt-1">Your scan history will appear here.</p>
                    </div>
                ) : (
                    history.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => loadHistoryItem(item)}
                            className={`group p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 animate-slide-in-left ${
                                result === item.result
                                ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100 shadow-sm' 
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
                            }`}
                        >
                            <div className="flex justify-between items-start gap-2">
                                <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border shadow-sm ${getRiskColor(item.result.riskLevel)}`}>
                                    {item.result.riskLevel}
                                </span>
                                <button 
                                    onClick={(e) => deleteHistoryItem(e, item.id)}
                                    className="text-slate-300 hover:text-red-500 lg:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-md"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-xs font-medium text-slate-700 mt-3 line-clamp-2 leading-relaxed">
                                {item.snippet}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </aside>

        {/* Main Content */}
        <main id="main-scroll-container" className="flex-1 w-full overflow-y-auto relative flex flex-col scroll-smooth z-10">
            
            {!result && (
                <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl w-full mx-auto space-y-10">
                        <div className="text-center space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold animate-fade-in shadow-sm">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                                </span>
                                AI-Powered Fraud Detection
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] animate-fade-in delay-100 drop-shadow-sm">
                                Is it Safe or <br className="hidden md:block"/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">is it a Scam?</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200 font-medium">
                                Instantly analyze emails, messages, and links with advanced AI to detect phishing attempts, fraud, and malicious intent.
                            </p>
                        </div>

                        <div className="animate-slide-in-up delay-300">
                            <AnalyzerForm 
                                onAnalyze={handleAnalyze} 
                                isAnalyzing={isAnalyzing} 
                                onOpenHistory={() => setIsSidebarOpen(true)}
                            />
                        </div>

                        {error && (
                            <div className="max-w-xl mx-auto p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-shake shadow-sm">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm">Analysis Error</p>
                                    <p className="text-sm opacity-90">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-500 pt-8 max-w-5xl mx-auto">
                            {[
                                { icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-50', title: 'Phishing Detection', desc: 'Identifies deceptive links and spoofing attempts.' },
                                { icon: Lock, color: 'text-purple-600', bg: 'bg-purple-50', title: 'Safe URL Check', desc: 'Real-time domain reputation and SSL analysis.' },
                                { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', title: 'Urgency Analysis', desc: 'Detects psychological manipulation tactics.' }
                            ].map((feature, i) => (
                                <div key={i} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
                                    <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {result && (
                <div className="flex-1 py-12 px-4 md:px-8 lg:px-12 bg-white">
                    <AnalysisReport result={result} onReset={resetAnalysis} />
                </div>
            )}

            <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800 mt-auto z-20 flex-shrink-0">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-8 text-center md:text-left">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <ShieldCheck className="w-6 h-6 text-blue-500" />
                            <span className="text-white font-bold text-xl">SecureLens</span>
                        </div>
                        <p className="max-w-xs mx-auto md:mx-0 text-sm leading-relaxed text-slate-400">
                            Protecting you from digital threats with advanced AI analysis and real-time scanning.
                        </p>
                    </div>
                    <div className="text-sm space-y-2">
                        <p className="font-medium text-slate-400">Created by Nirmalya</p>
                        <p className="opacity-60 text-slate-500">&copy; {new Date().getFullYear()} SecureLens. All rights reserved.</p>
                        <div className="pt-4 flex justify-center md:justify-end gap-6 text-slate-400">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
      </div>
      
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLogin={handleLogin} 
      />
      <ChatWidget analysisResult={result} />
      <SpeedInsights />
    </div>
  );
};

export default App;
