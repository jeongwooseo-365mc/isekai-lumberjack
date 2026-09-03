#!/usr/bin/env python3
"""Procedurally render layered 48 kHz stereo game sound effects."""

from pathlib import Path
import hashlib
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve


SR = 48_000
ROOT = Path(__file__).resolve().parents[1]
WAV_DIR = ROOT / "build" / "sfx_wav"
OUT_DIR = ROOT / "assets" / "audio" / "sfx"


def rng_for(name):
    seed = int.from_bytes(hashlib.sha256(name.encode()).digest()[:8], "little")
    return np.random.default_rng(seed)


def envelope(n, attack=0.01, decay=0.15, sustain=0.0, release=0.1):
    a = max(1, int(attack * SR)); d = max(1, int(decay * SR)); r = max(1, int(release * SR))
    s = max(0, n - a - d - r)
    parts = [np.linspace(0, 1, a, endpoint=False), np.linspace(1, sustain, d, endpoint=False)]
    if s: parts.append(np.full(s, sustain))
    parts.append(np.linspace(sustain, 0, r))
    return np.concatenate(parts)[:n]


def exp_env(n, decay=8.0, attack=0.003):
    t = np.arange(n) / SR
    return (1 - np.exp(-t / max(attack, 1e-5))) * np.exp(-decay * t)


def filt(x, low=None, high=None, order=4):
    ny = SR / 2
    if low and high:
        sos = butter(order, [low / ny, high / ny], btype="band", output="sos")
    elif low:
        sos = butter(order, low / ny, btype="high", output="sos")
    elif high:
        sos = butter(order, high / ny, btype="low", output="sos")
    else:
        return x
    return sosfilt(sos, x)


def noise(name, dur, low=None, high=None, decay=None):
    r = rng_for(name)
    n = int(dur * SR)
    x = filt(r.normal(0, 1, n), low, high)
    x /= max(1e-8, np.max(np.abs(x)))
    if decay is not None: x *= exp_env(n, decay, 0.001)
    return x


def glide(dur, f0, f1, harmonics=(1, 2), decay=5.0, vibrato=0.0, name="tone"):
    n = int(dur * SR); t = np.arange(n) / SR
    freq = np.geomspace(max(1, f0), max(1, f1), n)
    if vibrato: freq *= 1 + vibrato * np.sin(2 * np.pi * 7 * t)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    x = np.zeros(n)
    for i, h in enumerate(harmonics): x += np.sin(phase * h) / (h * (1 + i * .22))
    x *= exp_env(n, decay, 0.002)
    return np.tanh(x * .8)


def chime(name, notes, dur=1.0, decay=4.0):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    r = rng_for(name)
    for j, f in enumerate(notes):
        delay = int(j * .035 * SR)
        tt = t[:n-delay]
        partial = (np.sin(2*np.pi*f*tt + r.random()*np.pi*2)
                   + .32*np.sin(2*np.pi*f*2.01*tt)
                   + .14*np.sin(2*np.pi*f*3.97*tt))
        partial *= np.exp(-(decay + j*.3) * tt) * (1 - np.exp(-tt/.002))
        x[delay:] += partial
    return np.tanh(x * .45)


def whoosh(name, dur=.45, bright=1.0, reverse=False):
    n = int(dur * SR); t = np.arange(n) / SR
    x = noise(name, dur, low=160*bright, high=min(12_000, 7_000*bright))
    shape = np.sin(np.pi * np.clip(t/dur, 0, 1)) ** 1.7
    if reverse: shape = shape[::-1]
    x *= shape
    x += .18 * glide(dur, 220*bright, 70*bright, (1,), 5, name=name+"g")
    return np.tanh(x * .85)


def impact(name, dur=.55, body=95, material="wood"):
    n = int(dur * SR); x = np.zeros(n)
    if material == "wood":
        x += .48 * noise(name+"crack", dur, 180, 2600, 12)
        x += .62 * glide(dur, body*1.25, body*.6, (1,2,3), 9, name=name+"body")
        for off, f in ((0, 420), (.018, 670), (.047, 310)):
            k=int(off*SR); part=.18*glide(dur-off, f, f*.72, (1,2), 15, name=name+str(f)); end=min(len(x),k+len(part)); x[k:end] += part[:end-k]
    elif material == "stone":
        x += .5 * noise(name+"grit", dur, 400, 9000, 15)
        x += .56 * glide(dur, body, body*.55, (1,2), 8, name=name+"body")
        for off, f in ((0, 1150), (.012, 1760), (.034, 760)):
            k=int(off*SR); part=.24*glide(dur-off, f, f*.91, (1,2,3), 12, name=name+str(f)); end=min(len(x),k+len(part)); x[k:end] += part[:end-k]
    elif material == "metal":
        x += .34 * noise(name+"scrape", dur, 900, 13000, 18)
        for off, f in ((0, 920), (.006, 1430), (.013, 2270)):
            k=int(off*SR); part=.28*glide(dur-off, f, f*.985, (1,2), 5.5, name=name+str(f)); end=min(len(x),k+len(part)); x[k:end] += part[:end-k]
        x += .35 * glide(dur, body, body*.7, (1,), 8, name=name+"body")
    return np.tanh(x * 1.1)


