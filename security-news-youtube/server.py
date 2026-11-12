#!/usr/bin/env python3
"""Security News admin. Runs on this computer only. Does not upload to YouTube."""
import asyncio
import html
import json
import os
import re
import shutil
import subprocess
import threading
import urllib.request
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

import show
import thoughts

import imageio_ffmpeg

ROOT = os.path.dirname(os.path.abspath(__file__))
EDITION = os.path.join(ROOT, "edition.json")
NEXT_FILM = os.path.join(ROOT, "next-film.json")
BUILD = os.path.join(ROOT, "build")
READY = os.path.join(ROOT, "ready")
UPLOADS = os.path.join(ROOT, "uploads")
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
VOICE = "en-IN-NeerjaNeural"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
          "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
CITIES = [
    ("Chennai", 13.08, 80.27),
    ("Bengaluru", 12.97, 77.59),
    ("Hyderabad", 17.39, 78.49),
    ("Kochi", 9.93, 76.27),
    ("Thiruvananthapuram", 8.52, 76.94),
    ("Vijayawada", 16.51, 80.65),
    ("Madurai", 9.93, 78.12),
    ("Visakhapatnam", 17.69, 83.22),
]
OPENING = "Namaskar. Good morning. Welcome to the morning Agile Group News."
CLOSING = "Thank you for watching Agile Group Security News."
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
TICKER_X, TICKER_Y, TICKER_W, TICKER_H = 560, 1016, 1360, 64
WIN = (35, 129, 1214, 730)
LOGO_VIDEO = os.path.join(ROOT, "assets", "logo-video.mp4")
LOGO_X, LOGO_Y, LOGO_H = 18, 12, 220
PULSE_URL = "https://www.agilegroup-digital.co.in/pulse"
JOBS_URL = "https://www.securityjob.co.in"
REGISTER_URL = "https://www.securityjob.co.in/#register"
CUTOUT = os.path.join(ROOT, "assets", "presenter-namaskar.png")
PRESENTER = os.path.join(ROOT, "assets", "presenter-namaskar.jpg")
LIP_MODEL = os.path.join(ROOT, "models", "wav2lip_gan.onnx")
# Namaskar picture on the right, above the weather bar. Matches the frame.
PERSON_X, PERSON_Y, PERSON_W, PERSON_H, PERSON_VIS = 1330, 8, 590, 1320, 1008

JOB = {"state": "idle", "message": "", "video": ""}
JOB_LOCK = threading.Lock()


def date_label(iso):
    try:
        y, m, d = [int(x) for x in iso.split("-")]
        return f"{d} {MONTHS[m - 1]} {y}"
    except Exception:
        return "19 OCTOBER 2026"


def _item(title="", script="", media="", mediaType="", note="", kicker="Flash News"):
    return {
        "id": datetime.now().strftime("%H%M%S%f"),
        "title": title or "",
        "script": script or "",
        "note": note or "",
        "media": media or "",
        "mediaType": mediaType or "",
        "kicker": kicker or "Flash News",
    }


def default_readers():
    base = "assets/readers"
    return [
        {"id": "priya", "name": "Ms Priya", "openFile": f"{base}/priya-open.mp4", "closeFile": f"{base}/priya-close.mp4"},
        {"id": "nalini", "name": "Ms Nalini", "openFile": f"{base}/nalini-open.mp4", "closeFile": f"{base}/nalini-close.mp4"},
        {"id": "reshma", "name": "Ms Reshma", "openFile": f"{base}/reshma-open.mp4", "closeFile": f"{base}/reshma-close.mp4"},
        {"id": "saleena", "name": "Ms Saleena", "openFile": f"{base}/saleena-open.mp4", "closeFile": f"{base}/saleena-close.mp4"},
    ]


def _as_list(value):
    if isinstance(value, list):
        return value
    if isinstance(value, dict) and (value.get("title") or value.get("script")):
        return [value]
    return []


def load_edition():
    with open(EDITION, encoding="utf-8") as f:
        raw = json.load(f)
    ed = {
        "date": raw.get("date") or datetime.now().strftime("%Y-%m-%d"),
        "opening": raw.get("opening") or OPENING,
        "closing": raw.get("closing") or CLOSING,
        "reader": raw.get("reader") if raw.get("reader") in {r["id"] for r in default_readers()} else "priya",
        "readers": default_readers(),
    }
    ed["dateLabel"] = date_label(ed["date"])
    flash = _as_list(raw.get("flash"))
    agile = _as_list(raw.get("agile"))
    if not isinstance(raw.get("flash"), list):
        for story in raw.get("stories") or []:
            title = (story.get("title") or "")
            bucket = agile if "AGILE" in title.upper() or "GUARD RETURNS" in title.upper() else flash
            bucket.append(story)
    ed["flash"] = [
        _item(s.get("title"), s.get("script"), s.get("media"), s.get("mediaType"), (s.get("card") or {}).get("note", "") or s.get("note"), s.get("kicker") or "Flash News")
        for s in flash if (s.get("title") or s.get("script"))
    ]
    ed["agile"] = [
        _item(s.get("title"), s.get("script") or s.get("lines"), s.get("media"), s.get("mediaType"), (s.get("card") or {}).get("note", ""))
        for s in agile if (s.get("title") or s.get("script") or s.get("lines"))
    ]
    jobs = raw.get("jobs") if isinstance(raw.get("jobs"), dict) else {}
    ed["jobs"] = {
        "script": jobs.get("script") or (
            "Join the Agile family. Build your career with us. "
            "Openings in multiple cities for hospital and health care services, "
            "facility management, and security services. "
            "Scan the QR and submit your expression of interest."
        ),
        "cities": jobs.get("cities") or ["Hyderabad", "Kakinada", "Mumbai", "Tadipatri", "Visakhapatnam"],
        "site": "www.securityjob.co.in",
        "media": jobs.get("media") or "",
        "mediaType": jobs.get("mediaType") or "",
    }
    ed["flashScroll"] = (raw.get("flashScroll") or "").strip()
    ed["weatherScroll"] = (raw.get("weatherScroll") or "").strip()
    ed["barLabel"] = (raw.get("barLabel") or "FLASH").strip() or "FLASH"
    ed["dayPart"] = (raw.get("dayPart") or "").strip()
    ed["missingGuard"] = raw.get("missingGuard") is True
    return ed


