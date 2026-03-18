import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server as SocketIOServer } from 'socket.io'
import { initDb } from './db.js'
import { createSessionManager } from './sessionManager.js'

const PORT = Number(process.env.PORT ?? 3001)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'

async function main() {
  await initDb()

  const app = express()
  app.use(
    cors({
      origin: FRONTEND_ORIGIN,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  const server = http.createServer(app)
  const io = new SocketIOServer(server, {
    cors: {
      origin: FRONTEND_ORIGIN,
      credentials: true,
    },
  })

  const sessionManager = createSessionManager(io)

  io.on('connection', (socket) => {
    socket.emit('app:hello', { socketId: socket.id })
    sessionManager.bindSocket(socket)
  })

  server.listen(PORT, () => {
    console.log(`[backend] listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
