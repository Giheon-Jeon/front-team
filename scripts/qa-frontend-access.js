async (page) => {
  const origin=new URL(page.url()).origin;
  const output=new URL(page.url()).searchParams.get('qaOutput') || 'output/playwright';
  const strictOnly=new URL(page.url()).searchParams.has('strictOnly');
  const prefix=new URL(origin).port==='4173'?'baseline':'current';
  let mode='denied', release, rolls=0, piece=1, diceA=1, diceB=2;
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
    else if(path==='/board/dice/roll') {rolls++;piece=1+diceA+diceB;data={dice_a:diceA,dice_b:diceB,rolled_number:diceA+diceB,previous_position:1,current_position:piece,movement_path:Array.from({length:diceA+diceB},(_,i)=>i+2),pending_confirm:false};}
    else throw new Error('Unexpected access fixture request '+path);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(envelope(data))});
  });
  const gameResources=()=>page.evaluate(()=>performance.getEntriesByType('resource').filter(entry=>/Dice3D|BufferGeometryUtils|AdminDashboardPage|dice\.glb/.test(entry.name)).map(entry=>entry.name));
  const results=[];
  if(strictOnly) {
    mode='allowed';piece=1;
    await page.goto(origin+'/board').catch(error=>{if(!error.message.includes('ERR_ABORTED')) throw error;});
    await page.waitForFunction(()=>document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled===false && document.querySelector('canvas'));
    await page.waitForTimeout(900);
    await page.getByRole('button',{name:'주사위 굴리기',exact:true}).click();
    await page.getByRole('img',{name:'내 팀 말 (현재 4번 칸)',exact:true}).waitFor();
    await page.getByRole('button',{name:'주사위 굴리기',exact:true}).waitFor();
    await page.waitForTimeout(900);
    if(await page.locator('canvas').count()!==1 || !await page.getByRole('button',{name:'주사위 굴리기',exact:true}).isEnabled()) throw new Error('StrictMode canvas was disposed');
    if(errors.length) throw new Error(JSON.stringify(errors));
    return {strictModeStable:true,canvases:1,rolls,position:4,errors};
  }
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
  await page.unroute('**/assets/Dice3D-*.js');

  const ready=async()=>{
    await page.waitForFunction(()=>document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled===false && document.querySelector('canvas'));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  };
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:width===1440?900:844});
    for(const face of [1,2,3,4,5,6]) {
      diceA=face;diceB=7-face;piece=1;
      await page.goto(origin+'/board');await ready();
      if(face===1) await page.locator('[data-dice-visual]').screenshot({path:`${output}/dice-${prefix}-idle-${width}.png`});
      await page.getByRole('button',{name:'주사위 굴리기',exact:true}).click();
      await page.getByRole('img',{name:'내 팀 말 (현재 8번 칸)',exact:true}).waitFor();
      await ready();
      await page.locator('[data-dice-visual]').screenshot({path:`${output}/dice-${prefix}-${face}-${7-face}-${width}.png`});
      results.push({case:'dice-all-faces',width,diceA,diceB,position:8,canvases:await page.locator('canvas').count()});
    }
  }
  for(const [width,height] of [[768,844],[844,390],[320,844],[1440,900]]) {
    await page.setViewportSize({width,height});await ready();
    const canvas=await page.locator('canvas').evaluate(canvas=>({width:canvas.width,height:canvas.height,box:{width:canvas.getBoundingClientRect().width,height:canvas.getBoundingClientRect().height}}));
    if(canvas.width<1 || canvas.height<1 || await page.locator('canvas').count()!==1) throw new Error('Canvas failed after resize');
    results.push({case:'dice-resize',width,height,canvas});
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  diceA=1;diceB=2;piece=1;await page.goto(origin+'/board');await ready();
  await page.getByRole('button',{name:'주사위 굴리기',exact:true}).click();
  await page.getByRole('img',{name:'내 팀 말 (현재 4번 칸)',exact:true}).waitFor();await ready();
  results.push({case:'normal-motion-worker-roll',position:4,canvases:await page.locator('canvas').count()});
  piece=1;await page.goto(origin+'/board');await ready();
  await Promise.all([page.waitForResponse(response=>response.url().endsWith('/board/dice/roll')),page.getByRole('button',{name:'주사위 굴리기',exact:true}).click()]);
  await page.getByRole('button',{name:'규칙 설명서',exact:true}).click();
  await page.waitForURL('**/rules');await page.waitForTimeout(650);
  if(await page.locator('canvas').count()) throw new Error('Dice canvas remained after navigation');
  piece=1;
  await page.getByRole('button',{name:'메인 페이지로 이동',exact:true}).click();
  await page.waitForURL('**/board');await ready();await page.waitForTimeout(650);
  if(await page.locator('canvas').count()!==1) throw new Error('Duplicate or disposed canvas after SPA return');
  await page.getByRole('button',{name:'주사위 굴리기',exact:true}).click();
  await page.getByRole('img',{name:'내 팀 말 (현재 4번 칸)',exact:true}).waitFor();await ready();
  results.push({case:'spa-unmount-during-roll-and-remount',afterUnmount:0,afterReturn:1,position:4});

  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/models/dice.glb',route=>route.abort());
  piece=1;await page.goto(origin+'/board');
  await page.waitForFunction(()=>document.querySelector('[data-dice-fallback="true"]') && document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled===false);
  await page.getByRole('button',{name:'주사위 굴리기',exact:true}).click();
  await page.getByRole('img',{name:'내 팀 말 (현재 4번 칸)',exact:true}).waitFor();
  results.push({case:'model-download-failure',position:4});
  await page.unroute('**/models/dice.glb');
  await page.addInitScript(()=>{
    if(!new URL(location.href).searchParams.has('qaNoGl')) return;
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl' || type==='webgl2' ? null : original.call(this,type,...args);};
  });
  piece=1;await page.goto(origin+'/board?qaNoGl=1');
  await page.waitForFunction(()=>document.querySelector('[data-dice-fallback="true"]') && document.querySelector('button[aria-label="주사위 굴리기"]')?.disabled===false);
  await page.getByRole('button',{name:'주사위 굴리기',exact:true}).click();
  await page.getByRole('img',{name:'내 팀 말 (현재 4번 칸)',exact:true}).waitFor();
  results.push({case:'webgl-unavailable',position:4});
  if(errors.length) throw new Error(JSON.stringify(errors));
  return {results,errors};
}
