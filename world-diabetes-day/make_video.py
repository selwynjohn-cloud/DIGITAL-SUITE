#!/usr/bin/env python3
"""World Diabetes Day — Elder Guidelines YouTube video builder."""

from __future__ import annotations

import math
import subprocess
from pathlib import Path

from gtts import gTTS
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/tmp/diabetes-yt")
SLIDES = ROOT / "slides"
AUDIO = ROOT / "audio"
OUT = ROOT / "out"
for p in (SLIDES, AUDIO, OUT):
    p.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
FONT_DISPLAY = "/usr/share/fonts/truetype/noto/NotoSerif-Bold.ttf"
FONT_BODY = "/usr/share/fonts/truetype/macos/SourceSans3-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"

# Calm clinical palette — deep teal + soft mist (not purple / cream-terracotta)
BG_TOP = (14, 74, 78)
BG_BOT = (232, 244, 242)
ACCENT = (20, 140, 130)
ACCENT_DARK = (10, 56, 58)
CARD = (255, 255, 255)
TEXT = (18, 40, 42)
MUTED = (70, 95, 98)
WARN = (180, 72, 48)
OK = (34, 120, 90)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def gradient_bg() -> Image.Image:
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        # Soft vertical wash + gentle left vignette feel via math
        r = int(BG_TOP[0] * (1 - t) + BG_BOT[0] * t)
        g = int(BG_TOP[1] * (1 - t) + BG_BOT[1] * t)
        b = int(BG_TOP[2] * (1 - t) + BG_BOT[2] * t)
        for x in range(W):
            # subtle radial light on upper-right
            dx = (x - W * 0.72) / W
            dy = (y - H * 0.18) / H
            glow = max(0.0, 1.0 - math.sqrt(dx * dx + dy * dy) * 1.6)
            rr = min(255, int(r + 28 * glow))
            gg = min(255, int(g + 22 * glow))
            bb = min(255, int(b + 18 * glow))
            px[x, y] = (rr, gg, bb)
    return img


def draw_rounded(draw: ImageDraw.ImageDraw, box, fill, radius=28):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def wrap_text(text: str, fnt: ImageFont.FreeTypeFont, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=fnt) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def header_bar(draw: ImageDraw.ImageDraw, label: str):
    draw.rectangle((0, 0, W, 12), fill=ACCENT)
    f = font(FONT_BOLD, 28)
    draw.text((72, 36), label.upper(), fill=(230, 245, 243), font=f)


def footer(draw: ImageDraw.ImageDraw, page: str):
    f = font(FONT_BODY, 24)
    draw.text((72, H - 56), "World Diabetes Day · Guidelines for Elders", fill=(210, 232, 230), font=f)
    draw.text((W - 160, H - 56), page, fill=(210, 232, 230), font=f)


def draw_circle_icon(draw, cx, cy, r, fill, symbol: str):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)
    f = font(FONT_BOLD, 42)
    bbox = draw.textbbox((0, 0), symbol, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw / 2, cy - th / 2 - 4), symbol, fill=(255, 255, 255), font=f)


