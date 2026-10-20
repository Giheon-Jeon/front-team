async (page) => {
  const origin = new URL(page.url()).origin;
  const output = new URL(page.url()).searchParams.get('qaOutput') || 'output/playwright';
  const prefix = new URL(origin).port === '4173' ? 'performance-baseline' : 'performance-current';
  const now = '2026-10-20T03:00:00.000Z';
  const iso = delta => new Date(Date.parse(now) + delta).toISOString();
  const clubs = ['MJSEC', 'SWING', 'Y-CERT', 'seKUrity', 'CodeCure', 'Aegis'];
  const challenges = clubs.map((name, i) => ({ koth_challenge_id: `koth-${i + 1}`, title: `QA ${name}`, status: 'ACTIVE', open_group: i + 1, challenge_url: 'https://example.com/', current_score: 50, current_owner_team_name: 'QA Alpha', opened_at: iso(-300000), closed_at: null }));
  const signatures = clubs.map((club_name, i) => ({ signature_id: `signature-${i + 1}`, club_id: `club-${i + 1}`, club_name, title: `QA ${club_name}`, description: '한글과 영문이 함께 표시되는 문제 안내입니다. QA description.', score: 100, is_solved: false, solved_at: null, solved_team_count: 0 }));
  const teams = Array.from({ length: 8 }, (_, i) => ({ team_id: `team-${i + 1}`, team_name: `QA ${['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'][i]}`, team_score: 800 - i * 100, is_top3: i < 3, solves: [{ challenge_id: 'challenge-1', solved_at: iso(-300000), points: 800 - i * 100, source_type: 'JEOPARDY' }] }));
  const cells = Array.from({ length: 36 }, (_, index) => ({ cell_index: index + 1, type: ({1:'START',7:'CHANCE',16:'ROULETTE',21:'AIRPORT',25:'ROULETTE',30:'CHANCE'})[index+1] || 'CHALLENGE', difficulty: 'EASY', name: `QA ${index+1}`, line_number: Math.floor(index / 6) + 1 }));
  const progress = challenges.map((challenge, i) => ({ koth_challenge_id: challenge.koth_challenge_id, earned_score: 50, rank: i + 1, solved_at: iso(-60000) }));
  const unknown = [];
  const apiRequests = [];
  await page.unroute('**/api/v1/**');
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1', '');
    apiRequests.push(path);
    let data;
    if (path === '/auth/me' && new URL(page.url()).pathname === '/login') {
      await route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({code:'TOKEN_INVALID',message:'anonymous local QA',data:null})});
      return;
    }
    if (path === '/auth/me') data = { user_id: 'qa-user', nickname: 'QA 운영자', role: 'ADMIN', is_leader: true, team_id: 'team-1', team_name: 'QA Alpha' };
    else if (path === '/board') data = { total_cell_count: 36, cells };
    else if (path === '/board/me') data = { position: 1, type: 'START', dice_rolls_left: 3, next_dice_reset_at: iso(600000), cell_states: [], chance_cards: [], consumed_cell_indexes: [], active_challenge: null };
    else if (path === '/board/dice/status') data = { can_roll: true, dice_rolls_left: 3, timer_running: true, blocked_reason: null, server_time: now, next_dice_reset_at: iso(600000) };
    else if (path === '/board/chance/catalog') data = { cards: [] };
    else if (path === '/board/cell/current') data = { cell_index: 1, type: 'START', challenge_candidates: [] };
    else if (path === '/board/opened_challenges') data = { opened_challenges: [], total_count: 0 };
    else if (path === '/timer') data = { name: 'QA MSG CTF', status: 'RUNNING', start_time: iso(-3600000), end_time: iso(3600000), server_time: now, remaining_seconds: 3600 };
    else if (path === '/leaderboard') data = { teams };
    else if (path === '/ranking') data = { rankings: teams.slice(0, 6).map((team,i) => ({...team, rank:i+1, mileage:1000, last_solved_at:iso(-300000)})), total_count: 8 };
    else if (path === '/ranking/me' || path === '/ranking/member') data = { rank:1, nickname:'QA 운영자', user_score:800, solved_count:1 };
    else if (path === '/koth/clubs') data = { clubs: clubs.map((name,i)=>({club_id:`club-${i+1}`, name, challenges:[challenges[i]]})), total_count:6, challenge_count:6, active_count:6 };
    else if (path === '/koth/me') data = { team_name:'QA Alpha', total_koth_score:300, challenges:progress };
    else if (path === '/koth/leaderboard') data = { koth_challenge_id:url.searchParams.get('koth_challenge_id'), leaderboard:[{rank:1,team_id:'team-1',team_name:'QA Alpha',earned_score:50}] };
    else if (path.startsWith('/koth/clubs/')) { const index = Number(path.split('-').at(-1))-1; data = {club_id:`club-${index+1}`,name:clubs[index],challenge_count:1,challenges:[challenges[index]]}; }
    else if (path === '/koth/team_token') data = { team_token:'qa-local-fixture-token' };
    else if (path === '/signatures') data = {signatures, total_count:signatures.length};
    else if (path.startsWith('/signatures/')) data = signatures.find(item => path.endsWith(item.signature_id));
    else if (path === '/teams/me') data = {team_name:'QA Alpha',team_score:800,mileage:1000,jeopardy_score:500,koth_score:300,signature_score:0,is_banned:false,members:[{nickname:'QA 운영자',is_leader:true},{nickname:'QA 참가자',is_leader:false}]};
    else if (path === '/teams/me/mileage_history') data = {history:[],total_count:0};
    else if (path === '/teams/me/solves') data = {solves:[],total_count:0};
    else if (path === '/instances/me' || path === '/teams/me/instances') data = null;
    else if (path.startsWith('/challenges/')) data = {challenge_id:'challenge-1',title:'QA Challenge',description:'한글 문제 설명과 English description',category:'WEB',score:100,status:'OPENED',opened_at:iso(-60000),is_solved:false,files:[],instance_required:false};
    else if (path === '/admin/dashboard') data = {total_teams:8,total_users:16,running_instances:0,failed_instances:0,total_challenges:36};
    else if (path === '/admin/events') data = {events:[],total_count:0};
    else if (path === '/admin/instances') data = {instances:[],total_count:0,summary:{by_status:{RUNNING:0,FAILED:0}}};
    else if (path === '/admin/resources') data = {resources:[]};
    else if (path === '/admin/teams') data = {teams:teams,total_count:8};
    else {unknown.push(path);data={};}
    await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({code:'SUCCESS',message:'로컬 QA fixture',data}) });
  });
  await page.addInitScript(() => {
    if (location.pathname === '/login') localStorage.removeItem('msgctf_access_token');
    else localStorage.setItem('msgctf_access_token', 'local-qa-token');
    const OriginalDate = Date;
    const fixed = OriginalDate.parse('2026-10-20T03:00:00.000Z');
    window.Date = class extends OriginalDate { constructor(...args) { super(...(args.length ? args : [fixed])); } static now() { return fixed; } };
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  const cdp=await page.context().newCDPSession(page);
  const current=new URL(origin).port!=='4173';
  const results=[];
  for (const [width,height,dpr] of [[390,844,1],[844,390,1],[1100,900,1],[1101,900,1],[460,512,1],[461,512,1],[390,844,2],[1440,900,2]]) {
    await page.setViewportSize({width,height});
    await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:false});
    for (const path of ['/leaderboard','/koth','/admin','/board']) {
      await page.goto(origin+path);
      await page.locator('main, [data-board-layer="track"]').first().waitFor();
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForLoadState('networkidle',{timeout:15000});
      if(path==='/board') await page.waitForFunction(()=>document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled===false && document.querySelector('canvas'));
      const record=await page.evaluate(({path,width,height,dpr,current})=>{
        const root=path==='/admin'?document.querySelector('[style*="--admin-background"],div.min-h-screen[style*="background-image"]'):document.querySelector('main');
        const backdrop=path==='/board'?'':getComputedStyle(root).backgroundImage;
        const artwork=document.querySelector('img[src*="leaderboard-layout"], img[src*="koth-trail-background"]');
        const portrait=width<=1100 && width/height<=.9;
        if(current && path!=='/board' && path!=='/leaderboard' && backdrop.includes('portrait')!==portrait) throw new Error('Wrong cover source '+path+' '+width+'x'+height+' '+backdrop);
        if(current && path==='/koth' && artwork && (artwork.currentSrc.startsWith('data:')!==(width<=1100))) throw new Error('Wrong artwork source '+path);
        const resources=performance.getEntriesByType('resource').filter(x=>x.name.startsWith(location.origin)).map(x=>({path:new URL(x.name).pathname,bytes:x.decodedBodySize}));
        if(current && path==='/koth' && artwork && width<=1100 && resources.some(x=>/koth-trail-background/.test(x.path))) throw new Error('Hidden desktop artwork downloaded');
        if(current && path==='/leaderboard') {
          const stage=root.firstElementChild,canvas=stage.firstElementChild,frame=stage.getBoundingClientRect(),matrix=new DOMMatrix(getComputedStyle(canvas).transform);
          if(!backdrop.includes('leaderboard-scene-v1.webp') || artwork?.naturalWidth!==1672) throw new Error('Wrong scoreboard artwork source');
          if(Math.abs(frame.width/frame.height-16/9)>.001 || Math.abs(matrix.a-matrix.d)>.00001) throw new Error('Scoreboard proportions changed');
          if(getComputedStyle(root.querySelector('table')).display!=='table' || getComputedStyle(root.querySelector('tbody tr')).display!=='table-row') throw new Error('Scoreboard reflowed into mobile cards');
          if(resources.some(x=>/background-plaza|panel-board/.test(x.path))) throw new Error('Separate scoreboard backdrop downloaded');
        }
        if(current && portrait && path!=='/board' && resources.some(x=>x.path.endsWith('/background-plaza.webp'))) throw new Error('Full plaza downloaded in portrait');
        if(innerWidth!==width || innerHeight!==height || Math.abs(devicePixelRatio-dpr)>.001) throw new Error('Device metrics mismatch');
        const broken=[...document.images].filter(x=>x.complete && x.naturalWidth===0).map(x=>x.src);
        const overflow=document.documentElement.scrollWidth>innerWidth+1;
        const alerts=[...document.querySelectorAll('[role="alert"]')].map(x=>x.textContent);
        if(broken.length || overflow || alerts.length) throw new Error(JSON.stringify({path,width,broken,overflow,alerts}));
        return {path,width,height,dpr,backdrop,artwork:artwork?.currentSrc,nodes:[...document.querySelectorAll('h1,h2,button,[data-board-layer]')].filter(x=>x.getBoundingClientRect().width && x.getBoundingClientRect().height && getComputedStyle(x).visibility!=='hidden').map(x=>({tag:x.tagName,label:x.getAttribute('aria-label'),text:x.textContent,rect:[x.getBoundingClientRect().x,x.getBoundingClientRect().y,x.getBoundingClientRect().width,x.getBoundingClientRect().height]})),resources};
      },{path,width,height,dpr,current});
      await page.screenshot({path:`${output}/responsive-${current?'current':'baseline'}-${path.slice(1)}-${width}-${height}-${dpr}.png`,animations:'disabled'});
      results.push(record);
    }
  }
  if(errors.length || unknown.length) throw new Error(JSON.stringify({errors,unknown}));
  await cdp.detach();
  return {results,errors,unknown};
}
