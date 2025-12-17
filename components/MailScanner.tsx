import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, AlertTriangle, ShieldCheck, ChevronLeft, Search, AlertOctagon, User, Loader2, Settings, Key, LogOut, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { Email, AnalysisResult } from '../types';
import { analyzeContent } from '../services/geminiService';
import AnalysisReport from './AnalysisReport';

declare global {
  interface Window {
    google: any;
  }
}

// Mock Data remains as fallback
const MOCK_EMAILS: Email[] = [
  {
    id: '1',
    sender: 'Netflix Support',
    senderEmail: 'support-netflix-verification@quick-billing-update.com',
    subject: 'Action Required: Your Payment Declined',
    date: '10:42 AM',
    isRead: false,
    initialRiskLabel: 'High Risk',
    body: `Hi Customer,

We attempted to authorize the Premium subscription payment for your account but were unable to do so. Your subscription has been paused.

To continue watching, please update your payment information immediately using the secure link below:

http://netflix-secure-update-billing.com/login

Failure to update within 24 hours will result in permanent account deletion.

The Netflix Team`
  },
  {
    id: '2',
    sender: 'Grandma Jenkins',
    senderEmail: 'm.jenkins1954@gmail.com',
    subject: 'Re: Cookie Recipe',
    date: 'Yesterday',
    isRead: true,
    initialRiskLabel: 'Safe',
    body: `Hi sweetie,

Here is the recipe you asked for! I usually add a little extra cinnamon. Let me know if you are coming over this weekend.

Love,
Grandma`
  },
  {
    id: '3',
    sender: 'HR Department',
    senderEmail: 'hr-internal-notification@company-payroll-audit.net',
    subject: 'Urgent: Payroll Information Needed',
    date: 'Yesterday',
    isRead: false,
    initialRiskLabel: 'Suspicious',
    body: `Employee,

We are upgrading our payroll system. You are required to confirm your direct deposit details to ensure you get paid this Friday.

Please log in to the employee portal here: http://workday-payroll-audit.net

If you do not verify, your paycheck may be delayed.

Regards,
Human Resources`
  }
];

const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
// Hardcoded Client ID provided for the application
const DEFAULT_CLIENT_ID = '319623617280-o1bv5ik7qktqasvppbagand57ivh3jm4.apps.googleusercontent.com';

