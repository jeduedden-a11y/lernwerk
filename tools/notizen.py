"""Puts the texts of the vault notes into the lessons as a learning task (step type "note").

Every lesson names its notes in "vault". This tool reads each of them from the Obsidian vault and writes it into the
lesson as a "note" step: frontmatter, comments and plugin blocks (dataview, dataviewjs) go, the text stays as written
and is split into sections at the level-2 headings. Embedded graphics become image blocks (vault:Datei.svg, the file
itself stays in the vault), chart blocks of the Charts plugin become chart blocks the runtime draws.

Run it again after changing notes: note steps already in a lesson are refreshed in place, missing ones go in before
the first question of the lesson.

    python tools/notizen.py --kurs physik                 # one course
    python tools/notizen.py --kurs physik --lektion phy-bohr
    python tools/notizen.py --alle                        # every course
    python tools/notizen.py --kurs physik --nur-auffrischen   # only refresh existing note steps
"""
import argparse
import json
import re
import sys
from pathlib import Path

COURSES = Path(__file__).resolve().parent.parent / "content" / "courses"
DEFAULT_VAULT = Path.home() / "OneDrive" / "Dokumente" / "Obsidian Vault"
QUESTIONS = {"choice", "multi", "truefalse", "numeric", "cloze", "order", "match", "sort", "reveal", "gen", "spot", "proof",
             "estimate", "timeline", "quadrant", "rubric"}
IMAGE_EXT = {"svg", "png", "jpg", "jpeg", "gif", "webp"}
DROP_FENCES = {"dataview", "dataviewjs", "tasks", "query", "button", "meta-bind", "meta-bind-button"}
# emoji and pictographs; the check mark and arrows stay (as in scripts/check_content.py)
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-✒✔-➿️]")


MATH = re.compile(r"(\$\$.+?\$\$|\$[^$\n]+?\$)")


def strip_tags(text: str) -> str:
    """HTML tags out of plain text; only real tags (a letter after < or </), so 'a <-> b' stays."""
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"</?(b|strong)>", "**", text, flags=re.I)
    text = re.sub(r"</?(i|em)>", "*", text, flags=re.I)
    return re.sub(r"</?[A-Za-z][A-Za-z0-9-]*(\s[^<>\n]*)?/?>", "", text)


def clean_inline(line: str) -> str:
    # tags only outside formulas: "$<$ zu $>$" must not be read as a tag
    parts = MATH.split(line)
    line = "".join(p if i % 2 else strip_tags(p) for i, p in enumerate(parts))
    line = re.sub(r"\s\^[A-Za-z0-9-]+\s*$", "", line)  # block ids
    line = re.sub(r"\[\[([^\]|#]+)#([^\]|]+)\|([^\]]+)\]\]", r"**\3**", line)
    line = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"**\2**", line)
    line = re.sub(r"\[\[([^\]|#]+)#([^\]]+)\]\]", r"**\1 (\2)**", line)
    line = re.sub(r"\[\[([^\]]+)\]\]", r"**\1**", line)
    line = re.sub(r"\*{4}(.+?)\*{4}", r"**\1**", line)  # bold around a link that became bold itself
    line = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", line)  # external images
    line = line.replace("✗", "nein").replace("❌", "nein")
    return EMOJI.sub("", line)


def drop_callouts(md: str, title: str) -> str:
    """Removes the callouts with this title (and their body lines) from a Markdown block."""
    out, skipping = [], False
    for line in md.split("\n"):
        if re.match(r"^\s*>\s*\[!\w+\][+-]?\s*" + re.escape(title) + r"\b", line):
            skipping = True
            continue
        if skipping and re.match(r"^\s*>", line):
            continue
        skipping = False
        out.append(line)
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip("\n")


def parse_list(src: str) -> list:
    src = src.strip()
    try:
        return json.loads("[" + src + "]")
    except ValueError:
        out = []
        for part in src.split(","):
            p = part.strip().strip("'\"")
            try:
                out.append(float(p) if "." in p else int(p))
            except ValueError:
                out.append(p)
        return out


