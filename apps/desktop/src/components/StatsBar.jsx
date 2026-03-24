export default function StatsBar({ accounts, logs }) {
  const totalPosts = accounts.reduce(
    (sum, acc) => sum + (acc.trackedPosts?.length || 0),
    0
  );
  const activePosts = accounts.reduce(
    (sum, acc) =>
      sum +
      (acc.trackedPosts?.filter((p) => p.status === 'active')?.length || 0),
    0
  );

  const stats = [
    { label: 'Tracked Accounts', value: accounts.length, color: 'text-text-primary' },
    { label: 'Active Posts', value: activePosts, color: 'text-success' },
    { label: 'Story Alerts', value: logs.length, color: 'text-accent' },
  ];

  return (
    <div className="glass-card-static flex items-stretch divide-x divide-border mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="flex-1 px-6 py-4 text-center">
          <div className={`text-2xl font-extrabold ${stat.color}`}>
            {stat.value}
          </div>
          <div className="text-xs font-medium text-text-secondary mt-1 uppercase tracking-wider">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
