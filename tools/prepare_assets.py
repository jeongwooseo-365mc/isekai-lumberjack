#!/usr/bin/env python3
"""Split original generated sheets and normalize runtime PNG assets."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def alpha_bbox(image: Image.Image):
    rgba = image.convert("RGBA")
    return rgba.getchannel("A").point(lambda p: 255 if p > 8 else 0).getbbox()


def normalize(image: Image.Image, size=256, occupancy=0.82, y_bias=0):
    rgba = image.convert("RGBA")
    bbox = alpha_bbox(rgba)
    if not bbox:
        return Image.new("RGBA", (size, size))
    obj = rgba.crop(bbox)
    target = max(1, round(size * occupancy))
    scale = min(target / obj.width, target / obj.height)
    dims = (max(1, round(obj.width * scale)), max(1, round(obj.height * scale)))
    obj = obj.resize(dims, Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (size, size))
    x = (size - obj.width) // 2
    y = max(0, min(size - obj.height, (size - obj.height) // 2 + y_bias))
    out.alpha_composite(obj, (x, y))
    return out


def remove_detached_bleed(image: Image.Image, threshold=8):
    """Keep the main connected artwork and recenter it without rescaling."""
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    width, height = rgba.size
    pixels = alpha.load()
    seen = set()
    components = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] <= threshold or (x, y) in seen:
                continue
            component = []
            stack = [(x, y)]
            seen.add((x, y))
            while stack:
                point = stack.pop()
                component.append(point)
                px, py = point
                for ny in range(max(0, py - 1), min(height, py + 2)):
                    for nx in range(max(0, px - 1), min(width, px + 2)):
                        if pixels[nx, ny] > threshold and (nx, ny) not in seen:
                            seen.add((nx, ny))
                            stack.append((nx, ny))
            components.append(component)
    if not components:
        return Image.new("RGBA", rgba.size)
    primary = max(components, key=len)
    cleaned = Image.new("RGBA", rgba.size)
    source_pixels = rgba.load()
    clean_pixels = cleaned.load()
    for x, y in primary:
        clean_pixels[x, y] = source_pixels[x, y]
    bbox = cleaned.getchannel("A").getbbox()
    obj = cleaned.crop(bbox)
    centered = Image.new("RGBA", rgba.size)
    centered.alpha_composite(obj, ((width - obj.width) // 2, (height - obj.height) // 2))
    return centered


def grid_cells(path, cols, rows, indices=None):
    sheet = Image.open(path).convert("RGBA")
    result = []
    indices = list(range(cols * rows)) if indices is None else indices
    for index in indices:
        row, col = divmod(index, cols)
        x0 = round(col * sheet.width / cols)
        x1 = round((col + 1) * sheet.width / cols)
        y0 = round(row * sheet.height / rows)
        y1 = round((row + 1) * sheet.height / rows)
        result.append(sheet.crop((x0, y0, x1, y1)))
    return result


def split_normalized(source, cols, rows, destinations, indices=None, size=256, occupancy=0.82):
    cells = grid_cells(source, cols, rows, indices)
    for cell, destination in zip(cells, destinations):
        target = ROOT / destination
        target.parent.mkdir(parents=True, exist_ok=True)
        normalize(cell, size=size, occupancy=occupancy).save(target, optimize=True)


def crop_normalized(source, boxes, destinations, size=256, occupancy=0.82):
    sheet = Image.open(source).convert("RGBA")
    for box, destination in zip(boxes, destinations):
        target = ROOT / destination
        target.parent.mkdir(parents=True, exist_ok=True)
        normalize(sheet.crop(box), size=size, occupancy=occupancy).save(target, optimize=True)


def normalize_existing(pattern, size, occupancy):
    for path in ROOT.glob(pattern):
        normalize(Image.open(path), size=size, occupancy=occupancy).save(path, optimize=True)


def frame_set(source, cols, rows, destinations, indices=None, canvas=512):
    cells = grid_cells(source, cols, rows, indices)
    cropped = []
    max_w = max_h = 1
    for cell in cells:
        cell.putalpha(cell.getchannel("A").point(lambda p: 0 if p < 40 else p))
        bbox = alpha_bbox(cell)
        obj = cell.crop(bbox) if bbox else Image.new("RGBA", (1, 1))
        cropped.append(obj)
        max_w = max(max_w, obj.width)
        max_h = max(max_h, obj.height)
    scale = min((canvas * 0.88) / max_w, (canvas * 0.88) / max_h)
    baseline = round(canvas * 0.94)
    for obj, destination in zip(cropped, destinations):
        dims = (max(1, round(obj.width * scale)), max(1, round(obj.height * scale)))
        obj = obj.resize(dims, Image.Resampling.LANCZOS)
        out = Image.new("RGBA", (canvas, canvas))
        x = (canvas - obj.width) // 2
        y = max(0, baseline - obj.height)
        out.alpha_composite(obj, (x, y))
        target = ROOT / destination
        target.parent.mkdir(parents=True, exist_ok=True)
        out.save(target, optimize=True)


def make_bobber():
    sheet = Image.open(ROOT / "assets/sprites/fishing.png").convert("RGBA")
    wait_cell = sheet.crop((1024, 0, 1536, 512))
    bobber = wait_cell.crop((345, 345, 512, 512))
    bobber.putalpha(bobber.getchannel("A").point(lambda p: 0 if p < 55 else p))
    normalize(bobber, size=128, occupancy=0.72).save(
        ROOT / "assets/sprites/fishing/bobber.png", optimize=True
    )


def main():
    gear_sources = {
        "axe": "assets/icons/axes.png",
        "pickaxe": "assets/icons/pickaxes.png",
        "rod": "assets/icons/rods.png",
        "sword": "assets/icons/swords.png",
    }
    for kind, source in gear_sources.items():
        split_normalized(
            ROOT / source, 3, 2,
            [f"assets/items/{kind}_{i}.png" for i in range(5)],
            indices=[0, 1, 2, 3, 4], occupancy=0.80,
        )

    for kind in ("wood", "ore", "gold"):
        split_normalized(
            ROOT / f"assets/icons/{kind}.png", 3, 1,
            [f"assets/resources/{kind}_{grade}.png" for grade in ("low", "mid", "high")],
            occupancy=0.78,
        )

    split_normalized(
        ROOT / "assets/icons/fish.png", 3, 2,
        [f"assets/resources/{name}.png" for name in ("seaweed", "shell", "croaker", "mullet", "salmon", "lobster")],
        occupancy=0.76,
    )
    crop_normalized(
        ROOT / "assets/icons/food.png",
        [(0, 20, 410, 625), (400, 120, 860, 620), (835, 150, 1254, 625),
         (35, 650, 635, 1215), (620, 620, 1254, 1225)],
        [f"assets/foods/{name}.png" for name in ("fish_soup", "seafood_stew", "grilled_fish", "salmon_steak", "lobster_course")],
        occupancy=0.76,
    )
    split_normalized(
        ROOT / "assets/icons/ui.png", 4, 3,
        [f"assets/ui/{name}.png" for name in (
            "map", "workshop", "profile", "auto", "settings", "enhance",
            "potion", "energy", "attack", "armor", "cooking", "realestate",
        )],
        occupancy=0.72,
    )

    for relative in (
        "assets/ui/enhance.png",
        "assets/ui/settings.png",
        "assets/resources/croaker.png",
        "assets/resources/shell.png",
    ):
        path = ROOT / relative
        remove_detached_bleed(Image.open(path)).save(path, optimize=True)

    normalize_existing("assets/items/armor_*.png", 256, 0.80)
    normalize_existing("assets/resources/stone_*.png", 256, 0.76)
    normalize_existing("assets/targets/*.png", 512, 0.88)
    normalize_existing("assets/ui/logo_mark.png", 512, 0.86)

    frame_set(
        ROOT / "assets/sprites/axe.png", 3, 1,
        [f"assets/sprites/axe/{name}.png" for name in ("idle", "windup", "hit")],
    )
    frame_set(
        ROOT / "assets/sprites/pickaxe.png", 3, 1,
        [f"assets/sprites/pickaxe/{name}.png" for name in ("idle", "windup", "hit")],
    )
    frame_set(
        ROOT / "assets/sprites/sword.png", 3, 1,
        [f"assets/sprites/sword/{name}.png" for name in ("idle", "windup", "hit")],
    )
    frame_set(
        ROOT / "assets/sprites/rest.png", 2, 1,
        [f"assets/sprites/rest/{name}.png" for name in ("idle", "rest")],
    )
    frame_set(
        ROOT / "assets/sprites/fishing.png", 3, 2,
        [f"assets/sprites/fishing/{name}.png" for name in ("idle", "cast", "wait", "hook", "lift", "reward")],
    )
    make_bobber()


if __name__ == "__main__":
    main()
