import { createContext } from 'react'
import type { Socket } from 'socket.io-client'
import type { GameQuestion, LeaderboardEntry, PublicSession, RevealPayload } from '../lib/types'

export type GameContextValue = {
  socket: Socket
  socketId: string | null
  connected: boolean

  nickname: string | null
  session: PublicSession | null
  isHost: boolean

  question: GameQuestion | null
  selectedAnswerIndex: number | null
  reveal: RevealPayload | null
  leaderboard: LeaderboardEntry[]
  finalLeaderboard: LeaderboardEntry[] | null

  remainingMs: number
  error: string | null

  createSession: (args: { nickname: string; questionCount: number }) => void
  joinSession: (args: { code: string; nickname: string }) => void
  startSession: (code: string) => void
  submitAnswer: (args: { code: string; answerIndex: number }) => void
  clearError: () => void
  reset: () => void
}

export const GameContext = createContext<GameContextValue | null>(null)
