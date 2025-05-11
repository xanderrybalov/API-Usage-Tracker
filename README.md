# 🧠 Usage Tracker — Backend

A backend service for tracking API usage and billing users via Stripe Metered Billing.  
Built with Fastify + TypeScript + PostgreSQL.

---

## ⚙️ Features

- 🔐 User registration via `/register`
- 🔑 API key-based project identification
- 📈 Log usage events via `/usage` (per `apiKey`)
- 💸 Stripe integration with metered billing and webhooks
- 🕒 Daily usage aggregation and reporting to Stripe
- ⚡ High-performance Fastify server with PostgreSQL connection
- 📦 Schema migrations via `node-pg-migrate`

---
