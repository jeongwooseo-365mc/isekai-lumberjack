"use strict";

module.exports=async function testV131Stage12({game:g,element,localStorage,assert:a}){
  const saveKey=g.constants.SAVE_KEY;
  const old=g.freshState();
  delete old.foodCatalogVersion;
  old.foods=[1,2,3,4,5];
  old.equippedFood=3;
  old.unseenFoodIndices=[2,4];
  const now=Date.now();
  old.secretExchange={windowId:g.secretWindowId(now),balanceVersion:"1.3.0",offers:[
    {id:"old-grilled",templateId:10,reward:{key:"food2",amount:1},costs:[{key:"wood0",amount:1800}],claimed:false},
    {id:"old-salmon",templateId:24,reward:{key:"food3",amount:2},costs:[{key:"wood2",amount:700}],claimed:true},
    {id:"old-lobster",templateId:25,reward:{key:"food4",amount:2},costs:[{key:"ore2",amount:800}],claimed:false},
    {id:"old-stone",templateId:1,reward:{key:"stone0",amount:500},costs:[{key:"stone1",amount:40}],claimed:true},
  ]};
  localStorage.setItem(saveKey,JSON.stringify(old));
  await g.init();
  let s=g.state();
  a.equal(s.foodCatalogVersion,2);
  a.deepEqual(Array.from(s.foods),[1,2,0,3,4,5]);
  a.equal(s.equippedFood,4,"the equipped salmon remains salmon");
  a.deepEqual(Array.from(s.unseenFoodIndices),[3,5]);
  a.deepEqual(Array.from(s.secretExchange.offers,o=>o.reward.key),["food3","food4","food5","stone0"]);
  a.equal(s.secretExchange.offers[0].costs[0].amount,1800,"saved offers retain their quoted prices");
  a.equal(s.secretExchange.offers[1].claimed,true,"a claimed offer stays claimed");
  a.equal(g.migrateFoodCatalog(),false,"food migration runs once");
  a.deepEqual(Array.from(s.foods),[1,2,0,3,4,5]);

  s=g.freshState();g.replaceState(s);
  s.fish["민어"]=200;s.hp=0;g.selectRecipe(2);g.cookSelected();
  a.equal(s.fish["민어"],0);a.equal(s.foods[2],1);
  g.consumeFood(2,{simulated:true});a.equal(s.hp,600,"fish tang restores 600 HP");
  g.renderCooking();a(element("overlayContent").innerHTML.includes("어탕"));

  const templates=g.constants.SECRET_EXCHANGE_TEMPLATES;
  a.equal(templates.length,26);a.equal(new Set(templates.map(t=>t.id)).size,26);
  const byId=id=>templates.find(t=>t.id===id);
  for(const [id,level,key,amount,costs,min,max]of [
    [21,90,"transcendence",1,["tome_wood","tome_ore","tome_gold"],400,800],
    [22,60,"food1",5,["wood1","ore1","gold1"],700,1300],
    [23,60,"food2",5,["wood1","ore1","gold1"],1400,2600],
    [24,90,"food4",2,["wood2","ore2","gold2"],700,1300],
    [25,90,"food5",2,["wood2","ore2","gold2"],1400,2600],
    [26,90,"stone2",500,["tome_wood","tome_ore","tome_gold"],10,20],
  ]){
    const t=byId(id);a.equal(t.minLevel,level);a.equal(t.reward.key,key);a.equal(t.reward.amount,amount);
    a.deepEqual(Array.from(t.randomCostKeys||t.costs.map(c=>c.key)),costs);
    a(t.costs.every(c=>c.min===min&&c.max===max));
  }
  for(const [level,bonus]of [[30,[1,3,4,5,11,12,13]],[60,[2,6,7,8,14,15,16]],[90,[17,18,19,20,21,26]]]){
    const hits=new Map();s.rngSeed=783219+level;
    for(let i=0;i<800;i++){
      const offers=g.createSecretExchange(`v131-${level}-${i}`,level).offers;
      a.equal(offers.length,4);a.equal(new Set(offers.map(o=>o.templateId)).size,4);
      for(const o of offers){
        a(byId(o.templateId).minLevel<=level);hits.set(o.templateId,(hits.get(o.templateId)||0)+1);
        for(const c of o.costs){const t=byId(o.templateId),rule=t.costs[o.costs.indexOf(c)];a(c.amount>=rule.min&&c.amount<=rule.max);a.equal(c.amount%(rule.step||10),0);}
        if(o.templateId===26)a(["tome_wood","tome_ore","tome_gold"].includes(o.costs[0].key));
      }
    }
    const pool=templates.filter(t=>t.minLevel<=level);
    const bonusPerItem=bonus.reduce((sum,id)=>sum+(hits.get(id)||0),0)/bonus.length;
    const ordinary=pool.filter(t=>!bonus.includes(t.id));
    const ordinaryPerItem=ordinary.reduce((sum,t)=>sum+(hits.get(t.id)||0),0)/ordinary.length;
    a(bonusPerItem>ordinaryPerItem*1.6,`level ${level} 3:1 weights favor its designated items`);
  }
  s=g.freshState();g.replaceState(s);s.lv=90;
  const trade=(reward,costs)=>{
    const offer={id:"new-trade",reward,costs,claimed:false};
    s.secretExchange={windowId:g.secretWindowId(),balanceVersion:"1.3.0",offers:[offer,...[1,2,3].map(i=>({id:`claimed${i}`,reward:{key:"wood0",amount:1},costs:[],claimed:true}))]};
    g.selectSecretOffer(offer.id);return g.exchangeSelectedSecret();
  };
  s.tomes={wood:400,ore:400,gold:399};
  const tomeCosts=["wood","ore","gold"].map(kind=>({key:`tome_${kind}`,amount:400}));
  a.equal(trade({key:"transcendence",amount:1},tomeCosts),false);
  a.equal(s.tomes.wood,400);
  s.tomes.gold=400;a(trade({key:"transcendence",amount:1},tomeCosts));
  a.equal(g.stackCount("transcendence"),1);a.deepEqual({...s.tomes},{wood:0,ore:0,gold:0});
  s.tomes.wood=17;a(trade({key:"stone2",amount:500},[{key:"tome_wood",amount:17}]));
  a.equal(s.stones[2],500);a.equal(s.tomes.wood,0);
  s.res.ore[1]=1450;a(trade({key:"food2",amount:5},[{key:"ore1",amount:1450}]));
  a.equal(s.foods[2],5);a.equal(s.res.ore[1],0);
  console.log("v1.3.1 stage 1-2 recipe, saved foods/offers, 3:1 exchange and new trades: OK");
};
