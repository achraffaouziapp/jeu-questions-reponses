import { io, type Socket } from 'socket.io-client'

export type AppErrorPayload = { code: string; message: string }

export function createSocket(): Socket {
  const url = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'
  return io(url, {
    autoConnect: false,
    transports: ['websocket'],
  })
}