def save_edition(ed):
    clean = load_edition() if not isinstance(ed, dict) else ed
    # Trust the admin form, but keep the shape.
    out = {
        "date": clean.get("date") or datetime.now().strftime("%Y-%m-%d"),
        "opening": clean.get("opening") or OPENING,
        "closing": clean.get("closing") or CLOSING,
        "reader": clean.get("reader") if clean.get("reader") in {r["id"] for r in default_readers()} else "priya",
        "readers": default_readers(),
        "flash": clean.get("flash") if isinstance(clean.get("flash"), list) else [],
        "agile": clean.get("agile") if isinstance(clean.get("agile"), list) else [],
        "jobs": clean.get("jobs") if isinstance(clean.get("jobs"), dict) else {},
        "flashScroll": (clean.get("flashScroll") or "").strip(),
        "weatherScroll": (clean.get("weatherScroll") or "").strip(),
    }
    out["dateLabel"] = date_label(out["date"])
    with open(EDITION, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    return load_edition()


def build_parts(ed):
    parts = [{
        "id": "music-in",
        "label": "Opening music",
        "title": "AGILE GROUP SECURITY NEWS",
        "script": "",
        "music": "open",
        "anchor": False,
        "media": "",
        "mediaType": "",
        "card": {
            "crest": True,
            "place": "6:00 AM",
            "where": "AGILE GROUP",
            "note": "",
        },
    }, {
        "id": "open",
        "label": "Opening",
        "kicker": "NAMASKAR",
        "title": "GOOD MORNING. WELCOME TO THE MORNING AGILE GROUP NEWS",
        "script": ed.get("opening") or OPENING,
        "anchor": True,
        "media": "",
        "mediaType": "",
        "card": {
            "crest": True,
            "place": "GOOD MORNING",
            "where": "MORNING BULLETIN",
            "note": "",
        },
    }]
    flash = ed.get("flash") or {}
    if (flash.get("title") or "").strip() or (flash.get("script") or "").strip():
        line = (flash.get("title") or flash.get("script") or "").strip()
        parts.append({
            "id": "flash",
            "label": "Flash news",
            "kicker": "FLASH NEWS",
            "title": line,
            "script": (flash.get("script") or line).strip(),
            "anchor": False,
            "media": flash.get("media") or "",
            "mediaType": flash.get("mediaType") or "",
            "card": {"place": "FLASH", "where": "FLASH NEWS", "note": line},
        })
    for i, story in enumerate(ed.get("stories") or []):
        title = (story.get("title") or "").strip()
        script = (story.get("script") or title).strip()
        if not title and not script:
            continue
        kind = story.get("mediaType") or ""
        card = story.get("card")
        if kind not in ("image", "video"):
            kind = "headline"
            if not card:
                card = {"place": "BREAKING NEWS", "where": f"{i + 1:02d}", "note": title}
        parts.append({
            "id": f"story{i}",
            "label": f"Breaking news {i + 1}",
            "kicker": "BREAKING NEWS",
            "title": title,
            "script": script,
            "anchor": False,
            "media": story.get("media") or "",
            "mediaType": "" if kind == "headline" else kind,
            "card": card,
        })
    agile = ed.get("agile") or {}
    if (agile.get("title") or "").strip() or (agile.get("script") or "").strip():
        parts.append({
            "id": "agile",
            "label": "Agile Group news",
            "kicker": "AGILE NEWS",
            "title": (agile.get("title") or "AGILE GROUP NEWS").strip(),
            "script": (agile.get("script") or agile.get("title") or "").strip(),
            "anchor": False,
            "media": agile.get("media") or "",
            "mediaType": agile.get("mediaType") or "",
            "card": {
                "crest": True,
                "place": "AGILE GROUP NEWS",
                "where": "FROM THE COMPANY",
                "note": (agile.get("lines") or agile.get("script") or "").strip(),
            },
        })
    parts.append({
        "id": "end",
        "label": "Ending",
        "title": "THANK YOU FOR WATCHING AGILE GROUP SECURITY NEWS",
        "script": ed.get("closing") or CLOSING,
        "anchor": True,
        "media": "",
        "mediaType": "",
        "card": {"crest": True, "place": "THANK YOU", "where": "SECURITY NEWS", "note": "Follow Security News on WhatsApp"},
    })
    parts.append({
        "id": "music-out",
        "label": "Closing music",
        "title": "SECURITY NEWS RETURNS TOMORROW AT 6:00 AM",
        "script": "",
        "music": "close",
        "anchor": False,
        "media": "",
        "mediaType": "",
        "card": {"crest": True, "place": "SEE YOU TOMORROW", "where": "SECURITY NEWS", "note": "6:00 AM  ·  every morning"},
    })
    return parts


def pack_for(ed, weather=None):
    data = dict(ed)
    data["parts"] = build_parts(ed)
    if weather:
        data["weather"] = weather
    return data


def fetch_weather():
    lats = ",".join(str(c[1]) for c in CITIES)
    lons = ",".join(str(c[2]) for c in CITIES)
    url = (
        "https://api.open-meteo.com/v1/forecast?latitude=" + lats
        + "&longitude=" + lons
        + "&current=temperature_2m&timezone=Asia%2FKolkata"
    )
    try:
        with urllib.request.urlopen(url, timeout=20) as res:
            raw = json.loads(res.read().decode())
        rows = raw if isinstance(raw, list) else [raw]
        out = []
        for i, city in enumerate(CITIES):
            cur = (rows[i] or {}).get("current") or {}
            temp = cur.get("temperature_2m")
            out.append(city[0].upper() if temp is None else f"{city[0].upper()} {round(temp)}°")
        return out
    except Exception:
        return [c[0].upper() for c in CITIES]


def safe_media(url):
    if not url:
        return ""
    path = urlparse(url).path if "://" in url else url
    path = path.lstrip("/")
    if ".." in path.split("/"):
        return ""
    full = os.path.normpath(os.path.join(ROOT, path))
    if not full.startswith(ROOT):
        return ""
    return full if os.path.isfile(full) else ""


def _same_line(a, b):
    return re.sub(r"[^a-z0-9]+", "", (a or "").lower()) == re.sub(r"[^a-z0-9]+", "", (b or "").lower())


def _spoken(item):
    """Read the words given with the picture. Never the headline. Never the word Flash."""
    title = (item.get("title") or "").strip()
    raw = (item.get("script") or "").strip()
    if not raw or _same_line(raw, title):
        raw = (item.get("note") or "").strip()
    if _same_line(raw, title):
        raw = ""
    raw = re.sub(r"^(flash(\s+news)?)\b[:.\-–—,\s]*", "", raw, flags=re.I).strip()
    if re.fullmatch(r"flash(\s+news)?", raw, flags=re.I):
        return ""
    return raw


def _silence(dest, seconds):
    subprocess.run(
        [FFMPEG, "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", str(seconds), "-c:a", "aac", "-b:a", "192k", dest],
        capture_output=True, text=True,
    )


def _next_film_extras():
    try:
        with open(NEXT_FILM, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _clear_next_festival():
    data = _next_film_extras()
    if not data.get("festivalSafety"):
        return
    data["festivalSafety"] = False
    with open(NEXT_FILM, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def speak(text, dest):
    import edge_tts
    import time
    last = None
    for attempt in range(5):
        try:
            async def run():
                spoken = text.rstrip()
                if spoken and spoken[-1] not in ".!?":
                    spoken += "."
                com = edge_tts.Communicate(spoken + " ", VOICE, rate="-6%")
                await com.save(dest)
            asyncio.run(run())
            if os.path.isfile(dest) and os.path.getsize(dest) > 500:
                return
        except Exception as exc:
            last = exc
        time.sleep(3 + attempt * 3)
    raise RuntimeError("Her voice did not come through. Try again in a moment.")


def duration_of(path):
    proc = subprocess.run([FFMPEG, "-i", path], capture_output=True, text=True)
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", proc.stderr)
    if not match:
        return 8.0
    h, m, s = match.groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def make_ticker(lines, dest):
    from PIL import Image, ImageDraw, ImageFont
    text = "WEATHER:   " + "   •   ".join(lines) + "        "
    font = ImageFont.truetype(FONT, 36) if os.path.isfile(FONT) else ImageFont.load_default()
    probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    width = int(probe.textlength(text, font=font)) + 40
    width = max(width, TICKER_W + 10)
    if width % 2:
        width += 1
    img = Image.new("RGB", (width * 2, TICKER_H), (21, 101, 200))
    draw = ImageDraw.Draw(img)
    draw.text((20, 12), text, font=font, fill=(255, 255, 255))
    draw.text((width + 20, 12), text, font=font, fill=(255, 255, 255))
    img.save(dest)
    return width


def shot(part_index, dest, bare=False):
    url = f"http://127.0.0.1:8765/preview.html?render=1&part={part_index}"
    if bare:
        url += "&bare=1"
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", "--window-size=1920,1080",
        "--virtual-time-budget=9000", f"--screenshot={dest}", url,
    ], check=True, timeout=60)
    from PIL import Image
    im = Image.open(dest).convert("RGB")
    if im.size != (1920, 1080):
        im = im.resize((1920, 1080), Image.Resampling.LANCZOS)
        im.save(dest)


def logo_filter(index):
    return (
        f"[{index}:v]fps=25,crop=780:720:248:0,scale=-2:{LOGO_H},"
        "colorkey=0xFAF7F9:0.14:0.02,format=rgba,setpts=PTS-STARTPTS[lg];"
    )


def person_filter(lips_index, mask_index):
    return (
        f"[{lips_index}:v]fps=25,setpts=PTS-STARTPTS,tpad=start_duration=0.25:start_mode=clone,"
        f"scale={PERSON_W}:{PERSON_H}:flags=lanczos,format=rgba[ps];"
        f"[{mask_index}:v]scale={PERSON_W}:{PERSON_H},format=rgba,alphaextract[pa];"
        f"[ps][pa]alphamerge,crop={PERSON_W}:{PERSON_VIS}:0:0,setpts=PTS-STARTPTS[person];"
        f"[v][person]overlay={PERSON_X}:{PERSON_Y}:eof_action=repeat[vp];"
    )


def encode_part(frame, audio, ticker, dest, video_path, dur, lips_path=""):
    cmd = [FFMPEG, "-y"]
    if video_path:
        cmd += ["-stream_loop", "-1", "-i", video_path]
    cmd += ["-loop", "1", "-i", frame, "-loop", "1", "-i", ticker, "-i", audio]
    logo_loops = max(2, int(dur / 4) + 2)
    cmd += ["-stream_loop", str(logo_loops), "-i", LOGO_VIDEO]
    if lips_path:
        cmd += ["-i", lips_path, "-loop", "1", "-i", CUTOUT]
    if video_path:
        graph = (
            f"[0:v]scale={WIN[2]}:{WIN[3]}:force_original_aspect_ratio=increase,"
            f"crop={WIN[2]}:{WIN[3]},fps=25,setpts=PTS-STARTPTS[vid];"
            "[1:v]scale=1920:1080,fps=25,format=rgba,colorkey=0xFF00FF:0.12:0.0[fg];"
            f"[vid][fg]overlay={WIN[0]}:{WIN[1]}[with];"
            f"[2:v]fps=25,crop={TICKER_W}:{TICKER_H}:x='mod(t*80,iw/2)':y=0[tk];"
            f"[with][tk]overlay={TICKER_X}:{TICKER_Y}[v];"
            + (person_filter(5, 6) if lips_path else "")
            + logo_filter(4)
            + f"[{'vp' if lips_path else 'v'}][lg]overlay={LOGO_X}:{LOGO_Y}:eof_action=repeat[outv];"
            "[3:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay=250|250,apad=pad_dur=0.35[a]"
        )
    else:
        graph = (
            "[0:v]scale=1920:1080,fps=25[base];"
            f"[1:v]fps=25,crop={TICKER_W}:{TICKER_H}:x='mod(t*80,iw/2)':y=0[tk];"
            f"[base][tk]overlay={TICKER_X}:{TICKER_Y}[v];"
            + (person_filter(4, 5) if lips_path else "")
            + logo_filter(3)
            + f"[{'vp' if lips_path else 'v'}][lg]overlay={LOGO_X}:{LOGO_Y}:eof_action=repeat[outv];"
            "[2:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay=250|250,apad=pad_dur=0.35[a]"
        )
    cmd += [
        "-filter_complex", graph, "-map", "[outv]", "-map", "[a]",
        "-t", f"{dur:.2f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", "25",
        "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
        "-movflags", "+faststart", dest,
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    except subprocess.TimeoutExpired:
        raise RuntimeError("The picture took too long to join. Try again.")
    if proc.returncode != 0:
        tail = (proc.stderr or "")[-800:]
        raise RuntimeError("The picture could not be joined to her voice. " + tail)


def set_job(**kwargs):
    with JOB_LOCK:
        JOB.update(kwargs)


HEADINGS = {
    "flash news": "FLASH NEWS",
    "agile news": "AGILE NEWS",
    "job vacancies": "JOB VACANCIES",
    "announcement": "ANNOUNCEMENT",
    "public notice": "ANNOUNCEMENT",
    "police notice": "ANNOUNCEMENT",
    "weather alert": "FLASH NEWS",
    "cyclone warning": "CYCLONE WARNING",
    "cyclone update": "CYCLONE UPDATE",
    "special bulletin": "SPECIAL BULLETIN",
    "daily news": "DAILY NEWS",
    "deepavali wish": "HAPPY DEEPAVALI",
    "weather report": "WEATHER REPORT",
    "gold rate": "GOLD RATE",
}


def _kicker(value, fallback):
    return HEADINGS.get((value or "").strip().lower(), fallback)


def _owned_picture(text):
    """Only pictures we already have. Nothing is taken from the news sites."""
    t = (text or "").lower()
    rules = [
        (["rain", "weather", "storm", "thunder", "cyclone", "fishermen", "imd", "heavy rain"], "assets/rain.jpg"),
        (["guard", "agile team", "parade", "sindhu", "security team", "festive", "pooja", "ayudha"], "assets/parade.jpg"),
    ]
    for words, rel in rules:
        if any(re.search(r"\b" + re.escape(word) + r"\b", t) for word in words):
            return safe_media(rel)
    return ""


def _library_file(name):
    name = os.path.basename(name)
    for rel in (
        os.path.join(ROOT, "assets", name),
        os.path.join(os.path.dirname(ROOT), "public", "security-news", "library", name),
    ):
        if os.path.isfile(rel):
            return rel
    return ""


def _fetch_media(url, kind):
    url = (url or "").strip()
    if not url:
        return ""
    if url.startswith("lib:"):
        return _library_file(url[4:])
    if re.fullmatch(r"[A-Za-z0-9]{6,40}", url):
        return _fetch_media(f"https://www.agilegroup-digital.co.in/api/pulse/image?id={url}", kind or "image")
    if url.startswith("assets/") or url.startswith("uploads/"):
        return safe_media(url)
    if url.startswith("data:image"):
        os.makedirs(UPLOADS, exist_ok=True)
        dest = os.path.join(UPLOADS, "pasted-" + datetime.now().strftime("%H%M%S%f") + ".jpg")
        try:
            import base64
            payload = url.split(",", 1)[1]
            open(dest, "wb").write(base64.b64decode(payload))
        except Exception:
            return ""
        return dest if os.path.isfile(dest) else ""
    if url.startswith("http://") or url.startswith("https://"):
        ext = ".mp4" if kind == "video" or ".mp4" in url.lower() else ".jpg"
        dest = os.path.join(UPLOADS, "saved-" + re.sub(r"[^a-z0-9]+", "", url.lower())[-28:] + ext)
        if os.path.isfile(dest) and os.path.getsize(dest) > 1000:
            return dest
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AgileSecurityNews/1.0"})
            with urllib.request.urlopen(req, timeout=60) as res:
                open(dest, "wb").write(res.read())
        except Exception:
            return ""
        return dest if os.path.isfile(dest) else ""
    return ""


def _media_for(item, old):
    video = _fetch_media(item.get("videoId") or "", "video")
    if video:
        return os.path.relpath(video, ROOT) if video.startswith(ROOT) else video, "video"
    image = _fetch_media(item.get("imageId") or "", "image")
    if image:
        return os.path.relpath(image, ROOT) if image.startswith(ROOT) else image, "image"
    media = (item.get("media") or "").strip()
    if media and safe_media(media):
        return media, item.get("mediaType") or "image"
    if old and safe_media(old.get("media") or ""):
        return old.get("media") or "", old.get("mediaType") or "image"
    blob = f"{item.get('title') or ''} {item.get('script') or ''}"
    owned = _owned_picture(blob)
    if owned:
        return os.path.relpath(owned, ROOT), "image"
    return "", ""


def _ensure_flash_pictures():
    """Each flash story gets a picture we are allowed to show. An incident is not drawn."""
    with open(EDITION, encoding="utf-8") as f:
        raw = json.load(f)
    changed = False
    for item in raw.get("flash") or []:
        if (item.get("media") or "").strip().lower() == "none":
            continue
        if safe_media(item.get("media") or ""):
            continue
        blob = f"{item.get('title') or ''} {item.get('script') or ''}"
        owned = _owned_picture(blob)
        if not owned:
            continue
        item["media"] = os.path.relpath(owned, ROOT)
        item["mediaType"] = "image"
        changed = True
    if changed:
        with open(EDITION, "w", encoding="utf-8") as f:
            json.dump(raw, f, ensure_ascii=False, indent=2)


def _apply_page_edition(raw):
    try:
        current = json.load(open(EDITION, encoding="utf-8"))
    except Exception:
        current = {}
    old = {}
    for item in list(current.get("flash") or []) + list(current.get("agile") or []):
        if item.get("id"):
            old[item["id"]] = item

    def rows(key, kicker):
        out = []
        for item in raw.get(key) or []:
            if not isinstance(item, dict):
                continue
            if not (item.get("title") or item.get("script")):
                continue
            media, kind = _media_for(item, old.get(item.get("id") or ""))
            out.append({
                "id": item.get("id") or datetime.now().strftime("%H%M%S%f"),
                "title": item.get("title") or "",
                "script": item.get("script") or "",
                "note": item.get("note") or "",
                "media": media,
                "mediaType": kind,
                "kicker": item.get("kicker") or kicker,
            })
        return out

    jobs_in = raw.get("jobs") if isinstance(raw.get("jobs"), dict) else {}
    jobs_old = current.get("jobs") if isinstance(current.get("jobs"), dict) else {}
    save_edition({
        "date": raw.get("date") or current.get("date"),
        "opening": current.get("opening") or OPENING,
        "closing": current.get("closing") or CLOSING,
        "reader": raw.get("reader") or current.get("reader") or "priya",
        "flash": rows("flash", "Flash News"),
        "agile": rows("agile", "Agile News"),
        "jobs": {
            "script": jobs_in.get("script") or jobs_old.get("script") or "",
            "cities": jobs_in.get("cities") or jobs_old.get("cities") or [
                "Hyderabad", "Kakinada", "Mumbai", "Tadipatri", "Visakhapatnam"
            ],
            "site": "www.securityjob.co.in",
            "media": jobs_old.get("media") or "",
            "mediaType": jobs_old.get("mediaType") or "",
        },
        "flashScroll": raw.get("flashScroll") or "",
        "weatherScroll": raw.get("weatherScroll") or "",
    })


READER_TURN = ["saleena", "priya", "nalini", "reshma"]


def _rotation_path():
    return os.path.join(ROOT, "reader-rotation.json")


def _last_reader():
    try:
        with open(_rotation_path(), encoding="utf-8") as f:
            last = json.load(f).get("last") or ""
    except Exception:
        last = ""
    return last if last in READER_TURN else "reshma"


def next_reader_id():
    """The next film uses the next reader. Order: Saleena, Priya, Nalini, Reshma."""
    last = _last_reader()
    return READER_TURN[(READER_TURN.index(last) + 1) % len(READER_TURN)]


def _save_reader_turn(reader_id):
    if reader_id not in READER_TURN:
        return
    with open(_rotation_path(), "w", encoding="utf-8") as f:
        json.dump({"last": reader_id}, f)


def _news_stamp(ed):
    """30-10-2026 Morning News, or Evening News, on every film."""
    raw = (ed.get("date") or "").strip()
    parts = raw.split("-")
    if len(parts) == 3 and all(part.isdigit() for part in parts):
        stamp = f"{int(parts[2]):02d}-{int(parts[1]):02d}-{parts[0]}"
    else:
        stamp = raw or "the"
    opening = (ed.get("opening") or "").lower()
    part = (ed.get("dayPart") or "").lower()
    kind = "Evening News" if part.startswith("even") or "evening" in opening else "Morning News"
    return f"{stamp} {kind}"


def _reader_paths(ed):
    chosen = ed.get("reader") or "priya"
    for reader in default_readers():
        if reader.get("id") == chosen:
            return safe_media(reader.get("openFile") or ""), safe_media(reader.get("closeFile") or "")
    return "", ""


def _note_for(item):
    note = (item.get("note") or "").strip()
    if note:
        return note
    script = (item.get("script") or "").strip()
    parts = re.split(r"(?<=[.])\s+", script)
    out = ""
    for part in parts:
        trial = (out + " " + part).strip()
        if out and len(trial) > 260:
            break
        out = trial
    return out or script


def _whatsapp_copy(src, dest):
    """A small copy WhatsApp groups can send. The full film is left as it is."""
    proc = subprocess.run(
        [
            FFMPEG, "-y", "-i", src,
            "-vf", "scale=640:360:flags=lanczos,pad=640:368:0:4:black",
            "-c:v", "libx264", "-profile:v", "baseline", "-level", "3.0",
            "-preset", "veryfast", "-bf", "0",
            "-b:v", "380k", "-maxrate", "450k", "-bufsize", "800k",
            "-pix_fmt", "yuv420p", "-r", "24",
            "-c:a", "aac", "-b:a", "64k", "-ac", "2", "-ar", "44100",
            "-movflags", "+faststart", dest,
        ],
        capture_output=True, text=True,
    )
    if proc.returncode != 0 or not os.path.isfile(dest):
        raise RuntimeError("The small film for WhatsApp could not be made.")


def _news_clock():
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
    except Exception:
        now = datetime.now()
    hour = now.strftime("%I").lstrip("0") or "12"
    return f"{hour}.{now.strftime('%M %p')}"


def _film_name(ed):
    """Date first, then the time, like 5 Nov-6.58 am. The Director reads it this way."""
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
    except Exception:
        now = datetime.now()
    try:
        y, m, d = [int(x) for x in (ed.get("date") or "").split("-")]
        day = datetime(y, m, d)
    except Exception:
        day = now
    hour = now.strftime("%I").lstrip("0") or "12"
    return f"{day.day} {day.strftime('%b')}-{hour}.{now.strftime('%M')} {now.strftime('%p').lower()}"


def _pack_headlines(ed, limit=4):
    out = []
    for item in ed.get("flash") or []:
        title = str(item.get("title") or "").strip()
        kicker = str(item.get("kicker") or "").strip().lower()
        if not title or "government guidelines" in title.lower() or kicker in {"weather report", "gold rate"}:
            continue
        out.append(title)
        if len(out) >= limit:
            break
    return out


def _film_date_line(ed):
    raw = (ed.get("date") or "").strip()
    part = "Evening News" if str(ed.get("dayPart") or "").lower() == "evening" else "Morning News"
    try:
        y, m, d = [int(x) for x in raw.split("-")]
        return f"{d:02d}-{m:02d}-{y} {part}"
    except Exception:
        return raw


def _write_youtube_pack(folder, ed, folder_name):
    """Short + thumbnails + YouTube words in the same folder. QR high on the Short. No Tanish. Do not upload."""
    qr_path = os.path.join(ROOT, "assets", "register-qr-agile.png")
    date_line = _film_date_line(ed)
    headlines = _pack_headlines(ed)
    photo = ""
    for item in ed.get("flash") or []:
        media = str(item.get("media") or "").strip()
        kind = str(item.get("mediaType") or "").strip().lower()
        title = str(item.get("title") or "")
        kicker = str(item.get("kicker") or "").strip().lower()
        if not media or kind != "image" or "government guidelines" in title.lower() or kicker in {"weather report", "gold rate"}:
            continue
        photo = media if os.path.isabs(media) else os.path.join(ROOT, media)
        break
    short_thumb = os.path.join(BUILD, "short-thumb.png")
    show.short_register_card(short_thumb, qr_path, date_line, headlines, still_logo=True, photo_path=photo)
    short_png = os.path.join(BUILD, "short-card.png")
    show.short_register_card(short_png, qr_path, date_line, headlines, still_logo=not os.path.isfile(LOGO_VIDEO), photo_path=photo)
    short_voice = os.path.join(BUILD, "short-voice.mp3")
    hook = headlines[0] if headlines else "Today's news"
    more = ". ".join(headlines[1:3])
    speak(
        hook + ". " + (more + ". " if more else "") + "Watch the full news. Job openings. Register now. Scan this code.",
        short_voice,
    )
    short_mp4 = os.path.join(BUILD, "Short.mp4")
    hold = max(show._dur(FFMPEG, short_voice) + 0.8, 8.0)
    cmd = [
        FFMPEG, "-y",
        "-loop", "1", "-t", f"{hold:.2f}", "-i", short_png,
        "-i", short_voice,
        "-filter_complex", show._clear_voice(1),
        "-map", "0:v", "-map", "[a]", "-t", f"{min(hold, 58):.2f}",
        *show._yt_video(),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-movflags", "+faststart", short_mp4,
    ]
    if os.path.isfile(LOGO_VIDEO):
        loops = show._loops_for(FFMPEG, short_voice, LOGO_VIDEO)
        cmd = [
            FFMPEG, "-y",
            "-loop", "1", "-t", f"{hold:.2f}", "-i", short_png,
            "-stream_loop", str(loops), "-i", LOGO_VIDEO,
            "-i", short_voice,
            "-filter_complex",
            show._logo(FFMPEG, 1)
            + "[0:v]fps=25,format=rgba[base];[base][lg]overlay=(1080-w)/2:16:eof_action=repeat[v];"
            + show._clear_voice(2),
            "-map", "[v]", "-map", "[a]", "-t", f"{min(hold, 58):.2f}",
            *show._yt_video(),
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
            "-movflags", "+faststart", short_mp4,
        ]
    show._run_picture(cmd)
    shutil.copy2(short_mp4, os.path.join(folder, "Short.mp4"))
    from PIL import Image
    Image.open(short_thumb).convert("RGB").save(os.path.join(folder, "Short Thumbnail.jpg"), quality=92)
    show.curiosity_thumbnail(
        os.path.join(folder, "Thumbnail.jpg"),
        headlines[0] if headlines else date_line,
        photo,
        date_line,
    )
    words = os.path.join(folder, "YouTube words.txt")
    title = date_line
    for i, line in enumerate(headlines[:3]):
        trial = title + (" | " if i == 0 else ", ") + line
        if len(trial) > 100:
            break
        title = trial
    desc = [
        date_line,
        "",
        "Agile Group Security News.",
        "",
        " ".join(h.rstrip(".") + "." for h in _pack_headlines(ed, 8)),
        "",
        "Always follow Government Guidelines.",
        "",
        "Join the Agile family. Build your career with us. Openings in multiple cities for hospital and health care services, facility management, and security services. Scan the QR and submit your expression of interest.",
        "Register for Job - www.securityjob.co.in",
        "Our services - www.agilegroup.co.in",
    ]
    tag = ", ".join([date_line, "Agile Group Security News"] + headlines[:3] + ["Register Now"])
    with open(words, "w", encoding="utf-8") as f:
        f.write("TITLE\n" + title + "\n\nDESCRIPTION\n" + "\n".join(desc) + "\n\nTAGLINE\n" + tag + "\n")


def _add_missing_guard_card(add_clip):
    """Full-screen missing-guard poster, last item before the job card. Do not speak 9248707070."""
    poster = os.path.join(ROOT, "uploads", "missing-guard-youtube.jpg")
    if not os.path.isfile(poster):
        return
    set_job(message="Adding the missing security guard.")
    voice = os.path.join(BUILD, "missing-guard.mp3")
    speak(
        "One of our security guards is missing. His name is Tanish Kumar Singh. "
        "He is missing from his room in Gachibowli, Hyderabad. "
        "He was last seen on the 4th of October 2026. "
        "Please call the numbers on the screen if you have seen him.",
        voice,
    )
    spoken = show._dur(FFMPEG, voice)
    stay = max(spoken + 0.8, 12.0)
    clip = os.path.join(BUILD, "missing-guard.mp4")
    show._run_picture([
        FFMPEG, "-y",
        "-loop", "1", "-i", poster,
        "-i", voice,
        "-vf", "scale=1920:1080:flags=lanczos,format=yuv420p,fps=25",
        "-af", "apad",
        *show._yt_video(),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-t", f"{stay:.2f}",
        "-movflags", "+faststart", clip,
    ])
    add_clip(clip)


def render_job():
    try:
        os.makedirs(BUILD, exist_ok=True)
        _ensure_flash_pictures()
        ed = load_edition()
        clips = []
        n = 0

        def add_clip(path):
            nonlocal n
            clips.append(path)
            n += 1

        flash_line = (ed.get("flashScroll") or "").strip()
        weather_line = (ed.get("weatherScroll") or "").strip()
        if not flash_line:
            titles = []
            for item in ed.get("flash") or []:
                title = (item.get("title") or "").strip()
                if title and title.lower() != "weather report":
                    titles.append(title)
            flash_line = "   ◆   ".join(titles)
        if not weather_line:
            weather_bits = []
            for item in list(ed.get("flash") or []) + list(ed.get("agile") or []):
                blob = f"{item.get('title') or ''} {item.get('script') or ''}".lower()
                if any(word in blob for word in ("rain", "weather", "storm", "thunder", "cyclone", "imd")):
                    line = (item.get("script") or item.get("title") or "").strip()
                    if line and line.lower() != "weather report":
                        weather_bits.append(line)
            weather_line = "   ◆   ".join(weather_bits)
        ed["reader"] = next_reader_id()
        open_path, close_path = _reader_paths(ed)
        stamp = _news_stamp(ed)
        ed["dateLabel"] = stamp
        if flash_line and not flash_line.startswith(stamp):
            flash_line = stamp + ". " + flash_line
        show.prepare_tickers(
            BUILD,
            flash_line,
            weather_line,
            stamp,
            ed.get("barLabel") or "FLASH",
        )
        if open_path:
            set_job(message="Adding the opening reader.")
            dest = os.path.join(BUILD, "open-reader.mp4")
            show.encode_reader(FFMPEG, open_path, dest, screen_line=show.DAILY_SCREEN_LINE)
            add_clip(dest)

        first_flash = True

        def speak_item(kind, item, fallback):
            nonlocal first_flash
            title = (item.get("title") or "").strip()
            spoken = _spoken(item)
            if title.lower() == "weather report" and not (item.get("media") or "").strip():
                return
            if not title and not spoken:
                return
            kicker = _kicker(item.get("kicker"), fallback)
            head_line = show.story_heading(title, spoken)
            set_job(message=f"Preparing {head_line[:60]}")
            voice = os.path.join(BUILD, f"{kind}-{n:02d}.mp3")
            if spoken:
                speak(spoken, voice)
            else:
                _silence(voice, 6)
            frame = os.path.join(BUILD, f"{kind}-{n:02d}.png")
            clip = os.path.join(BUILD, f"{kind}-{n:02d}.mp4")
            head = os.path.join(BUILD, f"{kind}-{n:02d}-head.png")
            flash_line_now = head_line
            if first_flash and stamp and not flash_line_now.lower().startswith(stamp.lower()):
                flash_line_now = stamp + ". " + head_line
            first_flash = False
            show.prepare_tickers(BUILD, flash_line_now, weather_line, stamp, "FLASH")
            show.heading_strip(head_line, head)
            forced_blank = (item.get("media") or "").strip().lower() == "none"
            media = "" if forced_blank else (safe_media(item.get("media") or "") or _owned_picture(title + " " + spoken))
            kind_media = item.get("mediaType") or ""
            if not item.get("media") and media:
                kind_media = "image"
            if kind_media == "poster" and media:
                show.poster_card(media, frame)
                show.encode_still(FFMPEG, frame, voice, LOGO_VIDEO, clip, "", scroll=False, min_hold=10)
            elif kind_media == "video" and media:
                show.news_card_hole(kicker, title, spoken, frame)
                show.encode_window_video(FFMPEG, frame, media, voice, LOGO_VIDEO, clip, head)
            else:
                photo = media if kind_media == "image" else ""
                show.news_card(kicker, title, spoken, frame, photo)
                show.encode_still(FFMPEG, frame, voice, LOGO_VIDEO, clip, head)
            add_clip(clip)

        for item in ed.get("flash") or []:
            speak_item("flash", item, "FLASH NEWS")
        for item in ed.get("agile") or []:
            speak_item("agile", item, "AGILE NEWS")

        if ed.get("missingGuard") is True:
            _add_missing_guard_card(add_clip)

        if ed.get("wageSlip"):
            set_job(message="Adding the wage slip QR.")
            wage_qr = os.path.join(ROOT, "assets", "wage-slip-qr.png")
            wage_voice = os.path.join(BUILD, "wage-slip.mp3")
            speak("Download your wage slip on your phone. Scan this code. It is last month's wage slip.", wage_voice)
            wage_frame = os.path.join(BUILD, "wage-slip-card.png")
            wage_clip = os.path.join(BUILD, "wage-slip.mp4")
            wage_head = os.path.join(BUILD, "wage-slip-head.png")
            show.heading_strip("WAGE SLIP", wage_head)
            show.wage_slip_card(wage_frame, wage_qr)
            show.encode_still(FFMPEG, wage_frame, wage_voice, LOGO_VIDEO, wage_clip, wage_head, min_hold=8)
            add_clip(wage_clip)

        if _next_film_extras().get("festivalSafety"):
            set_job(message="Adding the festival safety alert.")
            poster = os.path.join(ROOT, "assets", "festival-safety-alert.jpg")
            fest_voice = os.path.join(BUILD, "festival.mp3")
            speak(
                "Festival safety alert. Attention, all security guards and facility attendants. "
                "No crackers inside the premises. Do not allow anyone to carry crackers, fireworks or sparklers "
                "into any bank, ATM, cash hub or office under our protection. "
                "During Deepavali, staff, visitors and workers may try to bring crackers into the workplace. "
                "Crackers are a serious fire and explosion risk near cash, documents, servers and fuel. "
                "Be vigilant at every gate. Politely check bags and parcels at the entry point. "
                "Firmly refuse entry of crackers. No exceptions for anyone. "
                "Inform your supervisor or the operations team immediately. "
                "Report every incident or attempt immediately. Do not wait for the end of the shift. "
                "The control room number is on the screen.",
                fest_voice,
            )
            fest_frame = os.path.join(BUILD, "festival-card.png")
            fest_clip = os.path.join(BUILD, "festival-card.mp4")
            show.poster_card(poster, fest_frame)
            show.encode_still(FFMPEG, fest_frame, fest_voice, LOGO_VIDEO, fest_clip, "", scroll=False, min_hold=8)
            add_clip(fest_clip)
            set_job(message="Adding the slide for our guards.")
            guard_voice = os.path.join(BUILD, "guards-order.mp3")
            speak(
                "To our security guards. This Deepavali order is for you. "
                "Check every bag at the gate. "
                "Stop anyone with crackers. No exceptions. "
                "Report at once, and stay on your post.",
                guard_voice,
            )
            guard_frame = os.path.join(BUILD, "guards-order.png")
            guard_clip = os.path.join(BUILD, "guards-order.mp4")
            show.guards_order_card(guard_frame, os.path.join(ROOT, "uploads", "m7-guard.jpg"))
            show.encode_still(FFMPEG, guard_frame, guard_voice, LOGO_VIDEO, guard_clip, "", scroll=False, min_hold=8)
            add_clip(guard_clip)

        set_job(message="Adding the hiring card.")
        hire_qr = os.path.join(ROOT, "assets", "register-qr-agile.png")
        hire_voice = os.path.join(BUILD, "hiring.mp3")
        speak(
            "Agile Security Force Private Limited is hiring across multiple categories in Security Services, Facility Management, and Healthcare and Hospitality. Register now.",
            hire_voice,
        )
        hire_frame = os.path.join(BUILD, "hiring-card.png")
        hire_clip = os.path.join(BUILD, "hiring-card.mp4")
        show.hiring_register_card(hire_frame, hire_qr)
        show.encode_still(FFMPEG, hire_frame, hire_voice, LOGO_VIDEO, hire_clip, "", scroll=False, min_hold=12)
        add_clip(hire_clip)

        thought = thoughts.thought_for(ed.get("date") or "")
        set_job(message="Adding the thought for the day.")
        voice = os.path.join(BUILD, "thought.mp3")
        speak(f"{thought['thought']} {thought['takeaway']}", voice)
        frame = os.path.join(BUILD, "thought.png")
        clip = os.path.join(BUILD, "thought.mp4")
        head = os.path.join(BUILD, "thought-head.png")
        show.heading_strip(thoughts.HEADING, head)
        show.thought_card(thought["thought"], thought["takeaway"], thought["theme"], frame)
        show.encode_still(FFMPEG, frame, voice, LOGO_VIDEO, clip, head)
        add_clip(clip)

        if close_path:
            set_job(message="Adding the closing reader.")
            dest = os.path.join(BUILD, "close-reader.mp4")
            show.encode_reader(FFMPEG, close_path, dest)
            add_clip(dest)

        if not clips:
            raise RuntimeError("There is nothing to make yet. Add a news item first.")
        set_job(message="Joining the film.")
        lst = os.path.join(BUILD, "list.txt")
        with open(lst, "w", encoding="utf-8") as f:
            for clip in clips:
                f.write("file '" + os.path.basename(clip).replace("'", "'\\''") + "'\n")
        final = os.path.join(BUILD, "check.mp4")
        proc = subprocess.run(
            [FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", final],
            capture_output=True, text=True, cwd=BUILD,
        )
        if proc.returncode != 0 or not os.path.isfile(final):
            raise RuntimeError("The parts did not join into one film.")
        desktop = os.path.expanduser("~/Desktop")
        folder_name = _film_name(ed)
        folder = os.path.join(desktop, folder_name)
        os.makedirs(folder, exist_ok=True)
        full_path = os.path.join(folder, f"{folder_name}.mp4")
        shutil.copy2(final, full_path)
        _clear_next_festival()
        _save_reader_turn(ed.get("reader") or "")
        _write_youtube_pack(folder, ed, folder_name)
        set_job(
            state="done",
            message=f"The clear film is on the Desktop: {folder_name}. It is not on YouTube yet.",
            video="/build/check.mp4",
        )
    except Exception as exc:
        set_job(state="error", message=str(exc)[:700], video="")


def pull_security_news():
    req = urllib.request.Request(PULSE_URL, headers={"User-Agent": "AgileSecurityNews/1.0"})
    with urllib.request.urlopen(req, timeout=25) as res:
        page = res.read().decode("utf-8", "replace")
    titles = re.findall(
        r'font-size:14px;font-weight:700;color:#111827;line-height:1\.5;">(.*?)</div>',
        page,
    )
    items = []
    seen = set()
    for raw in titles:
        title = html.unescape(re.sub(r"<[^>]+>", "", raw)).strip()
        if not title or title in seen:
            continue
        seen.add(title)
        items.append(_item(title, title))
        if len(items) >= 8:
            break
    if not items:
        raise RuntimeError("Today's Security News did not give any headlines. You can type them in.")
    return items


def pull_job_cities():
    req = urllib.request.Request(JOBS_URL, headers={"User-Agent": "AgileSecurityNews/1.0"})
    with urllib.request.urlopen(req, timeout=25) as res:
        page = res.read().decode("utf-8", "replace")
    found = re.findall(r"📍\s*([^<\n]+)", page)
    cities = []
    for raw in found:
        place = html.unescape(raw).strip().strip(".")
        city = place.split(",")[0].strip()
        city = re.sub(r"\s+", " ", city)
        if not city or city in cities or len(city) > 40:
            continue
        # Keep a city name, not a long site description.
        if "Pan India" in city or "Operations" in city:
            continue
        cities.append(city)
    if not cities:
        raise RuntimeError("The job page did not list any cities. You can type them in.")
    return cities[:8]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        return

    def _cors(self):
        origin = self.headers.get("Origin") or "*"
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def send_json(self, code, obj):
        raw = json.dumps(obj).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/":
            self.path = "/desk.html"
            return super().do_GET()
        if path == "/api/edition":
            return self.send_json(200, load_edition())
        if path == "/api/download":
            src = os.path.join(BUILD, "check.mp4")
            if not os.path.isfile(src):
                return self.send_json(404, {"error": "Make the video first."})
            data = open(src, "rb").read()
            self.send_response(200)
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Content-Disposition", 'attachment; filename="Security-News.mp4"')
            self.end_headers()
            self.wfile.write(data)
            return
        if path == "/api/status":
            with JOB_LOCK:
                return self.send_json(200, dict(JOB))
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length > 250_000_000:
            return self.send_json(413, {"error": "That file is too large."})
        if path == "/api/save":
            ed = json.loads(self.rfile.read(length).decode() or "{}")
            saved = save_edition(ed)
            return self.send_json(200, pack_for(saved))
        if path == "/api/upload":
            name = self.headers.get("X-Filename", "file")
            ext = os.path.splitext(name)[1].lower()
            if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov", ".webm", ".m4v"}:
                return self.send_json(400, {"error": "Please choose a picture or a video."})
            os.makedirs(UPLOADS, exist_ok=True)
            fn = datetime.now().strftime("%Y%m%d%H%M%S") + "-" + re.sub(r"[^a-zA-Z0-9._-]", "", os.path.basename(name))
            dest = os.path.join(UPLOADS, fn)
            with open(dest, "wb") as f:
                remaining = length
                while remaining:
                    chunk = self.rfile.read(min(1024 * 1024, remaining))
                    if not chunk:
                        break
                    f.write(chunk)
                    remaining -= len(chunk)
            kind = "video" if ext in {".mp4", ".mov", ".webm", ".m4v"} else "image"
            return self.send_json(200, {"url": "/uploads/" + fn, "mediaType": kind})
        if path == "/api/speak":
            body = json.loads(self.rfile.read(length).decode() or "{}")
            text = (body.get("text") or "").strip() or OPENING
            os.makedirs(BUILD, exist_ok=True)
            dest = os.path.join(BUILD, "hear.mp3")
            try:
                speak(text[:1200], dest)
            except Exception as exc:
                return self.send_json(500, {"error": str(exc)})
            return self.send_json(200, {"url": "/build/hear.mp3"})
        if path == "/api/render":
            raw_body = self.rfile.read(length).decode() or ""
            body = {}
            if raw_body.strip():
                try:
                    body = json.loads(raw_body)
                except Exception:
                    body = {}
            if isinstance(body.get("edition"), dict):
                _apply_page_edition(body["edition"])
            with JOB_LOCK:
                if JOB.get("state") == "running":
                    return self.send_json(200, dict(JOB))
                JOB.update(state="running", message="Starting.", video="")
            threading.Thread(target=render_job, daemon=True).start()
            return self.send_json(200, {"state": "running", "message": "Starting."})
        if path == "/api/pull-news":
            self.rfile.read(length)
            try:
                return self.send_json(200, {"items": pull_security_news()})
            except Exception as exc:
                return self.send_json(500, {"error": str(exc)[:300]})
        if path == "/api/pull-jobs":
            self.rfile.read(length)
            try:
                return self.send_json(200, {"cities": pull_job_cities()})
            except Exception as exc:
                return self.send_json(500, {"error": str(exc)[:300]})
        if path == "/api/ready":
            self.rfile.read(length)
            src = os.path.join(BUILD, "check.mp4")
            if not os.path.isfile(src):
                return self.send_json(400, {"error": "There is no film to keep yet. Make the video first."})
            os.makedirs(READY, exist_ok=True)
            ed = load_edition()
            name = f"Security-News-{ed.get('date', 'bulletin')}.mp4"
            shutil.copy2(src, os.path.join(READY, name))
            with open(os.path.join(READY, "STATUS.txt"), "w", encoding="utf-8") as f:
                f.write(f"{name}\nChecked and kept ready for YouTube.\nNot uploaded.\n")
            return self.send_json(200, {
                "message": f"Kept ready: {name}. It has not been put on YouTube."
            })
        return self.send_json(404, {"error": "Not found"})


def main():
    os.makedirs(BUILD, exist_ok=True)
    os.makedirs(READY, exist_ok=True)
    os.makedirs(UPLOADS, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
    print("Security News desk is on http://127.0.0.1:8765/")
    server.serve_forever()


if __name__ == "__main__":
    main()