SLIDES_SPEC = [
    {
        "id": "01_title",
        "kind": "title",
        "kicker": "14 November · World Diabetes Day",
        "title": "Diabetes Care\nfor Elders",
        "sub": "Simple daily guidelines to stay steady, safe, and strong.",
        "voice": (
            "World Diabetes Day. Diabetes care for elders. "
            "Simple daily guidelines to stay steady, safe, and strong."
        ),
        "hold_extra": 0.8,
    },
    {
        "id": "02_why",
        "kind": "bullets",
        "kicker": "Why this matters",
        "title": "Age changes how diabetes behaves",
        "bullets": [
            "Sugar swings can come faster in older age",
            "Meals, medicines, and walks must stay regular",
            "Small daily habits prevent big emergencies",
            "Family support makes the plan easier to follow",
        ],
        "voice": (
            "Why this matters. Age changes how diabetes behaves. "
            "Sugar swings can come faster. Meals, medicines, and walks must stay regular. "
            "Small daily habits prevent big emergencies. Family support makes the plan easier."
        ),
    },
    {
        "id": "03_numbers",
        "kind": "bullets",
        "kicker": "Guideline 1",
        "title": "Know your numbers",
        "bullets": [
            "Write fasting and after-meal sugar readings",
            "Ask your doctor for your target range",
            "Keep a notebook or phone log every week",
            "Carry your last reading to every clinic visit",
        ],
        "voice": (
            "Guideline one. Know your numbers. Write fasting and after-meal sugar readings. "
            "Ask your doctor for your target range. Keep a weekly log. "
            "Carry your last reading to every clinic visit."
        ),
    },
    {
        "id": "04_eat",
        "kind": "plate",
        "kicker": "Guideline 2",
        "title": "Eat the elder plate way",
        "voice": (
            "Guideline two. Eat the elder plate way. Fill half the plate with vegetables. "
            "One quarter with protein like dal, fish, eggs, or paneer. "
            "One quarter with rice, roti, or millets. Eat on time. Do not skip meals."
        ),
    },
    {
        "id": "05_medicine",
        "kind": "bullets",
        "kicker": "Guideline 3",
        "title": "Take medicines on time",
        "bullets": [
            "Same time every day — set a phone alarm",
            "Never skip a dose or take a double dose",
            "Keep a written list of all medicines",
            "If you vomit or feel unwell, call your doctor",
        ],
        "voice": (
            "Guideline three. Take medicines on time. Same time every day — set a phone alarm. "
            "Never skip a dose or take a double dose. Keep a written list of all medicines. "
            "If you vomit or feel unwell, call your doctor."
        ),
    },
    {
        "id": "06_move",
        "kind": "bullets",
        "kicker": "Guideline 4",
        "title": "Move a little, every day",
        "bullets": [
            "Walk 20 to 30 minutes after a meal",
            "Use chair exercises if walking is hard",
            "Stand and stretch every hour while sitting",
            "Stop if you feel chest pain or severe dizziness",
        ],
        "voice": (
            "Guideline four. Move a little, every day. Walk twenty to thirty minutes after a meal. "
            "Use chair exercises if walking is hard. Stand and stretch every hour. "
            "Stop if you feel chest pain or severe dizziness."
        ),
    },
    {
        "id": "07_feet",
        "kind": "bullets",
        "kicker": "Guideline 5",
        "title": "Protect your feet",
        "bullets": [
            "Check both feet every night for cuts or swelling",
            "Wash, dry well between toes, moisturize lightly",
            "Wear soft, closed shoes — never walk barefoot",
            "See a doctor early for any blister, wound, or numbness",
        ],
        "voice": (
            "Guideline five. Protect your feet. Check both feet every night. "
            "Wash and dry well between the toes. Wear soft closed shoes. Never walk barefoot. "
            "See a doctor early for any blister, wound, or numbness."
        ),
    },
    {
        "id": "08_warning",
        "kind": "warning",
        "kicker": "Act fast",
        "title": "Warning signs — get help now",
        "left": ["Very high sugar", "Extreme thirst", "Blurred vision", "Fruity breath / deep breathing"],
        "right": ["Very low sugar", "Sweating / shaking", "Confusion", "Sudden weakness or fainting"],
        "voice": (
            "Act fast. Warning signs need help now. "
            "For very high sugar: extreme thirst, blurred vision, or unusual breathing. "
            "For very low sugar: sweating, shaking, confusion, or sudden weakness. "
            "Do not wait. Call your family or doctor immediately."
        ),
    },
    {
        "id": "09_family",
        "kind": "bullets",
        "kicker": "Guideline 6",
        "title": "Family and caregivers",
        "bullets": [
            "One person tracks sugar, meals, and medicines",
            "Keep emergency numbers on the fridge and phone",
            "Know where glucose tablets or sweets are kept",
            "Attend clinic visits together when possible",
        ],
        "voice": (
            "Guideline six. Family and caregivers. One person tracks sugar, meals, and medicines. "
            "Keep emergency numbers on the fridge and phone. "
            "Know where glucose tablets or sweets are kept. Attend clinic visits together when possible."
        ),
    },
    {
        "id": "10_golden",
        "kind": "golden",
        "kicker": "Remember these five",
        "title": "5 Golden Rules",
        "rules": [
            "Take medicines on time",
            "Eat on time — never skip meals",
            "Walk a little every day",
            "Check your feet every night",
            "Know high and low sugar signs",
        ],
        "voice": (
            "Remember these five golden rules. "
            "One: take medicines on time. "
            "Two: eat on time, never skip meals. "
            "Three: walk a little every day. "
            "Four: check your feet every night. "
            "Five: know high and low sugar signs."
        ),
    },
    {
        "id": "11_close",
        "kind": "close",
        "kicker": "World Diabetes Day",
        "title": "Steady habits.\nSafer years.",
        "sub": "Share this with parents and grandparents. Talk to your doctor before changing medicines or diet.",
        "voice": (
            "Steady habits. Safer years. "
            "Share this with parents and grandparents. "
            "Talk to your doctor before changing medicines or diet. "
            "Thank you for watching. Take care."
        ),
        "hold_extra": 1.2,
    },
]


