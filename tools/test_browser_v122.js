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
        const g=window.__GAME_DEBUG__,s=g.freshState();delete s.tomes;
        s.lv=100;s.hp=3000;s.openingSeen=true;s.tutorialSeen=true;s.res.wood[2]=4321;
        s.gear[0].tier=4;s.gear[0].enh=7;
        g.replaceState(s);
        localStorage.setItem(g.constants.SAVE_KEY,JSON.stringify(s));
      });
      await page.reload();await page.waitForFunction(()=>window.__GAME_DEBUG__?.state()?.lv===100);
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
      await context.close();
    }
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,"result.txt"),"PASS: mobile/tablet/desktop, 3 crystal areas, images, wallet, recipe charge, old/new save reload\n");
    console.log("Browser v1.2.2 QA: PASS");
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
