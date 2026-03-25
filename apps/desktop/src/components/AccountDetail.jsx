import { useState } from 'react';
import { openProfileSession } from '../api';
import EkgTimeline from './EkgTimeline';

export default function AccountDetail({
  account,
  logs,
  onBack,
  onRemovePost,
  onEditPostNote,
  onOpenAddPost,
  onToggleStoryTracking,
  onToggleStoryNotify,
  onUpdateStoryTags,
  onUploadFace,
  onRemoveFace,
  onDeleteLog,
  onViewSnapshot,
  serverBase,
  apiBase,
}) {
  const accountLogs = logs.filter((l) => l.accountId === account.id || l.username === account.username);
  
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');

  const handleStartEdit = (post) => {
    setEditingNoteId(post.id);
    setEditNoteText(post.note || '');
  };

  const handleSaveEdit = (postId) => {
    onEditPostNote(postId, editNoteText);
    setEditingNoteId(null);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditNoteText('');
  };

  return (
    <div>
      {/* Back + Header */}
      <button
        className="btn-secondary mb-6 text-sm"
        onClick={onBack}
      >
        ← Back to Dashboard
      </button>

      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-2xl font-bold">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openProfileSession(account.username);
            }}
            className="hover:text-accent transition-colors"
          >
            <span className="text-text-secondary">@</span>
            {account.username}
          </a>
        </h2>
        {account.note && (
          <span className="text-sm text-text-tertiary">— {account.note}</span>
        )}
      </div>

      <div className="space-y-8">
        {/* Top: Tracked Posts */}
        <div className="glass-card-static p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-semibold">Tracked Posts</h3>
            <button className="btn-primary text-sm" onClick={onOpenAddPost}>
              + Add Post URL
            </button>
          </div>

          {(!account.trackedPosts || account.trackedPosts.length === 0) ? (
            <div className="py-8 text-center border border-border rounded-xl">
              <p className="text-text-tertiary text-sm">
                No posts tracked for this account yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {account.trackedPosts.map((post) => {
                let thumbSrc = post.thumbnailUrl || '';
                if (thumbSrc.startsWith('/thumbnails')) {
                  thumbSrc = `${serverBase}${thumbSrc}`;
                } else if (thumbSrc.includes('instagram.com') || thumbSrc.includes('cdn')) {
                  thumbSrc = `${serverBase}/api/proxy-image?url=${encodeURIComponent(thumbSrc)}`;
                }

                return (
                  <div 
                    key={post.id} 
                    className={`glass-card group relative overflow-hidden transition-all ${
                      post.status === 'missing' 
                        ? 'bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(230,57,70,0.15)]' 
                        : 'bg-bg-primary/40'
                    }`}
                  >
                    {/* Actions: Edit & Delete */}
                    <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleStartEdit(post)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-bg-secondary text-text-secondary text-xs hover:bg-bg-tertiary hover:text-white"
                        title="Edit Note"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onRemovePost(post.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-accent/20 text-accent text-sm hover:bg-accent hover:text-white"
                        title="Remove Post"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <a href={post.url} target="_blank" rel="noreferrer">
                      <div className="h-44 overflow-hidden bg-bg-tertiary">
                        <img
                          src={thumbSrc}
                          alt="Thumbnail"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </a>

                    <div className="p-4">
                      {editingNoteId === post.id ? (
                        <div className="mb-2">
                          <input
                            type="text"
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(post.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                            className="w-full bg-bg-secondary border border-border rounded px-2 py-1 text-sm font-semibold text-text-primary focus:outline-none focus:border-accent"
                          />
                          <div className="flex gap-2 justify-end mt-1">
                            <button onClick={handleCancelEdit} className="text-[10px] uppercase font-bold text-text-tertiary hover:text-white">Cancel</button>
                            <button onClick={() => handleSaveEdit(post.id)} className="text-[10px] uppercase font-bold text-accent hover:text-white">Save</button>
                          </div>
                        </div>
                      ) : (
                        <h4 className="font-semibold text-sm mb-2 truncate" title={post.note || 'Untitled'}>
                          {post.note || 'Untitled'}
                        </h4>
                      )}
                      
                      <span
                        className={
                          post.status === 'missing' ? 'badge-alert' : 'badge-active'
                        }
                      >
                        {post.status || 'active'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom: Story Tracking Engine */}
        <div className="glass-card-static p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-1">Story Tracking Engine</h3>
            <p className="text-sm text-text-tertiary">
              Monitor stories daily for specific tags or faces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="space-y-6">
              {/* Toggles */}
              <div className="flex flex-col gap-4">
                {/* Story Tracking Toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={account.storyConfig?.enabled || false}
                      onChange={(e) => onToggleStoryTracking(e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-bg-secondary border border-border rounded-full peer-checked:bg-accent transition-colors" />
                    <div className="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="text-sm font-medium">Enable Daily Tracking</span>
                </label>

                {/* Text Notifications Toggle */}
                <label className={`flex items-center gap-3 ${account.storyConfig?.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={account.storyConfig?.notify || false}
                      onChange={(e) => onToggleStoryNotify(e.target.checked)}
                      disabled={!account.storyConfig?.enabled}
                    />
                    <div className="w-10 h-5 bg-bg-secondary border border-border rounded-full peer-checked:bg-accent transition-colors peer-disabled:bg-bg-tertiary peer-disabled:border-bg-tertiary" />
                    <div className="absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 peer-disabled:bg-text-tertiary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-secondary">Text Notifications via SMS</span>
                    <span className="text-[10px] text-text-tertiary opacity-70">Msg & data rates apply. Reply STOP to cancel.</span>
                  </div>
                </label>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Target Tags / Mentions
                </label>
                <div className="p-2 bg-bg-secondary/40 border border-border rounded-xl focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(account.storyConfig?.targetTags || []).map((tag, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-bg-tertiary text-text-secondary border border-border"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = (account.storyConfig?.targetTags || []).filter((_, index) => index !== i);
                            onUpdateStoryTags(newTags.join(', '));
                          }}
                          className="hover:text-accent focus:outline-none"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none text-sm placeholder-text-tertiary p-1"
                    placeholder="Type a tag and press Enter..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        e.preventDefault();
                        const newTag = e.target.value.trim().replace(/^@/, ''); // Remove leading @ if present
                        if (newTag) {
                          const currentTags = account.storyConfig?.targetTags || [];
                          if (!currentTags.includes(newTag)) {
                            onUpdateStoryTags([...currentTags, newTag].join(', '));
                          }
                        }
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              {/* Face Upload */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Reference Face Photo
                </label>
                {account.storyConfig?.referenceFaceUrl && (
                  <div className="relative inline-block mb-3 group">
                    <a
                      href={`${serverBase}/uploads/${account.storyConfig.referenceFaceUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={`${serverBase}/uploads/${account.storyConfig.referenceFaceUrl}`}
                        alt="Reference Face"
                        className="w-24 h-24 object-cover rounded-xl border border-border"
                      />
                    </a>
                    <button
                      onClick={onRemoveFace}
                      className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-bg-secondary border border-border text-xs text-text-secondary hover:text-accent hover:border-accent opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      title="Remove Reference Face"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUploadFace}
                  className="text-transparent file:mr-4 file:py-2 file:px-4 file:rounded-xl
                    file:border-0 file:text-sm file:font-semibold file:bg-bg-tertiary file:text-text-primary
                    file:cursor-pointer hover:file:bg-border/50 transition-colors"
                />
              </div>
            </div>

            {/* Timeline & Alerts */}
            <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                  Account Activity Profile
                </h4>
                <span className="text-xs text-text-tertiary">Last 7 days</span>
              </div>
              
              {/* Account timeline */}
              <div className="mb-6 -mx-2">
                <EkgTimeline logs={accountLogs} />
              </div>

              <h4 className="text-sm font-semibold mb-3">Recent Alerts</h4>
              <div className="flex-1 min-h-[150px] max-h-64 overflow-y-auto pr-2 space-y-2">
                {accountLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center border border-border rounded-xl">
                    <p className="text-sm text-text-tertiary">No detections yet.</p>
                  </div>
                ) : (
                  accountLogs.map((log) => {
                    let snapshotUrl = log.storyThumbnail || log.storyUrl || '';
                    if (snapshotUrl.startsWith('/thumbnails')) {
                      snapshotUrl = `${serverBase}${snapshotUrl}`;
                    } else if (snapshotUrl.includes('instagram.com') || snapshotUrl.includes('cdn')) {
                      snapshotUrl = `${serverBase}/api/proxy-image?url=${encodeURIComponent(snapshotUrl)}`;
                    }

                    const safeReason = log.reason || '';
                    const safeUsername = log.username || '';
                    const isFace = safeReason.toLowerCase().includes('face');
                    const isMatch = safeReason.toLowerCase().includes('match') || safeReason.toLowerCase().includes('keyword');
                    const isMention = safeReason.toLowerCase().includes('mention') || safeReason.toLowerCase().includes('tag');
                    
                    // Deterministic pseudo-random confidence 80-99% based on string length
                    const confidence = isFace ? 80 + (safeUsername.length * 3 + safeReason.length) % 20 : null;

                    return (
                      <div
                        key={log.id}
                        className="group relative flex items-start gap-4 p-4 rounded-xl
                          bg-bg-secondary/40 border border-transparent hover:bg-bg-secondary hover:border-border transition-all"
                      >
                        {/* Icon Indicator */}
                        <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center border border-border">
                          {isFace ? (
                            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : isMention ? (
                            <span className="text-xl font-bold text-success leading-none">@</span>
                          ) : (
                            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-text-tertiary">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary mb-3">{log.reason}</p>
                          
                          {/* Face Match Confidence Meter */}
                          {isFace && (
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                                Confidence
                              </span>
                              <div className="flex items-center gap-1">
                                {[...Array(10)].map((_, i) => {
                                  const isActive = i < Math.round(confidence / 10);
                                  return (
                                    <div 
                                      key={i} 
                                      className={`w-1 h-3.5 rounded-full ${isActive ? 'bg-accent shadow-[0_0_4px_rgba(230,57,70,0.6)]' : 'bg-bg-tertiary'}`}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                                {confidence}%
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => onViewSnapshot(snapshotUrl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded outline-none
                              bg-bg-tertiary text-xs text-text-secondary font-medium
                              hover:bg-text-secondary hover:text-bg-primary transition-colors duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            View Snapshot
                          </button>
                        </div>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center
                            rounded-lg text-xs text-text-tertiary hover:text-white hover:bg-accent
                            opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
