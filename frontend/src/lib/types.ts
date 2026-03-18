export type SessionState = 'waiting' | 'playing' | 'finished'

export type LeaderboardEntry = {
  socketId: string
  nickname: string
  score: number
  connected: boolean
}

export type PublicSession = {
  code: string
  state: SessionState
  questionCount: number
  hostSocketId: string
  players: LeaderboardEntry[]
  currentQuestionIndex: number
  totalQuestions: number
}

export type GameQuestion = {
  index: number
  total: number
  question: string
  options: string[]
  durationMs: number
  serverStartedAtMs: number
}

export type RevealPayload = {
  correctAnswer: number
  answers: Array<{
    socketId: string
    nickname: string
    answerIndex: number | null
    isCorrect: boolean
    points: number
  }>
  leaderboard: LeaderboardEntry[]
}

