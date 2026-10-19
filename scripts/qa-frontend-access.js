async (page) => {
  const origin=new URL(page.url()).origin;
  let mode='denied', release, rolls=0, piece=1;
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{
    if(location.pathname==='/login' || new URL(location.href).searchParams.has('noToken')) localStorage.removeItem('msgctf_access_token');
    else localStorage.setItem('msgctf_access_token','local-access-qa');
    localStorage.setItem('msgctf_role','ADMIN');
  });
  const envelope=data=>({code:'SUCCESS',message:'local access QA',data});
  const user={user_id:'qa',nickname:'QA',role:'PARTICIPANT',is_leader:true,team_id:'qa-team',team_name:'QA'};
  await page.unroute('**/api/v1/**');
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname.replace('/api/v1','');
    if(path==='/auth/me' && mode==='pending') {
      await new Promise(resolve=>{release=async()=>{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(envelope(user))});resolve();};});
      return;
    }
    if(path==='/auth/me' && mode==='unavailable') {
      await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'UNAVAILABLE',data:null})});return;
    }
    if(path==='/auth/me' && mode==='invalid') {
      await route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({code:'TOKEN_INVALID',data:null})});return;
    }
    let data;
    if(path==='/auth/me') data=user;
    else if(path==='/board') data={total_cell_count:36,cells:Array.from({length:36},(_,i)=>({cell_index:i+1,type:i===0?'START':'CHALLENGE',difficulty:'EASY',name:`QA ${i+1}`}))};
    else if(path==='/board/me') data={position:piece,type:piece===1?'START':'CHALLENGE',dice_rolls_left:3,cell_states:[],chance_cards:[],consumed_cell_indexes:[]};
    else if(path==='/board/dice/status') data={can_roll:true,dice_rolls_left:3,timer_running:true};
    else if(path==='/board/opened_challenges') data={opened_challenges:[]};
    else if(path==='/board/chance/catalog') data={cards:[]};
    else if(path==='/board/cell/current') data={cell_index:piece,type:'START',challenge_candidates:[]};
    else if(path==='/board/dice/roll') {rolls++;piece=4;data={dice_a:1,dice_b:2,rolled_number:3,previous_position:1,current_position:4,movement_path:[2,3,4],pending_confirm:false};}
    else throw new Error('Unexpected access fixture request '+path);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(envelope(data))});
  });
  const gameResources=()=>page.evaluate(()=>performance.getEntriesByType('resource').filter(entry=>/Dice3D|BufferGeometryUtils|AdminDashboardPage|dice\.glb/.test(entry.name)).map(entry=>entry.name));
  const results=[];
  await page.goto(origin+'/board?noToken=1');await page.waitForURL('**/login');
  if((await gameResources()).length) throw new Error('Anonymous page loaded game code');
  results.push({case:'anonymous-board',redirect:'/login',protectedCodeRequests:0});
  mode='denied';await page.goto(origin+'/admin');
  await page.getByRole('heading',{name:'관리자만 접근할 수 있는 페이지입니다.',exact:true}).waitFor();
  if((await gameResources()).some(url=>url.includes('AdminDashboardPage'))) throw new Error('Forged local role loaded admin code');
  results.push({case:'forged-local-admin-role',serverRole:'PARTICIPANT',statusScreen:'403',adminCodeRequests:0});
  mode='pending';await page.goto(origin+'/board');await page.getByText('로그인 확인 중',{exact:true}).waitFor();
  if((await gameResources()).length) throw new Error('Unverified session loaded protected code');
  mode='allowed';await release();await page.locator('[data-board-layer="track"]').waitFor();
  results.push({case:'pending-server-verification',protectedCodeBeforeVerification:0});
  mode='unavailable';await page.goto(origin+'/board');await page.getByRole('alert').waitFor();
  if((await gameResources()).length) throw new Error('Unavailable authentication loaded protected code');
  mode='allowed';await page.getByRole('button',{name:'다시 확인하기',exact:true}).click();
  await page.locator('[data-board-layer="track"]').waitFor();
  results.push({case:'auth-unavailable-retry',recovered:true});
  mode='invalid';await page.goto(origin+'/board');await page.waitForURL('**/login');
  if(await page.evaluate(()=>localStorage.getItem('msgctf_access_token'))) throw new Error('Invalid token was retained');
  results.push({case:'invalid-session',redirect:'/login',tokenCleared:true});
  mode='allowed';piece=1;await page.goto(origin+'/board');
  await page.waitForFunction(()=>!document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled && document.querySelector('canvas'));
  await page.getByRole('button',{name:'주사위 굴리기',exact:true}).click();
  await page.getByRole('img',{name:'내 팀 말 (현재 4번 칸)',exact:true}).waitFor();
  await page.getByRole('button',{name:'주사위 굴리기',exact:true}).waitFor();
  if(!await page.getByRole('button',{name:'주사위 굴리기',exact:true}).isEnabled()) throw new Error('3D dice did not recover');
  results.push({case:'3d-dice-after-dependency-removal',rolls,position:4,canvas:await page.locator('canvas').count()});
  await page.route('**/assets/Dice3D-*.js',route=>route.abort());
  piece=1;await page.goto(origin+'/board');
  await page.waitForFunction(()=>document.querySelector('[data-dice-fallback="true"]') && !document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled);
  await page.getByRole('button',{name:'주사위 굴리기',exact:true}).click();
  await page.getByRole('img',{name:'내 팀 말 (현재 4번 칸)',exact:true}).waitFor();
  await page.getByRole('button',{name:'주사위 굴리기',exact:true}).waitFor();
  if(rolls!==2 || !await page.getByRole('button',{name:'주사위 굴리기',exact:true}).isEnabled()) throw new Error('Dice fallback did not recover');
  results.push({case:'3d-download-failure-fallback',rolls,position:4,fallbackCount:await page.locator('[data-dice-fallback="true"]').count()});
  if(errors.length) throw new Error(JSON.stringify(errors));
  return {results,errors};
}
