export default function AccountCard({ account, onClick, onDelete }) {
  return (
    <div
      className="glass-card relative cursor-pointer hover:-translate-y-1 group"
      onClick={onClick}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(account.id);
        }}
        className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg
          bg-accent/20 text-accent text-sm opacity-0 group-hover:opacity-100 transition-all
          hover:bg-accent hover:text-white"
        title="Remove Account"
      >
        ✕
      </button>

      <div className="p-5">
        {/* Username */}
        <h3 className="text-lg font-bold mb-1">
          <a
            href={`https://instagram.com/${account.username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-accent transition-colors inline-block"
          >
            <span className="text-text-secondary">@</span>
            {account.username}
          </a>
        </h3>

        {/* Note */}
        <p className="text-sm text-text-secondary mb-4">
          {account.note || 'No notes'}
        </p>

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="text-xs">
              <span className="text-text-primary font-semibold">
                {account.trackedPosts?.length || 0}
              </span>{' '}
              <span className="text-text-tertiary">Posts</span>
              {account.trackedPosts?.some(p => p.status === 'missing') && (
                <span 
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold shadow-[0_0_8px_rgba(230,57,70,0.6)]" 
                  title="Tracked post is missing!"
                >
                  !
                </span>
              )}
            </div>
          </div>
          <span
            className={
              account.storyConfig?.enabled ? 'badge-active' : 'badge-alert'
            }
          >
            {account.storyConfig?.enabled ? 'Stories On' : 'Stories Off'}
          </span>
        </div>
      </div>
    </div>
  );
}
