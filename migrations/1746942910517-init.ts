import { MigrationBuilder } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension('pgcrypto', { ifNotExists: true })

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid'),
    },
    email: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    stripe_customer_id: 'text',
    created_at: {
      type: 'timestamp',
      default: pgm.func('now'),
    },
  })

  pgm.createTable('projects', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid'),
    },
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      notNull: true,
    },
    name: {
      type: 'text',
      notNull: true,
    },
    api_key: {
      type: 'text',
      unique: true,
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now'),
    },
  })

  pgm.createTable('usage_events', {
    id: 'serial',
    project_id: {
      type: 'uuid',
      references: 'projects(id)',
      notNull: true,
    },
    event_type: {
      type: 'text',
      notNull: true,
    },
    timestamp: {
      type: 'timestamp',
      default: pgm.func('now'),
    },
  })

  pgm.createTable('stripe_events', {
    id: 'serial',
    type: { type: 'text', notNull: true },
    payload: { type: 'jsonb', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('now') },
  });
  
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('usage_events')
  pgm.dropTable('projects')
  pgm.dropTable('users')
  pgm.dropTable('stripe_events')
  pgm.dropExtension('pgcrypto')
}
