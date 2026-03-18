import { getDb } from './db.js'

export async function getRandomQuestions(limit) {
  const db = await getDb()
  const rows = await db.all(
    `
    SELECT id, question, reponse1, reponse2, reponse3, reponse4, bonne_reponse
    FROM questions
    ORDER BY RANDOM()
    LIMIT ?
    `,
    [limit],
  )

  return rows.map((r) => ({
    id: r.id,
    question: r.question,
    options: [r.reponse1, r.reponse2, r.reponse3, r.reponse4],
    correctAnswer: r.bonne_reponse,
  }))
}

