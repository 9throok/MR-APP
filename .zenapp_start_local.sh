#!/bin/bash
# Local backend launcher — runs from repo root so dotenv finds .env.
# Overrides DATABASE_URL + PORT to match the dev DB on the mrf-postgres container.
cd /Users/apple/Documents/personal/zenapp-backend
export DATABASE_URL='postgresql://postgres:password@localhost:5434/zenapp_local'
export PORT=3002
exec node backend/server.js
