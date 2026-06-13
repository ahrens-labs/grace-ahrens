from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/usr/share/fonts/truetype/msttcorefonts/Georgia_Bold.ttf"

NAVY_GLOW = (45, 80, 136)
SILVER = (210, 218, 232)
SILVER_BRIGHT = (238, 242, 250)


def render_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font_size = max(8, round(size * 0.58))
    font = ImageFont.truetype(FONT, font_size)
    text = "GA"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]

    shadow = max(1, round(size * 0.04))
    draw.text((x, y + shadow), text, font=font, fill=NAVY_GLOW + (120,))
    draw.text((x, y), text, font=font, fill=SILVER + (255,))

    highlight = ImageFont.truetype(FONT, max(8, font_size - 1))
    draw.text((x, y - max(0, round(size * 0.01))), text, font=highlight, fill=SILVER_BRIGHT + (70,))

    return img


def main():
    outputs = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }

    for name, size in outputs.items():
        render_icon(size).save(ROOT / name, format="PNG", optimize=True)
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
