import test from 'node:test'
import assert from 'node:assert/strict'
import { createSessionManager } from '../src/sessionManager.js'

function createFakeIo() {
  const emitted = []
  return {
    emitted,
    to(room) {
      return {
        emit(event, payload) {
          emitted.push({ room, event, payload })
        },
      }
    },
  }
}

function createFakeSocket(id) {
  const handlers = new Map()
  const emitted = []
  const joinedRooms = []

  return {
    id,
    emitted,
    joinedRooms,
    on(event, handler) {
      handlers.set(event, handler)
    },
    emit(event, payload) {
      emitted.push({ event, payload })
    },
    join(room) {
      joinedRooms.push(room)
    },
    async trigger(event, payload) {
      const handler = handlers.get(event)
      assert.ok(handler, `Missing handler for event "${event}"`)
      return handler(payload)
    },
  }
}

test('session:join avec un code invalide renvoie une erreur de validation', async () => {
  const io = createFakeIo()
  const manager = createSessionManager(io)

  const socket = createFakeSocket('socket-player')
  manager.bindSocket(socket)

  await socket.trigger('session:join', { code: 'abc', nickname: 'Bob' })

  const error = socket.emitted.find((x) => x.event === 'app:error')
  assert.ok(error, 'Expected app:error to be emitted')
  assert.equal(error.payload.code, 'VALIDATION')
  assert.equal(socket.joinedRooms.length, 0)
})
