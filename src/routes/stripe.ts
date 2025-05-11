import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export default async function stripeRoutes(fastify: FastifyInstance) {
  fastify.addContentTypeParser('*', (request, payload, done) => {
    let data = ''
    payload.on('data', chunk => (data += chunk))
    payload.on('end', () => done(null, Buffer.from(data)))
  })

  fastify.post('/webhook', async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string | undefined
    const rawBody = request.body as Buffer

    if (!sig) {
      return reply.code(400).send({ error: 'Missing Stripe signature' })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return reply.code(400).send({ error: 'Invalid webhook signature' })
    }

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`💰 Payment succeeded for customer ${invoice.customer}`)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.warn(`❌ Payment failed for customer ${invoice.customer}`)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    reply.send({ received: true })
  })
}
