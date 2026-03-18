import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import { createSocket, type AppErrorPayload } from '../lib/socket'
import type { GameQuestion, LeaderboardEntry, PublicSession, RevealPayload } from '../lib/types'
import { GameContext, type GameContextValue } from './GameContext'

export function GameProvider({ children }: { children: ReactNode }) {
  const socket = useMemo<Socket>(() => createSocket(), [])

  const [socketId, setSocketId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const [nickname, setNickname] = useState<string | null>(null)
  const [session, setSession] = useState<PublicSession | null>(null)
  const [isHost, setIsHost] = useState(false)

  const [question, setQuestion] = useState<GameQuestion | null>(null)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null)
  const [reveal, setReveal] = useState<RevealPayload | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[] | null>(null)

  const [remainingMs, setRemainingMs] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const ensureConnected = useCallback(() => {
    if (socket.connected) return
    socket.connect()
  }, [socket])

  useEffect(() => {
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    socket.on('app:hello', (payload: { socketId: string }) => {
      setSocketId(payload.socketId)
    })

    socket.on('app:error', (payload: AppErrorPayload) => {
      setError(payload.message)
    })

    socket.on('session:created', (payload: { session: PublicSession }) => {
      setSession(payload.session)
      setLeaderboard(payload.session.players)
      setIsHost(true)
    })

    socket.on('session:joined', (payload: { session: PublicSession }) => {
      setSession(payload.session)
      setLeaderboard(payload.session.players)
      setIsHost(payload.session.hostSocketId === socket.id)
    })

    socket.on('session:update', (payload: PublicSession) => {
      setSession(payload)
      setLeaderboard(payload.players)
      setIsHost(payload.hostSocketId === socket.id)
    })

    socket.on('game:question', (payload: GameQuestion) => {
      setQuestion(payload)
      setReveal(null)
      setSelectedAnswerIndex(null)
      setFinalLeaderboard(null)
      setRemainingMs(payload.durationMs)
    })

    socket.on('game:reveal', (payload: RevealPayload) => {
      setReveal(payload)
      setLeaderboard(payload.leaderboard)
    })

    socket.on('game:leaderboard', (payload: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(payload.leaderboard)
    })

    socket.on('game:finished', (payload: { leaderboard: LeaderboardEntry[] }) => {
      setFinalLeaderboard(payload.leaderboard)
      setLeaderboard(payload.leaderboard)
    })

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('app:hello')
      socket.off('app:error')
      socket.off('session:created')
      socket.off('session:joined')
      socket.off('session:update')
      socket.off('game:question')
      socket.off('game:reveal')
      socket.off('game:leaderboard')
      socket.off('game:finished')
      socket.disconnect()
    }
  }, [socket])

  useEffect(() => {
    if (!question) return
    if (reveal) return

    const id = window.setInterval(() => {
      const elapsed = Date.now() - question.serverStartedAtMs
      const next = Math.max(0, question.durationMs - elapsed)
      setRemainingMs(next)
    }, 100)

    return () => window.clearInterval(id)
  }, [question, reveal])

  const createSession = useCallback(
    (args: { nickname: string; questionCount: number }) => {
      clearError()
      setNickname(args.nickname)
      ensureConnected()
      socket.emit('session:create', args)
    },
    [clearError, ensureConnected, socket],
  )

  const joinSession = useCallback(
    (args: { code: string; nickname: string }) => {
      clearError()
      setNickname(args.nickname)
      ensureConnected()
      socket.emit('session:join', { code: args.code, nickname: args.nickname })
    },
    [clearError, ensureConnected, socket],
  )

  const startSession = useCallback(
    (code: string) => {
      clearError()
      ensureConnected()
      socket.emit('session:start', { code })
    },
    [clearError, ensureConnected, socket],
  )

  const submitAnswer = useCallback(
    (args: { code: string; answerIndex: number }) => {
      if (selectedAnswerIndex !== null) return
      setSelectedAnswerIndex(args.answerIndex)
      socket.emit('game:answer', args)
    },
    [selectedAnswerIndex, socket],
  )

  const reset = useCallback(() => {
    clearError()
    setNickname(null)
    setSession(null)
    setIsHost(false)
    setQuestion(null)
    setReveal(null)
    setSelectedAnswerIndex(null)
    setLeaderboard([])
    setFinalLeaderboard(null)
    setRemainingMs(0)
  }, [clearError])

  const value = useMemo<GameContextValue>(
    () => ({
      socket,
      socketId,
      connected,

      nickname,
      session,
      isHost,

      question,
      selectedAnswerIndex,
      reveal,
      leaderboard,
      finalLeaderboard,

      remainingMs,
      error,

      createSession,
      joinSession,
      startSession,
      submitAnswer,
      clearError,
      reset,
    }),
    [
      socket,
      socketId,
      connected,
      nickname,
      session,
      isHost,
      question,
      selectedAnswerIndex,
      reveal,
      leaderboard,
      finalLeaderboard,
      remainingMs,
      error,
      createSession,
      joinSession,
      startSession,
      submitAnswer,
      clearError,
      reset,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