def render_title(spec: dict) -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)
    header_bar(draw, spec["kicker"])
    # brand-first panel
    draw_rounded(draw, (120, 180, W - 120, H - 160), CARD, 36)
    # accent stripe
    draw.rectangle((120, 180, 148, H - 160), fill=ACCENT)
    f_title = font(FONT_DISPLAY, 92)
    y = 260
    for line in spec["title"].split("\n"):
        draw.text((220, y), line, fill=ACCENT_DARK, font=f_title)
        y += 110
    f_sub = font(FONT_BODY, 40)
    for line in wrap_text(spec["sub"], f_sub, 1400, draw):
        draw.text((220, y + 30), line, fill=MUTED, font=f_sub)
        y += 56
    # decorative circle motif (not emoji clutter)
    draw.ellipse((1500, 240, 1720, 460), outline=ACCENT, width=8)
    draw.ellipse((1540, 280, 1680, 420), fill=ACCENT)
    f_big = font(FONT_BOLD, 64)
    draw.text((1578, 318), "14", fill=(255, 255, 255), font=f_big)
    footer(draw, "01")
    return img


def render_bullets(spec: dict, page: str) -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)
    header_bar(draw, spec["kicker"])
    draw_rounded(draw, (100, 120, W - 100, H - 100), CARD, 36)
    draw.rectangle((100, 120, 128, H - 100), fill=ACCENT)
    f_title = font(FONT_DISPLAY, 64)
    draw.text((200, 170), spec["title"], fill=ACCENT_DARK, font=f_title)
    f_b = font(FONT_BODY, 40)
    y = 290
    for i, b in enumerate(spec["bullets"], 1):
        draw.ellipse((210, y + 10, 250, y + 50), fill=ACCENT)
        nf = font(FONT_BOLD, 24)
        draw.text((222, y + 14), str(i), fill=(255, 255, 255), font=nf)
        for line in wrap_text(b, f_b, 1450, draw):
            draw.text((280, y), line, fill=TEXT, font=f_b)
            y += 52
        y += 28
    footer(draw, page)
    return img


