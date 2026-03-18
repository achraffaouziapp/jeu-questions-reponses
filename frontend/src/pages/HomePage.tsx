import { Link } from 'react-router-dom'
import { ErrorBanner } from '../components/ErrorBanner'
import { useGame } from '../state/useGame'

export function HomePage() {
  const { reset } = useGame()

  return (
    <div className="stack">
      <ErrorBanner />
      <section className="card">
        <h1>Jeu de questions-réponses en temps réel</h1>
        <p className="muted">Crée une session, partage le code, puis démarre la partie.</p>
        <div className="row">
          <Link className="btn" to="/create" onClick={reset}>
            Créer une session
          </Link>
          <Link className="btn secondary" to="/join" onClick={reset}>
            Rejoindre une session
          </Link>
        </div>
      </section>
    </div>
  )
}