def parse_chart(body: list[str]):
    text = "\n".join(body)
    kind = re.search(r"^type:\s*(\w+)", text, re.M)
    labels = re.search(r"^labels:\s*\[(.*)\]\s*$", text, re.M)
    series = []
    for m in re.finditer(r"-\s*title:\s*(.+?)\s*\n\s*data:\s*\[(.*)\]", text):
        data = [x for x in parse_list(m.group(2)) if isinstance(x, (int, float))]
        series.append({"title": clean_inline(m.group(1).strip().strip("'\"")), "data": data})
    if not labels or not series:
        return None
    return {"type": (kind.group(1) if kind else "line").lower(), "labels": [clean_inline(str(x)) for x in parse_list(labels.group(1))], "series": series}


def convert(text: str) -> tuple[str | None, list[dict]]:
    """Note text -> (title from the frontmatter, sections with blocks)."""
    text = text.replace("\r\n", "\n")
    title = None
    if text.startswith("---\n"):
        end = text.find("\n---", 4)
        if end != -1:
            m = re.search(r"^title:\s*(.+)$", text[4:end], re.M)
            if m:
                title = m.group(1).strip().strip("'\"")
            text = text[end + 4:]
    text = re.sub(r"%%[\s\S]*?%%", "", text)
    items: list[tuple] = []
    lines = text.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        fence = re.match(r"^\s*```\s*([\w-]*)", line)
        if fence:
            kind = fence.group(1).lower()
            body = []
            i += 1
            while i < len(lines) and not re.match(r"^\s*```\s*$", lines[i]):
                body.append(lines[i])
                i += 1
            i += 1
            if kind in DROP_FENCES:
                continue
            if kind == "chart":
                chart = parse_chart(body)
                if chart:
                    items.append(("chart", chart))
                continue
            items.append(("md", "```" + kind))
            items.extend(("md", b) for b in body)
            items.append(("md", "```"))
            continue
        h = re.match(r"^(#{1,2})\s+(.*)$", line)
        if h:
            items.append(("section", clean_inline(h.group(2).strip())))
            i += 1
            continue
        deep = re.match(r"^#{4,6}\s+(.*)$", line)
        if deep:
            # the lesson renderer knows three heading levels; deeper ones become bold lines
            items.append(("md", "**" + clean_inline(deep.group(1).strip()) + "**"))
            i += 1
            continue
        # embedded graphics and notes
        pos = 0
        prefix = re.match(r"^(\s*>\s*)*", line).group(0)
        for m in re.finditer(r"!\[\[([^\]]+)\]\]", line):
            before = line[pos:m.start()]
            if before.strip() and before.strip() != prefix.strip():
                items.append(("md", clean_inline(before)))
            target = m.group(1).split("|")[0].strip()
            name = target.split("#")[0].strip()
            ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
            if ext in IMAGE_EXT:
                items.append(("image", name.split("/")[-1]))
            else:
                items.append(("md", prefix + "*(siehe Notiz »" + clean_inline(name) + "«)*"))
            pos = m.end()
        rest = line[pos:] if pos else line
        if pos == 0 or (rest.strip() and rest.strip() != prefix.strip()):
            items.append(("md", clean_inline(rest if pos else line)))
        i += 1

    sections: list[dict] = [{"title": None, "blocks": []}]
    buf: list[str] = []

    def flush():
        while buf and not buf[0].strip():
            buf.pop(0)
        while buf and not buf[-1].strip():
            buf.pop()
        if buf:
            md = re.sub(r"\n{3,}", "\n\n", "\n".join(buf))
            sections[-1]["blocks"].append({"md": md})
        buf.clear()

    for kind, value in items:
        if kind == "section":
            flush()
            sections.append({"title": value, "blocks": []})
        elif kind == "md":
            buf.append(value)
        elif kind == "image":
            flush()
            sections[-1]["blocks"].append({"image": "vault:" + value})
        elif kind == "chart":
            flush()
            sections[-1]["blocks"].append({"chart": value})
    flush()
    # Obsidian-only interactive parts: their usage notes go, what else they say joins the section before
    for s in sections:
        for b in s["blocks"]:
            if "md" in b:
                b["md"] = drop_callouts(b["md"], "Bedienung")
        s["blocks"] = [b for b in s["blocks"] if "md" not in b or b["md"].strip()]
    merged: list[dict] = []
    for s in sections:
        if s["title"] and re.match(r"^interaktiv", s["title"], re.I) and merged:
            merged[-1]["blocks"].extend(s["blocks"])
        else:
            merged.append(s)
    sections = merged
    out = []
    for s in sections:
        # the course section the app writes into the hubs is about the app, not the subject
        if not s["blocks"] or (s["title"] or "").strip().lower() == "lernwerk-kurs":
            continue
        sec = {"title": s["title"]} if s["title"] else {}
        sec["blocks"] = s["blocks"]
        out.append(sec)
    return title, out