def render_plate(spec: dict, page: str) -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)
    header_bar(draw, spec["kicker"])
    draw_rounded(draw, (100, 120, W - 100, H - 100), CARD, 36)
    draw.rectangle((100, 120, 128, H - 100), fill=ACCENT)
    f_title = font(FONT_DISPLAY, 64)
    draw.text((200, 170), spec["title"], fill=ACCENT_DARK, font=f_title)

    # Plate visual (left)
    cx, cy, r = 520, 560, 260
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(245, 250, 249), outline=ACCENT_DARK, width=6)
    # half veg
    draw.pieslice((cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8), 90, 270, fill=(70, 140, 95))
    # quarter protein
    draw.pieslice((cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8), 270, 360, fill=(70, 120, 150))
    # quarter carbs
    draw.pieslice((cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8), 0, 90, fill=(200, 160, 80))
    draw.line((cx, cy - r + 8, cx, cy + r - 8), fill=(255, 255, 255), width=6)
    draw.line((cx, cy, cx + r - 8, cy), fill=(255, 255, 255), width=6)

    # Legend (right)
    items = [
        ((70, 140, 95), "½ Vegetables", "Leafy greens, salad, cooked veg"),
        ((70, 120, 150), "¼ Protein", "Dal, fish, eggs, paneer, chicken"),
        ((200, 160, 80), "¼ Carbs", "Rice, roti, millets — smaller helpings"),
    ]
    f_h = font(FONT_BOLD, 36)
    f_s = font(FONT_BODY, 30)
    y = 320
    for color, title, sub in items:
        draw.rounded_rectangle((920, y, 1720, y + 120), radius=20, fill=(241, 248, 246))
        draw.ellipse((950, y + 35, 1000, y + 85), fill=color)
        draw.text((1030, y + 22), title, fill=ACCENT_DARK, font=f_h)
        draw.text((1030, y + 68), sub, fill=MUTED, font=f_s)
        y += 145
    tip = font(FONT_BODY, 32)
    draw.text((200, 860), "Eat on time. Prefer water. Limit sweets and deep-fried snacks.", fill=MUTED, font=tip)
    footer(draw, page)
    return img


def render_warning(spec: dict, page: str) -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)
    header_bar(draw, spec["kicker"])
    draw_rounded(draw, (100, 120, W - 100, H - 100), CARD, 36)
    f_title = font(FONT_DISPLAY, 58)
    draw.text((180, 160), spec["title"], fill=WARN, font=f_title)

    # two columns
    draw.rounded_rectangle((160, 280, 920, 880), radius=24, fill=(255, 242, 236))
    draw.rounded_rectangle((1000, 280, 1760, 880), radius=24, fill=(236, 248, 244))
    f_h = font(FONT_BOLD, 36)
    draw.text((220, 310), "Too HIGH", fill=WARN, font=f_h)
    draw.text((1060, 310), "Too LOW", fill=OK, font=f_h)
    f_b = font(FONT_BODY, 34)
    y = 390
    for item in spec["left"]:
        draw.ellipse((220, y + 12, 248, y + 40), fill=WARN)
        draw.text((270, y), item, fill=TEXT, font=f_b)
        y += 90
    y = 390
    for item in spec["right"]:
        draw.ellipse((1060, y + 12, 1088, y + 40), fill=OK)
        draw.text((1110, y), item, fill=TEXT, font=f_b)
        y += 90
    footer(draw, page)
    return img


def render_golden(spec: dict, page: str) -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)
    header_bar(draw, spec["kicker"])
    draw_rounded(draw, (100, 120, W - 100, H - 100), CARD, 36)
    f_title = font(FONT_DISPLAY, 64)
    draw.text((200, 160), spec["title"], fill=ACCENT_DARK, font=f_title)
    f_b = font(FONT_BOLD, 40)
    y = 280
    for i, rule in enumerate(spec["rules"], 1):
        draw.rounded_rectangle((200, y, 1720, y + 100), radius=18, fill=(241, 248, 246))
        draw.rounded_rectangle((200, y, 300, y + 100), radius=18, fill=ACCENT)
        # fix left square look
        draw.rectangle((260, y, 300, y + 100), fill=ACCENT)
        nf = font(FONT_BOLD, 40)
        draw.text((230, y + 26), str(i), fill=(255, 255, 255), font=nf)
        draw.text((340, y + 26), rule, fill=TEXT, font=f_b)
        y += 120
    footer(draw, page)
    return img


def render_close(spec: dict) -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)
    header_bar(draw, spec["kicker"])
    draw_rounded(draw, (120, 180, W - 120, H - 160), CARD, 36)
    draw.rectangle((120, 180, 148, H - 160), fill=ACCENT)
    f_title = font(FONT_DISPLAY, 88)
    y = 280
    for line in spec["title"].split("\n"):
        draw.text((220, y), line, fill=ACCENT_DARK, font=f_title)
        y += 110
    f_sub = font(FONT_BODY, 36)
    for line in wrap_text(spec["sub"], f_sub, 1450, draw):
        draw.text((220, y + 40), line, fill=MUTED, font=f_sub)
        y += 52
    footer(draw, "11")
    return img


