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
  const onError=error=>errors.push(error.message);
  page.on('pageerror',onError);
  await page.emulateMedia({reducedMotion:'reduce'});
  const cdp=await page.context().newCDPSession(page);
  const results=[];
  const sizes=[[320,568,1],[390,844,1],[844,390,1],[768,1024,1],[1024,768,1],[1100,900,1],[1101,900,1],[1440,900,1],[1920,1080,1],[1600,600,1],[390,844,2],[1440,900,2]];
  try {
    for(const [width,height,dpr] of sizes) {
      await page.setViewportSize({width,height});
      for(const path of ['/board','/leaderboard','/koth','/mypage','/challenges/challenge-1','/rules','/signatures','/admin']) {
        await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:false});
        await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:45000});
        await page.locator('main, [data-board-layer="track"]').first().waitFor();
        await page.evaluate(()=>document.fonts.ready);
        if(path==='/board') await page.waitForFunction(()=>document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled===false && document.querySelector('canvas'),null,{polling:100,timeout:20000});
        await page.evaluate(async()=>Promise.all([...document.images].filter(x=>x.getBoundingClientRect().width).map(x=>x.decode().catch(()=>{}))));
        if(path==='/board') await page.waitForFunction(()=>{
          const scene=document.querySelector('[data-board-layer="scene"]'),stage=scene.closest('[class*="_stage_"]'),frame=stage.parentElement,image=frame.querySelector(':scope > img'),p=image.getBoundingClientRect(),b=scene.getBoundingClientRect(),s=stage.getBoundingClientRect();
          const expected=innerWidth<=1100?[b.left+b.width*469/951,b.top+b.height*510/960]:[s.left+s.width*917/1920,s.top+s.height*630/1080];
          return [p.left+p.width*917/1920,p.top+p.height*630/1080].every((value,i)=>Math.abs(value-expected[i])<1);
        },null,{polling:100,timeout:10000});
        await page.waitForTimeout(100);
        const result=await page.evaluate(({path,width,height,dpr})=>{
          const assert=(value,message)=>{if(!value)throw new Error(path+' '+width+'x'+height+' '+message);};
          const visible=node=>{if(!node)return false;const r=node.getBoundingClientRect();return r.width>0 && r.height>0 && getComputedStyle(node).visibility!=='hidden';};
          const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
          assert(innerWidth===width && innerHeight===height && Math.abs(devicePixelRatio-dpr)<.001,'Incorrect device metrics');
          const overflow=document.documentElement.scrollWidth>innerWidth+1;
          const broken=[...document.images].filter(x=>x.complete && x.naturalWidth===0).map(x=>x.src);
          const alerts=[...document.querySelectorAll('[role="alert"]')].filter(visible).map(x=>x.textContent);
          assert(!overflow && !broken.length && !alerts.length,JSON.stringify({overflow,broken,alerts}));
          assert(!document.querySelector('[data-game-canvas]'),'Page was forced into a desktop canvas');
          let details={};
          if(path==='/board') {
            const scene=document.querySelector('[data-board-layer="scene"]'),stage=scene.closest('[class*="_stage_"]'),frame=stage.parentElement;
            const image=frame.querySelector(':scope > img'),inner=scene.querySelector('[data-board-layer="background"]');
            assert(Number(visible(image))+Number(visible(inner))===1,'Duplicate scene background');
            const picture=rect(image),bounds=rect(frame),board=rect(scene);
            assert(Math.abs(picture.width/picture.height-16/9)<.001,'Background stretched');
            assert(picture.left<=bounds.left+1 && picture.top<=bounds.top+1 && picture.right>=bounds.right-1 && picture.bottom>=bounds.bottom-1,'Backdrop leaves a gap');
            const expected=width<=1100?[board.left+board.width*469/951,board.top+board.height*510/960]:[rect(stage).left+rect(stage).width*917/1920,rect(stage).top+rect(stage).height*630/1080];
            const actual=[picture.left+picture.width*917/1920,picture.top+picture.height*630/1080];
            assert(actual.every((value,i)=>Math.abs(value-expected[i])<1),'Background floor detached from board '+JSON.stringify({actual,expected,frame:bounds,board,picture}));
            if(width<=1100) {
              const status=document.querySelector('[class*="_diceReadout_"]');
              assert(parseFloat(getComputedStyle(status).fontSize)>=16,'Dice status too small');
              const nav=document.querySelector('nav[aria-label="대회 메뉴"]');
              assert([...nav.querySelectorAll(':scope > a')].length===3,'Original navigation icons missing');
              assert([...nav.querySelectorAll(':scope > a')].every(x=>rect(x).width>=44 && rect(x).height>=44),'Navigation touch target too small');
            }
            details={background:picture,anchor:actual};
          }
          if(path==='/leaderboard') {
            const table=document.querySelector('table'),container=table.parentElement,canvas=document.querySelector('[class*="_designCanvas_"]');
            assert(table.querySelectorAll('thead th').length===14,'Score columns omitted');
            assert(getComputedStyle(table).display==='table' && getComputedStyle(table.querySelector('tbody tr')).display==='table-row','Table changed into cards');
            if(width<=1100) {
              assert(getComputedStyle(canvas).transform==='none' && canvas.offsetWidth<=width,'Whole page scaled down');
              assert(parseFloat(getComputedStyle(table).fontSize)>=14,'Table text too small');
              assert(container.scrollWidth>container.clientWidth && getComputedStyle(container).overflowX==='auto','Wide columns cannot be scrolled');
              const graph=document.querySelector('[data-compact]');
              assert(rect(graph).width<=width && rect(graph).height>=280,'Graph is not fitted to mobile');
              assert([...document.querySelectorAll('[class*="_legendName_"]')].every(x=>parseFloat(getComputedStyle(x).fontSize)>=14),'Legend text too small');
              assert(![...document.querySelectorAll('button')].some(x=>x.getAttribute('aria-label')==='스코어보드 읽기 크기로 확대'),'Global desktop zoom returned');
              details={graph:rect(graph),tableWidth:container.scrollWidth,tableViewport:container.clientWidth};
            }
          }
          if(path==='/mypage' && (width<=1100 || height<620)) {
            const card=document.querySelector('[aria-label="팀 정보"]'),score=document.querySelector('[aria-label="팀 점수"]');
            assert(rect(card).width<=width && parseFloat(getComputedStyle(card.querySelector('h1')).fontSize)>=24,'Profile shrunk instead of reflowed');
            assert(getComputedStyle(card).borderImageSource.includes('panel-board.webp') && getComputedStyle(score).borderImageSource.includes('panel-score.png'),'Original paper or wood theme missing');
          }
          if(path.startsWith('/challenges/') && (width<=1100 || height<620)) {
            const input=document.querySelector('#flag'),description=document.querySelector('[class*="_descriptionBody_"]');
            assert(parseFloat(getComputedStyle(input).fontSize)>=16 && rect(input).width<=width,'Flag input is unreadable');
            assert(getComputedStyle(input.closest('form')).borderImageSource.includes('panel-board.webp'),'Original flag panel theme missing');
            assert(parseFloat(getComputedStyle(description).fontSize)>=16,'Description text too small');
          }
          if(path==='/koth' && width<=1100) {
            const heading=document.querySelector('h1'),cards=[...document.querySelectorAll('[class*="_challengeButton_"]')];
            assert(parseFloat(getComputedStyle(heading).fontSize)>=24 && cards.length===6,'Koth title or challenges missing');
            assert(cards.every(x=>rect(x).width>=90),'Koth cards scaled too small');
            assert(visible(document.querySelector('[class*="_mobileTrailArtwork_"]')),'Original mountain artwork missing');
            assert(document.querySelectorAll('[class*="_mobileRoundArtwork_"]').length===3 && visible(document.querySelector('[data-material="map"]')),'Original map composition missing');
          }
          if(path==='/rules' && width<=1100) assert([...document.querySelectorAll('[class*="_ruleDescription_"]')].every(x=>parseFloat(getComputedStyle(x).fontSize)>=16),'Rules text too small');
          if(path==='/signatures' && (width<=600 || width/height<=1.25)) {
            const links=[...document.querySelectorAll('[data-directory-booth]')];
            assert(links.length===6 && links.every(x=>getComputedStyle(x).borderImageSource.includes('panel-score.png')),'Mobile booths lost original wood theme');
            assert(links.every(x=>rect(x.querySelector('a,button')).height>=44),'Booth entry target too small');
          }
          return {path,width,height,dpr,overflow,broken,alerts,details};
        },{path,width,height,dpr});
        if((width===390 || width===1440) && dpr===1) await page.screenshot({path:`${output}/theme-${path.slice(1).replaceAll('/','-')}-${width}.png`,animations:'disabled'});
        results.push(result);
      }
    }
    if(errors.length || unknown.length)throw new Error(JSON.stringify({errors,unknown}));
    return {results,errors,unknown};
  } finally {
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await cdp.detach();
    page.removeListener('pageerror',onError);
  }
}
