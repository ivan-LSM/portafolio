---
title: SIGESPU
summary: Sistema de Información Geoespacial de Seguridad Pública para la Dirección de Seguridad Pública de la Municipalidad de Lota.
role: Desarrollador Full Stack (práctica profesional)
period: Mar – May 2026
status: completed
stack: [Flutter, Dart/Shelf, PostgreSQL + PostGIS, Redis, Docker Compose, Railway, Cloudflare Pages, GitHub Actions]
highlights:
  - Mapa interactivo con capas activables (zonas de peligro, plan regulador, cámaras, permisos comerciales), geocercas, dibujo de zonas y mapas de calor.
  - Offline-first en terreno, con almacenamiento local SQLite/Drift y sincronización en segundo plano con backoff exponencial.
  - Scraper nocturno del portal de transparencia municipal con geocodificación Nominatim y caché en Redis, más datos sísmicos de USGS.
  - Autenticación JWT con roles (visitante / operativo / director) y exportación a PDF.
  - Entrega con documentación técnica y análisis de costos frente a ArcGIS, QGIS y Google Maps.
repo: https://github.com/ivan-LSM/sigespu
order: 1
category: work
---
SIGESPU fue desarrollado durante mi práctica profesional en la Dirección de Seguridad Pública de la Municipalidad de Lota. Centraliza información territorial y operativa en un mapa interactivo que funciona también sin conexión.
