import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Image as ImageIcon, Link as LinkIcon, MessageSquare, Loader2, CheckCircle2, AlertCircle, Info, History, Globe } from 'lucide-react';

interface AnalyzerFormProps {
  onAnalyze: (text: string, imageBase64?: string) => void;
  isAnalyzing: boolean;
  onOpenHistory?: () => void;
}

const AnalyzerForm: React.FC<AnalyzerFormProps> = ({ onAnalyze, isAnalyzing, onOpenHistory }) => {
  const [mode, setMode] = useState<'text' | 'url'>('text');
  const [text, setText] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced favicon fetching
  useEffect(() => {
    if (mode === 'url' && text.length > 3) {
      const timeoutId = setTimeout(() => {
        try {
          let domain = text;
          if (!domain.startsWith('http')) domain = 'https://' + domain;
          const url = new URL(domain);
          setFavicon(`https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`);
        } catch (e) {
          setFavicon(null);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setFavicon(null);
    }
  }, [text, mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsImageLoading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setIsImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsImageLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateUrl = (input: string): boolean => {
    if (!input || input.includes(' ')) return false;
    try {
      const protocolRegex = /^(http|https):\/\//i;
      const urlToTest = protocolRegex.test(input) ? input : `https://${input}`;
      const url = new URL(urlToTest);
      return url.hostname.includes('.');
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    if (!text && !selectedFile) return;

    if (mode === 'url' && text) {
        if (!validateUrl(text)) {
            setUrlError("Please enter a valid website URL (e.g., example.com)");
            return;
        }
    }

    let imageBase64: string | undefined = undefined;
    if (previewUrl) {
      imageBase64 = previewUrl;
    }

    onAnalyze(text, imageBase64);
  };

  const isButtonDisabled = (!text && !selectedFile) || isAnalyzing;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200 relative">
        
        {/* Header with History Link */}
        <div className="px-6 pt-6 pb-2 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Analyze Content
                <div className="group relative">
                    <Info className="w-3.5 h-3.5 cursor-help" />
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        Paste text, a URL, or upload a screenshot for a deep security analysis.
                    </div>
                </div>
            </h3>
            {onOpenHistory && (
                <button 
                    onClick={onOpenHistory}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors group"
                >
                    <History className="w-3.5 h-3.5 group-hover:rotate-[-10deg] transition-transform" />
                    Recent Scans
                </button>
            )}
        </div>

        {/* Modern Tabs */}
        <div className="p-2 bg-slate-100 m-2 rounded-2xl flex gap-1 border border-slate-200">
            <button
                type="button"
                onClick={() => { setMode('text'); setText(''); setUrlError(null); }}
                className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 ${
                    mode === 'text' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                }`}
                title="Analyze emails, SMS, or plain text messages"
            >
                <MessageSquare className="w-4 h-4" />
                Text / Message
            </button>
            <button
                type="button"
                onClick={() => { setMode('url'); setText(''); setUrlError(null); }}
                className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 ${
                    mode === 'url' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                }`}
                title="Analyze a website domain or specific URL"
            >
                <LinkIcon className="w-4 h-4" />
                Website URL
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          <div className="relative">
            {mode === 'text' ? (
                <div className="group relative">
                    <textarea
                        id="content"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste the suspicious email, SMS, or text here..."
                        className="w-full h-48 p-5 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none text-slate-900 placeholder-slate-400 transition-all font-medium text-base leading-relaxed shadow-sm"
                        title="Maximum context helps provide the most accurate analysis"
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                        {text.length} chars
                    </div>
                </div>
            ) : (
                <div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {favicon ? (
                                <img src={favicon} alt="Site" className="w-5 h-5 rounded-sm object-contain animate-fade-in" />
                            ) : (
                                <Globe className={`w-5 h-5 transition-colors ${text ? 'text-blue-500' : 'text-slate-400'}`} />
                            )}
                        </div>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value);
                                if (urlError) setUrlError(null);
                            }}
                            placeholder="example.com"
                            className={`w-full pl-12 pr-4 py-4 bg-white border rounded-2xl outline-none transition-all font-medium text-slate-900 placeholder-slate-400 shadow-sm ${
                                urlError 
                                ? 'border-red-300 focus:ring-4 focus:ring-red-500/10' 
                                : 'border-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                            }`}
                            title="Enter the domain or full link to investigate"
                        />
                        {text && (
                             <button 
                                type="button"
                                onClick={() => setText('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                             >
                                <X className="w-4 h-4" />
                             </button>
                        )}
                    </div>
                    {urlError && (
                        <div className="flex items-center gap-2 mt-3 text-red-600 text-sm animate-slide-in-up font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                            <AlertCircle className="w-4 h-4" />
                            {urlError}
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Image Upload Area - Only for Text mode */}
          {mode === 'text' && (
            <div className="animate-fade-in">
              {!selectedFile ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 cursor-pointer transition-all group bg-slate-50/30"
                    title="Upload a screenshot of the message for visual text analysis"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-blue-200 transition-all shadow-sm">
                     <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <span className="text-sm font-semibold">Attach Screenshot (Optional)</span>
                </div>
              ) : (
                <div className="relative bg-white rounded-2xl p-3 border border-slate-200 flex items-center gap-4 animate-slide-in-up shadow-sm ring-1 ring-slate-100">
                   <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                      {isImageLoading ? (
                          <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                          </div>
                      ) : (
                          <img src={previewUrl || ''} alt="Preview" className="w-full h-full object-cover" />
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                   </div>
                   <button 
                      type="button"
                      onClick={removeFile}
                      className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-xl transition-colors"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${
                isButtonDisabled
                ? 'bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed shadow-none'
                : 'text-white shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-600/30'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing with Gemini 3 Pro...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze Now
              </>
            )}
          </button>

        </form>
      </div>
      
      {/* Trust Badges */}
      <div className="mt-8 flex justify-center gap-4 md:gap-8 text-slate-400 flex-wrap">
          <div className="flex items-center gap-2 group cursor-help opacity-70 hover:opacity-100 transition-opacity">
             <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors" />
             <span className="text-xs font-bold tracking-wide group-hover:text-slate-600 transition-colors">SSL SECURE</span>
          </div>
          <div className="flex items-center gap-2 group cursor-help opacity-70 hover:opacity-100 transition-opacity">
             <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors" />
             <span className="text-xs font-bold tracking-wide group-hover:text-slate-600 transition-colors">PRIVATE</span>
          </div>
          <div className="flex items-center gap-2 group cursor-help opacity-70 hover:opacity-100 transition-opacity">
             <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
             <span className="text-xs font-bold tracking-wide group-hover:text-slate-600 transition-colors">GEMINI 3 PRO</span>
          </div>
      </div>
    </div>
  );
};

export default AnalyzerForm;