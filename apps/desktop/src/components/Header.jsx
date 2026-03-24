import logo from '../assets/logo.png';

export default function Header({ onOpenSettings }) {
  return (
    <header className="flex items-center justify-between mb-10">
      <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
        <img src={logo} alt="LoveLattice Logo" className="h-10 w-auto" />
        <span className="text-white">
          LoveLattice
        </span>
      </h1>
      <div className="flex items-center gap-3">
        <button className="btn-secondary flex items-center gap-2" onClick={onOpenSettings}>
          <span className="material-symbols-outlined text-base">settings</span>
          Settings
        </button>
      </div>
    </header>
  );
}
