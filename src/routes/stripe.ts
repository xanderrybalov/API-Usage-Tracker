import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import { db } from '../server'

dotenv.config()

declare module 'fastify' {
  interface FastifyInstance {
    stripe: any;  
  }
}

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
    const sig = request.headers['stripe-signature'] as string | undefined;
    const rawBody = request.body as Buffer;

    if (!sig) {
      return reply.code(400).send({ error: 'Missing Stripe signature' });
    }

    let event: Stripe.Event;

    try {
      event = fastify.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return reply.code(400).send({ error: 'Invalid webhook signature' });
    }

    const client = await db.connect();
    try {
      await client.query(
        `INSERT INTO stripe_events (type, payload)
         VALUES ($1, $2)`,
        [event.type, event]
      );
    } catch (err) {
      console.error('Failed to log Stripe event:', err);
    } finally {
      client.release();
    }

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`💰 Payment succeeded for customer ${invoice.customer}`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`❌ Payment failed for customer ${invoice.customer}`);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    reply.send({ received: true });
  });

  fastify.get('/webhook/logs', async (_, reply) => {
    const client = await db.connect();
    try {
      const { rows } = await client.query(
        `SELECT type, created_at FROM stripe_events
         ORDER BY created_at DESC
         LIMIT 30`
      );
      reply.send(rows.map((row) => ({
        type: row.type,
        created: row.created_at,
      })));
    } catch (err) {
      console.error(err);
      reply.code(500).send({ error: 'Failed to load webhook events' });
    } finally {
      client.release();
    }
  });
  
}
