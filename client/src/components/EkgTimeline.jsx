import { useMemo } from 'react';

/**
 * EKG-style timeline visualization.
 * Plots story detection events as heartbeat spikes along a 7-day axis.
 */
export default function EkgTimeline({ logs }) {
  const width = 800;
  const height = 120;
  const padX = 40;
  const padY = 20;

  // Get last 7 days
  const days = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      result.push(d);
    }
    return result;
  }, []);

  const dayLabels = days.map((d) =>
    d.toLocaleDateString('en-US', { weekday: 'short' })
  );

  // Bin logs into each day
  const bins = useMemo(() => {
    return days.map((dayStart) => {
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      return logs.filter((l) => {
        const t = new Date(l.timestamp);
        return t >= dayStart && t < dayEnd;
      }).length;
    });
  }, [logs, days]);

  const maxBin = Math.max(...bins, 1);

  // Build the EKG path
  const pathData = useMemo(() => {
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    const segW = usableW / (days.length - 1);
    const baseline = padY + usableH;

    const points = bins.map((count, i) => {
      const x = padX + i * segW;
      const intensity = count / maxBin;

      if (count === 0) {
        return `L ${x} ${baseline}`;
      }

      // EKG-style spike: small dip, sharp rise, sharp fall, small recovery
      const spikeH = intensity * usableH * 0.85;
      const halfSeg = segW * 0.15;

      return [
        `L ${x - halfSeg * 2} ${baseline}`,
        `L ${x - halfSeg} ${baseline + 4}`, // small dip
        `L ${x} ${baseline - spikeH}`, // sharp rise
        `L ${x + halfSeg} ${baseline + 6}`, // overshoot below
        `L ${x + halfSeg * 2} ${baseline}`, // recovery
      ].join(' ');
    });

    return `M 0 ${baseline} ${points.join(' ')} L ${width} ${baseline}`;
  }, [bins, maxBin, days.length]);

  // Event dot positions
  const dots = useMemo(() => {
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    const segW = usableW / (days.length - 1);
    const baseline = padY + usableH;

    return bins
      .map((count, i) => {
        if (count === 0) return null;
        const x = padX + i * segW;
        const intensity = count / maxBin;
        const y = baseline - intensity * usableH * 0.85;
        return { x, y, count };
      })
      .filter(Boolean);
  }, [bins, maxBin, days.length]);

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height + 30}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Glow filter */}
        <defs>
          <filter id="ekg-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {days.map((_, i) => {
          const x = padX + (i * (width - padX * 2)) / (days.length - 1);
          return (
            <line
              key={i}
              x1={x}
              y1={padY}
              x2={x}
              y2={height}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          );
        })}

        {/* Baseline */}
        <line
          x1={padX}
          y1={padY + height - padY * 2}
          x2={width - padX}
          y2={padY + height - padY * 2}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        {/* EKG line */}
        <path
          d={pathData}
          fill="none"
          stroke="#E63946"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#ekg-glow)"
        />

        {/* Event dots */}
        {dots.map((dot, i) => (
          <g key={i}>
            <circle cx={dot.x} cy={dot.y} r="5" fill="#E63946" opacity="0.3" />
            <circle cx={dot.x} cy={dot.y} r="2.5" fill="#E63946" />
          </g>
        ))}

        {/* Day labels */}
        {dayLabels.map((label, i) => {
          const x = padX + (i * (width - padX * 2)) / (days.length - 1);
          return (
            <text
              key={i}
              x={x}
              y={height + 20}
              textAnchor="middle"
              fill="#8B949E"
              fontSize="11"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
