import { Link, useParams } from 'react-router-dom'
import { ErrorBanner } from '../components/ErrorBanner'
import { Leaderboard } from '../components/Leaderboard'
import { useGame } from '../state/useGame'

export function EndPage() {
  const { code } = useParams()
  const { finalLeaderboard, leaderboard, reset } = useGame()
  const entries = finalLeaderboard ?? leaderboard

  return (
    <div className="stack">
      <ErrorBanner />
      <section className="card">
        <h2>Fin de partie</h2>
        <p className="muted">
          Session: <span className="code">{code}</span>
        </p>
        <Link className="btn" to="/" onClick={reset}>
          Retour à l’accueil
        </Link>
      </section>

      <Leaderboard entries={entries} title="Classement final" />
    </div>
  )
}
