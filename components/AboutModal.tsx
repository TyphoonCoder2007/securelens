import React from 'react';
import { X, ShieldCheck, Cpu, Lock, Search } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">About SecureLens</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 space-y-8">
          
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3">What is SecureLens?</h3>
            <p className="text-slate-600 leading-relaxed text-base">
              SecureLens is an intelligent fraud detection system designed to be your first line of defense against digital scams. 
              Whether you've received a suspicious text message, a confusing email, or are unsure about a website URL, SecureLens analyzes the content instantly to provide a detailed safety assessment.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">How It Works</h3>
            <div className="grid gap-4 md:grid-cols-2">
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                  <div className="bg-blue-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                    <Cpu className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">AI Pattern Recognition</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We utilize advanced Google Gemini models to analyze language patterns, urgency cues, inconsistencies, and psychological triggers commonly used by scammers.
                  </p>
               </div>
               
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-purple-100 transition-colors">
                  <div className="bg-purple-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                    <Search className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Live Intelligence</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    URLs are cross-referenced with real-time domain data, WHOIS records, and SSL certificate details to identify fake or malicious websites.
                  </p>
               </div>
            </div>
          </section>

          <section className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
             <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Privacy & Security
             </h3>
             <p className="text-sm text-slate-700 leading-relaxed">
                Your privacy is paramount. Text and images submitted for analysis are processed securely for the sole purpose of generating your report. 
                We do not permanently store your personal messages or data.
             </p>
          </section>

          <section className="border-t border-slate-100 pt-6">
             <p className="text-xs text-slate-400 italic text-center">
                Disclaimer: SecureLens provides AI-generated risk assessments based on available patterns and data. 
                While we strive for high accuracy, no automated system is perfect. 
                Always verify sensitive requests (especially regarding money or personal info) through official channels.
             </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AboutModal;