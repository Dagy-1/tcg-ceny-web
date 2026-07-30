from __future__ import annotations

import hashlib
import io
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw


SCRIPT_DIR = Path(__file__).resolve().parent
WEBSITE_DIR = SCRIPT_DIR.parent
PROJECT_DIR = WEBSITE_DIR.parent
PRODUCTS_FILE = PROJECT_DIR / "products.json"
CACHE_FILE = PROJECT_DIR / "cache.json"
OUTPUT_DIR = WEBSITE_DIR / "public" / "catalog-products"
MAX_SIDE = 700
REFINE_EXISTING = "--refine-existing" in sys.argv


def image_filename(product_id: object) -> str:
    digest = hashlib.sha1(str(product_id).encode("utf-8")).hexdigest()[:16]
    return f"{digest}.png"


def download(url: str) -> bytes:
    request = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/126 Safari/537.36"
            )
        },
    )
    with urlopen(request, timeout=25) as response:
        return response.read()


def background_seeds(image: Image.Image) -> list[tuple[int, int]]:
    width, height = image.size
    bounds = image.getchannel("A").getbbox() or (0, 0, width, height)
    left, top, right, bottom = bounds
    candidates = {
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
    }
    for inset in (0, 1, 2, 4, 8, 12):
        x1, x2 = min(right - 1, left + inset), max(left, right - 1 - inset)
        y1, y2 = min(bottom - 1, top + inset), max(top, bottom - 1 - inset)
        middle_x, middle_y = (left + right - 1) // 2, (top + bottom - 1) // 2
        candidates.update(
            {
                (x1, y1),
                (x2, y1),
                (x1, y2),
                (x2, y2),
                (middle_x, y1),
                (middle_x, y2),
                (x1, middle_y),
                (x2, middle_y),
            }
        )
    seeds = []
    for x, y in candidates:
        red, green, blue, alpha = image.getpixel((x, y))
        if alpha > 0 and min(red, green, blue) >= 165 and max(red, green, blue) - min(red, green, blue) <= 38:
            seeds.append((x, y))
    return seeds


def remove_connected_light_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    seeds = background_seeds(image)
    if not seeds:
        return image

    transparent = (255, 255, 255, 0)
    for seed in seeds:
        ImageDraw.floodfill(image, seed, transparent, thresh=72)
    return image


def remove_rectangular_frame(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    bounds = image.getchannel("A").getbbox()
    if not bounds:
        return image

    left, top, right, bottom = bounds
    if right - left < 40 or bottom - top < 40:
        return image

    sides = [
        [(x, top) for x in range(left, right)],
        [(x, bottom - 1) for x in range(left, right)],
        [(left, y) for y in range(top, bottom)],
        [(right - 1, y) for y in range(top, bottom)],
    ]

    def is_light_edge(pixel: tuple[int, int, int, int]) -> bool:
        red, green, blue, alpha = pixel
        return alpha > 0 and min(red, green, blue) >= 180 and max(red, green, blue) - min(red, green, blue) <= 42

    if all(sum(is_light_edge(image.getpixel(point)) for point in side) / len(side) >= 0.7 for side in sides):
        for offset in range(4):
            ImageDraw.Draw(image).line((left + offset, top, left + offset, bottom - 1), fill=(0, 0, 0, 0))
            ImageDraw.Draw(image).line((right - 1 - offset, top, right - 1 - offset, bottom - 1), fill=(0, 0, 0, 0))
            ImageDraw.Draw(image).line((left, top + offset, right - 1, top + offset), fill=(0, 0, 0, 0))
            ImageDraw.Draw(image).line((left, bottom - 1 - offset, right - 1, bottom - 1 - offset), fill=(0, 0, 0, 0))
    return image


def trim_and_resize(image: Image.Image) -> Image.Image:
    image = remove_rectangular_frame(image)
    alpha = image.getchannel("A").point(lambda value: 0 if value <= 10 else value)
    image.putalpha(alpha)
    bounds = alpha.getbbox()
    if bounds:
        image = image.crop(bounds)

    width, height = image.size
    padding = max(8, round(max(width, height) * 0.035))
    canvas = Image.new("RGBA", (width + padding * 2, height + padding * 2), (0, 0, 0, 0))
    canvas.alpha_composite(image, (padding, padding))
    canvas.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
    return canvas


def prepare_product(product: dict, cache_products: dict) -> tuple[str, str]:
    output = OUTPUT_DIR / image_filename(product.get("id"))
    if output.exists() and output.stat().st_size > 500:
        if REFINE_EXISTING:
            with Image.open(output) as source:
                prepared = trim_and_resize(remove_connected_light_background(source))
                prepared.save(output, "PNG", optimize=True)
            return "refined", product.get("name", "")
        return "cached", product.get("name", "")

    market = cache_products.get(product.get("name", ""), {})
    url = str(product.get("image") or market.get("image") or "")
    if not url:
        return "missing", product.get("name", "")

    try:
        raw = download(url)
        with Image.open(io.BytesIO(raw)) as source:
            prepared = trim_and_resize(remove_connected_light_background(source))
            prepared.save(output, "PNG", optimize=True)
        return "created", product.get("name", "")
    except Exception as exc:
        return f"failed: {exc}", product.get("name", "")


def main() -> int:
    products = json.loads(PRODUCTS_FILE.read_text(encoding="utf-8-sig"))
    cache = json.loads(CACHE_FILE.read_text(encoding="utf-8-sig"))
    cache_products = cache.get("products", {})
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    results: dict[str, int] = {}
    failures: list[tuple[str, str]] = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        jobs = [executor.submit(prepare_product, product, cache_products) for product in products]
        for job in as_completed(jobs):
            status, name = job.result()
            results[status] = results.get(status, 0) + 1
            if status.startswith("failed"):
                failures.append((name, status))

    print("Catalog image preparation:", ", ".join(f"{key}={value}" for key, value in sorted(results.items())))
    for name, error in failures[:12]:
        print(f"  {name}: {error}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
