#!/usr/bin/env python3
"""Verify Android package metadata, launcher art, ABI, and launch capture."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
import zipfile
import zlib
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


def png_pixels(data: bytes) -> tuple[int, int, bytes]:
    """Decode the 8-bit, non-interlaced PNG forms used by launcher icons."""
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("not a PNG")
    position = 8
    width = height = bit_depth = color_type = interlace = 0
    palette = b""
    transparency = b""
    compressed = bytearray()
    while position + 12 <= len(data):
        length = struct.unpack(">I", data[position : position + 4])[0]
        chunk_type = data[position + 4 : position + 8]
        payload = data[position + 8 : position + 8 + length]
        position += 12 + length
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _, _, interlace = struct.unpack(">IIBBBBB", payload)
        elif chunk_type == b"PLTE":
            palette = payload
        elif chunk_type == b"tRNS":
            transparency = payload
        elif chunk_type == b"IDAT":
            compressed.extend(payload)
        elif chunk_type == b"IEND":
            break
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}.get(color_type)
    if not width or not height or bit_depth != 8 or interlace != 0 or not channels:
        raise ValueError("unsupported PNG format")
    stride = width * channels
    raw = zlib.decompress(bytes(compressed))
    rows: list[bytearray] = []
    offset = 0
    previous = bytearray(stride)

    def paeth(left: int, up: int, upper_left: int) -> int:
        estimate = left + up - upper_left
        distances = (abs(estimate - left), abs(estimate - up), abs(estimate - upper_left))
        return (left, up, upper_left)[distances.index(min(distances))]

    for _ in range(height):
        filter_type = raw[offset]
        offset += 1
        source = raw[offset : offset + stride]
        offset += stride
        row = bytearray(stride)
        for index, value in enumerate(source):
            left = row[index - channels] if index >= channels else 0
            up = previous[index]
            upper_left = previous[index - channels] if index >= channels else 0
            predictor = {
                0: 0,
                1: left,
                2: up,
                3: (left + up) // 2,
                4: paeth(left, up, upper_left),
            }.get(filter_type)
            if predictor is None:
                raise ValueError("unsupported PNG filter")
            row[index] = (value + predictor) & 0xFF
        rows.append(row)
        previous = row

    rgba = bytearray()
    for row in rows:
        for index in range(0, len(row), channels):
            pixel = row[index : index + channels]
            if color_type == 6:
                red, green, blue, alpha = pixel
            elif color_type == 2:
                red, green, blue = pixel
                alpha = 255
            elif color_type == 0:
                red = green = blue = pixel[0]
                alpha = 255
            elif color_type == 4:
                red = green = blue = pixel[0]
                alpha = pixel[1]
            else:
                palette_index = pixel[0]
                palette_offset = palette_index * 3
                red, green, blue = palette[palette_offset : palette_offset + 3]
                alpha = transparency[palette_index] if palette_index < len(transparency) else 255
            if alpha == 0:
                red = green = blue = 0
            rgba.extend((red, green, blue, alpha))
    return width, height, bytes(rgba)


def pixel_signature(data: bytes) -> tuple[int, int, str]:
    width, height, pixels = png_pixels(data)
    return width, height, digest(pixels)


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


def verify_apk(apk: Path, abi: str, resource_root: Path = ANDROID_RES) -> None:
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
        packaged_hashes = set()
        packaged_pixels = set()
        for name in names:
            if not (name.startswith("res/") and name.endswith(".png")):
                continue
            data = archive.read(name)
            packaged_hashes.add(digest(data))
            try:
                packaged_pixels.add(pixel_signature(data))
            except (IndexError, struct.error, ValueError, zlib.error):
                pass
        expected_pixels = {
            pixel_signature((resource_root / relative).read_bytes())
            for relative in EXPECTED_ICONS
        }
        if not expected_hashes.intersection(packaged_hashes) and not expected_pixels.intersection(packaged_pixels):
            raise RuntimeError("APK does not contain the generated axe launcher icon")
    print(f"Android APK OK: {apk.name} · {abi} · axe icon")


def verify_screenshot(screenshot: Path) -> None:
    """Reject the smooth empty WebView background seen when the game is 0px tall."""
    if not screenshot.is_file():
        raise RuntimeError(f"screenshot not found: {screenshot}")
    width, height, pixels = png_pixels(screenshot.read_bytes())
    if width < 320 or height < 480:
        raise RuntimeError(f"unexpected Android screenshot size: {width}x{height}")

    strong_edges = 0
    comparisons = 0
    quantized_colors: set[tuple[int, int, int]] = set()
    step = 4
    for y in range(0, height, step):
        for x in range(0, width, step):
            offset = (y * width + x) * 4
            quantized_colors.add(tuple(channel // 16 for channel in pixels[offset : offset + 3]))
            if x + step >= width:
                continue
            neighbor = (y * width + x + step) * 4
            difference = sum(abs(pixels[offset + channel] - pixels[neighbor + channel]) for channel in range(3))
            strong_edges += difference >= 24
            comparisons += 1

    edge_ratio = strong_edges / max(1, comparisons)
    if edge_ratio < 0.005 or len(quantized_colors) < 32:
        raise RuntimeError(
            "Android screenshot appears blank "
            f"(edge ratio {edge_ratio:.4f}, colors {len(quantized_colors)})"
        )
    print(
        f"Android screen OK: {screenshot.name} · {width}x{height} · "
        f"edge ratio {edge_ratio:.4f} · colors {len(quantized_colors)}"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--generated", action="store_true")
    parser.add_argument("--res-root", type=Path, default=ANDROID_RES)
    parser.add_argument("--apk", type=Path)
    parser.add_argument("--abi", choices=("arm64-v8a", "x86_64"))
    parser.add_argument("--screenshot", type=Path)
    args = parser.parse_args()
    try:
        if args.generated:
            verify_generated(args.res_root)
        if args.apk:
            if not args.abi:
                parser.error("--apk requires --abi")
            verify_apk(args.apk, args.abi, args.res_root)
        if args.screenshot:
            verify_screenshot(args.screenshot)
        if not args.generated and not args.apk and not args.screenshot:
            parser.error("select --generated, --apk, or --screenshot")
    except (KeyError, json.JSONDecodeError, OSError, RuntimeError, ValueError, struct.error, zipfile.BadZipFile, zlib.error) as error:
        print(f"Android package ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
