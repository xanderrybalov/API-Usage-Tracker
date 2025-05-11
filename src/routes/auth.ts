import { FastifyInstance } from 'fastify'
import { db } from '../server'
import crypto from 'crypto'

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const { email } = request.body as { email: string }

    const client = await db.connect()
    try {
      await client.query('BEGIN')

      const { rows: userRows } = await client.query(
        `INSERT INTO users (email)
         VALUES ($1)
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`,
        [email]
      )

      const userId = userRows[0].id

      const { rows: projectRows } = await client.query(
        `SELECT api_key FROM projects WHERE user_id = $1 LIMIT 1`,
        [userId]
      )

      let apiKey: string

      if (projectRows.length > 0) {
        apiKey = projectRows[0].api_key
      } else {
        apiKey = crypto.randomBytes(16).toString('hex')

        await client.query(
          `INSERT INTO projects (user_id, name, api_key)
           VALUES ($1, $2, $3)`,
          [userId, 'default', apiKey]
        )
      }

      await client.query('COMMIT')
      reply.send({ apiKey })
    } catch (err) {
      await client.query('ROLLBACK')
      reply.status(500).send({ error: 'Registration failed' })
    } finally {
      client.release()
    }
  })
}
