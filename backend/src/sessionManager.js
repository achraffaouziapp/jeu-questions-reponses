import { generateSessionCode } from './code.js'
import { getRandomQuestions } from './questionsRepository.js'

const QUESTION_DURATION_MS = 10_000
const SCORE_FAST_MS = 5_000

function nowMs() {
  return Date.now()
}

function clampQuestionCount(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 10
  return Math.max(1, Math.min(50, Math.floor(n)))
}

function safeNickname(value) {
  const nickname = String(value ?? '').trim()
  if (!nickname) return null
  if (nickname.length > 24) return nickname.slice(0, 24)
  return nickname
}

function computePoints({ isCorrect, elapsedMs }) {
  if (!isCorrect) return 0
  // Barème: 10 pts <= 5s, 5 pts <= 10s, 2 pts au-delà si la question n'est pas encore clôturée.
  if (elapsedMs <= SCORE_FAST_MS) return 10
  if (elapsedMs <= QUESTION_DURATION_MS) return 5
  return 2
}

function toLeaderboard(players) {
  return [...players.values()]
    .map((p) => ({
      socketId: p.socketId,
      nickname: p.nickname,
      score: p.score,
      connected: p.connected,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.nickname.localeCompare(b.nickname, 'fr')
    })
}

function toPublicSession(session) {
  return {
    code: session.code,
    state: session.state,
    questionCount: session.questionCount,
    hostSocketId: session.hostSocketId,
    players: toLeaderboard(session.players),
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: session.questions?.length ?? 0,
  }
}

function createSession({ hostSocketId, questionCount }) {
  return {
    code: generateSessionCode(),
    hostSocketId,
    questionCount,
    state: 'waiting',
    players: new Map(),
    questions: [],
    currentQuestionIndex: -1,
    questionStartedAtMs: 0,
    questionOpen: false,
    answersBySocketId: new Map(),
    timers: {
      questionTimeout: null,
      nextQuestionTimeout: null,
    },
    mutex: Promise.resolve(),
  }
}

async function withSessionLock(session, fn) {
  // Séquence les mutations d'une session (évite les interleavings entre timer/answers/disconnect).
  const run = async () => fn()
  session.mutex = session.mutex.then(run, run)
  return session.mutex
}

export function createSessionManager(io) {
  const sessions = new Map()

  function emitError(socket, message, code = 'BAD_REQUEST') {
    socket.emit('app:error', { code, message })
  }

  function broadcastSession(session) {
    io.to(session.code).emit('session:update', toPublicSession(session))
  }

  function clearTimers(session) {
    if (session.timers.questionTimeout) clearTimeout(session.timers.questionTimeout)
    if (session.timers.nextQuestionTimeout) clearTimeout(session.timers.nextQuestionTimeout)
    session.timers.questionTimeout = null
    session.timers.nextQuestionTimeout = null
  }

  function destroySession(code) {
    const session = sessions.get(code)
    if (!session) return
    clearTimers(session)
    sessions.delete(code)
  }

  function getSession(code) {
    return sessions.get(String(code ?? '').trim().toUpperCase())
  }

  function joinRoom(socket, session) {
    socket.join(session.code)
  }

  function upsertPlayer(session, socketId, nickname) {
    const existing = session.players.get(socketId)
    if (existing) {
      existing.nickname = nickname
      existing.connected = true
      return existing
    }

    const player = { socketId, nickname, score: 0, connected: true }
    session.players.set(socketId, player)
    return player
  }

  function reassignHostIfNeeded(session) {
    const host = session.players.get(session.hostSocketId)
    if (host?.connected) return

    const candidate = [...session.players.values()].find((p) => p.connected)
    session.hostSocketId = candidate?.socketId ?? session.hostSocketId
  }

  async function startGame(session) {
    // Snapshot des questions pour toute la session (ordre figé pour tous les joueurs).
    session.questions = await getRandomQuestions(session.questionCount)
    session.currentQuestionIndex = -1
    session.state = 'playing'
    broadcastSession(session)
    scheduleNextQuestion(session, 0)
  }

  function scheduleNextQuestion(session, delayMs) {
    clearTimeout(session.timers.nextQuestionTimeout)
    session.timers.nextQuestionTimeout = setTimeout(() => {
      withSessionLock(session, async () => {
        if (session.state !== 'playing') return
        const nextIndex = session.currentQuestionIndex + 1
        if (nextIndex >= session.questions.length) {
          finishGame(session)
          return
        }
        beginQuestion(session, nextIndex)
      })
    }, delayMs)
  }

  function beginQuestion(session, index) {
    clearTimeout(session.timers.questionTimeout)

    session.currentQuestionIndex = index
    session.questionStartedAtMs = nowMs()
    session.questionOpen = true
    session.answersBySocketId.clear()

    const q = session.questions[index]
    io.to(session.code).emit('game:question', {
      index,
      total: session.questions.length,
      question: q.question,
      options: q.options,
      durationMs: QUESTION_DURATION_MS,
      serverStartedAtMs: session.questionStartedAtMs,
    })

    session.timers.questionTimeout = setTimeout(() => {
      withSessionLock(session, async () => endQuestion(session))
    }, QUESTION_DURATION_MS)
  }

  function endQuestion(session) {
    // Fin si tout le monde a répondu OU si le timer arrive à échéance.
    if (!session.questionOpen) return
    session.questionOpen = false
    clearTimeout(session.timers.questionTimeout)
    session.timers.questionTimeout = null

    const q = session.questions[session.currentQuestionIndex]
    const leaderboard = toLeaderboard(session.players)

    const answers = leaderboard.map((p) => {
      const a = session.answersBySocketId.get(p.socketId)
      return {
        socketId: p.socketId,
        nickname: p.nickname,
        answerIndex: a?.answerIndex ?? null,
        isCorrect: a?.isCorrect ?? false,
        points: a?.points ?? 0,
      }
    })

    io.to(session.code).emit('game:reveal', {
      correctAnswer: q.correctAnswer,
      answers,
      leaderboard,
    })

    scheduleNextQuestion(session, 2000)
  }

  function finishGame(session) {
    session.state = 'finished'
    clearTimers(session)
    io.to(session.code).emit('game:finished', {
      leaderboard: toLeaderboard(session.players),
    })
    broadcastSession(session)
  }

  function allConnectedPlayersAnswered(session) {
    for (const p of session.players.values()) {
      if (!p.connected) continue
      if (!session.answersBySocketId.has(p.socketId)) return false
    }
    return true
  }

  function bindSocket(socket) {
    socket.on('session:create', async (payload) => {
      const nickname = safeNickname(payload?.nickname)
      if (!nickname) {
        emitError(socket, 'Pseudo obligatoire.', 'VALIDATION')
        return
      }

      const questionCount = clampQuestionCount(payload?.questionCount)

      let session = createSession({ hostSocketId: socket.id, questionCount })
      while (sessions.has(session.code)) {
        session = createSession({ hostSocketId: socket.id, questionCount })
      }

      sessions.set(session.code, session)
      upsertPlayer(session, socket.id, nickname)
      joinRoom(socket, session)

      socket.emit('session:created', { session: toPublicSession(session) })
      broadcastSession(session)
    })

    socket.on('session:join', async (payload) => {
      const code = String(payload?.code ?? '').trim().toUpperCase()
      const nickname = safeNickname(payload?.nickname)

      if (!code || code.length !== 6) {
        emitError(socket, 'Code de session invalide.', 'VALIDATION')
        return
      }
      if (!nickname) {
        emitError(socket, 'Pseudo obligatoire.', 'VALIDATION')
        return
      }

      const session = getSession(code)
      if (!session) {
        emitError(socket, 'Session introuvable.', 'NOT_FOUND')
        return
      }

      await withSessionLock(session, async () => {
        if (session.state !== 'waiting') {
          emitError(socket, "La partie a déjà commencé.", 'CONFLICT')
          return
        }

        joinRoom(socket, session)
        upsertPlayer(session, socket.id, nickname)
        socket.emit('session:joined', { session: toPublicSession(session) })
        broadcastSession(session)
      })
    })

    socket.on('session:start', async (payload) => {
      const code = String(payload?.code ?? '').trim().toUpperCase()
      const session = getSession(code)
      if (!session) {
        emitError(socket, 'Session introuvable.', 'NOT_FOUND')
        return
      }

      await withSessionLock(session, async () => {
        if (session.hostSocketId !== socket.id) {
          emitError(socket, "Seul l'hôte peut démarrer.", 'FORBIDDEN')
          return
        }
        if (session.state !== 'waiting') return

        if ([...session.players.values()].filter((p) => p.connected).length < 1) {
          emitError(socket, 'Aucun joueur connecté.', 'CONFLICT')
          return
        }

        try {
          await startGame(session)
        } catch (e) {
          emitError(socket, "Impossible de charger les questions.", 'SERVER_ERROR')
          session.state = 'waiting'
          broadcastSession(session)
        }
      })
    })

    socket.on('game:answer', async (payload) => {
      const code = String(payload?.code ?? '').trim().toUpperCase()
      const answerIndex = Number(payload?.answerIndex)
      const session = getSession(code)
      if (!session) return

      await withSessionLock(session, async () => {
        if (session.state !== 'playing') return
        if (!session.questionOpen) return
        if (!session.players.has(socket.id)) return
        if (session.answersBySocketId.has(socket.id)) return

        if (![1, 2, 3, 4].includes(answerIndex)) return

        const q = session.questions[session.currentQuestionIndex]
        const elapsedMs = nowMs() - session.questionStartedAtMs
        const isCorrect = answerIndex === q.correctAnswer
        const points = computePoints({ isCorrect, elapsedMs })

        const player = session.players.get(socket.id)
        player.score += points
        session.answersBySocketId.set(socket.id, { answerIndex, isCorrect, points, elapsedMs })

        socket.emit('game:answer:ack', {
          isCorrect,
          points,
        })

        io.to(session.code).emit('game:leaderboard', {
          leaderboard: toLeaderboard(session.players),
        })

        if (allConnectedPlayersAnswered(session)) endQuestion(session)
      })
    })

    socket.on('session:state', async (payload) => {
      const code = String(payload?.code ?? '').trim().toUpperCase()
      const session = getSession(code)
      if (!session) return
      socket.emit('session:update', toPublicSession(session))
    })

    socket.on('disconnect', async () => {
      for (const session of sessions.values()) {
        if (!session.players.has(socket.id)) continue

        await withSessionLock(session, async () => {
          const p = session.players.get(socket.id)
          if (p) p.connected = false

          reassignHostIfNeeded(session)

          if (session.state === 'playing' && session.questionOpen) {
            if (allConnectedPlayersAnswered(session)) endQuestion(session)
          }

          if ([...session.players.values()].every((x) => !x.connected)) {
            destroySession(session.code)
            return
          }

          broadcastSession(session)
        })
      }
    })
  }

  return {
    bindSocket,
  }
}