def render_slide(spec: dict, index: int) -> Image.Image:
    page = f"{index:02d}"
    kind = spec["kind"]
    if kind == "title":
        return render_title(spec)
    if kind == "bullets":
        return render_bullets(spec, page)
    if kind == "plate":
        return render_plate(spec, page)
    if kind == "warning":
        return render_warning(spec, page)
    if kind == "golden":
        return render_golden(spec, page)
    if kind == "close":
        return render_close(spec)
    raise ValueError(kind)


def make_voice(text: str, path: Path) -> None:
    tts = gTTS(text=text, lang="en", tld="co.in", slow=False)
    tmp = path.with_suffix(".mp3")
    tts.save(str(tmp))
    # Normalize loudness and convert to wav for predictable duration
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(tmp),
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            str(path),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def audio_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        text=True,
    ).strip()
    return float(out)


def main() -> None:
    concat_lines = []
    meta = []
    for i, spec in enumerate(SLIDES_SPEC, 1):
        print(f"Slide {i}: {spec['id']}")
        img = render_slide(spec, i)
        slide_path = SLIDES / f"{spec['id']}.png"
        img.save(slide_path, "PNG")

        audio_path = AUDIO / f"{spec['id']}.wav"
        make_voice(spec["voice"], audio_path)
        dur = audio_duration(audio_path) + float(spec.get("hold_extra", 0.6))
        meta.append((slide_path, audio_path, dur))

        # per-slide clip: still image + audio padded to duration
        clip = OUT / f"clip_{i:02d}.mp4"
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-loop", "1", "-i", str(slide_path),
                "-i", str(audio_path),
                "-c:v", "libx264", "-tune", "stillimage",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-t", f"{dur:.3f}",
                "-vf", "scale=1920:1080,fade=t=in:st=0:d=0.35,fade=t=out:st={}:d=0.35".format(max(0.1, dur - 0.35)),
                "-shortest",
                "-movflags", "+faststart",
                str(clip),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        concat_lines.append(f"file '{clip}'")

    list_path = OUT / "concat.txt"
    list_path.write_text("\n".join(concat_lines) + "\n")
    final = OUT / "World_Diabetes_Day_Elder_Guidelines.mp4"
    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(list_path),
            "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            str(final),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # also write YouTube metadata
    (OUT / "YOUTUBE_UPLOAD.txt").write_text(
        """TITLE
World Diabetes Day: Simple Diabetes Guidelines for Elders (Must Watch)

DESCRIPTION
World Diabetes Day special for parents and grandparents.

This short guide explains simple, practical diabetes care for elders:
• Know your sugar numbers
• Eat the elder plate way
• Take medicines on time
• Walk a little every day
• Protect your feet
• Spot high and low sugar warning signs
• How family and caregivers can help

5 Golden Rules
1. Take medicines on time
2. Eat on time — never skip meals
3. Walk a little every day
4. Check your feet every night
5. Know high and low sugar signs

Important: This video is for general awareness only. Always consult your doctor before changing medicines, diet, or exercise.

#WorldDiabetesDay #DiabetesCare #ElderHealth #DiabetesAwareness #SeniorHealth #HealthyAging

TAGS
World Diabetes Day, diabetes guidelines for elders, diabetes care for seniors, sugar control for elderly, diabetic diet for elders, foot care diabetes, diabetes awareness India, senior health tips, caregiver diabetes guide

THUMBNAIL TIP
Use slide 01_title.png — large text “Diabetes Care for Elders”
""",
        encoding="utf-8",
    )
    print("DONE", final)
    print("Duration pieces:", [round(d, 1) for _, _, d in meta], "total~", round(sum(d for _, _, d in meta), 1))


if __name__ == "__main__":
    main()
