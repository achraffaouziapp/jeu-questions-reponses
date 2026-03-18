import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorBanner } from '../components/ErrorBanner'
import { useGame } from '../state/useGame'

export function CreatePage() {
  const navigate = useNavigate()
  const { createSession, session, isHost } = useGame()
  const [nickname, setNickname] = useState('')
  const [questionCount, setQuestionCount] = useState(10)

  useEffect(() => {
    if (session?.code && isHost) navigate(`/lobby/${session.code}`, { replace: true })
  }, [isHost, navigate, session?.code])

  return (
    <div className="stack">
      <ErrorBanner />
      <section className="card">
        <h2>Créer une session</h2>
        <div className="grid">
          <label className="field">
            <span>Pseudo</span>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </label>
          <label className="field">
            <span>Nombre de questions</span>
            <input
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="row">
          <button
            className="btn"
            type="button"
            onClick={() => createSession({ nickname, questionCount })}
          >
            Créer
          </button>
        </div>
      </section>
    </div>
  )
}
