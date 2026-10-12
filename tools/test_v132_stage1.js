"use strict";

module.exports=async function({game:g,localStorage,assert:a}){
  let s=g.freshState();g.replaceState(s);s.rngSeed=132001;
  const templates=g.constants.SECRET_EXCHANGE_TEMPLATES;
  const foodTemplates=templates.filter(t=>t.reward.key.startsWith("food"));
  const counts=new Map(foodTemplates.map(t=>[t.id,[0,0,0,0,0]]));
  let savedOffer;
  for(let i=0;i<5000;i++){
    const offers=g.createSecretExchange(`food-batches-${i}`,90).offers;
    for(const offer of offers){
      const template=templates.find(t=>t.id===offer.templateId);
      if(!counts.has(template.id))continue;
      const multiple=offer.reward.amount/template.reward.amount;
      a(Number.isInteger(multiple)&&multiple>=1&&multiple<=5);
      counts.get(template.id)[multiple-1]++;
      offer.costs.forEach((cost,index)=>{
        const rule=template.costs[index];
        a(cost.amount/multiple>=rule.min&&cost.amount/multiple<=rule.max);
        a.equal(cost.amount%((rule.step||10)*multiple),0);
        a(template.randomCostKeys.includes(cost.key));
      });
      if(template.id===25&&multiple===5)savedOffer=JSON.parse(JSON.stringify(offer));
    }
  }
  for(const [id,hits]of counts){
    const total=hits.reduce((sum,n)=>sum+n,0);
    a(hits.every(n=>n>0),`food ${id} offers every multiplier`);
    a(hits.every(n=>Math.abs(n/total-.2)<.07),`food ${id} has uniform 1-5 multipliers`);
  }
  for(const [level,bonusId,ordinaryId]of [[59,1,2],[60,1,3],[89,1,3],[90,2,3]]){
    s.rngSeed=132000+level;let bonusHits=0,ordinaryHits=0;
    for(let i=0;i<1500;i++){
      const offers=g.createSecretExchange(`weight-boundary-${level}-${i}`,level).offers;
      bonusHits+=offers.filter(o=>o.templateId===bonusId).length;
      ordinaryHits+=offers.filter(o=>o.templateId===ordinaryId).length;
    }
    if(level===59)a.equal(ordinaryHits,0,"mid stones remain locked before level 60");
    else a(bonusHits>ordinaryHits*1.6,`level ${level} adds its lower stone to weighted offers`);
  }
  a(savedOffer);a.equal(savedOffer.reward.amount,10);
  s=g.freshState();g.replaceState(s);s.lv=90;s.openingSeen=true;s.tutorialSeen=true;
  const cost=savedOffer.costs[0];
  const resource=cost.key.startsWith("wood")?"wood":cost.key.startsWith("ore")?"ore":"gold";
  s.res[resource][2]=cost.amount;
  const offerId=savedOffer.id;
  s.secretExchange={windowId:g.secretWindowId(),balanceVersion:"1.3.1",offers:[savedOffer,...[1,2,3].map(i=>({id:`already-claimed-${i}`,reward:{key:"wood0",amount:1},costs:[],claimed:true}))]};
  const snapshot=JSON.stringify(s.secretExchange.offers),windowId=s.secretExchange.windowId;
  localStorage.setItem(g.constants.SAVE_KEY,JSON.stringify(s));await g.init();s=g.state();
  a.equal(JSON.stringify(s.secretExchange.offers),snapshot,"reloading preserves multiplied and previously claimed offers");
  a.equal(s.secretExchange.windowId,windowId);a.equal(s.secretExchange.balanceVersion,"1.3.2","only the balance metadata changes on upgrade");
  g.selectSecretOffer(offerId);a(g.exchangeSelectedSecret());
  a.equal(s.foods[5],10);a.equal(s.res[resource][2],0);
  a(s.secretExchange.offers[0].claimed);a.equal(g.exchangeSelectedSecret(),false,"a batch cannot be purchased twice");
  console.log("v1.3.2 stage 1: stone weight boundaries, uniform food batches, scaled costs and save/trade persistence OK");
};
