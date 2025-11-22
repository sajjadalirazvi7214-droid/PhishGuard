import React, { useState } from 'react';
import { 
  Shield, 
  Globe, 
  MessageSquareWarning, 
  FileSearch, 
  CheckCircle, 
  AlertTriangle, 
  XOctagon, 
  ArrowRight,
  Upload,
  RefreshCw,
  Key
} from 'lucide-react';
import { RiskLevel, ScanType, AnalysisResult, FileMetadata } from './types';
import { analyzeContent } from './services/geminiService';
import AnalysisChart from './components/AnalysisChart';
import ChatAssistant from './components/ChatAssistant';

function App() {
  const [activeTab, setActiveTab] = useState<ScanType>(ScanType.URL);
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(!process.env.API_KEY);

  const handleScan = async () => {
    setIsAnalyzing(true);
    setResult(null);

    let content: string | FileMetadata = inputValue;

    if (activeTab === ScanType.FILE) {
      if (!selectedFile) {
        setIsAnalyzing(false);
        return;
      }
      content = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: selectedFile.lastModified
      };
    }

    try {
      const data = await analyzeContent(activeTab, content);
      setResult(data);
    } catch (error) {
      console.error("Scan error", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setInputValue('');
    setSelectedFile(null);
  };

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-900 p-8 rounded-2xl border border-red-900/50 max-w-md w-full shadow-2xl">
          <Key className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">API Key Required</h1>
          <p className="text-slate-400 mb-6">
            PhishGuard requires a Google Gemini API Key to function. 
            Please ensure <code>process.env.API_KEY</code> is set in your environment or added to the configuration.
          </p>
          <div className="p-4 bg-slate-950 rounded border border-slate-800 text-sm font-mono text-slate-300">
             const ai = new GoogleGenAI(&#123; apiKey: process.env.API_KEY &#125;);
          </div>
        </div>
      </div>
    );
  }

  const getBadgeColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.SAFE: return 'bg-green-500/10 text-green-400 border-green-500/20';
      case RiskLevel.SUSPICIOUS: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case RiskLevel.MALICIOUS: return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const getBadgeIcon = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.SAFE: return <CheckCircle className="w-5 h-5" />;
      case RiskLevel.SUSPICIOUS: return <AlertTriangle className="w-5 h-5" />;
      case RiskLevel.MALICIOUS: return <XOctagon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              PhishGuard
            </span>
          </div>
          <div className="text-xs text-slate-500 border border-slate-800 px-3 py-1 rounded-full">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Main Scanner Section */}
        {!result ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-white mb-4">
                Verify Links, Text & Files Instantly
              </h1>
              <p className="text-lg text-slate-400">
                AI-powered detection for phishing attempts, malware, and scams.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              {/* Tabs */}
              <div className="grid grid-cols-3 border-b border-slate-800">
                {[
                  { id: ScanType.URL, icon: Globe, label: 'URL Scan' },
                  { id: ScanType.TEXT, icon: MessageSquareWarning, label: 'Text/SMS' },
                  { id: ScanType.FILE, icon: FileSearch, label: 'File Check' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as ScanType);
                      setInputValue('');
                      setSelectedFile(null);
                    }}
                    className={`p-4 flex items-center justify-center gap-2 transition-all ${
                      activeTab === tab.id
                        ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-8">
                {activeTab === ScanType.URL && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-300">Target URL</label>
                    <input
                      type="url"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="https://example.com/login"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                )}

                {activeTab === ScanType.TEXT && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-300">Paste Email or SMS Content</label>
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="URGENT: Your account has been compromised. Click here..."
                      rows={5}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>
                )}

                {activeTab === ScanType.FILE && (
                  <div className="space-y-4">
                     <label className="block text-sm font-medium text-slate-300">Analyze File Metadata</label>
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 transition-colors relative group">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-slate-800 p-3 rounded-full group-hover:bg-slate-700 transition-colors">
                          <Upload className="w-6 h-6 text-indigo-400" />
                        </div>
                        {selectedFile ? (
                          <div className="text-indigo-300 font-medium">
                            {selectedFile.name}
                            <div className="text-xs text-slate-500 mt-1">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
                            <p className="text-slate-500 text-sm">Checks file name patterns and types (no upload to server)</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleScan}
                  disabled={isAnalyzing || (activeTab !== ScanType.FILE && !inputValue) || (activeTab === ScanType.FILE && !selectedFile)}
                  className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Run Security Scan
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Column: Report */}
            <div className="space-y-6">
               <button 
                onClick={resetScanner}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
              >
                <RefreshCw className="w-4 h-4" />
                Start New Scan
              </button>

              {/* Status Card */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  result.riskLevel === RiskLevel.SAFE ? 'bg-green-500' : 
                  result.riskLevel === RiskLevel.SUSPICIOUS ? 'bg-orange-500' : 'bg-red-500'
                }`} />
                
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h2 className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1">Threat Assessment</h2>
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${getBadgeColor(result.riskLevel)}`}>
                      {getBadgeIcon(result.riskLevel)}
                      <span className="font-bold">{result.riskLevel}</span>
                    </div>
                  </div>
                  <AnalysisChart score={result.riskScore} level={result.riskLevel} />
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <MessageSquareWarning className="w-4 h-4 text-indigo-400" />
                      Summary
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      {result.summary}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      Red Flags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.redFlags.length > 0 ? result.redFlags.map((flag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300">
                          {flag}
                        </span>
                      )) : (
                        <span className="text-slate-500 text-sm italic">No specific red flags detected.</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                    <h3 className="text-indigo-400 font-semibold mb-1 text-sm uppercase">Recommendation</h3>
                    <p className="text-white font-medium">
                      {result.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Chat Assistant */}
            <div className="space-y-6">
               <div className="h-full">
                  <h2 className="text-xl font-bold text-white mb-4">Security Assistant</h2>
                  <p className="text-slate-400 mb-6 text-sm">
                    Ask questions about the analysis. The AI can explain why specific elements are dangerous or how to proceed safely.
                  </p>
                  <ChatAssistant analysisResult={result} />
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;