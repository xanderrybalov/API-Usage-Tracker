import run from 'node-pg-migrate'
import dotenv from 'dotenv'

dotenv.config()

run({
  databaseUrl: process.env.DATABASE_URL!,
  dir: 'migrations',
  direction: 'up',
  migrationsTable: 'pgmigrations',
  log: (msg) => console.log(msg),
  verbose: true,
  count: Infinity,
  singleTransaction: true,
  ignorePattern: '.*\\.map$',
})
