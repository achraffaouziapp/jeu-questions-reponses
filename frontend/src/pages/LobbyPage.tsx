import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorBanner } from '../components/ErrorBanner'
import { Leaderboard } from '../components/Leaderboard'
import { useGame } from '../state/useGame'

export function LobbyPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { session, isHost, startSession } = useGame()

  useEffect(() => {
    if (!session?.code) return
    if (session.state === 'playing') navigate(`/game/${session.code}`, { replace: true })
    if (session.state === 'finished') navigate(`/end/${session.code}`, { replace: true })
  }, [navigate, session?.code, session?.state])

  if (!session || session.code !== code) {
    return (
      <div className="stack">
        <ErrorBanner />
        <section className="card">
          <h2>Session</h2>
          <p className="muted">Connexion en cours…</p>
          <Link className="btn secondary" to="/">
            Retour
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="stack">
      <ErrorBanner />
      <section className="card">
        <h2>Salon</h2>
        <p className="muted">
          Partage ce code pour rejoindre: <span className="code">{session.code}</span>
        </p>
        <div className="row">
          {isHost && session.state === 'waiting' ? (
            <button className="btn" type="button" onClick={() => startSession(session.code)}>
              Démarrer
            </button>
          ) : (
            <span className="muted">En attente du démarrage…</span>
          )}
          <Link className="btn secondary" to="/">
            Quitter
          </Link>
        </div>
      </section>

      <Leaderboard entries={session.players} title="Joueurs connectés" />
    </div>
  )
}
