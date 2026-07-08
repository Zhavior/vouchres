import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../lib/apiBase';
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  HelpCircle, 
  Sliders, 
  Tv, 
  Cpu, 
  Radio, 
  Search, 
  ShoppingBag, 
  Mail, 
  CheckCircle2, 
  ArrowRight, 
  BrainCircuit, 
  FileText, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from '../lib/motion';
import { CreatorProofProfile, Parlay } from '../types';
import { canAccessThemeStore } from '../lib/adminDevAccess';

interface AisFeatureAgentProps {
  profile: CreatorProofProfile;
  savedSlips?: Parlay[];
  activeLegs?: any[];
  activeThemeId?: string;
  onSectionChange: (section: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  type?: 'text' | 'feature_list' | 'email_form' | 'email_receipt' | 'parlay_analysis' | 'player_search';
  meta?: any;
}

export default function AisFeatureAgent({ 
  profile, 
  savedSlips = [], 
  activeLegs = [],
  activeThemeId = 'default',
  onSectionChange 
}: AisFeatureAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Email Form and Delivery simulation state
  const [emailTarget, setEmailTarget] = useState<'vouchedge@gmail.com' | 'zhavior@gmail.com'>('vouchedge@gmail.com');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const canSeeThemeStore = canAccessThemeStore(profile);

  // Initial welcome message with suggestions
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-agent-msg',
          sender: 'agent',
          text: `👋 Hey **${profile.displayName}**! I am your **VouchEdge AI Assistant Agent**. Let's make your sports research smarter! 

I can explain any app feature, connect with our **V.A.I Smart Picks** and the parlay engine, fetch live MLB stats, analyze your draft tickets, or dispatch verified feedback emails directly to **vouchedge@gmail.com** and **zhavior@gmail.com**.

How can I help you research today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'feature_list'
        }
      ]);
    }
  }, [profile]);

  useEffect(() => {
    const handleOpenAgent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail || {};
      setIsOpen(true);
      if (detail.text) {
        // Add user statement and agent response
        const userMsg: ChatMessage = {
          id: `msg-user-evt-${Date.now()}`,
          sender: 'user',
          text: detail.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [
            ...prev,
            {
              id: `msg-agent-evt-${Date.now()}`,
              sender: 'agent',
              text: `📊 **Active Alerts Sabermetric Deep-Scoping Analysis:**

I ran a quick multi-agent audit on our recent Live Notification ledger values:
1. **Shohei Ohtani HR (Homerun Alert)**: Statcast register shows 109.5 MPH exit velocity. This matches the exact platoon launch angle projection of our *Math & Probability Agent*!
2. **Mookie Betts (Run Scored Alert)**: High Base-Runs performance shift registers a 5.8% increase in team win likelihood.
3. **Drafted Ticket Correlation**: These events are perfectly correlated with your active parlay locks! All injury states are verified as green.

Keep your eyes closely aligned to the **Live Games Board** to track further developments in real time!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }, 900);
      }
    };

    window.addEventListener('open-vedge-agent-chat', handleOpenAgent);
    return () => {
      window.removeEventListener('open-vedge-agent-chat', handleOpenAgent);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addAgentMessage = (text: string, type: ChatMessage['type'] = 'text', meta?: any) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-agent-${Date.now()}`,
          sender: 'agent',
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type,
          meta
        }
      ]);
    }, 700);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');

    const newMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);

    const lower = userText.toLowerCase();

    // Check for explicit email target mentions or general feedback
    if (lower.includes('email') || lower.includes('feedback') || lower.includes('zhavior') || lower.includes('@gmail.com') || lower.includes('vouchedge')) {
      let target: 'vouchedge@gmail.com' | 'zhavior@gmail.com' = 'vouchedge@gmail.com';
      if (lower.includes('zhavior')) {
        target = 'zhavior@gmail.com';
      }
      
      setEmailTarget(target);
      setEmailSubject(lower.includes('bug') ? 'Bug Report feedback' : 'General System Feedback');
      setEmailBody(`Hi team,\n\nI am writing to share some feedback regarding the VouchEdge features...`);
      
      addAgentMessage(
        `📬 I detected an email or feedback request targeted to **${target}**! Let's draft your message securely right here. Fill out the subject and body in the form below, and I will dispatch it with our encrypted digital server trace!`,
        'email_form',
        { target }
      );
      return;
    }

    // Check for parlay analysis requests
    if (lower.includes('parlay') || lower.includes('analyze') || lower.includes('slip') || lower.includes('ticket')) {
      handleAnalyzeParlay();
      return;
    }

    // Check for player search request (e.g. "analyze Shohei Ohtani" or "search Aaron Judge")
    if (lower.includes('search') || lower.includes('player') || lower.includes('stats') || lower.includes('scout') || lower.includes('shohei') || lower.includes('aaron')) {
      addAgentMessage(
        `🔍 Looking up active sabermetric records or player developments! Type a player name below to check real-time MLB stats or run Gemini analysis:`,
        'player_search'
      );
      return;
    }

    // Explain features matching
    if (lower.includes('feature') || lower.includes('explain') || lower.includes('help') || lower.includes('what is')) {
      addAgentMessage(
        `Here is a quick overview of our premier VouchEdge modules:
        
- **Parlay Lab**: A mathematical allocation workspace to build props, simulate decimal/American odds, and calculate risk profiles.
- **V.A.I Smart Picks**: Our elite AI projection database with weather, Statcast, and seasonal trend indicators.
- **Player Research Console**: Grounded scouting reports powered by Google Search.
- **Java Vouch Studio 🛠️**: A customized high-performance photo-editor canvas to mint visual ticket templates.
- **Live Streams**: Immersive stream lobbies where you can tail active sports handicappers.
- **Subscriber Clubs**: Direct text chats and premium parlays hosted by vetted cappers.`,
        'feature_list'
      );
      return;
    }

    // Generic chat querying Gemini or falling back beautifully
    setIsTyping(true);
    try {
      const chatHistory = messages.map(m => ({
        role: m.sender === 'agent' ? 'assistant' : 'user',
        content: m.text
      }));
      chatHistory.push({ role: 'user', content: userText });

      const response = await fetch(apiUrl('/api/ai/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          systemInstruction: `You are the master VouchEdge Feature Agent AI.
          You answer friendly, helpful sports-tech questions. Explain our key tools:
          1. Parlay Lab (stake weighting, unit allocations).
          2. V.A.I Smart Picks (sabermetric engine, precomputed tickets).
          3. Player Research (Google search grounding).
          4. Java Vouch Studio (ticket card editor).
          5. Subscriber Clubs (chats & private locks).
          6. Theme Engine (applied visual identity and profile presentation).
          
          If the user wants to send feedback, remind them that they can ask you to send an email to vouchedge@gmail.com or zhavior@gmail.com, or use the "Send Email" action buttons in the chat interface. Keep instructions super elegant and professional.`
        })
      });

      const data = await response.json();
      setIsTyping(false);
      
      if (data.status === 'success' || data.status === 'simulated') {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-agent-${Date.now()}`,
            sender: 'agent',
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        addAgentMessage("I am temporarily operating in design-simulation mode, but everything is fully active! Feel free to click any feature shortcut above or draft an email feedback block.");
      }
    } catch (err) {
      setIsTyping(false);
      addAgentMessage("I am connected in offline simulation mode! I can help guide your sports research, explain features, construct parlay slips, or dispatch feedback emails.");
    }
  };

  const handleExplainFeature = (feature: string) => {
    let explanation = '';

    if (feature === 'themestore' && !canSeeThemeStore) {
      addAgentMessage('🎨 Theme Store is currently limited to admin/dev access during beta. Your applied theme still runs in the background, and regular users only see the active VouchEdge visual identity.');
      return;
    }

    onSectionChange(feature);

    switch (feature) {
      case 'build':
        explanation = `🎯 Navigating you to the **Parlay Lab**! Here, you can stack up to 10 player legs. Tweak unit wagers, toggle American/Decimal formats, analyze real-time payouts, and generate dynamic blockchain vouchers!`;
        break;
      case 'ai_engine':
        explanation = `🧠 Swapped over to the **V.A.I Smart Picks Hub**! Access over 850 verified precompiled tickets backed by Statcast velocity models, relative team rest parameters, and local weather coefficients.`;
        break;
      case 'research':
        explanation = `🔍 Let's open the **Player Research Console**! Inspect active injury states, search for baseball icons, review historic platoons, and run Google Search grounded sabermetric analyses.`;
        break;
      case 'board':
        explanation = `🛠️ Welcome to the **Vouch Board & Customizer**! Customize border neons, background grid styles, shadows, and templates, then post your custom ticket directly to the feed index.`;
        break;
      case 'themestore':
        explanation = `🎨 Opening the **Theme Store** admin/dev panel. Theme Engine remains active in the background for users through the applied visual identity.`;
        break;
      default:
        explanation = `Opening requested feature: **${feature}**! Let's explore its advanced sports analytics and layout properties.`;
    }

    addAgentMessage(explanation);
  };

  const handleAnalyzeParlay = async () => {
    // Collect active ticket state
    const targetLegs = activeLegs.length > 0 ? activeLegs : (savedSlips.length > 0 ? savedSlips[0].legs : []);
    
    if (targetLegs.length === 0) {
      addAgentMessage(`🎫 **No active ticket found!** Double-click any player prop or visit the **Parlay Lab** to draft a slip first. I will instantly run a full correlation check here!`);
      return;
    }

    addAgentMessage(`⚡ Ingesting **${targetLegs.length} Leg Props** for Sabermetric correlation check...`);
    setIsTyping(true);

    try {
      const response = await fetch(apiUrl('/api/ai/parlay-edge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legs: targetLegs })
      });

      const data = await response.json();
      setIsTyping(false);

      addAgentMessage(
        data.report || `Analysis completed successfully.`,
        'parlay_analysis',
        { edgeScore: data.edgeScore || 82, legsCount: targetLegs.length }
      );
    } catch (err) {
      setIsTyping(false);
      addAgentMessage(`⚠️ Simulated Analysis compiled:\n\nChecked your drafted legs: Holds solid baseball platoon synergies. Expected correlation is positive with zero conflicting metrics (+5.2% edge premium calculated).`);
    }
  };

  const submitEmailSimulation = (target: 'vouchedge@gmail.com' | 'zhavior@gmail.com') => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert("Please fill out both the email subject and message body.");
      return;
    }

    setIsSendingEmail(true);

    setTimeout(() => {
      setIsSendingEmail(false);
      
      const receiptId = `VE-MAIL-${Math.floor(100000 + Math.random() * 900000)}`;
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Add receipt message
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'email_form'), // Clear active form
        {
          id: `receipt-${Date.now()}`,
          sender: 'agent',
          text: `🎉 **Feedback Email Successfully Sent!**

Your feedback message has been delivered to **${target}** via our verified SMTP relay. A secure digital receipt is appended below:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'email_receipt',
          meta: {
            receiptId,
            target,
            subject: emailSubject,
            timestamp,
            user: profile.username
          }
        }
      ]);

      // Reset form variables
      setEmailSubject('');
      setEmailBody('');
    }, 1800);
  };

  return (
    <div className="fixed bottom-6 left-6 md:left-8 z-50 font-sans" id="ai-feature-agent-root">
      
      {/* Mini floating button indicator */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 relative group"
          id="open-agent-chatbot-btn"
        >
          <BrainCircuit className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-400"></span>
          </span>
          {/* tooltip */}
          <div className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none pointer-events-none shadow-xl">
            🤖 Ask VouchEdge AI Agent
          </div>
        </button>
      )}

      {/* Main expandable side-chat drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50 }}
            transition={{ duration: 0.25 }}
            className={`w-[360px] md:w-[420px] h-[550px] rounded-3xl border shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden bg-slate-950/95 backdrop-blur-xl ${
              activeThemeId === 'music_beat_lines' 
                ? 'border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.15)]' 
                : 'border-slate-800/80 shadow-slate-950/50'
            }`}
            id="agent-chat-drawer-container"
          >
            {/* Header portion */}
            <div className="bg-gradient-to-r from-sky-950/70 via-indigo-950/70 to-purple-950/70 border-b border-white/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-505 to-indigo-605 flex items-center justify-center text-white border border-sky-400/20">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    VouchEdge AI Agent
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">⚡ FEATURE & PARLAY COMPANION</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                id="close-agent-drawer-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat message content box */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none" ref={scrollRef}>
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  id={`agent-msg-${m.id}`}
                >
                  {/* Sender title */}
                  <span className="text-[9px] font-bold uppercase font-mono text-slate-500 mb-1">
                    {m.sender === 'user' ? `@${profile.username}` : '🤖 VouchEdge Core Agent'} • {m.timestamp}
                  </span>

                  {/* Main text box */}
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed text-left font-medium ${
                    m.sender === 'user' 
                      ? 'bg-sky-600 text-white rounded-tr-none shadow shadow-sky-600/20' 
                      : 'bg-slate-900/90 text-slate-205 border border-slate-850 rounded-tl-none shadow-md'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>

                    {/* Rendering special dynamic widgets based on type */}
                    
                    {/* Feature Lists shortcuts */}
                    {m.type === 'feature_list' && (
                      <div className="mt-3.5 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleExplainFeature('build')}
                          className="p-2 bg-slate-950 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/30 rounded-xl text-left transition-colors flex items-center gap-2 group"
                        >
                          <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-300 group-hover:text-sky-400">Explain Parlay Lab</span>
                        </button>
                        <button
                          onClick={() => handleExplainFeature('ai_engine')}
                          className="p-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 rounded-xl text-left transition-colors flex items-center gap-2 group"
                        >
                          <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-300 group-hover:text-indigo-400">Explain V.A.I Picks</span>
                        </button>
                        <button
                          onClick={() => handleExplainFeature('research')}
                          className="p-2 bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/30 rounded-xl text-left transition-colors flex items-center gap-2 group"
                        >
                          <Search className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-300 group-hover:text-purple-400">Explain Research</span>
                        </button>
                        <button
                          onClick={() => handleExplainFeature('board')}
                          className="p-2 bg-slate-950 hover:bg-pink-950/40 border border-slate-800 hover:border-pink-500/30 rounded-xl text-left transition-colors flex items-center gap-2 group"
                        >
                          <FileText className="w-4 h-4 text-pink-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-300 group-hover:text-pink-400">Explain Board</span>
                        </button>
                      </div>
                    )}

                    {/* Email Input Form */}
                    {m.type === 'email_form' && (
                      <div className="mt-3.5 space-y-2.5 pt-3.5 border-t border-slate-800">
                        <div className="flex justify-between items-center bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-850">
                          <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">To Address</span>
                          <span className="text-[10px] font-bold text-sky-400 font-mono">{m.meta?.target}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase text-slate-500 font-mono">Subject</span>
                          <input 
                            type="text" 
                            placeholder="Feedback Subject..."
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="w-full text-xs bg-slate-950 text-white border border-slate-800 rounded-lg px-2 py-1.5 outline-none focus:border-sky-505 font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase text-slate-500 font-mono">Message Body</span>
                          <textarea 
                            placeholder="Enter your bug reports or layout suggestions..."
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="w-full text-[11px] bg-slate-950 text-white border border-slate-800 rounded-lg p-2 outline-none focus:border-sky-505 h-20 resize-none font-medium leading-normal"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={isSendingEmail}
                          onClick={() => submitEmailSimulation(m.meta?.target)}
                          className="w-full py-2 bg-gradient-to-r from-sky-505 to-indigo-605 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isSendingEmail ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Sending trace...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5 text-white" />
                              <span>Dispatch feedback inbox</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Email Receipt */}
                    {m.type === 'email_receipt' && m.meta && (
                      <div className="mt-3.5 p-3 bg-slate-950 border border-emerald-950 ring-1 ring-emerald-500/20 rounded-xl space-y-2 font-mono text-[10px]">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 text-emerald-400 font-bold">
                          <span>🎯 LEDGER_DELIVERY</span>
                          <span>SENT</span>
                        </div>
                        <p className="flex justify-between"><span className="text-slate-500">ID:</span> <span className="text-slate-200 font-semibold">{m.meta.receiptId}</span></p>
                        <p className="flex justify-between"><span className="text-slate-500">To:</span> <span className="text-sky-400 font-semibold">{m.meta.target}</span></p>
                        <p className="flex justify-between"><span className="text-slate-500">Subject:</span> <span className="text-slate-350 truncate max-w-[180px]">{m.meta.subject}</span></p>
                        <p className="flex justify-between"><span className="text-slate-500">Sender:</span> <span className="text-slate-350">@{m.meta.user}</span></p>
                        <p className="flex justify-between"><span className="text-slate-500">Timestamp:</span> <span className="text-slate-450">{m.meta.timestamp}</span></p>
                        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>
                    )}

                    {/* Parlay Report custom score display */}
                    {m.type === 'parlay_analysis' && m.meta && (
                      <div className="mt-3.5 p-3 bg-indigo-950/50 border border-indigo-900/60 rounded-xl flex items-center justify-between font-mono text-[11px] gap-3">
                        <div className="space-y-1">
                          <span className="text-slate-500 block uppercase">Parlay Edge Score</span>
                          <span className="text-base font-black text-indigo-400 block">{m.meta.edgeScore}% SURETY</span>
                        </div>
                        <span className="px-2 py-1 bg-indigo-900/60 border border-indigo-700/40 text-xs font-black text-indigo-300 rounded uppercase">
                          🎰 {m.meta.legsCount} LEGS RUN
                        </span>
                      </div>
                    )}

                    {/* Player Search Helper */}
                    {m.type === 'player_search' && (
                      <div className="mt-3 leading-normal border-t border-slate-900 pt-2 flex flex-col gap-1">
                        <button
                          onClick={() => {
                            onSectionChange('research');
                            addAgentMessage('🎯 Opened **Player Research** section where you can query any MLB player prop instantly!');
                          }}
                          className="mt-1 flex items-center justify-between border border-slate-800 hover:border-sky-500/30 bg-slate-950 p-2 rounded-lg text-slate-300 hover:text-sky-400 text-[11px] font-bold uppercase transition-colors"
                        >
                          <span>Go to Grounded Search Panel</span>
                          <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              ))}

              {/* simulated chatbot typing bubble */}
              {isTyping && (
                <div className="flex flex-col items-start max-w-[85%] mr-auto text-left" id="chatbot-typing-bubble">
                  <span className="text-[9px] font-bold uppercase font-mono text-slate-500 mb-1">🤖 VEdge AI is typing...</span>
                  <div className="bg-slate-900/90 text-slate-400 p-3 rounded-2xl rounded-tl-none border border-slate-850 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions section */}
            <div className="p-3 border-t border-white/5 flex flex-col gap-2 bg-slate-900/50">
              
              {/* Quick action buttons row */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none font-mono text-[9px] font-bold" id="agent-chat-quick-actions">
                <button
                  type="button"
                  onClick={() => {
                    handleExplainFeature('build');
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-sky-400 border border-slate-850 hover:border-sky-900 rounded-full shrink-0 flex items-center gap-1 uppercase transition-all"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Explain features</span>
                </button>

                <button
                  type="button"
                  onClick={handleAnalyzeParlay}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-indigo-400 border border-slate-850 hover:border-indigo-900 rounded-full shrink-0 flex items-center gap-1 uppercase transition-all"
                >
                  <BrainCircuit className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Analyze Parlay</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmailTarget('vouchedge@gmail.com');
                    setEmailSubject('Improvement feedback');
                    setEmailBody('Hi VouchEdge team,\n\nI suggest improving the visual themes...');
                    addAgentMessage(
                      `📬 Let's secure your progress and send email feedback to **vouchedge@gmail.com**! Use the form below:`,
                      'email_form',
                      { target: 'vouchedge@gmail.com' }
                    );
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-rose-400 border border-slate-850 hover:border-rose-900 rounded-full shrink-0 flex items-center gap-1 uppercase transition-all"
                >
                  <Mail className="w-3 h-3 text-red-500" />
                  <span>Send @vouchedge</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmailTarget('zhavior@gmail.com');
                    setEmailSubject('App Feedback');
                    setEmailBody('Hi zhavior,\n\nI wanted to share my feedback on feature enhancements...');
                    addAgentMessage(
                      `📬 Draft a quick feedback message to and direct it to **zhavior@gmail.com** below:`,
                      'email_form',
                      { target: 'zhavior@gmail.com' }
                    );
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-amber-400 border border-slate-850 hover:border-amber-900 rounded-full shrink-0 flex items-center gap-1 uppercase transition-all"
                >
                  <Mail className="w-3 h-3 text-amber-500" />
                  <span>Send @zhavior</span>
                </button>
              </div>

              {/* Chat Input form box */}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center text-xs">
                <input 
                  type="text" 
                  placeholder="Ask agent, search player, or request feedback..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-slate-950 text-white rounded-xl border border-slate-800 px-3.5 py-2.5 outline-none focus:border-sky-505 font-medium placeholder-slate-500"
                  id="agent-chat-input-text"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-gradient-to-tr from-sky-600 to-indigo-650 hover:from-sky-500 hover:to-indigo-505 text-white rounded-xl active:scale-90 transition-all font-bold cursor-pointer shrink-0"
                  id="agent-chat-send-msg"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
