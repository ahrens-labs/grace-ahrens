from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/usr/share/fonts/truetype/msttcorefonts/Georgia_Bold.ttf"

INK = (8, 15, 28)
NAVY_DEEP = (11, 21, 40)
NAVY = (19, 35, 63)
NAVY_GLOW = (45, 80, 136)
SILVER = (210, 218, 232)
SILVER_BRIGHT = (238, 242, 250)
MOON = (184, 201, 228)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def radial_background(size):
    img = Image.new("RGBA", (size, size), INK + (255,))
    px = img.load()
    cx = cy = (size - 1) / 2
    max_dist = (cx**2 + cy**2) ** 0.5
    for y in range(size):
        for x in range(size):
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / max_dist
            inner = lerp(NAVY_GLOW, NAVY_DEEP, min(1.0, dist * 1.15))
            edge = lerp(inner, INK, max(0.0, (dist - 0.55) / 0.45))
            px[x, y] = edge + (255,)
    return img


def render_icon(size):
    img = radial_background(size)
    draw = ImageDraw.Draw(img)

    inset = max(1, round(size * 0.06))
    radius = max(2, round(size * 0.18))
    box = [inset, inset, size - inset - 1, size - inset - 1]

    draw.rounded_rectangle(box, radius=radius, fill=NAVY + (245,))
    border = max(1, round(size * 0.035))
    draw.rounded_rectangle(box, radius=radius, outline=SILVER + (210,), width=border)

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.rounded_rectangle(
        [box[0] - border, box[1] - border, box[2] + border, box[3] + border],
        radius=radius + border,
        outline=MOON + (70,),
        width=max(1, round(size * 0.05)),
    )
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    font_size = max(7, round(size * 0.46))
    font = ImageFont.truetype(FONT, font_size)
    text = "GA"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1] - max(0, round(size * 0.02))

    shadow = max(1, round(size * 0.03))
    draw.text((x, y + shadow), text, font=font, fill=NAVY_GLOW + (180,))
    draw.text((x, y), text, font=font, fill=SILVER_BRIGHT + (255,))

    return img.convert("RGBA")


def main():
    outputs = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }

    icons = {}
    for name, size in outputs.items():
        icon = render_icon(size)
        icon.save(ROOT / name, format="PNG", optimize=True)
        icons[size] = icon
        print(f"wrote {name}")

    ico_sizes = [16, 32, 48]
    ico_images = [render_icon(size) for size in ico_sizes]
    ico_images[0].save(
        ROOT / "favicon.ico",
        format="ICO",
        sizes=[(size, size) for size in ico_sizes],
        append_images=ico_images[1:],
    )
    print("wrote favicon.ico")


if __name__ == "__main__":
    main()
