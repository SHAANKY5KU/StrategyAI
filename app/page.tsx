"use client";

import { useState, useRef, useEffect } from 'react';

type Tab = 'home' | 'consul' | 'cases';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  time: string;
}

// ----------------------------------------------------
// 3D Tilt Card Component for Premium Interactions
// ----------------------------------------------------
function TiltCard({ children, onClick, style, className }: any) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [styleState, setStyleState] = useState({
    transform: 'perspective(1000px) rotateX(0) rotateY(0) scale(1)',
    transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease, border-color 0.5s ease',
    boxShadow: 'var(--glass-shadow)',
    borderColor: 'var(--glass-border)'
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPct = (x / rect.width - 0.5) * 2;
    const yPct = (y / rect.height - 0.5) * 2;
    
    // Intense physical tilt
    const rotateX = yPct * -12;
    const rotateY = xPct * 12;
    
    setStyleState({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
      transition: 'transform 0.1s linear, box-shadow 0.2s ease, border-color 0.2s ease', 
      boxShadow: '0 25px 45px -10px rgba(0, 212, 255, 0.2), inset 0px 1px 1px rgba(255, 255, 255, 0.4)',
      borderColor: 'rgba(0, 212, 255, 0.4)'
    });
  };

  const handleMouseLeave = () => {
    setStyleState({
      transform: 'perspective(1000px) rotateX(0) rotateY(0) scale(1)',
      transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease, border-color 0.5s ease',
      boxShadow: 'var(--glass-shadow)',
      borderColor: 'var(--glass-border)'
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
      style={{
        ...style,
        ...styleState,
        transformStyle: 'preserve-3d',
        background: 'var(--glass-bg)',
        border: `1px solid ${styleState.borderColor}`,
        borderRadius: '16px',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
       <div style={{ transform: 'translateZ(30px)', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
       </div>
    </div>
  );
}

// ----------------------------------------------------
// Main App Component
// ----------------------------------------------------
export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState('General Strategy Session');
  
  const [input, setInput] = useState('');
  const [fileContext, setFileContext] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedId = localStorage.getItem('strategy_ai_session');
    if (savedId) {
      setIsLoading(true);
      fetch(`/api/sessions/${savedId}`)
        .then(res => res.json())
        .then(data => {
          if (data.session) {
            setSessionId(data.session.id);
            setSessionTitle(data.session.title || 'General Strategy Session');
            setMessages(data.session.messages.map((m: any) => ({
              role: m.role,
              content: m.content,
              time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, []);

  const clearSession = () => {
    setSessionId(null);
    setMessages([]);
    setFileContext('');
    setFileName('');
    setSessionTitle('General Strategy Session');
    localStorage.removeItem('strategy_ai_session');
  };

  const executeWorkflow = async (workflowTitle: string, customPrompt: string) => {
    setActiveTab('consul');
    setSessionId(null);
    setFileContext('');
    setFileName('');
    setSessionTitle(workflowTitle);
    
    // Create direct user message
    const userMsg: Message = { 
      role: 'user', 
      content: customPrompt, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages([userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: customPrompt,
          history: [],     // Empty history for fresh session
          sessionId: null, // explicitly null
          fileContext: '',
          workflowTitle
        })
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      const data = await res.json();
      
      setSessionId(data.sessionId);
      localStorage.setItem('strategy_ai_session', data.sessionId);
      
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: data.reply, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages([userMsg, assistantMsg]);
    } catch (err) {
      setMessages([userMsg, { 
        role: 'error', 
        content: 'Connection error connecting to AI.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setFileContext(evt.target?.result as string);
    };
    reader.readAsText(file);
  };

  const sendMessage = async (e?: React.FormEvent, workflowTitle?: string) => {
    if (e) e.preventDefault();
    if (!input.trim() && !workflowTitle || isLoading) return;

    const userMsgContent = input || `I would like to start the ${workflowTitle} workflow.`;
    
    const userMsg: Message = { 
      role: 'user', 
      content: fileName ? `[Attached: ${fileName}]\n${userMsgContent}` : userMsgContent, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInput('');

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsgContent,
          history: chatHistory,
          sessionId,
          fileContext,
          workflowTitle
        })
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      
      const data = await res.json();
      
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('strategy_ai_session', data.sessionId);
      }
      
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: data.reply, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, assistantMsg]);
      
      setFileContext('');
      setFileName('');
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: 'Connection error connecting to AI.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById('export-container');
    if (!element) return;
    
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    
    const opt = {
      margin:       0.5,
      filename:     `Strategy_Report_${sessionTitle.replace(/\s+/g,'_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f1419' },
      jsPDF:        { unit: 'in' as const, format: 'letter', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-6xl animate-in">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '48px', borderBottom: '1px solid var(--divider-color)', paddingBottom: '16px', overflowX: 'auto' }}>
        {[
          { id: 'home', label: 'Overview' },
          { id: 'consul', label: 'AI Consultant' },
          { id: 'cases', label: 'Case Studies' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 16px',
              position: 'relative',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div style={{
                position: 'absolute',
                bottom: '-17px',
                left: 0,
                right: 0,
                height: '2px',
                background: 'var(--accent-color)',
                boxShadow: '0 0 10px var(--accent-color)'
              }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ minHeight: '60vh' }}>
        {activeTab === 'home' && <HomeTab onNavigate={() => setActiveTab('consul')} executeWorkflow={executeWorkflow} />}
        {activeTab === 'cases' && <CaseStudiesTab executeWorkflow={executeWorkflow} />}
        {activeTab === 'consul' && (
          <ConsultantTab 
            messages={messages} 
            input={input} 
            setInput={setInput} 
            sendMessage={sendMessage} 
            isLoading={isLoading} 
            messagesEndRef={messagesEndRef} 
            clearSession={clearSession}
            fileName={fileName}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            exportPDF={exportPDF}
            setFileName={setFileName}
          />
        )}
      </div>
    </div>
  );
}

function HomeTab({ onNavigate, executeWorkflow }: { onNavigate: () => void, executeWorkflow: (title: string, prompt: string) => void }) {
  return (
    <div className="animate-in" style={{ display: 'grid', gap: '64px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '48px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1.1, margin: 0 }}>
            AI-Powered <br/>
            <span className="gradient-text">Business Strategy</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Get expert strategic insights powered by advanced AI. Market analysis, competitive positioning, and actionable recommendations in minutes, not months.
          </p>
          <div>
            <button className="btn-primary" onClick={onNavigate}>Start Consulting &rarr;</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { icon: '📈', title: 'Market Analysis', directive: 'Conduct a comprehensive Market Analysis for my current business context. Break down TAM, SAM, SOM, and list top barriers to entry.' },
            { icon: '📊', title: 'Competitive Intel', directive: 'Run a Competitive Intelligence module. I want to build a Porter\'s Five Forces matrix and identify key market gaps my competitors are ignoring.' },
            { icon: '💡', title: 'Strategic Plans', directive: 'Initiate a 90-Day Strategic Plan builder. I need a phase-by-phase roadmap for executing a major business initiative.' },
            { icon: '🚀', title: 'Growth Tactics', directive: 'Outline high-leverage Growth Tactics. Focus on customer acquisition costs (CAC), lifetime value (LTV), and highly scalable marketing channels.' }
          ].map((feature, i) => (
            <TiltCard key={i} onClick={() => executeWorkflow(feature.title, feature.directive)} style={{ padding: '32px 24px', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px' }}>{feature.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{feature.title}</div>
            </TiltCard>
          ))}
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid var(--divider-color)', paddingTop: '64px' }}>
         <h2 className="font-display" style={{ fontSize: '32px', marginBottom: '40px' }}>Why StrategyAI</h2>
         <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px'
         }}>
             {[
               { title: 'Expert Knowledge', desc: 'Trained on latest business strategies, market trends, and industry best practices.' },
               { title: 'Lightning Fast', desc: 'Get comprehensive strategic analysis in minutes instead of weeks.' },
               { title: 'Custom Solutions', desc: 'Tailored recommendations specific to your industry, market, and unique challenges.' }
             ].map((box, i) => (
               <TiltCard key={i} style={{ padding: '32px' }}>
                 <h3 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: 600 }}>{box.title}</h3>
                 <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{box.desc}</p>
               </TiltCard>
             ))}
         </div>
      </div>
    </div>
  );
}

function ConsultantTab({ messages, input, setInput, sendMessage, isLoading, messagesEndRef, clearSession, fileName, fileInputRef, handleFileUpload, exportPDF, setFileName }: any) {
  
  const workflows = [
    { title: "Brand Positioning", desc: "Define your voice & market fit" },
    { title: "NGO Grant Strategy", desc: "Build a solid grant proposal outline" },
    { title: "Market Entry", desc: "Expansion and competitor analysis" }
  ];

  return (
    <div className="animate-in" style={{
      maxWidth: '65rem',
      margin: '0 auto',
      height: '75vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
      borderRadius: '16px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--divider-color)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Consultant Portal</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            AI Strategy Execution Environment
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {messages.length > 0 && (
            <button 
              onClick={exportPDF} 
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 10px rgba(0, 212, 255, 0.15)'
              }}
            >
              📄 Export PDF
            </button>
          )}
          <button 
            onClick={clearSession} 
            style={{
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.boxShadow = '0 0 10px rgba(255,255,255,0.2)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            New Project
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div id="export-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', width: '100%', maxWidth: '600px' }}>
                 <h3 className="font-display animate-in" style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '8px' }}>Select a Workflow</h3>
                 <p className="animate-in" style={{ marginBottom: '32px', animationDelay: '0.1s' }}>Start a fresh session with a highly tuned strategic template.</p>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {workflows.map((wf, idx) => (
                       <TiltCard key={wf.title} onClick={() => sendMessage(undefined, wf.title)} style={{ padding: '24px 16px', animationDelay: `${0.2 + idx * 0.1}s` }} className="animate-in">
                         <h4 style={{ color: '#fff', fontSize: '16px', margin: '0 0 8px 0' }}>{wf.title}</h4>
                         <p style={{ fontSize: '13px', margin: 0 }}>{wf.desc}</p>
                       </TiltCard>
                    ))}
                 </div>
              </div>
            ) : (
              messages.map((m: any, i: number) => (
                <div key={i} className="chat-bubble-animate" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%',
                  animationDelay: `${0.05 * i}s`
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    borderBottomRightRadius: m.role === 'user' ? 0 : '16px',
                    borderBottomLeftRadius: m.role !== 'user' ? 0 : '16px',
                    background: m.role === 'user' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.03)',
                    color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                    border: m.role !== 'user' ? '1px solid var(--divider-color)' : 'none',
                    boxShadow: m.role === 'user' ? '0 10px 20px -10px rgba(0, 212, 255, 0.3)' : '0 10px 20px -10px rgba(0,0,0,0.5)',
                    lineHeight: 1.6,
                    fontSize: '15px',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {m.content.split('\n').map((line: string, lineIndex: number) => {
                      if (!line.trim()) return <div key={lineIndex} style={{ height: '8px' }} />;
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <div key={lineIndex} style={{ marginBottom: line.startsWith('-') ? '4px' : '8px' }}>
                          {parts.map((part: string, partIndex: number) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={partIndex} style={{ color: m.role === 'user' ? '#fff' : 'var(--accent-color)' }}>{part.slice(2, -2)}</strong>;
                            }
                            return <span key={partIndex}>{part}</span>;
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                    {m.role === 'error' ? 'Connection Error' : (m.role === 'user' ? 'You' : 'StrategyAI')} • {m.time}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--divider-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(0,0,0,0.2)'
          }}>
            {fileName && (
               <div style={{ fontSize: '12px', color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
                 📎 Attached Context: {fileName}
                 <button type="button" onClick={() => setFileName('')} style={{ background: 'none', border: 'none', color: '#ff4d4d', marginLeft: '12px', cursor: 'pointer' }}>Remove</button>
               </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--divider-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '8px',
                  padding: '0 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: 'var(--glass-shadow)'
                }}
                disabled={isLoading}
              >
                📎
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".txt,.csv,.md"
                onChange={handleFileUpload}
              />
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={messages.length === 0 ? "Or ask any custom question..." : "Ask a follow up..."}
                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
                disabled={isLoading}
              />
              <button type="submit" className="btn-primary" disabled={isLoading} style={{ minWidth: '100px' }}>
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CaseStudiesTab({ executeWorkflow }: { executeWorkflow: (title: string, prompt: string) => void }) {
  const cases = [
    { title: "Market Entry Strategy", company: "TechStart Inc.", challenge: "Entering competitive SaaS market with unique product", solution: "Identified underserved niche in enterprise automation, positioned as cost-saving solution", result: "45% faster customer acquisition, $2.3M ARR", icon: "📈" },
    { title: "Business Model Pivot", company: "DataFlow Solutions", challenge: "Subscription model showing high churn rates", solution: "Recommended hybrid model combining subscription with usage-based pricing", result: "62% reduction in churn, 3.2x increase in LTV", icon: "🔄" },
    { title: "Competitive Repositioning", company: "CloudServe", challenge: "Losing market share to larger competitors", solution: "Developed \"premium support\" differentiation strategy", result: "Regained #2 market position, 28% YoY growth", icon: "🎯" }
  ];

  return (
    <div className="animate-in">
      <h2 className="font-display" style={{ fontSize: '36px', marginBottom: '48px' }}>Case Studies</h2>
      <div style={{ display: 'grid', gap: '32px' }}>
        {cases.map((c, i) => (
          <TiltCard key={i} style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', width: '100%' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '24px', margin: '0 0 8px 0' }}>{c.title}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{c.company}</p>
              </div>
              <div style={{ fontSize: '32px' }}>{c.icon}</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', width: '100%' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Challenge</p>
                <p style={{ fontSize: '15px', lineHeight: 1.5, margin: 0 }}>{c.challenge}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Solution</p>
                <p style={{ fontSize: '15px', lineHeight: 1.5, margin: 0 }}>{c.solution}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Result</p>
                <p className="gradient-text" style={{ fontSize: '16px', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{c.result}</p>
              </div>
            </div>

            <div style={{ marginTop: '32px', borderTop: '1px solid var(--divider-color)', paddingTop: '24px', width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
               <button 
                  className="btn-primary" 
                  onClick={() => executeWorkflow(
                    `Case Study: ${c.title}`, 
                    `I want to apply the strategy from the ${c.company} case study to my own business. Their solution was: "${c.solution}". Please analyze this framework, break down WHY it worked to solve their challenge ("${c.challenge}"), and ask me 3 targeted questions about my own business to help me implement this exact framework.`
                  )}
               >
                 Simulate Framework &rarr;
               </button>
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
