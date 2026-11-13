"""Checks content/ before it reaches the phones: JSON syntax, course outlines, lesson files and the step rules
the runtime relies on. Mirrors the validator of the browser test page (content/runtime/dev.html), minus the
formula rendering, which only the browser can do.

Exit code 1 with a list of problems if anything is off.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "content"
TYPES = {"text", "widget", "choice", "multi", "truefalse", "numeric", "cloze", "order", "match", "sort", "reveal", "summary", "anim", "gen",
         "spot", "proof", "estimate", "timeline", "quadrant", "rubric", "grade"}
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
ALLOWED_SYMBOLS = re.compile("[✓←-⇿]")  # check mark and arrows are fine
NUMBER = re.compile(r"^\s*[-−]?\d+([.,]\d+)?\s*(/\s*\d+([.,]\d+)?)?\s*$")

problems: list[str] = []


def problem(where: str, text: str) -> None:
    problems.append(f"{where}: {text}")


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001 - report every kind of parse error
        problem(str(path.relative_to(ROOT)), f"kein gültiges JSON ({e})")
        return None


def text_fields(step: dict):
    for key in ("md", "explain", "hint", "wrong", "solution", "after", "prompt"):
        if isinstance(step.get(key), str):
            yield key, step[key]
    for i, o in enumerate(step.get("options") or []):
        if isinstance(o, dict):
            for key in ("md", "why"):
                if isinstance(o.get(key), str):
                    yield f"option {i + 1} {key}", o[key]
    for i, it in enumerate(step.get("items") or []):
        if isinstance(it, str):
            yield f"item {i + 1}", it
        elif isinstance(it, dict) and isinstance(it.get("md"), str):
            yield f"item {i + 1}", it["md"]
    for i, p in enumerate(step.get("pairs") or []):
        if isinstance(p, list):
            for side, v in zip("LR", p):
                if isinstance(v, str):
                    yield f"pair {i + 1}{side}", v
    for i, t in enumerate(step.get("points") or []):
        if isinstance(t, str):
            yield f"point {i + 1}", t
    for key in ("given", "claim"):
        if isinstance(step.get(key), str):
            yield key, step[key]
    for list_key in ("lines", "steps", "distractors"):
        for i, it in enumerate(step.get(list_key) or []):
            if isinstance(it, str):
                yield f"{list_key} {i + 1}", it
            elif isinstance(it, dict):
                for key in ("md", "why"):
                    if isinstance(it.get(key), str):
                        yield f"{list_key} {i + 1} {key}", it[key]


def number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def is_number(value) -> bool:
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return True
    return isinstance(value, str) and bool(NUMBER.match(value))


GENERATORS: set[str] = set()


def check_step(where: str, s: dict, widgets: set[str]) -> None:
    t = s.get("type")
    if t not in TYPES:
        problem(where, f"unbekannter Typ {t!r}")
        return
    if t == "gen":
        if s.get("gen") not in GENERATORS:
            problem(where, f"Generator {s.get('gen')!r} gibt es in der Runtime nicht")
        if not isinstance(s.get("level", 1), int) or not 1 <= s.get("level", 1) <= 4:
            problem(where, "level muss 1 bis 4 sein")
        return
    if t == "anim":
        if s.get("widget") and s.get("widget") not in widgets:
            problem(where, f"Widget {s.get('widget')!r} gibt es in der Runtime nicht")
        timeline = s.get("timeline")
        if not isinstance(timeline, list) or not timeline:
            problem(where, "timeline fehlt")
        else:
            for i, scene in enumerate(timeline):
                if not isinstance(scene, dict) or not scene.get("caption"):
                    problem(where, f"Szene {i + 1} ohne caption")
                elif EMOJI.search(scene["caption"]) and not ALLOWED_SYMBOLS.search(scene["caption"]):
                    problem(where, f"Szene {i + 1}: Emoji gefunden")
    if t == "choice":
        n = sum(1 for o in s.get("options") or [] if isinstance(o, dict) and o.get("correct"))
        if n != 1:
            problem(where, f"braucht genau eine richtige Option, hat {n}")
    if t == "multi" and not any(isinstance(o, dict) and o.get("correct") for o in s.get("options") or []):
        problem(where, "keine richtige Option")
    if t == "truefalse" and not isinstance(s.get("answer"), bool):
        problem(where, "answer muss true oder false sein")
    if t == "numeric":
        answers = s.get("answer")
        for a in answers if isinstance(answers, list) else [answers]:
            if not is_number(a):
                problem(where, f"answer {a!r} ist keine Zahl")
    if t == "cloze":
        n = len(re.findall(r"\{\{\d+\}\}", str(s.get("md", ""))))
        blanks = s.get("blanks") or []
        if n != len(blanks):
            problem(where, f"{n} Lücken im Text, aber {len(blanks)} blanks")
    if t == "order" and len(s.get("items") or []) < 2:
        problem(where, "zu wenige items")
    if t == "match" and len(s.get("pairs") or []) < 2:
        problem(where, "zu wenige pairs")
    if t == "reveal" and not s.get("solution"):
        problem(where, "solution fehlt")
    if t == "sort":
        cats = s.get("categories") or []
        for k, it in enumerate(s.get("items") or []):
            cat = it.get("cat") if isinstance(it, dict) else None
            ok = (isinstance(cat, int) and 0 <= cat < len(cats)) or (isinstance(cat, str) and cat in cats)
            if not ok:
                problem(where, f"Kategorie von Eintrag {k + 1} unbekannt")
    if t == "widget" and s.get("widget") not in widgets:
        problem(where, f"Widget {s.get('widget')!r} gibt es in der Runtime nicht")
    if t == "spot":
        lines = s.get("lines") or []
        answers = s.get("answer") if isinstance(s.get("answer"), list) else [s.get("answer")]
        if len(lines) < 2:
            problem(where, "zu wenige lines")
        if not answers or not all(isinstance(a, int) and not isinstance(a, bool) and 0 <= a < len(lines) for a in answers):
            problem(where, "answer muss auf vorhandene Zeilen zeigen (ab 0 gezählt)")
    if t == "proof":
        if len(s.get("steps") or []) < 2:
            problem(where, "zu wenige steps")
        for k, it in enumerate((s.get("steps") or []) + (s.get("distractors") or [])):
            if not (isinstance(it, str) or (isinstance(it, dict) and isinstance(it.get("md"), str))):
                problem(where, f"Baustein {k + 1} ohne md")
    if t == "estimate":
        lo, hi, ans = s.get("min"), s.get("max"), s.get("answer")
        if not (number(lo) and number(hi) and lo < hi):
            problem(where, "min und max fehlen oder min >= max")
        elif not number(ans) or not lo <= ans <= hi:
            problem(where, "answer fehlt oder liegt außerhalb von min bis max")
        if s.get("log") and number(lo) and lo <= 0:
            problem(where, "log braucht min > 0")
        for key in ("tolerance", "relTolerance"):
            if key in s and not (number(s[key]) and s[key] > 0):
                problem(where, f"{key} muss positiv sein")
    if t == "timeline":
        lo, hi = s.get("start"), s.get("end")
        if not (number(lo) and number(hi) and lo < hi):
            problem(where, "start und end fehlen oder start >= end")
        items = s.get("items") or []
        if len(items) < 2:
            problem(where, "zu wenige items")
        for k, it in enumerate(items):
            year = it.get("year") if isinstance(it, dict) else None
            if not number(year) or (number(lo) and number(hi) and not lo <= year <= hi):
                problem(where, f"Eintrag {k + 1}: year fehlt oder liegt außerhalb des Zeitstrahls")
    if t == "quadrant":
        if len(s.get("x") or []) != 2 or len(s.get("y") or []) != 2:
            problem(where, "x und y brauchen je zwei Beschriftungen")
        for k, it in enumerate(s.get("items") or []):
            cell = it.get("cell") if isinstance(it, dict) else None
            if not (isinstance(cell, int) and not isinstance(cell, bool) and 0 <= cell <= 3):
                problem(where, f"Eintrag {k + 1}: cell muss 0 bis 3 sein")
    for key, value in text_fields(s):
        if EMOJI.search(value) and not ALLOWED_SYMBOLS.search(value):
            problem(where, f"{key}: Emoji gefunden")
        if value.count("$$") % 2:
            problem(where, f"{key}: $$ nicht geschlossen")


def balanced(tex: str) -> bool:
    depth = 0
    for i, ch in enumerate(tex):
        if ch in "{}" and i and tex[i - 1] == "\\":
            continue
        depth += 1 if ch == "{" else -1 if ch == "}" else 0
        if depth < 0:
            return False
    return depth == 0


def check_formulas(cid: str, cdir: Path, listed: set) -> None:
    """courses/<course>/formeln.json: the formula book behind the formula panel, the cards and the training."""
    path = cdir / "formeln.json"
    if not path.is_file():
        return
    book = load(path)
    where = f"courses/{cid}/formeln.json"
    if book is None:
        return
    if book.get("course") != cid or not book.get("title"):
        problem(where, "course muss die Kurs-id sein, title fehlt")
    groups = book.get("groups") or []
    if not groups:
        problem(where, "keine Gruppen")
    ids = set()
    for g in groups:
        if not g.get("title") or not g.get("formulas"):
            problem(where, f"Gruppe ohne title oder Formeln: {g.get('title')!r}")
        for f in g.get("formulas") or []:
            fid = f.get("id")
            fwhere = f"{where} {fid}"
            if not fid or not re.fullmatch(r"[a-z0-9-]+", fid) or fid in ids:
                problem(fwhere, "id fehlt, ist doppelt oder enthält andere Zeichen als a-z, 0-9 und -")
            ids.add(fid)
            if not f.get("name") or not f.get("tex"):
                problem(fwhere, "name oder tex fehlt")
            texts = [f.get("tex", "")] + list((f.get("solve") or {}).values()) + list(f.get("wrong") or [])
            texts += [v[0] for v in f.get("vars") or [] if v]
            for t in texts:
                if not isinstance(t, str) or "$" in t or not balanced(t):
                    problem(fwhere, f"TeX ohne $ und mit geschlossenen Klammern erwartet: {t!r}")
            for v in f.get("vars") or []:
                if not isinstance(v, list) or len(v) not in (2, 3):
                    problem(fwhere, f"vars-Eintrag braucht [Symbol, Bedeutung, Einheit]: {v!r}")
            if f.get("abi") not in (None, "blatt", "merken"):
                problem(fwhere, "abi ist blatt oder merken")
            for lid in f.get("lessons") or []:
                if lid not in listed:
                    problem(fwhere, f"Lektion {lid} gibt es in diesem Kurs nicht")
            for key in ("name", "note"):
                if f.get(key) and EMOJI.search(f[key]) and not ALLOWED_SYMBOLS.search(f[key]):
                    problem(fwhere, f"{key}: Emoji gefunden")
    if len(ids) < 4:
        problem(where, "mindestens vier Formeln, sonst hat das Training keine Auswahl")


def main() -> int:
    runtime = ROOT / "runtime"
    widget_files = sorted((runtime / "widgets").glob("*.js"))
    widgets = {m for f in widget_files for m in re.findall(r'LW\.widget\("([a-z0-9-]+)"', f.read_text(encoding="utf-8"))}
    generator_files = sorted((runtime / "generators").glob("*.js")) if (runtime / "generators").is_dir() else []
    GENERATORS.update(m for f in generator_files for m in re.findall(r'(?:\bgen|\bproofGen|LW\.generator)\("([a-z0-9-]+)"', f.read_text(encoding="utf-8")))
    widget_files = widget_files + generator_files

    info = load(runtime / "runtime.json") or {}
    index_html = (runtime / "index.html").read_text(encoding="utf-8")
    for script in info.get("scripts", []):
        if not (runtime / script).is_file():
            problem("runtime/runtime.json", f"Skript {script} fehlt")
        if f'src="{script}"' not in index_html:
            problem("runtime/index.html", f"lädt {script} nicht")
    for f in widget_files:
        rel = f"{f.parent.name}/{f.name}"
        if rel not in info.get("scripts", []):
            problem("runtime/runtime.json", f"{rel} fehlt in scripts")
    if not isinstance(info.get("minShell"), int):
        problem("runtime/runtime.json", "minShell fehlt")

    for path in ROOT.rglob("*.json"):
        if path.name.startswith("dev"):
            continue
        load(path)

    index = load(ROOT / "courses" / "index.json") or {}
    seen_lessons: dict[str, str] = {}
    lesson_count = 0
    for cid in index.get("courses", []):
        cdir = ROOT / "courses" / cid
        course = load(cdir / "course.json") if (cdir / "course.json").is_file() else None
        if course is None:
            problem(f"courses/{cid}", "course.json fehlt")
            continue
        where = f"courses/{cid}/course.json"
        if course.get("id") != cid:
            problem(where, f"id {course.get('id')!r} passt nicht zum Ordner")
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", str(course.get("color", ""))):
            problem(where, "color muss #RRGGBB sein")
        if not course.get("symbol"):
            problem(where, "symbol fehlt")
        listed = set()
        for ch in course.get("chapters", []):
            for ref in ch.get("lessons", []):
                lid = ref.get("id")
                if not lid or not ref.get("title"):
                    problem(where, f"Lektion ohne id oder title in Kapitel {ch.get('id')}")
                    continue
                if lid in seen_lessons:
                    problem(where, f"Lektions-id {lid} gibt es schon in {seen_lessons[lid]}")
                seen_lessons[lid] = cid
                listed.add(lid)
                if lid.startswith("dev"):
                    problem(where, f"Lektions-id {lid} beginnt mit dev, die App würde sie nicht laden")
                lpath = cdir / "lessons" / f"{lid}.json"
                if ref.get("status") == "soon":
                    continue
                if not lpath.is_file():
                    problem(where, f"Lektion {lid} ist fertig markiert, aber {lpath.name} fehlt")
                    continue
                lesson = load(lpath)
                if lesson is None:
                    continue
                lesson_count += 1
                lwhere = f"courses/{cid}/lessons/{lid}.json"
                if lesson.get("id") != lid:
                    problem(lwhere, f"id {lesson.get('id')!r} passt nicht zum Dateinamen")
                if not lesson.get("title"):
                    problem(lwhere, "title fehlt")
                steps = lesson.get("steps") or []
                if not steps:
                    problem(lwhere, "keine Schritte")
                ids = set()
                for i, s in enumerate(steps):
                    sid = s.get("id") or f"s{i + 1}"
                    swhere = f"{lwhere} Schritt {i + 1} ({s.get('type')})"
                    if sid in ids:
                        problem(swhere, f"doppelte id {sid}")
                    ids.add(sid)
                    check_step(swhere, s, widgets)
                for link in lesson.get("vault") or []:
                    if not str(link.get("path", "")).endswith(".md") or not link.get("title"):
                        problem(lwhere, f"vault-Link unvollständig: {link}")
        for f in (cdir / "lessons").glob("*.json") if (cdir / "lessons").is_dir() else []:
            if f.stem not in listed:
                problem(f"courses/{cid}/lessons/{f.name}", "steht in keinem Kapitel von course.json")
        topic_ids = set()
        for topic in course.get("practice") or []:
            tid = topic.get("id")
            if not tid or tid in topic_ids:
                problem(where, f"Trainingsthema ohne id oder doppelt: {tid!r}")
            topic_ids.add(tid)
            if not topic.get("title"):
                problem(where, f"Trainingsthema {tid} ohne title")
            if topic.get("after") and topic["after"] not in listed:
                problem(where, f"Trainingsthema {tid}: Lektion {topic['after']} gibt es nicht")
            gens = topic.get("gens") or []
            if not gens:
                problem(where, f"Trainingsthema {tid} ohne gens")
            for g in gens:
                if g not in GENERATORS:
                    problem(where, f"Trainingsthema {tid}: Generator {g} gibt es nicht")
            if topic.get("chapter") and topic["chapter"] not in {ch.get("id") for ch in course.get("chapters", [])}:
                problem(where, f"Trainingsthema {tid}: Kapitel {topic['chapter']} gibt es nicht")
        for ch in course.get("chapters", []):
            for key in ("from", "to"):
                if ch.get(key) is not None and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(ch[key])):
                    problem(where, f"Kapitel {ch.get('id')}: {key} muss JJJJ-MM-TT sein")
            if ch.get("from") and ch.get("to") and ch["from"] > ch["to"]:
                problem(where, f"Kapitel {ch.get('id')}: from liegt nach to")
        for paper in course.get("papers") or []:
            pid = paper.get("id")
            if not pid or not paper.get("title") or not isinstance(paper.get("minutes"), int) or not isinstance(paper.get("count"), int):
                problem(where, f"Paper {pid!r}: id, title, minutes und count sind Pflicht")
            for tp in paper.get("topics") or []:
                if tp not in topic_ids:
                    problem(where, f"Paper {pid}: Trainingsthema {tp} gibt es nicht")
            if not paper.get("topics"):
                problem(where, f"Paper {pid}: keine Themen")
        check_formulas(cid, cdir, listed)

    # learning path: prerequisites inside the course, links to existing lessons, no cycles
    for cid in index.get("courses", []):
        path = ROOT / "courses" / cid / "course.json"
        course = load(path) if path.is_file() else None
        if not course:
            continue
        refs = {ref.get("id"): ref for ch in course.get("chapters", []) for ref in ch.get("lessons", [])}
        for lid, ref in refs.items():
            for dep in ref.get("requires") or []:
                if dep not in refs:
                    problem(f"courses/{cid}/course.json", f"{lid}: requires {dep} ist keine Lektion dieses Kurses")
            for link in ref.get("links") or []:
                if link not in seen_lessons:
                    problem(f"courses/{cid}/course.json", f"{lid}: links {link} gibt es nicht")
        state: dict[str, int] = {}

        def visit(lid: str, trail: list[str]) -> None:
            if state.get(lid) == 2:
                return
            if state.get(lid) == 1:
                problem(f"courses/{cid}/course.json", "Kreis im Lernpfad: " + " -> ".join(trail + [lid]))
                return
            state[lid] = 1
            for dep in (refs.get(lid) or {}).get("requires") or []:
                if dep in refs:
                    visit(dep, trail + [lid])
            state[lid] = 2

        for lid in refs:
            visit(lid, [])

    # subject folders: every course in exactly one, known courses only
    course_ids = index.get("courses", [])
    seen_subjects: set[str] = set()
    placed: dict[str, str] = {}
    for subject in index.get("subjects") or []:
        sid = subject.get("id")
        where = f"courses/index.json Fach {sid}"
        if not sid or sid in seen_subjects:
            problem(where, "fehlende oder doppelte id")
        seen_subjects.add(sid)
        if not subject.get("title") or not subject.get("symbol"):
            problem(where, "title oder symbol fehlt")
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", str(subject.get("color", ""))):
            problem(where, "color muss #RRGGBB sein")
        for cid in subject.get("courses", []):
            if cid not in course_ids:
                problem(where, f"Kurs {cid} steht nicht in courses")
            if cid in placed:
                problem(where, f"Kurs {cid} liegt schon im Fach {placed[cid]}")
            placed[cid] = sid
    if index.get("subjects"):
        for cid in course_ids:
            if cid not in placed:
                problem("courses/index.json", f"Kurs {cid} liegt in keinem Fach")

    if problems:
        print(f"{len(problems)} Probleme:")
        for p in problems:
            print(" -", p)
        return 1
    print(f"Inhalte in Ordnung: {len(index.get('courses', []))} Kurse, {lesson_count} Lektionen, {len(widgets)} Widgets")
    return 0


if __name__ == "__main__":
    sys.exit(main())
