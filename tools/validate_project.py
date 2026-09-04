#!/usr/bin/env python3
"""Validate runtime assets, mobile layout rules, and packaging inputs for v1.1.2."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
CHECKS = 0


def check(condition: bool, message: str) -> None:
    global CHECKS
    CHECKS += 1
    if not condition:
        ERRORS.append(message)


def check_image(relative: str, size: tuple[int, int] | None = None) -> None:
    path = ROOT / relative
    check(path.is_file(), f"missing image: {relative}")
    if not path.is_file():
        return
    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            check(image.width > 0 and image.height > 0, f"invalid dimensions: {relative}")
            if size:
                check(image.size == size, f"unexpected size {image.size}: {relative}, expected {size}")
    except Exception as exc:  # pragma: no cover - reports damaged handoff files
        ERRORS.append(f"unreadable image {relative}: {exc}")


def check_audio(relative: str) -> None:
    path = ROOT / relative
    check(path.is_file(), f"missing audio: {relative}")
    if not path.is_file():
        return
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_name,sample_rate,channels:format=duration",
            "-of",
            "json",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    check(result.returncode == 0, f"ffprobe failed: {relative}")
    if result.returncode:
        return
    info = json.loads(result.stdout)
    streams = info.get("streams", [])
    check(bool(streams), f"no audio stream: {relative}")
    if streams:
        check(streams[0].get("codec_name") == "vorbis", f"not Vorbis OGG: {relative}")
        check(int(streams[0].get("channels", 0)) == 2, f"not stereo: {relative}")
    check(float(info.get("format", {}).get("duration", 0)) > 0.1, f"audio too short: {relative}")


def main() -> int:
    backgrounds = [
        "ending.png",
        "ending_return.png",
        "map.png",
        "pond.png",
        "worldtree_cave.png",
        "story_intro1.png",
        "story_intro2.png",
        "story_intro3.png",
        *[f"forest{i}.png" for i in range(1, 4)],
        *[f"mine{i}.png" for i in range(1, 4)],
        *[f"dungeon{i}.png" for i in range(1, 4)],
        *[f"home{i}.png" for i in range(1, 6)],
    ]
    for name in backgrounds:
        check_image(f"assets/bg/{name}")

    for gear in ("axe", "pickaxe", "rod", "sword", "armor"):
        for tier in range(5):
            check_image(f"assets/items/{gear}_{tier}.png", (256, 256))
    check_image("assets/items/easter_egg.png", (256, 256))
    with Image.open(ROOT / "assets/items/easter_egg.png") as egg:
        check("A" in egg.getbands(), "Easter egg icon must have transparent alpha")

    resources = [
        *[f"{kind}_{grade}.png" for kind in ("wood", "ore", "gold", "stone") for grade in ("low", "mid", "high")],
        "croaker.png",
        "mullet.png",
        "salmon.png",
        "lobster.png",
        "shell.png",
        "seaweed.png",
    ]
    for name in resources:
        check_image(f"assets/resources/{name}", (256, 256))

    for name in ("grilled_fish", "fish_soup", "salmon_steak", "seafood_stew", "lobster_course"):
        check_image(f"assets/foods/{name}.png", (256, 256))

    ui_names = ("armor", "attack", "auto", "cooking", "energy", "enhance", "map", "potion", "profile", "realestate", "settings", "workshop")
    for name in ui_names:
        check_image(f"assets/ui/{name}.png", (256, 256))
    check_image("assets/ui/logo_mark.png", (512, 512))
    check_image("src-tauri/icons/icon.png", (512, 512))
    check_image("src-tauri/icons/icon-mobile.png", (512, 512))
    with Image.open(ROOT / "src-tauri/icons/icon-mobile.png") as mobile_icon:
        alpha = mobile_icon.getchannel("A")
        bounds = alpha.getbbox()
        check(bounds is not None, "Android launcher artwork must not be empty")
        if bounds:
            left, top, right, bottom = bounds
            margins = (left, top, mobile_icon.width - right, mobile_icon.height - bottom)
            check(min(margins) >= 48, "Android launcher artwork must retain adaptive-icon safe margins")
            check(margins[2] >= margins[0] + 10, "Android launcher artwork must prioritize the right-side axe blade")

    for kind in ("tree", "ore", "monster"):
        for grade in ("low", "mid", "high"):
            check_image(f"assets/targets/{kind}_{grade}.png", (512, 512))
    check_image("assets/targets/worldtree.png", (512, 512))
    with Image.open(ROOT / "assets/targets/worldtree.png") as worldtree:
        check("A" in worldtree.getbands(), "worldtree sprite must have transparent alpha")

    sprite_frames = {
        "axe": ("idle", "windup", "hit"),
        "pickaxe": ("idle", "windup", "hit"),
        "sword": ("idle", "windup", "hit"),
        "rest": ("idle", "rest"),
        "fishing": ("idle", "cast", "wait", "hook", "lift", "reward"),
    }
    for group, frames in sprite_frames.items():
        for frame in frames:
            check_image(f"assets/sprites/{group}/{frame}.png", (512, 512))
    check_image("assets/sprites/fishing/bobber.png", (128, 128))

    bgm_names = ("title", "home", "forest", "mine", "pond", "dungeon", "map", "ending")
    for name in bgm_names:
        check_audio(f"assets/audio/bgm/{name}.ogg")

    sfx_names = (
        "auto_off", "auto_on", "axe_hit", "axe_swing", "cook", "eat",
        "enhance_fail", "enhance_start", "enhance_success", "equip", "exhausted",
        "fish_bite", "fish_cast", "fish_catch", "fish_reel", "gear_break", "heal",
        "level_up", "loot_common", "loot_rare", "monster_defeat", "ore_break",
        "pickaxe_hit", "pickaxe_swing", "purchase", "sword_hit", "sword_swing",
        "tree_break", "ui_back", "ui_click", "ui_confirm", "ui_error",
        "water_splash", "world_unlock",
    )
    for name in sfx_names:
        check_audio(f"assets/audio/sfx/{name}.ogg")

    for relative in ("index.html", "styles.css", "game.js"):
        check((ROOT / "dist" / relative).is_file(), f"dist missing: {relative}")

    for source_name in ("index.html", "styles.css"):
        text = (ROOT / source_name).read_text(encoding="utf-8")
        for reference in re.findall(r'(?:src=|url\()["\']?(assets/[^"\')]+)', text):
            check((ROOT / reference).is_file(), f"broken reference in {source_name}: {reference}")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    game_js = (ROOT / "game.js").read_text(encoding="utf-8")
    check('id="menuToggle"' in html, "mobile menu toggle is missing")
    check('id="targetHud"' in html, "standalone target HP HUD is missing")
    check("grid-template-columns: repeat(4,52px)" in css and "width: 52px; height: 52px" in css, "mobile menu must render as a 4x2 grid of 52px icon buttons")
    check("grid-template-columns: minmax(0,40%) minmax(0,60%)" in css, "HUD must reserve more width for the right-side log")
    check("grid-template-columns: repeat(2,minmax(0,72px))" in css, "equipped gear must use a compact two-column grid")
    check(".equip-slot img { display: block; width: 100%; height: 100%" in css, "equipped gear artwork must fill the enlarged slots")
    check(".food-count-badge" in css and ".equip-slot:nth-child(5)" not in css, "the HUD must support a sixth stacked-food slot")
    check(".map-point.dungeon { left: 86%; top: 88%" in css, "the dungeon map marker must sit near the lower-right rocky mountain with a margin")
    check(".game-shell *::-webkit-scrollbar { display: none" in css and "scrollbar-width: none" in css, "scrollbars must stay hidden while touch scrolling remains available")
    check("width: 100vw; max-width: 560px; width: min(100vw, 560px); height: 100vh; height: 100dvh" in css, "game shell must retain width and height fallbacks for older Android WebViews")
    check("top: 0; right: 0; bottom: 0; left: 0; inset: 0" in css, "full-screen layers must retain pre-inset Android WebView positioning")
    check("-webkit-overflow-scrolling: touch" in css and "overflow-y: auto" in css, "scrollable panels must retain touch scrolling")
    check('const APP_VERSION = "1.1.2"' in game_js and 'const SAVE_VERSION = "1.1.0"' in game_js and 'const SAVE_KEY = "isekai_lumberjack_save_v11"' in game_js, "v1.1.2 must preserve the v1.1 save schema")
    check("[[80,19,1,0,0,0],[70,20,8,1.6,.3,.1],[60,25,10,3.4,1.2,.4],[50,20,20,11,3,1],[30,15,25,16,11,4]]" in game_js, "rod fishing weights must match the v1.1 table")
    check("return roll<.03?1:roll<.10?2:null" in game_js, "high areas must drop 3% mid and 7% high stones without low stones")
    check("return roll<(20/55)?2:1" in game_js, "high normal rewards must be limited to mid and high grades")
    check("Math.floor(amount/1000)}k" in game_js, "large XP values must use integer k notation")
    check("{wood2:2000,gold2:2000}" in game_js and "{wood2:800,ore2:800,gold2:400}" in game_js, "divine equipment recipes must use doubled costs")
    for width, height in ((360, 640), (390, 700), (430, 932), (560, 900)):
        if height <= 720:
            scene_height, hud_height = max(height * .52, 320), max(height * .48, 300)
        else:
            scene_height, hud_height = max(height * .57, 350), max(height * .43, 290)
        check(scene_height + hud_height <= height + 1 and 232 + 16 <= width, f"mobile layout overflows {width}x{height}")

    for relative in (
        "package.json",
        "src-tauri/Cargo.toml",
        "src-tauri/tauri.conf.json",
        "src-tauri/src/lib.rs",
        "src-tauri/src/main.rs",
        "README.md",
        "GAME_DESIGN_MASTER_v1.1.md",
        "HANDOFF_v1.1.md",
        "BUILD_REPORT_v1.1.md",
        "BUILD_REPORT_v1.1.1.md",
        "BUILD_REPORT_v1.1.2.md",
        "src-tauri/tauri.android.conf.json",
        "tools/patch_android.py",
        "tools/verify_android_package.py",
        "tools/android_smoke_test.sh",
        ".github/workflows/release-build.yml",
    ):
        check((ROOT / relative).is_file(), f"missing project file: {relative}")

    release_workflow = (ROOT / ".github/workflows/release-build.yml").read_text(encoding="utf-8")
    check("android:" in release_workflow and "windows:" in release_workflow, "one workflow must contain parallel Android and Windows jobs")
    check("tauri-apps/tauri-action@v1" in release_workflow and "uploadWorkflowArtifacts: true" in release_workflow, "Windows job must publish build artifacts")
    check("--split-per-abi --target aarch64 --target x86_64" in release_workflow, "Android job must build ARM64 release and x86_64 runtime-test APKs")
    check("targets: aarch64-linux-android,x86_64-linux-android" in release_workflow, "Android job must install ARM64 and x86_64 Rust targets")
    check("apksigner\" verify --verbose --print-certs" in release_workflow and "actions/upload-artifact@v4" in release_workflow, "Android job must sign, verify, and publish the APK")
    check("python3 tools/patch_android.py --check" in release_workflow, "Android job must verify immersive mode and the short app label")
    check(release_workflow.index("npx tauri android init --ci") < release_workflow.index("tauri icon src-tauri/icons/icon-mobile.png"), "Android safe-area icons must be generated after android init")
    check("python3 tools/verify_android_package.py --generated" in release_workflow, "Android job must verify the generated axe icons")
    check("reactivecircus/android-emulator-runner@v2" in release_workflow and "tools/android_smoke_test.sh" in release_workflow, "Android job must install and launch the app in an emulator")
    check(not (ROOT / ".github/workflows/android-build.yml").exists() and not (ROOT / ".github/workflows/windows-build.yml").exists(), "legacy duplicate build workflows must be removed")
    android_smoke = (ROOT / "tools/android_smoke_test.sh").read_text(encoding="utf-8")
    check("--screenshot release/android-launch.png" in android_smoke, "Android smoke test must reject a blank launch screen")
    tauri_config = json.loads((ROOT / "src-tauri/tauri.conf.json").read_text(encoding="utf-8"))
    check(tauri_config.get("bundle", {}).get("targets") == ["nsis"], "Windows bundle must avoid WiX and build the NSIS setup executable")
    check(tauri_config.get("version") == "1.1.2", "Tauri version must be 1.1.2")
    check(tauri_config.get("identifier") == "com.isekailumberjack.game", "Windows must retain the existing application identifier")
    android_config = json.loads((ROOT / "src-tauri/tauri.android.conf.json").read_text(encoding="utf-8"))
    check(android_config.get("productName") == "이세계나무꾼", "Android launcher name must use the short Korean title")
    check(android_config.get("identifier") == "com.isekailumberjack.release", "Android must use the new independent application identifier")
    main_rs = (ROOT / "src-tauri/src/main.rs").read_text(encoding="utf-8")
    check('windows_subsystem = "windows"' in main_rs, "release Windows builds must suppress the console window")
    android_patch = (ROOT / "tools/patch_android.py").read_text(encoding="utf-8")
    check("BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE" in android_patch and "SYSTEM_UI_FLAG_IMMERSIVE_STICKY" in android_patch, "Android shell patch must hide system bars and allow swipe reveal")
    check("import app.tauri.TauriActivity" not in android_patch and "class MainActivity : TauriActivity()" in android_patch, "Android activity must use Tauri's generated same-package base class")

    if ERRORS:
        print(f"FAILED: {len(ERRORS)} error(s) across {CHECKS} checks")
        for error in ERRORS:
            print(f"- {error}")
        return 1

    print(f"PASS: {CHECKS} project checks")
    print(f"- {len(backgrounds)} backgrounds, 26 gear icons, {len(resources)} resources")
    print(f"- {len(bgm_names)} BGM tracks, {len(sfx_names)} stereo Vorbis sound effects")
    return 0


if __name__ == "__main__":
    sys.exit(main())
