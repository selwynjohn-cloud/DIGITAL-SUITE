"""Sharp 1920×1080 Security News film. Pictures stay full size. No invented photos."""
import os
import re
import subprocess

from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
LEFT = 960
# Heading bar sits across both halves. The picture starts under it.
# Picture window: lined up under the heading and above the red band, with an even gap.
# Picture sits in the right half, level with the words, under the heading and above the red band.
# Story picture sits under the flash line and above the weather line.
WX, WY, WW, WH = 1004, 248, 860, 660
FRAME = (WX - 10, WY - 10, WX + WW + 10, WY + WH + 10)
HOLE = (8, 40, 110)
RED = (225, 6, 0)
GOLD = (201, 168, 76)
BODY = (232, 236, 244)
WHITE = (255, 255, 255)
NAVY = (8, 40, 110)
BAND = "Our services -www.agilegroup.co.in  Register for Job -www.securityjob.co.in"
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
LOGO_H = 220
# Story heading sits under the flash line, above the picture.
HEAD_Y = 176
HEAD_H = 68
HEAD_FONT = 46
TEXT_TOP = 248
# Top of the frame: Agile Group, then the date, then the flash line.
TOP_X = 280
FLASH_Y = 96
FLASH_H = 64
FLASH_BADGE = 136
FLASH_X = TOP_X + FLASH_BADGE
BAR_LABEL = "FLASH"
FLASH_RIGHT = 1884
# Weather line sits just above the red band.
WEATHER_Y = 934
WEATHER_H = 60
WEATHER_BADGE = 196
WEATHER_X = 28 + WEATHER_BADGE
WEATHER_RIGHT = 1884
# Same speed for both lines. Each line is kept to one length so the speed stays even.
TICKER_SPEED = 100
TICKER_FONT = 38
TICKER_MIN = 2200
TICKER_MAX = 2800


def _font(size):
    if os.path.isfile(FONT):
        return ImageFont.truetype(FONT, size)
    return ImageFont.load_default()


def _wrap(draw, text, font, max_w):
    words, lines, cur = (text or "").split(), [], ""
    for word in words:
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def _band(draw):
    draw.rectangle((0, 1002, W, H), fill=RED)
    size = 36
    font = _font(size)
    while size > 24 and draw.textlength(BAND, font=font) > 1840:
        size -= 2
        font = _font(size)
    box = font.getbbox(BAND)
    ink = box[3] - box[1]
    tw = draw.textlength(BAND, font=font)
    y = 1002 + (78 - ink) // 2 - box[1]
    draw.text(((W - tw) / 2, y), BAND, font=font, fill=WHITE)


def _centre(draw, text, font, y, fill):
    tw = draw.textlength(text, font=font)
    draw.text(((LEFT - tw) / 2, y), text, font=font, fill=fill)


