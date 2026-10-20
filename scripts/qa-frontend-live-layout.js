async (page) => {
  const origin = new URL(page.url()).origin;
  const output = new URL(page.url()).searchParams.get('qaOutput') || 'output/playwright';
  const prefix = new URL(origin).port === '4173' ? 'performance-baseline' : 'performance-current';
  const now = '2026-10-20T03:00:00.000Z';
  const iso = delta => new Date(Date.parse(now) + delta).toISOString();
  const clubs = ['MJSEC', 'SWING', 'Y-CERT', 'seKUrity', 'CodeCure', 'Aegis'];
  const challenges = clubs.map((name, i) => ({ koth_challenge_id: `koth-${i + 1}`, title: `QA ${name} 긴 문제 제목과 English challenge title`, status: 'ACTIVE', open_group: i + 1, challenge_url: 'https://example.com/', current_score: 50, current_owner_team_name: 'QA Alpha', opened_at: iso(-300000), closed_at: null }));
  const signatures = clubs.map((club_name, i) => ({ signature_id: `signature-${i + 1}`, club_id: `club-${i + 1}`, club_name, title: `QA ${club_name}`, description: '한글과 영문이 함께 표시되는 문제 안내입니다. QA description.', score: 100, is_solved: false, solved_at: null, solved_team_count: 0 }));
  const teams = Array.from({ length: 8 }, (_, i) => ({ team_id: `team-${i + 1}`, team_name: `QA ${['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'][i]}`, team_score: 800 - i * 100, is_top3: i < 3, solves: [{ challenge_id: 'challenge-1', solved_at: iso(-300000), points: 800 - i * 100, source_type: 'JEOPARDY' }] }));
  const cells = Array.from({ length: 36 }, (_, index) => ({ cell_index: index + 1, type: ({1:'START',7:'CHANCE',16:'ROULETTE',21:'AIRPORT',25:'ROULETTE',30:'CHANCE'})[index+1] || 'CHALLENGE', difficulty: 'EASY', name: `QA ${index+1}`, line_number: Math.floor(index / 6) + 1 }));
  const progress = challenges.map((challenge, i) => ({ koth_challenge_id: challenge.koth_challenge_id, earned_score: 50, rank: i + 1, solved_at: iso(-60000) }));
  let piece=1, rolls=0;
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
    else if (path === '/board/me') data = { position: piece, type: 'START', dice_rolls_left: rolls ? 2 : 3, next_dice_reset_at: iso(600000), cell_states: [], chance_cards: [], consumed_cell_indexes: [], active_challenge: null };
    else if (path === '/board/dice/roll') { rolls++; const previous=piece; piece=6; data={dice_a:2,dice_b:3,rolled_number:5,previous_position:previous,current_position:piece,movement_path:[2,3,4,5,6],pending_confirm:false}; }
    else if (path === '/board/dice/status') data = { can_roll: true, dice_rolls_left: rolls ? 2 : 3, timer_running: true, blocked_reason: null, server_time: now, next_dice_reset_at: iso(600000) };
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
  const checkBoard = () => {
    const assert=(value,message)=>{if(!value)throw new Error(`${innerWidth}×${innerHeight}: ${message}`);};
    const scene=document.querySelector('[data-board-layer="scene"]'),stage=scene.closest('[class*="_stage_"]'),frame=stage.parentElement;
    const image=frame.querySelector(':scope > img'),track=scene.querySelector('[data-board-layer="track"]');
    const b=image.getBoundingClientRect(),s=stage.getBoundingClientRect(),r=scene.getBoundingClientRect(),t=track.getBoundingClientRect(),f=frame.getBoundingClientRect();
    const expected=innerWidth<=1100?[r.left+r.width*469/951,r.top+r.height*510/960]:[s.left+s.width*917/1920,s.top+s.height*630/1080];
    const error=Math.max(Math.abs(b.left+b.width*917/1920-expected[0]),Math.abs(b.top+b.height*630/1080-expected[1]));
    assert(error<.3,'Floor anchor moved '+error);
    assert(b.left<=f.left+.3 && b.top<=f.top+.3 && b.right>=f.right-.3 && b.bottom>=f.bottom-.3,'Uncovered background');
    assert(Math.abs(b.width/b.height-16/9)<.0001,'Background aspect ratio');
    assert(Math.abs(t.width/t.height-1772/1330)<.0001,'Track aspect ratio');
    assert(document.documentElement.scrollWidth<=innerWidth+1,'Document overflow');
    const centers=[[886,1210],[655,1187],[514,1147],[395,1092],[296,1024],[211,946],[149,858],[112,763],[102,660],[113,559],[146,465],[198,378],[270,300],[355,232],[451,174],[555,131],[666,99],[781,80],[901,74],[1017,81],[1132,89],[1239,137],[1339,184],[1432,244],[1514,315],[1583,394],[1634,483],[1663,576],[1669,679],[1653,781],[1613,874],[1548,960],[1458,1039],[1354,1106],[1234,1155],[1101,1188]];
    const matrix=track.querySelector('[data-board-layer="surface"]').getScreenCTM();
    const buttons=[...track.querySelectorAll('[data-cell-target]')].map(x=>x.closest('button'));
    assert(buttons.length===36,'Missing cells');
    let cellError=0;
    buttons.forEach((button,i)=>{
      const rect=button.getBoundingClientRect(),point=new DOMPoint(...centers[i]).matrixTransform(matrix);
      cellError=Math.max(cellError,Math.abs(rect.left+rect.width/2-point.x),Math.abs(rect.top+rect.height/2-point.y));
    });
    assert(cellError<.15,'Cell art and hit target diverged '+cellError);
    const die=track.querySelector('button[aria-label^="주사위"]'),d=die.getBoundingClientRect();
    assert(Math.abs(d.left+d.width/2-t.left-t.width*.5)<.1 && Math.abs(d.top+d.height/2-t.top-t.height*.47)<.1,'Dice target detached');
    const piece=track.querySelector('img[alt^="내 팀 말"]');
    if(piece) {
      const n=Number(piece.alt.match(/현재 (\d+)번/)[1]),p=piece.getBoundingClientRect(),point=new DOMPoint(...centers[n-1]).matrixTransform(matrix);
      assert(Math.abs(p.left+p.width*.4702725-point.x)<.15 && Math.abs(p.top+p.height*.48113934-point.y)<.15,'Piece detached from cell '+n);
    }
    const readout=document.querySelector('[class*="_diceReadout_"]');
    assert(getComputedStyle(readout).backgroundColor==='rgba(0, 0, 0, 0)','Black readout cover remains');
    if(innerWidth<=1100) assert(parseFloat(getComputedStyle(readout).fontSize)>=16,'Status text too small');
    return {width:innerWidth,height:innerHeight,floorError:error,cellError,cells:buttons.length};
  };
  const settledBoard=async()=>{
    try { await page.waitForFunction(()=>{
      const scene=document.querySelector('[data-board-layer="scene"]'),stage=scene?.closest('[class*="_stage_"]');
      if(!stage)return false;
      const image=stage.parentElement.querySelector(':scope > img').getBoundingClientRect(),r=scene.getBoundingClientRect(),s=stage.getBoundingClientRect();
      const expected=innerWidth<=1100?[r.left+r.width*469/951,r.top+r.height*510/960]:[s.left+s.width*917/1920,s.top+s.height*630/1080];
      return Math.abs(image.left+image.width*917/1920-expected[0])<.3 && Math.abs(image.top+image.height*630/1080-expected[1])<.3;
    },null,{polling:100,timeout:20000}); } catch(error) {
      const geometry=await page.evaluate(()=>{
        const scene=document.querySelector('[data-board-layer="scene"]'),stage=scene.closest('[class*="_stage_"]');
        const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
        return {width:innerWidth,height:innerHeight,scene:rect(scene),stage:rect(stage),image:rect(stage.parentElement.querySelector(':scope > img'))};
      });
      throw new Error(error.message+' '+JSON.stringify({last:results.at(-1),geometry}));
    }
    return page.evaluate(checkBoard);
  };
  const swipe=async(x,y,dx,dy)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let step=1;step<=10;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*step/10,y:y+dy*step/10}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };
  try {
    await page.bringToFront();
    await page.setViewportSize({width:1440,height:900});
    await page.goto(origin+'/board',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled===false,null,{polling:100});
    await page.evaluate(()=>document.fonts.ready);
    const sizes=[[3840,1080],[2560,1080],[1920,1080],[1600,1200],[1280,1024],[1101,900],[1100,900],[1024,768],[768,1024],[390,844],[320,568],[844,390],[1600,600],...Array.from({length:31},(_,i)=>[320+i*53,600+(i%5)*79])];
    for(const [width,height] of sizes) {
      await page.setViewportSize({width,height});
      results.push({case:'board-live-resize',...await settledBoard()});
    }
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'주사위 굴리기',exact:true}).click();
    await page.getByRole('img',{name:'내 팀 말 (현재 6번 칸)',exact:true}).waitFor();
    await page.waitForFunction(()=>document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled===false,null,{polling:100});
    results.push({case:'dice-roll-and-live-readout',rolls,...await settledBoard()});
    await page.screenshot({path:output+'/live-board-after-roll-390.png',animations:'disabled'});
    for(const [width,height] of [[1101,900],[1600,600],[1440,900]]) {
      await page.setViewportSize({width,height});
      const layout=await settledBoard();
      const readout=await page.evaluate(()=>{
        const panel=document.querySelector('[class*="_diceStatus_"]');
        const row=panel.querySelector('[class*="_diceCountRow_"]');
        const bounds=row.getBoundingClientRect();
        const spans=[...row.children].map(node=>node.getBoundingClientRect());
        if(spans.some(rect=>rect.left<bounds.left-.3 || rect.right>bounds.right+.3)) throw new Error('Dice recharge text exceeds the original panel');
        if(spans.length!==2 || spans[0].right>spans[1].left) throw new Error('Dice count and recharge text overlap');
        return {gap:spans[1].left-spans[0].right};
      });
      results.push({case:'desktop-dice-recharge',...layout,...readout});
      if(width===1101)await page.screenshot({path:output+'/live-board-after-roll-1101.png',animations:'disabled'});
    }
    for(const [width,height] of [[390,844],[844,390],[768,1024]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(()=>scrollTo(0,0));
      await page.getByRole('button',{name:'보드 확대 보기',exact:true}).click();
      const region=page.getByRole('region',{name:'게임 보드',exact:true});
      await region.evaluate(node=>{node.scrollLeft=0;});
      await settledBoard();
      const bounds=await region.boundingBox();
      await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
      await swipe(Math.min(width-40,300),Math.min(height-50,bounds.y+80),-180,0);
      await page.waitForFunction(()=>document.querySelector('[data-zoomed="true"]').scrollLeft>25,null,{polling:100,timeout:10000});
      results.push({case:'board-touch-pan',pan:await region.evaluate(n=>n.scrollLeft),...await settledBoard()});
      await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});
      // Rotate without reload while zoomed, then restore the whole board.
      await page.setViewportSize({width:height,height:width});
      results.push({case:'board-rotate-while-zoomed',...await settledBoard()});
      await page.getByRole('button',{name:'보드 전체 보기',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('[data-zoomed="false"]')?.scrollLeft===0,null,{polling:100});
      results.push({case:'board-restore',...await settledBoard()});
    }
    for(const path of ['/koth','/mypage','/challenges/challenge-1','/rules','/signatures','/leaderboard']) {
      await page.setViewportSize({width:390,height:844});
      await page.goto(origin+path,{waitUntil:'domcontentloaded'});
      await page.locator('main').first().waitFor();
      await page.evaluate(()=>document.fonts.ready);
      for(const [width,height] of [[390,844],[844,390],[768,1024],[1100,900],[1101,900],[1440,900],[390,844]]) {
        await page.setViewportSize({width,height});
        if(path==='/koth' && width<=1100) await page.waitForFunction(()=>document.querySelectorAll('[class*="_mobileRoundArtwork_"]').length===3,null,{polling:100});
        await page.waitForTimeout(100);
        const layout=await page.evaluate(path=>{
          const assert=(value,message)=>{if(!value)throw new Error(`${path} ${innerWidth}: ${message}`);};
          assert(document.documentElement.scrollWidth<=innerWidth+1,'Document overflow');
          assert(!document.querySelector('[data-game-canvas]'),'Whole page was shrunk');
          if(path==='/koth' && innerWidth<=1100) {
            const rounds=[...document.querySelectorAll('[class*="_challengeRound_"]')];
            const markers=[[195,475],[735,978],[1228,1477]];
            assert(rounds.length===3,'Missing original round groups');
            let maxDistance=0;
            rounds.forEach((round,index)=>{
              const art=round.querySelector('[class*="_mobileRoundArtwork_"]'),matrix=art.getScreenCTM();
              const cards=[...round.querySelectorAll('button')];
              assert(cards.length===2,'A challenge was omitted');
              assert(art.querySelector('image').getAttribute('href').includes('koth-trail-background.webp'),'Round decoration differs from original map');
              cards.forEach((card,slot)=>{
                const r=card.getBoundingClientRect(),p=new DOMPoint(markers[index][slot],458).matrixTransform(matrix);
                maxDistance=Math.max(maxDistance,Math.abs(r.left+r.width/2-p.x));
              });
            });
            assert(maxDistance<.3,'Original map markers detached from cards '+maxDistance);
            const artwork=document.querySelector('[class*="_mobileTrailArtwork_"]');
            assert(getComputedStyle(artwork).mixBlendMode==='multiply' && getComputedStyle(artwork).maskImage.includes('gradient'),'Mountain has a rectangular paper edge');
            assert(document.querySelector('[data-material="map"]'),'Original map paper missing');
            assert([...document.querySelectorAll('[class*="_mobileChallengeTitle_"]')].every(node=>parseFloat(getComputedStyle(node).fontSize)>=16),'Challenge titles too small');
            return {width:innerWidth,height:innerHeight,maxRoundMarkerError:maxDistance};
          }
          return {width:innerWidth,height:innerHeight};
        },path);
        results.push({case:'page-live-resize',path,...layout});
      }
      if(path==='/koth')await page.screenshot({path:output+'/live-koth-long-titles-390.png',fullPage:true,animations:'disabled'});
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(origin+'/leaderboard',{waitUntil:'domcontentloaded'});
    await page.locator('table').waitFor();
    const table=page.locator('table').locator('..');
    await table.scrollIntoViewIfNeeded();
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
    const rect=await table.boundingBox();
    await swipe(330,Math.max(80,Math.min(700,rect.y+80)),-200,0);
    await page.waitForFunction(()=>document.querySelector('table').parentElement.scrollLeft>30,null,{polling:100,timeout:10000});
    results.push({case:'scoreboard-table-touch',scrollLeft:await table.evaluate(node=>node.scrollLeft)});
    await page.evaluate(()=>scrollTo(0,0));
    const scrollBefore=await page.evaluate(()=>scrollY);
    await swipe(190,650,0,-260);
    await page.waitForFunction(before=>scrollY>before+20,scrollBefore,{polling:100,timeout:10000});
    results.push({case:'scoreboard-vertical-touch',scrollY:await page.evaluate(()=>scrollY)});
    if(errors.length || unknown.length)throw new Error(JSON.stringify({errors,unknown}));
    return {results,errors,unknown};
  } finally {
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});
    await cdp.detach();
    page.removeListener('pageerror',onError);
  }
}
