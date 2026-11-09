"""Writes the learning path into content/courses/*/course.json: for every lesson the lessons of the same course it
builds on ("requires") and cross-links to other courses ("links", shown as dashed lines in the overview).
Run after adding lessons: python tools/lernpfad.py. The rest of each file keeps its formatting."""
import json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent / "content" / "courses"

REQUIRES = {
    "analysis-1": {
        "ana1-logik": [], "ana1-mengen": ["ana1-logik"], "ana1-abbildungen": ["ana1-mengen"],
        "ana1-koerper": ["ana1-logik"], "ana1-supremum": ["ana1-koerper", "ana1-mengen"],
        "ana1-induktion": ["ana1-logik"], "ana1-archimedes": ["ana1-supremum", "ana1-induktion"], "ana1-binom": ["ana1-induktion"],
        "ana1-intervalle": ["ana1-archimedes"], "ana1-wurzel": ["ana1-supremum", "ana1-intervalle"], "ana1-abzaehlbar": ["ana1-abbildungen", "ana1-intervalle"],
        "ana1-komplex": ["ana1-koerper"], "ana1-normen": ["ana1-komplex"], "ana1-metrik": ["ana1-normen"],
        "ana1-konvergenz": ["ana1-archimedes"], "ana1-monotonie": ["ana1-konvergenz", "ana1-supremum"], "ana1-cauchy": ["ana1-monotonie"],
        "ana1-reihen": ["ana1-konvergenz"], "ana1-kriterien": ["ana1-reihen", "ana1-monotonie"], "ana1-exp": ["ana1-kriterien", "ana1-binom"],
        "ana1-stetigkeit": ["ana1-konvergenz", "ana1-abbildungen"], "ana1-zws": ["ana1-stetigkeit", "ana1-intervalle"],
        "ana1-ableitung": ["ana1-stetigkeit"], "ana1-mws": ["ana1-ableitung", "ana1-zws"], "ana1-riemann": ["ana1-supremum", "ana1-stetigkeit"],
        "ana1-taylor": ["ana1-mws", "ana1-exp"], "ana1-gleichmaessig": ["ana1-konvergenz", "ana1-stetigkeit"],
        "ana1-potenzreihen": ["ana1-exp", "ana1-kriterien"], "ana1-hauptsatz": ["ana1-riemann", "ana1-mws"],
    },
    "lineare-algebra-1": {
        "la1-gruppen": [], "la1-vektorraum": ["la1-gruppen"], "la1-linkomb": ["la1-vektorraum"], "la1-basis": ["la1-linkomb"],
        "la1-matrizen": ["la1-basis"], "la1-matrixprodukt": ["la1-matrizen"], "la1-kern": ["la1-matrizen"],
        "la1-gauss": ["la1-linkomb"], "la1-det": ["la1-matrixprodukt"], "la1-eigen": ["la1-det", "la1-kern"],
        "la1-koordinaten": ["la1-basis", "la1-matrixprodukt"], "la1-loesungsmenge": ["la1-gauss", "la1-kern"],
    },
    "stochastik": {
        "stoch-zufall": [], "stoch-kombinatorik": ["stoch-zufall"], "stoch-bayes": ["stoch-zufall"], "stoch-unabhaengigkeit": ["stoch-bayes"],
        "stoch-erwartungswert": ["stoch-zufall"], "stoch-binomial": ["stoch-kombinatorik", "stoch-erwartungswert"],
        "stoch-hypothesentest": ["stoch-binomial"], "stoch-prognose": ["stoch-binomial"], "stoch-konfidenz": ["stoch-prognose"],
        "stoch-kenngroessen": ["stoch-erwartungswert"], "stoch-regression": ["stoch-kenngroessen"], "stoch-normal": ["stoch-binomial", "stoch-kenngroessen"],
        "stoch-geometrisch": ["stoch-erwartungswert", "stoch-unabhaengigkeit"], "stoch-zgws": ["stoch-normal"],
    },
    "cs50-ai": {
        "cs50-suche": [], "cs50-informiert": ["cs50-suche"], "cs50-minimax": ["cs50-suche"],
        "cs50-logik": [], "cs50-inferenz": ["cs50-logik"],
        "cs50-wahrscheinlichkeit": [], "cs50-bayesnetze": ["cs50-wahrscheinlichkeit"], "cs50-markov": ["cs50-bayesnetze"],
        "cs50-lokal": ["cs50-informiert"], "cs50-csp": ["cs50-lokal", "cs50-logik"],
        "cs50-klassifikation": ["cs50-lokal"], "cs50-rl": ["cs50-markov", "cs50-minimax"],
        "cs50-nn": ["cs50-klassifikation"], "cs50-nlp": ["cs50-nn", "cs50-markov"],
        "cs50-overfitting": ["cs50-klassifikation"], "cs50-transformer": ["cs50-nlp"],
    },
    "oekonomik": {
        "oek-markt": [], "oek-elastizitaet": ["oek-markt"], "oek-staat": ["oek-elastizitaet"], "oek-marktversagen": ["oek-staat"],
        "oek-marktformen": ["oek-elastizitaet"],
        "oek-bip": [], "oek-multiplikator": ["oek-bip"], "oek-geld": ["oek-bip"], "oek-adas": ["oek-multiplikator", "oek-geld"],
        "oek-smith": ["oek-markt"], "oek-ricardo": ["oek-smith"], "oek-marx": ["oek-ricardo"], "oek-keynes": ["oek-multiplikator", "oek-marx"],
        "oek-hayek": ["oek-keynes", "oek-marktversagen"],
        "oek-spieltheorie": ["oek-marktformen"], "oek-arbeitsmarkt": ["oek-staat"],
    },
    "ethnologie": {
        "eth-feldforschung": [], "eth-kultur": ["eth-feldforschung"], "eth-relativismus": ["eth-kultur"],
        "eth-gabe": ["eth-feldforschung"], "eth-verwandtschaft": ["eth-feldforschung"], "eth-heirat": ["eth-verwandtschaft", "eth-gabe"],
        "eth-ritual": ["eth-kultur"], "eth-religion": ["eth-ritual"],
        "eth-politik": ["eth-verwandtschaft"], "eth-ethnizitaet": ["eth-politik", "eth-relativismus"], "eth-globalisierung": ["eth-ethnizitaet", "eth-kultur"],
        "eth-wirtschaftsformen": ["eth-gabe"], "eth-migration": ["eth-globalisierung"],
    },
}

