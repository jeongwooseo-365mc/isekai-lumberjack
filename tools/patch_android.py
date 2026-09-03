#!/usr/bin/env python3
"""Apply and verify the generated Android shell customizations."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ANDROID = ROOT / "src-tauri" / "gen" / "android"
SHORT_NAME = "이세계나무꾼"


def generated_files() -> tuple[Path, Path]:
    activities = sorted(ANDROID.glob("app/src/main/java/**/MainActivity.kt"))
    if not activities:
        raise FileNotFoundError("MainActivity.kt를 찾지 못했습니다. 먼저 `tauri android init`을 실행해 주세요.")
    strings = ANDROID / "app" / "src" / "main" / "res" / "values" / "strings.xml"
    return activities[0], strings


def activity_source(package_name: str) -> str:
    return f'''package {package_name}

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import app.tauri.TauriActivity

class MainActivity : TauriActivity() {{
  override fun onCreate(savedInstanceState: Bundle?) {{
    super.onCreate(savedInstanceState)
    enterImmersiveMode()
  }}

  override fun onResume() {{
    super.onResume()
    enterImmersiveMode()
  }}

  override fun onWindowFocusChanged(hasFocus: Boolean) {{
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) enterImmersiveMode()
  }}

  @Suppress("DEPRECATION")
  private fun enterImmersiveMode() {{
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {{
      window.setDecorFitsSystemWindows(false)
      window.insetsController?.apply {{
        hide(WindowInsets.Type.systemBars())
        systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      }}
    }} else {{
      window.decorView.systemUiVisibility =
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
        View.SYSTEM_UI_FLAG_FULLSCREEN or
        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
        View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
    }}
  }}
}}
'''


def patch() -> None:
    activity, strings = generated_files()
    original = activity.read_text(encoding="utf-8")
    match = re.search(r"^package\s+([^\s]+)", original, re.MULTILINE)
    if not match:
        raise RuntimeError(f"패키지 선언을 찾지 못했습니다: {activity}")
    activity.write_text(activity_source(match.group(1)), encoding="utf-8")

    strings.parent.mkdir(parents=True, exist_ok=True)
    if strings.exists():
        xml = strings.read_text(encoding="utf-8")
        if re.search(r'<string\s+name="app_name"[^>]*>.*?</string>', xml, re.DOTALL):
            xml = re.sub(
                r'(<string\s+name="app_name"[^>]*>).*?(</string>)',
                rf"\g<1>{SHORT_NAME}\g<2>",
                xml,
                flags=re.DOTALL,
            )
        else:
            xml = xml.replace("</resources>", f'  <string name="app_name">{SHORT_NAME}</string>\n</resources>')
    else:
        xml = f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <string name="app_name">{SHORT_NAME}</string>\n</resources>\n'
    strings.write_text(xml, encoding="utf-8")


def verify() -> None:
    activity, strings = generated_files()
    source = activity.read_text(encoding="utf-8")
    xml = strings.read_text(encoding="utf-8") if strings.exists() else ""
    required = (
        "SYSTEM_UI_FLAG_IMMERSIVE_STICKY",
        "WindowInsets.Type.systemBars()",
        "BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE",
        "onWindowFocusChanged",
    )
    missing = [token for token in required if token not in source]
    if missing:
        raise RuntimeError(f"몰입 화면 코드가 누락되었습니다: {', '.join(missing)}")
    if f'>{SHORT_NAME}</string>' not in xml:
        raise RuntimeError("Android 앱 이름이 짧은 이름으로 설정되지 않았습니다.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="생성된 Android 설정을 수정하지 않고 확인합니다.")
    args = parser.parse_args()
    try:
        if not args.check:
            patch()
        verify()
    except (FileNotFoundError, RuntimeError) as error:
        print(f"Android shell ERROR: {error}", file=sys.stderr)
        return 1
    print(f"Android shell OK: 몰입 화면 · 앱 이름 {SHORT_NAME}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
