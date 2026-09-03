#!/usr/bin/env python3
"""Remove disconnected neighboring-sheet fragments from the five axe icons."""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def component(alpha: Image.Image, threshold: int) -> set[tuple[int, int]]:
    pixels = alpha.load()
    width, height = alpha.size
    seen: set[tuple[int, int]] = set()
    groups: list[set[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] <= threshold or (x, y) in seen:
                continue
            group = {(x, y)}
            seen.add((x, y))
            queue = deque([(x, y)])
            while queue:
                px, py = queue.popleft()
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] > threshold and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        group.add((nx, ny))
                        queue.append((nx, ny))
            groups.append(group)
    return max(groups, key=len)


def clean(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    core = component(alpha, 10)
    pixels = alpha.load()
    width, height = image.size
    keep = set(core)
    queue = deque(core)
    while queue:
        px, py = queue.popleft()
        for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
            if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] > 0 and (nx, ny) not in keep:
                keep.add((nx, ny))
                queue.append((nx, ny))
    output = image.copy()
    out = output.load()
    for y in range(height):
        for x in range(width):
            if (x, y) not in keep:
                out[x, y] = (0, 0, 0, 0)
    output.save(path, optimize=True)


if __name__ == "__main__":
    for tier in range(5):
        clean(ROOT / "assets" / "items" / f"axe_{tier}.png")
    print("Cleaned five axe icons")
