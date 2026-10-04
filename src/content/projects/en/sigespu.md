---
title: SIGESPU
summary: Geospatial Public Safety Information System for the Public Safety Department of the Municipality of Lota.
role: Full Stack Developer (professional internship)
period: Mar – May 2026
status: completed
stack: [Flutter, Dart/Shelf, PostgreSQL + PostGIS, Redis, Docker Compose, Railway, Cloudflare Pages, GitHub Actions]
highlights:
  - Interactive map with toggleable layers (danger zones, regulatory plan, cameras, commercial permits), geofences, zone drawing and heatmaps.
  - Offline-first in the field, with SQLite/Drift local storage and background sync with exponential backoff.
  - Nightly scraper of the municipal transparency portal with Nominatim geocoding and a Redis cache, plus USGS seismic data.
  - JWT authentication with roles (visitor / operative / director) and PDF export.
  - Delivered with technical documentation and a cost analysis against ArcGIS, QGIS and Google Maps.
repo: https://github.com/ivan-LSM/sigespu
order: 1
category: work
---
SIGESPU was built during my professional internship at the Public Safety Department of the Municipality of Lota. It centralizes territorial and operational information in an interactive map that also works offline.
