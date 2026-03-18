import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'data', 'app.db')

let dbPromise

export async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    })
  }
  return dbPromise
}

export async function initDb() {
  const db = await getDb()

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      reponse1 TEXT NOT NULL,
      reponse2 TEXT NOT NULL,
      reponse3 TEXT NOT NULL,
      reponse4 TEXT NOT NULL,
      bonne_reponse INTEGER NOT NULL CHECK (bonne_reponse BETWEEN 1 AND 4)
    );
  `)

  const row = await db.get('SELECT COUNT(*) as count FROM questions')
  if (row?.count > 0) return

  await db.run(
    `
    INSERT INTO questions (question, reponse1, reponse2, reponse3, reponse4, bonne_reponse)
    VALUES
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)
    `,
    [
      "Quel protocole est utilisé par HTTP/2 pour multiplexer les requêtes ?",
      'TCP',
      'QUIC',
      'SPDY',
      'UDP',
      1,
      "Dans JavaScript, que retourne typeof null ?",
      '"null"',
      '"object"',
      '"undefined"',
      '"number"',
      2,
      "Quelle méthode Array crée un nouveau tableau avec les éléments qui passent un test ?",
      'map',
      'filter',
      'reduce',
      'forEach',
      2,
      "En SQL, quelle clause permet de filtrer après agrégation ?",
      'WHERE',
      'HAVING',
      'GROUP BY',
      'ORDER BY',
      2,
      "Dans Node.js, quel module permet de créer un serveur HTTP ?",
      'fs',
      'http',
      'net',
      'tls',
      2,
      "Quelle propriété CSS contrôle l’empilement des éléments ?",
      'position',
      'z-index',
      'display',
      'overflow',
      2,
      "En React, quel hook gère l’état local d’un composant fonctionnel ?",
      'useMemo',
      'useState',
      'useRef',
      'useCallback',
      2,
      "Quel est le code HTTP pour « Not Found » ?",
      '200',
      '301',
      '404',
      '500',
      3,
      "Quel outil bundler est recommandé dans ce projet frontend ?",
      'Webpack',
      'Parcel',
      'Vite',
      'Rollup',
      3,
      "En Socket.IO, comment appelle-t-on un groupe de sockets identifié par un nom ?",
      'channel',
      'topic',
      'room',
      'pipe',
      3,
    ],
  )
}

