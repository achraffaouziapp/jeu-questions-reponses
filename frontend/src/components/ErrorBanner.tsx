import { useGame } from '../state/useGame'

export function ErrorBanner() {
  const { error, clearError } = useGame()
  if (!error) return null

  return (
    <div className="error" role="alert">
      <div>{error}</div>
      <button className="btn secondary" onClick={clearError} type="button">
        Fermer
      </button>
    </div>
  )
}
