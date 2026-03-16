import { useState, useEffect } from 'react';
import './App.css';
import {
  fetchAccounts, addAccount, updateAccount, removeAccount, uploadFaceImage,
  fetchStoryLogs, deleteStoryLog, fetchPreview, triggerLogin, triggerScan, API_BASE, SERVER_BASE
} from './api';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Modals state
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);

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
      // Update selected account if it exists
      if (selectedAccount) {
        const updated = accs.find(a => a.id === selectedAccount.id);
        if (updated) setSelectedAccount(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    try {
      await triggerLogin();
      alert("Browser opened. Please log in manually and then close this alert.");
    } catch (e) {
      alert("Failed to trigger login: " + e.message);
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

  const handleCreateAccount = async () => {
    if (!newUsername) return;
    try {
      await addAccount({ username: newUsername, note: newNote });
      setIsAddAccountModalOpen(false);
      setNewUsername('');
      setNewNote('');
      loadData();
    } catch (error) {
      alert("Failed to create account.");
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Delete this tracked account and all its data?")) return;
    try {
      await removeAccount(id);
      if (selectedAccount?.id === id) setSelectedAccount(null);
      loadData();
    } catch (error) {
      alert("Failed to delete account.");
    }
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

  const handleRemovePost = async (postId) => {
    if (!selectedAccount) return;
    try {
      const updatedPosts = selectedAccount.trackedPosts.filter(p => p.id !== postId);
      await updateAccount(selectedAccount.id, { trackedPosts: updatedPosts });
      loadData();
    } catch (e) {
      alert("Failed to remove post");
    }
  };

  const handleToggleStoryTracking = async (enabled) => {
    if (!selectedAccount) return;
    const storyConfig = { ...selectedAccount.storyConfig, enabled };
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

  const handleUploadFaceText = async (e) => {
    if (!selectedAccount || !e.target.files[0]) return;
    try {
      await uploadFaceImage(selectedAccount.id, e.target.files[0]);
      loadData();
    } catch (err) {
      alert("Failed to upload face image");
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Delete this story log entry and its saved snapshot?")) return;
    try {
      await deleteStoryLog(logId);
      loadData();
    } catch (e) {
      alert("Failed to delete story log: " + e.message);
    }
  };

  // --- Renderers ---

  const renderDashboard = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Tracked Accounts</h2>
        <button className="btn-primary" onClick={() => setIsAddAccountModalOpen(true)}>+ Add Account</button>
      </div>
      <div className="tracker-grid" style={{ marginBottom: '3rem' }}>
        {accounts.map(acc => (
          <div key={acc.id} className="tracker-card" onClick={() => setSelectedAccount(acc)} style={{ cursor: 'pointer' }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.id); }}
              style={{ position: 'absolute', top: '5px', right: '5px', padding: '0.2rem 0.5rem', background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', zIndex: 10 }}
              title="Remove Account"
            >✕</button>
            <div className="card-content" style={{ marginTop: '20px' }}>
              <h3 className="card-title">@{acc.username}</h3>
              <div className="card-meta" style={{ marginBottom: '10px' }}>{acc.note || "No notes"}</div>
              <div className="card-meta">
                {acc.trackedPosts?.length || 0} Tracked Posts <br />
                Story Tracking: {acc.storyConfig?.enabled ? 'Active' : 'Disabled'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2>Global Story Logs</h2>
      <div style={{ background: '#222', padding: '1rem', borderRadius: '8px' }}>
        {logs.length === 0 ? <p>No detections yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {logs.map(log => (
              <li key={log.id} style={{ position: 'relative', marginBottom: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem', paddingRight: '2rem' }}>
                <strong>{new Date(log.timestamp).toLocaleString()} - @{log.username}</strong>
                <br />
                Reason: {log.reason}
                <br />
                <a href={(log.storyThumbnail && log.storyThumbnail.startsWith('/thumbnails')) ? `${SERVER_BASE}${log.storyThumbnail}` : (log.storyThumbnail || log.storyUrl)} target="_blank" rel="noreferrer" style={{ color: '#00ccff' }}>View Snapshot</a>
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  title="Delete this log entry"
                  style={{ position: 'absolute', top: 0, right: 0, padding: '0.15rem 0.4rem', background: '#aa2222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                >✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const renderAccountDetail = () => {
    if (!selectedAccount) return null;
    const accountLogs = logs.filter(l => l.accountId === selectedAccount.id);

    return (
      <div>
        <button className="btn-secondary" onClick={() => setSelectedAccount(null)} style={{ marginBottom: '1rem' }}>← Back to Dashboard</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>@{selectedAccount.username} <span style={{ fontSize: '1rem', color: '#aaa' }}>({selectedAccount.note})</span></h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2rem', marginTop: '2rem' }}>

          {/* Tracked Posts Area */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Tracked Posts</h2>
              <button className="btn-primary" onClick={() => setIsAddPostModalOpen(true)}>+ Add Post URL</button>
            </div>

            <div className="tracker-grid">
              {(selectedAccount.trackedPosts || []).map(post => (
                <div key={post.id} className="tracker-card" style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleRemovePost(post.id)}
                    style={{ position: 'absolute', top: '5px', right: '5px', padding: '0.2rem 0.5rem', background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', zIndex: 10 }}
                  >✕</button>
                  <div className="card-img-container">
                    <a href={post.url} target="_blank" rel="noreferrer">
                      <img
                        src={post.thumbnailUrl.startsWith('/thumbnails') ? `${SERVER_BASE}${post.thumbnailUrl}` : post.thumbnailUrl}
                        alt="Thumbnail"
                        className="card-img"
                      />
                    </a>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{post.note || "Untitled"}</h3>
                    <div className={`status-badge status-${post.status || 'active'}`}>
                      {post.status || 'active'}
                    </div>
                  </div>
                </div>
              ))}
              {(!selectedAccount.trackedPosts || selectedAccount.trackedPosts.length === 0) && (
                <p>No posts tracked for this account yet.</p>
              )}
            </div>
          </div>

          {/* Story Tracking Config sidebar */}
          <div style={{ background: '#222', padding: '1.5rem', borderRadius: '8px' }}>
            <h3>Story Tracking Engine</h3>
            <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>Monitor this account's active stories daily for specific tags or faces.</p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedAccount.storyConfig?.enabled || false}
                  onChange={(e) => handleToggleStoryTracking(e.target.checked)}
                />
                Enable Daily Story Tracking
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Target Tags / Mentions (comma separated)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. username1, username2"
                defaultValue={(selectedAccount.storyConfig?.targetTags || []).join(', ')}
                onBlur={(e) => handleUpdateStoryTags(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Facial Recognition (Reference Photo)</label>
              {selectedAccount.storyConfig?.referenceFaceUrl && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <a href={`${SERVER_BASE}/uploads/${selectedAccount.storyConfig.referenceFaceUrl}`} target="_blank" rel="noreferrer">
                    <img src={`${SERVER_BASE}/uploads/${selectedAccount.storyConfig.referenceFaceUrl}`} alt="Reference Face" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                  </a>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleUploadFaceText} style={{ color: '#fff' }} />
            </div>

            <hr style={{ borderColor: '#444', margin: '1.5rem 0' }} />
            <h4>Recent Alerts for Account</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '0.85rem' }}>
              {accountLogs.length === 0 ? <p style={{ color: '#777' }}>No alerts found.</p> : (
                accountLogs.map(log => (
                  <div key={log.id} style={{ position: 'relative', marginBottom: '0.5rem', background: '#333', padding: '0.5rem', borderRadius: '4px', paddingRight: '2rem' }}>
                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div style={{ color: '#0cf' }}>{log.reason}</div>
                    <a href={(log.storyThumbnail && log.storyThumbnail.startsWith('/thumbnails')) ? `${SERVER_BASE}${log.storyThumbnail}` : (log.storyThumbnail || log.storyUrl)} target="_blank" rel="noreferrer" style={{ color: '#00ccff', display: 'block', marginTop: '4px' }}>View Snapshot</a>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      title="Delete this log entry"
                      style={{ position: 'absolute', top: '6px', right: '6px', padding: '0.15rem 0.4rem', background: '#aa2222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >✕</button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title" onClick={() => setSelectedAccount(null)} style={{ cursor: 'pointer' }}>LoveLattice</h1>
        <div>
          <button className="btn-secondary" onClick={handleScan} style={{ marginRight: '1rem' }} disabled={scanning}>
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
          <button className="btn-secondary" onClick={handleLogin}>
            Open Instagram Login
          </button>
        </div>
      </header>

      <main>
        {selectedAccount ? renderAccountDetail() : renderDashboard()}
      </main>

      {/* Add Account Modal */}
      {isAddAccountModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddAccountModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Tracked Account</h2>
            <div className="input-group">
              <input type="text" className="input-field" placeholder="Target Account Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
            </div>
            <div className="input-group">
              <input type="text" className="input-field" placeholder="Internal Note (e.g. My Friend, Coworker)" value={newNote} onChange={e => setNewNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setIsAddAccountModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateAccount} disabled={!newUsername}>Add Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Post URL Modal */}
      {isAddPostModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddPostModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Track a Specific Post/Highlight</h2>
            <div className="input-group">
              <input type="text" className="input-field" placeholder="Paste Instagram URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
            </div>
            <div className="input-group">
              <button className="btn-secondary" onClick={handlePreviewPost} disabled={loadingPreview}>
                {loadingPreview ? "Loading Preview..." : "Get Preview"}
              </button>
            </div>

            {previewData && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Select Media to Track</h3>
                <div className="preview-grid">
                  {previewData.map((media, idx) => (
                    <div key={idx} className={`preview-item ${selectedMedia?.id === media.id ? 'selected' : ''}`} onClick={() => setSelectedMedia(media)}>
                      <img src={`${API_BASE}/proxy-image?url=${encodeURIComponent(media.thumbnail)}`} className="preview-img" alt="" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedMedia && (
              <div className="input-group">
                <input type="text" className="input-field" placeholder="Add a note (e.g. 'Jane's Trip')" value={postNote} onChange={e => setPostNote(e.target.value)} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setIsAddPostModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSavePost} disabled={!selectedMedia}>Track Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
