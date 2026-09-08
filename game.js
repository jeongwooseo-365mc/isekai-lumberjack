(() => {
  "use strict";

  const APP_VERSION = "1.2.2";
  const MAX_LEVEL = 150;
  const SAVE_VERSION = "1.1.0";
  const SAVE_KEY = "isekai_lumberjack_save_v11";
  const META_KEY = "isekai_lumberjack_meta";
  const MAX_ITEM_COUNT = 99999;
  const GEAR_CAPACITY = 40;
  const BOSS_PRELUDE_MS = 2000;
  const OPENING_SCENE_MS = 5000;
  const OPENING_BLACK_MS = 3000;
  const ENDING_SCENE_MS = 10000;
  const ENDING_CREDITS_DELAY_MS = 3000;
  const ENDING_CREDITS_MS = 38000;
  const ENDING_ACTION_DELAY_MS = 5000;
  const SECRET_EXCHANGE_INTERVAL_MS = 6 * 60 * 60 * 1000;
  const SECRET_EXCHANGE_OFFER_COUNT = 4;
  const FINAL_BOSS = { hp: 10000000, def: 20000, reflectMin: 75, reflectMax: 150 };
  const TOP_REFLECTION = { min: 5, max: 20 };
  const TIERS = ["허름한", "쓸만한", "장인의", "영웅의", "신의"];
  const GRADES = ["하급", "중급", "상급", "최상급"];
  const AREA_ASSET_GRADES = ["low", "mid", "high", "top"];
  const TOME_LABEL = { wood: "목의 비의서", ore: "철의 비의서", gold: "금의 비의서" };
  const GEAR_LABEL = { axe: "도끼", pickaxe: "곡괭이", rod: "낚싯대", sword: "검", armor: "갑옷" };
  const WEAPON_POWER = [10, 20, 100, 700, 5000];
  const ARMOR_HP = [100, 200, 500, 1500, 5000];
  const PLACE_LABEL = { home: "집", forest: "숲", mine: "광산", pond: "연못", dungeon: "던전", worldtree: "칠흑의 세계수" };
  const PLACE_RESOURCE = { forest: "wood", mine: "ore", dungeon: "gold" };
  const RESOURCE_LABEL = { wood: "목재", ore: "광석", gold: "금화" };
  const FISH = ["해초", "조개", "민어", "숭어", "연어", "랍스터"];
  const FISH_KEY = { 해초: "seaweed", 조개: "shell", 민어: "croaker", 숭어: "mullet", 연어: "salmon", 랍스터: "lobster" };
  const ROD_PROBS = [[80,19,1,0,0,0],[70,20,8,1.6,.3,.1],[60,25,10,3.4,1.2,.4],[50,20,20,11,3,1],[30,15,25,16,11,4]];
  const TARGET_STATS = [
    { min: 200, max: 400, def: 0, xp: 20 },
    { min: 1000, max: 2000, def: 200, xp: 100 },
    { min: 5000, max: 10000, def: 1000, xp: 1000 },
    { min: 30000, max: 45000, def: 5000, xp: 10000 },
  ];

  const GEAR_COST = {
    axe: [{}, {wood0:100}, {wood0:1000,gold0:1000,wood1:100,gold1:100}, {wood1:1000,gold1:1000,wood2:100,gold2:100}, {wood2:2000,gold2:2000,tome_wood:100}],
    pickaxe: [{}, {ore0:100}, {ore0:1000,gold0:1000,ore1:100,gold1:100}, {ore1:1000,gold1:1000,ore2:100,wood2:100}, {ore2:2000,gold2:2000,tome_ore:100}],
    sword: [{}, {wood0:50,ore0:50}, {wood0:1000,ore0:1000,wood1:100,ore1:100}, {wood1:1000,ore1:1000,wood2:100,ore2:100}, {wood2:2000,ore2:2000,tome_gold:100}],
    rod: [{}, {wood0:20,ore0:20,gold0:40}, {wood0:200,ore0:200,gold0:400,wood1:20,ore1:20,gold1:40}, {wood1:200,ore1:200,gold1:400,wood2:20,ore2:20,gold2:40}, {wood2:400,ore2:400,gold2:800,tome_wood:20,tome_ore:20,tome_gold:40}],
    armor: [{}, {wood0:40,ore0:40,gold0:20}, {wood0:400,ore0:400,gold0:200,wood1:40,ore1:40,gold1:20}, {wood1:400,ore1:400,gold1:200,wood2:40,ore2:40,gold2:20}, {wood2:800,ore2:800,gold2:400,tome_wood:40,tome_ore:40,tome_gold:20}],
  };

  const HOUSES = [
    { name: "초라한 오두막", heal: 1, cost: {} },
    { name: "괜찮은 목조주택", heal: 2, cost: {gold0:1000} },
    { name: "넓은 전원주택", heal: 5, cost: {gold1:1000} },
    { name: "고급 저택", heal: 20, cost: {gold1:5000,gold2:1000} },
    { name: "귀족풍 대저택", heal: 100, cost: {gold1:9999,gold2:9999} },
  ];

  const RECIPES = [
    { name: "생선 수프", icon: "fish_soup", heal: 75, cost: {해초:100,민어:20} },
    { name: "해산물 스튜", icon: "seafood_stew", heal: 225, cost: {해초:100,조개:100,민어:50} },
    { name: "구운 생선", icon: "grilled_fish", heal: 100, cost: {숭어:10} },
    { name: "연어 스테이크", icon: "salmon_steak", heal: 200, cost: {연어:10} },
    { name: "고급 랍스터 정식", icon: "lobster_course", heal: 400, cost: {랍스터:10} },
  ];

  const SECRET_EXCHANGE_TEMPLATES = [
    { id:1, minLevel:30, reward:{key:"stone0",amount:500}, costs:[{key:"stone1",min:30,max:70}] },
    { id:2, minLevel:60, reward:{key:"stone1",amount:500}, costs:[{key:"stone2",min:30,max:70}] },
    { id:3, minLevel:30, reward:{key:"wood1",amount:100}, costs:[{key:"wood0",min:1000,max:2000},{key:"gold0",min:1000,max:2000}] },
    { id:4, minLevel:30, reward:{key:"ore1",amount:100}, costs:[{key:"ore0",min:1000,max:2000},{key:"gold0",min:1000,max:2000}] },
    { id:5, minLevel:30, reward:{key:"gold1",amount:100}, costs:[{key:"wood0",min:1000,max:2000},{key:"ore0",min:1000,max:2000}] },
    { id:6, minLevel:60, reward:{key:"wood2",amount:100}, costs:[{key:"wood1",min:1000,max:2000},{key:"gold1",min:1000,max:2000}] },
    { id:7, minLevel:60, reward:{key:"ore2",amount:100}, costs:[{key:"ore1",min:1000,max:2000},{key:"gold1",min:1000,max:2000}] },
    { id:8, minLevel:60, reward:{key:"gold2",amount:100}, costs:[{key:"wood1",min:1000,max:2000},{key:"ore1",min:1000,max:2000}] },
    { id:9, minLevel:30, reward:{key:"food0",amount:5}, randomCostKeys:["wood0","ore0","gold0"], costs:[{min:700,max:1300}] },
    { id:10, minLevel:30, reward:{key:"food2",amount:4}, randomCostKeys:["wood0","ore0","gold0"], costs:[{min:700,max:1300}] },
    { id:11, minLevel:30, reward:{key:"wood0",amount:1000}, costs:[{key:"wood1",min:100,max:200}] },
    { id:12, minLevel:30, reward:{key:"ore0",amount:1000}, costs:[{key:"ore1",min:100,max:200}] },
    { id:13, minLevel:30, reward:{key:"gold0",amount:1000}, costs:[{key:"gold1",min:100,max:200}] },
    { id:14, minLevel:60, reward:{key:"wood1",amount:1000}, costs:[{key:"wood2",min:100,max:200}] },
    { id:15, minLevel:60, reward:{key:"ore1",amount:1000}, costs:[{key:"ore2",min:100,max:200}] },
    { id:16, minLevel:60, reward:{key:"gold1",amount:1000}, costs:[{key:"gold2",min:100,max:200}] },
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
    menuToggle: $("menuToggle"), mainMenu: $("mainMenu"), mapMenuButton: $("mapMenuButton"), targetHud: $("targetHud"), targetArea: $("targetArea"), targetName: $("targetName"), targetImage: $("targetImage"), targetHpFill: $("targetHpFill"), targetHpText: $("targetHpText"),
    character: $("character"), fishingLine: $("fishingLine"), bobber: $("bobber"), fishingStatus: $("fishingStatus"), tapHint: $("tapHint"), lootBurst: $("lootBurst"), hitFlash: $("hitFlash"),
    level: $("levelLabel"), xpFill: $("xpFill"), xpText: $("xpText"), hp: $("hpStat"), hpMeter: $("hpMeter"), hpFill: $("hpFill"), attack: $("attackStat"), place: $("placeStat"), equipped: $("equippedGrid"), log: $("logPanel"),
    autoButton: $("autoButton"), autoState: $("autoState"), overlay: $("overlay"), overlayTitle: $("overlayTitle"), overlaySubtitle: $("overlaySubtitle"), overlayContent: $("overlayContent"),
    toast: $("toast"), dialog: $("confirmDialog"), dialogTitle: $("dialogTitle"), dialogMessage: $("dialogMessage"), dialogCancel: $("dialogCancel"), dialogConfirm: $("dialogConfirm"), guide: $("newUserGuide"),
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
  let selectedSecretOfferId = null;
  let tutorialStage = "";

  function newId(prefix="g") { return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random()*1e9).toString(36)}`; }

  function freshState() {
    const gear = Object.keys(GEAR_LABEL).map((type, i) => ({ id:`starter_${type}_${i}`, type, tier:0, enh:0 }));
    if(M.endingSeen) gear.push({id:"easter_egg",type:"easteregg",tier:0,enh:0,special:true});
    return {
      version: SAVE_VERSION, lv:1, xp:0, hp:500, place:"home", grade:0, auto:false, resting:false,
      rngSeed: (Date.now() >>> 0) || 1, res:{wood:[0,0,0],ore:[0,0,0],gold:[0,0,0]},
      tomes:{wood:0,ore:0,gold:0},
      fish:Object.fromEntries(FISH.map(x=>[x,0])), stones:[0,0,0], houses:[true,false,false,false,false], house:0,
      gear, equipped:Object.fromEntries(gear.filter(g=>!g.special).map(g=>[g.type,g.id])), foods:Array(RECIPES.length).fill(0), equippedFood:null, unseenGearIds:[], unseenFoodIndices:[], logs:[], target:null, fishState:null,
      restProgress:0, restElapsed:0, openingSeen:false, tutorialSeen:false, secretExchange:null, worldGateUnlocked:false, ended:false, lastSeen:Date.now(), lastVisit:Date.now(), settings:{bgm:.5,sfx:.5},
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

  function randNormStep(min,max,step=10) {
    const rounded=Math.round(randNorm(min,max)/step)*step;
    return Math.max(min,Math.min(max,rounded));
  }

  function secretWindowId(now=Date.now()) {
    const date=new Date(Math.max(0,Number(now)||0));
    const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,"0"),day=String(date.getDate()).padStart(2,"0");
    return `${year}-${month}-${day}-${Math.floor(date.getHours()/6)}`;
  }

  function secretResetAt(now=Date.now()) {
    const date=new Date(Math.max(0,Number(now)||0));
    date.setHours((Math.floor(date.getHours()/6)+1)*6,0,0,0);
    return date.getTime();
  }

  function createSecretExchange(windowId=secretWindowId(),level=S.lv) {
    const pool=SECRET_EXCHANGE_TEMPLATES.filter(template=>level>=template.minLevel).slice();
    for(let index=pool.length-1;index>0;index--){const swap=Math.floor(rand()*(index+1));[pool[index],pool[swap]]=[pool[swap],pool[index]];}
    const offers=pool.slice(0,SECRET_EXCHANGE_OFFER_COUNT).map(template=>{
      const randomKey=template.randomCostKeys?.[Math.floor(rand()*template.randomCostKeys.length)];
      const costs=template.costs.map(cost=>({key:cost.key||randomKey,amount:randNormStep(cost.min,cost.max,10)}));
      return {id:`secret_${windowId}_${template.id}`,templateId:template.id,reward:{...template.reward},costs,claimed:false};
    });
    return {windowId,offers};
  }

  function validSecretExchange(exchange,windowId) {
    return !!exchange&&exchange.windowId===windowId&&Array.isArray(exchange.offers)&&exchange.offers.length===SECRET_EXCHANGE_OFFER_COUNT&&exchange.offers.every(offer=>offer&&typeof offer.id==="string"&&offer.reward&&Array.isArray(offer.costs)&&typeof offer.claimed==="boolean");
  }

  function ensureSecretExchange(now=Date.now(),save=true) {
    if(!S||S.lv<30)return false;
    const windowId=secretWindowId(now);
    if(validSecretExchange(S.secretExchange,windowId))return false;
    S.secretExchange=createSecretExchange(windowId,S.lv);
    selectedSecretOfferId=S.secretExchange.offers[0]?.id||null;
    if(save)persist(false);
    return true;
  }

  function activeSecretOffers(now=Date.now()) {
    if(!S||S.lv<30)return [];
    ensureSecretExchange(now);
    return S.secretExchange.offers.filter(offer=>!offer.claimed);
  }

  function secretExchangeVisible(now=Date.now()) {
    return S.lv>=30&&activeSecretOffers(now).length>0;
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
  function inventoryFoodKindCount() { return RECIPES.filter((_,index)=>foodCount(index)>0).length; }
  function inventoryItemCount() { return S.gear.length+inventoryFoodKindCount(); }
  function foodCount(index) { return capped(S.foods?.[index]); }
  function foodIcon(index) { return `assets/foods/${RECIPES[index].icon}.png`; }
  function resourceIcon(kind, grade) { return `assets/resources/${kind}_${AREA_ASSET_GRADES[grade]}.png`; }
  function stoneIcon(grade) { return `assets/resources/stone_${AREA_ASSET_GRADES[grade]}.png`; }
  function fishIcon(name) { return `assets/resources/${FISH_KEY[name]}.png`; }
  function capped(value) { return Math.max(0,Math.min(MAX_ITEM_COUNT,Math.floor(Number(value)||0))); }
  function compactXp(value) { const amount=Math.max(0,Math.floor(Number(value)||0));return amount>=1000?`${Math.floor(amount/1000)}k`:amount.toLocaleString(); }
  function weightedIndex(weights,unitRoll) {
    const total=weights.reduce((sum,value)=>sum+Math.max(0,Number(value)||0),0);
    if(total<=0)return 0;
    const roll=Math.max(0,Math.min(.999999999999,Number(unitRoll)||0))*total;
    let sum=0;
    for(let index=0;index<weights.length;index++){sum+=Math.max(0,Number(weights[index])||0);if(roll<sum)return index;}
    return Math.max(0,weights.length-1);
  }
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
    S.tomes=Object.fromEntries(Object.keys(TOME_LABEL).map(kind=>[kind,capped(S.tomes?.[kind])]));
    for(const kind of ["wood","ore","gold"]) S.res[kind]=(S.res[kind]||[0,0,0]).map(capped);
    S.stones=(S.stones||[0,0,0]).map(capped);
    for(const name of FISH) S.fish[name]=capped(S.fish[name]);
    S.foods=Array.from({length:RECIPES.length},(_,index)=>capped(S.foods?.[index]));
    if(!Number.isInteger(S.equippedFood)||foodCount(S.equippedFood)<=0)S.equippedFood=null;
    const gearIds=new Set(S.gear.map(item=>item.id));
    S.unseenGearIds=Array.from(new Set(Array.isArray(S.unseenGearIds)?S.unseenGearIds:[])).filter(id=>gearIds.has(id));
    S.unseenFoodIndices=Array.from(new Set(Array.isArray(S.unseenFoodIndices)?S.unseenFoodIndices:[])).filter(index=>Number.isInteger(index)&&foodCount(index)>0);
  }

  function markGearUnseen(id) {
    if(!id||String(id).startsWith("starter_")||S.unseenGearIds.includes(id))return;
    S.unseenGearIds.push(id);
  }
  function markFoodUnseen(index) {
    if(!Number.isInteger(index)||S.unseenFoodIndices.includes(index))return;
    S.unseenFoodIndices.push(index);
  }
  function markGearSeen(id) { S.unseenGearIds=S.unseenGearIds.filter(value=>value!==id); }
  function markFoodSeen(index) { S.unseenFoodIndices=S.unseenFoodIndices.filter(value=>value!==index); }

  function addLog(text, icon="assets/ui/logo_mark.png", tone="", at=Date.now()) {
    S.logs.push({ text, icon, tone, at });
    if (S.logs.length > 300) S.logs.splice(0, S.logs.length-300);
  }

  function addXp(amount, at=Date.now()) {
    if(S.lv>=MAX_LEVEL) return;
    S.xp += amount;
    while(S.lv<MAX_LEVEL && S.xp>=needXp()) {
      S.xp -= needXp(); S.lv++;
      addLog(`레벨 ${S.lv} 달성!`,"assets/ui/energy.png","good",at);
      if (dom.play.classList.contains("active")) playSfx("level_up");
    }
    if(S.lv>=MAX_LEVEL) S.xp=0;
    refreshWorldGateUnlock(true);
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
    return `assets/targets/${kind}_${AREA_ASSET_GRADES[S.grade]}.png`;
  }

  function targetLabel() {
    if(S.place==="worldtree") return "최종 세계수";
    if(S.place==="forest") return `${GRADES[S.grade]} 나무`;
    if(S.place==="mine") return `${GRADES[S.grade]} 광맥`;
    return ["고블린","마물","드래곤","흑수정 드래곤"][S.grade];
  }

  function consumeFood(index,{automatic=false,simulated=false,at=Date.now()}={}) {
    index=Number(index);
    if(!Number.isInteger(index)||!RECIPES[index]||foodCount(index)<=0||S.hp>=maxHp())return false;
    const recipe=RECIPES[index],before=S.hp;
    S.foods[index]=capped(foodCount(index)-1);
    S.hp=Math.min(maxHp(),S.hp+recipe.heal);
    const gained=Math.max(0,Math.floor(S.hp-before));
    addLog(`${recipe.name} ${automatic?"자동 섭취":"섭취"}: 체력 ${gained.toLocaleString()} 회복.`,foodIcon(index),"good",at);
    if(S.foods[index]===0){if(S.equippedFood===index)S.equippedFood=null;if(selectedFoodIndex===index)selectedFoodIndex=null;markFoodSeen(index);}
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
    if(dungeonGrade===0) return roll<.10?0:null;
    if(dungeonGrade===1) return roll<.02?0:roll<.10?1:null;
    return roll<.03?1:roll<.10?2:null;
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

  function resourceDropGrade(areaGrade,roll) {
    if(areaGrade<=0)return 0;
    if(areaGrade===1)return roll<.35?1:0;
    if(areaGrade===3)return 2;
    return roll<(20/55)?2:1;
  }

  // Shift the quantity distribution with target max HP, independently of item odds.
  function rewardCount(min,max,hpRatio,roll=rand()) {
    const ratio=Math.max(0,Math.min(1,hpRatio));
    const center=min+Math.round(ratio*(max-min));
    const spread=Math.max(1,Math.floor((max-min)/4));
    return Math.max(min,Math.min(max,center+Math.floor(roll*(spread*2+1))-spread));
  }

  function topDropKind(roll) { return roll<.05?"tome":roll<.15?"stone":"resource"; }
  function tomeIcon(kind) { return `assets/resources/tome_${kind}.png`; }
  function dropTome(hpRatio,at,visual=true) {
    const kind=PLACE_RESOURCE[S.place],count=rewardCount(1,3,hpRatio),icon=tomeIcon(kind);
    S.tomes[kind]=capped(S.tomes[kind]+count);
    addLog(`${TOME_LABEL[kind]} ${count}개 획득!`,icon,"rare",at);
    if(visual){lootBurst(icon,count);playSfx("loot_rare");}
  }

  function dropResource(hpRatio, at, visual=true) {
    const kind=PLACE_RESOURCE[S.place]; let grade=0, count=1;
    if(S.grade===0) {
      count=rewardCount(1,10,hpRatio);
    } else if(S.grade===3) {
      grade=2;count=rewardCount(5,15,hpRatio);
    } else {
      grade=resourceDropGrade(S.grade,rand());
      count=grade===S.grade?rewardCount(1,10,hpRatio):rewardCount(5,15,hpRatio);
    }
    S.res[kind][grade]=capped(S.res[kind][grade]+count);
    const icon=resourceIcon(kind,grade);
    addLog(`${GRADES[grade]} ${RESOURCE_LABEL[kind]} ${count}개 획득!`,icon,"",at);
    if(visual) { lootBurst(icon,Math.min(count,18)); playSfx(count>=10?"loot_rare":"loot_common"); }
  }

  function defeatTarget(at=Date.now(), visual=true) {
    const hpRatio=(S.target.max-TARGET_STATS[S.grade].min)/(TARGET_STATS[S.grade].max-TARGET_STATS[S.grade].min);
    addXp(S.target.xp,at);
    if(S.grade===3){
      const drop=topDropKind(rand());
      if(drop==="tome")dropTome(hpRatio,at,visual);
      else if(drop==="stone")dropStone(2,at,visual);
      else dropResource(hpRatio,at,visual);
    } else {
      const stoneGrade=stoneDropGradeForPlace(S.place,S.grade,rand());
      if(stoneGrade!==null) dropStone(stoneGrade,at,visual); else dropResource(hpRatio,at,visual);
    }
    if(visual) playSfx(S.place==="forest"?"tree_break":S.place==="mine"?"ore_break":"monster_defeat");
    newTarget();
  }

  function reflectDamage(min,max,simulated,at) {
    const reflected=randNorm(min,max);
    S.hp=Math.max(0,S.hp-reflected);
    if(!simulated){
      addLog(`${S.place==="worldtree"?"세계수":"흑수정"}의 반사 피해 ${reflected.toLocaleString()}.`,"assets/ui/energy.png","warn",at);
      setTimeout(animateReflection,150);
    }
    if(S.hp<=0)handleExhaustion(simulated,at);
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
      reflectDamage(FINAL_BOSS.reflectMin,FINAL_BOSS.reflectMax,simulated,at);
      if(S.target.hp<=0) {
        S.target.hp=0; S.auto=false; S.ended=true;
        addLog("칠흑의 세계수를 베어 쓰러뜨렸습니다.","assets/targets/worldtree.png","rare",at);
        if(!simulated) { playSfx("tree_break"); persist(); setTimeout(startEnding,850); }
      }
    } else {
      if(S.grade===3)reflectDamage(TOP_REFLECTION.min,TOP_REFLECTION.max,simulated,at);
      if(S.target.hp<=0)defeatTarget(at,!simulated);
    }
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
    const rodTier=equipped("rod")?.tier??0, probs=ROD_PROBS[rodTier], index=weightedIndex(probs,rand());
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
    const now=Date.now(),exchangeChanged=ensureSecretExchange(now);
    if(exchangeChanged&&dom.overlay.classList.contains("open")&&overlayStack[overlayStack.length-1]?.type==="workshop")renderWorkshop();
    document.querySelectorAll?.("[data-secret-countdown]").forEach(button=>button.textContent=`교환하기 · ${secretCountdownLabel(now)}`);
    if(S.place==="home"&&S.resting) {
      dom.fishingStatus.textContent=`휴식 중 · ${elapsedLabel(S.restElapsed)} 경과 · 1초당 +${HOUSES[S.house].heal}`;
      return;
    }
    if(S.place==="pond"&&S.fishState) {
      const seconds=Math.max(0,Math.ceil((S.fishState.endAt-now)/1000));
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

  function clearNewUserGuideVisuals() {
    tutorialStage="";dom.guide.classList.add("hidden");dom.guide.classList.remove("map-step");dom.menuToggle.classList.remove("tutorial-highlight");
    dom.mapMenuButton.classList.remove("tutorial-map-highlight");
  }

  function startNewUserGuide() {
    if(S.tutorialSeen||!dom.play.classList.contains("active")){clearNewUserGuideVisuals();return false;}
    tutorialStage="menu";setMenuOpen(false);dom.guide.classList.remove("hidden","map-step");dom.menuToggle.classList.add("tutorial-highlight");
    dom.mapMenuButton.classList.remove("tutorial-map-highlight");return true;
  }

  function showTutorialMapStep() {
    if(tutorialStage!=="menu")return false;
    tutorialStage="map";setMenuOpen(true);dom.guide.classList.add("map-step");dom.menuToggle.classList.remove("tutorial-highlight");
    dom.mapMenuButton.classList.add("tutorial-map-highlight");return true;
  }

  function finishNewUserGuide() {
    if(!tutorialStage)return false;
    S.tutorialSeen=true;clearNewUserGuideVisuals();persist();return true;
  }

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
    dom.scene.classList.toggle("crystal-scene",S.grade===3&&["forest","mine","dungeon"].includes(S.place));
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
    dom.xpFill.style.width=`${S.lv>=MAX_LEVEL?100:S.xp/needXp()*100}%`; dom.xpText.textContent=S.lv>=MAX_LEVEL?"MAX":`${compactXp(S.xp)} / ${compactXp(needXp())}`;
    const gearSlots=Object.keys(GEAR_LABEL).map(type=>{
      const g=equipped(type); return g?`<div class="equip-slot" title="${TIERS[g.tier]} ${GEAR_LABEL[type]}"><img src="${gearIcon(g)}" alt="${GEAR_LABEL[type]}"><small>${GEAR_LABEL[type]}</small>${g.enh?`<i class="enh-badge">+${g.enh}</i>`:""}</div>`:`<div class="equip-slot empty"><small>${GEAR_LABEL[type]} 없음</small></div>`;
    }).join("");
    const foodIndex=Number.isInteger(S.equippedFood)&&foodCount(S.equippedFood)>0?S.equippedFood:null;
    const foodSlot=foodIndex!==null?`<div class="equip-slot food-slot" title="${RECIPES[foodIndex].name}"><img src="${foodIcon(foodIndex)}" alt="${RECIPES[foodIndex].name}"><i class="food-count-badge">x${foodCount(foodIndex).toLocaleString()}</i><small>음식</small></div>`:`<div class="equip-slot empty food-slot"><small>음식 없음</small></div>`;
    dom.equipped.innerHTML=gearSlots+foodSlot;
    dom.log.innerHTML=S.logs.slice().reverse().map(entry=>`<div class="log-entry ${entry.tone||""}"><img src="${entry.icon}" alt=""><div><time>${new Date(entry.at).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</time><br>${entry.text}</div></div>`).join("") || `<div class="log-entry"><img src="assets/ui/logo_mark.png" alt=""><div>이세계에서 눈을 떴습니다.</div></div>`;
  }

  function showScreen(name) {
    if(name!=="play"){setMenuOpen(false);clearNewUserGuideVisuals();}
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
    if(key.startsWith("tome_"))return capped(S.tomes?.[key.slice(5)]);
    const match=key.match(/(wood|ore|gold)(\d)/); return match ? S.res[match[1]][+match[2]] : 0;
  }
  function canPay(cost) { return Object.entries(cost).every(([key,value])=>costValue(key)>=value); }
  function pay(cost) {
    if(!canPay(cost))return false;
    for(const[key,value]of Object.entries(cost)){
      if(key.startsWith("tome_")){S.tomes[key.slice(5)]-=value;continue;}
      const m=key.match(/(wood|ore|gold)(\d)/);S.res[m[1]][+m[2]]-=value;
    }
    return true;
  }
  function costMeta(key) {
    if(key.startsWith("tome_")){const kind=key.slice(5);return {kind,name:TOME_LABEL[kind],icon:tomeIcon(kind)};}
    const m=key.match(/(wood|ore|gold)(\d)/); return {kind:m[1],grade:+m[2],name:`${GRADES[+m[2]]} ${RESOURCE_LABEL[m[1]]}`,icon:resourceIcon(m[1],+m[2])};
  }

  function secretItemMeta(key) {
    let match=String(key).match(/^(wood|ore|gold)([0-2])$/);
    if(match){const kind=match[1],grade=+match[2];return {key,kind:"resource",name:`${GRADES[grade]} ${RESOURCE_LABEL[kind]}`,icon:resourceIcon(kind,grade),value:"재화",description:"장비를 제작하는 데 필요한 재료입니다."};}
    match=String(key).match(/^stone([0-2])$/);
    if(match){const grade=+match[1];return {key,kind:"stone",name:`${GRADES[grade]} 강화의 돌`,icon:stoneIcon(grade),value:"재화",description:"장비를 강화하는 데 필요한 재료입니다."};}
    match=String(key).match(/^food([0-4])$/);
    if(match){const index=+match[1],recipe=RECIPES[index];return {key,kind:"food",index,name:recipe.name,icon:foodIcon(index),value:`체력 +${recipe.heal.toLocaleString()}`,description:`보유 ${foodCount(index).toLocaleString()}개 · 마이페이지에서 장착 또는 섭취`};}
    return {key,kind:"unknown",name:key,icon:"assets/ui/logo_mark.png",value:"",description:""};
  }

  function secretItemCount(key) {
    let match=String(key).match(/^(wood|ore|gold)([0-2])$/);if(match)return capped(S.res[match[1]][+match[2]]);
    match=String(key).match(/^stone([0-2])$/);if(match)return capped(S.stones[+match[1]]);
    match=String(key).match(/^food([0-4])$/);if(match)return foodCount(+match[1]);
    return 0;
  }

  function canPaySecret(costs) { return costs.every(cost=>secretItemCount(cost.key)>=cost.amount); }

  function paySecret(costs) {
    if(!canPaySecret(costs))return false;
    for(const cost of costs){
      let match=cost.key.match(/^(wood|ore|gold)([0-2])$/);if(match){S.res[match[1]][+match[2]]-=cost.amount;continue;}
      match=cost.key.match(/^stone([0-2])$/);if(match){S.stones[+match[1]]-=cost.amount;continue;}
      match=cost.key.match(/^food([0-4])$/);if(match){S.foods[+match[1]]=capped(foodCount(+match[1])-cost.amount);}
    }
    return true;
  }

  function canReceiveSecret(reward) {
    const current=secretItemCount(reward.key);
    if(current+reward.amount>MAX_ITEM_COUNT)return false;
    const meta=secretItemMeta(reward.key);
    return meta.kind!=="food"||current>0||inventoryItemCount()<GEAR_CAPACITY;
  }

  function addSecretReward(reward) {
    if(!canReceiveSecret(reward))return false;
    let match=reward.key.match(/^(wood|ore|gold)([0-2])$/);if(match){S.res[match[1]][+match[2]]=capped(S.res[match[1]][+match[2]]+reward.amount);return true;}
    match=reward.key.match(/^stone([0-2])$/);if(match){S.stones[+match[1]]=capped(S.stones[+match[1]]+reward.amount);return true;}
    match=reward.key.match(/^food([0-4])$/);if(match){const index=+match[1];S.foods[index]=capped(foodCount(index)+reward.amount);markFoodUnseen(index);return true;}
    return false;
  }

  function secretRequirementHtml(costs) {
    return costs.map(cost=>{const meta=secretItemMeta(cost.key),have=secretItemCount(cost.key);return `<div class="requirement-row ${have<cost.amount?"missing":""}"><img src="${meta.icon}" alt=""><span>${meta.name}</span><b>${have.toLocaleString()} / ${cost.amount.toLocaleString()}</b></div>`;}).join("");
  }

  function secretCountdownLabel(now=Date.now()) {
    const seconds=Math.max(0,Math.ceil((secretResetAt(now)-now)/1000));
    const hours=String(Math.floor(seconds/3600)).padStart(2,"0"),minutes=String(Math.floor(seconds%3600/60)).padStart(2,"0"),remaining=String(seconds%60).padStart(2,"0");
    return `${hours}:${minutes}:${remaining}`;
  }

  function requirementHtml(cost) {
    if(!Object.keys(cost).length) return `<div class="requirement-row"><img src="assets/ui/profile.png" alt=""><span>기본 지급 장비</span><b>보유</b></div>`;
    return Object.entries(cost).map(([key,need])=>{const meta=costMeta(key),have=costValue(key);return `<div class="requirement-row ${have<need?"missing":""}"><img src="${meta.icon}" alt=""><span>${meta.name}</span><b>${have.toLocaleString()} / ${need.toLocaleString()}</b></div>`;}).join("");
  }

  function walletHtml() {
    const cards=[];
    for(const kind of ["wood","ore","gold"]) for(let grade=0;grade<3;grade++) cards.push(`<div class="wallet-card"><img src="${resourceIcon(kind,grade)}" alt=""><span>${GRADES[grade]} ${RESOURCE_LABEL[kind]}<b>${S.res[kind][grade].toLocaleString()}</b></span></div>`);
    for(let grade=0;grade<3;grade++) cards.push(`<div class="wallet-card"><img src="${stoneIcon(grade)}" alt=""><span>${GRADES[grade]} 강화돌<b>${S.stones[grade].toLocaleString()}</b></span></div>`);
    for(const kind of Object.keys(TOME_LABEL))cards.push(`<div class="wallet-card tome-card"><img src="${tomeIcon(kind)}" alt=""><span>${TOME_LABEL[kind]}<b>${capped(S.tomes?.[kind]).toLocaleString()}</b></span></div>`);
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
    dom.overlayContent.innerHTML=`<div class="tier-grid">${[0,1,2,3].map(grade=>`<button class="tier-option ${AREA_ASSET_GRADES[grade]}" data-do="travel" data-place="${place}" data-grade="${grade}"><img src="assets/targets/${place==="forest"?"tree":place==="mine"?"ore":"monster"}_${AREA_ASSET_GRADES[grade]}.png" alt=""><span><strong>${GRADES[grade]} ${PLACE_LABEL[place]}</strong><small>HP ${TARGET_STATS[grade].min.toLocaleString()}~${TARGET_STATS[grade].max.toLocaleString()} · 방어력 ${TARGET_STATS[grade].def.toLocaleString()} · EXP ${compactXp(TARGET_STATS[grade].xp)}${grade===3?" · 반사 피해 5~20":""}</small></span></button>`).join("")}</div>`;
  }

  function renderWorkshop() {
    ensureSecretExchange(Date.now());
    if(selectedWorkshop.type==="secret"){
      if(secretExchangeVisible())return renderSecretExchange();
      selectedWorkshop={type:"axe",tier:1};
    }
    const {type,tier}=selectedWorkshop, cost=GEAR_COST[type][tier], sample={type,tier,enh:0};
    setOverlayHeader("제작소","도구와 갑옷을 재료로 직접 제작합니다");
    const stat=gearEffectText(sample);
    const secretTab=secretExchangeVisible()?`<button class="secret-tab" data-do="workshop-type" data-type="secret">비밀교환소</button>`:"";
    dom.overlayContent.innerHTML=`
      <div class="category-tabs">${Object.keys(GEAR_LABEL).map(key=>`<button class="${key===type?"active":""}" data-do="workshop-type" data-type="${key}">${GEAR_LABEL[key]}</button>`).join("")}${secretTab}</div>
      <div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="${gearIcon(sample)}" alt=""></div><div class="detail-copy"><h3>${TIERS[tier]} ${GEAR_LABEL[type]}</h3><p class="value">${stat}</p><p>${tier===0?"처음 지급되는 기본 장비입니다.":"같은 장비를 여러 개 제작할 수 있습니다."}</p></div></div><div class="requirements"><div class="section-title">보유 아이템 / 필요 아이템</div>${requirementHtml(cost)}<button class="primary-button wide-action" data-do="craft" ${tier===0||!canPay(cost)||crafting?"disabled":""}>${tier===0?"기본 지급":crafting?"제작 완료!":"제작하기"}</button></div></div>
      <div class="section-title">제작 목록</div><div class="item-list">${[0,1,2,3,4].map(i=>{const item={type,tier:i,enh:0};return `<button class="item-card ${i===tier?"selected":""}" data-do="workshop-tier" data-tier="${i}"><img src="assets/items/${type}_${i}.png" alt=""><span><b>${TIERS[i]} ${GEAR_LABEL[type]}</b><small>${gearEffectText(item)}</small></span></button>`;}).join("")}</div>
      <div class="section-title">보유 재화</div>${walletHtml()}`;
  }

  function renderSecretExchange(now=Date.now()) {
    ensureSecretExchange(now);
    const offers=activeSecretOffers(now);
    if(!offers.length){selectedWorkshop={type:"axe",tier:1};return renderWorkshop();}
    let offer=offers.find(item=>item.id===selectedSecretOfferId)||offers[0];selectedSecretOfferId=offer.id;
    const reward=secretItemMeta(offer.reward.key),canExchange=canPaySecret(offer.costs)&&canReceiveSecret(offer.reward);
    setOverlayHeader("비밀교환소","현지 시각 00시·06시·12시·18시에 품목이 바뀝니다");
    const tabs=Object.keys(GEAR_LABEL).map(key=>`<button data-do="workshop-type" data-type="${key}">${GEAR_LABEL[key]}</button>`).join("");
    dom.overlayContent.innerHTML=`
      <div class="category-tabs">${tabs}<button class="secret-tab active" data-do="workshop-type" data-type="secret">비밀교환소</button></div>
      <div class="detail-card secret-detail"><div class="detail-hero"><div class="detail-icon"><img src="${reward.icon}" alt=""></div><div class="detail-copy"><h3>${reward.name} x${offer.reward.amount.toLocaleString()}</h3><p class="value">${reward.value}</p><p>${reward.description}</p></div></div><div class="requirements"><div class="section-title">보유 아이템 / 필요 아이템</div>${secretRequirementHtml(offer.costs)}<button class="primary-button wide-action secret-exchange-button" data-do="secret-exchange" data-secret-countdown ${canExchange?"":"disabled"}>교환하기 · ${secretCountdownLabel(now)}</button></div></div>
      <div class="section-title">한정 교환 목록 · 남은 ${offers.length}/${SECRET_EXCHANGE_OFFER_COUNT}</div><div class="item-list">${offers.map(item=>{const meta=secretItemMeta(item.reward.key);return `<button class="item-card ${item.id===offer.id?"selected":""}" data-do="secret-offer" data-id="${item.id}"><img src="${meta.icon}" alt=""><span><b>${meta.name} x${item.reward.amount.toLocaleString()}</b><small>${item.costs.map(cost=>`${secretItemMeta(cost.key).name} ${cost.amount.toLocaleString()}`).join(" · ")}</small></span></button>`;}).join("")}</div>
      <div class="section-title">보유 재화</div>${walletHtml()}`;
  }

  function exchangeSelectedSecret(now=Date.now()) {
    const changed=ensureSecretExchange(now);
    if(changed){toast("교환 목록이 갱신되었습니다.");renderSecretExchange(now);return false;}
    const offer=activeSecretOffers(now).find(item=>item.id===selectedSecretOfferId);
    if(!offer){renderWorkshop();return false;}
    if(!canPaySecret(offer.costs)){toast("교환에 필요한 아이템이 부족합니다.");playSfx("ui_error");return false;}
    if(!canReceiveSecret(offer.reward)){toast(secretItemMeta(offer.reward.key).kind==="food"&&secretItemCount(offer.reward.key)===0?"보관함이 가득 찼습니다.":"보유 한도를 초과해 교환할 수 없습니다.");playSfx("ui_error");return false;}
    if(!paySecret(offer.costs)||!addSecretReward(offer.reward))return false;
    offer.claimed=true;
    const reward=secretItemMeta(offer.reward.key);addLog(`비밀교환소: ${reward.name} x${offer.reward.amount.toLocaleString()} 교환 완료.`,reward.icon,"rare");
    playSfx("purchase");toast("교환이 완료되었습니다.");
    const remaining=activeSecretOffers(now);selectedSecretOfferId=remaining[0]?.id||null;
    if(!remaining.length)selectedWorkshop={type:"axe",tier:1};
    renderWorkshop();renderHud();persist();return true;
  }

  function craftSelected() {
    if(crafting)return;
    const {type,tier}=selectedWorkshop, cost=GEAR_COST[type][tier];
    if(inventoryItemCount()>=GEAR_CAPACITY){toast("보관함이 가득 찼습니다. 장비를 버리거나 음식을 사용해 주세요.");playSfx("ui_error");return;}
    if(tier===0||!pay(cost)){playSfx("ui_error");return;}
    crafting=true;
    const gear={id:newId(type),type,tier,enh:0};S.gear.push(gear);markGearUnseen(gear.id);refreshWorldGateUnlock(true);addLog(`${TIERS[tier]} ${GEAR_LABEL[type]} 제작 완료.`,gearIcon(gear),"good");playSfx("purchase");toast("제작 완료!",1500);renderWorkshop();renderHud();persist();
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
    const recipe=RECIPES[selectedRecipe],needsSlot=foodCount(selectedRecipe)<=0,storageFull=needsSlot&&inventoryItemCount()>=GEAR_CAPACITY;setOverlayHeader("요리","낚시 재료로 회복 음식을 요리합니다");
    dom.overlayContent.innerHTML=`<div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="assets/foods/${recipe.icon}.png" alt=""></div><div class="detail-copy"><h3>${recipe.name}</h3><p class="value">체력 +${recipe.heal.toLocaleString()}</p><p>보유 ${foodCount(selectedRecipe).toLocaleString()}개 · 마이페이지에서 장착 또는 섭취</p></div></div><div class="requirements"><div class="section-title">보유 아이템 / 필요 아이템</div>${fishRequirementHtml(recipe.cost)}<button class="primary-button wide-action" data-do="cook" ${!canFishPay(recipe.cost)||foodCount(selectedRecipe)>=MAX_ITEM_COUNT||storageFull?"disabled":""}>요리하기</button></div></div><div class="section-title">요리 목록</div><div class="item-list">${RECIPES.map((r,i)=>`<button class="item-card ${i===selectedRecipe?"selected":""}" data-do="recipe-select" data-recipe="${i}"><img src="assets/foods/${r.icon}.png" alt=""><span><b>${r.name}</b><small>체력 +${r.heal.toLocaleString()} · 보유 x${foodCount(i).toLocaleString()}</small></span></button>`).join("")}</div><div class="section-title">보유 낚시 재료</div><div class="resource-wallet">${FISH.map(name=>`<div class="wallet-card"><img src="${fishIcon(name)}" alt=""><span>${name}<b>${S.fish[name].toLocaleString()}</b></span></div>`).join("")}</div>`;
  }

  function cookSelected() {
    const r=RECIPES[selectedRecipe];
    if(foodCount(selectedRecipe)<=0&&inventoryItemCount()>=GEAR_CAPACITY){toast("보관함이 가득 찼습니다. 장비를 버리거나 음식을 사용해 주세요.");playSfx("ui_error");return;}
    if(foodCount(selectedRecipe)>=MAX_ITEM_COUNT||!fishPay(r.cost)){playSfx("ui_error");return;}
    S.foods[selectedRecipe]=capped(foodCount(selectedRecipe)+1);
    markFoodUnseen(selectedRecipe);
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
      if(success){g.enh++;markGearUnseen(g.id);addLog(`${TIERS[g.tier]} ${GEAR_LABEL[g.type]} +${g.enh} 강화 성공!`,gearIcon(g),"good");playSfx("enhance_success");toast(`강화 성공! +${g.enh}`);}
      else if(g.tier===0){addLog(`허름한 ${GEAR_LABEL[g.type]} 강화 실패. 장비는 보존되었습니다.`,gearIcon(g),"warn");playSfx("enhance_fail");toast("강화 실패 · 장비 보존");}
      else {const label=`${TIERS[g.tier]} ${GEAR_LABEL[g.type]}${g.enh?` +${g.enh}`:""}`;S.gear=S.gear.filter(x=>x.id!==g.id);markGearSeen(g.id);if(S.equipped[g.type]===g.id){const replacement=S.gear.filter(x=>x.type===g.type).sort((a,b)=>gearPower(b)-gearPower(a))[0];S.equipped[g.type]=replacement?.id||null;if(g.type==="armor")S.hp=Math.min(S.hp,maxHp());}selectedEnhanceId=null;addLog(`${label} 강화 실패. 장비가 파괴되었습니다.`,gearIcon(g),"warn");playSfx("gear_break");toast("강화 실패 · 장비 파괴");}
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
      detail=`<div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="${foodIcon(selectedFoodIndex)}" alt=""></div><div class="detail-copy"><h3>${recipe.name} x${foodCount(selectedFoodIndex).toLocaleString()}</h3><p class="value">체력 +${recipe.heal.toLocaleString()}</p><p>${isEquipped?"현재 장착 중 · 체력 0에서 자동 섭취":"보유 중"}</p></div></div><div class="requirements profile-actions"><button class="primary-button" data-do="equip-food" ${isEquipped?"disabled":""}>${isEquipped?"장착 중":"장착하기"}</button><button class="secondary-button" data-do="${isEquipped?"unequip-food":"eat-food"}" ${!isEquipped&&S.hp>=maxHp()?"disabled":""}>${isEquipped?"장착 해제":"즉시먹기"}</button></div></div>`;
    } else if(g) {
      const isEquipped=!g.special&&S.equipped[g.type]===g.id;
      const equipDisabled=g.special||isEquipped,discardDisabled=g.special||g.tier===0||isEquipped;
      detail=`<div class="detail-card"><div class="detail-hero"><div class="detail-icon"><img src="${gearIcon(g)}" alt="">${g.enh?`<i class="enh-badge">+${g.enh}</i>`:""}</div><div class="detail-copy"><h3>${gearDisplayName(g)}</h3><p class="value">${gearEffectText(g)}</p><p>${g.special?"엔딩 완료 영구 징표":isEquipped?"현재 장착 중":"보유 중"}</p></div></div><div class="requirements profile-actions"><button class="primary-button" data-do="equip" ${equipDisabled?"disabled":""}>${g.special?"장착 불가":isEquipped?"장착 중":"장착하기"}</button><button class="danger-button" data-do="discard" ${discardDisabled?"disabled":""}>${g.special||g.tier===0?"버리기 불가":"버리기"}</button></div></div>`;
    }
    const foodCards=RECIPES.map((recipe,index)=>foodCount(index)>0?`<button class="item-card ${foodSelected&&index===selectedFoodIndex?"selected":""} ${S.unseenFoodIndices.includes(index)?"unseen":""}" data-do="food-select" data-food="${index}"><img src="${foodIcon(index)}" alt=""><span><b>${recipe.name} <em class="food-stack">x${foodCount(index).toLocaleString()}</em></b><small>${S.equippedFood===index?"장착 중":"보유"}</small></span></button>`:"").join("");
    const gearCards=S.gear.map(item=>`<button class="item-card ${!foodSelected&&item.id===g?.id?"selected":""} ${S.unseenGearIds.includes(item.id)?"unseen":""}" data-do="gear-select" data-id="${item.id}"><img src="${gearIcon(item)}" alt=""><span><b>${gearDisplayName(item)}</b><small>${item.special?"영구 징표":S.equipped[item.type]===item.id?"장착 중":"보유"}</small></span></button>`).join("");
    dom.overlayContent.innerHTML=`${detail}<div class="section-title">보유 장비 ${inventoryItemCount()}/${GEAR_CAPACITY}</div><div class="gear-inventory-box"><div class="item-list">${gearCards}${foodCards}</div></div><div class="section-title">보유 재화</div>${walletHtml()}<div class="section-title">낚시 재료</div><div class="resource-wallet">${FISH.map(name=>`<div class="wallet-card"><img src="${fishIcon(name)}" alt=""><span>${name}<b>${S.fish[name].toLocaleString()}</b></span></div>`).join("")}</div>`;
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

  function unequipSelectedFood() {
    if(!Number.isInteger(selectedFoodIndex)||S.equippedFood!==selectedFoodIndex)return;
    const index=selectedFoodIndex;S.equippedFood=null;
    addLog(`${RECIPES[index].name} 장착 해제.`,foodIcon(index));
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
    S.gear=S.gear.filter(item=>item.id!==g.id);markGearSeen(g.id);selectedGearId=S.gear[0]?.id||null;addLog(`${label} 장비를 버렸습니다.`,gearIcon(g),"warn");playSfx("ui_confirm");renderProfile();render();persist();
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
    $("saveSummary").textContent=S.openingSeen?`나의 나무꾼 정보 : Lv.${S.lv}, 장소: ${currentPlaceName()}`:"나의 나무꾼이 없습니다.";
    $("startButton").textContent="게임 시작";$("versionResetNote").textContent=resetNotice;
  }

  async function startGame() {
    if(S.ended){startEnding();return;}
    if(!S.openingSeen){startOpeningStory();return;}
    enterPlay();
  }

  async function enterPlay() {
    settleOffline(Date.now());
    if(S.ended){startEnding();return;}
    ensureSecretExchange(Date.now(),false);showScreen("play");render();startLoops();setBgm(S.place);if(!S.tutorialSeen)startNewUserGuide();await persist();
  }

  function sceneAction(event) {
    if(tutorialStage)return;
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
    if(tutorialStage){if(tutorialStage==="map")setMenuOpen(true);return;}
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
    else if(action==="secret-offer"){selectedSecretOfferId=el.dataset.id;renderSecretExchange();}
    else if(action==="secret-exchange")exchangeSelectedSecret();
    else if(action==="craft")craftSelected();
    else if(action==="house-select"){selectedHouse=+el.dataset.house;renderEstate();}
    else if(action==="house-action")houseAction();
    else if(action==="recipe-select"){selectedRecipe=+el.dataset.recipe;renderCooking();}
    else if(action==="cook")cookSelected();
    else if(action==="enhance-select"){selectedEnhanceId=el.dataset.id;renderEnhance();}
    else if(action==="enhance-now")enhanceNow();
    else if(action==="gear-select"){selectedGearId=el.dataset.id;selectedFoodIndex=null;markGearSeen(selectedGearId);renderProfile();persist();}
    else if(action==="food-select"){selectedFoodIndex=+el.dataset.food;selectedGearId=null;markFoodSeen(selectedFoodIndex);renderProfile();persist();}
    else if(action==="equip")equipSelected();
    else if(action==="equip-food")equipSelectedFood();
    else if(action==="unequip-food")unequipSelectedFood();
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
    settleOffline(Date.now());const exchangeChanged=ensureSecretExchange(Date.now(),false);
    if(dom.play.classList.contains("active")) {
      if(S.ended)startEnding();
      else {render();if(exchangeChanged&&dom.overlay.classList.contains("open")&&overlayStack[overlayStack.length-1]?.type==="workshop")renderWorkshop();startLoops();setBgm(dom.overlay.classList.contains("open")?"map":S.place);persist(false);}
    } else if(dom.intro.classList.contains("active"))setBgm("title");
    else if(dom.ending.classList.contains("active"))setBgm("ending");
  }

  function bindEvents() {
    $("startButton").addEventListener("click",startGame);$("endingQuitButton").addEventListener("click",quitGame);
    $("bossStartButton").addEventListener("click",startFinalBattle);$("endingIntroButton").addEventListener("click",returnToIntroAfterEnding);
    dom.scene.addEventListener("click",sceneAction);dom.menuToggle.addEventListener("click",event=>{event.stopPropagation();playSfx("ui_click");if(tutorialStage==="menu"){showTutorialMapStep();return;}if(tutorialStage==="map"){setMenuOpen(true);return;}toggleMenu();});dom.autoButton.addEventListener("click",event=>{event.stopPropagation();if(tutorialStage)return;toggleAuto();setMenuOpen(false);});
    dom.mainMenu.addEventListener("click",event=>{const button=event.target.closest("[data-menu]");if(!button)return;if(tutorialStage&&button.dataset.menu!=="map")return;playSfx("ui_click");if(tutorialStage)finishNewUserGuide();openView(button.dataset.menu);});
    $("backButton").addEventListener("click",overlayBack);$("closeButton").addEventListener("click",()=>{playSfx("ui_back");closeOverlay();});dom.overlayContent.addEventListener("click",handleOverlayClick);
    dom.overlayContent.addEventListener("input",event=>{const input=event.target.closest("[data-setting]");if(!input)return;const key=input.dataset.setting;S.settings[key]=+input.value/100;input.nextElementSibling.textContent=`${input.value}%`;if(key==="bgm"&&bgm){bgm.volume=Math.min(1,S.settings.bgm*1.4);if(S.settings.bgm>0&&bgm.paused)bgm.play().catch(()=>{});}persist();});
    document.addEventListener("pointerdown",()=>{if(dom.intro.classList.contains("active"))setBgm("title");},{once:true});
    document.addEventListener("visibilitychange",()=>document.hidden?pauseForBackground():resumeFromBackground());
    document.addEventListener("freeze",pauseForBackground);document.addEventListener("resume",resumeFromBackground);
    window.addEventListener("pagehide",pauseForBackground);window.addEventListener("pageshow",resumeFromBackground);window.addEventListener("focus",resumeFromBackground);
    window.addEventListener("beforeunload",()=>{if(S&&!saveClearedAfterEnding){S.lastSeen=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(S));}});
    history.replaceState({gameRoot:true},"");history.pushState({gameGuard:true},"");window.addEventListener("popstate",()=>{logicalBack();history.pushState({gameGuard:true},"");});
  }

  function migrateBalance() {
    // Keep an unfinished saved boss fight at the same health percentage.
    if(S.place==="worldtree"&&!S.ended&&S.target&&(S.target.max!==FINAL_BOSS.hp||S.target.def!==FINAL_BOSS.def)){
      const ratio=Math.max(0,Math.min(1,S.target.hp/S.target.max));
      S.target={hp:Math.ceil(ratio*FINAL_BOSS.hp),max:FINAL_BOSS.hp,def:FINAL_BOSS.def,xp:0};
    }
  }

  async function init() {
    const metaRaw=await storage.loadMeta();
    if(metaRaw){try{const parsed=JSON.parse(metaRaw);M={endingSeen:!!parsed.endingSeen};}catch(error){M={endingSeen:false};}}
    const raw=await storage.load();
    if(raw){
      try{const parsed=JSON.parse(raw);if(parsed.version===SAVE_VERSION)S=parsed;else{resetNotice=`업데이트 ${APP_VERSION} 적용으로 이전 세이브가 초기화되었습니다.`;await storage.remove();S=freshState();}}
      catch(error){resetNotice="손상된 세이브를 초기화했습니다.";S=freshState();}
    } else S=freshState();
    S.settings=S.settings||{bgm:.5,sfx:.5};S.logs=Array.isArray(S.logs)?S.logs:[];S.restProgress=0;S.restElapsed=S.restElapsed||0;S.resting=!!S.resting;S.openingSeen=!!S.openingSeen;if(typeof S.tutorialSeen!=="boolean")S.tutorialSeen=!!S.openingSeen;S.secretExchange=S.secretExchange||null;S.worldGateUnlocked=!!S.worldGateUnlocked;S.fish=S.fish||{};S.foods=Array.isArray(S.foods)?S.foods:Array(RECIPES.length).fill(0);normalizeInventory();migrateBalance();refreshWorldGateUnlock();ensureSecretExchange(Date.now(),false);
    if(M.endingSeen&&!S.gear.some(g=>g.special))S.gear.push({id:"easter_egg",type:"easteregg",tier:0,enh:0,special:true});
    if(!S.logs.length)addLog("이세계에서 눈을 떴습니다.");
    bindEvents();renderIntro();showScreen("intro");
  }

  if (location.search.includes("debug")) {
    window.__GAME_DEBUG__ = {
      state: () => S,
      meta: () => M,
      replaceState: (next) => { S = next; },
      flushSaveQueue: () => saveQueue,
      replaceMeta: (next) => { M = next; },
      freshState,
      maxHp,
      gearPower,
      enhancementMultiplier,
      rodMeanSeconds,
      refreshWorldGateUnlock,
      hasAllDivineGear,
      normalizeInventory,
      inventoryGearCount,
      inventoryFoodKindCount,
      inventoryItemCount,
      markGearUnseen,
      markFoodUnseen,
      markGearSeen,
      markFoodSeen,
      foodCount,
      consumeFood,
      handleExhaustion,
      stoneDropGrade,
      stoneDropGradeForPlace,
      resourceDropGrade,
      rewardCount, topDropKind, dropResource, defeatTarget, newTarget, targetAsset, targetLabel,
      addXp, needXp, renderTier, renderMap, walletHtml, canPay, pay, costMeta,
      migrateBalance, init,
      compactXp,
      weightedIndex,
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
      renderIntro,
      craftSelected,
      cookSelected,
      secretWindowId,
      secretResetAt,
      secretCountdownLabel,
      createSecretExchange,
      ensureSecretExchange,
      activeSecretOffers,
      secretExchangeVisible,
      secretItemMeta,
      secretItemCount,
      canPaySecret,
      canReceiveSecret,
      exchangeSelectedSecret,
      selectSecretOffer:(id)=>{selectedSecretOfferId=id;selectedWorkshop.type="secret";},
      startNewUserGuide,
      showTutorialMapStep,
      finishNewUserGuide,
      tutorialStage:()=>tutorialStage,
      equipSelectedFood,
      unequipSelectedFood,
      eatSelectedFood,
      selectRecipe:(index)=>{selectedRecipe=Math.max(0,Math.min(RECIPES.length-1,Number(index)||0));},
      selectFood:(index)=>{selectedFoodIndex=Number(index);selectedGearId=null;},
      sceneAction,
      discardSelected,
      startFinalBattle,
      startEnding,
      finalizeEnding,
      setMenuOpen,
      constants:{MAX_LEVEL,TARGET_STATS,TOP_REFLECTION,TOME_LABEL,APP_VERSION,SAVE_VERSION,SAVE_KEY,MAX_ITEM_COUNT,GEAR_CAPACITY,FINAL_BOSS,ROD_PROBS,GEAR_COST,HOUSES,RECIPES,SECRET_EXCHANGE_INTERVAL_MS,SECRET_EXCHANGE_OFFER_COUNT,SECRET_EXCHANGE_TEMPLATES},
    };
  }

  init();
})();
