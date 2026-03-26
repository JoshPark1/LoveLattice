import React from 'react';
import Modal from './Modal';

export default function SettingsModal({
  isOpen,
  onClose,
  onScan,
  onLogin,
  onLogout,
  onSwitchComputers,
  scanning,
  phoneNumber,
  onPhoneNumberChange,
  onSavePhoneNumber,
  savingPhoneNumber,
  phoneNumberStatus,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            SMS Phone Number
          </label>
          <input
            type="tel"
            className="input-field"
            placeholder="+15551234567"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
          />
          <button
            className="w-full btn-secondary py-3"
            onClick={onSavePhoneNumber}
            disabled={savingPhoneNumber}
          >
            {savingPhoneNumber ? 'Saving Phone Number...' : 'Save Phone Number'}
          </button>
          {phoneNumberStatus ? (
            <p className="text-xs text-text-tertiary">{phoneNumberStatus}</p>
          ) : null}
        </div>

        <hr className="border-border my-4" />

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
