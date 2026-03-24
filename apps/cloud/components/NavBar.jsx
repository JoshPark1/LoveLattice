"use client";
import { useState } from 'react';


export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto font-headline tracking-tight">
          <a href="#" className="text-2xl font-extrabold tracking-tighter flex items-center gap-2 cursor-pointer">
            <img src="/logo.png" alt="LoveLattice Logo" className="h-8 w-auto" />
            <div className="flex items-center gap-1">
              <span className="text-white">LoveLattice</span>
            </div>
          </a>
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-on-surface-variant font-medium hover:text-white transition-colors duration-300 cursor-pointer">Features</a>
            <a href="#setup" className="text-on-surface-variant font-medium hover:text-white transition-colors duration-300 cursor-pointer">Setup</a>
            <a href="#privacy" className="text-on-surface-variant font-medium hover:text-white transition-colors duration-300 cursor-pointer">Privacy</a>
            <a href="#pricing" className="bg-primary hover:bg-[#ff4d5a] text-white px-5 py-2 rounded-lg font-bold transition-all active:scale-95 shadow-lg shadow-primary/20">
              Download
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden text-white p-2"
          >
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>

        {/* Mobile Links */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-surface-container-high border-t border-white/5 flex flex-col items-center py-4 space-y-4">
            <a onClick={() => setIsMobileMenuOpen(false)} href="#features" className="text-white font-medium">Features</a>
            <a onClick={() => setIsMobileMenuOpen(false)} href="#setup" className="text-white font-medium">Setup</a>
            <a onClick={() => setIsMobileMenuOpen(false)} href="#privacy" className="text-white font-medium">Privacy</a>
            <a onClick={() => setIsMobileMenuOpen(false)} href="#pricing" className="bg-primary text-white px-6 py-2 rounded-lg font-bold">Download</a>
          </div>
        )}
      </nav>
    </>
  );
}
