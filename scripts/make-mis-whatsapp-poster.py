#!/usr/bin/env python3
"""Generate WhatsApp poster with large Agile Group logo."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "public" / "agile-group-logo.png"
OUT = ROOT / "public" / "agile-mis-manual-whatsapp.png"

W, H = 1080, 1920
BG_TOP = (11, 18, 32)
BG_MID = (20, 34, 79)
GOLD = (201, 168, 76)
GOLD_LIGHT = (253, 230, 138)
WHITE = (255, 255, 255)
TEXT = (226, 232, 240)
GREEN_BG = (20, 60, 40)
GREEN_BORDER = (34, 197, 94)
GREEN_TEXT = (187, 247, 208)


def gradient_bg():
    img = Image.new("RGB", (W, H), BG_TOP)
    px = img.load()
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] + (BG_MID[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_MID[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_MID[2] - BG_TOP[2]) * t)
        for x in range(W):
            px[x, y] = (r, g, b)
    return img


def load_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def wrap(draw, text, font, max_w):
    words = text.split()
    lines, cur = [], []
    for w in words:
        test = " ".join(cur + [w])
        if draw.textlength(test, font=font) <= max_w:
            cur.append(w)
        else:
            if cur:
                lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    return lines


def main():
    img = gradient_bg()
    draw = ImageDraw.Draw(img)

    # Gold bar
    draw.rounded_rectangle((48, 48, W - 48, 56), radius=4, fill=GOLD)

    # Logo — large (83% of poster width)
    logo = Image.open(LOGO).convert("RGBA")
    logo_w = 940
    ratio = logo_w / logo.width
    logo_h = int(logo.height * ratio)
    logo = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    logo_x = (W - logo_w) // 2
    logo_y = 88
    img.paste(logo, (logo_x, logo_y), logo)

    y = logo_y + logo_h + 36

    title_font = load_font(56, bold=True)
    sub_font = load_font(34, bold=True)
    bullet_font = load_font(30, bold=True)
    link_lbl = load_font(24, bold=True)
    link_url = load_font(34, bold=True)
    toll_font = load_font(42, bold=True)
    quote_font = load_font(24)
    foot_font = load_font(28, bold=True)

    lines = ["AGILE MIS", "USER MANUAL"]
    for line in lines:
        tw = draw.textlength(line, font=title_font)
        draw.text(((W - tw) / 2, y), line, fill=GOLD_LIGHT, font=title_font)
        y += 62
    y += 8

    sub = "Team Agile — Please Read Today"
    tw = draw.textlength(sub, font=sub_font)
    draw.text(((W - tw) / 2, y), sub, fill=TEXT, font=sub_font)
    y += 56

    bullets = [
        "🕑  Branch HODs — daily report by 2:00 PM",
        "📝  Register every complaint — no exceptions",
        "📊  Dashboard, visits & compliance guide inside",
    ]
    for b in bullets:
        draw.rounded_rectangle((48, y, W - 48, y + 88), radius=20, outline=GOLD, width=2, fill=(30, 45, 80))
        draw.text((78, y + 24), b, fill=WHITE, font=bullet_font)
        y += 106

    y += 12
    draw.rounded_rectangle((48, y, W - 48, y + 150), radius=24, fill=WHITE)
    draw.text((78, y + 28), "OPEN USER MANUAL", fill=(100, 116, 139), font=link_lbl)
    url = "www.agilegroup-digital.co.in/mis-manual"
    draw.text((78, y + 72), url, fill=(29, 78, 216), font=link_url)
    y += 174

    draw.rounded_rectangle((48, y, W - 48, y + 120), radius=20, outline=GREEN_BORDER, width=2, fill=GREEN_BG)
    draw.text((78, y + 22), "📝 Complaint link:", fill=GREEN_TEXT, font=bullet_font)
    draw.text((78, y + 62), "www.agilegroup-digital.co.in/register-complaint", fill=GREEN_TEXT, font=load_font(26, bold=True))
    y += 148

    toll = "Toll Free: 1800 599 5599"
    tw = draw.textlength(toll, font=toll_font)
    draw.text(((W - tw) / 2, y), toll, fill=GOLD_LIGHT, font=toll_font)
    y += 72

    quote = '"Private security guards are the first line of defence"'
    for line in wrap(draw, quote, quote_font, W - 120):
        tw = draw.textlength(line, font=quote_font)
        draw.text(((W - tw) / 2, y), line, fill=TEXT, font=quote_font)
        y += 34

    foot = "Agile Security Force Pvt. Ltd."
    tw = draw.textlength(foot, font=foot_font)
    draw.text(((W - tw) / 2, H - 110), foot, fill=GOLD, font=foot_font)

    img.save(OUT, "PNG", optimize=True)
    print(f"Saved {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