def _left(draw, rows):
    top = WY
    block = sum(step for *_, step in rows)
    room = WH
    y = top + max(0, (room - block) // 2)
    for text, font, fill, step in rows:
        if text:
            _centre(draw, text, font, y, fill)
        elif fill == GOLD:
            draw.rectangle((120, y + 8, 840, y + 12), fill=GOLD)
        y += step


def heading_strip(text, dest):
    """Heading with a gold edge. The film gives it a soft flash. It does not turn over."""
    im = Image.new("RGBA", (W, HEAD_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    label = (text or "FLASH NEWS").upper()
    size = HEAD_FONT
    font = _font(size)
    # Stay clear of the crest on the left.
    left_clear, right_clear = 360, 1880
    max_w = right_clear - left_clear
    while size > 26 and d.textlength(label, font=font) > max_w:
        size -= 2
        font = _font(size)
    box = font.getbbox(label)
    ink = box[3] - box[1]
    tw = d.textlength(label, font=font)
    y = (HEAD_H - ink) // 2 - box[1]
    x = (W - tw) / 2
    if x < left_clear:
        x = left_clear + max(0, (max_w - tw) / 2)
    d.text((x, y), label, font=font, fill=(201, 168, 76, 255), stroke_width=8, stroke_fill=(201, 168, 76, 230))
    d.text((x, y), label, font=font, fill=(225, 6, 0, 255))
    im.save(dest)


def _date_words(value):
    raw = (value or "").strip()
    if "Morning News" in raw or "Evening News" in raw:
        return raw
    parts = raw.split("-")
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit() and parts[2].isdigit():
        month = months[int(parts[1]) - 1]
        return f"{int(parts[2])} {month} {parts[0]}"
    return raw


def _tag(d, box, label, fill, ink):
    d.rectangle(box, fill=fill)
    font = _font(24)
    tw = d.textlength(label, font=font)
    box_h = box[3] - box[1]
    th = font.getbbox(label)
    ink_h = th[3] - th[1]
    d.text((box[0] + (box[2] - box[0] - tw) / 2, box[1] + (box_h - ink_h) / 2 - th[1]), label, font=font, fill=ink)


def _chrome(d):
    """Agile Group and the date, then the flash bar, then the weather bar."""
    name = _font(42)
    d.text((TOP_X, 22), "AGILE GROUP", font=name, fill=WHITE)
    when = _date_words(DATE_LABEL)
    if when:
        gap = d.textlength("AGILE GROUP", font=name)
        d.text((TOP_X + gap + 26, 28), when, font=_font(36), fill=GOLD)
    if FLASH_TEXT:
        d.rectangle((TOP_X, FLASH_Y, FLASH_RIGHT, FLASH_Y + FLASH_H), fill=(120, 8, 16))
        _tag(d, (TOP_X, FLASH_Y, FLASH_X, FLASH_Y + FLASH_H), BAR_LABEL, RED, WHITE)
        if not FLASH_PNG:
            _line_in_bar(d, FLASH_LINE or FLASH_TEXT, FLASH_X, FLASH_Y, FLASH_H, FLASH_RIGHT)
        d.rectangle((TOP_X, FLASH_Y, FLASH_RIGHT, FLASH_Y + FLASH_H), outline=GOLD, width=3)
    if WEATHER_TEXT:
        d.rectangle((28, WEATHER_Y, WEATHER_RIGHT, WEATHER_Y + WEATHER_H), fill=(4, 90, 84))
        _tag(d, (28, WEATHER_Y, WEATHER_X, WEATHER_Y + WEATHER_H), "WEATHER", GOLD, NAVY)
        if not WEATHER_PNG:
            _line_in_bar(d, WEATHER_LINE or WEATHER_TEXT, WEATHER_X, WEATHER_Y, WEATHER_H, WEATHER_RIGHT)
        d.rectangle((28, WEATHER_Y, WEATHER_RIGHT, WEATHER_Y + WEATHER_H), outline=GOLD, width=3)
    _band(d)


def _base(hole=False, framed=True):
    im = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 1002), fill=NAVY)
    if hole:
        d.rectangle((WX, WY, WX + WW, WY + WH), fill=HOLE)
    if framed or hole:
        d.rectangle(FRAME, outline=GOLD, width=6)
    _chrome(d)
    return im, d


def _cover(src, box):
    im = Image.open(src).convert("RGB")
    bw, bh = box
    scale = max(bw / im.width, bh / im.height)
    nw, nh = int(im.width * scale) + 1, int(im.height * scale) + 1
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x = max(0, (nw - bw) // 2)
    y = max(0, (nh - bh) // 2)
    return im.crop((x, y, x + bw, y + bh))


# The headline only, large enough for a phone. She reads the story. The whole story stays off the card.
STORY_HEAD = 58


def _place(draw, text, font, y, fill, center):
    tw = draw.textlength(text, font=font)
    draw.text((center - tw / 2, y), text, font=font, fill=fill)


def story_heading(title, spoken=""):
    """The short heading is the story she is reading, not a standing label."""
    head = re.sub(r"\s+", " ", (title or "").strip())
    if head:
        return head
    text = re.sub(r"\s+", " ", (spoken or "").strip())
    text = re.sub(r"^\d{2}-\d{2}-\d{4}\s+(Morning|Evening) News\.\s*", "", text)
    sentence = re.split(r"(?<=[.!?])\s+", text, maxsplit=1)[0].strip()
    return sentence or "Daily News"


def _story_block(draw, title, note, wide=False):
    """The headline only. She reads the story. The whole story stays off the card."""
    headline = (title or "").strip().upper()
    hfont = _font(STORY_HEAD)
    width = 1560 if wide else 840
    center = W / 2 if wide else LEFT / 2
    rows = []
    for line in _wrap(draw, headline, hfont, width)[:3]:
        rows.append((line, hfont, WHITE, 74))
    block = sum(step for *_, step in rows)
    top = HEAD_Y + HEAD_H + 18
    bottom = (WEATHER_Y - 16) if WEATHER_TEXT else 990
    y = top + max(0, (bottom - top - block) // 2)
    for text, font, fill, step in rows:
        if text:
            _place(draw, text, font, y, fill, center)
        y += step


def _clear_logo_plate(logo):
    """Drop the black square behind the crest. The crest itself stays."""
    im = logo.convert("RGBA")
    w, h = im.size
    pix = im.load()
    seen = bytearray(w * h)
    stack = []
    def push(x, y):
        if 0 <= x < w and 0 <= y < h and not seen[y * w + x]:
            seen[y * w + x] = 1
            stack.append((x, y))
    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)
    while stack:
        x, y = stack.pop()
        r, g, b, a = pix[x, y]
        if a < 16 or (r < 36 and g < 36 and b < 36):
            pix[x, y] = (0, 0, 0, 0)
            push(x + 1, y)
            push(x - 1, y)
            push(x, y + 1)
            push(x, y - 1)
    return im


def _paste_logo(base):
    mark = os.path.join(os.path.dirname(__file__), "assets", "logo-mark.png")
    if not os.path.isfile(mark):
        return
    logo = _clear_logo_plate(Image.open(mark))
    logo.thumbnail((220, 220), Image.Resampling.LANCZOS)
    base.paste(logo, (18, 12), logo)


def news_card(kicker, title, note, dest, photo=""):
    has_photo = bool(photo and os.path.isfile(photo))
    im, d = _base(hole=False, framed=has_photo)
    _story_block(d, title, note, wide=not has_photo)
    if photo and os.path.isfile(photo):
        im.paste(_cover(photo, (WW, WH)), (WX, WY))
        d = ImageDraw.Draw(im)
        d.rectangle(FRAME, outline=GOLD, width=6)
    _chrome(d)
    _paste_logo(im)
    im.save(dest, quality=95)


def _fit_lines(draw, text, max_w, max_h, start, floor):
    size = start
    while size >= floor:
        font = _font(size)
        lines = _wrap(draw, text, font, max_w)
        step = size + 16
        if lines and len(lines) * step <= max_h:
            return font, lines, step
        size -= 2
    font = _font(floor)
    return font, _wrap(draw, text, font, max_w), floor + 16


def thought_card(quote, takeaway, theme, dest):
    """The short thought on the left. The takeaway is written where the picture would be."""
    im, d = _base(hole=False, framed=True)
    qfont, qlines, qstep = _fit_lines(d, (quote or "").strip(), 800, 280, 46, 32)
    qblock = len(qlines) * qstep + 56
    top = HEAD_Y + HEAD_H + 24
    bottom = (WEATHER_Y - 16) if WEATHER_TEXT else 990
    y = top + max(0, (bottom - top - qblock) // 2)
    for line in qlines:
        _place(d, line, qfont, y, WHITE, LEFT / 2)
        y += qstep
    theme_font = _font(28)
    _place(d, (theme or "").strip(), theme_font, y + 16, GOLD, LEFT / 2)
    pad = 36
    box_w = WW - pad * 2
    box_h = WH - 90
    tfont, tlines, tstep = _fit_lines(d, (takeaway or "").strip(), box_w, box_h, 40, 28)
    block = len(tlines) * tstep
    ty = WY + max(24, (WH - block) // 2)
    for line in tlines:
        _place(d, line, tfont, ty, WHITE, WX + WW / 2)
        ty += tstep
    _chrome(d)
    _paste_logo(im)
    im.save(dest, quality=95)


def news_card_hole(kicker, title, note, dest):
    im, d = _base(hole=True)
    _story_block(d, title, note, wide=False)
    _chrome(d)
    _paste_logo(im)
    im.save(dest, quality=95)


REGISTER_URL = "https://www.securityjob.co.in/#register"


def _paste_register_qr(im, d, qr_path, side=620, caption="Register Now"):
    """Large enough to scan on a phone. Opens Register Now — never an outsourcing letter."""
    if not qr_path or not os.path.isfile(qr_path):
        return
    code = Image.open(qr_path).convert("RGB")
    code = code.resize((side, side), Image.Resampling.NEAREST)
    pad = Image.new("RGB", (side + 36, side + 36), WHITE)
    pad.paste(code, (18, 18))
    cap = _font(28)
    cap_lines = _wrap(d, caption, cap, WW - 24)[:2] if caption else []
    block_h = pad.height + (18 + 36 * len(cap_lines) if cap_lines else 0)
    px = WX + (WW - pad.width) // 2
    py = WY + max(0, (WH - block_h) // 2)
    im.paste(pad, (px, py))
    ty = py + pad.height + 14
    for line in cap_lines:
        tw = d.textlength(line, font=cap)
        d.text((WX + (WW - tw) / 2, ty), line, font=cap, fill=WHITE)
        ty += 36


def jobs_card(cities, dest, qr_path):
    im, d = _base(hole=False)
    rows = [
        ("Build your Career with us", _font(48), GOLD, 70),
        ("Opening in Multiple cities for", _font(42), WHITE, 64),
        ("1.  Hospital & Health Care services", _font(42), WHITE, 58),
        ("2.  Facility Management", _font(42), WHITE, 58),
        ("3.  Security Services", _font(42), WHITE, 64),
    ]
    block = sum(step for *_, step in rows)
    top = HEAD_Y + HEAD_H + 36
    bottom = WEATHER_Y - 24
    y = top + max(0, (bottom - top - block) // 2)
    left_x = 64
    for text, font, fill, step in rows:
        d.text((left_x, y), text, font=font, fill=fill)
        y += step
    _paste_register_qr(im, d, qr_path, side=460, caption="Scan the QR and submit your Expression of Interest")
    _chrome(d)
    _paste_logo(im)
    im.save(dest, quality=95)


def wage_slip_card(dest, qr_path):
    """Wage-slip download card. The code opens the wage-slip page."""
    im, d = _base(hole=False)
    body = _font(40)
    rows = [
        ("Download your Wage Slip", body, WHITE, 64),
        ("On your phone", body, WHITE, 60),
        ("Last month's Wage Slip", body, GOLD, 64),
        ("www.agilegroup-digital.co.in", _font(30), WHITE, 46),
        ("/my-wage-slip", _font(30), WHITE, 46),
    ]
    _left(d, rows)
    _paste_register_qr(im, d, qr_path, side=620, caption="Scan and download")
    _chrome(d)
    _paste_logo(im)
    im.save(dest, quality=95)


def poster_card(src, dest):
    """Full poster on the film, kept whole so every line can be read. Do not speak 9248707070."""
    im = Image.new("RGB", (W, H), NAVY)
    poster = Image.open(src).convert("RGB")
    max_w, max_h = W - 80, H - 48
    scale = min(max_w / poster.width, max_h / poster.height)
    size = (max(1, int(poster.width * scale)), max(1, int(poster.height * scale)))
    poster = poster.resize(size, Image.Resampling.LANCZOS)
    im.paste(poster, ((W - poster.width) // 2, (H - poster.height) // 2))
    im.save(dest, quality=95)


def guards_order_card(dest, picture=None):
    """Slide for the guards. The words sit level with the picture. Do not speak 9248707070."""
    im = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 16), fill=GOLD)
    d.rectangle((0, H - 16, W, H), fill=GOLD)
    d.text((300, 40), "TO OUR SECURITY GUARDS", font=_font(52), fill=GOLD)
    photo_top, photo_h = 220, 0
    if picture and os.path.isfile(picture):
        photo = Image.open(picture).convert("RGB")
        max_w, max_h = 760, H - 220
        scale = min(max_w / photo.width, max_h / photo.height)
        size = (max(1, int(photo.width * scale)), max(1, int(photo.height * scale)))
        photo = photo.resize(size, Image.Resampling.LANCZOS)
        photo_h = photo.height
        x = W - photo.width - 56
        photo_top = 150 + max(0, (H - 166 - photo.height) // 2)
        d.rectangle((x - 8, photo_top - 8, x + photo.width + 8, photo_top + photo.height + 8), outline=GOLD, width=6)
        im.paste(photo, (x, photo_top))
    lines = (
        ("This Deepavali order is for you.", _font(42), GOLD),
        ("1    Check every bag at the gate", _font(40), WHITE),
        ("2    Stop crackers. No exceptions", _font(40), WHITE),
        ("3    Report at once. Stay on your post", _font(40), WHITE),
    )
    gap = 36
    heights = [font.getbbox(text)[3] - font.getbbox(text)[1] for text, font, _fill in lines]
    block = sum(heights) + gap * (len(lines) - 1)
    y = photo_top + max(0, (photo_h - block) // 2) if photo_h else 360
    for (text, font, fill), h in zip(lines, heights):
        d.text((72, y), text, font=font, fill=fill)
        y += h + gap
    im.save(dest, quality=95)


def public_follow_card(dest):
    """Please follow us for the guidelines. Do not speak 9248707070."""
    im = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 16), fill=GOLD)
    d.rectangle((0, H - 16, W, H), fill=GOLD)
    lines = (
        ("Please follow us", _font(78), GOLD),
        ("for Deepavali fire safety guidelines.", _font(52), WHITE),
    )
    gap = 36
    heights = [font.getbbox(text)[3] - font.getbbox(text)[1] for text, font, _fill in lines]
    block = sum(heights) + gap
    y = (H - block) // 2
    for (text, font, fill), h in zip(lines, heights):
        tw = d.textlength(text, font=font)
        d.text(((W - tw) / 2, y), text, font=font, fill=fill)
        y += h + gap
    im.save(dest, quality=95)


def hiring_register_card(dest, qr_path):
    """Last card of the long film. Large type for a phone. No dark bars behind the lines.
    The code opens Register Now. The Agile crest sits in the code. Do not speak 9248707070."""
    im = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 16), fill=GOLD)
    d.rectangle((0, H - 16, W, H), fill=GOLD)
    d.text((260, 40), "AGILE", font=_font(78), fill=GOLD)
    d.text((260, 132), "Agile Security Force Private Limited", font=_font(36), fill=WHITE)
    d.text((72, 240), "Now hiring", font=_font(84), fill=WHITE)
    d.text((72, 340), "across multiple categories", font=_font(48), fill=GOLD)
    y = 430
    for line in (
        "1    Security Services",
        "2    Facility Management",
        "3    Healthcare & Hospitality",
    ):
        d.text((72, y), line, font=_font(54), fill=WHITE)
        y += 82
    d.text((72, 760), "Register Now", font=_font(78), fill=GOLD)
    d.text((72, 858), "Scan the code", font=_font(40), fill=WHITE)
    d.text((72, 916), "www.securityjob.co.in", font=_font(36), fill=GOLD)
    if qr_path and os.path.isfile(qr_path):
        side = 640
        code = Image.open(qr_path).convert("RGB").resize((side, side), Image.Resampling.NEAREST)
        pad = 24
        box = Image.new("RGB", (side + pad * 2, side + pad * 2), WHITE)
        box.paste(code, (pad, pad))
        im.paste(box, (W - box.width - 56, (H - box.height) // 2))
    im.save(dest, quality=95)


def register_qr_card(dest, qr_path):
    """Own scannable Register Now card. Do not put Tanish here. Do not speak 9248707070."""
    im, d = _base(hole=False)
    body = _font(40)
    rows = [
        ("Scan this code", body, WHITE, 64),
        ("Register Now", body, WHITE, 64),
        ("www.securityjob.co.in", body, WHITE, 56),
        ("Pick your Division on the form", _font(32), WHITE, 48),
    ]
    _left(d, rows)
    _paste_register_qr(im, d, qr_path, side=620, caption="Register Now")
    _chrome(d)
    _paste_logo(im)
    im.save(dest, quality=95)


def _contain(src, max_w, max_h):
    """Fit the whole picture inside the box. Do not stretch it, and do not crop the subject away."""
    pic = Image.open(src).convert("RGB")
    scale = min(max_w / pic.width, max_h / pic.height)
    size = (max(1, int(pic.width * scale)), max(1, int(pic.height * scale)))
    return pic.resize(size, Image.Resampling.LANCZOS)


def short_register_card(dest, qr_path, date_line, headlines=None, still_logo=True, photo_path=""):
    """Vertical Short: logo, the story she is reading, then the code. Job openings sits with Register Now.
    Even gaps, so the card looks lined up. The picture is smaller than the words. No Tanish.
    The Short film lays the running cheetah over the top, so that card leaves the top empty."""
    sw, sh = 1080, 1920
    im = Image.new("RGB", (sw, sh), NAVY)
    d = ImageDraw.Draw(im)
    follow = "Please follow up our news channel for detailed news and more flash news. www.agilegroup.co.in"
    band_top = 1760
    mark = os.path.join(os.path.dirname(__file__), "assets", "logo-mark.png")
    if still_logo and os.path.isfile(mark):
        logo = _clear_logo_plate(Image.open(mark))
        logo.thumbnail((240, 240), Image.Resampling.LANCZOS)
        im.paste(logo, ((sw - logo.width) // 2, 28), logo)
        top = 28 + logo.height + 8
    else:
        top = 268
    blocks = []

    def add_text(text, font, fill, gap_after=0, stroke=0):
        lines = _wrap(d, text, font, 980) or [text]
        box = font.getbbox("Ag")
        ink = box[3] - box[1]
        step = ink + 14
        height = step * len(lines)
        blocks.append(("text", height + gap_after, lines, font, fill, stroke, step))

    when = (date_line or "").strip()
    if when:
        add_text(when, _font(34), GOLD)
    rows = [str(raw).strip() for raw in (headlines or []) if str(raw).strip()]
    if rows:
        hook_size = 64
        hook_font = _font(hook_size)
        while hook_size > 46 and len(_wrap(d, rows[0], hook_font, 980)) > 2:
            hook_size -= 2
            hook_font = _font(hook_size)
        add_text(rows[0], hook_font, RED, stroke=6)
        tease = _font(32)
        for raw in rows[1:3]:
            add_text(_whole_words(d, raw, tease, 980), tease, WHITE)
        add_text("Watch the full news", _font(42), GOLD)
    photo = None
    if photo_path and os.path.isfile(photo_path):
        photo = _contain(photo_path, 820, 280)
        blocks.append(("photo", photo.height + 16, photo))
    qr = None
    if qr_path and os.path.isfile(qr_path):
        side = 360
        code = Image.open(qr_path).convert("RGB").resize((side, side), Image.Resampling.NEAREST)
        pad = Image.new("RGB", (side + 24, side + 24), WHITE)
        pad.paste(code, (12, 12))
        qr = pad
        blocks.append(("qr", pad.height + 16, pad))
    add_text("Job openings", _font(40), RED, stroke=4)
    add_text("Register Now", _font(36), GOLD)
    add_text("www.securityjob.co.in", _font(30), GOLD)
    follow_font = _font(28)
    follow_lines = _wrap(d, follow, follow_font, 980)
    follow_box = follow_font.getbbox("Ag")
    follow_step = (follow_box[3] - follow_box[1]) + 10
    follow_h = follow_step * len(follow_lines)
    content_h = sum(block[1] for block in blocks) + follow_h
    room = band_top - 28 - top
    gap = max(16, (room - content_h) // max(1, len(blocks) + 1))
    y = top + max(8, (room - content_h - gap * len(blocks)) // 2)
    for block in blocks:
        kind = block[0]
        if kind == "text":
            _h, lines, font, fill, stroke, step = block[1], block[2], block[3], block[4], block[5], block[6]
            for line in lines:
                tw = d.textlength(line, font=font)
                x = (sw - tw) / 2
                if stroke:
                    d.text((x, y), line, font=font, fill=RED, stroke_width=stroke, stroke_fill=GOLD)
                d.text((x, y), line, font=font, fill=fill)
                y += step
            y += gap
        elif kind == "photo":
            pic = block[2]
            x = (sw - pic.width) // 2
            d.rectangle((x - 8, y - 8, x + pic.width + 8, y + pic.height + 8), outline=GOLD, width=6)
            im.paste(pic, (x, y))
            y += pic.height + gap
        elif kind == "qr":
            pad = block[2]
            x = (sw - pad.width) // 2
            im.paste(pad, (x, y))
            d.rectangle((x - 6, y - 6, x + pad.width + 6, y + pad.height + 6), outline=GOLD, width=6)
            y += pad.height + gap
    y += 8
    for line in follow_lines:
        tw = d.textlength(line, font=follow_font)
        d.text(((sw - tw) / 2, y), line, font=follow_font, fill=WHITE)
        y += follow_step
    d.rectangle((0, band_top, sw, sh), fill=RED)
    d.rectangle((0, band_top, sw, band_top + 6), fill=GOLD)
    size = 26
    font = _font(size)
    while size > 16 and d.textlength(BAND, font=font) > 1000:
        size -= 1
        font = _font(size)
    box = font.getbbox(BAND)
    tw = d.textlength(BAND, font=font)
    d.text(((sw - tw) / 2, band_top + (sh - band_top - (box[3] - box[1])) / 2 - box[1]), BAND, font=font, fill=WHITE)
    im.save(dest, quality=95)


def _whole_words(d, text, font, max_w):
    kept = ""
    for word in (text or "").split():
        trial = (kept + " " + word).strip()
        if kept and d.textlength(trial, font=font) > max_w:
            break
        kept = trial
    if kept != " ".join((text or "").split()) and not kept.endswith(".") and "." in kept:
        kept = kept[: kept.rindex(".") + 1]
    return kept


def curiosity_thumbnail(dest, headline, photo_path, date_line):
    """1280 by 720. The big line is the news people have not heard yet. No black square behind the crest."""
    im = Image.new("RGB", (1280, 720), NAVY)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1280, 10), fill=GOLD)
    d.rectangle((0, 710, 1280, 720), fill=GOLD)
    if photo_path and os.path.isfile(photo_path):
        photo = Image.open(photo_path).convert("RGB")
        tw, th = 520, 700
        scale = max(tw / photo.width, th / photo.height)
        photo = photo.resize((max(1, int(photo.width * scale)), max(1, int(photo.height * scale))), Image.Resampling.LANCZOS)
        left = max(0, (photo.width - tw) // 2)
        top = max(0, (photo.height - th) // 2)
        photo = photo.crop((left, top, left + tw, top + th))
        im.paste(photo, (748, 10))
        d.rectangle((740, 10, 1270, 710), outline=GOLD, width=6)
    mark = os.path.join(os.path.dirname(__file__), "assets", "logo-mark.png")
    if os.path.isfile(mark):
        logo = _clear_logo_plate(Image.open(mark))
        logo.thumbnail((150, 150), Image.Resampling.LANCZOS)
        im.paste(logo, (24, 24), logo)
    when = (date_line or "").strip()
    d.text((190, 48), when, font=_font(28), fill=GOLD)
    y = 210
    hook = _font(64)
    for line in _wrap(d, (headline or "Watch the full news").strip(), hook, 700)[:4]:
        d.text((36, y), line, font=hook, fill=WHITE)
        y += 74
    y += 12
    cue = "Watch the full news"
    d.text((36, min(y, 620)), cue, font=_font(40), fill=GOLD)
    im.save(dest, quality=92)


def wide_thumbnail(src, dest):
    """1280 by 720. The bars in a film frame are empty while the words move, so write them here in large type."""
    im = Image.open(src).convert("RGB")
    d = ImageDraw.Draw(im)
    for text, x, y, h, right, size in (
        (FLASH_TEXT, FLASH_X, FLASH_Y, FLASH_H, FLASH_RIGHT, 46),
        (WEATHER_TEXT, WEATHER_X, WEATHER_Y, WEATHER_H, WEATHER_RIGHT, 40),
    ):
        if not text:
            continue
        font = _font(size)
        line = _whole_words(d, text, font, right - x - 30)
        box = font.getbbox("Ag")
        ink = box[3] - box[1]
        d.text((x + 14, y + (h - ink) / 2 - box[1]), line, font=font, fill=WHITE)
    im.resize((1280, 720), Image.Resampling.LANCZOS).save(dest, quality=92)


def thanks_card(dest, logo_path):
    im = Image.new("RGB", (W, H), (8, 28, 78))
    d = ImageDraw.Draw(im)
    if logo_path and os.path.isfile(logo_path):
        logo = _clear_logo_plate(Image.open(logo_path))
        target = 460
        scale = target / max(logo.size)
        logo = logo.resize((int(logo.width * scale), int(logo.height * scale)), Image.Resampling.LANCZOS)
        x = (W - logo.width) // 2
        y = 120
        im.paste(logo, (x, y), logo)
        y = y + logo.height + 36
    else:
        y = 360
    title = _font(64)
    sub = _font(36)
    line = "THANK YOU"
    tw = d.textlength(line, font=title)
    d.text(((W - tw) / 2, y), line, font=title, fill=WHITE)
    y += 90
    for text in ("www.agilegroup.co.in", "www.securityjob.co.in"):
        tw = d.textlength(text, font=sub)
        d.text(((W - tw) / 2, y), text, font=sub, fill=GOLD)
        y += 52
    _band(d)
    im.save(dest, quality=95)


DATE_LABEL = ""
FLASH_TEXT = ""
WEATHER_TEXT = ""
FLASH_LINE = ""
WEATHER_LINE = ""
FLASH_PNG = ""
WEATHER_PNG = ""
COVER_PNG = ""
FLASH_LOOP = 1
WEATHER_LOOP = 1
TICKER_GAP = "          "


def _pieces(text):
    parts = [p.strip(" .") for p in re.split(r"\s*◆\s*", text or "") if p.strip(" .")]
    return parts


def _fit_phrase(parts, font):
    """Stop the line once it is long enough. A longer line would crawl."""
    if not parts:
        return ""
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    chosen = []
    for part in parts:
        trial = "   ◆   ".join(chosen + [part])
        if chosen and probe.textlength(trial, font=font) > TICKER_MAX:
            break
        chosen.append(part)
    if chosen:
        phrase = "   ◆   ".join(chosen)
        if probe.textlength(phrase, font=font) <= TICKER_MAX:
            return phrase
        words = phrase.split()
        while words and probe.textlength(" ".join(words), font=font) > TICKER_MAX:
            words.pop()
        return " ".join(words)
    words, line = parts[0].split(), ""
    for word in words:
        trial = (line + " " + word).strip()
        if line and probe.textlength(trial, font=font) > TICKER_MAX:
            break
        line = trial
    return line


def _unit_width(phrase, font):
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    return max(1, int(probe.textlength(phrase + TICKER_GAP, font=font)))


def _paint_ticker(phrase, height, color, dest, target):
    font = _font(TICKER_FONT)
    unit_w = _unit_width(phrase, font)
    copies = 1
    if unit_w < target:
        copies = max(1, int(round(target / float(unit_w))))
        while copies > 1 and unit_w * copies > TICKER_MAX:
            copies -= 1
        while unit_w * copies < min(target, TICKER_MIN) and unit_w * (copies + 1) <= TICKER_MAX:
            copies += 1
    loop_w = unit_w * copies
    im = Image.new("RGBA", (loop_w * 2 + 8, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    box = font.getbbox("Ag")
    ink = box[3] - box[1]
    y = (height - ink) // 2 - box[1]
    d.text((0, y), (phrase + TICKER_GAP) * (copies * 2), font=font, fill=color)
    im.save(dest)
    return loop_w


def _cover_png(dest):
    """Keeps the moving words inside each bar, and keeps the names readable."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if FLASH_TEXT:
        d.rectangle((0, FLASH_Y, FLASH_X, FLASH_Y + FLASH_H), fill=(8, 40, 110, 255))
        _tag(d, (TOP_X, FLASH_Y, FLASH_X, FLASH_Y + FLASH_H), BAR_LABEL, RED, WHITE)
        d.rectangle((FLASH_RIGHT, FLASH_Y, W, FLASH_Y + FLASH_H), fill=(8, 40, 110, 255))
    if WEATHER_TEXT:
        d.rectangle((0, WEATHER_Y, WEATHER_X, WEATHER_Y + WEATHER_H), fill=(8, 40, 110, 255))
        _tag(d, (28, WEATHER_Y, WEATHER_X, WEATHER_Y + WEATHER_H), "WEATHER", GOLD, NAVY)
        d.rectangle((WEATHER_RIGHT, WEATHER_Y, W, WEATHER_Y + WEATHER_H), fill=(8, 40, 110, 255))
    im.save(dest)


def _fit_bar(label):
    """The red name on the top line. Ordinary films keep FLASH. A special bulletin can use another short name."""
    global FLASH_BADGE, FLASH_X, BAR_LABEL
    BAR_LABEL = (label or "FLASH").strip().upper() or "FLASH"
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    width = probe.textlength(BAR_LABEL, font=_font(24))
    FLASH_BADGE = max(136, int(width) + 36)
    FLASH_X = TOP_X + FLASH_BADGE


def _line_in_bar(d, text, x, y, height, right):
    """The whole line stays inside the bar. Words are not cut off at the edge."""
    words = (text or "").strip()
    if not words:
        return
    max_w = max(40, right - x - 18)
    size = 32
    font = _font(size)
    while size > 18 and d.textlength(words, font=font) > max_w:
        size -= 1
        font = _font(size)
    box = font.getbbox("Ag")
    ink = box[3] - box[1]
    d.text((x + 12, y + (height - ink) / 2 - box[1]), words, font=font, fill=WHITE)


def prepare_tickers(folder, flash_text, weather_text, date_label, bar_label="FLASH"):
    """The news line and the weather line move across the bar. The whole sentence is used."""
    global DATE_LABEL, FLASH_TEXT, WEATHER_TEXT, FLASH_LINE, WEATHER_LINE
    global FLASH_PNG, WEATHER_PNG, COVER_PNG, FLASH_LOOP, WEATHER_LOOP
    _fit_bar(bar_label)
    DATE_LABEL = date_label or ""
    FLASH_TEXT = (flash_text or "").strip()
    WEATHER_TEXT = (weather_text or "").strip()
    FLASH_LINE = ""
    WEATHER_LINE = ""
    FLASH_PNG = ""
    WEATHER_PNG = ""
    COVER_PNG = ""
    FLASH_LOOP = 1
    WEATHER_LOOP = 1
    os.makedirs(folder, exist_ok=True)
    if FLASH_TEXT:
        FLASH_PNG = os.path.join(folder, "flash-tick.png")
        FLASH_LOOP = _paint_ticker(FLASH_TEXT, FLASH_H, WHITE, FLASH_PNG, FLASH_RIGHT - FLASH_X)
    if WEATHER_TEXT:
        WEATHER_PNG = os.path.join(folder, "weather-tick.png")
        WEATHER_LOOP = _paint_ticker(WEATHER_TEXT, WEATHER_H, WHITE, WEATHER_PNG, WEATHER_RIGHT - WEATHER_X)
    if FLASH_PNG or WEATHER_PNG:
        COVER_PNG = os.path.join(folder, "tick-cover.png")
        _cover_png(COVER_PNG)


def _run(cmd, timeout=300):
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or "The film piece could not be made.")[-500:])


def _yt_video():
    """A fuller picture so YouTube's own copy stays sharp."""
    return [
        "-c:v", "libx264", "-preset", "medium", "-crf", "14",
        "-profile:v", "high", "-level", "4.2",
        "-pix_fmt", "yuv420p", "-r", "25",
        "-g", "50", "-keyint_min", "25",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    ]


def _run_picture(cmd):
    """One card sometimes sits still. Stop it and try that card once more."""
    last = None
    for _ in range(2):
        try:
            _run(cmd, timeout=180)
            return
        except subprocess.TimeoutExpired as exc:
            last = exc
    raise last


def _dur(ff, path):
    proc = subprocess.run([ff, "-i", path], capture_output=True, text=True)
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", proc.stderr or "")
    if not match:
        return 8.0
    h, m, s = match.groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def _loops_for(ff, audio, logo):
    """Keep the corner logo running longer than her voice. Never loop forever."""
    audio_d = _dur(ff, audio) + 1.6
    logo_d = max(0.5, _dur(ff, logo))
    plays = int(audio_d / logo_d) + 2
    return max(3, plays - 1)


def _clear_voice(audio_i, pad=0.7):
    """The spoken news is a small phone recording. Lift it so it matches the reader, and leave a breath after the last word."""
    return (
        f"[{audio_i}:a]aresample=44100,aformat=channel_layouts=stereo,"
        f"highpass=f=80,treble=g=2,volume=8dB,alimiter=limit=0.9,"
        f"apad=pad_dur={float(pad):.2f}[a]"
    )


def _logo(ff, index):
    return (
        f"[{index}:v]fps=25,crop=780:720:248:0,scale=-2:{LOGO_H}:flags=lanczos,"
        "colorkey=0xFAF7F9:0.14:0.02,format=rgba,setpts=PTS-STARTPTS[lg];"
    )


def _glow(index):
    """The heading stays upright and gives a soft gold flash."""
    return (
        f"[{index}:v]fps=25,format=rgba,"
        f"eq=brightness='0.08*sin(2*PI*t/1.2)':saturation='1.2+0.45*abs(sin(2*PI*t/1.2))':eval=frame,"
        f"setpts=PTS-STARTPTS[hd];"
    )


def _move(index, x, y, loop_w, src, out, cur):
    return (
        f"[{index}:v]fps=25,format=rgba,setpts=PTS-STARTPTS[{src}];"
        f"[{cur}][{src}]overlay=x='{x}-mod(t*{TICKER_SPEED}\\,{max(1, int(loop_w))})':y={y}:eof_action=repeat[{out}];"
    )


def _finish(ff, filt, cur, index, logo_i, scroll=True):
    if scroll and FLASH_PNG:
        filt += _move(index, FLASH_X, FLASH_Y, FLASH_LOOP, "fl", "flv", cur)
        cur = "flv"
        index += 1
    if scroll and WEATHER_PNG:
        filt += _move(index, WEATHER_X, WEATHER_Y, WEATHER_LOOP, "wx", "wxv", cur)
        cur = "wxv"
        index += 1
    if scroll and COVER_PNG:
        filt += f"[{index}:v]fps=25,format=rgba,setpts=PTS-STARTPTS[cv];"
        filt += f"[{cur}][cv]overlay=0:0:eof_action=repeat[cvv];"
        cur = "cvv"
    filt += _logo(ff, logo_i) + f"[{cur}][lg]overlay=18:12:eof_action=repeat[v]"
    return filt


def _still(path, seconds):
    """A picture input that ends. An endless picture can stall the film."""
    return ["-loop", "1", "-t", f"{seconds:.2f}", "-i", path]


def encode_still(ff, frame, audio, logo, dest, heading="", scroll=True, min_hold=0):
    spoken = _dur(ff, audio)
    stay = max(spoken + 0.8, float(min_hold or 0))
    loops = _loops_for(ff, audio, logo)
    if stay > spoken + 1.6:
        logo_d = max(0.5, _dur(ff, logo))
        loops = max(loops, int((stay + 1.6) / logo_d) + 1)
    hold = stay + 0.6
    cmd = [ff, "-y"] + _still(frame, hold)
    index = 1
    head_i = None
    if heading:
        cmd += _still(heading, hold)
        head_i = index
        index += 1
    if scroll and FLASH_PNG:
        cmd += _still(FLASH_PNG, hold)
        index += 1
    if scroll and WEATHER_PNG:
        cmd += _still(WEATHER_PNG, hold)
        index += 1
    if scroll and COVER_PNG:
        cmd += _still(COVER_PNG, hold)
        index += 1
    cmd += ["-stream_loop", str(loops), "-i", logo, "-i", audio]
    logo_i = index
    audio_i = index + 1
    tick_i = 1 + (1 if head_i is not None else 0)
    filt = "[0:v]fps=25,format=rgba[base];"
    if head_i is not None:
        filt += _glow(head_i) + f"[base][hd]overlay=x='(1920-w)/2':y={HEAD_Y}:eof_action=repeat[mid];"
        cur = "mid"
    else:
        filt += "[base]null[mid];"
        cur = "mid"
    filt = _finish(ff, filt, cur, tick_i, logo_i, scroll)
    filt += ";" + _clear_voice(audio_i, max(0.7, stay - spoken))
    cmd += [
        "-filter_complex", filt,
        "-map", "[v]", "-map", "[a]", "-t", f"{stay:.2f}",
        *_yt_video(),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-movflags", "+faststart", dest,
    ]
    _run_picture(cmd)


def encode_window_video(ff, frame, video, audio, logo, dest, heading=""):
    loops = max(_loops_for(ff, audio, logo), _loops_for(ff, video, logo))
    hold = _dur(ff, audio) + 1.4
    cmd = [ff, "-y"] + _still(frame, hold) + ["-stream_loop", str(loops), "-t", f"{hold:.2f}", "-i", video]
    index = 2
    head_i = None
    if heading:
        cmd += _still(heading, hold)
        head_i = index
        index += 1
    tick_i = index
    if FLASH_PNG:
        cmd += _still(FLASH_PNG, hold)
        index += 1
    if WEATHER_PNG:
        cmd += _still(WEATHER_PNG, hold)
        index += 1
    if COVER_PNG:
        cmd += _still(COVER_PNG, hold)
        index += 1
    cmd += ["-stream_loop", str(loops), "-i", logo, "-i", audio]
    logo_i = index
    audio_i = index + 1
    filt = (
        f"[1:v]scale={WW}:{WH}:force_original_aspect_ratio=increase:flags=lanczos,"
        f"crop={WW}:{WH},fps=25,setpts=PTS-STARTPTS[pic];"
        "[0:v]fps=25,format=rgba[base];"
        f"[base][pic]overlay={WX}:{WY}:eof_action=repeat[shot];"
    )
    if head_i is not None:
        filt += _glow(head_i) + f"[shot][hd]overlay=x='(1920-w)/2':y={HEAD_Y}:eof_action=repeat[mid];"
        cur = "mid"
    else:
        filt += "[shot]null[mid];"
        cur = "mid"
    filt = _finish(ff, filt, cur, tick_i, logo_i)
    filt += ";" + _clear_voice(audio_i)
    cmd += [
        "-filter_complex", filt,
        "-map", "[v]", "-map", "[a]", "-t", f"{_dur(ff, audio) + 0.8:.2f}",
        *_yt_video(),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-movflags", "+faststart", dest,
    ]
    _run(cmd, timeout=600)


DAILY_SCREEN_LINE = "Your Daily Security News"
SPECIAL_SCREEN_LINE = "Special Bulletin"


def _line_box(mask, window, max_span, min_width, max_height):
    """One wide gold line inside the window. The crest is outside that window."""
    import numpy as np
    y0w, y1w, x0w, x1w = window
    sub = mask[y0w:y1w, x0w:x1w]
    keep = np.zeros(sub.shape[1], dtype=bool)
    for i in range(sub.shape[1]):
        ys = np.where(sub[:, i])[0]
        if len(ys) >= 2 and int(ys[-1] - ys[0]) <= max_span:
            keep[i] = True
    idx = np.where(keep)[0]
    if len(idx) < 20:
        return None
    groups = []
    start = int(idx[0])
    prev = start
    for x in idx[1:]:
        x = int(x)
        if x - prev > 22:
            groups.append((start, prev))
            start = x
        prev = x
    groups.append((start, prev))
    groups.sort(key=lambda pair: pair[1] - pair[0], reverse=True)
    a, b = groups[0]
    for s, e in groups[1:]:
        if s > b and s - b <= 36:
            b = e
        elif e < a and a - e <= 36:
            a = s
    if b - a < min_width:
        return None
    band = sub[:, a:b + 1]
    counts = band.sum(axis=1)
    rows = np.where(counts >= 4)[0]
    if len(rows) < 6:
        return None
    y0 = y0w + int(rows[0])
    y1 = y0w + int(rows[-1])
    if y1 - y0 > max_height:
        return None
    return x0w + a, y0, x0w + b, y1


def _screen_line_boxes(arr):
    """The gold briefing line. It sits on the title card, then again on her screen."""
    import numpy as np
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    strong = (r > 180) & (g > 135) & (b < 130) & ((g - b) > 35) & ((r - b) > 60)
    pale = (r > 150) & (g > 120) & ((g - b) > 12) & ((r - b) > 25) & (r + 20 > g)
    boxes = []
    studio = _line_box(strong, (480, 640, 1180, 1880), 32, 140, 40)
    if studio:
        boxes.append(studio)
    title = _line_box(pale, (660, 820, 980, 1760), 58, 180, 70)
    if title:
        boxes.append(title)
    return boxes


def _paint_screen_line(im, line):
    """Cover 'Your daily security briefing' and write the line for this film."""
    import numpy as np
    from PIL import ImageDraw, ImageFont
    boxes = _screen_line_boxes(np.asarray(im))
    if not boxes:
        return im
    arr = np.asarray(im).copy()
    drawn = []
    for box in boxes:
        x0, y0, x1, y1 = box
        x0 = max(0, x0 - 14)
        y0 = max(0, y0 - 4)
        x1 = min(im.width - 1, x1 + 14)
        y1 = min(im.height - 1, y1 + 6)
        above = arr[max(0, y0 - 8), x0:x1 + 1].astype(np.float32)
        below = arr[min(im.height - 1, y1 + 8), x0:x1 + 1].astype(np.float32)
        height = y1 - y0 + 1
        for i in range(height):
            blend = i / max(1, height - 1)
            arr[y0 + i, x0:x1 + 1] = ((1 - blend) * above + blend * below).astype(np.uint8)
        drawn.append((x0, y0, x1, y1))
    out = Image.fromarray(arr)
    draw = ImageDraw.Draw(out)
    font_path = "/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf"
    for x0, y0, x1, y1 in drawn:
        size = max(16, (y1 - y0) + 8)
        font = ImageFont.truetype(font_path, size)
        while size > 14 and draw.textlength(line, font=font) > (x1 - x0 - 6):
            size -= 1
            font = ImageFont.truetype(font_path, size)
        bb = font.getbbox(line)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        draw.text(
            (x0 + (x1 - x0 - tw) / 2 - bb[0], y0 + (y1 - y0 - th) / 2 - bb[1]),
            line,
            font=font,
            fill=(246, 198, 46),
        )
    return out


def encode_reader(ff, src, dest, screen_line=""):
    """The reader film. screen_line replaces the gold line on her screen."""
    if not (screen_line or "").strip():
        _run([
            ff, "-y", "-i", src,
            *_yt_video(),
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
            "-movflags", "+faststart", dest,
        ], timeout=240)
        return
    import numpy as np
    probe = subprocess.run([ff, "-i", src], capture_output=True, text=True)
    size = re.search(r"(\d{3,4})x(\d{3,4})", probe.stderr or "")
    rate = re.search(r"(\d+(?:\.\d+)?) fps", probe.stderr or "")
    width, height = (int(size.group(1)), int(size.group(2))) if size else (W, H)
    fps = rate.group(1) if rate else "25"
    frame_bytes = width * height * 3
    reader = subprocess.Popen(
        [ff, "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE,
    )
    writer = subprocess.Popen(
        [
            ff, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}",
            "-r", fps, "-i", "-", "-i", src,
            "-map", "0:v", "-map", "1:a?",
            *_yt_video(),
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
            "-movflags", "+faststart", dest,
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )
    try:
        while True:
            buf = reader.stdout.read(frame_bytes)
            if len(buf) < frame_bytes:
                break
            frame = Image.frombytes("RGB", (width, height), buf)
            painted = _paint_screen_line(frame, screen_line.strip())
            writer.stdin.write(np.asarray(painted).tobytes())
        writer.stdin.close()
        err = writer.stderr.read().decode("utf-8", "replace")
        if writer.wait() != 0:
            raise RuntimeError((err or "The reader film could not be made.")[-500:])
    finally:
        if reader.poll() is None:
            reader.kill()
        if writer.poll() is None:
            writer.kill()
        reader.wait()


def encode_thanks_music(ff, frame, music, logo, dest):
    _run([
        ff, "-y", "-loop", "1", "-i", frame, "-i", music,
        "-filter_complex",
        "[0:v]fps=25,format=yuv420p[v];"
        "[1:a]afade=t=in:st=0:d=0.2,afade=t=out:st=2.6:d=0.6,aformat=sample_rates=44100:channel_layouts=stereo[a]",
        "-map", "[v]", "-map", "[a]", "-t", "3.2", "-shortest",
        *_yt_video(),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        dest,
    ])
