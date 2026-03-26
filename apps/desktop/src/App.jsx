import { useState, useEffect } from 'react';
import {
  fetchAccounts, addAccount, updateAccount, removeAccount, uploadFaceImage, removeFaceImage,
  fetchStoryLogs, deleteStoryLog, fetchPreview, triggerLogin, triggerScan, triggerLogout, API_BASE, SERVER_BASE, syncLicenseKey
} from './api';

import Header from './components/Header';
import StatsBar from './components/StatsBar';
import AccountCard from './components/AccountCard';
import AccountDetail from './components/AccountDetail';
import EkgTimeline from './components/EkgTimeline';
import StoryLogs from './components/StoryLogs';
import Modal from './components/Modal';
import ConfirmModal from './components/ConfirmModal';
import LicenseScreen from './components/LicenseScreen';
import SettingsModal from './components/SettingsModal';
import { CLOUD_URL } from './config';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [license, setLicense] = useState(localStorage.getItem('lovelattice_license') || null);
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('lovelattice_phone_number') || '');
  const [savingPhoneNumber, setSavingPhoneNumber] = useState(false);
  const [phoneNumberStatus, setPhoneNumberStatus] = useState('');

  // Modals state
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [addAccountError, setAddAccountError] = useState(null);
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [selectedSnapshotUrl, setSelectedSnapshotUrl] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Account Form
  const [newUsername, setNewUsername] = useState('');
  const [newNote, setNewNote] = useState('');

  // Post Preview Form
  const [newUrl, setNewUrl] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [postNote, setPostNote] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadData = async () => {
    try {
      const [accs, lgs] = await Promise.all([fetchAccounts(), fetchStoryLogs()]);

      setAccounts(accs);
      setLogs(lgs);
      setSelectedAccount(prev => {
        if (!prev) return null;
        const updated = accs.find(a => a.id === prev.id);
        return updated || prev;
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    syncLicenseKey(license).catch((error) => {
      console.error('Failed to sync license key to desktop process:', error);
    });
  }, [license]);

  useEffect(() => {
    setPhoneNumber(localStorage.getItem('lovelattice_phone_number') || '');
  }, [license]);

  // --- Handlers ---

  const handleSwitchComputers = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Switch Computers',
      message: 'This will deactivate your license on this machine so you can use it on another. You will need to re-enter your license key. Are you sure?',
      onConfirm: async () => {
        const licenseKey = localStorage.getItem('lovelattice_license');
        const machineId = localStorage.getItem('lovelattice_machine_id');
        try {
          const res = await fetch(`${CLOUD_URL}/api/deactivate-license`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey, machineId })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to deactivate license.');
        } catch (err) {
          // Still deactivate locally even if network fails
          console.error('Deactivation error:', err);
        }
        localStorage.removeItem('lovelattice_license');
        localStorage.removeItem('lovelattice_machine_id');
        localStorage.removeItem('lovelattice_phone_number');
        setIsSettingsModalOpen(false);
        setLicense(null);
        setPhoneNumber('');
        setPhoneNumberStatus('');
      }
    });
  };

  const handleLogin = async () => {
    try {
      await triggerLogin();
      alert("Browser opened. Please log in manually and then close this alert.");
    } catch (e) {
      alert("Failed to trigger login: " + e.message);
    }
  };

  const handleLogout = async () => {
    try {
      await triggerLogout();
      alert("Session cookies entirely cleared! You are now logged out.");
    } catch (e) {
      alert("Failed to logout: " + e.message);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await triggerScan();
      alert("Scan started! Check your server console for progress.");
    } catch (e) {
      alert("Failed to start scan: " + e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleSavePhoneNumber = async () => {
    const licenseKey = localStorage.getItem('lovelattice_license');
    const machineId = localStorage.getItem('lovelattice_machine_id');

    if (!licenseKey || !machineId) {
      setPhoneNumberStatus('Activate your license on this machine before saving a phone number.');
      return;
    }

    setSavingPhoneNumber(true);
    setPhoneNumberStatus('');

    try {
      const res = await fetch(`${CLOUD_URL}/api/update-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, machineId, phoneNumber })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save phone number.');
      }

      localStorage.setItem('lovelattice_phone_number', data.phoneNumber);
      setPhoneNumber(data.phoneNumber);
      setPhoneNumberStatus('Phone number saved for SMS alerts.');
    } catch (error) {
      setPhoneNumberStatus(error.message);
    } finally {
      setSavingPhoneNumber(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newUsername) return;
    setIsAddingAccount(true);
    setAddAccountError(null);
    try {
      await addAccount({ username: newUsername, note: newNote });
      setIsAddAccountModalOpen(false);
      setNewUsername('');
      setNewNote('');
      loadData();
    } catch (error) {
      setAddAccountError(error.message || "Failed to create account. Account may be private or not exist.");
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleDeleteAccount = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Account',
      message: 'Are you sure you want to delete this tracked account and all its data?',
      onConfirm: async () => {
        try {
          await removeAccount(id);
          if (selectedAccount?.id === id) setSelectedAccount(null);
          loadData();
        } catch (error) {
          alert("Failed to delete account.");
        }
      }
    });
  };

  const handlePreviewPost = async () => {
    if (!newUrl) return;
    setLoadingPreview(true);
    setPreviewData(null);
    setSelectedMedia(null);
    try {
      const data = await fetchPreview(newUrl);
      setPreviewData(data);
    } catch (e) {
      alert("Failed to fetch preview. Ensure you are logged in (server-side) and URL is correct.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSavePost = async () => {
    if (!selectedAccount || !selectedMedia) return;
    try {
      const newPost = {
        url: newUrl,
        type: selectedMedia.type,
        targetMediaId: selectedMedia.id,
        thumbnailUrl: selectedMedia.thumbnail,
        note: postNote,
        status: 'active'
      };
      const updatedPosts = [...(selectedAccount.trackedPosts || []), newPost];
      await updateAccount(selectedAccount.id, { trackedPosts: updatedPosts });
      setIsAddPostModalOpen(false);
      setNewUrl('');
      setPreviewData(null);
      setSelectedMedia(null);
      setPostNote('');
      loadData();
    } catch (e) {
      alert("Failed to save post: " + e.message);
    }
  };

  const handleEditPostNote = async (postId, newNote) => {
    if (!selectedAccount) return;
    try {
      const updatedPosts = selectedAccount.trackedPosts.map(p => 
        p.id === postId ? { ...p, note: newNote } : p
      );
      await updateAccount(selectedAccount.id, { trackedPosts: updatedPosts });
      loadData();
    } catch (e) {
      alert("Failed to update post note: " + e.message);
    }
  };

  const handleRemovePost = (postId) => {
    if (!selectedAccount) return;
    setConfirmModal({
      isOpen: true,
      title: 'Remove Tracked Post',
      message: 'Are you sure you want to remove this post from tracking?',
      onConfirm: async () => {
        try {
          const updatedPosts = selectedAccount.trackedPosts.filter(p => p.id !== postId);
          await updateAccount(selectedAccount.id, { trackedPosts: updatedPosts });
          loadData();
        } catch (e) {
          alert("Failed to remove post");
        }
      }
    });
  };

  const handleToggleStoryTracking = async (enabled) => {
    if (!selectedAccount) return;
    const storyConfig = { ...selectedAccount.storyConfig, enabled };
    if (!enabled) storyConfig.notify = false; // Disable notifications if tracking is turned off
    await updateAccount(selectedAccount.id, { storyConfig });
    loadData();
  };

  const handleToggleStoryNotify = async (notify) => {
    if (!selectedAccount) return;
    const storyConfig = { ...selectedAccount.storyConfig, notify };
    await updateAccount(selectedAccount.id, { storyConfig });
    loadData();
  };

  const handleUpdateStoryTags = async (tagsStr) => {
    if (!selectedAccount) return;
    const tags = tagsStr.split(',').map(s => s.trim()).filter(s => s);
    const storyConfig = { ...selectedAccount.storyConfig, targetTags: tags };
    await updateAccount(selectedAccount.id, { storyConfig });
    loadData();
  };

  const handleUploadFace = async (e) => {
    if (!selectedAccount || !e.target.files[0]) return;
    try {
      await uploadFaceImage(selectedAccount.id, e.target.files[0]);
      loadData();
    } catch (err) {
      alert("Failed to upload face image");
    }
  };

  const handleRemoveFace = async () => {
    if (!selectedAccount) return;
    try {
      await removeFaceImage(selectedAccount.id);
      loadData();
    } catch (e) {
      alert("Failed to remove reference face");
    }
  };

  const handleDeleteLog = (logId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Story Log',
      message: 'Are you sure you want to delete this story log entry and its saved snapshot?',
      onConfirm: async () => {
        try {
          await deleteStoryLog(logId);
          loadData();
        } catch (e) {
          alert("Failed to delete story log: " + e.message);
        }
      }
    });
  };

  const handleViewSnapshot = (url) => {
    setSelectedSnapshotUrl(url);
    setIsSnapshotModalOpen(true);
  };

  // --- Render ---

  if (!license) {
    return <LicenseScreen onUnlock={(key) => setLicense(key)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Header
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <main>
        {selectedAccount ? (
          <AccountDetail
            account={selectedAccount}
            logs={logs}
            onBack={() => setSelectedAccount(null)}
            onRemovePost={handleRemovePost}
            onEditPostNote={handleEditPostNote}
            onOpenAddPost={() => setIsAddPostModalOpen(true)}
            onToggleStoryTracking={handleToggleStoryTracking}
            onToggleStoryNotify={handleToggleStoryNotify}
            onUpdateStoryTags={handleUpdateStoryTags}
            onUploadFace={handleUploadFace}
            onRemoveFace={handleRemoveFace}
            onDeleteLog={handleDeleteLog}
            onViewSnapshot={handleViewSnapshot}
            serverBase={SERVER_BASE}
            apiBase={API_BASE}
          />
        ) : (
          <>
            <StatsBar accounts={accounts} logs={logs} />

            {/* Account Grid */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Tracked Accounts</h2>
              <button
                className="btn-primary"
                onClick={() => setIsAddAccountModalOpen(true)}
              >
                + Add Account
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {accounts.map(acc => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onClick={() => setSelectedAccount(acc)}
                  onDelete={handleDeleteAccount}
                />
              ))}
              {accounts.length === 0 && (
                <div className="glass-card-static p-8 col-span-full text-center">
                  <p className="text-text-tertiary text-sm">
                    No accounts tracked yet. Add one to get started.
                  </p>
                </div>
              )}
            </div>

            <StoryLogs
              logs={logs}
              onDeleteLog={handleDeleteLog}
              onViewSnapshot={handleViewSnapshot}
              serverBase={SERVER_BASE}
            />
          </>
        )}
      </main>

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        title="Add Tracked Account"
      >
        <div className="space-y-4">
          {addAccountError && (
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-sm text-accent">
              <span className="font-bold mr-1">Error:</span> {addAccountError}
            </div>
          )}
          <input
            type="text"
            className="input-field"
            placeholder="Target Account Username"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Internal Note (e.g. My Friend, Coworker)"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="btn-secondary"
              onClick={() => {
                setIsAddAccountModalOpen(false);
                setAddAccountError(null);
              }}
              disabled={isAddingAccount}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex justify-center items-center"
              onClick={handleCreateAccount}
              disabled={!newUsername || isAddingAccount}
            >
              {isAddingAccount ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : 'Add Account'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Post Modal */}
      <Modal
        isOpen={isAddPostModalOpen}
        onClose={() => setIsAddPostModalOpen(false)}
        title="Track a Specific Post/Highlight"
      >
        <div className="space-y-4">
          <input
            type="text"
            className="input-field"
            placeholder="Paste Instagram URL"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
          />
          <button
            className="btn-secondary flex justify-center items-center"
            onClick={handlePreviewPost}
            disabled={loadingPreview}
          >
            {loadingPreview ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading Preview...
              </>
            ) : 'Get Preview'}
          </button>

          {previewData && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Select Media to Track</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {previewData.map((media, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedMedia?.id === media.id
                        ? 'border-accent shadow-[0_0_12px_rgba(230,57,70,0.4)]'
                        : 'border-transparent hover:border-border-hover'
                      }`}
                    onClick={() => setSelectedMedia(media)}
                  >
                    <img
                      src={`${SERVER_BASE}/api/proxy-image?url=${encodeURIComponent(media.thumbnail)}`}
                      className="w-full h-24 object-cover"
                      alt=""
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMedia && (
            <input
              type="text"
              className="input-field"
              placeholder="Add a note (e.g. 'Jane's Trip')"
              value={postNote}
              onChange={e => setPostNote(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="btn-secondary"
              onClick={() => setIsAddPostModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSavePost}
              disabled={!selectedMedia}
            >
              Track Post
            </button>
          </div>
        </div>
      </Modal>

      {/* Snapshot Modal */}
      <Modal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        title="Detection Snapshot"
      >
        <div className="flex flex-col items-center">
          {selectedSnapshotUrl ? (
            <img
              src={selectedSnapshotUrl}
              alt="Story Snapshot"
              className="max-w-full max-h-[70vh] object-contain rounded-xl border border-border"
            />
          ) : (
            <p className="text-text-tertiary">Image not available.</p>
          )}
          <div className="mt-6 w-full flex justify-end">
            <button
              className="btn-secondary"
              onClick={() => setIsSnapshotModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onScan={handleScan}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSwitchComputers={handleSwitchComputers}
        scanning={scanning}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        onSavePhoneNumber={handleSavePhoneNumber}
        savingPhoneNumber={savingPhoneNumber}
        phoneNumberStatus={phoneNumberStatus}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}

export default App;
