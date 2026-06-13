from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SERIF_FONT = "/usr/share/fonts/truetype/msttcorefonts/Georgia_Bold.ttf"

INK = (8, 15, 28)
NAVY_GLOW = (45, 80, 136)
MOON = (184, 201, 228)
SILVER = (210, 218, 232)
SILVER_BRIGHT = (238, 242, 250)


def pick_render(size):
    if size <= 16:
        return 8, 0.56, 0.065
    if size <= 48:
        return 4, 0.58, 0.075
    return 1, 0.6, 0.085


def measure_text(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1], bbox


def draw_site_star(draw, cx, cy, radius, fill):
    points = []
    for nx, ny in (
        (0.5, 0.0),
        (0.62, 0.38),
        (1.0, 0.5),
        (0.62, 0.62),
        (0.5, 1.0),
        (0.38, 0.62),
        (0.0, 0.5),
        (0.38, 0.38),
    ):
        points.append((cx + (nx - 0.5) * 2 * radius, cy + (ny - 0.5) * 2 * radius * 1.35))
    draw.polygon(points, fill=fill)


def draw_radial_glow(img, center, radius):
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx, cy = center
    for step in range(5, 0, -1):
        alpha = int(14 + step * 11)
        rx = radius * (0.4 + step * 0.1)
        ry = radius * (0.32 + step * 0.08)
        glow_draw.ellipse(
            [cx - rx, cy - ry, cx + rx, cy + ry],
            fill=NAVY_GLOW + (alpha,),
        )
    return Image.alpha_composite(img, glow)


def draw_tight_monogram(layer, origin_x, origin_y, font, stroke):
    draw = ImageDraw.Draw(layer)
    letters = ("G", "A")
    widths = []
    height = 0
    bboxes = []
    for letter in letters:
        width, letter_height, bbox = measure_text(draw, letter, font)
        widths.append(width)
        height = max(height, letter_height)
        bboxes.append(bbox)

    overlap = round(widths[0] * 0.22)
    x = origin_x
    y = origin_y
    offset = max(1, round(stroke * 0.7))
    positions = []
    for index, letter in enumerate(letters):
        bbox = bboxes[index]
        positions.append((x - bbox[0], y - bbox[1], letter))
        if index == 0:
            x += widths[index] - overlap

    for px, py, letter in positions:
        draw.text(
            (px + offset, py + offset),
            letter,
            font=font,
            fill=(0, 0, 0, 0),
            stroke_width=max(1, stroke),
            stroke_fill=MOON + (130,),
        )

    for px, py, letter in positions:
        draw.text(
            (px, py),
            letter,
            font=font,
            fill=SILVER_BRIGHT + (255,),
            stroke_width=max(1, stroke - 1),
            stroke_fill=INK + (255,),
        )

    total_width = widths[0] + widths[1] - overlap
    return total_width, height, origin_x, origin_y


def render_icon(size):
    scale, font_scale, stroke_scale = pick_render(size)
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))

    font_size = max(8 * scale, round(canvas * font_scale))
    font = ImageFont.truetype(SERIF_FONT, font_size)
    stroke = max(1, round(canvas * stroke_scale))

    probe = ImageDraw.Draw(img)
    g_width, height, _ = measure_text(probe, "G", font)
    a_width, _, _ = measure_text(probe, "A", font)
    overlap = round(g_width * 0.22)
    total_width = g_width + a_width - overlap
    origin_x = (canvas - total_width) // 2
    origin_y = (canvas - height) // 2
    center_x = origin_x + total_width / 2
    center_y = origin_y + height / 2

    img = draw_radial_glow(img, (center_x, center_y), canvas * 0.34)

    text_layer = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    total_width, height, origin_x, origin_y = draw_tight_monogram(
        text_layer,
        origin_x,
        origin_y,
        font,
        stroke,
    )
    center_x = origin_x + total_width / 2
    center_y = origin_y + height / 2
    img = Image.alpha_composite(img, text_layer)

    star_radius = max(1, round(canvas * (0.055 if size <= 32 else 0.07)))
    star_layer = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    star_draw = ImageDraw.Draw(star_layer)
    draw_site_star(
        star_draw,
        origin_x - star_radius * 0.95,
        center_y,
        star_radius,
        SILVER_BRIGHT + (240,),
    )
    draw_site_star(
        star_draw,
        origin_x + total_width + star_radius * 0.95,
        center_y,
        star_radius,
        MOON + (225,),
    )
    img = Image.alpha_composite(img, star_layer)

    if size >= 48:
        accent = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        accent_draw = ImageDraw.Draw(accent)
        sparkle = max(1, round(canvas * 0.012))
        accent_draw.ellipse(
            [
                center_x - sparkle,
                origin_y - sparkle * 2.8,
                center_x + sparkle,
                origin_y - sparkle * 0.8,
            ],
            fill=SILVER_BRIGHT + (180,),
        )
        img = Image.alpha_composite(img, accent)

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
