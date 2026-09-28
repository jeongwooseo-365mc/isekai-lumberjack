"use strict";
module.exports=async function({game:g,element,localStorage,assert:a}){
 let s;const reset=(eggs=0)=>{g.returnToIntroAfterEnding();g.replaceMeta({endingSeen:eggs>0,endingCount:eggs,lastEndingId:null});s=g.freshState();s.openingSeen=true;s.tutorialSeen=true;g.replaceState(s);};
 reset();a.equal(g.constants.MAX_LEVEL,200);a.equal(g.constants.ANCIENT_XP,10000000);a.equal(g.constants.ENDING_REVIEW_RELEASE,false);a.equal(g.refreshWorldGateUnlock(),false);a.equal(s.lv,1);a.equal(s.reviewGateUnlocked,undefined);
 a.deepEqual({...g.doorRequirements()},{token_wood:1,token_ore:1,token_gold:1});a(!g.canEnterEnding());
 s.worldGateUnlocked=true;s.reviewGateUnlocked=true;s.place='ancient_golem';s.auto=true;s.target={hp:500,max:10000000,def:20000,xp:10000000};localStorage.setItem(g.constants.SAVE_KEY,JSON.stringify(s));await g.init();s=g.state();
 a.equal(s.worldGateUnlocked,false,'an early QA gate is revoked on save load');a.equal(s.reviewGateUnlocked,undefined);a.equal(s.place,'home','the locked cave is exited on save load');a.equal(s.target,null);a.equal(s.auto,false);a.equal(s.lv,1,'QA migration keeps player progress');
 reset();s.lv=100;s.worldGateUnlocked=true;s.reviewGateUnlocked=true;s.place='cave_entrance';a(g.refreshWorldGateUnlock());a.equal(s.place,'cave_entrance','qualified players retain their cave position');a.equal(s.reviewGateUnlocked,undefined);
 reset();for(const item of s.gear)item.tier=4;a(g.refreshWorldGateUnlock(),'five divine gear types unlock the gate before level 100');s.gear.pop();a(g.refreshWorldGateUnlock(),'a legitimate gate stays unlocked after discarding gear');
 reset();s.lv=100;a(g.refreshWorldGateUnlock());g.startFinalBattle();a.equal(s.place,'cave_entrance');a.equal(s.target,null);
 a(g.audioState().bgmSrc.endsWith('/cave_entrance.ogg'));
 s.hp=100;s.house=2;g.sceneAction({target:{closest:()=>null}});a(s.resting&&s.auto);a(element('scene').style.backgroundImage.includes('cave_entrance_camp.png'));
 s.lastSeen=100000;g.settleOffline(103000);a.equal(s.hp,115,'cave rest uses the selected house heal per second, including offline time');
 s.house=4;g.settleOffline(105000);a.equal(s.hp,315,'changing the designated house also changes cave rest healing');
 g.toggleAuto();a(!s.resting&&!s.auto);g.sceneAction({target:{closest:()=>null}});a(s.resting);g.travel('worldtree');a(!s.resting&&!s.auto,'leaving the cave rest area stops healing');
 for(const [place,track] of [['worldtree','ancient_world_tree'],['ancient_golem','ancient_iron_golem'],['ancient_beast','ancient_beast']]){g.travel(place);a(g.audioState().bgmSrc.endsWith(`/${track}.ogg`));}
 for(const [place,weapon,kind]of [['worldtree','axe','wood'],['ancient_golem','pickaxe','ore'],['ancient_beast','sword','gold']]){
  reset();s.lv=150;s.hp=100000;g.travel(place);a.equal(g.currentWeaponType(),weapon);a.equal(s.target.xp,10000000);s.target.hp=1;g.workAction(true);a.equal(s.xp,10000000);a.equal(g.stackCount(`token_${kind}`),1);a.equal(s.ended,false);a.equal(s.target.hp,10000000);
  s.target.hp=123;g.travel('cave_entrance');g.travel(place);a.equal(s.target.hp,10000000);
  s.auto=true;s.lastSeen=100000;s.hp=10000;const initial=JSON.parse(JSON.stringify(s));g.settleOffline(110000);const offline=JSON.parse(JSON.stringify(s));g.replaceState(initial);for(let i=1;i<=10;i++)g.workAction(true,100000+i*1000);a.equal(g.state().hp,offline.hp);a.equal(g.state().target.hp,offline.target.hp);a.equal(g.state().rngSeed,offline.rngSeed);
 }
 for(const [r,k]of [[0,'token'],[.29999,'token'],[.3,'tome'],[.79999,'tome'],[.8,'blessing'],[.89999,'blessing'],[.9,'transcendence'],[.9999,'transcendence']]){a.equal(g.ancientDropKind(r,true),k);a.equal(g.ancientDropKind(r,false),'token');}
 reset(1);s.lv=200;s.place='ancient_golem';s.rngSeed=874211;g.newTarget();const counts={token:0,tome:0,blessing:0,transcendence:0};
 for(let i=0;i<4000;i++){
  if(s.tomes.ore>90000)s.tomes.ore=0;
  const before={token:g.stackCount('token_ore'),tome:s.tomes.ore,blessing:g.blessingCount(),transcendence:g.stackCount('transcendence')};g.defeatAncient(1000+i,false);
  const after={token:g.stackCount('token_ore'),tome:s.tomes.ore,blessing:g.blessingCount(),transcendence:g.stackCount('transcendence')};const changed=Object.keys(before).filter(k=>after[k]>before[k]);a.equal(changed.length,1);const k=changed[0],n=after[k]-before[k];counts[k]++;a(k==='tome'?n>=50&&n<=100:n===1);
 }
 for(const [k,rate]of Object.entries({token:.3,tome:.5,blessing:.1,transcendence:.1}))a(Math.abs(counts[k]/4000-rate)<.03);
 reset();for(const [i,fish,heal]of [[2,'숭어',1000],[3,'연어',2000],[4,'랍스터',5000]]){s.lv=200;s.hp=0;s.fish[fish]=100;g.selectRecipe(i);g.cookSelected();a.equal(s.fish[fish],0);g.consumeFood(i,{simulated:true});a.equal(s.hp,heal);}
 const offer=g.constants.SECRET_EXCHANGE_TEMPLATES.find(o=>o.id===10);a.equal(offer.reward.amount,1);a.equal(offer.costs[0].min,1400);a.equal(offer.costs[0].max,2600);
 s.lv=90;s.secretExchange={windowId:g.secretWindowId(),offers:[0,1,2,3].map(i=>({id:`old${i}`,templateId:10,reward:{key:'food2',amount:4},costs:[{key:'wood0',amount:1000}],claimed:i===0}))};g.ensureSecretExchange(Date.now(),false);a(s.secretExchange.offers[0].claimed);a.equal(s.secretExchange.offers[0].costs[0].amount,2000);g.ensureSecretExchange(Date.now(),false);a.equal(s.secretExchange.offers[0].costs[0].amount,2000);
 s.secretExchange.balanceVersion='1.2.7';g.ensureSecretExchange(Date.now(),false);a.equal(s.secretExchange.offers[0].costs[0].amount,2000);
 s.secretExchange.balanceVersion='1.2.9';g.ensureSecretExchange(Date.now(),false);a.equal(s.secretExchange.offers[0].costs[0].amount,2000,'v1.2.9 saved offers keep their prices on v1.3.0');a.equal(s.secretExchange.balanceVersion,'1.3.0');
 reset();const axe=s.gear.find(x=>x.type==='axe');axe.tier=4;axe.enh=10;a.equal(g.enhChance(axe),50);a.equal(g.maxEnhancement(axe),11);const old=g.gearPower(axe);axe.enh=11;a.equal(g.gearPower(axe)-old,50000);axe.enh=10;
 g.addStack('transcendence',3);g.selectEnhance(axe.id);s.rngSeed=0;const stones=JSON.stringify(s.stones);g.enhanceNow();g.enhanceNow();await new Promise(r=>setTimeout(r,4100));a.equal(axe.enh,11);a.equal(g.stackCount('transcendence'),2);a.equal(JSON.stringify(s.stones),stones);g.renderEnhance();a(element('overlayContent').innerHTML.includes('최대 강화입니다'));g.enhanceNow();a.equal(g.stackCount('transcendence'),2);
 const fail=Array.from({length:10000},(_,i)=>i).find(seed=>((Math.imul(1664525,seed)+1013904223)>>>0)/4294967296>.99);
 axe.enh=10;s.rngSeed=fail;g.addStack('blessing',1);g.enhanceNow();await new Promise(r=>setTimeout(r,4100));a(s.gear.includes(axe));a.equal(axe.enh,10);a.equal(g.blessingCount(),0);a.equal(g.stackCount('transcendence'),1);
 s.rngSeed=fail;g.enhanceNow();await new Promise(r=>setTimeout(r,4100));a(!s.gear.includes(axe));a.equal(g.stackCount('transcendence'),0);
 for(const eggs of [0,1]){
  reset(eggs);s.lv=100;g.refreshWorldGateUnlock();g.travel('cave_entrance');g.renderOldDoor();a(!g.canEnterEnding());a(element('overlayContent').innerHTML.includes('고대의 증표를 사용하여 문을 엽니다'));
  const required=eggs?100:1;a.deepEqual({...g.doorRequirements()},{token_wood:required,token_ore:required,token_gold:required});for(const kind of ['wood','ore','gold'])g.addStack(`token_${kind}`,required);g.renderOldDoor();a(g.canEnterEnding());
  const promise=g.returnThroughDoor();element('dialogConfirm').click();await promise;a(s.ended);a.equal(s.endingKind,eggs?'true':'normal');for(const kind of ['wood','ore','gold'])a.equal(g.stackCount(`token_${kind}`),0,'opening the door consumes the required tokens');await g.flushSaveQueue();a.equal(JSON.parse(localStorage.getItem(g.constants.SAVE_KEY)).endingKind,s.endingKind);const snapshot=JSON.stringify(s);await g.finalizeEnding(element('endingActions'));a.equal(g.endingCount(),eggs+1);
  g.returnToIntroAfterEnding();localStorage.setItem(g.constants.SAVE_KEY,snapshot);await g.init();await g.finalizeEnding(element('endingActions'));a.equal(g.endingCount(),eggs+1,'crash recovery awards once');
 }
 g.returnToIntroAfterEnding();console.log('v1.3.0 cave, 10M XP, exclusive rewards, food, +11, regular ending conditions and durable endings: OK');
};
