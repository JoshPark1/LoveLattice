"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [licenseKey, setLicenseKey] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [debugError, setDebugError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Poll the backend until the Stripe Webhook has finished creating the license
    let intervalId;

    const fetchLicense = async () => {
      try {
        const res = await fetch('/api/get-license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        if (res.ok) {
          const data = await res.json();
          setLicenseKey(data.licenseKey);
          setDownloadUrl(data.downloadUrl);
          setLoading(false);
          clearInterval(intervalId); // Stop polling once we go it
        } else {
          const errData = await res.json().catch(() => ({}));
          setDebugError(`Status ${res.status}: ${errData.error || 'Unknown Backend Error'}`);
        }
      } catch (err) {
        setDebugError(`Network Error: ${err.message}. Is your server running?`);
        console.error("Waiting for webhook...", err);
      }
    };

    fetchLicense();
    // Poll every 2 seconds for a maximum of 15 seconds
    intervalId = setInterval(fetchLicense, 2000);
    setTimeout(() => { clearInterval(intervalId); setLoading(false); }, 15000);

    return () => clearInterval(intervalId);
  }, [sessionId]);

  const handleCopy = () => {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!sessionId) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold font-headline text-white mb-4">No Session Found</h1>
        <p className="text-on-surface-variant">Please return to the home page.</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center pt-24 pb-12 px-8 bg-surface-container-lowest relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>

      <div className="glass-card max-w-2xl w-full p-10 md:p-14 rounded-[3rem] border-primary/20 shadow-2xl relative z-10 text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20"></div>
          <span className="material-symbols-outlined text-primary text-4xl">inventory_2</span>
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
          Welcome to <span className="text-primary">LoveLattice.</span>
        </h1>
        <p className="text-on-surface-variant text-lg mb-12 max-w-lg mx-auto leading-relaxed">
          Your payment was successful. Do not lose this license key! You will need it to unlock the desktop app.
        </p>

        {loading ? (
          <div className="bg-surface-container-lowest border border-white/5 rounded-2xl p-8 mb-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <p className="text-sm font-mono text-on-surface-variant uppercase tracking-widest animate-pulse">Generating your unique key...</p>
            {debugError && ( <p className="text-xs text-red-500 font-mono mt-2">DEBUG: {debugError}</p> )}
          </div>
        ) : licenseKey ? (
          <div className="space-y-4 mb-10">
            <div className="bg-surface-container-lowest border border-primary/30 p-8 rounded-3xl relative group">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Your License Key</div>
              <code className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white block truncate pr-14">{licenseKey}</code>
              
              <button onClick={handleCopy} className="absolute top-4 right-4 bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 shadow-lg h-10 w-10">
                <span className={`material-symbols-outlined text-base ${copied ? 'text-green-400' : ''}`}>{copied ? 'check' : 'content_copy'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 mb-10">
            <p className="text-red-400 font-bold mb-2">We couldn&apos;t automatically load your key.</p>
            <p className="text-sm text-red-400/70">Check your email. We securely shipped your key and receipt to your inbox.</p>
          </div>
        )}

        <div className="border-t border-white/10 pt-10">
          <a 
            href={downloadUrl || "#"} 
            className={`inline-block w-full sm:w-auto px-10 py-5 bg-primary hover:bg-[#ff4d5a] text-white font-bold text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 ${(!licenseKey || !downloadUrl) ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-xl">download</span>
              Download Initializer (.dmg)
            </span>
          </a>
          <p className="text-xs text-on-surface-variant/50 mt-4 uppercase tracking-widest font-mono">
            Requires macOS 11.0 or later
          </p>
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
              <strong>Important:</strong> Because LoveLattice is an independent app, macOS blocks it by default. 
              You <span className="text-accent font-bold">must</span> follow the <a href="/#setup" className="text-primary hover:underline font-bold">1-Minute Setup Guide</a> to open it for the first time!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