def note_steps(lesson: dict, vault: Path) -> list[dict]:
    steps = []
    for link in lesson.get("vault") or []:
        path = link.get("path") if isinstance(link, dict) else None
        if not path or "/_to_delete/" in path or "Vollständigkeitsraster" in path:
            continue
        file = vault / path
        if not file.exists():
            print(f"  fehlt im Vault: {path}", file=sys.stderr)
            continue
        text = file.read_text(encoding="utf-8")
        # overviews (maps of content, hubs) are no learning material
        if re.search(r"^type:\s*(moc|hub|index)\s*$", text[:600], re.M):
            continue
        title, sections = convert(text)
        if not sections:
            continue
        steps.append({"type": "note", "title": title or Path(path).stem, "path": path, "review": False, "sections": sections})
    return steps


def apply(lesson: dict, fresh: list[dict], only_refresh: bool) -> int:
    steps = lesson["steps"]
    by_path = {s.get("path"): s for s in steps if s.get("type") == "note"}
    changed = 0
    missing = []
    for n in fresh:
        old = by_path.get(n["path"])
        if old:
            if old.get("sections") != n["sections"] or old.get("title") != n["title"]:
                old["sections"] = n["sections"]
                old["title"] = n["title"]
                changed += 1
        else:
            missing.append(n)
    if missing and not only_refresh:
        ids = {s.get("id") for s in steps}
        at = next((k for k, s in enumerate(steps) if s.get("type") in QUESTIONS), None)
        if at is None:
            at = next((k for k, s in enumerate(steps) if s.get("type") == "summary"), len(steps))
        for n in missing:
            k = 1
            while ("notiz" if k == 1 else f"notiz{k}") in ids:
                k += 1
            n = {"id": "notiz" if k == 1 else f"notiz{k}", **n}
            ids.add(n["id"])
            steps.insert(at, n)
            at += 1
            changed += 1
    return changed


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--kurs", action="append", default=[])
    ap.add_argument("--lektion", action="append", default=[])
    ap.add_argument("--alle", action="store_true")
    ap.add_argument("--vault", type=Path, default=DEFAULT_VAULT)
    ap.add_argument("--nur-auffrischen", action="store_true")
    a = ap.parse_args()
    if not a.kurs and not a.alle:
        ap.error("--kurs oder --alle angeben")
    courses = sorted(p.name for p in COURSES.iterdir() if (p / "course.json").exists()) if a.alle else a.kurs
    total = 0
    for course in courses:
        changed_lessons = 0
        for f in sorted((COURSES / course / "lessons").glob("*.json")):
            if a.lektion and f.stem not in a.lektion:
                continue
            lesson = json.loads(f.read_text(encoding="utf-8"))
            n = apply(lesson, note_steps(lesson, a.vault), a.nur_auffrischen)
            if n:
                f.write_bytes((json.dumps(lesson, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
                changed_lessons += 1
                total += n
        print(f"{course}: {changed_lessons} Lektionen geändert")
    print(f"Notiz-Schritte geschrieben oder aufgefrischt: {total}")


if __name__ == "__main__":
    main()