def splash(name, dur=.75, strength=1.0):
    n=int(dur*SR); x=.52*noise(name+"water",dur,250,10000,7)
    r=rng_for(name)
    for i in range(8):
        off=int(r.uniform(.01,.35)*SR); length=n-off
        if length<=0: continue
        bd=length/SR
        bubble=glide(bd,r.uniform(180,600),r.uniform(600,1500),(1,2),r.uniform(8,16),name=name+str(i))
        end=min(len(x),off+len(bubble)); x[off:end] += bubble[:end-off]*r.uniform(.08,.22)
    return np.tanh(x*strength)


def add(base, layer, offset=0.0, gain=1.0):
    k=int(offset*SR); end=min(len(base),k+len(layer))
    if end>k: base[k:end]+=layer[:end-k]*gain


def stereo(x, pan=0.0):
    pan=np.clip(pan,-1,1); left=np.sqrt((1-pan)/2); right=np.sqrt((1+pan)/2)
    return np.column_stack((x*left,x*right))


def reverb(x, name, amount=.12, room=.24):
    r=rng_for(name+"verb"); n=max(64,int(room*SR)); t=np.arange(n)/SR
    ir=r.normal(0,1,n)*np.exp(-t/max(.02,room/4)); ir=filt(ir,high=9000)
    for ms,g in ((17,.8),(31,.5),(47,.32),(73,.2)):
        k=int(ms/1000*SR)
        if k<n: ir[k]+=g
    ir[0]+=1; ir/=np.sqrt(np.sum(ir*ir)+1e-9)
    wet=np.column_stack([fftconvolve(x[:,c],ir,mode="full")[:len(x)] for c in range(2)])
    return x*(1-amount)+wet*amount


def render(name, mono, pan=0, verb=.1, room=.22):
    x=stereo(mono,pan)
    if verb: x=reverb(x,name,verb,room)
    x=np.tanh(x*1.35)
    peak=np.max(np.abs(x))
    if peak: x*=0.88/peak
    tail=np.linspace(1,0,min(len(x),int(.025*SR)))
    x[-len(tail):]*=tail[:,None]
    wav=(x*32767).astype(np.int16)
    wav_path=WAV_DIR/f"{name}.wav"; ogg_path=OUT_DIR/f"{name}.ogg"
    wavfile.write(wav_path,SR,wav)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",str(wav_path),"-c:a","libvorbis","-q:a","6",str(ogg_path)],check=True)


def sequence(name, dur, layers, verb=.1, room=.22):
    out=np.zeros(int(dur*SR))
    for sound, offset, gain in layers: add(out,sound,offset,gain)
    render(name,np.tanh(out),verb=verb,room=room)


