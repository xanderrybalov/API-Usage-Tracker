import { FastifyInstance } from 'fastify'
import { db } from '../server'

export default async function usageRoutes(fastify: FastifyInstance) {
  fastify.post('/usage', async (request, reply) => {
    const { apiKey, eventType } = request.body as {
      apiKey: string
      eventType: string
    }

    if (!apiKey || !eventType) {
      return reply.code(400).send({ error: 'Missing apiKey or eventType' })
    }

    const client = await db.connect()
    try {
      const projectRes = await client.query(
        'SELECT id FROM projects WHERE api_key = $1',
        [apiKey]
      )

      if (projectRes.rows.length === 0) {
        return reply.code(401).send({ error: 'Invalid API key' })
      }

      const projectId = projectRes.rows[0].id

      await client.query(
        'INSERT INTO usage_events (project_id, event_type) VALUES ($1, $2)',
        [projectId, eventType]
      )

      reply.send({ status: 'logged' })
    } catch (err) {
      console.error(err)
      reply.code(500).send({ error: 'Internal Server Error' })
    } finally {
      client.release()
    }
  })

  fastify.get('/usage', async (request, reply) => {
    const { apiKey } = request.query as { apiKey?: string };
  
    if (!apiKey) {
      return reply.code(400).send({ error: 'Missing apiKey' });
    }
  
    const client = await db.connect();
    try {
      const projectRes = await client.query(
        'SELECT id FROM projects WHERE api_key = $1',
        [apiKey]
      );
  
      if (projectRes.rows.length === 0) {
        return reply.code(401).send({ error: 'Invalid API key' });
      }
  
      const projectId = projectRes.rows[0].id;
  
      const usageRes = await client.query(
        `SELECT event_type AS "eventType", timestamp
         FROM usage_events
         WHERE project_id = $1
         ORDER BY timestamp DESC
         LIMIT 50`,
        [projectId]
      );
  
      reply.send(usageRes.rows);
    } catch (err) {
      console.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    } finally {
      client.release();
    }
  });
  
}
