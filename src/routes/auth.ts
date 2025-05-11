import { FastifyInstance } from 'fastify'
import { db } from '../server'

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const { email } = request.body as { email: string }
    const client = await db.connect()
    try {
      const { rows } = await client.query(
        'INSERT INTO users (email) VALUES ($1) RETURNING *',
        [email]
      )
      reply.send(rows[0])
    } finally {
      client.release()
    }
  })
}
