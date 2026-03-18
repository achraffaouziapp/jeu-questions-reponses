import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '../state/useGame'

export function Layout({ children }: { children: ReactNode }) {
  const { session } = useGame()

  return (
    <div className="app">
      <header className="header">
        <Link className="brand" to="/">
          Quiz Temps Réel
        </Link>
        {session ? (
          <div className="meta">
            <span className="pill">Session: {session.code}</span>
            <span className="pill">État: {session.state}</span>
          </div>
        ) : null}
      </header>
      <main className="main">{children}</main>
    </div>
  )
}
