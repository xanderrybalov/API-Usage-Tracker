import cron from 'node-cron'
import { db } from '../server'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export function scheduleDailyUsageReport() {
  cron.schedule('0 0 * * *', async () => {
    console.log('🕒 Starting daily usage aggregation...')

    const client = await db.connect()
    try {
      const projectsRes = await client.query('SELECT id, user_id FROM projects')

      for (const project of projectsRes.rows) {
        const { id: projectId, user_id: userId } = project

        const usageRes = await client.query(
          `SELECT COUNT(*)::int AS count
           FROM usage_events
           WHERE project_id = $1 AND timestamp >= NOW() - INTERVAL '1 day'`,
          [projectId]
        )

        const usageCount = usageRes.rows[0].count
        if (usageCount === 0) continue

        const userRes = await client.query(
          'SELECT stripe_customer_id FROM users WHERE id = $1',
          [userId]
        )

        const customerId = userRes.rows[0]?.stripe_customer_id
        if (!customerId) continue

        const subscriptionItemId = process.env.STRIPE_SUB_ITEM_ID!
        console.log(`🔄 Reporting ${usageCount} units for customer ${customerId}`)

        await (stripe.subscriptionItems as any).createUsageRecord(subscriptionItemId, {
          quantity: usageCount,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        })
      }

      console.log('✅ Usage reporting complete.')
    } catch (err) {
      console.error('🔥 Usage aggregation failed:', err)
    } finally {
      client.release()
    }
  })
}
