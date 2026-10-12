"use strict";
module.exports=async function({game:g,element,localStorage,assert:a}){
  const reset=(eggs=1)=>{g.replaceMeta({endingSeen:eggs>0,endingCount:eggs,lastEndingId:null});const s=g.freshState();s.lv=150;s.hp=100000;s.openingSeen=true;s.tutorialSeen=true;g.replaceState(s);return s;};
  let s=reset(0);
  for(const place of Object.keys(g.constants.ANCIENT)){s.place=place;g.newTarget();g.defeatAncient(1000,false);}
  a.equal(g.refreshAncientShopUnlock(),false,"three defeats alone do not unlock the shop");
  s=reset();a.equal(g.refreshAncientShopUnlock(),false,"an egg alone does not unlock the shop");
  s.place="worldtree";g.newTarget();g.defeatAncient(1000,false);g.defeatAncient(2000,false);
  a.equal(g.refreshAncientShopUnlock(),false,"repeating one boss is insufficient");
  s.place="ancient_golem";g.newTarget();g.defeatAncient(3000,false);a.equal(g.refreshAncientShopUnlock(),false);
  s.place="ancient_beast";g.newTarget();s.target.hp=1;s.auto=true;s.lastSeen=100000;g.settleOffline(101000);
  a.equal(s.ancientDefeated.ancient_beast,true,"offline victory records the third boss");
  a.equal(g.refreshAncientShopUnlock(),true);s.auto=false;
  const items=g.ancientShopItems();a.equal(items.length,8);
  const expected=[
    ["axe",{wood2:5000,gold2:5000,tome_wood:250,stone2:50}],
    ["pickaxe",{ore2:5000,gold2:5000,tome_ore:250,stone2:50}],
    ["sword",{wood2:5000,ore2:5000,tome_gold:250,stone2:50}],
    ["rod",{wood2:1000,ore2:1000,gold2:2000,tome_ore:50,tome_wood:50,tome_gold:100,stone2:50}],
    ["armor",{wood2:2000,ore2:2000,gold2:1000,tome_ore:50,tome_wood:50,tome_gold:100,stone2:50}],
    ["wood",{tome_wood:10}],["ore",{tome_ore:10}],["gold",{tome_gold:10}],
  ];
  const fund=()=>{s.tomes={wood:1000,ore:1000,gold:1000};s.stones[2]=1000;for(const kind of ["wood","ore","gold"])s.res[kind][2]=20000;};
  for(const [id,costs]of expected){
    const item=items.find(item=>item.id===id);a.deepEqual(Object.fromEntries(item.costs.map(c=>[c.key,c.amount])),costs);
    fund();g.selectAncientShopItem(id);
    const before=Object.fromEntries(item.costs.map(c=>[c.key,g.secretItemCount(c.key)])),count=s.gear.length;
    a(g.exchangeSelectedAncientShop());
    for(const cost of item.costs)a.equal(g.secretItemCount(cost.key),before[cost.key]-cost.amount);
    if(item.gearType){a.equal(s.gear.length,count+1);const gear=s.gear.at(-1);a.equal(gear.type,id);a.equal(gear.tier,4);a.equal(gear.enh,5);a(s.unseenGearIds.includes(gear.id));}
    else{a.equal(s.res[id][2],21000);a.equal(item.reward.amount,1000);}
  }
  fund();g.selectAncientShopItem("axe");const n=s.gear.length;
  a(g.exchangeSelectedAncientShop());a(g.exchangeSelectedAncientShop());a.equal(s.gear.length,n+2,"the permanent shop permits repeat purchases");
  s.tomes.wood=249;const before=JSON.stringify({res:s.res,tomes:s.tomes,stones:s.stones,gear:s.gear});
  a.equal(g.exchangeSelectedAncientShop(),false);a.equal(JSON.stringify({res:s.res,tomes:s.tomes,stones:s.stones,gear:s.gear}),before,"missing material does not debit any balance");
  fund();while(g.inventoryItemCount()<g.constants.GEAR_CAPACITY)s.gear.push({id:`full-${s.gear.length}`,type:"axe",tier:1,enh:0});
  const wood=s.res.wood[2];a.equal(g.exchangeSelectedAncientShop(),false);a.equal(s.res.wood[2],wood,"full storage preserves costs");
  g.selectAncientShopItem("wood");a(g.exchangeSelectedAncientShop(),"resources need no gear slot");a.equal(s.res.wood[2],wood+1000);
  s.res.wood[2]=g.constants.MAX_ITEM_COUNT-999;const tomes=s.tomes.wood;
  a.equal(g.exchangeSelectedAncientShop(),false);a.equal(s.tomes.wood,tomes,"a capped reward cannot consume tomes");
  g.renderWorkshop();a(element("overlayContent").innerHTML.includes("ancient-tab active"));a(!element("overlayContent").innerHTML.includes("data-secret-countdown"));
  s.place="home";s.auto=false;await g.flushSaveQueue();
  localStorage.setItem("isekai_lumberjack_meta",JSON.stringify({endingSeen:true,endingCount:1}));
  localStorage.setItem(g.constants.SAVE_KEY,JSON.stringify(s));await g.init();s=g.state();
  a(g.refreshAncientShopUnlock(),"unlock survives restart");a(Object.values(s.ancientDefeated).every(Boolean));a(s.gear.some(item=>item.type==="armor"&&item.tier===4&&item.enh===5));
  s=reset();delete s.ancientDefeated;delete s.ancientShopUnlocked;g.addStack("token_wood",100);g.addStack("token_ore",100);g.addStack("token_gold",100);g.migrateBalance();
  a.equal(g.refreshAncientShopUnlock(),false,"old token holdings do not fabricate historical victories");
  a(Object.values(s.ancientDefeated).every(v=>v===false));g.selectAncientShopItem("axe");g.renderWorkshop();
  a(!element("overlayContent").innerHTML.includes("고대 상점"));a.equal(g.exchangeSelectedAncientShop(),false);
  a.equal(g.freshState().ancientShopUnlocked,false,"a new run resets the shop unlock and victories");
  console.log("v1.3.2 stage 2: ancient unlock, offline kills, 8 recipes, repeat trades, limits and saves OK");
};
