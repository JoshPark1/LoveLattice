"use client";
import NavBar from '../components/NavBar';
import { useState } from 'react';

function Hero() {
  return (
    <section className="relative min-h-[921px] flex flex-col items-center justify-center pt-32 pb-20 px-8 overflow-hidden hero-gradient" id="home">
      <div className="absolute top-1/4 left-0 w-full z-0 opacity-40">
        <svg fill="none" height="200" preserveAspectRatio="none" viewBox="0 0 1400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
          <path className="ekg-line" d="M0 100H100L115 60L130 140L145 100H250L265 40L285 160L305 100H450L465 60L480 140L495 100H650L665 20L700 180L735 100H900L915 60L930 140L945 100H1100L1115 40L1135 160L1155 100H1400" stroke="#E63946" strokeWidth="2.5"></path>
        </svg>
      </div>

      <div className="relative z-10 max-w-5xl text-center space-y-10">
        <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.1]">
          Monitor What <span className="text-primary">Matters Most.</span>
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
          LoveLattice quietly watches Instagram activity on your Mac and sends you real-time SMS alerts the moment something important happens — all without sharing a single byte of your data.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a href="#pricing" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-[#ff4d5a] text-white font-bold text-lg rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20">
            Download for Mac (Apple Silicon)
          </a>
          <a href="#features" className="w-full sm:w-auto px-8 py-4 border border-outline hover:bg-white/5 text-white font-bold text-lg rounded-xl transition-all active:scale-95">
            See How It Works
          </a>
        </div>
        <div className="pt-6">
          <p className="text-on-surface-variant text-xs font-mono uppercase tracking-widest opacity-60">
            macOS only (for now) • Apple Silicon only in this release • Runs locally on your machine • No cloud • No subscription data sharing
          </p>
        </div>
      </div>

      <div className="mt-20 relative max-w-5xl w-full z-10 px-4">
        <div className="mac-window-shadow rounded-[2.5rem] p-1 bg-gradient-to-b from-white/15 to-transparent border border-white/10 overflow-hidden aspect-[16/9] glass-card flex-col hidden sm:flex">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-black/20">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
            </div>
            <div className="mx-auto text-[11px] font-mono text-white/30 uppercase tracking-[0.2em]">LoveLattice Command Center</div>
          </div>

          <div className="flex-1 relative flex items-center justify-between px-12 md:px-24 overflow-hidden">
            <div className="animate-scan w-48 h-64 bg-surface-container-highest rounded-2xl border border-white/10 p-4 space-y-3 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]"></div>
                <div className="space-y-1 flex-1">
                  <div className="h-2 w-16 bg-white/20 rounded"></div>
                  <div className="h-1.5 w-10 bg-white/10 rounded"></div>
                </div>
              </div>
              <div className="flex-1 bg-white/5 rounded-lg border border-white/5 overflow-hidden flex flex-col">
                <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-white/5"></div>
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/40 shadow-[0_0_10px_#E63946] animate-[bounce_3s_infinite]"></div>
                </div>
                <div className="h-12 p-2 space-y-1.5">
                  <div className="h-1.5 w-3/4 bg-white/10 rounded"></div>
                  <div className="h-1.5 w-1/2 bg-white/10 rounded"></div>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
              <svg className="w-full h-24" preserveAspectRatio="none" viewBox="0 0 800 100">
                <path className="animate-ekg-segment" d="M100,50 L300,50 L315,20 L330,80 L345,50 L455,50 L470,20 L485,80 L500,50 L700,50" fill="none" stroke="#E63946" strokeWidth="3"></path>
              </svg>
            </div>

            <div className="animate-processor relative z-10 w-24 h-24 rounded-3xl bg-surface-container-low border border-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(230,57,70,0.1)]">
              <span className="material-symbols-outlined text-primary text-5xl">memory</span>
              <div className="absolute -bottom-8 whitespace-nowrap text-[10px] font-mono text-primary uppercase tracking-widest font-bold">Local Processing</div>
            </div>

            <div className="animate-alert w-64 h-[28rem] relative">
              <div className="w-full h-full bg-surface-container-lowest rounded-[3rem] border-[6px] border-[#1c1c1e] shadow-2xl relative overflow-hidden">
                <div className="absolute top-12 left-3 right-3 bottom-3 rounded-[2rem] bg-black/40 p-3 space-y-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg flex gap-3 transform translate-y-4">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-xl">notifications_active</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-[#4CC9F0]">LoveLattice</span>
                        <span className="text-[8px] text-white/40 uppercase">Just now</span>
                      </div>
                      <p className="text-xs font-bold text-white mb-0.5">Alert: New Story</p>
                      <p className="text-[10px] text-white/60 leading-tight">@target_user just posted a story.</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1c1c1e] rounded-b-2xl"></div>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono text-[#4CC9F0] uppercase tracking-widest font-bold">SMS Dispatched</div>
            </div>
          </div>

          <div className="h-16 border-t border-white/5 bg-black/40 flex items-center px-8">
            <div className="flex items-center gap-6 overflow-hidden">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-mono text-white/40 uppercase">Monitoring Engine 2.1</span>
              </div>
              <div className="h-3 w-px bg-white/10"></div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-white/20 whitespace-nowrap">
                <span>[INFO] Connection established...</span>
                <span>[DEBUG] Session: active...</span>
                <span>[LOG] Scanning @user_alpha...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const feats = [
    { icon: "history", title: "Real-Time Story Monitoring", desc: "Instantly capture every story (or only the ones you care about) posted by tracked accounts, stored directly on your disk." },
    { icon: "sms", title: "Instant SMS Alerts", desc: "Receive a text message the second activity is detected. Never miss a moment again." },
    { icon: "face_6", title: "Facial Recognition", desc: "Optionally upload a reference photo and LoveLattice will alert you if that face appears in content." },
    { icon: "delete_history", title: "Deleted Post Alerts", desc: "Monitor specific profiles and get an alert the exact moment a post or story highlight is removed or taken down." },
    { icon: "shield_lock", title: "100% Private", desc: "Aside from delivering SMS, your data never leaves your machine. Full data sovereignty." },
    { icon: "tag", title: "Tag Detection", desc: "Scan mentions and tags to see who is interacting with your tracked profiles." },
  ];

  return (
    <section className="py-32 px-8 bg-surface-container-lowest" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">Everything you need. <br /><span className="text-on-surface-variant/50">Nothing you don&apos;t.</span></h2>
          <div className="h-1 w-24 bg-primary"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {feats.map((f, i) => (
            <div key={i} className="glass-card p-10 rounded-3xl space-y-6 hover:bg-white/5 transition-all group border-white/5">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">{f.icon}</span>
              </div>
              <h3 className="font-headline text-2xl font-bold text-white">{f.title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Privacy() {
  return (
    <section className="py-32 px-8 bg-surface" id="privacy">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
        <div className="flex-1 space-y-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          </div>
          <h2 className="font-headline text-5xl font-extrabold tracking-tight leading-tight text-white">
            Your photos are your photos. <span className="text-primary">Full stop.</span>
          </h2>
          <p className="text-xl text-on-surface-variant leading-relaxed">
            Monitoring shouldn&apos;t mean sacrificing your own privacy. LoveLattice was built from the ground up to be a local-first application.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { icon: 'verified_user', title: 'Core logic runs locally', desc: 'The monitoring happens on your CPU, not ours.' },
              { icon: 'cloud_off', title: 'No media uploads', desc: 'We never see your logs, photos, or data.' },
              { icon: 'person_off', title: 'Lightweight accounts', desc: 'Accounts are only used to prevent SMS abuse.' },
              { icon: 'api', title: 'Secure SMS Delivery', desc: 'Your phone number is only used for alerts.' }
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary mt-1">{p.icon}</span>
                <div>
                  <h4 className="font-bold text-white">{p.title}</h4>
                  <p className="text-sm text-on-surface-variant">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 w-full lg:w-auto">
          <div className="glass-card p-12 rounded-[3rem] border-primary/20 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
            <div className="relative z-10 text-center space-y-6 py-10">
              <span className="material-symbols-outlined text-primary text-8xl">enhanced_encryption</span>
              <div className="text-3xl font-bold font-headline text-white">Zero-Knowledge Architecture</div>
              <p className="text-on-surface-variant leading-relaxed">
                We designed the system so that even if we wanted to see your data, it would be physically impossible. Your privacy is protected by mathematics, not just promises.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Operational() {
  return (
    <section className="py-32 px-8 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-white">Keep It Running, Always.</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">Your high-performance monitoring command center requires an always-on Mac.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 glass-card rounded-3xl p-8 shadow-2xl space-y-8 border-white/5">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_12px_rgba(230,57,70,0.8)]"></div>
                <span className="font-bold font-headline tracking-wider uppercase text-sm text-white">Monitoring Active</span>
              </div>
              <div className="text-on-surface-variant text-sm font-label">System Uptime: 14d 02h 11m</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-2xl">
                <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2">Accounts Tracked</div>
                <div className="text-4xl font-black font-headline text-primary">03</div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl">
                <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2">Stories Logged</div>
                <div className="text-4xl font-black font-headline text-white">12</div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl">
                <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2">Last Alert</div>
                <div className="text-xl font-bold font-headline mt-2 text-white">2m ago</div>
              </div>
            </div>
            <div className="bg-surface-container-highest/30 rounded-2xl p-6 font-mono text-sm space-y-2 opacity-80 border border-white/5">
              <div className="text-primary/70 font-bold">[14:22:01] Scan started for @user_alpha</div>
              <div className="text-primary">[14:22:04] ALERT: New story detected for @user_alpha</div>
              <div className="text-on-surface-variant">[14:22:05] Sending SMS via Twilio API... SUCCESS</div>
              <div className="text-on-surface-variant/60">[14:25:00] Polling accounts...</div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <span className="material-symbols-outlined">lightbulb</span>
                <span className="font-bold uppercase tracking-wider text-sm">Pro Tip</span>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                To ensure 24/7 monitoring even when your screen is off, go to <span className="text-white font-semibold flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[16px]">settings</span> System Settings -&gt; Energy Saver</span> and check &quot;Prevent automatic sleeping when display is off&quot;.
              </p>
            </div>
            <div className="glass-card p-8 rounded-3xl space-y-4 border-white/5">
              <h4 className="font-bold text-white">System Health</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">CPU Usage</span>
                    <span className="text-primary font-bold">0.4%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[12%]"></div>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Memory</span>
                    <span className="text-primary font-bold">124MB</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[25%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Setup() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('xattr -cr "/Applications/LoveLattice"');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-32 px-8 bg-surface" id="setup">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Up and running in <span className="text-primary">minutes.</span>
          </h2>
          <p className="text-on-surface-variant text-lg">Follow these simple steps to start monitoring.</p>
        </div>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="flex gap-8 group">
            <div className="flex-shrink-0 w-12 h-12 bg-primary text-white font-black flex items-center justify-center rounded-full text-xl shadow-lg shadow-primary/20">1</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Download & Move to Applications</h3>
              <p className="text-on-surface-variant leading-relaxed">Get the .dmg file from our secure portal and drag the LoveLattice app icon into your Applications folder.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-8 group">
            <div className="flex-shrink-0 w-12 h-12 bg-surface-container-highest text-primary font-black flex items-center justify-center rounded-full text-xl border border-primary/20">2</div>
            <div className="space-y-4 w-full">
              <div>
                <h3 className="text-2xl font-bold text-white">Remove Quarantine Flag</h3>
                <p className="text-on-surface-variant leading-relaxed">Since we are an independent tool not tied to the Mac App Store, you&apos;ll need to run this command in Terminal to bypass macOS Gatekeeper:</p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-white/5 relative group">
                <code className="text-primary font-mono text-sm sm:text-base break-all">xattr -cr &quot;/Applications/LoveLattice&quot;</code>
                <button onClick={handleCopy} title="Copy Code" className="absolute right-4 top-1/2 -translate-y-1/2 bg-surface-container-high hover:bg-white/10 p-2 rounded-lg transition-colors border border-white/10 text-white flex items-center gap-1 cursor-pointer">
                  <span className={`material-symbols-outlined text-sm ${copied ? 'text-green-400' : ''}`}>{copied ? 'check' : 'content_copy'}</span>
                  <span className={`text-xs font-bold uppercase pr-1 hidden sm:block ${copied ? 'text-green-400' : ''}`}>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-8 group">
            <div className="flex-shrink-0 w-12 h-12 bg-surface-container-highest text-primary font-black flex items-center justify-center rounded-full text-xl border border-primary/20">3</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Launch & Log In</h3>
              <p className="text-on-surface-variant leading-relaxed">Open the app and securely authenticate with your Instagram session. Your credentials are securely managed by your macOS user profile.</p>
            </div>
          </div>

          <div className="flex gap-8 group">
            <div className="flex-shrink-0 w-12 h-12 bg-surface-container-highest text-primary font-black flex items-center justify-center rounded-full text-xl border border-primary/20">4</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Let It Run</h3>
              <p className="text-on-surface-variant leading-relaxed">Input the target usernames and link your phone number for alerts. Minimize the app window and relax while your Mac monitors for you.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="py-32 px-8 bg-surface-container-lowest relative border-t border-white/5" id="pricing">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16">
          <div className="inline-block border border-primary/30 px-4 py-1.5 rounded-full text-primary font-bold text-xs uppercase tracking-widest bg-primary/5 mb-6">
            Get LoveLattice
          </div>
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            One-time purchase.<br />Yours forever.
          </h2>
          <p className="text-on-surface-variant text-lg">No subscription. No monthly fees. Download once and LoveLattice is yours.</p>
        </div>

        <div className="glass-card max-w-lg w-full p-8 md:p-12 rounded-[2.5rem] border-primary/20 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          <div className="inline-block border border-outline px-3 py-1 rounded-full text-on-surface-variant font-bold text-xs uppercase tracking-widest bg-white/5 mb-6">
            macOS ONLY (for now)
          </div>
          <div className="flex justify-center items-start gap-1 mb-8">
            <span className="text-3xl text-primary font-bold mt-2">$</span>
            <span className="text-8xl font-black font-headline text-white tracking-tighter">5</span>
            <span className="text-sm font-bold text-on-surface-variant mt-auto pb-3">one-time</span>
          </div>

          <ul className="text-left space-y-4 mb-10 mx-auto max-w-sm">
            <li className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary">check_circle</span> Unlimited account monitoring</li>
            <li className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary">check_circle</span> Real-time SMS alerts via Twilio</li>
            <li className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary">check_circle</span> Local facial recognition</li>
            <li className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary">check_circle</span> Story tag & mention detection</li>
            <li className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary">check_circle</span> Free minor updates included</li>
          </ul>

          <a href="https://buy.stripe.com/00w28jauVdOl9lv9Mv0Ny00  " className="block w-full py-4 bg-primary hover:bg-[#ff4d5a] text-white font-bold text-lg rounded-xl transition-all shadow-xl shadow-primary/20 cursor-pointer">
            Purchase & Download &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}

function Legal() {
  return (
    <section className="py-24 px-8 bg-surface border-t border-white/5" id="legal">
      <div className="max-w-4xl mx-auto space-y-24">
        <div className="space-y-8" id="privacy-policy">
          <div>
            <div className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Legal</div>
            <h2 className="font-headline text-3xl font-bold text-white mb-2">Privacy Policy</h2>
            <p className="text-on-surface-variant text-sm">Last updated: March 20, 2026</p>
          </div>
          <div className="max-w-none text-on-surface-variant font-body space-y-6">
            <p>LoveLattice (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a locally-installed macOS application. This Privacy Policy describes how LoveLattice handles information when you use the application and any associated SMS notification services.</p>
            <h3 className="text-white text-xl font-bold font-headline mt-8">1. Data We Collect</h3>
            <p>LoveLattice collects minimal data and processes everything locally on your device:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Instagram Credentials:</strong> Your login credentials are stored locally on your Mac and used exclusively to authenticate the scraping session. They are never transmitted to us.</li>
              <li><strong>Monitored Account Data:</strong> Usernames, story metadata, and related content are stored locally in a database on your Mac.</li>
              <li><strong>Face Reference Photos:</strong> Photos uploaded for facial recognition are stored locally and analyzed using a local AI model.</li>
              <li><strong>Phone Number for Alerts:</strong> Your phone number is transmitted securely to our backend solely to deliver SMS notifications via Twilio.</li>
            </ul>
            <h3 className="text-white text-xl font-bold font-headline mt-8">2. Data Sharing &amp; Security</h3>
            <p><strong>We do not share, sell, rent, or disclose any personal data to third parties.</strong> Specifically, mobile phone numbers collected for SMS notifications are not shared with third parties or affiliates for marketing or promotional purposes. The only external service contacted is Twilio&apos;s API to deliver the specific alerts you requested. Because your media and logs are stored locally, the security of your private information depends on your Mac&apos;s security (e.g., FileVault).</p>
            <h3 className="text-white text-xl font-bold font-headline mt-8">3. SMS Notifications</h3>
            <p>When an alert is triggered, a message is sent via our secure Twilio integration. Message and data rates may apply. SMS message frequency varies based on Instagram activity. You can opt out at any time by disabling notifications in the app, or replying STOP.</p>
            <h3 className="text-white text-xl font-bold font-headline mt-8">4. Contact</h3>
            <p>For privacy-related questions, contact us at: <a href="mailto:support@lovelattice.org" className="text-primary hover:underline">support@lovelattice.org</a></p>
          </div>
        </div>

        <div className="space-y-8" id="terms">
          <div>
            <div className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Legal</div>
            <h2 className="font-headline text-3xl font-bold text-white mb-2">Terms &amp; Conditions</h2>
            <p className="text-on-surface-variant text-sm">Last updated: March 20, 2026</p>
          </div>
          <div className="max-w-none text-on-surface-variant font-body space-y-6">
            <p>By downloading, installing, or using LoveLattice (&quot;the App&quot;), you agree to be bound by these Terms and Conditions.</p>
            <h3 className="text-white text-xl font-bold font-headline mt-8">1. SMS Messaging Terms</h3>
            <p>LoveLattice uses Twilio&apos;s API to deliver SMS notifications. By enabling SMS alerts, you agree to the following:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Message and data rates may apply.</strong></li>
              <li><strong>Message frequency varies</strong> based on the activity of tracked accounts.</li>
              <li>You may opt out at any time by disabling the feature in the app, or replying <strong>STOP</strong> to any message to cancel. Reply <strong>HELP</strong> for assistance.</li>
              <li>Wireless carriers are not liable for delayed or undelivered messages. Participating carriers include AT&amp;T, Verizon, T-Mobile, Sprint, Boost, Virgin Mobile, and others.</li>
            </ul>
            <h3 className="text-white text-xl font-bold font-headline mt-8">2. Acceptable Use &amp; Rate Limiting</h3>
            <p>You agree to use LoveLattice only for lawful purposes. You must not use the App to stalk, harass, or circumvent any technical limitations. You represent that any account you monitor is your own or you have obtained explicit consent. To prevent abuse and ensure SMS delivery reliability, we reserve the right to enforce rate limits on SMS alerts per user account.</p>
            <h3 className="text-white text-xl font-bold font-headline mt-8">3. Disclaimers &amp; Limitation of Liability</h3>
            <p>THE APP IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. IN NO EVENT SHALL LOVELATTICE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS OR DATA.</p>
            <h3 className="text-white text-xl font-bold font-headline mt-8">4. Contact</h3>
            <p>For questions about these Terms, contact us at <a href="mailto:support@lovelattice.org" className="text-primary hover:underline">support@lovelattice.org</a>.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-surface-container-lowest w-full py-20 px-8 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
        <div className="space-y-4 mb-8 md:mb-0 text-center md:text-left">
          <div className="text-xl font-black text-white font-headline">LoveLattice<span className="text-primary">.</span></div>
          <p className="font-inter text-xs tracking-widest uppercase text-on-surface-variant/60">© 2026 LoveLattice. Your data stays yours.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-10 font-inter text-xs tracking-widest uppercase">
          <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Features</a>
          <a href="#setup" className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Setup</a>
          <a href="#privacy-policy" className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Privacy</a>
          <a href="#terms" className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Terms</a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 flex justify-center md:justify-end">
        <div className="flex gap-8 opacity-40 hover:opacity-100 transition-opacity">
          <a href="mailto:support@lovelattice.org"><span className="material-symbols-outlined cursor-pointer hover:text-primary">mail</span></a>
          <a href="#setup"><span className="material-symbols-outlined cursor-pointer hover:text-primary">help</span></a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 text-center border-t border-white/5 pt-8">
        <p className="text-[10px] text-on-surface-variant/40 tracking-wider">macOS only (for now) • Message and data rates may apply • Text STOP to cancel SMS alerts</p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main>
        <Hero />
        <Features />
        <Privacy />
        <Operational />
        <Setup />
        <Pricing />
        <Legal />
      </main>
      <Footer />
    </div>
  );
}

export default App;
