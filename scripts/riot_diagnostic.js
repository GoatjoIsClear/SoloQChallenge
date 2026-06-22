const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const ENV_PATH = path.resolve(__dirname, '..', '.env.local');
const DATA_PLAYERS = path.resolve(__dirname, '..', 'data', 'players.json');
const LOG_PATH = path.resolve(__dirname, '..', 'riot_diagnostic.log');

function readEnvKey() {
  if (!fs.existsSync(ENV_PATH)) return '';
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const m = content.match(/^RIOT_API_KEY=(.+)$/m);
  return m ? m[1].trim() : '';
}

function maskKey(key) {
  if (!key) return '';
  return key.slice(0, 8) + '...' ;
}

function log(obj) {
  const line = JSON.stringify(obj, null, 2);
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
}

async function doFetch(url, opts = {}) {
  const key = opts.token;
    // default headers for Riot endpoints
    const defaultHeaders = { Accept: 'application/json', 'User-Agent': 'lol-tracker/diagnostic' };
    const headers = Object.assign({}, defaultHeaders, opts.headers || {});
    if (url.includes('riotgames.com')) headers['X-Riot-Token'] = key;
  const reqInfo = {
    url,
    method: opts.method || 'GET',
    requestHeaders: Object.keys(headers).reduce((acc, k) => {
      acc[k] = k === 'X-Riot-Token' ? maskKey(headers[k]) : headers[k];
      return acc;
    }, {}),
    apiKeyPreview: maskKey(key),
  };

  let res;
  try {
    res = await fetch(url, { method: reqInfo.method, headers });
  } catch (err) {
    reqInfo.status = 'NETWORK_ERROR';
    reqInfo.error = String(err);
    log(reqInfo);
    return reqInfo;
  }

  reqInfo.status = res.status;
  const ct = res.headers.get('content-type') || '';
  reqInfo.contentType = ct;

  if (ct.includes('application/json') || ct.includes('text/')) {
    const text = await res.text();
    // truncate large bodies
    reqInfo.responseBody = text.length > 2000 ? text.slice(0, 2000) + '... (truncated)' : text;
  } else {
    // binary or image - don't read body
    reqInfo.responseBody = '[binary or non-text content omitted]';
  }

  log(reqInfo);
  return reqInfo;
}

async function run() {
  const API_KEY = readEnvKey();
  if (!API_KEY) {
    console.error('No RIOT_API_KEY found in .env.local');
    process.exit(1);
  }

  const players = JSON.parse(fs.readFileSync(DATA_PLAYERS, 'utf8'));

  for (const p of players) {
    const { gameName, tagLine, puuid, summonerId, region, profileIconId } = p;
    log({ note: 'PLAYER', gameName, tagLine, puuid, summonerId, region, profileIconId });

    // account-v1
    const routing = region && region.toLowerCase && (region.toLowerCase() === 'euw1' ? 'europe' : 'europe');
    const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    await doFetch(accountUrl, { token: API_KEY });

    // summoner-v4 by puuid
    const platform = (region || 'EUW1').toLowerCase();
    const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const summRes = await doFetch(summonerUrl, { token: API_KEY });

    let encryptedSummonerId = summonerId;
    if (summRes && summRes.status === 200) {
      try {
        const j = JSON.parse(summRes.responseBody);
        encryptedSummonerId = j.id || encryptedSummonerId;
        log({ note: 'summoner-v4-parsed', id: j.id, accountId: j.accountId, puuid: j.puuid, profileIconId: j.profileIconId, name: j.name });
      } catch (e) {}
    }

      // summoner-v4 by encrypted summonerId (validate id)
      if (encryptedSummonerId) {
        const summByIdUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/${encryptedSummonerId}`;
        await doFetch(summByIdUrl, { token: API_KEY });
      }

      // league-v4 - use by-puuid (use puuid from account/summoner lookup)
      const leagueByPuuidUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
      await doFetch(leagueByPuuidUrl, { token: API_KEY });

    // match-v5 ids
    const routing2 = 'europe';
    const matchIdsUrl = `https://${routing2}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=5`;
    const matchIdsRes = await doFetch(matchIdsUrl, { token: API_KEY });

    if (matchIdsRes && matchIdsRes.status === 200) {
      try {
        const ids = JSON.parse(matchIdsRes.responseBody);
        const first = ids && ids[0];
        if (first) {
          const matchUrl = `https://${routing2}.api.riotgames.com/lol/match/v5/matches/${first}`;
          await doFetch(matchUrl, { token: API_KEY });
        }
      } catch (e) {}
    }

    // profile icon check
    const ddragonVersion = '13.24.1';
    const iconId = profileIconId;
    const ddUrl = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${iconId}.png`;
    // Do not send Riot API key to Data Dragon
    const imgRes = await doFetch(ddUrl, { headers: {}, token: '' });
    log({ profileIconId: iconId, dataDragonUrl: ddUrl, imageStatus: imgRes.status, contentType: imgRes.contentType });
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
