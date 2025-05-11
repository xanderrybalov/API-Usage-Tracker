import Fastify from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import pg from 'pg'

import authRoutes from './routes/auth'
import usageRoutes from './routes/usage'
import stripeRoutes from './routes/stripe'

import { scheduleDailyUsageReport } from './services/cron'

dotenv.config()

export const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

const fastify = Fastify({ logger: true })

fastify.register(cors)
fastify.register(authRoutes)
fastify.register(usageRoutes)
fastify.register(stripeRoutes)

fastify.listen({ port: parseInt(process.env.PORT || '3000', 10) }, (err, address) => {
  if (err) throw err
  console.log(`🚀 Server is running at ${address}`)
  scheduleDailyUsageReport()
})
