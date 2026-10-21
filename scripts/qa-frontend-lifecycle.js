async (page) => {
  const origin=new URL(page.url()).origin;
  const initial=Date.parse('2026-10-20T03:00:00Z');
  let mode='transition', timerRequests=0, instanceRequests=0, challengeRequests=0, deploymentRequests=0, slowRelease;
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install({time:new Date(initial)});
  await page.clock.pauseAt(new Date(initial));
  await page.addInitScript(()=>{
    localStorage.setItem('msgctf_access_token','local-lifecycle-qa');
    window.__qaHidden=false;
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__qaHidden});
  });
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname.replace('/api/v1','');
    const now=await page.evaluate(()=>Date.now());
    const iso=value=>new Date(value).toISOString();
    let data,status=200,code='SUCCESS';
    if(path==='/auth/me') data={user_id:'qa-user',nickname:'QA',role:'ADMIN',is_leader:true,team_id:'qa-team',team_name:'QA'};
    else if(path==='/timer') {
      timerRequests++;
      if(timerRequests>12 && mode==='expired') throw new Error('Expired timer request loop');
      const phase=now<initial+2000?'BEFORE':now<initial+6000?'RUNNING':'ENDED';
      data={name:'Lifecycle QA',status:mode==='transition'?phase:'RUNNING',start_time:iso(initial+2000),end_time:iso(mode==='expired'?initial-1000:mode==='transition'?initial+6000:initial+7200000),server_time:iso(now)};
      if(mode==='retry' && timerRequests===1) {status=503;code='UNAVAILABLE';data=null;}
      if(mode==='slow') {
        await new Promise(resolve=>{slowRelease=async()=>{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({code:'SUCCESS',data})}).catch(()=>{});resolve();};});
        return;
      }
    }
    else if(path==='/admin/challenges') data={challenges:[{challenge_id:'qa-admin',title:'Lifecycle Admin',category:'WEB',difficulty:'EASY',score:100,solved_team_count:0,running_instance_count:0,failed_instance_count:0,is_published:false}],total_count:1};
    else if(path==='/admin/instances') {instanceRequests++;data={instances:[],total_count:0};}
    else if(path==='/admin/challenges/qa-admin') data={challenge_id:'qa-admin',title:'Lifecycle Admin',category:'WEB',difficulty:'EASY',description:'QA',current_score:100};
    else if(path==='/admin/challenges/qa-admin/flag') data={configured:false,reveal_available:false};
    else if(path==='/admin/challenges/qa-admin/runtime-secrets') data={secrets:[]};
    else if(path==='/admin/challenges/qa-admin/releases') data={releases:[{release_id:'qa-release',version:1,is_current:true,is_deployable:true,runtime_type:'DOCKER',architecture:'amd64',containers:[{name:'web',image_ref:'local-qa',ports:[],env:{},secret_bindings:[]}]}]};
    else if(path==='/admin/challenges/qa-admin/deployment_tests') {deploymentRequests++;data={active_test:null,tests:[]};}
    else if(path.startsWith('/challenges/')) {challengeRequests++;data={challenge_id:'qa-problem',title:'Lifecycle Problem',description:'QA',category:'WEB',score:100,status:'OPENED',opened_at:iso(now-60000),is_solved:false,files:[],instance_required:false};}
    else if(path==='/teams/me/instances') {challengeRequests++;data=null;}
    else throw new Error('Unexpected fixture request: '+path);
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify({code,message:'local lifecycle QA',data})});
  });
  const wait=()=>page.waitForTimeout(180);
  const visibility=hidden=>page.evaluate(hidden=>{window.__qaHidden=hidden;document.dispatchEvent(new Event('visibilitychange'));},hidden);
  const results=[];

  await page.goto(origin+'/timer');
  await page.getByText('대회 시작 전',{exact:true}).waitFor();
  await page.clock.runFor(3000);await wait();
  await page.getByText('대회 진행 중',{exact:true}).waitFor();
  await page.clock.runFor(4000);await wait();
  await page.getByText('대회 종료',{exact:true}).waitFor();
  if(timerRequests!==3) throw new Error('Expected initial/start/end timer reads, got '+timerRequests);
  results.push({case:'timer-before-running-ended',requests:timerRequests});

  mode='expired';timerRequests=0;
  await page.goto(origin+'/timer');await page.getByRole('heading',{name:'Lifecycle QA'}).waitFor();await wait();
  await page.clock.runFor(5000);await wait();
  if(timerRequests!==2) throw new Error('Expired phase repeated '+timerRequests+' times');
  results.push({case:'expired-phase-no-loop',requests:timerRequests});

  mode='normal';timerRequests=0;
  await page.goto(origin+'/timer');await page.getByRole('heading',{name:'Lifecycle QA'}).waitFor();await wait();
  const before=timerRequests;
  await visibility(true);await page.clock.runFor(90000);await wait();
  if(timerRequests!==before) throw new Error('Hidden timer polled');
  await visibility(false);await wait();
  if(timerRequests!==before+1) throw new Error('Timer did not refresh once on return');
  const afterReturn=timerRequests;
  await page.goto(origin+'/guide');await page.clock.runFor(90000);await wait();
  if(timerRequests!==afterReturn) throw new Error('Timer polled after navigation');
  results.push({case:'timer-hidden-return-unmount',hiddenRequests:0,resumeRequests:1,afterUnmount:0});

  mode='retry';timerRequests=0;
  await page.goto(origin+'/timer');await page.getByRole('alert').waitFor();
  await page.getByRole('button',{name:'다시 시도',exact:true}).click();
  await page.getByRole('heading',{name:'Lifecycle QA'}).waitFor();
  if(timerRequests!==2) throw new Error('Timer retry did not recover');
  results.push({case:'timer-network-error-retry',requests:timerRequests});

  mode='slow';timerRequests=0;
  await page.goto(origin+'/timer');await wait();
  if(!slowRelease) throw new Error('Slow timer request did not start');
  await page.goto(origin+'/guide');await slowRelease();await wait();
  if(new URL(page.url()).pathname!=='/guide') throw new Error('Late timer response changed route');
  results.push({case:'timer-late-response-after-unmount',route:'/guide'});

  mode='normal';instanceRequests=0;
  await page.goto(origin+'/admin/challenges');
  await page.getByRole('tab',{name:'인스턴스',exact:true}).click();
  await page.getByText('표시할 인스턴스가 없습니다',{exact:true}).waitFor();await wait();
  const instanceBefore=instanceRequests;
  await visibility(true);await page.clock.runFor(90000);await wait();
  if(instanceRequests!==instanceBefore) throw new Error('Hidden admin instances polled');
  await visibility(false);await wait();
  if(instanceRequests!==instanceBefore+1) throw new Error('Admin instances did not refresh once on return');
  await page.getByRole('tab',{name:'문제 목록',exact:true}).click();
  const switched=instanceRequests;
  await page.clock.runFor(30000);await wait();
  if(instanceRequests!==switched) throw new Error('Inactive admin instance tab polled');
  results.push({case:'admin-instance-tab-hidden-return-close',hiddenRequests:0,resumeRequests:1,inactiveTabRequests:0});

  await page.getByRole('button',{name:'Lifecycle Admin 설정',exact:true}).click();
  await page.getByRole('tab',{name:'배포 설정',exact:true}).click();
  await page.getByRole('tab',{name:'배포 테스트',exact:true}).click();
  await page.getByText('이 버전의 테스트 기록이 없습니다',{exact:true}).waitFor();await wait();
  const deploymentBefore=deploymentRequests;
  await visibility(true);await page.clock.runFor(90000);await wait();
  if(deploymentRequests!==deploymentBefore) throw new Error('Hidden deployment panel polled');
  await visibility(false);await wait();
  if(deploymentRequests!==deploymentBefore+1) throw new Error('Deployment panel did not refresh once on return');
  await page.getByRole('tab',{name:'버전 정보',exact:true}).click();
  const deploymentAfter=deploymentRequests;
  await page.clock.runFor(30000);await wait();
  if(deploymentRequests!==deploymentAfter) throw new Error('Inactive deployment panel polled');
  results.push({case:'admin-deployment-panel-hidden-return-close',hiddenRequests:0,resumeRequests:1,inactivePanelRequests:0});

  challengeRequests=0;
  await page.goto(origin+'/challenges/qa-problem');
  await page.getByRole('heading',{name:'Lifecycle Problem',exact:true}).waitFor();await wait();
  const detailBefore=challengeRequests;
  await visibility(true);await page.clock.runFor(90000);await wait();
  if(challengeRequests!==detailBefore) throw new Error('Hidden challenge detail polled');
  await visibility(false);await wait();
  if(challengeRequests!==detailBefore+2) throw new Error('Challenge detail did not refresh once on return');
  await page.goto(origin+'/guide');const detailAfter=challengeRequests;
  await page.clock.runFor(30000);await wait();
  if(challengeRequests!==detailAfter) throw new Error('Challenge detail polled after navigation');
  results.push({case:'challenge-detail-hidden-return-unmount',hiddenRequests:0,resumeRequests:2,afterUnmount:0});
  if(errors.length) throw new Error(JSON.stringify(errors));
  await page.clock.resume();
  return {results,errors};
}
