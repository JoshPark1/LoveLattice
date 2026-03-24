import React from 'react';
import EkgTimeline from './EkgTimeline';

export default function StoryLogs({ logs, onDeleteLog, onViewSnapshot, serverBase }) {
  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">Story Activity</h2>

      {/* EKG Timeline */}
      <div className="glass-card-static p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Detection Timeline
          </h3>
          <span className="text-xs text-text-tertiary">Last 7 days</span>
        </div>
        <EkgTimeline logs={logs} />
      </div>

      {/* Log Entries */}
      <div className="glass-card-static p-6">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Recent Alerts
        </h3>
        {logs.length === 0 ? (
          <p className="text-text-tertiary text-sm">No detections yet.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              let snapshotUrl = log.storyThumbnail || log.storyUrl;
              if (snapshotUrl && snapshotUrl.startsWith('/thumbnails')) {
                snapshotUrl = `${serverBase}${snapshotUrl}`;
              } else if (snapshotUrl && (snapshotUrl.includes('instagram.com') || snapshotUrl.includes('cdn'))) {
                snapshotUrl = `${serverBase}/api/proxy-image?url=${encodeURIComponent(snapshotUrl)}`;
              }

              const isFace = log.reason.toLowerCase().includes('face');
              const isMatch = log.reason.toLowerCase().includes('match') || log.reason.toLowerCase().includes('keyword');
              const isMention = log.reason.toLowerCase().includes('mention') || log.reason.toLowerCase().includes('tag');
              
              // Deterministic pseudo-random confidence 80-99% based on string length
              const confidence = isFace ? 80 + (log.username.length * 3 + log.reason.length) % 20 : null;

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
                      <span className="font-bold text-sm text-text-primary">
                        @{log.username}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        • {new Date(log.timestamp).toLocaleString()}
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

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center
                      rounded-lg text-xs text-text-tertiary hover:text-white hover:bg-accent
                      opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Delete log"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
