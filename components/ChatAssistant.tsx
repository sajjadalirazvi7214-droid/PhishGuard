import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage, AnalysisResult } from '../types';
import { sendChatMessage } from '../services/geminiService';

interface ChatAssistantProps {
  analysisResult: AnalysisResult;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ analysisResult }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat with context about the analysis
  useEffect(() => {
    const initialMessage: ChatMessage = {
      id: 'init',
      role: 'model',
      text: `I've analyzed this content. It looks ${analysisResult.riskLevel}. Do you have any questions about the ${analysisResult.redFlags.length} red flags found?`,
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  }, [analysisResult]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history for Gemini
      // We inject the analysis context into the history implicitly by knowing the prompt context, 
      // but for this chat session, we'll start fresh with the user's query + system prompt in service.
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      // Add context about current analysis to the history if it's the first real exchange
      if (messages.length === 1) {
        history.unshift({
          role: 'user',
          parts: [{ text: `Context: I just scanned content with Risk Level: ${analysisResult.riskLevel}, Summary: ${analysisResult.summary}, Red Flags: ${analysisResult.redFlags.join(', ')}.` }]
        });
        history.push({
          role: 'model',
          parts: [{ text: "Understood. I am ready to explain these findings." }]
        });
      }

      const responseText = await sendChatMessage(history, userMsg.text);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I'm having trouble connecting to the security server right now.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center gap-2">
        <Bot className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-white">Security Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-slate-700'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-400" />}
            </div>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-700/50 text-slate-200 border border-slate-600'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm ml-11">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask why this is suspicious..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;