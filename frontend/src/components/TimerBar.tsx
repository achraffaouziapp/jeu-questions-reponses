export function TimerBar({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const ratio = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0
  const pct = Math.round(ratio * 100)

  return (
    <div className="timer">
      <div className="timerLabel">
        Temps: {(remainingMs / 1000).toFixed(1)}s
      </div>
      <div className="timerTrack">
        <div className="timerFill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

