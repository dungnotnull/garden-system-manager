interface StatBarProps {
  label: string;
  value: number;
  max: number;
  displayText: string;
}

function barColor(ratio: number): string {
  if (ratio < 0.3) return "#A8E6CF";
  if (ratio < 0.7) return "#FFD93D";
  return "#FF6B6B";
}

export function StatBar({ label, value, max, displayText }: StatBarProps) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const widthPercent = `${(ratio * 100).toFixed(1)}%`;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-white/70 mb-1">
        <span>{label}</span>
        <span>{displayText}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: widthPercent,
            backgroundColor: barColor(ratio),
          }}
        />
      </div>
    </div>
  );
}
