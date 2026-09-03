#!/usr/bin/env node
"use strict";

const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

class ClassList {
  constructor(){this.items=new Set();}
  add(...names){names.forEach(n=>this.items.add(n));}
  remove(...names){names.forEach(n=>this.items.delete(n));}
  contains(name){return this.items.has(name);}
  toggle(name,force){if(force===undefined)force=!this.items.has(name);force?this.items.add(name):this.items.delete(name);return force;}
}

class FakeElement {
  constructor(id=""){
    this.id=id;this.classList=new ClassList();this.style={setProperty(k,v){this[k]=v;}};this.dataset={};
    this.textContent="";this.innerHTML="";this.value="";this.src="";this.children=[];this.listeners={};
    this.nextElementSibling={textContent:""};this.offsetWidth=1;
  }
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  setAttribute(){}
  appendChild(child){this.children.push(child);return child;}
  closest(){return null;}
  click(){for(const fn of this.listeners.click||[])fn({target:this,stopPropagation(){}});if(this.onclick)this.onclick();}
}

const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,new FakeElement(id));return elements.get(id);};
const document={
  hidden:false,
  getElementById:element,
  createElement:()=>new FakeElement(),
  addEventListener(){},
};
const store=new Map();
const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
class FakeAudio {constructor(src){this.src=src;this.volume=1;this.loop=false;this.paused=true;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
const history={replaceState(){},pushState(){}};
const location={search:"?debug=1"};
const window={document,localStorage,history,location,Audio:FakeAudio,addEventListener(){},close(){}};
window.window=window;

const context=vm.createContext({window,document,localStorage,history,location,Audio:FakeAudio,console,setTimeout,setInterval,clearTimeout,clearInterval,Date,Math,Promise});
vm.runInContext(fs.readFileSync("game.js","utf8"),context,{filename:"game.js"});

setTimeout(async()=>{
  try {
    const game=window.__GAME_DEBUG__;
    assert(game,"debug API should exist");
    let state=game.state();
    assert.equal(state.version,"0.9.0");
    assert.equal(state.lv,1,"release build starts at level 1");
    assert.equal(state.hp,500,"release build starts at base HP 500");
    assert.equal(game.maxHp(),600,"shabby armor raises max HP to 600");
    for(const values of Object.values(state.res)) assert(values.every(v=>v===0));
    assert(state.stones.every(v=>v===0));
    assert(Object.values(state.fish).every(v=>v===0));
    assert.equal(state.worldGateUnlocked,false,"release build starts with gate locked");
    assert.equal(state.settings.bgm,.5,"default BGM volume is 50%");
    assert.equal(state.settings.sfx,.5,"default SFX volume is 50%");
    assert.deepEqual(Array.from(game.constants.ROD_PROBS,row=>Array.from(row)),[[66,27,5,2,0,0],[50,20,15,9,5,1],[26,24,23,18,7,2],[12,12,30,30,12,4],[0,0,20,30,35,15]],"fishing probabilities remain unchanged");

    state=game.freshState();game.replaceState(state);state.lv=90;const armor=state.gear.find(g=>g.type==="armor");armor.tier=4;armor.enh=4;
    assert.equal(game.maxHp(),11775,"Lv90 divine armor +4 max HP");

    state=game.freshState();game.replaceState(state);const rod=state.gear.find(g=>g.type==="rod");rod.tier=4;rod.enh=4;
    assert(Math.abs(game.enhancementMultiplier(rod)-1.8)<.0001,"rod uses weapon enhancement multiplier");
    assert(Math.abs(game.rodMeanSeconds(rod)-8.3333333333)<.001,"rod +4 reduces mean fishing time");

    state=game.freshState();game.replaceState(state);state.lv=99;state.worldGateUnlocked=false;
    state.gear=Object.keys(state.equipped).map((type,i)=>({id:`divine_${i}`,type,tier:4,enh:0}));
    assert.equal(game.hasAllDivineGear(),true);game.refreshWorldGateUnlock();assert.equal(state.worldGateUnlocked,true);
    state.gear.pop();assert.equal(game.refreshWorldGateUnlock(),true,"gate stays unlocked after divine gear is gone");

    state=game.freshState();game.replaceState(state);state.place="forest";state.hp=3;state.auto=true;state.target={hp:9999,max:9999,def:0,xp:20};
    game.workAction(true,1000);game.workAction(true,2000);game.workAction(true,3000);
    assert.equal(state.hp,0);assert.equal(state.auto,false,"auto must turn off at zero HP");

    state=game.freshState();game.replaceState(state);state.place="forest";state.hp=5;state.auto=true;state.target={hp:999999,max:999999,def:0,xp:20};state.lastSeen=Date.now()-10000;
    game.settleOffline(Date.now());assert.equal(state.hp,0,"offline auto consumes available HP");assert.equal(state.auto,false,"offline auto releases at zero HP");
    state=game.freshState();game.replaceState(state);state.place="forest";state.hp=5;state.auto=false;state.lastSeen=Date.now()-10000;
    game.settleOffline(Date.now());assert.equal(state.hp,5,"offline progress requires auto ON");

    state=game.freshState();game.replaceState(state);state.place="pond";state.hp=2;state.auto=true;state.fish=Object.fromEntries(Object.keys(state.fish).map(k=>[k,0]));const xp=state.xp;
    assert.equal(game.startFishing(true,1000),true);assert.equal(state.hp,2,"casting costs no HP");
    game.completeFishing(true,state.fishState.endAt);assert.equal(state.hp,1,"catching costs one HP");assert.equal(state.xp,xp,"fishing grants no XP");
    assert(Object.values(state.fish).reduce((a,b)=>a+b,0)>=1,"fishing grants materials");

    state=game.freshState();game.replaceState(state);state.place="pond";state.hp=3;state.auto=true;state.lastSeen=Date.now()-300000;
    game.settleOffline(Date.now());assert.equal(state.hp,0,"offline auto fishing consumes HP");assert.equal(state.auto,false,"fishing auto releases at zero HP");assert.equal(state.xp,0);

    state=game.freshState();game.replaceState(state);state.place="home";state.resting=true;state.auto=true;state.hp=0;state.lastSeen=Date.now()-100000;state.restProgress=0;
    game.settleOffline(Date.now());assert.equal(state.hp,10,"home offline recovery follows 10-second ticks");
    state=game.freshState();game.replaceState(state);state.place="home";state.resting=false;state.hp=0;state.lastSeen=Date.now()-100000;
    game.settleOffline(Date.now());assert.equal(state.hp,0,"home recovery pauses when rest pose is off");
    game.toggleAuto();assert.equal(state.resting,true,"home auto button starts persistent rest pose");assert.equal(state.auto,true);game.toggleResting();assert.equal(state.resting,false,"second toggle ends rest pose");

    assert.equal(game.stoneDropGrade(0,.049),0);assert.equal(game.stoneDropGrade(0,.05),null);
    assert.equal(game.stoneDropGrade(1,.029),0);assert.equal(game.stoneDropGrade(1,.03),1);assert.equal(game.stoneDropGrade(1,.05),null);
    assert.equal(game.stoneDropGrade(2,.049),0);assert.equal(game.stoneDropGrade(2,.05),1);assert.equal(game.stoneDropGrade(2,.08),2);assert.equal(game.stoneDropGrade(2,.09),null);
    for(const place of ["forest","mine","dungeon"]){assert.equal(game.stoneDropGradeForPlace(place,0,.049),0,`${place} uses low-area stone rates`);assert.equal(game.stoneDropGradeForPlace(place,1,.031),1,`${place} uses mid-area stone rates`);assert.equal(game.stoneDropGradeForPlace(place,2,.081),2,`${place} uses high-area stone rates`);}
    assert.equal(game.stoneDropGradeForPlace("pond",2,.001),null,"non-combat areas never drop stones");

    state=game.freshState();game.replaceState(state);state.place="home";state.resting=true;state.auto=true;state.hp=0;const clockNow=Date.now();state.lastSeen=clockNow-5500;state.restProgress=0;
    assert.equal(game.settleOffline(clockNow),5,"absolute clock settles complete elapsed seconds");assert.equal(state.restProgress,5);assert.equal(state.lastSeen,clockNow-500,"clock keeps the sub-second remainder");
    assert.equal(game.settleOffline(clockNow+500),1,"the retained remainder is reconciled on the next lifecycle tick");assert.equal(state.restProgress,6);

    state=game.freshState();game.replaceState(state);state.res.wood[0]=9998;game.normalizeInventory();state.res.wood[0]+=50;game.normalizeInventory();assert.equal(state.res.wood[0],9999,"resources cap at 9999");

    state=game.freshState();game.replaceState(state);state.res.wood[0]=200;game.craftSelected();game.craftSelected();assert.equal(state.gear.length,6,"craft completion lock blocks double click");assert.equal(state.res.wood[0],100,"double click consumes one recipe only");await new Promise(resolve=>setTimeout(resolve,1100));
    state=game.freshState();game.replaceState(state);while(state.gear.length<20)state.gear.push({id:`extra_${state.gear.length}`,type:"axe",tier:1,enh:0});const woodBefore=state.res.wood[0];game.craftSelected();assert.equal(state.gear.length,20,"crafting cannot exceed gear capacity");assert.equal(state.res.wood[0],woodBefore,"full storage does not consume crafting materials");

    state=game.freshState();game.replaceState(state);game.renderProfile();const shabbyCount=state.gear.length;await game.discardSelected();assert.equal(state.gear.length,shabbyCount,"shabby gear cannot be discarded");

    state=game.freshState();game.replaceState(state);state.place="worldtree";state.hp=100000;state.target={hp:1,max:4444444,def:5000,xp:0};game.workAction(true,1000);
    assert.equal(state.ended,true,"defeating world tree completes game");assert(state.hp<100000,"world tree reflects damage");

    game.renderWorkshop();assert.equal(element("overlayTitle").textContent,"제작소");assert(element("overlayContent").innerHTML.includes("제작하기"));
    game.renderEstate();assert.equal(element("overlayTitle").textContent,"부동산");
    game.renderCooking();assert(element("overlayContent").innerHTML.includes("만들어 먹기"));
    game.renderEnhance();assert(element("overlayContent").innerHTML.includes("낚싯대"),"rod is enhanceable");
    game.renderProfile();assert(element("overlayContent").innerHTML.includes("/20"),"profile shows gear capacity");
    game.setMenuOpen(true);assert(element("mainMenu").classList.contains("open"),"mobile menu expands on demand");assert(element("scene").classList.contains("menu-open"),"target HUD receives menu avoidance state");game.setMenuOpen(false);
    game.renderSettings();assert(!element("overlayContent").innerHTML.includes("지금 저장"),"manual save button is removed");assert(element("overlayContent").innerHTML.includes("자동 저장"));
    game.replaceMeta({endingSeen:true});state=game.freshState();game.replaceState(state);assert(state.gear.some(g=>g.special),"future games include the permanent Easter egg");game.renderProfile();assert(element("overlayContent").innerHTML.includes("이스터에그 보유"));
    localStorage.setItem("isekai_lumberjack_save_v09","temporary ending save");const actions=element("endingActions");actions.classList.add("hidden");await game.finalizeEnding(actions);assert.equal(localStorage.getItem("isekai_lumberjack_save_v09"),null,"completed ending deletes ordinary save");assert.equal(JSON.parse(localStorage.getItem("isekai_lumberjack_meta")).endingSeen,true,"ending trophy flag persists separately");assert(!actions.classList.contains("hidden"),"ending actions appear after cleanup");
    console.log("game logic smoke tests: OK");
    process.exit(0);
  } catch(error) { console.error(error.stack||error); process.exit(1); }
},30);
