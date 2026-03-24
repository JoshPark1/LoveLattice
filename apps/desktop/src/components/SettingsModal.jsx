import React from 'react';
import Modal from './Modal';

export default function SettingsModal({
  isOpen,
  onClose,
  onScan,
  onLogin,
  onLogout,
  onSwitchComputers,
  scanning
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <button
          className="w-full btn-secondary flex justify-center items-center py-3"
          onClick={onScan}
          disabled={scanning}
        >
          {scanning ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
              Scanning…
            </span>
          ) : (
            'Scan Now'
          )}
        </button>
        
        <button 
          className="w-full btn-secondary py-3" 
          onClick={onLogin}
        >
          Open Instagram Login
        </button>

        <hr className="border-border my-4" />

        <button 
          className="w-full btn-secondary text-accent border-accent/20 hover:bg-accent hover:border-accent hover:text-white py-3 transition-colors" 
          onClick={onLogout}
        >
          Clear Session (Log out of Instagram)
        </button>

        <button 
          className="w-full btn-secondary text-accent border-accent/20 hover:bg-accent hover:border-accent hover:text-white py-3 transition-colors" 
          onClick={onSwitchComputers}
        >
          Switch Computers (Deactivate License)
        </button>
      </div>
    </Modal>
  );
}
