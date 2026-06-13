from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images" / "ga-monogram-source.png"
TRANSPARENCY_THRESHOLD = 150
CHROMA_THRESHOLD = 20


def load_monogram():
    img = Image.open(SOURCE).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            luminance = (red + green + blue) / 3
            chroma = max(red, green, blue) - min(red, green, blue)
            if luminance >= TRANSPARENCY_THRESHOLD and chroma <= CHROMA_THRESHOLD:
                pixels[x, y] = (0, 0, 0, 0)

    bbox = img.getbbox()
    if not bbox:
        raise RuntimeError("Could not extract monogram from source image.")

    return img.crop(bbox)


def render_icon(monogram, size):
    pad_ratio = 0.04 if size <= 16 else 0.06 if size <= 32 else 0.08
    work_size = size * 4 if size <= 32 else size
    pad = max(1, round(work_size * pad_ratio))
    canvas = work_size - pad * 2
    fitted = monogram.copy()
    fitted.thumbnail((canvas, canvas), Image.Resampling.LANCZOS)

    icon = Image.new("RGBA", (work_size, work_size), (0, 0, 0, 0))
    offset_x = (work_size - fitted.width) // 2
    offset_y = (work_size - fitted.height) // 2
    icon.paste(fitted, (offset_x, offset_y), fitted)

    if work_size != size:
        icon = icon.resize((size, size), Image.Resampling.LANCZOS)

    if size <= 32:
        icon = ImageEnhance.Contrast(icon).enhance(1.12)
        icon = ImageEnhance.Sharpness(icon).enhance(1.6)

    return icon


def main():
    monogram = load_monogram()

    outputs = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }

    for name, size in outputs.items():
        render_icon(monogram, size).save(ROOT / name, format="PNG", optimize=True)
        print(f"wrote {name}")

    ico_sizes = [16, 32, 48]
    ico_images = [render_icon(monogram, size) for size in ico_sizes]
    ico_images[0].save(
        ROOT / "favicon.ico",
        format="ICO",
        sizes=[(size, size) for size in ico_sizes],
        append_images=ico_images[1:],
    )
    print("wrote favicon.ico")


if __name__ == "__main__":
    main()
