"use strict";

// Run inside the existing VM harness to exercise the shipped game, not a copy.
module.exports = async function verifyExpansion({game,assert,element}) {
  let state;
  const reset=()=>{state=game.freshState();game.replaceState(state);return state;};
  assert.equal(game.constants.MAX_LEVEL,150);
  assert.deepEqual({...game.constants.FINAL_BOSS},{hp:10000000,def:20000,reflectMin:75,reflectMax:150});
  assert.deepEqual({...game.constants.TARGET_STATS[3]},{min:30000,max:45000,def:5000,xp:10000});

  reset();state.lv=99;state.xp=game.needXp()-1;game.addXp(1);
  assert.equal(state.lv,100);assert(state.worldGateUnlocked,"level 100 still unlocks the gate");
  game.renderHud();assert.notEqual(element("xpText").textContent,"MAX");
  game.addXp(game.needXp());assert.equal(state.lv,101,"old cap can be passed");
  state.lv=149;state.xp=game.needXp()-1;game.addXp(20000);
  assert.equal(state.lv,150);assert.equal(state.xp,0);game.addXp(1e12);
  assert.equal(state.lv,150);assert.equal(state.xp,0);game.renderHud();assert.equal(element("xpText").textContent,"MAX");

  reset();delete state.tomes;state.lv=100;state.res.wood[2]=4321;
  state.gear[0].tier=4;state.gear[0].enh=7;game.normalizeInventory();
  assert.deepEqual({...state.tomes},{wood:0,ore:0,gold:0});
  assert.equal(state.res.wood[2],4321);assert.equal(state.gear[0].enh,7,"migration preserves existing divine equipment");
  state.tomes={wood:100050,ore:-1,gold:NaN};game.normalizeInventory();
  assert.deepEqual({...state.tomes},{wood:99999,ore:0,gold:0});
  const saved=JSON.parse(JSON.stringify(state));game.replaceState(saved);game.normalizeInventory();
  assert.equal(game.state().tomes.wood,99999,"tomes survive save serialization");

  for(const place of ["forest","mine","dungeon"]){
    reset();game.renderTier({place});const html=element("overlayContent").innerHTML;
    assert.equal((html.match(/data-do="travel"/g)||[]).length,4);
    assert(html.includes('data-grade="3"'));assert(!html.includes("disabled"),"all areas are open at level 1");
    game.travel(place,3);assert.equal(state.grade,3);assert.equal(state.lv,1);game.newTarget();
    assert(state.target.max>=30000&&state.target.max<=45000);assert.equal(state.target.def,5000);assert.equal(state.target.xp,10000);
    assert(game.targetAsset().endsWith("_top.png"));assert.equal(state.ended,false);
  }

  // Exhaustively sample a regular unit interval grid: exact category odds.
  const categories={tome:0,stone:0,resource:0};
  for(let i=0;i<10000;i++)categories[game.topDropKind((i+.5)/10000)]++;
  assert.deepEqual(categories,{tome:500,stone:1000,resource:8500});
  assert.equal(game.topDropKind(.05),"stone");assert.equal(game.topDropKind(.15),"resource");

  for(const [min,max]of [[1,10],[5,15],[1,3]]){
    let low=0,high=0;
    for(let i=0;i<1000;i++){
      const roll=(i+.5)/1000;
      const a=game.rewardCount(min,max,0,roll),b=game.rewardCount(min,max,1,roll);
      assert(a>=min&&b<=max&&b>=a);low+=a;high+=b;
    }
    assert(high>low,"more target HP increases expected quantity for every variable reward");
  }

  // Verify actual awarded inventory, quantities and exclusivity through defeatTarget.
  for(const [place,kind]of [["forest","wood"],["mine","ore"],["dungeon","gold"]]){
    reset();state.place=place;state.grade=3;state.lv=150;state.rngSeed=123456789;
    const observed={tome:0,stone:0,resource:0};
    for(let i=0;i<3000;i++){
      state.tomes={wood:0,ore:0,gold:0};state.stones=[0,0,0];
      for(const k of Object.keys(state.res))state.res[k]=[0,0,0];
      state.target={hp:0,max:30000+(i%3)*7500,def:5000,xp:10000};
      game.defeatTarget(1000,false);
      const t=state.tomes[kind],s=state.stones[2],r=state.res[kind][2];
      assert.equal(Number(t>0)+Number(s>0)+Number(r>0),1,"exactly one reward category");
      if(t){observed.tome++;assert(t>=1&&t<=3);}
      if(s){observed.stone++;assert.equal(s,1);}
      if(r){observed.resource++;assert(r>=5&&r<=15);}
      for(const k of Object.keys(state.res)){
        assert.equal(state.res[k][0]+state.res[k][1],0,"top areas never award lower resources");
        if(k!==kind){assert.equal(state.res[k][2],0);assert.equal(state.tomes[k],0);}
      }
      assert.equal(state.stones[0]+state.stones[1],0);assert.equal(state.ended,false);
    }
    assert(observed.tome>100&&observed.tome<200);assert(observed.stone>230&&observed.stone<370);
  }

  for(const grade of [0,1,2]){
    reset();state.place="forest";state.grade=grade;state.lv=150;state.rngSeed=23456;
    let lower=0,same=0;
    for(let i=0;i<500;i++){
      state.res.wood=[0,0,0];game.dropResource(i%2,1000,false);
      const entries=state.res.wood.map((count,index)=>({count,index})).filter(x=>x.count);
      assert.equal(entries.length,1);const{count,index}=entries[0];
      if(index===grade){same++;assert(count>=1&&count<=10);}
      else {lower++;assert.equal(index,grade-1);assert(count>=5&&count<=15);}
    }
    assert(same>0);if(grade>0)assert(lower>0);
  }

  for(const place of ["forest","mine","dungeon","worldtree"]){
    reset();state.place=place;state.grade=place==="worldtree"?2:3;game.newTarget();
    state.hp=50000;const initialTarget=state.target.hp;
    game.workAction(true,1000);const loss=50000-state.hp;
    assert(loss>=(place==="worldtree"?76:6)&&loss<=(place==="worldtree"?151:21));
    assert.equal(state.target.hp,initialTarget-1,"defense retains minimum one damage");
    state.hp=2;state.auto=true;state.foods[4]=2;state.equippedFood=4;
    game.workAction(true,2000);assert.equal(state.hp,400);assert.equal(state.foods[4],1);assert(state.auto);
    state.hp=2;state.foods[4]=0;state.equippedFood=null;game.workAction(true,3000);
    assert.equal(state.hp,0);assert.equal(state.auto,false);
    state.hp=2;state.target.hp=1;game.workAction(true,4000);
    assert.equal(state.ended,place==="worldtree","only boss defeat triggers ending, including simultaneous zero HP");
  }

  reset();state.place="forest";state.grade=3;state.hp=5000;state.auto=true;state.rngSeed=54321;game.newTarget();
  const initial=JSON.parse(JSON.stringify(state));state.lastSeen=100000;game.settleOffline(110000);
  const offline=JSON.parse(JSON.stringify(state));game.replaceState(initial);
  for(let i=0;i<10;i++)game.workAction(true,101000+i*1000);
  assert.equal(game.state().hp,offline.hp);assert.equal(game.state().target.hp,offline.target.hp);
  assert.equal(game.state().rngSeed,offline.rngSeed,"online and offline reflection use the same seeded RNG");

  reset();state.place="worldtree";state.target={hp:2222222,max:4444444,def:5000,xp:0};game.migrateBalance();
  assert.equal(state.target.hp,5000000);assert.equal(state.target.max,10000000);assert.equal(state.target.def,20000);
  game.migrateBalance();assert.equal(state.target.hp,5000000,"migration is idempotent");
  state.target.hp=1234567;game.migrateBalance();assert.equal(state.target.hp,1234567,"current-version reload does not round HP upward");
  game.travel("home");game.startFinalBattle();assert.equal(state.target.hp,10000000,"retreat still fully resets boss");

  for(const type of Object.keys(game.constants.GEAR_COST)){
    reset();const cost=game.constants.GEAR_COST[type][4];
    for(const kind of ["wood","ore","gold"])state.res[kind][2]=9999;
    const before=JSON.stringify(state.res);assert.equal(game.canPay(cost),false);
    assert.equal(game.pay(cost),false);assert.equal(JSON.stringify(state.res),before,"missing tome never consumes resources");
    state.tomes={wood:100,ore:100,gold:100};assert(game.canPay(cost));assert(game.pay(cost));
    for(const kind of ["wood","ore","gold"])assert.equal(state.tomes[kind],100-(cost[`tome_${kind}`]||0));
    assert.equal(game.inventoryItemCount(),5,"tomes are wallet materials, not inventory slots");
  }
  reset();const wallet=game.walletHtml();
  assert.equal((wallet.match(/tome-card/g)||[]).length,3);
  assert(wallet.indexOf("목의 비의서")>wallet.lastIndexOf("강화돌"));
  await game.flushSaveQueue();
  console.log("v1.2.2: level cap, saves, open areas, drop odds, HP-weighted quantities, reflection, recipes and wallet OK");
};
