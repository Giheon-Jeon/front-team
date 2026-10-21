async (page) => {
  const url = new URL(page.url());
  const origin = url.origin;
  const output = url.searchParams.get('qaOutput') || 'output/playwright';
  const failSubset = url.searchParams.has('failSubset');
  const prefix = url.port === '4173' ? 'baseline' : failSubset ? 'fallback' : 'current';
  if (failSubset) await page.route('**/assets/fonts/pretendard/subsets/common.woff2*', route => route.abort());
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(origin+'/guide');
  await page.locator('main').waitFor();
  const manifest = await page.evaluate(async () => (await fetch('/.vite/manifest.json')).json());
  const styles = new Set();
  const visited = new Set();
  const collect = key => {
    if (visited.has(key)) return;
    visited.add(key);
    const entry = manifest[key];
    if (!entry) throw new Error('Manifest entry missing: '+key);
    for (const file of entry.css || []) styles.add('/'+file);
    for (const dependency of entry.imports || []) collect(dependency);
  };
  for (const key of Object.keys(manifest).filter(key => /\/(MyPage|ChallengeDetailPage|BoardPage|AdminMileagePage)\.jsx$/.test(key))) collect(key);
  const result = await page.evaluate(async ({styles,failSubset}) => {
    await Promise.all(styles.map(href => new Promise((resolve,reject) => {
      const link = document.createElement('link');link.rel='stylesheet';link.href=href;
      link.onload=resolve;link.onerror=()=>reject(new Error('Stylesheet failed: '+href));
      document.head.appendChild(link);
    })));
    const families=['MyPage Pretendard','Detail Pretendard','Board Tooltip Pretendard','MSG Payment'];
    const samples=[
      '팀 이름 문제 설명 마일리지 인스턴스 결제 승인 취소 ABC abc 0123456789',
      '힣 꿻 쀍 뷁 Àßø Æ Œ ñ → • ㄱㅏ',
      '가 A\u0304',
    ];
    const panel=document.createElement('div');panel.id='qa-font-panel';
    Object.assign(panel.style,{position:'absolute',left:'0',top:'0',zIndex:'99999',background:'white',color:'black',width:'1400px',padding:'0'});
    document.body.appendChild(panel);
    const rows=[];
    for (const family of families) for (const weight of [100,400,700,900]) {
      for (const text of samples.slice(0,1)) {
        const span=document.createElement('span');span.textContent=text;
        span.style.font=`${weight} 24px "${family}"`;span.style.display='block';panel.appendChild(span);
      }
      rows.push({family,weight});
    }
    panel.getBoundingClientRect();
    await new Promise(requestAnimationFrame);
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    await document.fonts.ready;
    const requests=()=>performance.getEntriesByType('resource').filter(entry=>entry.name.includes('/fonts/pretendard/')).map(entry=>({path:new URL(entry.name).pathname,bytes:entry.decodedBodySize}));
    const commonRequests=requests();
    const stages=[];
    for (let sample=1;sample<samples.length;sample++) {
      for (const {family,weight} of rows) {
        const span=document.createElement('span');span.textContent=samples[sample];span.style.font=`${weight} 24px "${family}"`;span.style.display='block';panel.appendChild(span);
      }
      panel.getBoundingClientRect();await new Promise(requestAnimationFrame);await document.fonts.ready;await new Promise(requestAnimationFrame);await document.fonts.ready;
      stages.push({sample,requests:requests()});
    }
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    for (const family of families) {
      if (![...document.fonts].some(face=>face.family.replaceAll('"','')===family && face.status==='loaded')) throw new Error('No loaded face: '+family);
    }
    panel.replaceChildren();
    const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=rows.length*100;
    canvas.dataset.fontQa='true';panel.appendChild(canvas);
    const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='black';ctx.textBaseline='top';
    const widths=[];
    rows.forEach(({family,weight},i) => {
      ctx.font=`${weight} 24px "${family}"`;
      samples.forEach((text,j) => {ctx.fillText(text,12,i*100+j*30+4);widths.push({family,weight,sample:j,width:ctx.measureText(text).width});});
    });
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',ctx.getImageData(0,0,canvas.width,canvas.height).data))].map(x=>x.toString(16).padStart(2,'0')).join('');
    return {rows:rows.length,samples:samples.length,widths,pixelHash:hash,commonRequests,stages,faces:[...document.fonts].filter(face=>families.includes(face.family.replaceAll('"',''))).map(face=>({family:face.family,status:face.status,range:face.unicodeRange}))};
  },{styles:[...styles],failSubset});
  await page.locator('canvas[data-font-qa]').screenshot({path:`${output}/fonts-${prefix}.png`});
  result.fontRequests=await page.evaluate(()=>performance.getEntriesByType('resource').filter(entry=>entry.name.includes('/fonts/pretendard/')).map(entry=>({path:new URL(entry.name).pathname,bytes:entry.decodedBodySize})));
  return {prefix,...result};
}
