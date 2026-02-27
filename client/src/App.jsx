import { useState, useEffect } from 'react';
import './App.css';
import { fetchTrackedItems, addTracker, fetchPreview, triggerLogin, removeTracker, triggerScan, API_BASE, SERVER_BASE } from './api';

function App() {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await fetchTrackedItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  };

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

  const handlePreview = async () => {
    if (!newUrl) return;
    setLoading(true);
    setPreviewData(null);
    try {
      const data = await fetchPreview(newUrl);
      setPreviewData(data);
    } catch (e) {
      alert("Failed to fetch preview. Ensure you are logged in (server-side) and URL is correct.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedMedia) return;
    try {
      await addTracker({
        url: newUrl,
        type: selectedMedia.type,
        targetMediaId: selectedMedia.id,
        thumbnailUrl: selectedMedia.thumbnail,
        note: note
      });
      setIsModalOpen(false);
      loadItems();
      // Reset
      setNewUrl('');
      setPreviewData(null);
      setSelectedMedia(null);
      setNote('');
    } catch (e) {
      alert("Failed to save tracker.");
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeTracker(id);
      loadItems();
    } catch (e) {
      alert("Failed to remove tracker.");
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">LoveLattice</h1>
        <div>
          <button className="btn-secondary" onClick={handleScan} style={{ marginRight: '1rem' }} disabled={scanning}>
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
          <button className="btn-secondary" onClick={handleLogin} style={{ marginRight: '1rem' }}>
            Open Instagram Login
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add Tracker
          </button>
        </div>
      </header>

      <main className="tracker-grid">
        {items.map(item => (
          <div key={item.id} className="tracker-card" style={{ position: 'relative' }}>
            <button
              onClick={() => handleRemove(item.id)}
              style={{ position: 'absolute', top: '5px', right: '5px', padding: '0.2rem 0.5rem', background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', zIndex: 10 }}
              title="Remove Tracker"
            >
              ✕
            </button>
            <div className="card-img-container">
              <img
                src={item.thumbnailUrl.startsWith('/thumbnails') ? `${SERVER_BASE}${item.thumbnailUrl}` : item.thumbnailUrl}
                alt="Thumbnail"
                className="card-img"
              />
            </div>
            <div className="card-content">
              <h3 className="card-title">{item.note || "Untitlted Tracker"}</h3>
              <div className="card-meta">
                ID: {item.targetMediaId.substring(0, 10)}...
              </div>
              <div className={`status-badge status-${item.status}`}>
                {item.status}
              </div>
            </div>
          </div>
        ))}
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add New Tracker</h2>
            <div className="input-group">
              <input
                type="text"
                className="input-field"
                placeholder="Paste Instagram URL (Post or Highlight)"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
              />
            </div>
            <div className="input-group">
              <button className="btn-secondary" onClick={handlePreview} disabled={loading}>
                {loading ? "Loading Preview..." : "Get Preview"}
              </button>
            </div>

            {previewData && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Select Specific Media to Track</h3>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Click on the photo/video you want to monitor.</p>
                <div className="preview-grid">
                  {previewData.map((media, idx) => (
                    <div
                      key={idx}
                      className={`preview-item ${selectedMedia?.id === media.id ? 'selected' : ''}`}
                      onClick={() => setSelectedMedia(media)}
                    >
                      <img
                        src={`${API_BASE}/proxy-image?url=${encodeURIComponent(media.thumbnail)}`}
                        className="preview-img"
                        alt=""
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedMedia && (
              <div className="input-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Add a note (e.g. 'Jane's Trip')"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={!selectedMedia}>Start Tracking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
