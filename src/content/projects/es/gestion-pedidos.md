---
title: Software de gestión de pedidos
summary: Plataforma de pedidos para un negocio gastronómico. Backend completo, frontend en desarrollo.
role: Desarrollador Full Stack
period: "2026"
status: in-progress
stack: [TypeScript, NestJS, Prisma, PostgreSQL 17, Redis, BullMQ, Zod, WebSockets, Vitest, Docker, GitHub Actions]
highlights:
  - Monorepo con tienda pública, panel de operación de cocina en tiempo real (WebSocket) y back-office de administración.
  - Row-Level Security (FORCE) de PostgreSQL en 24 tablas de negocio y usuario de base de datos con mínimo privilegio.
  - Paquete de dominio puro para dinero (CLP entero), fechas, cupones, máquina de estados de pedidos y fidelización; el cálculo de dinero vive en un solo lugar.
  - Worker en segundo plano para conciliación de pagos, expiración de reservas, despacho y respaldos.
  - Endpoints idempotentes de pedidos y pagos, webhooks firmados, registro de auditoría, unas 480 pruebas (incluyendo concurrencia y aislamiento) y CI en cada push.
order: 2
category: personal
---
Backend completo, frontend en desarrollo. El repositorio es privado.
