// One-off migration of existing local JSON data into Supabase.
//
// Usage (from the project root, after creating the tables with supabase/schema.sql
// and setting the two env vars in .env.local):
//
//   npm run migrate
//
// Safe to run more than once: existing players (same Riot ID + region) are skipped.

import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// --- load .env.local (no dependency on Next's runtime) ---------------------
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them in .env.local).');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

function readJson(path, fallback) {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
  } catch {
    return fallback;
  }
}

async function migratePlayers() {
  const players = readJson('data/players.json', []);
  console.log(`Players to migrate: ${players.length}`);
  let inserted = 0;
  let skipped = 0;

  for (const p of players) {
    const row = {
      game_name: p.gameName,
      tag_line: p.tagLine,
      region: p.region,
      puuid: p.puuid ?? null,
      summoner_id: p.summonerId ?? null,
      account_id: p.accountId ?? null,
      profile_icon_id: p.profileIconId ?? null,
      summoner_level: p.summonerLevel ?? null,
      created_at: p.createdAt ?? new Date().toISOString(),
      updated_at: p.updatedAt ?? new Date().toISOString(),
    };
    const { error } = await supabase.from('players').insert(row);
    if (error) {
      if (error.code === '23505') {
        skipped++;
        console.log(`  • skip (already exists): ${p.gameName}#${p.tagLine}`);
      } else {
        console.error(`  ! ${p.gameName}#${p.tagLine}: ${error.message}`);
      }
    } else {
      inserted++;
      console.log(`  ✓ ${p.gameName}#${p.tagLine}`);
    }
  }
  console.log(`Players → inserted ${inserted}, skipped ${skipped}`);
}

async function migrateLpSnapshots() {
  const snaps = readJson('data/lp_snapshots.json', {});
  const entries = Object.values(snaps);
  if (!entries.length) return;
  console.log(`LP snapshots to migrate: ${entries.length}`);

  for (const s of entries) {
    if (!s?.puuid) continue;
    const { error } = await supabase.from('lp_snapshots').upsert(
      {
        puuid: s.puuid,
        previous_total_lp: s.previousTotalLp ?? null,
        current_total_lp: s.currentTotalLp ?? 0,
        delta_lp: s.deltaLp ?? null,
        updated_at: s.updatedAt ?? new Date().toISOString(),
      },
      { onConflict: 'puuid' },
    );
    if (error) console.error(`  ! ${s.puuid}: ${error.message}`);
  }
  console.log('LP snapshots → done');
}

async function main() {
  await migratePlayers();
  await migrateLpSnapshots();
  console.log('\nMigration complete. (Match/ranked caches rebuild themselves from the Riot API.)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
