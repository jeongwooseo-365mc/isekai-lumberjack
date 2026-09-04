#!/usr/bin/env python3
"""Verify that Android builds use the game's axe icon and requested ABI."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ANDROID_RES = ROOT / "src-tauri" / "gen" / "android" / "app" / "src" / "main" / "res"

# Deterministic output of Tauri CLI 2.11.4 for src-tauri/icons/icon.png.
EXPECTED_ICONS = {
    "mipmap-hdpi/ic_launcher.png": "7edeefd44c7823f8e77b067d536b8793371926eaa60ea1ed4b33728aae9a7419",
    "mipmap-mdpi/ic_launcher.png": "8ee63cb1dd1d0599ce312a37c7096e4d032d42de5ec6338874fd6bd9805b18ca",
    "mipmap-xhdpi/ic_launcher.png": "6352799de5ba1342f69c2db2ab344bd23f6c04aba703469c1d75c45889d6441c",
    "mipmap-xxhdpi/ic_launcher.png": "f46882ced69ffba9c4ef66b02c1d690165001bdbfdc9fa24a8e7d59c51627317",
    "mipmap-xxxhdpi/ic_launcher.png": "b49ee291c1d35723d002c55a2d44289e39684234a127942f191030d3294bfd5b",
    "mipmap-hdpi/ic_launcher_foreground.png": "ac21b1bf7f3c4bafb42fede4a2e807625acc8aeeab93d5211a53f656e555b908",
    "mipmap-mdpi/ic_launcher_foreground.png": "168e1bdcc33de710f46ca77741752db24c5083b4742075bddf28b6c84c5c664d",
    "mipmap-xhdpi/ic_launcher_foreground.png": "2140a4c440455c6e7e7d5a99f74b673d66b559d3673ab97ef12273002b94d523",
    "mipmap-xxhdpi/ic_launcher_foreground.png": "705423bf0763760a1341bc99d54a46e0087a361cd76047c574f7d0633c0cd1df",
    "mipmap-xxxhdpi/ic_launcher_foreground.png": "2242411fb5821d35a8c03455927ca115288d0ac32b4cb0cdc6a8d63b2d927510",
}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def verify_generated(resource_root: Path = ANDROID_RES) -> None:
    errors: list[str] = []
    for relative, expected in EXPECTED_ICONS.items():
        path = resource_root / relative
        if not path.is_file():
            errors.append(f"missing generated icon: {relative}")
        elif digest(path.read_bytes()) != expected:
            errors.append(f"wrong generated icon: {relative}")
    if errors:
        raise RuntimeError("; ".join(errors))
    print(f"Android icons OK: {len(EXPECTED_ICONS)} axe launcher resources")


def verify_apk(apk: Path, abi: str) -> None:
    if not apk.is_file():
        raise RuntimeError(f"APK not found: {apk}")
    expected_hashes = set(EXPECTED_ICONS.values())
    with zipfile.ZipFile(apk) as archive:
        names = archive.namelist()
        if not any(name.startswith(f"lib/{abi}/") and name.endswith(".so") for name in names):
            raise RuntimeError(f"APK does not contain {abi} native library")
        config = json.loads(archive.read("assets/tauri.conf.json"))
        if config.get("identifier") != "com.isekailumberjack.game":
            raise RuntimeError("unexpected Android application identifier")
        if config.get("productName") != "이세계나무꾼":
            raise RuntimeError("unexpected Android launcher label")
        packaged_hashes = {
            digest(archive.read(name))
            for name in names
            if name.startswith("res/") and name.endswith(".png")
        }
        if not expected_hashes.intersection(packaged_hashes):
            raise RuntimeError("APK does not contain the generated axe launcher icon")
    print(f"Android APK OK: {apk.name} · {abi} · axe icon")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--generated", action="store_true")
    parser.add_argument("--res-root", type=Path, default=ANDROID_RES)
    parser.add_argument("--apk", type=Path)
    parser.add_argument("--abi", choices=("arm64-v8a", "x86_64"))
    args = parser.parse_args()
    try:
        if args.generated:
            verify_generated(args.res_root)
        if args.apk:
            if not args.abi:
                parser.error("--apk requires --abi")
            verify_apk(args.apk, args.abi)
        if not args.generated and not args.apk:
            parser.error("select --generated or --apk")
    except (KeyError, json.JSONDecodeError, OSError, RuntimeError, zipfile.BadZipFile) as error:
        print(f"Android package ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
