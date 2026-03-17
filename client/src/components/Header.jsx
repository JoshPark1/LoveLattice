export default function Header({ onScan, onLogin, scanning }) {
  return (
    <header className="flex items-center justify-between mb-10">
      <h1
        className="text-3xl font-extrabold tracking-tight cursor-pointer flex items-center gap-2"
        onClick={onLogin ? undefined : undefined}
      >
        <span className="text-accent text-4xl">♥</span>
        <span className="bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
          LoveLattice
        </span>
      </h1>
      <div className="flex items-center gap-3">
        <button
          className="btn-secondary"
          onClick={onScan}
          disabled={scanning}
        >
          {scanning ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
              Scanning…
            </span>
          ) : (
            'Scan Now'
          )}
        </button>
        <button className="btn-secondary" onClick={onLogin}>
          Open Instagram Login
        </button>
      </div>
    </header>
  );
}
