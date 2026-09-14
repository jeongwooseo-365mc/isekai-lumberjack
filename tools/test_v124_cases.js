"use strict";

module.exports=async function testV124({game,element,localStorage,assert}){
  assert.deepEqual({...game.constants.GEAR_COST.pickaxe[3]},{ore1:1000,gold1:1000,ore2:100,gold2:100});
  assert.equal(game.constants.ENDING_CREDITS_DELAY_MS+game.constants.ENDING_CREDITS_MS+game.constants.ENDING_ACTION_DELAY_MS,41000);
  game.returnToIntroAfterEnding();
  let state=game.state();state.place="worldtree";state.hp=100000;
  const axe=state.gear.find(g=>g.type==="axe"),pickaxe=state.gear.find(g=>g.type==="pickaxe"),sword=state.gear.find(g=>g.type==="sword");
  for(const g of [axe,pickaxe,sword])g.tier=3;
  axe.enh=4;pickaxe.enh=3;sword.enh=5;
  game.render();assert.equal(game.currentWeaponType(),"sword");assert(element("character").src.includes("/sword/idle.png"));
  const swordAttack=game.totalAttack();
  pickaxe.enh=6;game.render();assert.equal(game.currentWeaponType(),"pickaxe");assert(game.totalAttack()>swordAttack);assert(element("character").src.includes("/pickaxe/idle.png"));
  state.target.def=0;
  const before=state.target.hp,expected=Math.max(1,game.totalAttack()-state.target.def);
  game.workAction(true);assert.equal(before-state.target.hp,expected,"boss damage uses the strongest equipped weapon");
  state.equipped.pickaxe=null;game.render();assert.equal(game.currentWeaponType(),"sword","unequipped stronger items are ignored");
  sword.enh=4;assert.equal(game.currentWeaponType(),"axe","ties use stable axe/pickaxe/sword priority");
  state.auto=true;game.toggleAuto();assert.equal(state.auto,false);assert.equal(element("autoButton").disabled,true);
  state.auto=true;state.lastSeen=Date.now()-60000;const bossHp=state.target.hp,hp=state.hp;
  game.settleOffline(Date.now());assert.equal(state.target.hp,bossHp);assert.equal(state.hp,hp);assert.equal(state.auto,false,"legacy boss auto saves stop without offline attacks");
  for(const [place,type]of [["forest","axe"],["mine","pickaxe"],["dungeon","sword"]]){
    state.place=place;game.render();assert.equal(game.currentWeaponType(),type);assert.equal(element("autoButton").disabled,false);
  }

  // Legacy boolean migrated to one trophy, then the earlier completion added one.
  assert.equal(game.endingCount(),2);game.renderProfile();assert(element("overlayContent").innerHTML.includes('class="food-stack">x2'));
  assert.equal(state.gear.filter(g=>g.special).length,1,"trophies stack in one inventory entry");
  state.ended=true;const completedSnapshot=JSON.stringify(state),actions=element("endingActions");
  await Promise.all([game.finalizeEnding(actions),game.finalizeEnding(actions)]);
  assert.equal(game.endingCount(),3,"concurrent completion only awards once");
  assert.equal(localStorage.getItem(game.constants.SAVE_KEY),null);
  // A crash after metadata write but before ordinary save deletion must not re-award.
  game.returnToIntroAfterEnding();localStorage.setItem(game.constants.SAVE_KEY,completedSnapshot);
  await game.init();assert.equal(game.endingCount(),3);await game.finalizeEnding(actions);assert.equal(game.endingCount(),3);
  game.returnToIntroAfterEnding();state=game.state();state.ended=true;await game.finalizeEnding(actions);
  assert.equal(game.endingCount(),4,"a new playthrough awards another permanent trophy");
  game.returnToIntroAfterEnding();await game.init();assert.equal(game.endingCount(),4,"permanent count survives loading without an ordinary save");
  assert.equal(game.state().gear.filter(g=>g.special).length,1);
  console.log("v1.2.4 recipe, strongest weapon, manual boss, ending timing and permanent count: OK");
};