# Connections across courses: useful background, never a condition.
LINKS = {
    "cs50-wahrscheinlichkeit": ["stoch-bayes"],
    "cs50-nn": ["ana1-ableitung", "la1-matrixprodukt"],
    "cs50-klassifikation": ["la1-linkomb"],
    "cs50-logik": ["ana1-logik"],
    "cs50-markov": ["la1-matrixprodukt"],
    "oek-multiplikator": ["ana1-reihen"],
    "oek-markt": ["eth-gabe"],
    "eth-gabe": ["oek-smith"],
    "stoch-kombinatorik": ["ana1-binom"],
    "la1-gruppen": ["ana1-koerper"],
    "oek-hayek": ["eth-ethnizitaet"],
    "oek-spieltheorie": ["cs50-minimax"],
    "cs50-overfitting": ["stoch-regression"],
    "cs50-transformer": ["la1-matrixprodukt"],
    "stoch-zgws": ["stoch-prognose"],
    "eth-wirtschaftsformen": ["oek-markt"],
    "eth-migration": ["oek-arbeitsmarkt"],
}


def main():
    all_ids = {}
    for course, req in REQUIRES.items():
        data = json.loads((ROOT / course / "course.json").read_text(encoding="utf-8"))
        listed = [l["id"] for ch in data["chapters"] for l in ch["lessons"]]
        missing = set(listed) ^ set(req)
        if missing:
            raise SystemExit(f"{course}: Lektionen ohne Eintrag oder unbekannt: {sorted(missing)}")
        for lid in listed:
            all_ids[lid] = course
    for lid, links in LINKS.items():
        for t in links + [lid]:
            if t not in all_ids:
                raise SystemExit(f"Verknüpfung mit unbekannter Lektion {t}")
    for course, req in REQUIRES.items():
        path = ROOT / course / "course.json"
        text = path.read_text(encoding="utf-8")
        for lid, deps in req.items():
            m = re.search(r'\{ "id": "' + re.escape(lid) + r'",[^\n]*?\}(?=,?\s*$)', text, re.M)
            if not m:
                raise SystemExit(f"{course}: Zeile für {lid} nicht gefunden")
            obj = m.group(0)
            obj = re.sub(r', "requires": \[[^\]]*\]', "", obj)
            obj = re.sub(r', "links": \[[^\]]*\]', "", obj)
            extra = ', "requires": ' + json.dumps(deps, ensure_ascii=False)
            if LINKS.get(lid):
                extra += ', "links": ' + json.dumps(LINKS[lid], ensure_ascii=False)
            obj = obj[:-1].rstrip() + extra + " }"
            text = text[: m.start()] + obj + text[m.end():]
        json.loads(text)
        path.write_text(text, encoding="utf-8", newline="\n")
        print("Lernpfad geschrieben:", course)


if __name__ == "__main__":
    main()
