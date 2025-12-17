import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, ThumbsUp, ThumbsDown, Sparkles, ShieldAlert, HelpCircle, ArrowRight, ShieldCheck, Fingerprint } from 'lucide-react';
import { AnalysisResult } from '../types';
import { sendChatResponse } from '../services/geminiService';

interface ChatWidgetProps {
  analysisResult: AnalysisResult | null;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  liked?: boolean;
  disliked?: boolean;
}

// Custom Gemini-style Sparkle Icon
const GeminiIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C10.5 8 8 10.5 2 12C8 13.5 10.5 16 12 22C13.5 16 16 13.5 22 12C16 10.5 13.5 8 12 2Z" fill="currentColor" />
  </svg>
);

const ChatWidget: React.FC<ChatWidgetProps> = ({ analysisResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enhanced Suggested Prompts
  const defaultSuggestions = [
    { text: "Common scams?", icon: <ShieldAlert className="w-3 h-3" /> },
    { text: "Fake URLs?", icon: <HelpCircle className="w-3 h-3" /> },
    { text: "Report fraud?", icon: <ArrowRight className="w-3 h-3" /> },
    { text: "Identity protection", icon: <Fingerprint className="w-3 h-3" /> }
  ];

  const contextSuggestions = [
    { text: "Explain red flags", icon: <Sparkles className="w-3 h-3 text-blue-500" /> },
    { text: "Next steps?", icon: <ShieldCheck className="w-3 h-3 text-green-500" /> },
    { text: "Deep dive", icon: <ArrowRight className="w-3 h-3 text-slate-500" /> },
    { text: "Trust sender?", icon: <User className="w-3 h-3 text-purple-500" /> }
  ];
  
  const currentSuggestions = analysisResult ? contextSuggestions : defaultSuggestions;

  // Reset chat when analysis result changes
  useEffect(() => {
    if (analysisResult) {
      setMessages([{
        role: 'model',
        text: `I've analyzed this content (Risk: ${analysisResult.riskLevel}). Found ${analysisResult.redFlags.length} red flags. How can I help?`
      }]);
    } else {
        setMessages([{
            role: 'model',
            text: "Hi! I'm SecureLens AI. Ask me anything about online safety or scam detection."
        }]);
    }
  }, [analysisResult]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    setInput('');
    setIsLoading(true);

    // Optimistic update
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      const conversationHistory = messages.map(m => ({ role: m.role, text: m.text })); 

      const responseText = await sendChatResponse(
        conversationHistory, 
        userMessage, 
        analysisResult || undefined
      );

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Issue detected. Please rephrase your question." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (index: number, type: 'like' | 'dislike') => {
    setMessages(prev => prev.map((msg, i) => {
      if (i === index) {
        return {
          ...msg,
          liked: type === 'like' ? !msg.liked : false,
          disliked: type === 'dislike' ? !msg.disliked : false
        };
      }
      return msg;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div 
          className="bg-white w-[300px] md:w-[350px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col mb-4 animate-slide-in-up overflow-hidden ring-1 ring-slate-900/5 transition-all"
          style={{ height: 'min(520px, calc(100vh - 120px))' }}
        >
          {/* Enhanced Compact Header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex items-center justify-between text-white shadow-md relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
                <GeminiIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[13px] tracking-tight">SecureLens AI</h3>
                <div className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">
                        Active Assistant
                    </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors relative z-10"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Messages Area - Compact */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                    <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <GeminiIcon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                )}
                
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[88%]`}>
                    <div 
                    className={`px-3 py-2 rounded-xl text-[12px] leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none font-medium'
                    }`}
                    >
                    {msg.text}
                    </div>

                    {/* Compact Feedback */}
                    {msg.role === 'model' && (
                        <div className="flex gap-1.5 mt-0.5 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleFeedback(idx, 'like')}
                                className={`p-0.5 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all ${msg.liked ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-slate-400'}`}
                            >
                                <ThumbsUp className="w-2.5 h-2.5" />
                            </button>
                            <button 
                                onClick={() => handleFeedback(idx, 'dislike')}
                                className={`p-0.5 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all ${msg.disliked ? 'text-red-500 bg-red-50 border-red-100' : 'text-slate-400'}`}
                            >
                                <ThumbsDown className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    )}
                </div>

                {msg.role === 'user' && (
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator - Compact */}
            {isLoading && (
               <div className="flex gap-2 justify-start animate-fade-in">
                  <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <GeminiIcon className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl rounded-tl-none shadow-sm flex items-center gap-1 h-[32px]">
                      <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                      <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compact Input Area */}
          <div className="bg-white border-t border-slate-200/60 p-2 flex-shrink-0">
            {/* Chips Area - More Compact */}
            {!isLoading && (
                <div className="mb-1.5 overflow-hidden">
                    <div className="flex gap-1.5 overflow-x-auto px-1 py-0.5 no-scrollbar">
                        {currentSuggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(suggestion.text)}
                                className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all whitespace-nowrap shadow-sm"
                            >
                                {suggestion.icon}
                                {suggestion.text}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative px-1 pb-1">
              <div className="relative flex items-center group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for advice..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-100 border border-transparent group-focus-within:bg-white group-focus-within:border-blue-500 group-focus-within:ring-4 group-focus-within:ring-blue-500/10 rounded-xl outline-none text-[12px] text-slate-800 transition-all placeholder:text-slate-400 font-medium"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-1 p-1.5 rounded-lg transition-all ${
                      input.trim() && !isLoading 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
            <div className="px-2 pt-0.5">
                <p className="text-[8px] text-slate-400 text-center font-bold opacity-60 uppercase tracking-tighter">
                    Powered by Google Gemini
                </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 z-50 group relative ${
            isOpen 
            ? 'bg-slate-900' 
            : 'bg-gradient-to-br from-blue-600 to-indigo-700'
        } text-white`}
      >
        {isOpen ? (
            <X className="w-5 h-5 animate-fade-in" />
        ) : (
            <>
                <GeminiIcon className="w-6 h-6" />
                {!analysisResult && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-white"></span>
                    </span>
                )}
            </>
        )}
        
        {/* Tooltip - Adjusted for smaller button */}
        {!isOpen && (
            <div className="absolute right-full mr-3 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-slate-700">
                {analysisResult ? 'Clarify Report' : 'Security Assistant'}
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-t border-r border-slate-700"></div>
            </div>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;