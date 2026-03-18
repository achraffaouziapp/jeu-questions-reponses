import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorBanner } from '../components/ErrorBanner'
import { Leaderboard } from '../components/Leaderboard'
import { TimerBar } from '../components/TimerBar'
import { useGame } from '../state/useGame'

export function GamePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { session, question, reveal, remainingMs, selectedAnswerIndex, submitAnswer, leaderboard, finalLeaderboard } =
    useGame()

  useEffect(() => {
    if (!session?.code) return
    if (session.state === 'finished') navigate(`/end/${session.code}`, { replace: true })
  }, [navigate, session?.code, session?.state])

  useEffect(() => {
    if (!finalLeaderboard || !session?.code) return
    navigate(`/end/${session.code}`, { replace: true })
  }, [finalLeaderboard, navigate, session?.code])

  if (!code) {
    return (
      <section className="card">
        <h2>Partie</h2>
        <p className="muted">Code manquant.</p>
        <Link className="btn secondary" to="/">
          Retour
        </Link>
      </section>
    )
  }

  const canAnswer =
    Boolean(question) && !reveal && selectedAnswerIndex === null && remainingMs > 0 && session?.state === 'playing'

  return (
    <div className="stack">
      <ErrorBanner />

      <section className="card">
        <div className="row space">
          <div>
            <div className="muted">
              Question {question ? question.index + 1 : 0}/{question ? question.total : 0}
            </div>
            <h2>{question?.question ?? 'En attente de la prochaine question…'}</h2>
          </div>
          {question ? <TimerBar remainingMs={remainingMs} totalMs={question.durationMs} /> : null}
        </div>

        {question ? (
          <div className="options">
            {question.options.map((opt, idx) => {
              const answerIndex = idx + 1
              const isSelected = selectedAnswerIndex === answerIndex
              const isCorrect = reveal?.correctAnswer === answerIndex
              const isWrongSelected = Boolean(reveal) && isSelected && !isCorrect

              const className = [
                'option',
                isSelected ? 'selected' : '',
                reveal && isCorrect ? 'correct' : '',
                isWrongSelected ? 'wrong' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={answerIndex}
                  className={className}
                  type="button"
                  disabled={!canAnswer}
                  onClick={() => submitAnswer({ code, answerIndex })}
                >
                  <span className="optIndex">{answerIndex}.</span> {opt}
                </button>
              )
            })}
          </div>
        ) : null}

        {reveal ? (
          <div className="reveal">
            <div>
              Bonne réponse: <span className="pill">#{reveal.correctAnswer}</span>
            </div>
          </div>
        ) : null}
      </section>

      <Leaderboard entries={leaderboard} />
    </div>
  )
}
