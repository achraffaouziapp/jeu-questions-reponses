import type { LeaderboardEntry } from '../lib/types'

export function Leaderboard({ entries, title }: { entries: LeaderboardEntry[]; title?: string }) {
  return (
    <section className="card">
      <div className="cardTitle">{title ?? 'Classement'}</div>
      {entries.length === 0 ? <div className="muted">Aucune donnée.</div> : null}
      <ol className="leaderboard">
        {entries.map((e) => (
          <li key={e.socketId} className={e.connected ? 'lbItem' : 'lbItem disconnected'}>
            <span className="lbName">{e.nickname}</span>
            <span className="lbScore">{e.score} pts</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

