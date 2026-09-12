function formatTime(seconds) {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ChallengeTimer({
  secondsLeft = 0,
  percent = 100,
  warningFirst = false,
  warningLast = false,
  style = {},
}) {
  const color = warningLast ? "#ef4444" : warningFirst ? "#f59e0b" : "#10b981";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          fontVariantNumeric: "tabular-nums",
          fontWeight: 700,
          fontSize: 20,
          color
        }}>
          {formatTime(secondsLeft)}
        </div>

        <div style={{ color: "#666", fontSize: 14 }}>
          restante
        </div>

        {warningLast && <div style={{ marginLeft: 12, color: "#ef4444", fontWeight: 700 }}>⚠ Tempo quase esgotado!</div>}
        {warningFirst && !warningLast && <div style={{ marginLeft: 12, color: "#f59e0b" }}>⏳ Faltando pouco</div>}
      </div>

      <div style={{ height: 8, borderRadius: 6, background: "#eee", overflow: "hidden" }}>
        <div style={{
          width: `${percent}%`,
          height: "100%",
          background: color,
          transition: "width 300ms linear"
        }} />
      </div>
    </div>
  );
}