const MailScanner: React.FC = () => {
  // Mode: 'mock' or 'real'
  const [mode, setMode] = useState<'mock' | 'real'>('real'); 
  // Initialize with stored ID or the default hardcoded ID
  const [clientId, setClientId] = useState(() => {
      const stored = localStorage.getItem('gmail_client_id');
      return stored || DEFAULT_CLIENT_ID;
  });
  
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmailAddress, setUserEmailAddress] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [emails, setEmails] = useState<Email[]>([]);
  
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize Google Identity Services
  useEffect(() => {
    // Check if script is loaded
    if (window.google && clientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                setAccessToken(tokenResponse.access_token);
                setIsConnected(true);
                setAuthError(null);
                fetchEmails(tokenResponse.access_token);
              } else {
                  setAuthError("Failed to obtain access token.");
              }
            },
            error_callback: (err: any) => {
                setAuthError("Authorization failed. Please check your Client ID or Origin.");
                console.error("OAuth Error:", err);
            }
        });
        setTokenClient(client);
      } catch (e) {
          console.error("Error initializing Google Token Client", e);
      }
    }
  }, [clientId]);

  // Persist Client ID
  useEffect(() => {
      if (clientId) localStorage.setItem('gmail_client_id', clientId);
  }, [clientId]);

  const handleConnect = () => {
    setAuthError(null);
    if (mode === 'mock') {
        simulateScan();
    } else {
        if (!clientId) {
            setShowSettings(true);
            return;
        }
        
        if (tokenClient) {
            tokenClient.requestAccessToken();
        } else {
             if (window.google) {
                try {
                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: clientId,
                        scope: SCOPES,
                        callback: (tokenResponse: any) => {
                            if (tokenResponse && tokenResponse.access_token) {
                                setAccessToken(tokenResponse.access_token);
                                setIsConnected(true);
                                fetchEmails(tokenResponse.access_token);
                            }
                        },
                    });
                    setTokenClient(client);
                    client.requestAccessToken();
                } catch (e) {
                    setAuthError("Google Identity Services not loaded. Check internet connection.");
                }
             } else {
                 setAuthError("Google Identity Services script not loaded. Please refresh.");
             }
        }
    }
  };

  const simulateScan = () => {
    setIsScanning(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setIsConnected(true);
        setEmails(MOCK_EMAILS);
        setUserEmailAddress("demo-user@example.com");
      }
    }, 100);
  };

  const decodeBase64 = (data: string) => {
    try {
        const cleanData = data.replace(/-/g, '+').replace(/_/g, '/');
        const binaryString = atob(cleanData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        return "";
    }
  };

  const extractEmailBody = (payload: any): string => {
    if (payload.body && payload.body.data) {
        return decodeBase64(payload.body.data);
    }
    if (!payload.parts) return payload.snippet || "";
    const findPart = (parts: any[], mimeType: string): string | null => {
        for (const part of parts) {
            if (part.mimeType === mimeType && part.body && part.body.data) {
                return decodeBase64(part.body.data);
            }
            if (part.parts) {
                const found = findPart(part.parts, mimeType);
                if (found) return found;
            }
        }
        return null;
    };
    const plainText = findPart(payload.parts, 'text/plain');
    if (plainText) return plainText;
    const htmlText = findPart(payload.parts, 'text/html');
    if (htmlText) {
        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
        return doc.body.textContent || doc.body.innerText || "";
    }
    return payload.snippet || "";
  };

  const getHeader = (headers: any[], name: string) => {
    return headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
  };

  const fetchUserProfile = async (token: string) => {
      try {
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        if (data.emailAddress) {
            setUserEmailAddress(data.emailAddress);
        }
      } catch (e) {
          console.warn("Could not fetch user profile", e);
      }
  };

  const fetchEmails = async (token: string) => {
    setIsScanning(true);
    setScanProgress(10);
    setEmails([]);
    
    try {
        await fetchUserProfile(token);
        const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!listRes.ok) {
            if (listRes.status === 401 || listRes.status === 403) {
                throw new Error("Authorization failed. Please reconnect.");
            }
            throw new Error("Failed to list messages.");
        }

        const listData = await listRes.json();
        if (!listData.messages) {
             setEmails([]);
             setIsScanning(false);
             return;
        }

        setScanProgress(25);
        const fetchedEmails: Email[] = [];
        const total = listData.messages.length;
        
        for (let i = 0; i < total; i++) {
            const msgId = listData.messages[i].id;
            const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (msgRes.ok) {
                const msgData = await msgRes.json();
                const body = extractEmailBody(msgData.payload);
                const sender = getHeader(msgData.payload.headers, 'From');
                const subject = getHeader(msgData.payload.headers, 'Subject') || '(No Subject)';
                const dateHeader = getHeader(msgData.payload.headers, 'Date');
                let displayDate = dateHeader;
                try {
                    const d = new Date(dateHeader);
                    displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } catch(e) {}

                const nameMatch = sender.match(/^"?([^"<]+)"?\s*<.+>$/);
                const displayName = nameMatch ? nameMatch[1].trim() : sender.split('<')[0].trim();
                const emailMatch = sender.match(/<([^>]+)>/);
                const displayEmail = emailMatch ? emailMatch[1] : sender;

                fetchedEmails.push({
                    id: msgData.id,
                    sender: displayName || displayEmail,
                    senderEmail: displayEmail,
                    subject: subject,
                    date: displayDate,
                    isRead: !msgData.labelIds.includes('UNREAD'),
                    initialRiskLabel: undefined,
                    body: body
                });
            }
            setScanProgress(25 + Math.floor(((i + 1) / total) * 50));
        }

        const analyzedEmails = await Promise.all(fetchedEmails.map(async (email, idx) => {
            if (idx < 4) {
                 try {
                     const analysis = await analyzeContent(email.body.substring(0, 500)); 
                     let label: 'Safe' | 'Suspicious' | 'High Risk' = 'Safe';
                     if (analysis.riskScore > 75) label = 'High Risk';
                     else if (analysis.riskScore > 35) label = 'Suspicious';
                     return { ...email, initialRiskLabel: label };
                 } catch (e) {
                     return email;
                 }
            }
            return email;
        }));

        setEmails(analyzedEmails);
        setIsConnected(true);

    } catch (error: any) {
        console.error("Gmail Fetch Error", error);
        setAuthError(error.message || "Failed to fetch emails.");
        setIsConnected(false);
    } finally {
        setIsScanning(false);
        setScanProgress(100);
    }
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    setAnalysis(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeContent(`${email.subject}\n\n${email.body}`);
      setAnalysis(result);
    } catch (error) {
      console.error("Failed to analyze email", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    setSelectedEmail(null);
    setAnalysis(null);
  };

  const handleLogout = () => {
      setAccessToken(null);
      setIsConnected(false);
      setEmails([]);
      setUserEmailAddress(null);
      setAuthError(null);
  };

  const getRiskBadge = (level?: string) => {
    switch(level) {
      case 'High Risk': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">High Risk</span>;
      case 'Suspicious': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wide">Suspicious</span>;
      case 'Safe': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">Safe</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">Pending</span>;
    }
  };

  // Render Logic
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[500px]">
        
        {/* Settings Modal */}
        {showSettings && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <div className="w-full max-w-md">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-blue-600" />
                            Settings
                        </h2>
                        <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 rounded-full">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                     </div>
                     
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                        <p className="text-sm text-blue-800 font-medium mb-1">Gmail API Configuration</p>
                        <p className="text-xs text-blue-600">
                            Required to securely access your inbox from the browser. 
                            Get your Client ID from Google Cloud Console.
                        </p>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Client ID</label>
                            <input 
                                type="text" 
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value.trim())}
                                placeholder="Enter Google Cloud Client ID..."
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                if(clientId) setMode('real');
                                setShowSettings(false);
                            }}
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            Save Configuration
                        </button>
                        <button 
                            onClick={() => {
                                setMode('mock');
                                setShowSettings(false);
                                handleConnect();
                            }}
                            className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                        >
                            Use Demo Mode
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* 1. Detail View (Overlay) */}
        {selectedEmail ? (
            <div className="absolute inset-0 z-10 bg-white flex flex-col animate-slide-in-up">
                 <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-4 flex-shrink-0 shadow-sm">
                    <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                        <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 truncate pr-4">{selectedEmail.subject}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-medium text-slate-700">{selectedEmail.sender}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                     <div className="max-w-3xl mx-auto space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="font-bold text-slate-900">{selectedEmail.sender}</div>
                                    <div className="text-xs text-slate-500">{selectedEmail.senderEmail}</div>
                                </div>
                                {getRiskBadge(selectedEmail.initialRiskLabel)}
                             </div>
                             <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-line font-sans">
                                 {selectedEmail.body}
                             </div>
                        </div>

                        {isAnalyzing ? (
                            <div className="py-12 text-center">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">Analyzing email content...</p>
                            </div>
                        ) : analysis ? (
                            <AnalysisReport result={analysis} onReset={() => {}} />
                        ) : (
                             <div className="text-center py-8 text-slate-400">Analysis unavailable</div>
                        )}
                     </div>
                </div>
            </div>
        ) : null}

        {/* 2. Main List View */}
        <div className="flex flex-col h-full min-h-[500px]">
             {/* Toolbar */}
             <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
                <div>
                     {userEmailAddress ? (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-sm font-semibold text-slate-700">{userEmailAddress}</span>
                        </div>
                     ) : (
                        <h3 className="font-bold text-slate-700">Inbox Scanner</h3>
                     )}
                </div>
                
                <div className="flex gap-2">
                     <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                     </button>
                     {isConnected && (
                         <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <LogOut className="w-4 h-4" />
                         </button>
                     )}
                </div>
             </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative">
                {!isConnected && !isScanning ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                            <Mail className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Connect your Inbox</h3>
                        <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
                            We'll scan your recent emails for phishing links, payment scams, and malicious attachments securely.
                        </p>
                        
                        {authError && (
                             <div className="mb-6 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-center gap-2 max-w-xs mx-auto text-left">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                {authError}
                             </div>
                        )}

                        <button 
                            onClick={handleConnect}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            </span>
                            Sign in with Google
                        </button>
                        
                        <div className="mt-4 flex items-center gap-2">
                             <button onClick={() => setShowSettings(true)} className="text-xs text-slate-400 hover:text-blue-600 underline">
                                {clientId ? 'Configure Client ID' : 'Setup Real Access'}
                             </button>
                        </div>
                    </div>
                ) : isScanning ? (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                         <div className="relative mb-6">
                            <div className="w-16 h-16 rounded-full border-4 border-blue-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">{scanProgress}%</span>
                            </div>
                         </div>
                         <h3 className="text-lg font-bold text-slate-800">Scanning Inbox...</h3>
                         <p className="text-slate-500 text-sm mt-1">Analyzing sender reputation & content</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {emails.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <p className="text-slate-500 text-sm">No emails found in the recent scan.</p>
                                <button onClick={handleConnect} className="mt-2 text-blue-600 text-sm font-medium hover:underline">Refresh</button>
                            </div>
                        ) : (
                            emails.map((email) => (
                                <div 
                                    key={email.id}
                                    onClick={() => handleSelectEmail(email)}
                                    className={`group p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-4 ${!email.isRead ? 'bg-white' : 'bg-slate-50/30'}`}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {email.initialRiskLabel === 'High Risk' ? (
                                            <AlertOctagon className="w-5 h-5 text-red-500" />
                                        ) : email.initialRiskLabel === 'Suspicious' ? (
                                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {email.sender[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className={`text-sm truncate ${!email.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                {email.sender}
                                            </span>
                                            <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{email.date}</span>
                                        </div>
                                        <h4 className={`text-sm truncate mb-1 ${!email.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                            {email.subject}
                                        </h4>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-500 truncate max-w-[80%]">
                                                {email.body.replace(/\n/g, ' ')}
                                            </p>
                                            {email.initialRiskLabel && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                    email.initialRiskLabel === 'High Risk' ? 'bg-red-100 text-red-700' :
                                                    email.initialRiskLabel === 'Suspicious' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                    {email.initialRiskLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default MailScanner;