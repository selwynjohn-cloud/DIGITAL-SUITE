# -*- coding: utf-8 -*-
"""Build per-language Integrity examples from existing FA copy + short AML snippets."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path("/Users/godblessyou/agilgroup-digital")
SCRIPTS = ROOT / "scripts"
OUT = ROOT / "api/_lib/training/fa-advisory-native.ts"
I18N = ROOT / "api/_lib/training/fa-i18n.ts"
LANGS = ["te", "ta", "kn", "ml", "mr", "as", "gu", "bn", "pa", "or"]


def load_json(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    raw = json.dumps(data, ensure_ascii=False)
    if "\ufffd" in raw:
        raise SystemExit(f"replacement char in {path}")
    return data


def merge_glob(pattern: str) -> dict:
    out: dict[str, str] = {}
    for p in sorted(SCRIPTS.glob(pattern)):
        out.update(load_json(p))
    return out


def join(*parts: str) -> str:
    return " ".join(p.strip() for p in parts if p and p.strip())


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def sq(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def parse_fa_copies(text: str) -> dict[str, dict]:
    copies: dict[str, dict] = {}
    for i, lang in enumerate(LANGS):
        start_m = re.search(rf"\n  {lang}: \{{", text)
        if not start_m:
            raise SystemExit(f"missing lang {lang}")
        start = start_m.end()
        if i + 1 < len(LANGS):
            end = text.find(f"\n  {LANGS[i + 1]}: {{", start)
        else:
            end = text.find("\n  },\n};", start)
        if end < 0:
            raise SystemExit(f"cannot find end of {lang}")
        block = text[start:end]
        titles = [t.replace("\\'", "'") for t in re.findall(r"title:\s*'((?:\\'|[^'])*)'", block)]
        bodies = [b.replace("\\'", "'") for b in re.findall(r"body:\s*'((?:\\'|[^'])*)'", block)]
        pledges_m = re.search(r"pledges:\s*\[(.*?)\]", block, re.S)
        pledges = (
            [p.replace("\\'", "'") for p in re.findall(r"'((?:\\'|[^'])*)'", pledges_m.group(1))]
            if pledges_m
            else []
        )

        def g(key: str) -> str:
            mm = re.search(rf"{key}:\s*'((?:\\'|[^'])*)'", block)
            return (mm.group(1) if mm else "").replace("\\'", "'")

        copies[lang] = {
            "titles": titles,
            "bodies": bodies,
            "pledges": pledges,
            "no": g("no"),
            "accept": g("accept"),
            "completed": g("completed"),
            "watched": g("watched"),
            "check": g("check"),
            "chooseHelp": g("chooseHelp"),
            "gated": g("gated"),
            "acceptHelp": g("acceptHelp"),
            "block_start": start_m.start(),
            "block_end": end,
        }
        if len(titles) < 7 or len(bodies) < 3:
            raise SystemExit(f"{lang} parse short titles={len(titles)} bodies={len(bodies)}")
    return copies


def ts_item(title: str, body: str, example: str) -> str:
    return (
        "      {\n"
        f"        title: `{esc(title)}`,\n"
        f"        body: `{esc(body)}`,\n"
        f"        example: `{esc(example)}`,\n"
        "      }"
    )


def main() -> None:
    exword = load_json(SCRIPTS / "_fa_exwords.json")
    listen = load_json(SCRIPTS / "_fa_listen.json")
    point = load_json(SCRIPTS / "_fa_point.json")
    aml_title = merge_glob("_fa_aml_title_*.json")
    aml_body = merge_glob("_fa_aml_body_??.json")
    q3 = merge_glob("_fa_q3_*.json")
    missing = []
    for lang in LANGS:
        for name, bag in (
            ("exampleWord", exword),
            ("listenPts", listen),
            ("pointWord", point),
            ("amlTitle", aml_title),
            ("amlBody", aml_body),
            ("q3", q3),
        ):
            if lang not in bag:
                missing.append(f"{name}:{lang}")
    if missing:
        raise SystemExit("missing snippets: " + ", ".join(missing))

    fa_text = I18N.read_text(encoding="utf-8")
    copies = parse_fa_copies(fa_text)

    packs = {}
    for lang in LANGS:
        fa = copies[lang]
        r0t, r1t, r2t = fa["titles"][2], fa["titles"][3], fa["titles"][4]
        r0b, r1b, r2b = fa["bodies"][0], fa["bodies"][1], fa["bodies"][2]
        q0, q1 = fa["titles"][5], fa["titles"][6]
        p0, p1, p2 = (fa["pledges"] + ["", "", ""])[:3]
        report = (p2.rstrip("।.") + ". OM / HOD.").strip()
        no = fa["no"]
        aml_t = aml_title[lang]
        aml_b = aml_body[lang]
        packs[lang] = {
            "exampleWord": exword[lang],
            "listenPts": listen[lang],
            "pointWord": point[lang],
            "accept": join(fa["completed"], fa["accept"]),
            "pledge": join(fa["watched"], p0, p1, aml_t + ".", report),
            "q3": q3[lang],
            "quiz": join("3", fa["check"]),
            "quizHelp": fa["gated"] or fa["acceptHelp"],
            "waBody": fa["chooseHelp"],
            "items": [
                (r1t, r1b, join(q1, no + ".", r1b, report)),
                (r0t, r0b, join(q0, no + ".", r0b, report)),
                (aml_t, join(aml_b, r2b), join(q1, no + ".", aml_t + ".", report)),
            ],
            "lesson3ex": join(q1, no + ".", r2b, report),
        }

    lines = [
        "import type { Lang } from './fa-i18n.js'",
        "",
        "export type NativePoint = { title: string; body: string; example: string }",
        "export type NativePack = {",
        "  exampleWord: string",
        "  listenPts: string",
        "  pointWord: string",
        "  accept: string",
        "  pledge: string",
        "  q3: string",
        "  quiz: string",
        "  quizHelp: string",
        "  waBody: string",
        "  items: NativePoint[]",
        "  lesson3ex: string",
        "}",
        "",
        "export const NATIVE_PACK: Partial<Record<Lang, NativePack>> = {",
    ]
    for lang in LANGS:
        p = packs[lang]
        lines.append(f"  {lang}: {{")
        for key in (
            "exampleWord",
            "listenPts",
            "pointWord",
            "accept",
            "pledge",
            "q3",
            "quiz",
            "quizHelp",
            "waBody",
            "lesson3ex",
        ):
            lines.append(f"    {key}: `{esc(p[key])}`,")
        lines.append("    items: [")
        lines.append(",\n".join(ts_item(*it) for it in p["items"]))
        lines.append("    ],")
        lines.append("  },")
    lines.append("}")
    lines.append("")
    out = "\n".join(lines) + "\n"
    if "\ufffd" in out:
        raise SystemExit("replacement char in generated TS")
    OUT.write_text(out, encoding="utf-8")

    new_text = fa_text
    if "exampleWord?:" not in new_text:
        new_text = new_text.replace(
            "  listenAll?: string;",
            "  listenAll?: string;\n  exampleWord?: string;",
        )

    # Re-parse after type edit so offsets stay correct.
    copies = parse_fa_copies(new_text)
    pieces = []
    cursor = 0
    for lang in LANGS:
        fa = copies[lang]
        p = packs[lang]
        start, end = fa["block_start"], fa["block_end"]
        pieces.append(new_text[cursor:start])
        block = new_text[start:end]
        if "exampleWord:" not in block:
            block = block.replace(
                "    listen:",
                f"    exampleWord: '{sq(p['exampleWord'])}',\n    listen:",
                1,
            )
        examples = [p["items"][1][2], p["items"][0][2], p["lesson3ex"]]
        count = 0

        def add_ex(m: re.Match) -> str:
            nonlocal count
            body = m.group(0)
            if "example:" in body:
                return body
            ex = examples[count]
            count += 1
            return body[:-1] + f"\n        example: '{sq(ex)}',\n      }}"

        block2, n = re.subn(
            r"\{\n        title: '(?:\\'|[^'])+',\n        body: '(?:\\'|[^'])+',\n      \}",
            add_ex,
            block,
            count=3,
        )
        if n != 3 or count != 3:
            raise SystemExit(f"{lang} rule inject count n={n} added={count}")
        pieces.append(block2)
        cursor = end
    pieces.append(new_text[cursor:])
    merged = "".join(pieces)
    if "\ufffd" in merged:
        raise SystemExit("replacement char in fa-i18n")
    I18N.write_text(merged, encoding="utf-8")
    print("wrote", OUT, "bytes", OUT.stat().st_size)
    print("updated examples in", I18N)


if __name__ == "__main__":
    main()
