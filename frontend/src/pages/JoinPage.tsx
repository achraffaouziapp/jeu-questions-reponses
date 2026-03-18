import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorBanner } from '../components/ErrorBanner'
import { useGame } from '../state/useGame'

export function JoinPage() {
  const navigate = useNavigate()
  const { joinSession, session } = useGame()
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    if (session?.code) navigate(`/lobby/${session.code}`, { replace: true })
  }, [navigate, session?.code])

  return (
    <div className="stack">
      <ErrorBanner />
      <section className="card">
        <h2>Rejoindre une session</h2>
        <div className="grid">
          <label className="field">
            <span>Code (6 caractères)</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </label>
          <label className="field">
            <span>Pseudo</span>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </label>
        </div>
        <div className="row">
          <button className="btn" type="button" onClick={() => joinSession({ code, nickname })}>
            Rejoindre
          </button>
        </div>
      </section>
    </div>
  )
}
