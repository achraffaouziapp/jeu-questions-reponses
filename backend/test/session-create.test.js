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

test('session:create crée une session et renvoie les infos publiques', async () => {
  const io = createFakeIo()
  const manager = createSessionManager(io)

  const socket = createFakeSocket('socket-host')
  manager.bindSocket(socket)

  await socket.trigger('session:create', { nickname: 'Alice', questionCount: 999 })

  const created = socket.emitted.find((x) => x.event === 'session:created')
  assert.ok(created, 'Expected session:created to be emitted')

  const session = created.payload.session
  assert.equal(session.state, 'waiting')
  assert.equal(session.hostSocketId, socket.id)
  assert.equal(session.questionCount, 50)
  assert.equal(session.code.length, 6)
  assert.match(session.code, /^[0-9A-Z]{6}$/)
  assert.equal(session.players.length, 1)
  assert.equal(session.players[0].nickname, 'Alice')

  assert.deepEqual(socket.joinedRooms, [session.code])

  const update = io.emitted.find((x) => x.event === 'session:update' && x.room === session.code)
  assert.ok(update, 'Expected session:update to be broadcast to the session room')
})
