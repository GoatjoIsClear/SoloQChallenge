const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const ENV_PATH = path.resolve(__dirname, '..', '.env.local');
const DATA_PLAYERS = path.resolve(__dirname, '..', 'data', 'players.json');
const BACKUP_PATH = path.resolve(__dirname, '..', 'data', 'players.json.bak');

function readEnvKey() {
  if (!fs.existsSync(ENV_PATH)) return '';
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const m = content.match(/^RIOT_API_KEY=(.+)$/m);
  return m ? m[1].trim() : '';
}

async function riotFetch(url, key) {
  const res = await fetch(url, { headers: { 'X-Riot-Token': key, Accept: 'application/json', 'User-Agent': 'lol-tracker/refresh' } });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: res.status, bodyText: text, body: json, headers: res.headers };
}

async function run() {
  const API_KEY = readEnvKey();
  if (!API_KEY) {
    console.error('No RIOT_API_KEY in .env.local');
    process.exit(1);
  }

  if (!fs.existsSync(DATA_PLAYERS)) {
    console.error('players.json not found');
    process.exit(1);
  }

  const players = JSON.parse(fs.readFileSync(DATA_PLAYERS, 'utf8'));
  fs.copyFileSync(DATA_PLAYERS, BACKUP_PATH);
  console.log('Backup written to', BACKUP_PATH);

  for (const p of players) {
    const { gameName, tagLine, region } = p;
    const routing = (region || 'EUW1').toLowerCase() === 'euw1' ? 'europe' : 'europe';
    const platform = (region || 'EUW1').toLowerCase();

    console.log(`Refreshing ${gameName}#${tagLine}...`);

    // 1. account-v1
    const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const acc = await riotFetch(accountUrl, API_KEY);
    if (acc.status !== 200 || !acc.body || !acc.body.puuid) {
      console.warn(`account-v1 failed for ${gameName}#${tagLine}: ${acc.status}`);
      // skip updating puuid but continue
    } else {
      p.puuid = acc.body.puuid;
    }

    // 2. summoner-v4 by puuid
    if (p.puuid) {
      const summByPuuid = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${p.puuid}`;
      const sres = await riotFetch(summByPuuid, API_KEY);
      if (sres.status === 200 && sres.body) {
        p.summonerId = sres.body.id;
        p.profileIconId = sres.body.profileIconId;
        p.summonerLevel = sres.body.summonerLevel;
        p.gameName = sres.body.name || p.gameName;
      } else {
        // if 403 or 401, preserve cached but mark an error field
        p.rankFetchError = p.rankFetchError || {};
        if (sres.status === 401 || sres.status === 403) {
          p.rankFetchError.summoner = { status: sres.status, message: sres.bodyText };
        }
      }
    }

    // 3. league-v4 by puuid
    if (p.puuid) {
      const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${p.puuid}`;
      const lres = await riotFetch(leagueUrl, API_KEY);
      if (lres.status === 200 && Array.isArray(lres.body)) {
        p.rankedEntries = lres.body; // store raw entries
        p.rankFetchError = undefined;
      } else if (lres.status === 401 || lres.status === 403) {
        p.rankFetchError = p.rankFetchError || {};
        p.rankFetchError.league = { status: lres.status, message: lres.bodyText };
      } else {
        // other, store empty
        p.rankedEntries = lres.body || [];
      }
    }

    // ensure fields exist
    p.profileIconId = p.profileIconId || null;
    p.summonerLevel = p.summonerLevel || null;
  }

  fs.writeFileSync(DATA_PLAYERS, JSON.stringify(players, null, 2));
  console.log('players.json updated');
}

run().catch(e => { console.error(e); process.exit(1); });
