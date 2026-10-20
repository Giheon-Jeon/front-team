// Run with playwright-cli run-code --filename after installing local fixtures,
// or in an authenticated production browser. This script only reads the UI.
// qaOutput selects the screenshot folder; qaWidths defaults to 320,390,768,1100.
async page => {
  const url = new URL(page.url());
  const origin = url.origin;
  const output = url.searchParams.get('qaOutput') || 'output/playwright/mobile-details';
  const widths = (url.searchParams.get('qaWidths') || '320,390,768,1100').split(',').map(Number);
  let challengePath = url.searchParams.get('qaChallenge');
  if (!challengePath && ['localhost','127.0.0.1'].includes(url.hostname)) challengePath = '/challenges/challenge-1';
  if (!challengePath) {
    const id = await page.evaluate(async () => {
      const response = await fetch('/api/v1/board/opened_challenges', {
        headers:{Authorization:'Bearer '+localStorage.getItem('msgctf_access_token')}
      });
      if (!response.ok) throw new Error('An authenticated QA session is required');
      const body = await response.json();
      return body.data?.opened_challenges?.[0]?.challenge_id;
    });
    if (id) challengePath = '/challenges/'+encodeURIComponent(id);
  }
  const paths = ['/board', '/mypage', '/challenges/challenge-1', '/leaderboard', '/rules', '/koth', '/signatures'];
  const results = [], errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const settle = async () => {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].filter(i => i.getBoundingClientRect().width).map(i => i.decode().catch(() => {})));
    });
    await page.waitForTimeout(120);
  };
  const textMetrics = scope => {
    const walker = document.createTreeWalker(scope ? document.querySelector(scope) : document.body, NodeFilter.SHOW_TEXT);
    const texts = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!text || !node.parentElement || node.parentElement.closest('script,style,svg')) continue;
      const element = node.parentElement, style = getComputedStyle(element);
      if (style.visibility !== 'visible' || style.display === 'none') continue;
      const closedDetails = element.closest('details:not([open])');
      if (closedDetails && !closedDetails.querySelector('summary')?.contains(element)) continue;
      let opacity = 1, clipped = false;
      const clips = [];
      for (let parent = element; parent; parent = parent.parentElement) {
        const css = getComputedStyle(parent);
        opacity *= Number(css.opacity);
        if (css.clip !== 'auto' || css.clipPath.startsWith('inset(50%')) clipped = true;
        if (/(auto|scroll|hidden|clip)/.test(css.overflowX + css.overflowY)) clips.push(parent.getBoundingClientRect());
      }
      if (clipped || opacity < .99 || element.closest('[disabled],[aria-disabled="true"]')) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = [...range.getClientRects()].filter(r =>
        r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth &&
        clips.every(c => r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1) &&
        (() => {
          const hit = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          return hit && (hit.contains(element) || element.contains(hit));
        })()
      );
      if (!rects.length) continue;
      texts.push({
        text, color:style.color, fontSize:parseFloat(style.fontSize), fontWeight:parseFloat(style.fontWeight) || 400,
        className:element.className, tag:element.tagName,
        rects:rects.map(r => ({x:r.x,y:r.y,width:r.width,height:r.height}))
      });
    }
    return texts;
  };
  const captureText = async (path,width,shot,scroll=0) => {
    const scope = path === '/board/menu' ? 'nav details[open]' : path === '/board/open-challenges' ? '#board-open-challenges-panel' : null;
    const metrics = await page.evaluate(textMetrics,scope);
    await page.screenshot({path:shot+'.png',scale:'css',animations:'disabled'});
    const hidden = await page.addStyleTag({content:'body *{color:transparent!important;text-shadow:none!important;-webkit-text-stroke-color:transparent!important}svg text{fill:transparent!important}'});
    try { await page.screenshot({path:shot+'-background.png',scale:'css',animations:'disabled'}); }
    finally { await hidden.evaluate(el=>el.remove()); }
    results.push({kind:'contrast',path,width,scroll,shot:shot+'-background.png',metrics});
  };
  // Keep the target's actual border/background, remove only its surroundings.
  // Thus opaque color underneath a transparent frame corner remains detectable.
  const isolate = async locator => {
    await locator.evaluate(target => {
      const saved = [];
      const save = node => {
        saved.push([node, node.getAttribute('style'), node.getAttribute('data-qa-alpha-ancestor')]);
      };
      let child = target;
      while (child.parentElement) {
        const parent = child.parentElement;
        save(parent);
        parent.setAttribute('data-qa-alpha-ancestor', '');
        parent.style.setProperty('background', 'transparent', 'important');
        parent.style.setProperty('box-shadow', 'none', 'important');
        parent.style.setProperty('border-color', 'transparent', 'important');
        parent.style.setProperty('border-image', 'none', 'important');
        for (const sibling of parent.children) {
          if (sibling === child) continue;
          save(sibling);
          sibling.style.setProperty('visibility', 'hidden', 'important');
        }
        child = parent;
      }
      window.__restoreVisualQa = () => {
        for (const [node, style, attr] of saved.reverse()) {
          if (style == null) node.removeAttribute('style'); else node.setAttribute('style', style);
          if (attr == null) node.removeAttribute('data-qa-alpha-ancestor'); else node.setAttribute('data-qa-alpha-ancestor', attr);
        }
        delete window.__restoreVisualQa;
      };
    });
    return page.addStyleTag({content:'[data-qa-alpha-ancestor]::before,[data-qa-alpha-ancestor]::after{display:none!important}'});
  };
  try {
    for (const path of paths) {
      // A real deployment may have different challenge identifiers.
      if (path.startsWith('/challenges/') && !challengePath) continue;
      const actualPath = path.startsWith('/challenges/') ? challengePath : path;
      await page.goto(origin + actualPath);
      await page.locator(path === '/board' ? '[data-board-layer="scene"]' : 'main').first().waitFor();
      if (path === '/board') await page.waitForFunction(()=>document.querySelectorAll('[data-cell-target]').length===36);
      if (path === '/mypage') await page.waitForFunction(()=>{const h=document.querySelector('h1');return h&&!['LOADING','UNAVAILABLE'].includes(h.textContent);});
      if (path.startsWith('/challenges/')) await page.getByRole('heading',{name:'문제 설명',exact:true}).waitFor();
      if (path === '/leaderboard') await page.locator('table tbody tr').first().waitFor();
      for (const width of widths) {
        await page.setViewportSize({width,height:844});
        await settle();
        await page.evaluate(() => scrollTo(0,0));
        const slug = path.split('/')[1];
        const positions = await page.evaluate(() => {
          const end = Math.max(0, document.documentElement.scrollHeight - innerHeight);
          const points = [0];
          for (let y=650; y<end; y+=650) points.push(y);
          if (end>0) points.push(end);
          return points;
        });
        for (let index=0;index<positions.length;index++) {
          await page.evaluate(y => scrollTo(0,y), positions[index]);
          const shot = `${output}/${slug}-${width}-${index}`;
          await captureText(path,width,shot,positions[index]);
        }
        await page.evaluate(() => scrollTo(0,0));
        const panelSelectors = {
          '/board':'[class*="_diceStatus_"]',
          '/mypage':'[class*="_metricPanel_"]',
          '/challenges/challenge-1':'[class*="_instancePanel_"]',
          '/signatures':'[class*="_mobileBooth_"]',
        };
        if (panelSelectors[path]) {
          const panel = page.locator(panelSelectors[path]).first();
          if (await panel.isVisible()) {
            const style = await isolate(panel);
            const shot = `${output}/${slug}-${width}-alpha.png`;
            try { await panel.screenshot({path:shot,omitBackground:true,scale:'css'}); }
            finally { await page.evaluate(()=>window.__restoreVisualQa()); await style.evaluate(el=>el.remove()); }
            results.push({kind:'alpha',path,width,shot});
          }
        }
        if (path==='/board') {
          await page.evaluate(() => scrollTo(0,0));
          const icons = page.locator('nav[aria-label="대회 메뉴"] > a svg, nav[aria-label="대회 메뉴"] > details > summary svg');
          for (let index=0;index<await icons.count();index++) {
            const icon=icons.nth(index), style=await isolate(icon);
            const shot=`${output}/icon-${width}-${index}.png`;
            try { await icon.screenshot({path:shot,omitBackground:true,scale:'css'}); }
            finally { await page.evaluate(()=>window.__restoreVisualQa()); await style.evaluate(el=>el.remove()); }
            results.push({kind:'icon',width,index,shot});
          }
          const menu = page.getByLabel('대회 전체 메뉴',{exact:true});
          await menu.click();
          await settle();
          await captureText('/board/menu',width,`${output}/menu-${width}`);
          await menu.press('Escape');
          await page.getByRole('button',{name:/열린 문제 목록 보기/}).click();
          await page.getByRole('dialog',{name:'열린 문제',exact:true}).waitFor();
          await page.waitForFunction(()=>!document.querySelector('#board-open-challenges-panel')?.textContent.includes('내 인스턴스 확인 중'));
          await settle();
          await captureText('/board/open-challenges',width,`${output}/open-challenges-${width}`);
          await page.getByRole('button',{name:'열린 문제 패널 닫기',exact:true}).click();
        }
        results.push({kind:'layout',path,width,...await page.evaluate(()=>({
          overflow:document.documentElement.scrollWidth>innerWidth+1,
          controls:[...document.querySelectorAll('button[aria-label],a[aria-label],summary')].filter(el=>{
            const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight;
          }).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim(),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))
        }))});
      }
    }
    return {results,errors};
  } finally { page.off('pageerror',onError); }
}