def main():
    WAV_DIR.mkdir(parents=True,exist_ok=True); OUT_DIR.mkdir(parents=True,exist_ok=True)
    sequence("ui_click",.22,[(impact("uc",.2,180,"wood"),0,.45),(chime("ucc",[880],.18,14),.015,.22)],.05,.12)
    sequence("ui_back",.35,[(whoosh("ub",.3,.9,True),0,.35),(impact("ubk",.2,150,"wood"),.1,.25)],.06,.14)
    sequence("ui_confirm",.65,[(chime("ucon",[523.25,659.25,783.99],.62,5.5),0,.65)],.18,.35)
    sequence("ui_error",.45,[(impact("uer",.4,72,"wood"),0,.55),(glide(.35,180,105,(1,2),6,name="uer2"),.03,.32)],.08,.15)
    sequence("auto_on",.6,[(whoosh("aon",.45,1.2),0,.25),(chime("aonc",[440,659.25,880],.52,6),.08,.55)],.15,.3)
    sequence("auto_off",.45,[(whoosh("aoff",.35,.8,True),0,.3),(chime("aoffc",[440,329.63],.38,8),.03,.45)],.1,.22)
    sequence("axe_swing",.48,[(whoosh("axs",.44,.8),0,.75)],.06,.15)
    sequence("axe_hit",.58,[(impact("axh",.55,105,"wood"),0,.9),(noise("axchip",.25,1200,9000,20),.01,.18)],.12,.24)
    sequence("tree_break",1.15,[(impact("tb1",.8,72,"wood"),0,.9),(impact("tb2",.7,62,"wood"),.28,.65),(noise("leaves",.8,900,9000,4),.22,.25)],.19,.4)
    sequence("pickaxe_swing",.48,[(whoosh("pks",.43,1.0),0,.67)],.06,.15)
    sequence("pickaxe_hit",.65,[(impact("pkh",.62,82,"stone"),0,.92)],.2,.42)
    sequence("ore_break",1.0,[(impact("orb",.8,68,"stone"),0,.85),(chime("orc",[1046.5,1568,2093],.82,5),.05,.32),(noise("debris",.7,300,7000,7),.18,.3)],.22,.48)
    sequence("sword_swing",.4,[(whoosh("sws",.36,1.45),0,.75),(glide(.32,1900,620,(1,),12,name="swsh"),0,.16)],.07,.16)
    sequence("sword_hit",.6,[(impact("swh",.55,88,"metal"),0,.85),(noise("swcut",.3,1700,14000,20),0,.22)],.17,.35)
    sequence("monster_defeat",1.0,[(impact("md",.72,58,"wood"),0,.55),(glide(.9,260,52,(1,2,3),3.5,name="mdg"),.02,.42),(noise("mdn",.8,180,5000,4),.08,.3)],.28,.6)
    sequence("fish_cast",.65,[(whoosh("fc",.5,.8),0,.38),(glide(.45,420,850,(1,),9,name="fcl"),.05,.18),(splash("fcs",.3,.55),.31,.45)],.13,.28)
    sequence("water_splash",.8,[(splash("ws",.76,1.0),0,.8)],.18,.38)
    sequence("fish_bite",.55,[(splash("fb",.45,.65),0,.52),(chime("fbc",[880,1174.66],.4,9),.05,.38)],.12,.24)
    sequence("fish_reel",.9,[(whoosh("fr",.75,.65,True),0,.38),(noise("frline",.75,900,7000,5),0,.2),(impact("frk",.3,150,"wood"),.48,.25)],.12,.25)
    sequence("fish_catch",.9,[(splash("fca",.55,.7),0,.5),(chime("fcac",[659.25,783.99,1046.5],.82,5.5),.08,.52)],.2,.42)
    sequence("loot_common",.65,[(chime("lc",[880,1108.73,1318.51],.58,7),0,.5),(noise("lcs",.35,3000,15000,10),.02,.12)],.18,.34)
    sequence("loot_rare",1.2,[(chime("lr",[523.25,659.25,783.99,1046.5],1.08,3.5),0,.6),(whoosh("lrw",.7,1.3,True),0,.2)],.28,.65)
    sequence("purchase",.85,[(chime("pur",[987.77,1318.51,1567.98],.72,6),0,.48),(impact("purc",.3,190,"metal"),.03,.3)],.16,.32)
    sequence("equip",.7,[(whoosh("eq",.4,1.1),0,.25),(impact("eqi",.5,105,"metal"),.13,.58)],.17,.36)
    sequence("cook",1.05,[(noise("cookf",.95,300,4200,3),0,.22),(splash("cookb",.8,.35),.03,.25),(chime("cookc",[523.25,659.25],.45,8),.5,.3)],.16,.32)
    sequence("eat",.65,[(impact("eat",.35,170,"wood"),0,.25),(splash("eat2",.48,.3),.08,.3)],.08,.18)
    sequence("heal",.9,[(chime("heal",[523.25,659.25,783.99,1046.5],.82,4.5),0,.5),(whoosh("healw",.65,1.0,True),0,.2)],.25,.55)
    sequence("enhance_start",1.1,[(whoosh("ens",.9,1.15,True),0,.42),(glide(1.0,110,880,(1,2),2.4,name="ensg"),0,.28)],.25,.6)
    sequence("enhance_success",1.45,[(impact("esu",.55,110,"metal"),0,.5),(chime("esuc",[523.25,659.25,783.99,1046.5,1318.51],1.35,3.2),.08,.68)],.33,.8)
    sequence("enhance_fail",1.0,[(impact("efa",.72,60,"metal"),0,.62),(glide(.88,330,55,(1,2),3,name="efag"),.05,.45)],.24,.55)
    sequence("gear_break",1.05,[(impact("gb1",.65,65,"metal"),0,.8),(impact("gb2",.55,78,"stone"),.11,.55),(noise("shards",.8,1800,15000,8),.12,.35)],.25,.5)
    sequence("level_up",1.5,[(whoosh("luw",.8,1.1,True),0,.25),(chime("luc",[392,523.25,659.25,783.99,1046.5],1.42,3.0),.06,.72)],.3,.72)
    sequence("exhausted",.85,[(glide(.78,190,48,(1,2),3,name="exh"),0,.48),(impact("exhk",.48,58,"wood"),.18,.42)],.16,.36)
    sequence("world_unlock",2.15,[(whoosh("wuw",1.4,1.3,True),0,.35),(chime("wuc",[261.63,392,523.25,659.25,783.99],2.0,2.1),.08,.78),(glide(1.8,70,280,(1,2,3),1.5,name="wug"),0,.28)],.38,.95)


if __name__ == "__main__":
    main()
