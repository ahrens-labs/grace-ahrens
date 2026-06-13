from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SERIF_FONT = "/usr/share/fonts/truetype/msttcorefonts/Georgia_Bold.ttf"
SANS_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

INK = (8, 15, 28)
NAVY_DEEP = (11, 21, 40)
SILVER_BRIGHT = (238, 242, 250)


def pick_render(size):
    if size <= 16:
        return 8, SANS_FONT, 0.48, 0.085
    if size <= 48:
        return 4, SANS_FONT, 0.52, 0.095
    return 1, SERIF_FONT, 0.56, 0.11


def measure_text(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1], bbox


def render_icon(size):
    scale, font_path, font_scale, stroke_scale = pick_render(size)
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font_size = max(8 * scale, round(canvas * font_scale))
    font = ImageFont.truetype(font_path, font_size)
    stroke = max(scale, round(canvas * stroke_scale))
    gap = max(scale, round(canvas * 0.05))

    letters = ["G", "A"]
    widths = []
    height = 0
    bboxes = []
    for letter in letters:
        width, letter_height, bbox = measure_text(draw, letter, font)
        widths.append(width)
        height = max(height, letter_height)
        bboxes.append(bbox)

    total_width = sum(widths) + gap
    start_x = (canvas - total_width) // 2
    y = (canvas - height) // 2

    pad_x = round(canvas * 0.12)
    pad_y = round(canvas * 0.16)
    draw.rounded_rectangle(
        [
            start_x - pad_x,
            y - pad_y,
            start_x + total_width + pad_x,
            y + height + pad_y,
        ],
        radius=round(canvas * 0.18),
        fill=NAVY_DEEP + (235,),
    )

    x = start_x
    for index, letter in enumerate(letters):
        bbox = bboxes[index]
        draw.text(
            (x - bbox[0], y - bbox[1]),
            letter,
            font=font,
            fill=SILVER_BRIGHT + (255,),
            stroke_width=stroke,
            stroke_fill=INK + (255,),
        )
        x += widths[index] + gap

    if scale > 1:
        img = img.resize((size, size), Image.Resampling.LANCZOS)

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
