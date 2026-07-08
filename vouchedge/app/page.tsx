"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TerminalView = 'ledger' | 'matchup' | 'props' | 'roadmap';
type SignupPlan = 'free' | 'pro' | 'capper';

const appOrigin = process.env.NEXT_PUBLIC_VOUCHEDGE_APP_URL || 'http://127.0.0.1:3000';

function appHref(hash: string, params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return `${appOrigin}/${query}#${hash}`;
}

export default function Home() {
  const [view, setView] = useState<TerminalView>('ledger');
  const [conf, setConf] = useState(84.2);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vouchedItems, setVouchedItems] = useState<string[]>([]);
  const [handle, setHandle] = useState('');

  useEffect(() => {
    const i = setInterval(() => setConf(prev => parseFloat((prev + (Math.random() * 0.2 - 0.1)).toFixed(1))), 2000);
    return () => clearInterval(i);
  }, []);

  const handleVouch = (id: string) => {
    if (vouchedItems.includes(id)) return;
    setVouchedItems([...vouchedItems, id]);
  };

  const goToApp = (hash: string, params?: Record<string, string>) => {
    window.location.assign(appHref(hash, params));
  };

  const startSignup = (plan: SignupPlan = 'free') => {
    goToApp('welcome', { auth: 'signup', plan });
  };

  const claimHandle = () => {
    const cleaned = handle.trim().replace(/^@/, '');
    if (cleaned) {
      try {
        window.localStorage.setItem('vouchedge_claim_handle', cleaned);
      } catch {
        // Keep navigation working even when storage is unavailable.
      }
    }
    startSignup('free');
  };

  return (
    <main className="z8-terminal">
      <div className="shohei-bg"></div>
      <div className="aurora-glow"></div>
      <div className="scanlines"></div>

      <div className="beta-banner">BETA PHASE: LOCK IN RESEARCH RATES FOR THE LIFE OF YOUR ACCOUNT.</div>

      <nav className="nav">
        <div className="logo">VOUCHEDGE<span>.TERMINAL</span></div>
        <div className="nav-actions">
          <a className="nav-link" href={appHref('hr-board')}>HR BOARD</a>
          <a className="nav-link" href={appHref('mlb-stat-hub')}>STAT HUB</a>
          <a className="login-btn" href={appHref('welcome', { auth: 'login' })}>LOGIN</a>
          <div className="status"><span className="pulse"></span> LIVE_FEED_ACTIVE // 14MS</div>
        </div>
      </nav>

      <div className="container">
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-content">
            <div className="badge">NO_HYPE_JUST_RESEARCH</div>
            <h1>COMMAND THE <br/><span className="green-text">MLB BOARD.</span></h1>
            <p>The definitive sports intelligence terminal. Access sub-second matchup data, execute AI models, and verify records on an immutable ledger.</p>
            <div className="hero-btns">
              <button type="button" className="cta" onClick={() => setIsModalOpen(true)}>INITIALIZE TERMINAL</button>
              <a className="secondary-cta" href={appHref('hr-board')}>OPEN HR BOARD</a>
            </div>
            <div className="upcoming-sports">
              <span className="label">EXPANDING SOON:</span>
              <span className="sport">NBA_Q4</span>
              <span className="sport">NFL_Q3</span>
            </div>
          </div>

          <div className="terminal-card hero-terminal">
            <div className="tabs">
              {['LEDGER', 'MATCHUP', 'PROPS', 'ROADMAP'].map(t => (
                <button key={t} type="button" onClick={() => setView(t.toLowerCase() as TerminalView)} className={view === t.toLowerCase() ? 'active' : ''}>{t}</button>
              ))}
            </div>
            <div className="data-strip">
              <div className="stat"><label>MATCHUP</label><div className="val">NYY @ LAD</div></div>
              <div className="stat"><label>AI_CONFIDENCE</label><div className="val green-text">{conf}%</div></div>
              <div className="stat"><label>EXPECTED_VALUE</label><div className="val">+4.2%</div></div>
            </div>
            <div className="terminal-body">
              <AnimatePresence mode="wait">
                {view === 'ledger' && (
                  <motion.div key="ledger" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="ledger-list">
                    {['ALPHA_QUANT', 'SHARP_BETTOR', 'DATA_MINER'].map(u => (
                      <div key={u} className="ledger-row">
                        <span className="user">@{u}</span>
                        <span className="target green-text">NYY ML (-122)</span>
                        <button 
                          type="button"
                          className={`vouch-btn ${vouchedItems.includes(u) ? 'vouched' : ''}`}
                          onClick={() => vouchedItems.includes(u) ? goToApp('feed') : handleVouch(u)}
                        >
                          {vouchedItems.includes(u) ? 'OPEN FEED' : '+ VOUCH'}
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
                {view === 'matchup' && (
                  <motion.div key="matchup" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="research-grid">
                    <div className="heatmap-wrap">
                      <label>ZONE_VULNERABILITY_MATRIX</label>
                      <div className="heatmap">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className={`zone ${i === 4 ? 'hot' : ''}`}></div>
                        ))}
                      </div>
                    </div>
                    <div className="research-item">
                      <label>PITCHER_VELOCITY_TREND</label>
                      <div className="trend-up">+1.2 MPH vs Season Avg</div>
                    </div>
                  </motion.div>
                )}
                {view === 'props' && (
                  <motion.div key="props" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="ledger-list">
                    <div className="ledger-row" style={{opacity: 0.4}}><span>PLAYER_PROP</span><span>ODDS</span><span>EDGE</span></div>
                    <div className="ledger-row"><span>S. OHTANI (HITS)</span><span>+145</span><span className="green-text">+3.2%</span></div>
                    <div className="ledger-row"><span>A. JUDGE (HR)</span><span>+210</span><span className="green-text">+1.8%</span></div>
                  </motion.div>
                )}
                {view === 'roadmap' && (
                  <motion.div key="roadmap" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="roadmap-view">
                    <div className="roadmap-item active"><div className="dot pulse-green"></div><div className="info"><label>PHASE_01: MLB</label><span>LIVE</span></div></div>
                    <div className="roadmap-item"><div className="dot"></div><div className="info"><label>PHASE_02: NFL</label><span>AUG 2026</span></div></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="terminal-footer">SESSION_0x82F1...92EA // ENCRYPTION: AES-256</div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="grid-section">
          <div className="section-header center"><h2>Identity Progression</h2><div className="sub-header">BETA PRICING: LOCK IN YOUR RATE FOR LIFE.</div></div>
          <div className="pricing-grid">
            {[{n:'Free',p:'$0',d:'Claim handle.',plan:'free'},{n:'Pro',p:'$49',d:'Full AI models.',plan:'pro',promoted:true},{n:'Capper',p:'$199',d:'Monetization.',plan:'capper'}].map((tier, i) => (
              <div key={i} className={`price-card ${tier.promoted ? 'promoted' : ''}`}>
                {tier.promoted && <div className="promo-tag">BETA LOCK</div>}
                <div className="card-num">LEVEL_0{i+1}</div>
                <h3>{tier.n}</h3>
                <div className="price">{tier.p}<span>/MO</span></div>
                <p>{tier.d}</p>
                <a href={appHref('welcome', { auth: 'signup', plan: tier.plan })} className={`tier-btn ${tier.promoted ? 'green-btn' : ''}`}>SELECT {tier.n.toUpperCase()}</a>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ONBOARDING MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="modal-card">
              <div className="card-num">SYSTEM_ACCESS // STEP_01</div>
              <h2>Initialize Identity</h2>
              <form onSubmit={(event) => { event.preventDefault(); claimHandle(); }}>
                <div className="input-wrap">
                  <label htmlFor="claim-handle">CLAIM_HANDLE</label>
                  <input id="claim-handle" type="text" placeholder="@ANALYST_NAME" value={handle} onChange={(event) => setHandle(event.target.value)} />
                </div>
                <button type="submit" className="cta full">CHECK AVAILABILITY</button>
              </form>
              <button type="button" className="close-btn" onClick={() => setIsModalOpen(false)}>[ CANCEL_REQUEST ]</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="ticker-wrap">
        <div className="ticker">
          {[1, 2, 3].map(i => (
            <span key={i} className="ticker-item">NBA_ROADMAP: Q4 2026 // NFL_ROADMAP: Q3 2026 // BETA_LOCK: ACTIVE // SYSTEM_STABLE // </span>
          ))}
        </div>
      </footer>

      <style jsx>{`
        .z8-terminal { background: #050505; color: white; min-height: 100vh; font-family: sans-serif; position: relative; overflow-x: hidden; padding-bottom: 150px; }
        .shohei-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('/shohei.png') no-repeat; background-size: 55%; background-position: -15% top; opacity: 0.05; filter: grayscale(1) brightness(0.3); z-index: 1; }
        .aurora-glow { position: absolute; top: -20%; right: -10%; width: 50%; height: 50%; background: radial-gradient(circle, rgba(0,255,102,0.05) 0%, transparent 70%); filter: blur(100px); z-index: 1; }
        .scanlines { position: fixed; inset: 0; pointer-events: none; z-index: 50; opacity: 0.02; background: linear-gradient(to bottom, transparent 50%, #00FF66 50%); background-size: 100% 4px; }
        .beta-banner { background: #00FF66; color: black; text-align: center; font-family: monospace; font-size: 9px; font-weight: 900; padding: 6px; letter-spacing: 2px; position: relative; z-index: 101; }
        .nav { display: flex; justify-content: space-between; padding: 20px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(5,5,5,0.8); backdrop-filter: blur(15px); position: sticky; top: 0; z-index: 100; }
        .logo { font-weight: 900; letter-spacing: -1.5px; font-size: 18px; }
        .logo span { color: #00FF66; }
        .nav-actions { display: flex; align-items: center; gap: 16px; }
        .nav-link, .login-btn { color: rgba(255,255,255,0.55); background: transparent; border: 1px solid rgba(255,255,255,0.08); padding: 8px 12px; font-family: monospace; font-size: 9px; font-weight: 900; letter-spacing: 1.5px; text-decoration: none; cursor: pointer; }
        .nav-link:hover, .login-btn:hover { color: #00FF66; border-color: rgba(0,255,102,0.35); }
        .status { font-family: monospace; font-size: 9px; color: rgba(255,255,255,0.3); display: flex; align-items: center; gap: 8px; }
        .pulse { width: 5px; height: 5px; background: #00FF66; border-radius: 50%; animation: p 2s infinite; }
        .container { max-width: 1400px; margin: 0 auto; padding: 80px 60px; position: relative; z-index: 10; }
        .hero { display: flex; gap: 80px; align-items: flex-start; margin-bottom: 120px; }
        .hero-content { flex: 1; padding-top: 40px; }
        .badge { display: inline-block; padding: 4px 12px; background: rgba(0,255,102,0.05); border: 1px solid rgba(0,255,102,0.2); color: #00FF66; font-family: monospace; font-size: 9px; margin-bottom: 24px; letter-spacing: 2px; }
        h1 { font-size: 92px; font-weight: 900; line-height: 0.85; margin: 0 0 32px 0; letter-spacing: -5px; }
        .green-text { color: #00FF66; }
        p { color: rgba(255,255,255,0.4); font-size: 18px; line-height: 1.6; max-width: 420px; margin-bottom: 48px; }
        .upcoming-sports { display: flex; gap: 15px; align-items: center; margin-top: 40px; }
        .upcoming-sports .label { font-family: monospace; font-size: 9px; color: rgba(255,255,255,0.2); letter-spacing: 2px; }
        .upcoming-sports .sport { font-family: monospace; font-size: 10px; color: white; border: 1px solid rgba(255,255,255,0.1); padding: 4px 10px; opacity: 0.5; }
        .hero-btns { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
        .cta { background: #00FF66; color: black; border: none; padding: 22px 45px; font-weight: 900; font-size: 12px; letter-spacing: 2px; cursor: pointer; box-shadow: 0 0 40px rgba(0,255,102,0.2); }
        .secondary-cta { background: rgba(255,255,255,0.03); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 21px 28px; font-weight: 900; font-size: 12px; letter-spacing: 2px; cursor: pointer; }
        .secondary-cta:hover { color: #00FF66; border-color: rgba(0,255,102,0.35); }
        .cta.full { width: 100%; }
        .terminal-card { flex: 1.5; background: #0A0A0A; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 50px 100px rgba(0,0,0,0.9); position: relative; }
        .tabs { display: flex; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .tabs button { flex: 1; padding: 18px; background: transparent; border: none; color: rgba(255,255,255,0.2); font-family: monospace; font-size: 9px; cursor: pointer; border-right: 1px solid rgba(255,255,255,0.05); }
        .tabs button.active { background: rgba(0,255,102,0.1); color: #00FF66; font-weight: bold; border-bottom: 2px solid #00FF66; }
        .data-strip { display: grid; grid-template-cols: 1fr 1fr 1fr; background: rgba(255,255,255,0.01); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .stat { padding: 25px; border-right: 1px solid rgba(255,255,255,0.05); }
        .stat label { display: block; font-size: 8px; color: rgba(255,255,255,0.2); font-family: monospace; margin-bottom: 8px; }
        .val { font-size: 22px; font-weight: 900; font-family: monospace; }
        .terminal-body { padding: 40px; min-height: 400px; }
        .ledger-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-family: monospace; font-size: 12px; }
        .vouch-btn { border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); padding: 6px 16px; font-size: 9px; cursor: pointer; transition: 0.3s; }
        .vouch-btn.vouched { background: #00FF66; color: black; border-color: #00FF66; }
        .heatmap { display: grid; grid-template-cols: repeat(3, 1fr); gap: 4px; width: 120px; margin-top: 15px; }
        .zone { aspect-ratio: 1; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); }
        .zone.hot { background: rgba(0,255,102,0.3); border-color: #00FF66; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); z-index: 1000; display: flex; items-center; justify-content: center; padding: 20px; }
        .modal-card { background: #0A0A0A; border: 1px solid rgba(0,255,102,0.2); padding: 40px; max-width: 400px; width: 100%; position: relative; }
        .input-wrap { margin: 30px 0; }
        .input-wrap label { display: block; font-family: monospace; font-size: 9px; color: #00FF66; margin-bottom: 10px; }
        .input-wrap input { width: 100%; background: #050505; border: 1px solid rgba(255,255,255,0.1); padding: 15px; color: white; font-family: monospace; outline: none; }
        .input-wrap input:focus { border-color: #00FF66; }
        .close-btn { width: 100%; background: transparent; border: none; color: rgba(255,255,255,0.2); font-family: monospace; font-size: 9px; margin-top: 20px; cursor: pointer; }
        .pricing-grid { display: flex; gap: 20px; }
        .price-card { flex: 1; background: #0A0A0A; border: 1px solid rgba(255,255,255,0.05); padding: 40px; position: relative; display: flex; flex-direction: column; }
        .price-card.promoted { border-color: #00FF66; transform: scale(1.05); z-index: 2; }
        .promo-tag { position: absolute; top: 0; left: 50%; transform: translate(-50%, -50%); background: #00FF66; color: black; font-size: 8px; font-weight: 900; padding: 4px 12px; }
        .price { font-size: 48px; font-weight: 900; font-family: monospace; margin-bottom: 8px; }
        .price span { font-size: 12px; color: rgba(255,255,255,0.3); }
        .tier-btn { width: 100%; padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; font-weight: 900; font-size: 11px; cursor: pointer; margin-top: auto; text-align: center; text-decoration: none; }
        .green-btn { background: #00FF66 !important; color: black !important; border: none !important; }
        .ticker-wrap { position: fixed; bottom: 0; left: 0; width: 100%; background: #050505; border-top: 1px solid rgba(0,255,102,0.1); padding: 12px 0; z-index: 200; overflow: hidden; }
        .ticker { display: flex; white-space: nowrap; animation: t 45s linear infinite; width: fit-content; }
        .ticker-item { font-family: monospace; font-size: 9px; color: rgba(255,255,255,0.3); padding: 0 60px; }
        @keyframes t { 0% { transform: translateX(0); } 100% { transform: translateX(-25%); } }
        @keyframes p { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @media (max-width: 1100px) { .hero { flex-direction: column; } h1 { font-size: 64px; } .pricing-grid { flex-direction: column; } .price-card.promoted { transform: scale(1); } .nav { align-items: flex-start; gap: 16px; flex-direction: column; } .nav-actions { flex-wrap: wrap; } }
      `}</style>
    </main>
  );
}
