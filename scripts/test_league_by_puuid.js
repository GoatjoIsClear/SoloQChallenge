#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const fetch = global.fetch || require('node-fetch');

function readEnvKey() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return '';
  const content = fs.readFileSync(envPath, 'utf8');
  const m = content.match(/^RIOT_API_KEY=(.+)$/m);
  return m ? m[1].trim() : '';
}

const API_KEY = readEnvKey();
if (!API_KEY) {
  console.error('No RIOT_API_KEY in .env.local');
  process.exit(1);
}

async function doFetch(url) {
  const headers = { 'X-Riot-Token': API_KEY, Accept: 'application/json', 'User-Agent': 'lol-tracker/test' };
  const res = await fetch(url, { headers });
  const ct = res.headers.get('content-type') || '';
  let body = null;
  try {
    if (ct.includes('application/json') || ct.includes('text/')) body = await res.text();
    else body = `<non-text content: ${ct}>`;
  } catch (e) { body = `<fetch-error: ${String(e)}>`; }
  return { status: res.status, body };
}

async function runTest(gameName, tagLine, region = 'EUW1') {
  const routing = region.toLowerCase() === 'euw1' ? 'europe' : region.toLowerCase();
  const platform = region.toLowerCase();

  console.log('Account lookup URL:');
  const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  console.log(accountUrl);
  const acc = await doFetch(accountUrl);
  console.log('account status:', acc.status);
  if (acc.status !== 200) { console.log('account body:', acc.body); return; }
  const accJson = JSON.parse(acc.body);
  const puuid = accJson.puuid;
  console.log('puuid from account-v1:', puuid);

  // summoner-v4 by puuid
  const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  console.log('\nSummoner-v4 (by-puuid) URL:');
  console.log(summonerUrl);
  const summ = await doFetch(summonerUrl);
  console.log('summoner-v4 status:', summ.status);
  console.log('summoner-v4 body:', summ.body.slice(0, 1000));

  let encryptedSummonerId = undefined;
  if (summ.status === 200) {
    try { encryptedSummonerId = JSON.parse(summ.body).id; } catch(e){}
  }
  console.log('encryptedSummonerId (from summoner-v4):', encryptedSummonerId);

  // league by-summoner (exact old call)
  if (encryptedSummonerId) {
    const leagueBySummUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`;
    console.log('\nLeague (by-summoner) URL:');
    console.log(leagueBySummUrl);
    const l1 = await doFetch(leagueBySummUrl);
    console.log('by-summoner status:', l1.status);
    console.log('by-summoner body snippet:', (l1.body || '').slice(0, 1000));

    // curl equivalent
    console.log('\nRunning curl for by-summoner (exact):');
    try {
      const curlCmd = `curl -s -D - -H "X-Riot-Token: ${API_KEY}" "${leagueBySummUrl}"`;
      const out = child.execSync(curlCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      console.log(out.split('\n').slice(0,20).join('\n'));
    } catch (e) {
      console.log('curl error:', e.message);
    }
  } else {
    console.log('No encryptedSummonerId to test by-summoner');
  }

  // league by-puuid
  const leagueByPuuidUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
  console.log('\nLeague (by-puuid) URL:');
  console.log(leagueByPuuidUrl);
  const l2 = await doFetch(leagueByPuuidUrl);
  console.log('by-puuid status:', l2.status);
  console.log('by-puuid body snippet:', (l2.body || '').slice(0, 1000));

  console.log('\nSummary:');
  console.log('- exact puuid used:', puuid);
  console.log('- encryptedSummonerId:', encryptedSummonerId);
  console.log('- region/platform:', platform);
  console.log('- by-summoner status:', encryptedSummonerId ? (await Promise.resolve()).then(()=>{}) : 'skipped');
}

if (require.main === module) {
  const [,, gameName, tagLine, region] = process.argv;
  if (!gameName || !tagLine) {
    console.error('Usage: node test_league_by_puuid.js <gameName> <tagLine> [region]');
    process.exit(2);
  }
  runTest(gameName, tagLine, region || 'EUW1').catch(e => { console.error(e); process.exit(1); });
}
