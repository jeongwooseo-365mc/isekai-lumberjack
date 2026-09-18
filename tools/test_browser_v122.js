"use strict";

// Release UI gate; Playwright is installed only by CI, not bundled in the app.
const fs=require("fs"),path=require("path"),http=require("http"),assert=require("assert");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,".."),out=path.join(root,"release","web-qa");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".png":"image/png",".ogg":"audio/ogg"};
const server=http.createServer((req,res)=>{
  const filename=path.resolve(root,"."+new URL(req.url,"http://localhost").pathname.replace(/\/$/,"/index.html"));
  if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(filename,(err,bytes)=>{if(err){res.writeHead(404);res.end();return;}
    res.setHeader("Content-Type",mime[path.extname(filename)]||"application/octet-stream");res.end(bytes);});
});

(async()=>{
  fs.mkdirSync(out,{recursive:true});await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const url=`http://127.0.0.1:${server.address().port}/?debug=1`;
  try{
    const errors=[];
    for(const [width,height]of [[360,640],[390,844],[768,1024],[1024,768],[1440,900]]){
      const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();
      page.on("pageerror",e=>errors.push(e.message));
      page.on("response",r=>{if(r.status()>=400&&!r.url().endsWith("favicon.ico"))errors.push(`${r.status()} ${r.url()}`);});
      await page.goto(url);await page.waitForFunction(()=>window.__GAME_DEBUG__?.state());
      // Seed a representative pre-patch save, then exercise the real startup loader.
      await page.evaluate(()=>{
        const g=window.__GAME_DEBUG__,s=g.freshState();delete s.tomes;delete s.runId;
        localStorage.setItem("isekai_lumberjack_meta",JSON.stringify({endingSeen:true}));
        s.lv=100;s.hp=3000;s.openingSeen=true;s.tutorialSeen=true;s.res.wood[2]=4321;
        s.gear[0].tier=4;s.gear[0].enh=7;
        g.replaceState(s);
        localStorage.setItem(g.constants.SAVE_KEY,JSON.stringify(s));
      });
      await page.reload();await page.waitForFunction(()=>window.__GAME_DEBUG__?.state()?.lv===100);
      assert.equal(await page.evaluate(()=>window.__GAME_DEBUG__.endingCount()),1);
      assert.deepEqual(await page.evaluate(()=>({...window.__GAME_DEBUG__.state().tomes})),{wood:0,ore:0,gold:0});
      assert.equal(await page.evaluate(()=>window.__GAME_DEBUG__.state().res.wood[2]),4321);
      await page.getByRole("button",{name:"게임 시작",exact:true}).click();
      for(const [place,label]of [["forest","숲"],["mine","광산"],["dungeon","던전"]]){
        await page.getByRole("button",{name:"메뉴 펼치기",exact:true}).click();
        await page.getByRole("button",{name:"지도",exact:true}).click();
        await page.getByRole("button",{name:label,exact:true}).click();
        assert.equal(await page.locator(".tier-option").count(),4);
        const option=page.locator('.tier-option[data-grade="3"]');assert(await option.isEnabled());
        if(place==="forest")await page.screenshot({path:path.join(out,`tiers-${width}x${height}.png`)});
        await option.click();
        await page.waitForFunction(()=>Array.from(document.querySelectorAll("img")).filter(i=>i.getBoundingClientRect().width>0).every(i=>i.complete&&i.naturalWidth>0));
        assert.equal(await page.locator("#placeTitle").innerText(),`최상급 ${label}`);
        assert(await page.locator("#targetImage").getAttribute("src").then(s=>s.endsWith("_top.png")));
        assert(await page.locator("#scene").evaluate(e=>e.style.backgroundImage.includes("4.png")));
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        await page.locator("#scene").click({position:{x:180,y:250}});
        const expectedSource={forest:"최상급 나무",mine:"최상급 광맥",dungeon:"흑수정 드래곤"}[place];
        const reflection=await page.evaluate(()=>window.__GAME_DEBUG__.state().logs.filter(entry=>entry.text.includes("반사 피해")).at(-1)?.text);
        assert(reflection.startsWith(`${expectedSource}의 반사 피해 `),reflection);
        await page.screenshot({path:path.join(out,`${place}-${width}x${height}.png`)});
      }
      await page.getByRole("button",{name:"메뉴 펼치기",exact:true}).click();
      await page.getByRole("button",{name:"제작소",exact:true}).click();
      await page.locator('[data-do="workshop-type"][data-type="rod"]').click();
      await page.locator('[data-do="workshop-tier"][data-tier="4"]').click();
      assert.equal(await page.locator(".requirements .requirement-row").count(),6);
      assert.equal(await page.locator(".tome-card").count(),3);
      assert.equal(await page.locator('[data-do="craft"]').isEnabled(),false);
      await page.screenshot({path:path.join(out,`recipe-${width}x${height}.png`)});
      await page.locator(".tome-card").last().scrollIntoViewIfNeeded();
      assert(await page.locator(".tome-card").last().isVisible());
      assert(await page.locator("#overlayContent").evaluate(e=>e.scrollWidth<=e.clientWidth+1));
      await page.screenshot({path:path.join(out,`wallet-${width}x${height}.png`)});
      // Real click path: missing-tome lock, charge, gear creation, duplicate-click lock.
      await page.evaluate(()=>{const s=window.__GAME_DEBUG__.state();s.tomes={wood:100,ore:100,gold:100};for(const k of Object.keys(s.res))s.res[k][2]=9999;window.__GAME_DEBUG__.renderWorkshop();});
      await page.locator('[data-do="craft"]').click();
      const result=await page.evaluate(()=>{const s=window.__GAME_DEBUG__.state();return {tomes:s.tomes,divineRods:s.gear.filter(g=>g.type==="rod"&&g.tier===4).length};});
      assert.deepEqual(result.tomes,{wood:80,ore:80,gold:60});assert.equal(result.divineRods,1);
      await page.evaluate(()=>window.__GAME_DEBUG__.flushSaveQueue());
      await page.reload();await page.waitForFunction(()=>window.__GAME_DEBUG__?.state()?.tomes?.wood===80);
      assert.equal(await page.evaluate(()=>window.__GAME_DEBUG__.state().gear[0].enh),7);
      await page.getByRole("button",{name:"게임 시작",exact:true}).click();
      await page.evaluate(()=>{
        const g=window.__GAME_DEBUG__,s=g.state();g.startFinalBattle();
        for(const [type,enh]of [["axe",4],["pickaxe",3],["sword",5]]){const item=s.gear.find(i=>i.id===s.equipped[type]);item.tier=3;item.enh=enh;}
        g.render();
      });
      assert(await page.locator("#autoButton").isDisabled());
      assert((await page.locator("#character").getAttribute("src")).endsWith("/sword/idle.png"));
      await page.locator("#scene").click({position:{x:180,y:250}});
      await page.waitForTimeout(300);
      assert(await page.evaluate(()=>window.__GAME_DEBUG__.state().target.hp<10000000));
      await page.evaluate(()=>{const g=window.__GAME_DEBUG__,s=g.state();s.gear.find(i=>i.id===s.equipped.pickaxe).enh=6;g.render();});
      assert((await page.locator("#character").getAttribute("src")).endsWith("/pickaxe/idle.png"));
      await page.screenshot({path:path.join(out,`boss-manual-${width}x${height}.png`)});
      // Reload a legacy auto-ON boss save: no time or HP may be consumed.
      await page.evaluate(()=>{const g=window.__GAME_DEBUG__,s=g.state();s.auto=true;s.lastSeen=Date.now()-60000;localStorage.setItem(g.constants.SAVE_KEY,JSON.stringify(s));});
      await page.reload();await page.waitForFunction(()=>window.__GAME_DEBUG__?.state()?.place==="worldtree");
      assert.equal(await page.evaluate(()=>window.__GAME_DEBUG__.state().auto),false);
      const hpBefore=await page.evaluate(()=>window.__GAME_DEBUG__.state().target.hp);
      await page.getByRole("button",{name:"게임 시작",exact:true}).click();await page.waitForTimeout(1100);
      assert.equal(await page.evaluate(()=>window.__GAME_DEBUG__.state().target.hp),hpBefore);
      await page.evaluate(()=>{const g=window.__GAME_DEBUG__;g.replaceMeta({endingSeen:true,endingCount:12});g.returnToIntroAfterEnding();g.renderProfile();});
      await page.getByRole("button",{name:"게임 시작",exact:true}).click();
      // Skip only the new-game opening in this UI fixture and inspect the profile stack.
      await page.evaluate(()=>{const g=window.__GAME_DEBUG__;g.state().openingSeen=true;g.state().tutorialSeen=true;g.startFinalBattle();});
      await page.getByRole("button",{name:"메뉴 펼치기",exact:true}).click();
      await page.getByRole("button",{name:"마이페이지",exact:true}).click();
      assert.equal(await page.locator('[data-id="easter_egg"] .food-stack').innerText(),"x12");
      await page.locator('[data-id="easter_egg"]').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,`trophy-count-${width}x${height}.png`)});
      // New exchange items use the real purchase and profile click paths.
      await page.evaluate(()=>{
        const g=window.__GAME_DEBUG__,s=g.state();s.lv=90;s.tomes={wood:500,ore:500,gold:500};s.res.wood[2]=1500;s.res.ore[2]=1500;s.res.gold[2]=1500;
        s.secretExchange={windowId:g.secretWindowId(),offers:g.constants.SECRET_EXCHANGE_TEMPLATES.filter(t=>t.id>=17).map(t=>({id:`v125_${t.id}`,templateId:t.id,reward:{...t.reward},costs:t.costs.map(c=>({key:c.key,amount:t.id===20?100:1000})),claimed:false}))};
        g.travel("home");
      });
      await page.getByRole("button",{name:"메뉴 펼치기",exact:true}).click();
      await page.getByRole("button",{name:"제작소",exact:true}).click();
      await page.locator('[data-do="workshop-type"][data-type="secret"]').click();
      await page.locator('[data-do="secret-offer"][data-id="v125_17"]').click();
      await page.locator('[data-do="secret-exchange"]').click();
      assert.equal(await page.evaluate(()=>window.__GAME_DEBUG__.state().tomes.wood),510);
      assert.equal(await page.evaluate(()=>window.__GAME_DEBUG__.state().res.wood[2]),500);
      await page.locator('[data-do="secret-offer"][data-id="v125_20"]').click();
      assert.equal(await page.locator(".detail-copy .value").innerText(),"강화 시 파괴 방지");
      assert((await page.locator(".detail-copy").innerText()).includes("보유시 자동 사용되어 장비 파괴를 1회 방지합니다."));
      assert.equal(await page.locator(".requirements .requirement-row").count(),3);
      await page.waitForFunction(()=>Array.from(document.querySelectorAll("img")).filter(i=>i.getBoundingClientRect().width>0).every(i=>i.complete&&i.naturalWidth>0));
      await page.screenshot({path:path.join(out,`blessing-exchange-${width}x${height}.png`)});
      await page.locator('[data-do="secret-exchange"]').click();
      assert.equal(await page.evaluate(()=>window.__GAME_DEBUG__.blessingCount()),1);
      assert.deepEqual(await page.evaluate(()=>({...window.__GAME_DEBUG__.state().tomes})),{wood:410,ore:400,gold:400});
      await page.locator("#closeButton").click();
      await page.getByRole("button",{name:"메뉴 펼치기",exact:true}).click();
      await page.getByRole("button",{name:"마이페이지",exact:true}).click();
      await page.locator('[data-do="gear-select"][data-id="dark_blessing"]').click();
      assert.equal(await page.locator('[data-id="dark_blessing"] .food-stack').innerText(),"x1");
      assert(await page.locator('[data-do="equip"]').isDisabled());assert(await page.locator('[data-do="discard"]').isDisabled());
      assert.equal(await page.locator(".detail-copy .value").innerText(),"강화 시 파괴 방지");
      assert(await page.locator("#overlayContent").evaluate(e=>e.scrollWidth<=e.clientWidth+1));
      await page.screenshot({path:path.join(out,`blessing-inventory-${width}x${height}.png`)});
      await page.evaluate(()=>window.__GAME_DEBUG__.flushSaveQueue());await page.reload();
      await page.waitForFunction(()=>window.__GAME_DEBUG__?.blessingCount()===1);
      assert.deepEqual(await page.evaluate(()=>({...window.__GAME_DEBUG__.state().tomes})),{wood:410,ore:400,gold:400});
      await page.getByRole("button",{name:"게임 시작",exact:true}).click();
      const checkHeader=async(title)=>{
        assert.equal(await page.locator("#overlayTitle").innerText(),title);
        assert.equal(await page.locator("#overlaySubtitle").count(),0);
        assert.equal(await page.locator(".overlay-header p").count(),0);
        assert.equal(await page.locator("#overlayTitle").evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),22);
        assert(await page.locator(".overlay-header").evaluate(el=>el.scrollWidth<=el.clientWidth+1));
      };
      for(const title of ["지도","제작소","부동산","요리","강화","마이페이지","설정"]){
        await page.getByRole("button",{name:"메뉴 펼치기",exact:true}).click();
        await page.getByRole("button",{name:title,exact:true}).click();await checkHeader(title);
        if(title==="제작소"){
          await page.locator('[data-do="workshop-type"][data-type="secret"]').click();await checkHeader("비밀교환소");
        }
        if(title==="지도"||title==="제작소")await page.screenshot({path:path.join(out,`header-${title==="지도"?"map":"exchange"}-${width}x${height}.png`)});
        await page.locator("#closeButton").click();
      }
      await context.close();
    }
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,"result.txt"),"PASS: mobile/tablet/desktop, 3 crystal areas, images, wallet, recipe charge, old/new save reload, manual boss, strongest equipped weapon, trophy stack, tome/blessing exchange and saved protection stack, all menu headers, named top-area reflection logs\n");
    console.log("Browser v1.2.6 QA: PASS");
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
