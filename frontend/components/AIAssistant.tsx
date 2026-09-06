
import React, { useState, useRef, useEffect } from 'react';
import { chatWithAssistant } from '../services/geminiService';
import { DashboardStats, Room } from '../types';

interface Message {
  role: 'user' | 'ai';
  content: string;
  isDeepThink?: boolean;
}

const AIAssistant: React.FC<{ stats: DashboardStats; rooms: Room[] }> = ({ stats, rooms }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deepThinkActive, setDeepThinkActive] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    const isDT = deepThinkActive;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, isDeepThink: isDT }]);
    setLoading(true);

    // Ajuste du prompt si DeepThink est activé
    const finalMessage = isDT
      ? `[MODE RÉFLEXION APPROFONDIE ACTIVÉ] : ${userMsg}`
      : userMsg;

    const response = await chatWithAssistant(messages, finalMessage);

    setMessages(prev => [...prev, { role: 'ai', content: response || "Erreur de communication." }]);
    setLoading(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setDeepThinkActive(false);
    setSearchActive(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#171717] text-[#ececec] font-['Inter',_sans-serif] overflow-hidden">
      {/* Sidebar style DeepSeek */}
      <div className="w-[260px] bg-[#0d0d0d] flex flex-col border-r border-white/5">
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#212121] hover:bg-[#2f2f2f] rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 py-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Historique</p>
          <div className="text-xs text-gray-400 hover:bg-[#212121] p-2 rounded-md cursor-pointer truncate">Gestion stock Bar...</div>
          <div className="text-xs text-gray-400 hover:bg-[#212121] p-2 rounded-md cursor-pointer truncate">Analyse revenus...</div>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold uppercase transition-transform hover:scale-110 cursor-pointer">N</div>
            <span className="text-sm font-medium">Assistant hôtel</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 group cursor-default">
                <svg className="w-10 h-10 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold tracking-tight">Comment puis-je vous aider ?</h2>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-10 space-y-10">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-6 animate-in slide-in-from-bottom-2 duration-300 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${m.role === 'user' ? 'bg-[#212121] px-4 py-3 rounded-2xl border border-white/5' : ''}`}>
                    {m.role === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    )}
                    {m.isDeepThink && m.role === 'user' && (
                      <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Pensée Approfondie</div>
                    )}
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-6">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#212121] px-4 py-3 rounded-2xl border border-white/5">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <span className="text-xs text-gray-400 ml-2 font-medium tracking-wide">L'assistant réfléchit...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area style DeepSeek */}
        <div className="w-full max-w-3xl mx-auto pb-10 px-4">
          <div className="bg-[#212121] border border-white/5 rounded-3xl p-4 shadow-2xl focus-within:border-white/10 transition-all">
            <textarea
              rows={1}
              placeholder="Message à l'assistant..."
              className="w-full bg-transparent border-none outline-none text-[15px] text-[#ececec] placeholder-gray-500 resize-none py-2 px-1 custom-scrollbar"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ minHeight: '40px', maxHeight: '200px' }}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeepThinkActive(!deepThinkActive)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${deepThinkActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'bg-[#2f2f2f] text-gray-400 hover:bg-[#3f3f3f] border border-transparent'
                    }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                  </svg>
                  DeepThink
                </button>
                <button
                  onClick={() => setSearchActive(!searchActive)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${searchActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'bg-[#2f2f2f] text-gray-400 hover:bg-[#3f3f3f] border border-transparent'
                    }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6z" />
                    <circle cx="12" cy="12" r="3" strokeWidth={2} />
                  </svg>
                  Search
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-gray-400 hover:text-white transition-colors">
                  <input type="file" className="hidden" />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </label>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${input.trim() && !loading
                      ? 'bg-blue-600 hover:bg-blue-500 scale-110 shadow-lg shadow-blue-500/20'
                      : 'bg-[#2f2f2f] opacity-20 cursor-not-allowed'
                    }`}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3 font-medium uppercase tracking-widest leading-loose">
            <span className="text-blue-500/50">●</span> L'assistant peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
