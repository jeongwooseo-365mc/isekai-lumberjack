"use strict";

module.exports=async function testV125({game,element,localStorage,assert}){
  let s;
  const reset=()=>{game.returnToIntroAfterEnding();s=game.state();s.lv=90;s.tutorialSeen=true;return s;};
  reset();assert.equal(game.constants.ARMOR_HP[4],9000);
  const armor=s.gear.find(g=>g.type==="armor");armor.tier=4;assert.equal(game.gearPower(armor),9000);armor.enh=4;assert.equal(game.gearPower(armor),16200);
  assert.deepEqual({...game.constants.HOUSES[4].cost},{gold1:49999,gold2:9999});
  s.res.gold=[0,49998,9999];assert.equal(game.canPay(game.constants.HOUSES[4].cost),false);s.res.gold[1]++;assert(game.pay(game.constants.HOUSES[4].cost));assert.deepEqual(Array.from(s.res.gold),[0,0,0]);
  s.hp=20775;game.migrateBalance();assert.equal(s.hp,18975,"old armor HP is capped at the new maximum");
  for(const place of ["forest","mine","dungeon"]){
    s.place=place;s.grade=3;game.newTarget();assert.equal(s.target.xp,13000);game.renderTier(place);assert(element("overlayContent").innerHTML.includes("EXP 13k"));
    s.target.xp=place==="mine"?15000:10000;s.target.hp=12345;game.migrateBalance();assert.equal(s.target.xp,13000);assert.equal(s.target.hp,12345);
    const xp=s.xp;game.defeatTarget(Date.now(),false);assert.equal(s.xp-xp,13000,"all top areas award the adjusted XP after migration");
  }
  for(let hour=0;hour<24;hour+=3){
    const at=new Date(2026,8,17,hour,0,0).getTime(),next=new Date(2026,8,17,hour+3,0,0).getTime();
    assert.equal(game.secretResetAt(at),next);assert.equal(game.secretResetAt(next-1),next);
    assert.notEqual(game.secretWindowId(at),game.secretWindowId(at-1));
    assert.equal(game.secretWindowId(at),game.secretWindowId(next-1));
  }
  reset();const now=Date.now();game.ensureSecretExchange(now,false);const id=game.secretWindowId(now);
  s.secretExchange.windowId="2026-09-17-0";assert(game.ensureSecretExchange(now,false),"old six-hour inventory cannot collide with a new window");
  s.rngSeed=987654321;const seen=new Set(),samples={17:[],18:[],19:[],20:[]};
  for(let i=0;i<1200;i++){
    assert(game.createSecretExchange(id,89).offers.every(o=>o.templateId<17));
    for(const o of game.createSecretExchange(id,90).offers){
      if(o.templateId<17)continue;seen.add(o.templateId);
      assert.equal(o.reward.amount,o.templateId===20?1:10);
      for(const c of o.costs){assert(Number.isInteger(c.amount));assert(c.amount>=(o.templateId===20?100:500)&&c.amount<=(o.templateId===20?400:1500));samples[o.templateId].push(c.amount);}
    }
  }
  assert.deepEqual([...seen].sort(),[17,18,19,20]);
  for(const [id,values]of Object.entries(samples)){const mean=values.reduce((a,b)=>a+b,0)/values.length;assert(Math.abs(mean-(id==="20"?250:1000))<35,"normal prices concentrate around the midpoint");}
  const templates=game.constants.SECRET_EXCHANGE_TEMPLATES;
  for(const [key,cost]of [["tome_wood","wood2"],["tome_ore","ore2"],["tome_gold","gold2"]])assert.equal(templates.find(t=>t.reward.key===key).costs[0].key,cost);
  const trade=(key,costs,amount=1)=>{
    const at=Date.now(),offer={id:"requested",reward:{key,amount},costs,claimed:false};
    s.secretExchange={windowId:game.secretWindowId(at),offers:[offer,...[1,2,3].map(i=>({id:`claimed${i}`,reward:{key:"wood0",amount:1},costs:[],claimed:true}))]};
    game.selectSecretOffer(offer.id);return game.exchangeSelectedSecret(at);
  };
  reset();s.res.wood[2]=500;assert(trade("tome_wood",[{key:"wood2",amount:500}],10));assert.equal(s.tomes.wood,10);assert.equal(s.res.wood[2],0);
  assert.equal(game.exchangeSelectedSecret(Date.now()),false,"one offer cannot be claimed twice");
  s.tomes={wood:100,ore:100,gold:99};const costs=["wood","ore","gold"].map(k=>({key:`tome_${k}`,amount:100}));
  assert.equal(trade("dark_blessing",costs),false);assert.deepEqual({...s.tomes},{wood:100,ore:100,gold:99},"missing one tome must not charge any currency");
  s.tomes.gold=100;
  while(game.inventoryItemCount()<40)s.gear.push({id:`full${s.gear.length}`,type:"axe",tier:0,enh:0});
  assert.equal(trade("dark_blessing",costs),false);assert.equal(s.tomes.gold,100,"full inventory does not spend tomes");
  s.gear.pop();assert(trade("dark_blessing",costs));assert.equal(game.blessingCount(),1);assert.equal(game.inventoryItemCount(),40);assert.deepEqual({...s.tomes},{wood:0,ore:0,gold:0});
  s.tomes={wood:400,ore:400,gold:400};assert(trade("dark_blessing",costs));assert.equal(game.blessingCount(),2,"an existing stack can grow in a full inventory");assert.equal(game.inventoryItemCount(),40);
  const blessing=s.gear.find(g=>g.type==="blessing");game.selectGear(blessing.id);game.renderProfile();assert(element("overlayContent").innerHTML.includes('class="food-stack">x2'));
  assert(element("overlayContent").innerHTML.includes("강화 시 파괴 방지"));await game.discardSelected();assert.equal(game.blessingCount(),2);
  game.selectEnhance(blessing.id);game.enhanceNow();assert.equal(game.blessingCount(),2,"blessing cannot itself be enhanced or manually consumed");
  await game.flushSaveQueue();localStorage.setItem(game.constants.SAVE_KEY,JSON.stringify(s));await game.init();s=game.state();assert.equal(game.blessingCount(),2);assert.equal(s.gear.filter(g=>g.type==="easteregg").length,1,"trophy and blessing coexist after reload");

  // Drive the real four-second enhancement path with deterministic success/failure rolls.
  const failingSeed=Array.from({length:10000},(_,i)=>i).find(seed=>((Math.imul(1664525,seed)+1013904223)>>>0)/4294967296>.99);
  assert.notEqual(failingSeed,undefined);
  const enhance=async(item,success)=>{s.stones=[99999,99999,99999];s.rngSeed=success?0:failingSeed;game.selectEnhance(item.id);game.enhanceNow();game.enhanceNow();await new Promise(r=>setTimeout(r,4100));};
  const axe=s.gear.find(g=>g.id===s.equipped.axe);axe.tier=3;axe.enh=4;
  await enhance(axe,false);assert(s.gear.includes(axe));assert.equal(axe.enh,4);assert.equal(game.blessingCount(),1);assert.equal(s.equipped.axe,axe.id);
  await enhance(axe,true);assert.equal(axe.enh,5);assert.equal(game.blessingCount(),1,"success keeps the blessing");
  const pick=s.gear.find(g=>g.id===s.equipped.pickaxe);assert.equal(pick.tier,0);await enhance(pick,false);assert(s.gear.includes(pick));assert.equal(game.blessingCount(),1,"naturally safe starter failures keep the blessing");
  await enhance(axe,false);assert(s.gear.includes(axe));assert.equal(axe.enh,5);assert.equal(game.blessingCount(),0);assert(!s.gear.some(g=>g.type==="blessing"));assert(!s.unseenGearIds.includes(blessing.id));
  await enhance(axe,false);assert(!s.gear.includes(axe),"without a blessing the original destruction rule remains");assert.notEqual(s.equipped.axe,axe.id);
  await game.flushSaveQueue();await game.init();assert.equal(game.blessingCount(),0,"consumed protections stay consumed on reload");
  console.log("v1.2.5 balance, three-hour windows, level gates, normal prices, trades, stacks and enhancement protection: OK");
};
