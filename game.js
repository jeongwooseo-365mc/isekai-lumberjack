(() => {
  "use strict";

  const APP_VERSION = "1.0.0";
  const SAVE_KEY = "isekai_lumberjack_save_v10";
  const META_KEY = "isekai_lumberjack_meta";
  const MAX_ITEM_COUNT = 9999;
  const GEAR_CAPACITY = 20;
  const BOSS_PRELUDE_MS = 2000;
  const OPENING_SCENE_MS = 5000;
  const OPENING_BLACK_MS = 3000;
  const ENDING_SCENE_MS = 10000;
  const ENDING_CREDITS_DELAY_MS = 3000;
  const ENDING_CREDITS_MS = 38000;
  const ENDING_ACTION_DELAY_MS = 5000;
  const FINAL_BOSS = { hp: 4444444, def: 5000, reflectMin: 500, reflectMax: 1500 };
  const TIERS = ["허름한", "쓸만한", "장인의", "영웅의", "신의"];
  const GRADES = ["하급", "중급", "상급"];
  const GEAR_LABEL = { axe: "도끼", pickaxe: "곡괭이", rod: "낚싯대", sword: "검", armor: "갑옷" };
  const WEAPON_POWER = [10, 20, 100, 700, 5000];
  const ARMOR_HP = [100, 200, 500, 1500, 5000];
  const PLACE_LABEL = { home: "집", forest: "숲", mine: "광산", pond: "연못", dungeon: "던전", worldtree: "칠흑의 세계수" };
  const PLACE_RESOURCE = { forest: "wood", mine: "ore", dungeon: "gold" };
  const RESOURCE_LABEL = { wood: "목재", ore: "광석", gold: "금화" };
  const FISH = ["해초", "조개", "민어", "숭어", "연어", "랍스터"];
  const FISH_KEY = { 해초: "seaweed", 조개: "shell", 민어: "croaker", 숭어: "mullet", 연어: "salmon", 랍스터: "lobster" };
  const ROD_PROBS = [[66,27,5,2,0,0],[50,20,15,9,5,1],[26,24,23,18,7,2],[12,12,30,30,12,4],[0,0,20,30,35,15]];
  const TARGET_STATS = [
    { min: 200, max: 400, def: 0, xp: 20 },
    { min: 1000, max: 2000, def: 200, xp: 100 },
    { min: 5000, max: 10000, def: 1000, xp: 1000 },
  ];

  const GEAR_COST = {
    axe: [{}, {wood0:100}, {wood0:1000,gold0:1000,wood1:100,gold1:100}, {wood1:1000,gold1:1000,wood2:100,gold2:100}, {wood2:1000,gold2:1000}],
    pickaxe: [{}, {ore0:100}, {ore0:1000,gold0:1000,ore1:100,gold1:100}, {ore1:1000,gold1:1000,ore2:100,wood2:100}, {ore2:1000,gold2:1000}],
    sword: [{}, {wood0:50,ore0:50}, {wood0:1000,ore0:1000,wood1:100,ore1:100}, {wood1:1000,ore1:1000,wood2:100,ore2:100}, {wood2:1000,ore2:1000}],
    rod: [{}, {wood0:20,ore0:20,gold0:40}, {wood0:200,ore0:200,gold0:400,wood1:20,ore1:20,gold1:40}, {wood1:200,ore1:200,gold1:400,wood2:20,ore2:20,gold2:40}, {wood2:200,ore2:200,gold2:400}],
    armor: [{}, {wood0:40,ore0:40,gold0:20}, {wood0:400,ore0:400,gold0:200,wood1:40,ore1:40,gold1:20}, {wood1:400,ore1:400,gold1:200,wood2:40,ore2:40,gold2:20}, {wood2:400,ore2:400,gold2:200}],
  };

  const HOUSES = [
    { name: "초라한 오두막", heal: 1, cost: {} },
    { name: "괜찮은 목조주택", heal: 2, cost: {gold0:1000} },
    { name: "넓은 전원주택", heal: 5, cost: {gold1:1000} },
    { name: "고급 저택", heal: 20, cost: {gold1:5000,gold2:1000} },
    { name: "귀족풍 대저택", heal: 100, cost: {gold1:9999,gold2:9999} },
  ];

  const RECIPES = [
    { name: "생선 수프", icon: "fish_soup", heal: 200, cost: {해초:5,민어:1} },
    { name: "해산물 스튜", icon: "seafood_stew", heal: 400, cost: {해초:20,조개:10,민어:5} },
    { name: "구운 생선", icon: "grilled_fish", heal: 300, cost: {숭어:1,조개:5} },
    { name: "연어 스테이크", icon: "salmon_steak", heal: 600, cost: {연어:1} },
    { name: "고급 랍스터 정식", icon: "lobster_course", heal: 1000, cost: {랍스터:1} },
  ];

  const BGM_FILES = { title:"title", home:"home", forest:"forest", mine:"mine", pond:"pond", dungeon:"dungeon", worldtree:"dungeon", map:"map", ending:"ending" };
  const EXHAUSTED_MESSAGE = "체력이 없어 동작할 수 없습니다.\n집에서 휴식해 주세요.";
  const SFX_FILES = new Set([
    "ui_click","ui_back","ui_confirm","ui_error","auto_on","auto_off","axe_swing","axe_hit","tree_break",
    "pickaxe_swing","pickaxe_hit","ore_break","sword_swing","sword_hit","monster_defeat","fish_cast","water_splash",
    "fish_bite","fish_reel","fish_catch","loot_common","loot_rare","purchase","equip","cook","eat","heal",
    "enhance_start","enhance_success","enhance_fail","gear_break","level_up","exhausted","world_unlock",
  ]);

  const $ = (id) => document.getElementById(id);
  const dom = {
    intro: $("introScreen"), story: $("storyScreen"), bossPrelude: $("bossPreludeScreen"), play: $("playScreen"), ending: $("endingScreen"), scene: $("scene"), placeTitle: $("placeTitle"),
    menuToggle: $("menuToggle"), mainMenu: $("mainMenu"), targetHud: $("targetHud"), targetArea: $("targetArea"), targetName: $("targetName"), targetImage: $("targetImage"), targetHpFill: $("targetHpFill"), targetHpText: $("targetHpText"),
    character: $("character"), fishingLine: $("fishingLine"), bobber: $("bobber"), fishingStatus: $("fishingStatus"), tapHint: $("tapHint"), lootBurst: $("lootBurst"), hitFlash: $("hitFlash"),
    level: $("levelLabel"), xpFill: $("xpFill"), xpText: $("xpText"), hp: $("hpStat"), hpMeter: $("hpMeter"), hpFill: $("hpFill"), attack: $("attackStat"), place: $("placeStat"), equipped: $("equippedGrid"), log: $("logPanel"),
    autoButton: $("autoButton"), autoState: $("autoState"), overlay: $("overlay"), overlayTitle: $("overlayTitle"), overlaySubtitle: $("overlaySubtitle"), overlayContent: $("overlayContent"),
    toast: $("toast"), dialog: $("confirmDialog"), dialogTitle: $("dialogTitle"), dialogMessage: $("dialogMessage"), dialogCancel: $("dialogCancel"), dialogConfirm: $("dialogConfirm"),
  };

  let S;
  let M = { endingSeen:false };
  let saveQueue = Promise.resolve();
  let secondTimer = null;
  let fishTimer = null;
  let statusTimer = null;
  let toastTimer = null;
  let actionLocked = false;
  let overlayStack = [];
  let selectedWorkshop = { type: "axe", tier: 1 };
  let selectedHouse = 0;
  let selectedRecipe = 0;
  let selectedGearId = null;
  let selectedFoodIndex = null;
  let selectedEnhanceId = null;
  let enhancing = false;
  let crafting = false;
  let saveClearedAfterEnding = false;
  let lastBackAt = 0;
  let resetNotice = "";
  let bgm = null;
  let bgmKey = "";
  let fishingCastUntil = 0;
  let fishingRewardAt = 0;
  let fishingLiftUntil = 0;
  let cinematicToken = 0;
  let cinematicTimers = [];
  let menuOpen = false;

  function newId(prefix="g") { return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random()*1e9).toString(36)}`; }

  function freshState() {
    const gear = Object.keys(GEAR_LABEL).map((type, i) => ({ id:`starter_${type}_${i}`, type, tier:0, enh:0 }));
    if(M.endingSeen) gear.push({id:"easter_egg",type:"easteregg",tier:0,enh:0,special:true});
    return {
      version: APP_VERSION, lv:1, xp:0, hp:500, place:"home", grade:0, auto:false, resting:false,
      rngSeed: (Date.now() >>> 0) || 1, res:{wood:[0,0,0],ore:[0,0,0],gold:[0,0,0]},
      fish:Object.fromEntries(FISH.map(x=>[x,0])), stones:[0,0,0], houses:[true,false,false,false,false], house:0,
      gear, equipped:Object.fromEntries(gear.filter(g=>!g.special).map(g=>[g.type,g.id])), foods:Array(RECIPES.length).fill(0), equippedFood:null, logs:[], target:null, fishState:null,
      restProgress:0, restElapsed:0, openingSeen:false, worldGateUnlocked:false, ended:false, lastSeen:Date.now(), lastVisit:Date.now(), settings:{bgm:.5,sfx:.5},
    };
  }

  const storage = {
    async load() {
      try {
        if (window.__TAURI__?.core?.invoke) return await window.__TAURI__.core.invoke("load_save");
        return localStorage.getItem(SAVE_KEY);
      } catch (error) { console.warn("save load failed", error); return localStorage.getItem(SAVE_KEY); }
    },
    async write(contents) {
      if (window.__TAURI__?.core?.invoke) return window.__TAURI__.core.invoke("write_save", { contents });
      localStorage.setItem(SAVE_KEY, contents);
    },
    async remove() {
      if (window.__TAURI__?.core?.invoke) await window.__TAURI__.core.invoke("delete_save");
      localStorage.removeItem(SAVE_KEY);
    },
    async loadMeta() {
      try {
        if(window.__TAURI__?.core?.invoke) return await window.__TAURI__.core.invoke("load_meta");
        return localStorage.getItem(META_KEY);
      } catch(error) { console.warn("meta load failed",error); return localStorage.getItem(META_KEY); }
    },
    async writeMeta(contents) {
      if(window.__TAURI__?.core?.invoke) return window.__TAURI__.core.invoke("write_meta",{contents});
      localStorage.setItem(META_KEY,contents);
    },
  };

  function persist(touch=true) {
    if (!S||saveClearedAfterEnding) return Promise.resolve();
    if (touch) { S.lastSeen = Date.now(); S.lastVisit = Date.now(); }
    const snapshot = JSON.stringify(S);
    saveQueue = saveQueue.then(() => storage.write(snapshot)).catch(error => console.warn("save failed", error));
    return saveQueue;
  }

  function persistMeta() { return storage.writeMeta(JSON.stringify(M)).catch(error=>console.warn("meta save failed",error)); }

  function rand() {
    S.rngSeed = (Math.imul(1664525, S.rngSeed >>> 0) + 1013904223) >>> 0;
    return S.rngSeed / 4294967296;
  }

  function randNorm(min, max) {
    let u=0, v=0; while(!u) u=rand(); while(!v) v=rand();
    const z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
    return Math.round(Math.max(min,Math.min(max,(min+max)/2+z*(max-min)/6)));
  }

  function baseMaxHp() {
    let value=500;
    for(let level=2;level<=S.lv;level++) value += level>=60 ? 45 : level>=30 ? 20 : 10;
    return value;
  }

  function baseAttack() {
    let value=10;
    for(let level=2;level<=S.lv;level++) value += level>=60 ? 45 : level>=30 ? 10 : 5;
    return value;
  }

  function gearById(id) { return S.gear.find(g=>g.id===id); }
  function equipped(type) { return gearById(S.equipped[type]); }
  function gearBase(g) { if(!g||g.special)return 0;return g.type === "armor" ? ARMOR_HP[g.tier] : WEAPON_POWER[g.tier]; }
  function enhancementMultiplier(g) {
    if(!g) return 1;
    let multiplier=1;
    for(let i=1;i<=g.enh;i++) multiplier += g.tier===0 ? .2 : i<=4 ? .2 : i<=7 ? .5 : 2;
    return multiplier;
  }
  function gearPower(g) {
    if (!g) return 0;
    return Math.round(gearBase(g)*enhancementMultiplier(g));
  }
  function rodMeanSeconds(g=equipped("rod")) { return Math.max(1,15/enhancementMultiplier(g)); }
  function gearEffectText(g) {
    if(g.special) return "엔딩을 목격한 자에게 남는 수상한 징표";
    if(g.type==="rod") return `희귀 어종 확률 상승 · 평균 ${rodMeanSeconds(g).toFixed(1)}초`;
    if(g.type==="armor") return `최대 체력 +${gearPower(g).toLocaleString()}`;
    return `공격력 +${gearPower(g).toLocaleString()}`;
  }

  function maxHp() { return baseMaxHp() + gearPower(equipped("armor")); }
  function currentWeaponType() { return S.place==="forest"||S.place==="worldtree"?"axe":S.place==="mine"?"pickaxe":S.place==="dungeon"?"sword":null; }
  function totalAttack() { const type=currentWeaponType(); return baseAttack() + (type ? gearPower(equipped(type)) : 0); }
  function needXp(level=S.lv) { return Math.round(100*Math.pow(1.1,level-1)); }
  function gearIcon(g) { return g?.special?"assets/items/easter_egg.png":`assets/items/${g.type}_${g.tier}.png`; }
  function gearDisplayName(g) { return g?.special?"이스터에그":`${TIERS[g.tier]} ${GEAR_LABEL[g.type]}${g.enh?` +${g.enh}`:""}`; }
  function inventoryGearCount() { return S.gear.filter(g=>!g.special).length; }
  function foodCount(index) { return capped(S.foods?.[index]); }
  function foodIcon(index) { return `assets/foods/${RECIPES[index].icon}.png`; }
  function resourceIcon(kind, grade) { return `assets/resources/${kind}_${["low","mid","high"][grade]}.png`; }
  function stoneIcon(grade) { return `assets/resources/stone_${["low","mid","high"][grade]}.png`; }
  function fishIcon(name) { return `assets/resources/${FISH_KEY[name]}.png`; }
  function capped(value) { return Math.max(0,Math.min(MAX_ITEM_COUNT,Math.floor(Number(value)||0))); }
  function elapsedLabel(seconds) { const total=Math.max(0,Math.floor(seconds||0));if(total<60)return `${total}초`;if(total<3600)return `${Math.floor(total/60)}분 ${total%60}초`;return `${Math.floor(total/3600)}시간 ${Math.floor(total%3600/60)}분`; }
  function hasAllDivineGear() { return Object.keys(GEAR_LABEL).every(type=>S.gear.some(g=>g.type===type&&g.tier===4)); }
  function refreshWorldGateUnlock(announce=false) {
    if(S.worldGateUnlocked) return true;
    if(S.lv>=100||hasAllDivineGear()) {
      S.worldGateUnlocked=true;
      if(announce) { addLog("원래세계로 가는 문이 열렸습니다.","assets/ui/map.png","rare"); playSfx("world_unlock"); }
    }
    return !!S.worldGateUnlocked;
  }
  function normalizeInventory() {
    for(const kind of ["wood","ore","gold"]) S.res[kind]=(S.res[kind]||[0,0,0]).map(capped);
    S.stones=(S.stones||[0,0,0]).map(capped);
    for(const name of FISH) S.fish[name]=capped(S.fish[name]);
    S.foods=Array.from({length:RECIPES.length},(_,index)=>capped(S.foods?.[index]));
    if(!Number.isInteger(S.equippedFood)||foodCount(S.equippedFood)<=0)S.equippedFood=null;
  }

  function addLog(text, icon="assets/ui/logo_mark.png", tone="", at=Date.now()) {
    S.logs.push({ text, icon, tone, at });
    if (S.logs.length > 300) S.logs.splice(0, S.logs.length-300);
  }

  function addXp(amount, at=Date.now()) {
    if(S.lv>=100) return;
    S.xp += amount;
    while(S.lv<100 && S.xp>=needXp()) {
      S.xp -= needXp(); S.lv++;
      addLog(`레벨 ${S.lv} 달성!`,"assets/ui/energy.png","good",at);
      if (dom.play.classList.contains("active")) playSfx("level_up");
    }
    if(S.lv>=100) {
      S.xp=0; addLog("레벨 100 달성. 지도 하늘에서 귀환의 길이 열렸습니다.","assets/ui/map.png","rare",at);
      if (dom.play.classList.contains("active")) playSfx("world_unlock");
      refreshWorldGateUnlock();
    }
  }

  function currentPlaceName() {
    if(S.place==="home") return HOUSES[S.house].name;
    if(S.place==="pond") return "연못";
    if(S.place==="worldtree") return "칠흑의 세계수";
    return `${GRADES[S.grade]} ${PLACE_LABEL[S.place]}`;
  }

  function newTarget() {
    if(S.place==="worldtree") { S.target={hp:FINAL_BOSS.hp,max:FINAL_BOSS.hp,def:FINAL_BOSS.def,xp:0}; return; }
    const stat=TARGET_STATS[S.grade], hp=randNorm(stat.min,stat.max);
    S.target={hp,max:hp,def:stat.def,xp:stat.xp};
  }

  function targetAsset() {
    if(S.place==="worldtree") return "assets/targets/worldtree.png";
    const kind=S.place==="forest"?"tree":S.place==="mine"?"ore":"monster";
    return `assets/targets/${kind}_${["low","mid","high"][S.grade]}.png`;
  }

  function targetLabel() {
    if(S.place==="worldtree") return "최종 세계수";
    if(S.place==="forest") return `${GRADES[S.grade]} 나무`;
    if(S.place==="mine") return `${GRADES[S.grade]} 광맥`;
    return ["고블린","마물","드래곤"][S.grade];
  }

  function consumeFood(index,{automatic=false,simulated=false,at=Date.now()}={}) {
    index=Number(index);
    if(!Number.isInteger(index)||!RECIPES[index]||foodCount(index)<=0||S.hp>=maxHp())return false;
    const recipe=RECIPES[index],before=S.hp;
    S.foods[index]=capped(foodCount(index)-1);
    S.hp=Math.min(maxHp(),S.hp+recipe.heal);
    const gained=Math.max(0,Math.floor(S.hp-before));
    addLog(`${recipe.name} ${automatic?"자동 섭취":"섭취"}: 체력 ${gained.toLocaleString()} 회복.`,foodIcon(index),"good",at);
    if(S.foods[index]===0){if(S.equippedFood===index)S.equippedFood=null;if(selectedFoodIndex===index)selectedFoodIndex=null;}
    if(!simulated){playSfx("eat");setTimeout(()=>playSfx("heal"),180);}
    return true;
  }

  function handleExhaustion(simulated=false,at=Date.now()) {
    if(S.hp>0)return true;
    if(Number.isInteger(S.equippedFood)&&consumeFood(S.equippedFood,{automatic:true,simulated,at}))return true;
    if(S.auto){S.auto=false;addLog("체력이 모두 소진되어 오토가 해제되었습니다.","assets/ui/energy.png","warn",at);}
    return false;
  }

  function depleteOneHp(simulated=false,at=Date.now()) {
    if(S.hp<=0)return false;
    S.hp=Math.max(0,S.hp-1);
    if(S.hp===0)handleExhaustion(simulated,at);
    return true;
  }

  function stoneDropGrade(dungeonGrade,roll) {
    if(dungeonGrade===0) return roll<.05?0:null;
    if(dungeonGrade===1) return roll<.03?0:roll<.05?1:null;
    return roll<.05?0:roll<.08?1:roll<.09?2:null;
  }

  function stoneDropGradeForPlace(place,grade,roll) {
    return ["forest","mine","dungeon"].includes(place)?stoneDropGrade(grade,roll):null;
  }

  function dropStone(grade,at,visual=true) {
    const count=1;
    S.stones[grade]=capped(S.stones[grade]+count);
    const icon=stoneIcon(grade);
    addLog(`${GRADES[grade]} 강화의 돌 ${count}개 획득!`,icon,"rare",at);
    if(visual) { lootBurst(icon,Math.min(count,14)); playSfx("loot_rare"); }
  }

  function dropResource(hpRatio, at, visual=true) {
    const kind=PLACE_RESOURCE[S.place]; let grade=0, count=1;
    if(S.grade===0) {
      const center=1+Math.round(hpRatio*8);
      count=Math.max(1,Math.min(10,center+Math.floor(rand()*5)-2));
    } else if(S.grade===1) {
      if(rand()<.35){grade=1;count=1+Math.floor(rand()*10);} else {count=10+Math.floor(rand()*21);}
    } else {
      const r=rand();
      if(r<.2){grade=2;count=1+Math.floor(rand()*10);} else if(r<.55){grade=1;count=10+Math.floor(rand()*21);} else {count=30+Math.floor(rand()*21);}
    }
    S.res[kind][grade]=capped(S.res[kind][grade]+count);
    const icon=resourceIcon(kind,grade);
    addLog(`${GRADES[grade]} ${RESOURCE_LABEL[kind]} ${count}개 획득!`,icon,"",at);
    if(visual) { lootBurst(icon,Math.min(count,18)); playSfx(count>=10?"loot_rare":"loot_common"); }
  }

  function defeatTarget(at=Date.now(), visual=true) {
    const hpRatio=(S.target.max-TARGET_STATS[S.grade].min)/(TARGET_STATS[S.grade].max-TARGET_STATS[S.grade].min);
    addXp(S.target.xp,at);
    const stoneGrade=stoneDropGradeForPlace(S.place,S.grade,rand());
    if(stoneGrade!==null) dropStone(stoneGrade,at,visual); else dropResource(hpRatio,at,visual);
    if(visual) playSfx(S.place==="forest"?"tree_break":S.place==="mine"?"ore_break":"monster_defeat");
    newTarget();
  }

  function workAction(simulated=false, at=Date.now()) {
    if(!["forest","mine","dungeon","worldtree"].includes(S.place)) return;
    if(S.hp<=0&&!handleExhaustion(simulated,at)) {
      if(!simulated) { toast(EXHAUSTED_MESSAGE); playSfx("exhausted"); }
      S.auto=false; return;
    }
    if(!S.target) newTarget();
    depleteOneHp(simulated,at);
    const damage=Math.max(1,totalAttack()-S.target.def);
    S.target.hp-=damage;
    if(!simulated) animateAction();
    if(S.place==="worldtree") {
      const reflected=randNorm(FINAL_BOSS.reflectMin,FINAL_BOSS.reflectMax);
      S.hp=Math.max(0,S.hp-reflected);
      if(!simulated) {
        addLog(`세계수의 반사 피해 ${reflected.toLocaleString()}.`,"assets/ui/energy.png","warn",at);
        setTimeout(animateReflection,150);
      }
      if(S.hp<=0)handleExhaustion(simulated,at);
      if(S.target.hp<=0) {
        S.target.hp=0; S.auto=false; S.ended=true;
        addLog("칠흑의 세계수를 베어 쓰러뜨렸습니다.","assets/targets/worldtree.png","rare",at);
        if(!simulated) { playSfx("tree_break"); persist(); setTimeout(startEnding,850); }
      }
    } else if(S.target.hp<=0) defeatTarget(at,!simulated);
    if(!simulated) { render(); persist(); }
  }

  function startFishing(simulated=false, startAt=Date.now()) {
    if(S.place!=="pond" || S.fishState) return false;
    if(S.hp<=0&&!handleExhaustion(simulated,startAt)) {
      S.auto=false;
      if(!simulated) { toast(EXHAUSTED_MESSAGE); playSfx("exhausted"); }
      return false;
    }
    const baseDuration=randNorm(5,25);
    const duration=Math.max(1,baseDuration/enhancementMultiplier(equipped("rod")));
    S.fishState={startAt,endAt:startAt+duration*1000,duration,baseDuration};
    if(!simulated) {
      fishingCastUntil=Date.now()+520; dom.character.src="assets/sprites/fishing/cast.png"; playSfx("fish_cast");
      setTimeout(()=>{ if(S.fishState) renderScene(); },520);
      render();scheduleFishing();persist();
    }
    return true;
  }

  function completeFishing(simulated=false, at=Date.now()) {
    if(!S.fishState) return;
    if(S.hp<=0&&!handleExhaustion(simulated,at)) { S.auto=false; S.fishState=null; if(!simulated){toast(EXHAUSTED_MESSAGE);playSfx("exhausted");render();persist();} return; }
    depleteOneHp(simulated,at);
    const duration=S.fishState.baseDuration??S.fishState.duration;
    const rodTier=equipped("rod")?.tier??0, probs=ROD_PROBS[rodTier], roll=rand()*100;
    let sum=0,index=0; for(;index<probs.length;index++){sum+=probs[index];if(roll<sum)break;} index=Math.min(index,5);
    const chance3=Math.max(0,Math.min(1,(duration-5)/20));
    const count=rand()<chance3*.45?3:rand()<.45?2:1;
    const name=FISH[index], icon=fishIcon(name);
    S.fish[name]=capped(S.fish[name]+count); S.fishState=null;
    addLog(`${name} ${count}개 낚음!`,icon,index>=4?"rare":"",at);
    if(!simulated) {
      fishingLiftUntil=Date.now()+330; fishingRewardAt=Date.now()+1060;
      dom.character.src="assets/sprites/fishing/hook.png"; playSfx("fish_reel");
      setTimeout(()=>{dom.character.src="assets/sprites/fishing/idle.png";playSfx("fish_catch");lootBurst(icon,count);},330);
      setTimeout(()=>{fishingLiftUntil=0;fishingRewardAt=0;renderScene();},1060); render(); persist();
      if(S.auto && S.hp>0) fishTimer=setTimeout(()=>startFishing(false),2060);
    }
  }

  function settleOffline(now=Date.now()) {
    const from=Number(S.lastSeen)||now;
    const elapsed=Math.max(0,Math.floor((now-from)/1000));
    if(elapsed<=0) { if(!Number.isFinite(Number(S.lastSeen)))S.lastSeen=now; return 0; }
    if(S.place==="home"&&S.resting) {
      S.restElapsed=(S.restElapsed||0)+elapsed;
      const ticks=elapsed;S.restProgress=0;
      if(ticks>0 && S.hp<maxHp()) {
        const before=S.hp; S.hp=Math.min(maxHp(),S.hp+ticks*HOUSES[S.house].heal);
        const gained=S.hp-before;
        if(gained>0&&(elapsed>1||S.hp>=maxHp()))addLog(`${HOUSES[S.house].name}에서 체력 ${gained} 회복.`,"assets/ui/realestate.png","good",now);
      }
    } else if(S.place==="pond") {
      if(S.auto) {
        let cursor=from, guard=0;
        if(!S.fishState) startFishing(true,cursor);
        while(S.fishState && S.fishState.endAt<=now && guard++<200000) {
          cursor=S.fishState.endAt; completeFishing(true,cursor);
          if(!S.auto || S.hp<=0) break;
          cursor+=1000; if(cursor>now) break;
          startFishing(true,cursor);
        }
      }
    } else if(S.auto && ["forest","mine","dungeon","worldtree"].includes(S.place)) {
      const actions=Math.min(elapsed,200000);
      for(let i=0;i<actions&&S.auto&&S.hp>0&&!S.ended;i++)workAction(true,from+(i+1)*1000);
    }
    S.lastSeen=from+elapsed*1000; S.lastVisit=now;
    return elapsed;
  }

  function secondTick() {
    if(!dom.play.classList.contains("active")) return;
    const beforeHp=S.hp,beforeTargetHp=S.target?.hp;
    const elapsed=settleOffline(Date.now());
    if(elapsed<=0)return;
    if(S.ended){startEnding();return;}
    if(S.auto&&["forest","mine","dungeon","worldtree"].includes(S.place)&&beforeHp>S.hp&&beforeTargetHp!==S.target?.hp)animateAction();
    render();scheduleFishing();persist(false);
  }

  function startLoops() {
    clearInterval(secondTimer); clearInterval(statusTimer); clearTimeout(fishTimer);
    secondTimer=setInterval(secondTick,1000);
    statusTimer=setInterval(updateActivityStatus,250);
    scheduleFishing();
  }

  function scheduleFishing() {
    clearTimeout(fishTimer);
    if(S.place!=="pond" || !S.fishState) return;
    const remaining=Math.max(0,S.fishState.endAt-Date.now());
    fishTimer=setTimeout(()=>completeFishing(false),remaining);
  }

  function updateActivityStatus() {
    if(S.place==="home"&&S.resting) {
      dom.fishingStatus.textContent=`휴식 중 · ${elapsedLabel(S.restElapsed)} 경과 · 1초당 +${HOUSES[S.house].heal}`;
      return;
    }
    if(S.place==="pond"&&S.fishState) {
      const seconds=Math.max(0,Math.ceil((S.fishState.endAt-Date.now())/1000));
      dom.fishingStatus.textContent=`입질을 기다리는 중 · ${seconds}초`;
    }
  }

  function toggleResting() {
    if(S.place!=="home")return;
    S.resting=!S.resting;S.auto=S.resting;S.restProgress=0;S.restElapsed=0;
    if(S.resting) {
      addLog(`휴식 시작: 1초마다 체력 ${HOUSES[S.house].heal} 회복.`,"assets/ui/realestate.png","good");
      toast(`휴식을 시작합니다.\n1초마다 체력 +${HOUSES[S.house].heal}`);playSfx("auto_on");
    } else {
      addLog("휴식을 종료했습니다.","assets/ui/realestate.png");toast("휴식을 종료했습니다.");playSfx("auto_off");
    }
    render();persist();
  }

  function toggleAuto() {
    if(S.place==="home") { toggleResting(); return; }
    if(S.hp<=0) { S.auto=false; toast(EXHAUSTED_MESSAGE); playSfx("exhausted"); render(); return; }
    S.auto=!S.auto; playSfx(S.auto?"auto_on":"auto_off");
    addLog(`오토 ${S.auto?"시작":"종료"}.`,"assets/ui/auto.png",S.auto?"good":"");
    if(S.auto && S.place==="pond" && !S.fishState) startFishing(false);
    render(); persist();
  }

  function travel(place, grade=0) {
    const leavingWorldtree=S.place==="worldtree"&&place!=="worldtree"&&S.target&&S.target.hp>0;
    if(S.place==="home"&&place!=="home"){S.resting=false;S.auto=false;}
    S.place=place; S.grade=grade; S.target=null; S.restProgress=0;S.restElapsed=0;
    if(place!=="pond") S.fishState=null;
    if(place==="home") {S.auto=false;S.resting=false;}
    if(leavingWorldtree) addLog("세계수의 상처가 어둠 속에서 완전히 회복되었습니다.","assets/targets/worldtree.png","warn");
    addLog(`${place==="home"?HOUSES[S.house].name:place==="pond"?"연못":`${GRADES[grade]} ${PLACE_LABEL[place]}`}으로 이동.`,"assets/ui/map.png");
    setMenuOpen(false);closeOverlay(); startLoops(); render(); setBgm(place); persist();
  }

  function animateAction() {
    if(actionLocked) return;
    actionLocked=true;
    const type=currentWeaponType();
    dom.character.src=`assets/sprites/${type}/windup.png`;
    playSfx(`${type}_swing`);
    setTimeout(()=>{
      dom.character.src=`assets/sprites/${type}/hit.png`;
      playSfx(`${type}_hit`);
      dom.targetImage.classList.remove("struck"); void dom.targetImage.offsetWidth; dom.targetImage.classList.add("struck");
      dom.hitFlash.classList.remove("play"); void dom.hitFlash.offsetWidth; dom.hitFlash.classList.add("play");
    },90);
    setTimeout(()=>{dom.character.src=`assets/sprites/${type}/idle.png`;actionLocked=false;},230);
  }

  function animateReflection() {
    dom.character.classList.remove("reflected"); void dom.character.offsetWidth; dom.character.classList.add("reflected");
    setTimeout(()=>dom.character.classList.remove("reflected"),280);
  }

  function lootBurst(icon,count) {
    dom.lootBurst.innerHTML="";
    for(let i=0;i<count;i++) {
      const img=document.createElement("img"); img.src=icon; img.className="loot-particle";
      img.style.setProperty("--x",`${(rand()-.5)*330}px`); img.style.setProperty("--y",`${-70-rand()*220}px`); img.style.setProperty("--r",`${(rand()-.5)*620}deg`);
      img.style.animationDelay=`${rand()*.14}s`; dom.lootBurst.appendChild(img);
    }
    setTimeout(()=>{dom.lootBurst.innerHTML="";},1500);
  }

  function setMenuOpen(open) {
    menuOpen=!!open;
    dom.mainMenu.classList.toggle("open",menuOpen);
    dom.mainMenu.setAttribute("aria-hidden",String(!menuOpen));
    dom.menuToggle.setAttribute("aria-expanded",String(menuOpen));
    dom.menuToggle.setAttribute("aria-label",menuOpen?"메뉴 접기":"메뉴 펼치기");
    dom.scene.classList.toggle("menu-open",menuOpen);
  }

  function toggleMenu() { setMenuOpen(!menuOpen); }

  function render(save=false) {
    renderScene(); renderHud();
    dom.autoState.textContent=S.auto?"ON":"OFF"; dom.autoButton.classList.toggle("on",S.auto);
    if(save) persist();
  }

  function renderScene() {
    const bg=S.place==="home"?`home${S.house+1}.png`:S.place==="pond"?"pond.png":S.place==="worldtree"?"worldtree_cave.png":`${S.place}${S.grade+1}.png`;
    dom.scene.style.backgroundImage=`url("assets/bg/${bg}")`;
    dom.placeTitle.textContent=currentPlaceName();
    dom.scene.classList.toggle("worldtree-scene",S.place==="worldtree");
    const hasTarget=["forest","mine","dungeon","worldtree"].includes(S.place);
    dom.targetArea.classList.toggle("hidden",!hasTarget);dom.targetHud.classList.toggle("hidden",!hasTarget);
    dom.bobber.classList.add("hidden"); dom.fishingLine.classList.add("hidden"); dom.fishingStatus.classList.add("hidden"); dom.character.classList.remove("fishing","casting","waiting","lifting","rewarding");
    if(S.place==="home") {
      dom.character.src=S.resting?"assets/sprites/rest/rest.png":"assets/sprites/rest/idle.png";
      dom.tapHint.textContent=S.resting?"화면을 탭하면 휴식 종료":"화면을 탭해 휴식 시작";
      if(S.resting){dom.fishingStatus.classList.remove("hidden");updateActivityStatus();}
    } else if(S.place==="pond") {
      dom.character.classList.add("fishing");
      const now=Date.now();
      if(fishingLiftUntil>now) { dom.character.src="assets/sprites/fishing/hook.png"; dom.character.classList.add("lifting"); }
      else if(fishingRewardAt>now) { dom.character.src="assets/sprites/fishing/idle.png"; dom.character.classList.add("rewarding"); }
      else if(S.fishState&&fishingCastUntil>now) { dom.character.src="assets/sprites/fishing/cast.png"; dom.character.classList.add("casting"); }
      else if(S.fishState) { dom.character.src="assets/sprites/fishing/cast.png"; dom.character.classList.add("waiting"); }
      else dom.character.src="assets/sprites/fishing/idle.png";
      if(S.fishState&&fishingCastUntil<=now) { dom.bobber.classList.remove("hidden"); dom.fishingLine.classList.remove("hidden"); dom.fishingStatus.classList.remove("hidden"); updateActivityStatus(); }
      dom.tapHint.textContent=S.fishState?"":"화면을 탭해 낚시 시작";
    } else {
      if(!S.target) newTarget();
      const type=currentWeaponType(); if(!actionLocked) dom.character.src=`assets/sprites/${type}/idle.png`;
      dom.targetImage.src=targetAsset(); dom.targetName.textContent=targetLabel();
      dom.targetHpFill.style.width=`${Math.max(0,S.target.hp/S.target.max*100)}%`;
      dom.targetHpText.textContent=`${Math.max(0,Math.ceil(S.target.hp)).toLocaleString()} / ${S.target.max.toLocaleString()}`;
      dom.tapHint.textContent="화면을 탭해 행동";
    }
  }

  function renderHud() {
    const hpMax=maxHp(),hpNow=Math.max(0,Math.floor(S.hp)),hpPercent=Math.max(0,Math.min(100,hpNow/hpMax*100));
    dom.level.textContent=`Lv.${S.lv}`; dom.hp.textContent=`${hpNow.toLocaleString()} / ${hpMax.toLocaleString()}`;dom.hpFill.style.width=`${hpPercent}%`;dom.hpMeter.setAttribute("aria-valuemax",String(hpMax));dom.hpMeter.setAttribute("aria-valuenow",String(hpNow));
    dom.attack.textContent=totalAttack().toLocaleString(); dom.place.textContent=currentPlaceName();
    dom.xpFill.style.width=`${S.lv>=100?100:S.xp/needXp()*100}%`; dom.xpText.textContent=S.lv>=100?"MAX":`${S.xp.toLocaleString()} / ${needXp().toLocaleString()}`;
    const gearSlots=Object.keys(GEAR_LABEL).map(type=>{
      const g=equipped(type); return g?`<div class="equip-slot" title="${TIERS[g.tier]} ${GEAR_LABEL[type]}"><img src="${gearIcon(g)}" alt="${GEAR_LABEL[type]}"><small>${GEAR_LABEL[type]}</small>${g.enh?`<i class="enh-badge">+${g.enh}</i>`:""}</div>`:`<div class="equip-slot empty"><small>${GEAR_LABEL[type]} 없음</small></div>`;
    }).join("");
    const foodIndex=Number.isInteger(S.equippedFood)&&foodCount(S.equippedFood)>0?S.equippedFood:null;
    const foodSlot=foodIndex!==null?`<div class="equip-slot food-slot" title="${RECIPES[foodIndex].name}"><img src="${foodIcon(foodIndex)}" alt="${RECIPES[foodIndex].name}"><i class="food-count-badge">x${foodCount(foodIndex).toLocaleString()}</i><small>음식</small></div>`:`<div class="equip-slot empty food-slot"><small>음식 없음</small></div>`;
    dom.equipped.innerHTML=gearSlots+foodSlot;
    dom.log.innerHTML=S.logs.slice().reverse().map(entry=>`<div class="log-entry ${entry.tone||""}"><img src="${entry.icon}" alt=""><div><time>${new Date(entry.at).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</time><br>${entry.text}</div></div>`).join("") || `<div class="log-entry"><img src="assets/ui/logo_mark.png" alt=""><div>이세계에서 눈을 떴습니다.</div></div>`;
  }

  function showScreen(name) {
    if(name!=="play")setMenuOpen(false);
    [dom.intro,dom.story,dom.bossPrelude,dom.play,dom.ending].forEach(x=>x.classList.remove("active"));
    ({intro:dom.intro,story:dom.story,bossPrelude:dom.bossPrelude,play:dom.play,ending:dom.ending})[name].classList.add("active");
  }

  function playSfx(name) {
    if(!S || !SFX_FILES.has(name) || S.settings.sfx<=0) return;
    const audio=new Audio(`assets/audio/sfx/${name}.ogg`); audio.volume=Math.min(1,S.settings.sfx); audio.play().catch(()=>{});
  }

  function setBgm(key) {
    if(!S || !BGM_FILES[key]) return;
    if(bgmKey===key&&bgm){bgm.volume=Math.min(1,S.settings.bgm*1.4);if(S.settings.bgm>0&&bgm.paused)bgm.play().catch(()=>{});return;}
    bgmKey=key;
    if(bgm){bgm.pause();bgm=null;}
    bgm=new Audio(`assets/audio/bgm/${BGM_FILES[key]}.ogg`); bgm.loop=true; bgm.volume=Math.min(1,S.settings.bgm*1.4);
    if(S.settings.bgm>0) bgm.play().catch(()=>{});
  }

  function toast(message,ms=1500) {
    clearTimeout(toastTimer); dom.toast.textContent=message; dom.toast.classList.add("show");
    toastTimer=setTimeout(()=>dom.toast.classList.remove("show"),ms);
  }

  function showConfirm(title,message,confirmText="확인") {
    return new Promise(resolve=>{
      dom.dialogTitle.textContent=title; dom.dialogMessage.textContent=message; dom.dialogConfirm.textContent=confirmText;
      dom.dialog.classList.add("open"); dom.dialog.setAttribute("aria-hidden","false");
      const finish=value=>{dom.dialog.classList.remove("open");dom.dialog.setAttribute("aria-hidden","true");dom.dialogConfirm.onclick=null;dom.dialogCancel.onclick=null;resolve(value);};
      dom.dialogConfirm.onclick=()=>finish(true); dom.dialogCancel.onclick=()=>finish(false);
    });
  }

  function costValue(key) {
    const match=key.match(/(wood|ore|gold)(\d)/); return match ? S.res[match[1]][+match[2]] : 0;
  }
  function canPay(cost) { return Object.entries(cost).every(([key,value])=>costValue(key)>=value); }
  function pay(cost) { if(!canPay(cost)) return false; for(const[key,value] of Object.entries(cost)){const m=key.match(/(wood|ore|gold)(\d)/);S.res[m[1]][+m[2]]-=value;} return true; }
  function costMeta(key) { const m=key.match(/(wood|ore|gold)(\d)/); return {kind:m[1],grade:+m[2],name:`${GRADES[+m[2]]} ${RESOURCE_LABEL[m[1]]}`,icon:resourceIcon(m[1],+m[2])}; }

  function requirementHtml(cost) {
    if(!Object.keys(cost).length) return `<div class="requirement-row"><img src="assets/ui/profile.png" alt=""><span>기본 지급 장비</span><b>보유</b></div>`;
    return Object.entries(cost).map(([key,need])=>{const meta=costMeta(key),have=costValue(key);return `<div class="requirement-row ${have<need?"missing":""}"><img src="${meta.icon}" alt=""><span>${meta.name}</span><b>${have.toLocaleString()} / ${need.toLocaleString()}</b></div>`;}).join("");
  }

  function walletHtml() {
    const cards=[];
    for(const kind of ["wood","ore","gold"]) for(let grade=0;grade<3;grade++) cards.push(`<div class="wallet-card"><img src="${resourceIcon(kind,grade)}" alt=""><span>${GRADES[grade]} ${RESOURCE_LABEL[kind]}<b>${S.res[kind][grade].toLocaleString()}</b></span></div>`);
    for(let grade=0;grade<3;grade++) cards.push(`<div class="wallet-card"><img src="${stoneIcon(grade)}" alt=""><span>${GRADES[grade]} 강화돌<b>${S.stones[grade].toLocaleString()}</b></span></div>`);
    return `<div class="resource-wallet">${cards.join("")}</div>`;
  }

  function openView(type,args={},stack=true) {
    setMenuOpen(false);
    if(stack) overlayStack.push({type,args}); else overlayStack[overlayStack.length-1]={type,args};
    dom.overlay.classList.add("open"); dom.overlay.setAttribute("aria-hidden","false"); setBgm("map"); renderView();
  }

  function renderView() {
    const view=overlayStack[overlayStack.length-1]; if(!view) return closeOverlay();
    const renderers={map:renderMap,tier:renderTier,workshop:renderWorkshop,realestate:renderEstate,cooking:renderCooking,enhance:renderEnhance,profile:renderProfile,settings:renderSettings};
    renderers[view.type](view.args||{});
  }

  function setOverlayHeader(title,subtitle="") { dom.overlayTitle.textContent=title; dom.overlaySubtitle.textContent=subtitle; }

  function closeOverlay() {
    overlayStack=[]; dom.overlay.classList.remove("open"); dom.overlay.setAttribute("aria-hidden","true");
    if(dom.play.classList.contains("active")) setBgm(S.place);
  }

  function overlayBack() {
    playSfx("ui_back");
    if(overlayStack.length>1){overlayStack.pop();renderView();}else closeOverlay();
  }

  function renderMap() {
    setOverlayHeader("지도","이세계에서 살아갈 장소를 선택합니다");
    refreshWorldGateUnlock();
    const world=S.worldGateUnlocked?`<button class="map-point world" data-do="world">원래세계로 가는 문</button>`:"";
    dom.overlayContent.innerHTML=`<div class="map-area">${world}<button class="map-point home" data-do="travel" data-place="home">집</button><button class="map-point forest" data-do="tier" data-place="forest">숲</button><button class="map-point pond" data-do="travel" data-place="pond">연못</button><button class="map-point mine" data-do="tier" data-place="mine">광산</button><button class="map-point dungeon" data-do="tier" data-place="dungeon">던전</button></div>`;
  }

  function renderTier({place}) {
    setOverlayHeader(`${PLACE_LABEL[place]} 선택`,"등급이 높을수록 강한 장비가 필요합니다");
    dom.overlayContent.innerHTML=`<div class="tier-grid">${[0,1,2].map(grade=>`<button class="tier-option ${["low","mid","high"][grade]}" data-do="travel" data-place="${place}" data-grade="${grade}"><img src="assets/targets/${place==="forest"?"tree":place==="mine"?"ore":"monster"}_${["low","mid","high"][grade]}.png" alt=""><span><strong>${GRADES[grade]} ${PLACE_LABEL[place]}</strong><small>HP ${TARGET_STATS[grade].min.toLocaleString()}~${TARGET_STATS[grade].max.toLocaleString()} · 방어력 ${TARGET_STATS[grade].def.toLocaleString()} · EXP ${TARGET_STATS[grade].xp.toLocaleString()}</small></span></button>`).join("")}</div>`;
  }

  function renderWorkshop() {
    const {type,tier}=selectedWorkshop, cost=GEAR_COST[type][tier], sample={type,tier,enh:0};
    setOverlayHeader("제작소","도구와 갑옷을 재료로 직접 제작합니다");
    const stat=gearEffectText(sample);
    dom.overlayContent.innerHTML=`
      <div class="category-tabs">${Object.keys(GEAR_LABEL).map(key=>`<button class="${key===type?"active":""}" data-do="workshop-type" data-type="${key}">${GEAR_LABEL[key]}</button>`).join("")}</div>
      <div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="${gearIcon(sample)}" alt=""></div><div class="detail-copy"><h3>${TIERS[tier]} ${GEAR_LABEL[type]}</h3><p class="value">${stat}</p><p>${tier===0?"처음 지급되는 기본 장비입니다.":"같은 장비를 여러 개 제작할 수 있습니다."}</p></div></div><div class="requirements"><div class="section-title">보유 아이템 / 필요 아이템</div>${requirementHtml(cost)}<button class="primary-button wide-action" data-do="craft" ${tier===0||!canPay(cost)||crafting?"disabled":""}>${tier===0?"기본 지급":crafting?"제작 완료!":"제작하기"}</button></div></div>
      <div class="section-title">제작 목록</div><div class="item-list">${[0,1,2,3,4].map(i=>{const item={type,tier:i,enh:0};return `<button class="item-card ${i===tier?"selected":""}" data-do="workshop-tier" data-tier="${i}"><img src="assets/items/${type}_${i}.png" alt=""><span><b>${TIERS[i]} ${GEAR_LABEL[type]}</b><small>${gearEffectText(item)}</small></span></button>`;}).join("")}</div>
      <div class="section-title">보유 재화</div>${walletHtml()}`;
  }

  function craftSelected() {
    if(crafting)return;
    const {type,tier}=selectedWorkshop, cost=GEAR_COST[type][tier];
    if(inventoryGearCount()>=GEAR_CAPACITY){toast("보관함이 가득 찼습니다. 장비를 버린 뒤 제작해 주세요.");playSfx("ui_error");return;}
    if(tier===0||!pay(cost)){playSfx("ui_error");return;}
    crafting=true;
    const gear={id:newId(type),type,tier,enh:0};S.gear.push(gear);refreshWorldGateUnlock(true);addLog(`${TIERS[tier]} ${GEAR_LABEL[type]} 제작 완료.`,gearIcon(gear),"good");playSfx("purchase");toast("제작 완료!",1500);renderWorkshop();renderHud();persist();
    setTimeout(()=>{crafting=false;if(dom.overlay.classList.contains("open"))renderWorkshop();},1000);
  }

  function renderEstate() {
    const house=HOUSES[selectedHouse],owned=S.houses[selectedHouse]; setOverlayHeader("부동산","집을 구입하고 휴식처를 지정합니다");
    dom.overlayContent.innerHTML=`<div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="assets/bg/home${selectedHouse+1}.png" alt=""></div><div class="detail-copy"><h3>${house.name}</h3><p class="value">1초마다 체력 +${house.heal}</p><p>${S.house===selectedHouse?"현재 휴식처":owned?"보유 중":"미보유"}</p></div></div><div class="requirements"><div class="section-title">보유 아이템 / 필요 아이템</div>${requirementHtml(house.cost)}<button class="primary-button wide-action" data-do="house-action" ${!owned&&!canPay(house.cost)?"disabled":""}>${owned?(S.house===selectedHouse?"사용 중":"휴식처로 지정"):"구입하기"}</button></div></div><div class="section-title">매물 목록</div><div class="item-list">${HOUSES.map((h,i)=>`<button class="item-card ${i===selectedHouse?"selected":""}" data-do="house-select" data-house="${i}"><img src="assets/bg/home${i+1}.png" alt=""><span><b>${h.name}</b><small>1초당 +${h.heal} · ${S.houses[i]?"보유":"미보유"}</small></span></button>`).join("")}</div>`;
  }

  function houseAction() {
    const h=HOUSES[selectedHouse];
    if(S.houses[selectedHouse]) { S.house=selectedHouse; addLog(`${h.name}을 휴식처로 지정.`,"assets/ui/realestate.png","good"); playSfx("equip"); }
    else if(pay(h.cost)) { S.houses[selectedHouse]=true; addLog(`${h.name} 구입 완료.`,"assets/ui/realestate.png","good"); playSfx("purchase"); }
    renderEstate();render();persist();
  }

  function fishRequirementHtml(cost) {
    return Object.entries(cost).map(([name,need])=>{const have=S.fish[name];return `<div class="requirement-row ${have<need?"missing":""}"><img src="${fishIcon(name)}" alt=""><span>${name}</span><b>${have.toLocaleString()} / ${need.toLocaleString()}</b></div>`;}).join("");
  }
  function canFishPay(cost){return Object.entries(cost).every(([n,v])=>S.fish[n]>=v);}
  function fishPay(cost){if(!canFishPay(cost))return false;for(const[n,v]of Object.entries(cost))S.fish[n]-=v;return true;}

  function renderCooking() {
    const recipe=RECIPES[selectedRecipe];setOverlayHeader("요리","낚시 재료로 회복 음식을 요리합니다");
    dom.overlayContent.innerHTML=`<div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="assets/foods/${recipe.icon}.png" alt=""></div><div class="detail-copy"><h3>${recipe.name}</h3><p class="value">체력 +${recipe.heal.toLocaleString()}</p><p>보유 ${foodCount(selectedRecipe).toLocaleString()}개 · 마이페이지에서 장착 또는 섭취</p></div></div><div class="requirements"><div class="section-title">보유 아이템 / 필요 아이템</div>${fishRequirementHtml(recipe.cost)}<button class="primary-button wide-action" data-do="cook" ${!canFishPay(recipe.cost)||foodCount(selectedRecipe)>=MAX_ITEM_COUNT?"disabled":""}>요리하기</button></div></div><div class="section-title">요리 목록</div><div class="item-list">${RECIPES.map((r,i)=>`<button class="item-card ${i===selectedRecipe?"selected":""}" data-do="recipe-select" data-recipe="${i}"><img src="assets/foods/${r.icon}.png" alt=""><span><b>${r.name}</b><small>체력 +${r.heal.toLocaleString()} · 보유 x${foodCount(i).toLocaleString()}</small></span></button>`).join("")}</div><div class="section-title">보유 낚시 재료</div><div class="resource-wallet">${FISH.map(name=>`<div class="wallet-card"><img src="${fishIcon(name)}" alt=""><span>${name}<b>${S.fish[name].toLocaleString()}</b></span></div>`).join("")}</div>`;
  }

  function cookSelected() {
    const r=RECIPES[selectedRecipe];
    if(foodCount(selectedRecipe)>=MAX_ITEM_COUNT||!fishPay(r.cost)){playSfx("ui_error");return;}
    S.foods[selectedRecipe]=capped(foodCount(selectedRecipe)+1);
    const message=`${r.name} 1개를 만들었습니다.`;
    addLog(message,foodIcon(selectedRecipe),"good");playSfx("cook");toast(message);renderCooking();renderHud();persist();
  }

  function enhRequirements(g) {
    const step=g.enh+1;
    if(g.tier<=1)return{0:step}; if(g.tier===2)return{0:step,1:step}; if(g.tier===3)return{1:step,2:step}; return{2:step*2};
  }
  function enhChance(g){return 95-g.enh*5;}

  function renderEnhance() {
    const candidates=S.gear.filter(g=>!g.special);let g=gearById(selectedEnhanceId);if(!g||g.special){g=candidates[0];selectedEnhanceId=g?.id||null;}
    setOverlayHeader("강화","모든 장비를 동일한 확률과 파괴 규칙으로 +10까지 강화합니다");
    if(!g){dom.overlayContent.innerHTML="<p>강화할 장비가 없습니다.</p>";return;}
    const req=g.enh<10?enhRequirements(g):{},ok=Object.entries(req).every(([k,v])=>S.stones[k]>=v);
    const reqHtml=Object.entries(req).map(([grade,need])=>`<div class="requirement-row ${S.stones[grade]<need?"missing":""}"><img src="${stoneIcon(+grade)}" alt=""><span>${GRADES[grade]} 강화의 돌</span><b>${S.stones[grade].toLocaleString()} / ${need}</b></div>`).join("");
    dom.overlayContent.innerHTML=`<div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="${gearIcon(g)}" alt="">${g.enh?`<i class="enh-badge">+${g.enh}</i>`:""}</div><div class="detail-copy"><h3>${gearDisplayName(g)}</h3><p class="value">${gearEffectText(g)}</p><p>${g.enh>=10?"최대 강화":`성공 확률 ${enhChance(g)}%`}<br>${g.tier===0?"실패해도 보존":"실패 시 장비 파괴"}</p></div></div><div class="requirements"><div class="section-title">보유 아이템 / 필요 아이템</div>${g.enh>=10?`<div class="requirement-row"><img src="assets/ui/enhance.png" alt=""><span>최대 강화입니다</span><b>+10</b></div>`:reqHtml}<button class="primary-button wide-action" data-do="enhance-now" ${g.enh>=10||!ok||enhancing?"disabled":""}>${enhancing?"강화 중입니다…":"강화 시작"}</button></div></div><div class="section-title">보유 장비</div><div class="item-list">${candidates.map(item=>`<button class="item-card ${item.id===g.id?"selected":""}" data-do="enhance-select" data-id="${item.id}"><img src="${gearIcon(item)}" alt=""><span><b>${gearDisplayName(item)}</b><small>${gearEffectText(item)}</small></span></button>`).join("")}</div>`;
  }

  function enhanceNow() {
    const g=gearById(selectedEnhanceId);if(!g||g.special||g.enh>=10||enhancing)return;const req=enhRequirements(g);
    if(!Object.entries(req).every(([k,v])=>S.stones[k]>=v)){playSfx("ui_error");return;}
    for(const[k,v]of Object.entries(req))S.stones[k]-=v;enhancing=true;playSfx("enhance_start");renderEnhance();toast("강화 중입니다…",3900);persist();
    setTimeout(()=>{
      const success=rand()*100<enhChance(g);enhancing=false;
      if(success){g.enh++;addLog(`${TIERS[g.tier]} ${GEAR_LABEL[g.type]} +${g.enh} 강화 성공!`,gearIcon(g),"good");playSfx("enhance_success");toast(`강화 성공! +${g.enh}`);}
      else if(g.tier===0){addLog(`허름한 ${GEAR_LABEL[g.type]} 강화 실패. 장비는 보존되었습니다.`,gearIcon(g),"warn");playSfx("enhance_fail");toast("강화 실패 · 장비 보존");}
      else {const label=`${TIERS[g.tier]} ${GEAR_LABEL[g.type]}${g.enh?` +${g.enh}`:""}`;S.gear=S.gear.filter(x=>x.id!==g.id);if(S.equipped[g.type]===g.id){const replacement=S.gear.filter(x=>x.type===g.type).sort((a,b)=>gearPower(b)-gearPower(a))[0];S.equipped[g.type]=replacement?.id||null;if(g.type==="armor")S.hp=Math.min(S.hp,maxHp());}selectedEnhanceId=null;addLog(`${label} 강화 실패. 장비가 파괴되었습니다.`,gearIcon(g),"warn");playSfx("gear_break");toast("강화 실패 · 장비 파괴");}
      renderEnhance();render();persist();
    },4000);
  }

  function renderProfile() {
    const foodSelected=Number.isInteger(selectedFoodIndex)&&foodCount(selectedFoodIndex)>0;
    let g=null;
    if(!foodSelected){g=gearById(selectedGearId);if(!g){g=equipped("axe")||S.gear[0];selectedGearId=g?.id||null;}}
    setOverlayHeader("마이페이지","보유 장비와 음식을 확인하고 사용합니다");
    let detail="";
    if(foodSelected) {
      const recipe=RECIPES[selectedFoodIndex],isEquipped=S.equippedFood===selectedFoodIndex;
      detail=`<div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="${foodIcon(selectedFoodIndex)}" alt=""></div><div class="detail-copy"><h3>${recipe.name} x${foodCount(selectedFoodIndex).toLocaleString()}</h3><p class="value">체력 +${recipe.heal.toLocaleString()}</p><p>${isEquipped?"현재 장착 중 · 체력 0에서 자동 섭취":"보유 중"}</p></div></div><div class="requirements profile-actions"><button class="primary-button" data-do="equip-food" ${isEquipped?"disabled":""}>${isEquipped?"장착 중":"장착하기"}</button><button class="secondary-button" data-do="eat-food" ${S.hp>=maxHp()?"disabled":""}>즉시먹기</button></div></div>`;
    } else if(g) {
      const isEquipped=!g.special&&S.equipped[g.type]===g.id;
      const equipDisabled=g.special||isEquipped,discardDisabled=g.special||g.tier===0||isEquipped;
      detail=`<div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="${gearIcon(g)}" alt="">${g.enh?`<i class="enh-badge">+${g.enh}</i>`:""}</div><div class="detail-copy"><h3>${gearDisplayName(g)}</h3><p class="value">${gearEffectText(g)}</p><p>${g.special?"엔딩 완료 영구 징표":isEquipped?"현재 장착 중":"보유 중"}</p></div></div><div class="requirements profile-actions"><button class="primary-button" data-do="equip" ${equipDisabled?"disabled":""}>${g.special?"장착 불가":isEquipped?"장착 중":"장착하기"}</button><button class="danger-button" data-do="discard" ${discardDisabled?"disabled":""}>${g.special||g.tier===0?"버리기 불가":"버리기"}</button></div></div>`;
    }
    const foodCards=RECIPES.map((recipe,index)=>foodCount(index)>0?`<button class="item-card ${foodSelected&&index===selectedFoodIndex?"selected":""}" data-do="food-select" data-food="${index}"><img src="${foodIcon(index)}" alt=""><span><b>${recipe.name} <em class="food-stack">x${foodCount(index).toLocaleString()}</em></b><small>${S.equippedFood===index?"장착 중":"보유"}</small></span></button>`:"").join("");
    const foodKinds=RECIPES.filter((_,index)=>foodCount(index)>0).length;
    dom.overlayContent.innerHTML=`${detail}<div class="section-title">보유 장비 ${inventoryGearCount()}/${GEAR_CAPACITY}${foodKinds?` · 음식 ${foodKinds}종`:""}${S.gear.some(item=>item.special)?" · 이스터에그 보유":""}</div><div class="gear-inventory-box"><div class="item-list">${S.gear.map(item=>`<button class="item-card ${!foodSelected&&item.id===g?.id?"selected":""}" data-do="gear-select" data-id="${item.id}"><img src="${gearIcon(item)}" alt=""><span><b>${gearDisplayName(item)}</b><small>${item.special?"영구 징표":S.equipped[item.type]===item.id?"장착 중":"보유"}</small></span></button>`).join("")}${foodCards}</div></div><div class="section-title">보유 재화</div>${walletHtml()}<div class="section-title">낚시 재료</div><div class="resource-wallet">${FISH.map(name=>`<div class="wallet-card"><img src="${fishIcon(name)}" alt=""><span>${name}<b>${S.fish[name].toLocaleString()}</b></span></div>`).join("")}</div>`;
  }

  function equipSelected() {
    const g=gearById(selectedGearId);if(!g||g.special)return;S.equipped[g.type]=g.id;if(S.hp>maxHp())S.hp=maxHp();addLog(`${gearDisplayName(g)} 장착.`,gearIcon(g),"good");playSfx("equip");renderProfile();render();persist();
  }

  function equipSelectedFood() {
    if(!Number.isInteger(selectedFoodIndex)||foodCount(selectedFoodIndex)<=0)return;
    S.equippedFood=selectedFoodIndex;
    addLog(`${RECIPES[selectedFoodIndex].name} 장착. 체력 0에서 자동으로 먹습니다.`,foodIcon(selectedFoodIndex),"good");
    playSfx("equip");renderProfile();render();persist();
  }

  function eatSelectedFood() {
    if(!Number.isInteger(selectedFoodIndex)||!consumeFood(selectedFoodIndex)){playSfx("ui_error");return;}
    if(foodCount(selectedFoodIndex)<=0)selectedFoodIndex=null;
    renderProfile();render();persist();
  }

  async function discardSelected() {
    const g=gearById(selectedGearId);if(!g)return;
    if(g.special){toast("이스터에그는 버릴 수 없습니다.");playSfx("ui_error");return;}
    if(g.tier===0){toast("허름한 장비는 버릴 수 없습니다.");playSfx("ui_error");return;}
    if(S.equipped[g.type]===g.id){toast("장착 중인 장비는 버릴 수 없습니다.");playSfx("ui_error");return;}
    const label=gearDisplayName(g);
    const yes=await showConfirm("장비 버리기",`${label} 장비를 버리시겠습니까?\n버린 장비는 복구할 수 없습니다.`,"버리기");
    if(!yes)return;
    S.gear=S.gear.filter(item=>item.id!==g.id);selectedGearId=S.gear[0]?.id||null;addLog(`${label} 장비를 버렸습니다.`,gearIcon(g),"warn");playSfx("ui_confirm");renderProfile();render();persist();
  }

  function renderSettings() {
    setOverlayHeader("설정","음량·게임 종료");
    dom.overlayContent.innerHTML=`<div class="settings-group"><label><span>BGM</span><input type="range" min="0" max="100" value="${Math.round(S.settings.bgm*100)}" data-setting="bgm"><b>${Math.round(S.settings.bgm*100)}%</b></label><label><span>효과음</span><input type="range" min="0" max="100" value="${Math.round(S.settings.sfx*100)}" data-setting="sfx"><b>${Math.round(S.settings.sfx*100)}%</b></label></div><div class="settings-actions"><button class="danger-button" data-do="quit">게임 종료</button><button class="danger-button" data-do="reset">세이브 초기화</button></div><p class="section-title">진행 상황은 자동 저장됩니다 · 버전 ${APP_VERSION}</p>`;
  }

  function clearCinematicTimers() { cinematicToken++; for(const timer of cinematicTimers) clearTimeout(timer); cinematicTimers=[]; }
  function cinematicLater(callback,delay,token=cinematicToken) { const timer=setTimeout(()=>{if(token===cinematicToken)callback();},delay);cinematicTimers.push(timer);return timer; }

  async function worldConfirm() {
    const yes=await showConfirm("원래세계로 귀환","원래세계로 가면 이세계로 다시는 돌아올 수 없습니다.\n계속하시겠습니까?","귀환한다");
    if(!yes)return;
    S.auto=false;S.fishState=null;await persist();closeOverlay();startBossPrelude();
  }

  function startBossPrelude() {
    clearCinematicTimers();const token=cinematicToken;
    showScreen("bossPrelude");$("bossChallenge").classList.add("hidden");setBgm("dungeon");
    cinematicLater(()=>$("bossChallenge").classList.remove("hidden"),BOSS_PRELUDE_MS,token);
  }

  function startFinalBattle() {
    clearCinematicTimers();S.place="worldtree";S.grade=2;S.auto=false;S.fishState=null;newTarget();
    addLog("칠흑의 동굴에서 최종 세계수와 마주했습니다.","assets/targets/worldtree.png","rare");showScreen("play");render();startLoops();setBgm("worldtree");persist();
  }

  function startOpeningStory() {
    clearCinematicTimers();const token=cinematicToken;const image=$("storyImage"),blackout=$("storyBlackout");
    showScreen("story");setBgm("title");blackout.classList.remove("show");image.className="story-image intro-one";image.src="assets/bg/story_intro1.png";
    cinematicLater(()=>{image.className="story-image intro-two shake";image.src="assets/bg/story_intro2.png";},OPENING_SCENE_MS,token);
    cinematicLater(()=>{blackout.classList.add("show");},OPENING_SCENE_MS*2,token);
    cinematicLater(()=>{image.className="story-image intro-three dust-in";image.src="assets/bg/story_intro3.png";blackout.classList.remove("show");},OPENING_SCENE_MS*2+OPENING_BLACK_MS,token);
    cinematicLater(()=>{S.openingSeen=true;persist();enterPlay();},OPENING_SCENE_MS*3+OPENING_BLACK_MS,token);
  }

  function startEnding() {
    clearCinematicTimers();const token=cinematicToken;
    S.ended=true;S.auto=false;S.fishState=null;persist();showScreen("ending");setBgm("ending");
    const images=$("endingImages"),first=$("endingReturnImage"),second=$("endingFinalImage"),track=$("endingCreditsTrack"),actions=$("endingActions");
    images.classList.remove("fade-out");first.classList.add("active");second.classList.remove("active");track.classList.remove("roll");actions.classList.add("hidden");
    cinematicLater(()=>{first.classList.remove("active");second.classList.add("active");},ENDING_SCENE_MS,token);
    cinematicLater(()=>track.classList.add("roll"),ENDING_CREDITS_DELAY_MS,token);
    cinematicLater(()=>images.classList.add("fade-out"),ENDING_SCENE_MS*2,token);
    cinematicLater(()=>finalizeEnding(actions),ENDING_CREDITS_DELAY_MS+ENDING_CREDITS_MS+ENDING_ACTION_DELAY_MS,token);
  }

  async function finalizeEnding(actions) {
    if(saveClearedAfterEnding)return;
    M.endingSeen=true;await persistMeta();await storage.remove();saveClearedAfterEnding=true;actions.classList.remove("hidden");
  }

  function returnToIntroAfterEnding() {
    clearCinematicTimers();saveClearedAfterEnding=false;S=freshState();addLog("이세계에서 눈을 떴습니다.");showScreen("intro");renderIntro();setBgm("title");
  }

  async function resetSave() {
    const yes=await showConfirm("세이브 초기화","모든 진행 상황과 장비가 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.","초기화");
    if(!yes)return;clearCinematicTimers();await storage.remove();saveClearedAfterEnding=false;S=freshState();addLog("이세계에서 눈을 떴습니다.");closeOverlay();showScreen("intro");renderIntro();setBgm("title");playSfx("ui_confirm");
  }

  async function quitGame() {
    await persist();
    if(window.__TAURI__?.core?.invoke){try{await window.__TAURI__.core.invoke("quit_game");return;}catch(error){console.warn(error);}}
    window.close();toast("창 닫기 버튼으로 종료할 수 있습니다.");
  }

  function renderIntro() {
    const last=new Date(S.lastVisit||S.lastSeen||Date.now()).toLocaleString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
    $("saveSummary").innerHTML=S.ended?`<b>귀환 완료</b><br>Lv.${S.lv} · ${last}`:`<b>내 세이브</b><br>최근 접속 ${last} · Lv.${S.lv} · 체력 ${Math.floor(S.hp).toLocaleString()} / ${maxHp().toLocaleString()}`;
    $("startButton").textContent=S.ended?"엔딩 보기":"게임 시작";$("versionResetNote").textContent=resetNotice;
  }

  async function startGame() {
    if(S.ended){startEnding();return;}
    if(!S.openingSeen){startOpeningStory();return;}
    enterPlay();
  }

  async function enterPlay() {
    settleOffline(Date.now());
    if(S.ended){startEnding();return;}
    showScreen("play");render();startLoops();setBgm(S.place);await persist();
  }

  function sceneAction(event) {
    if(event.target.closest("button")||dom.overlay.classList.contains("open"))return;
    if(menuOpen){setMenuOpen(false);return;}
    if(S.place==="home") {toggleResting();return;}
    if(S.place==="pond") {
      if(S.fishState){dom.bobber.style.animation="none";void dom.bobber.offsetWidth;dom.bobber.style.animation="bob .22s ease-in-out 2 alternate";setTimeout(()=>dom.bobber.style.animation="",500);}else startFishing(false);
      return;
    }
    if(actionLocked)return;workAction(false);
  }

  function logicalBack() {
    if(dom.dialog.classList.contains("open")){dom.dialogCancel.click();return;}
    if(dom.overlay.classList.contains("open")){overlayBack();return;}
    if(menuOpen){setMenuOpen(false);return;}
    const now=Date.now();if(now-lastBackAt<2000){quitGame();return;}lastBackAt=now;toast("한 번 더 누르면 게임이 종료됩니다.",1800);
  }

  function handleOverlayClick(event) {
    const el=event.target.closest("[data-do]");if(!el)return;playSfx("ui_click");const action=el.dataset.do;
    if(action==="travel")travel(el.dataset.place,+(el.dataset.grade||0));
    else if(action==="tier")openView("tier",{place:el.dataset.place});
    else if(action==="world")worldConfirm();
    else if(action==="workshop-type"){selectedWorkshop.type=el.dataset.type;selectedWorkshop.tier=1;renderWorkshop();}
    else if(action==="workshop-tier"){selectedWorkshop.tier=+el.dataset.tier;renderWorkshop();}
    else if(action==="craft")craftSelected();
    else if(action==="house-select"){selectedHouse=+el.dataset.house;renderEstate();}
    else if(action==="house-action")houseAction();
    else if(action==="recipe-select"){selectedRecipe=+el.dataset.recipe;renderCooking();}
    else if(action==="cook")cookSelected();
    else if(action==="enhance-select"){selectedEnhanceId=el.dataset.id;renderEnhance();}
    else if(action==="enhance-now")enhanceNow();
    else if(action==="gear-select"){selectedGearId=el.dataset.id;selectedFoodIndex=null;renderProfile();}
    else if(action==="food-select"){selectedFoodIndex=+el.dataset.food;selectedGearId=null;renderProfile();}
    else if(action==="equip")equipSelected();
    else if(action==="equip-food")equipSelectedFood();
    else if(action==="eat-food")eatSelectedFood();
    else if(action==="discard")discardSelected();
    else if(action==="quit")quitGame();
    else if(action==="reset")resetSave();
  }

  function pauseForBackground() {
    if(!S)return;
    settleOffline(Date.now());persist(false);if(bgm)bgm.pause();
  }

  function resumeFromBackground() {
    if(!S||document.hidden)return;
    settleOffline(Date.now());
    if(dom.play.classList.contains("active")) {
      if(S.ended)startEnding();
      else {render();startLoops();setBgm(dom.overlay.classList.contains("open")?"map":S.place);persist(false);}
    } else if(dom.intro.classList.contains("active"))setBgm("title");
    else if(dom.ending.classList.contains("active"))setBgm("ending");
  }

  function bindEvents() {
    $("startButton").addEventListener("click",startGame);$("resetButton").addEventListener("click",resetSave);$("introQuitButton").addEventListener("click",quitGame);$("endingQuitButton").addEventListener("click",quitGame);
    $("bossStartButton").addEventListener("click",startFinalBattle);$("endingIntroButton").addEventListener("click",returnToIntroAfterEnding);
    dom.scene.addEventListener("click",sceneAction);dom.menuToggle.addEventListener("click",event=>{event.stopPropagation();playSfx("ui_click");toggleMenu();});dom.autoButton.addEventListener("click",event=>{event.stopPropagation();toggleAuto();setMenuOpen(false);});
    dom.mainMenu.addEventListener("click",event=>{const button=event.target.closest("[data-menu]");if(!button)return;playSfx("ui_click");openView(button.dataset.menu);});
    $("backButton").addEventListener("click",overlayBack);$("closeButton").addEventListener("click",()=>{playSfx("ui_back");closeOverlay();});dom.overlayContent.addEventListener("click",handleOverlayClick);
    dom.overlayContent.addEventListener("input",event=>{const input=event.target.closest("[data-setting]");if(!input)return;const key=input.dataset.setting;S.settings[key]=+input.value/100;input.nextElementSibling.textContent=`${input.value}%`;if(key==="bgm"&&bgm){bgm.volume=Math.min(1,S.settings.bgm*1.4);if(S.settings.bgm>0&&bgm.paused)bgm.play().catch(()=>{});}persist();});
    document.addEventListener("pointerdown",()=>{if(dom.intro.classList.contains("active"))setBgm("title");},{once:true});
    document.addEventListener("visibilitychange",()=>document.hidden?pauseForBackground():resumeFromBackground());
    document.addEventListener("freeze",pauseForBackground);document.addEventListener("resume",resumeFromBackground);
    window.addEventListener("pagehide",pauseForBackground);window.addEventListener("pageshow",resumeFromBackground);window.addEventListener("focus",resumeFromBackground);
    window.addEventListener("beforeunload",()=>{if(S&&!saveClearedAfterEnding){S.lastSeen=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(S));}});
    history.replaceState({gameRoot:true},"");history.pushState({gameGuard:true},"");window.addEventListener("popstate",()=>{logicalBack();history.pushState({gameGuard:true},"");});
  }

  async function init() {
    const metaRaw=await storage.loadMeta();
    if(metaRaw){try{const parsed=JSON.parse(metaRaw);M={endingSeen:!!parsed.endingSeen};}catch(error){M={endingSeen:false};}}
    const raw=await storage.load();
    if(raw){
      try{const parsed=JSON.parse(raw);if(parsed.version===APP_VERSION)S=parsed;else{resetNotice=`업데이트 ${APP_VERSION} 적용으로 이전 세이브가 초기화되었습니다.`;await storage.remove();S=freshState();}}
      catch(error){resetNotice="손상된 세이브를 초기화했습니다.";S=freshState();}
    } else S=freshState();
    S.settings=S.settings||{bgm:.5,sfx:.5};S.logs=Array.isArray(S.logs)?S.logs:[];S.restProgress=0;S.restElapsed=S.restElapsed||0;S.resting=!!S.resting;S.openingSeen=!!S.openingSeen;S.worldGateUnlocked=!!S.worldGateUnlocked;S.fish=S.fish||{};S.foods=Array.isArray(S.foods)?S.foods:Array(RECIPES.length).fill(0);normalizeInventory();refreshWorldGateUnlock();
    if(M.endingSeen&&!S.gear.some(g=>g.special))S.gear.push({id:"easter_egg",type:"easteregg",tier:0,enh:0,special:true});
    if(!S.logs.length)addLog("이세계에서 눈을 떴습니다.");
    bindEvents();renderIntro();showScreen("intro");
  }

  if (location.search.includes("debug")) {
    window.__GAME_DEBUG__ = {
      state: () => S,
      meta: () => M,
      replaceState: (next) => { S = next; },
      replaceMeta: (next) => { M = next; },
      freshState,
      maxHp,
      gearPower,
      enhancementMultiplier,
      rodMeanSeconds,
      refreshWorldGateUnlock,
      hasAllDivineGear,
      normalizeInventory,
      foodCount,
      consumeFood,
      handleExhaustion,
      stoneDropGrade,
      stoneDropGradeForPlace,
      totalAttack,
      settleOffline,
      workAction,
      startFishing,
      completeFishing,
      travel,
      toggleAuto,
      toggleResting,
      renderWorkshop,
      renderEstate,
      renderCooking,
      renderEnhance,
      renderProfile,
      renderSettings,
      renderHud,
      craftSelected,
      cookSelected,
      equipSelectedFood,
      eatSelectedFood,
      selectRecipe:(index)=>{selectedRecipe=Math.max(0,Math.min(RECIPES.length-1,Number(index)||0));},
      selectFood:(index)=>{selectedFoodIndex=Number(index);selectedGearId=null;},
      sceneAction,
      discardSelected,
      startFinalBattle,
      startEnding,
      finalizeEnding,
      setMenuOpen,
      constants:{MAX_ITEM_COUNT,GEAR_CAPACITY,FINAL_BOSS,ROD_PROBS,HOUSES,RECIPES},
    };
  }

  init();
})();
