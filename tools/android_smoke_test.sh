#!/usr/bin/env bash
set -euo pipefail

apk="${1:?APK path is required}"
package="com.isekailumberjack.game"
activity="$package/.MainActivity"
mkdir -p release

adb install --no-streaming -r "$apk" | tee release/android-install.txt
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

pid="$(adb shell pidof "$package" | tr -d '\r')"
if [[ -z "$pid" ]]; then
  adb logcat -d -b crash || true
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

adb shell uiautomator dump /sdcard/android-window.xml >/dev/null 2>&1 || true
adb pull /sdcard/android-window.xml release/android-window.xml >/dev/null 2>&1 || true
if [[ -f release/android-window.xml ]] && grep -Eiq 'Viewing full screen|To exit, swipe down|GOT IT' release/android-window.xml; then
  echo "Android launch ERROR: immersive-mode tutorial still covers the game" >&2
  exit 1
fi

adb exec-out screencap -p > release/android-launch.png
python3 tools/verify_android_package.py --screenshot release/android-launch.png
printf 'Android launch OK: pid=%s activity=%s\n' "$pid" "$activity" | tee -a release/android-launch-check.txt
