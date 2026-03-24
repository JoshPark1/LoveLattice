import React from 'react';
import Modal from './Modal';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", isDanger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-text-secondary text-sm">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`font-semibold py-2 px-4 rounded-xl transition-all ${isDanger ? 'bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20 hover:border-accent' : 'btn-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
