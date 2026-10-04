---
title: Order management platform
summary: Order platform for a gastronomy business. Backend complete, frontend in development.
role: Full Stack Developer
period: "2026"
status: in-progress
stack: [TypeScript, NestJS, Prisma, PostgreSQL 17, Redis, BullMQ, Zod, WebSockets, Vitest, Docker, GitHub Actions]
highlights:
  - Monorepo with a public store, a real-time kitchen operations panel (WebSocket) and an admin back-office.
  - PostgreSQL Row-Level Security (FORCE) on 24 business tables and a least-privilege database user.
  - Pure domain package for money (integer CLP), dates, coupons, the order state machine and loyalty; money calculation lives in one place.
  - Background worker for payment reconciliation, reservation expiry, dispatch and backups.
  - Idempotent order and payment endpoints, signed webhooks, audit log, about 480 tests (including concurrency and isolation) and CI on every push.
order: 2
category: personal
---
Backend complete, frontend in development. The repository is private.
