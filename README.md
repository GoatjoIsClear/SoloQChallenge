# LoL Tracker — Private Friends Leaderboard

## Setup

```bash
# 1. Copy env file
cp .env.local.example .env.local
# Fill in your Riot API key (https://developer.riotgames.com)

# 2. Install & run
npm install
npm run dev
```

App runs at http://localhost:3000

## Pages
- `/` — Leaderboard (ranked stats, sorted by rank)
- `/live` — Live games (auto-refresh 45s)
- `/history` — Match history per player
- `/stats` — Stats per player
- `/admin` — Add/remove players

## Riot API Key
Get a key from https://developer.riotgames.com
Development keys expire every 24h. For long-term use, request a production key.

## Data
SQLite database is created automatically at `./data/players.db`
