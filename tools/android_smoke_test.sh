#!/usr/bin/env bash
set -euo pipefail

apk="${1:?APK path is required}"
package="com.isekailumberjack.stable"
activity="$package/.MainActivity"
mkdir -p release

dump_diagnostics() {
  {
    echo "===== crash buffer ====="
    adb logcat -d -b crash -v threadtime || true
    echo "===== app/runtime log ====="
    adb logcat -d -v threadtime | grep -E \
      "$package|AndroidRuntime|FATAL EXCEPTION|Fatal signal|linker|WebView|chromium|crash_dump|DEBUG" | tail -n 1200 || true
    echo "===== package state ====="
    adb shell dumpsys package "$package" | tail -n 240 || true
  } | tee release/android-failure-log.txt
}

smoke_status=0
trap 'smoke_status=$?; if (( smoke_status != 0 )); then dump_diagnostics; fi' EXIT

adb install --no-streaming -r "$apk" | tee release/android-install.txt
# Headless API 35 emulators can surface an unrelated home-launcher ANR over
# the game. The activity is launched directly below, so stop both common home
# packages before clearing logs to keep system UI out of the app QA.
adb shell am force-stop com.google.android.apps.nexuslauncher >/dev/null 2>&1 || true
adb shell am force-stop com.android.launcher3 >/dev/null 2>&1 || true
adb logcat -c
adb shell am force-stop "$package"
# A fresh emulator otherwise covers the game with Android's one-time
# immersive-mode tutorial. Confirm it up front so the captured screen is the
# actual game UI, not a SystemUI overlay.
adb shell settings put secure immersive_mode_confirmations confirmed || true
adb shell am start -W -n "$activity" | tee release/android-launch-check.txt

for _ in $(seq 1 20); do
  if adb shell pidof "$package" | tr -d '\r' | grep -Eq '^[0-9]+'; then
    break
  fi
  sleep 1
done

pid="$(adb shell pidof "$package" 2>/dev/null | tr -d '\r' || true)"
if [[ -z "$pid" ]]; then
  echo "Android launch ERROR: process is not alive" >&2
  exit 1
fi

sleep 8
activity_state="$(adb shell dumpsys activity activities)"
if ! grep -Eq "(mResumedActivity|topResumedActivity|ResumedActivity).*${package}" <<<"$activity_state"; then
  printf '%s\n' "$activity_state" >> release/android-launch-check.txt
  echo "Android launch ERROR: game activity is not resumed" >&2
  exit 1
fi

crash_log="$(adb logcat -d -b crash || true)"
if grep -Fq "$package" <<<"$crash_log"; then
  printf '%s\n' "$crash_log" >> release/android-launch-check.txt
  echo "Android launch ERROR: crash log found" >&2
  exit 1
fi

dump_window() {
  adb shell uiautomator dump /sdcard/android-window.xml >/dev/null 2>&1 || true
  adb pull /sdcard/android-window.xml release/android-window.xml >/dev/null 2>&1 || true
}

tutorial_pattern='Viewing full screen|To exit, swipe down|GOT IT'
dump_window
if [[ -f release/android-window.xml ]] && grep -Eiq "is(n't| not) responding|is not responding" release/android-window.xml; then
  echo "Android launch ERROR: emulator system ANR dialog covers the game" >&2
  exit 1
fi
if [[ -f release/android-window.xml ]] && grep -Eiq "$tutorial_pattern" release/android-window.xml; then
  tap_point="$(python3 - release/android-window.xml <<'PY'
import re
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
for node in root.iter("node"):
    label = f'{node.attrib.get("text", "")} {node.attrib.get("content-desc", "")}'.upper()
    if "GOT IT" not in label:
        continue
    match = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.attrib.get("bounds", ""))
    if match:
        left, top, right, bottom = map(int, match.groups())
        print((left + right) // 2, (top + bottom) // 2)
        break
PY
)"
  if [[ "$tap_point" =~ ^[0-9]+\ [0-9]+$ ]]; then
    adb shell input tap $tap_point
  else
    adb shell input keyevent 66
  fi
  sleep 2
  dump_window
fi
if [[ -f release/android-window.xml ]] && grep -Eiq "$tutorial_pattern" release/android-window.xml; then
  echo "Android launch ERROR: immersive-mode tutorial still covers the game" >&2
  exit 1
fi

adb exec-out screencap -p > release/android-launch.png
cp release/android-launch.png release/android-intro.png

# Exercise the path that a real player takes. The old smoke test stopped at
# the title screen and therefore could not catch a WebView failure after the
# Game Start tap. The button sits at the horizontal centre and about 82% of
# the fullscreen viewport on every supported phone aspect ratio.
screen_size="$(adb shell wm size | tr -d '\r' | tail -1 | sed -E 's/.*: ([0-9]+)x([0-9]+)/\1 \2/')"
if [[ ! "$screen_size" =~ ^[0-9]+\ [0-9]+$ ]]; then
  echo "Android launch ERROR: cannot determine emulator screen size" >&2
  exit 1
fi
read -r screen_width screen_height <<<"$screen_size"
start_x=$((screen_width / 2))
start_y=$((screen_height * 82 / 100))
adb shell input tap "$start_x" "$start_y"

check_alive() {
  local stage="$1"
  local current_pid
  current_pid="$(adb shell pidof "$package" 2>/dev/null | tr -d '\r' || true)"
  if [[ -z "$current_pid" ]]; then
    adb logcat -d -b crash | tee -a release/android-launch-check.txt || true
    echo "Android launch ERROR: process died during $stage" >&2
    exit 1
  fi
  local current_crash
  current_crash="$(adb logcat -d -b crash || true)"
  if grep -Fq "$package" <<<"$current_crash"; then
    printf '%s\n' "$current_crash" >> release/android-launch-check.txt
    echo "Android launch ERROR: crash during $stage" >&2
    exit 1
  fi
}

sleep 1
check_alive "opening scene 1"
adb exec-out screencap -p > release/android-opening-1.png

sleep 5
check_alive "opening scene 2"
adb exec-out screencap -p > release/android-opening-2.png

sleep 7
check_alive "opening scene 3"
adb exec-out screencap -p > release/android-opening-3.png

sleep 6
check_alive "main game entry"
adb exec-out screencap -p > release/android-main.png

# Capture every timed state first. PNG analysis is intentionally thorough and
# can take tens of seconds on CI; running it between captures would let the
# cinematic advance and make two nominal stages appear identical.
python3 tools/verify_android_package.py --screenshot release/android-intro.png
python3 tools/verify_android_package.py --screenshot release/android-opening-1.png
# opening-2 may intentionally land inside the three-second pure-black impact
# transition. Keep it as evidence, but do not reject that designed frame as a
# blank WebView.
python3 tools/verify_android_package.py --screenshot release/android-opening-3.png
python3 tools/verify_android_package.py --screenshot release/android-main.png
python3 tools/verify_android_package.py --transition release/android-intro.png release/android-opening-1.png
python3 tools/verify_android_package.py --transition release/android-opening-1.png release/android-opening-3.png
python3 tools/verify_android_package.py --transition release/android-opening-3.png release/android-main.png

printf 'Android full startup OK: pid=%s activity=%s startTap=%s,%s intro->story1->black-transition->story3->main\n' \
  "$pid" "$activity" "$start_x" "$start_y" | tee -a release/android-launch-check.txt
