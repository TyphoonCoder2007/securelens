import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import RiskGauge from './RiskGauge';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, FileSearch, Lock, ExternalLink, Globe, Volume2, Loader2, StopCircle } from 'lucide-react';
import { generateAudioSummary, playRawAudio } from '../services/geminiService';

interface AnalysisReportProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ result, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);

  const handlePlaySummary = async () => {
    if (isPlaying && audioSource) {
      audioSource.stop();
      setIsPlaying(false);
      setAudioSource(null);
      return;
    }

    setIsAudioLoading(true);
    try {
      const textToSpeak = `Security Analysis Result: ${result.riskLevel}. ${result.summary}. Detected Scam Type: ${result.scamType}.`;
      
      const base64Audio = await generateAudioSummary(textToSpeak);
      if (base64Audio) {
        const source = await playRawAudio(base64Audio);
        setAudioSource(source);
        setIsPlaying(true);
        source.onended = () => {
          setIsPlaying(false);
          setAudioSource(null);
        };
      }
    } catch (error) {
      console.error("Failed to play audio", error);
    } finally {
      setIsAudioLoading(false);
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'bg-red-50 text-red-900 border-red-200';
      case 'medium': return 'bg-orange-50 text-orange-900 border-orange-200';
      case 'low': return 'bg-yellow-50 text-yellow-900 border-yellow-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'high': return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'low': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default: return <CheckCircle2 className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-in-up">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex justify-center">
          <RiskGauge score={result.riskScore} level={result.riskLevel} />
        </div>
        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center relative">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                {result.isSafe ? (
                    <ShieldCheck className="w-9 h-9 text-green-600" />
                ) : (
                    <AlertOctagon className="w-9 h-9 text-red-600" />
                )}
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    {result.isSafe ? "Likely Safe" : `Potential ${result.scamType || "Scam"} Detected`}
                </h2>
            </div>
            <p className="text-slate-700 leading-relaxed mb-6 text-sm md:text-base font-medium">
                {result.summary}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-auto pt-4 gap-4 border-t border-slate-100">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 font-semibold">
                      <FileSearch className="w-4 h-4 text-slate-500" />
                      Confidence: {result.confidenceScore}%
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold">
                      <Lock className="w-4 h-4 text-slate-500" />
                      AI Analysis
                  </span>
              </div>
              <button 
                onClick={handlePlaySummary}
                disabled={isAudioLoading}
                className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  isPlaying 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                {isAudioLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isPlaying ? (
                  <StopCircle className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                {isPlaying ? 'Stop Summary' : 'Listen to Summary'}
              </button>
            </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Red Flags Column */}
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                Detected Red Flags
            </h3>
            {result.redFlags.length === 0 ? (
                <div className="p-6 bg-green-50 rounded-xl border border-green-200 text-green-800 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-semibold">No significant red flags detected.</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {result.redFlags.map((flag, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(flag.severity)} flex gap-3 items-start shadow-sm`}>
                            <div className="mt-1 flex-shrink-0">
                                {getSeverityIcon(flag.severity)}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm md:text-base text-slate-900">{flag.title}</h4>
                                <p className="text-sm opacity-90 mt-1 font-medium leading-relaxed">{flag.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* External References / Sources */}
            {result.externalReferences && result.externalReferences.length > 0 && (
              <div className="space-y-3">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Domain Intelligence Sources
                </h3>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                   {result.externalReferences.map((ref, idx) => (
                      <a 
                        key={idx} 
                        href={ref.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors group"
                      >
                         <span className="text-sm text-slate-700 font-semibold truncate pr-4">{ref.title}</span>
                         <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </a>
                   ))}
                </div>
              </div>
            )}
        </div>

        {/* Details & Recommendations Column */}
        <div className="space-y-6">
            
            {/* Technical Breakdown */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-blue-600" />
                    Technical Analysis
                </h3>
                <div className="space-y-5 text-sm">
                    {result.technicalDetails.domainAnalysis && (
                        <div>
                            <span className="font-bold text-slate-900 block mb-1">Link & Domain Check</span>
                            <p className="text-slate-600 font-medium leading-relaxed">{result.technicalDetails.domainAnalysis}</p>
                        </div>
                    )}
                    {result.technicalDetails.sslAnalysis && (
                        <div className="border-t border-slate-100 pt-4">
                            <span className="font-bold text-slate-900 block mb-1">SSL & Security Certificate</span>
                            <p className="text-slate-600 font-medium leading-relaxed">{result.technicalDetails.sslAnalysis}</p>
                        </div>
                    )}
                    {result.technicalDetails.urgencyAnalysis && (
                        <div className="border-t border-slate-100 pt-4">
                            <span className="font-bold text-slate-900 block mb-1">Urgency & Tone</span>
                            <p className="text-slate-600 font-medium leading-relaxed">{result.technicalDetails.urgencyAnalysis}</p>
                        </div>
                    )}
                    {result.technicalDetails.grammarAnalysis && (
                        <div className="border-t border-slate-100 pt-4">
                            <span className="font-bold text-slate-900 block mb-1">Grammar & Syntax</span>
                            <p className="text-slate-600 font-medium leading-relaxed">{result.technicalDetails.grammarAnalysis}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-800 text-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Recommended Actions
                </h3>
                <ul className="space-y-4">
                    {result.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-3 items-start text-slate-200 text-sm font-medium leading-relaxed">
                            <span className="bg-slate-700 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs mt-0.5 border border-slate-600 font-bold">{idx + 1}</span>
                            {rec}
                        </li>
                    ))}
                </ul>
                <div className="mt-8 pt-4 border-t border-slate-700">
                    <a href="https://reportfraud.ftc.gov/" target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-semibold">
                        Report to FTC <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

        </div>
      </div>

      <div className="flex justify-center pt-8 pb-12">
        <button 
            onClick={onReset}
            className="px-8 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-full transition-colors shadow-sm active:scale-95 transform"
        >
            Analyze Another Item
        </button>
      </div>
    </div>
  );
};

export default AnalysisReport;