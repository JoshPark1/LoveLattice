import React, { useState, useEffect } from 'react';

// Using the local dev server for testing, will need to be production URL when Vercel deployed
const CLOUD_URL = 'http://localhost:3000'; 

export default function LicenseScreen({ onUnlock }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Generate a unique machine ID if one doesn't exist
    if (!localStorage.getItem('lovelattice_machine_id')) {
      localStorage.setItem('lovelattice_machine_id', crypto.randomUUID());
    }
  }, []);

  const handleActivate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const machineId = localStorage.getItem('lovelattice_machine_id');

    try {
      const res = await fetch(`${CLOUD_URL}/api/activate-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ licenseKey: key, machineId })
      });

      const data = await res.json();

      if (res.ok) {
        // Activation successful! Save the key to bypass this screen forever
        localStorage.setItem('lovelattice_license', key);
        onUnlock(key);
      } else {
        setError(data.error || 'Failed to verify license.');
      }
    } catch (err) {
      setError('Could not connect to the activation server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0c0c0e] flex items-center justify-center z-50 px-6">
      <div className="bg-[#121214] border border-white/5 p-10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-accent text-3xl">lock</span>
          </div>
          <h2 className="text-3xl font-black font-headline text-text-primary mb-2">Activate LoveLattice</h2>
          <p className="text-text-tertiary text-sm">Please enter the license key sent to your email.</p>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="LOVE-XXXX-XXXX-XXXX" 
              className="w-full bg-[#18181b] border border-white/10 rounded-xl px-5 py-4 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-accent text-center tracking-widest uppercase transition-colors"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center p-3 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-accent hover:bg-[#ff4d5a] disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-95 flex items-center justify-center"
            disabled={!key || loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Verifying...
              </span>
            ) : (
              'Unlock Application'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-text-tertiary">
          Need a key? Purchase one at <a href="#" className="text-accent underline">lovelattice.com</a>
        </p>
      </div>
    </div>
  );
}
