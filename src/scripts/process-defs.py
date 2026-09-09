import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFS_CSV = ROOT / "src/data/word-bank/defs.csv"
DEFS_JSON = ROOT / "src/data/word-bank/defs.json"


def split_gloss_parts(def_text: str) -> list[str]:
    return [part.strip() for part in def_text.split(";") if part.strip()]


def process_definitions(data):
    for entry in data:
        if "def" not in entry:
            continue

        definitions = entry["def"]
        seen = set(definitions)
        new_terms = []
        terms_to_remove = set()

        for d in definitions:
            leading_paren = re.match(r"^\(([^)]*)\)\s*(.+)$", d)
            if leading_paren:
                qualifier = leading_paren.group(1).strip()
                rest = leading_paren.group(2).strip()
                terms_to_remove.add(d)

                if rest and rest not in seen:
                    new_terms.append(rest)
                    seen.add(rest)

                if qualifier and rest:
                    combined = f"{qualifier} {rest}"
                    if combined not in seen:
                        new_terms.append(combined)
                        seen.add(combined)
                elif qualifier and qualifier not in seen:
                    new_terms.append(qualifier)
                    seen.add(qualifier)
                continue

            if "(" in d or "-" in d:
                terms_to_remove.add(d)

            if "(" in d:
                processed = d.split("(")[0].strip()
                if processed and processed not in seen:
                    new_terms.append(processed)
                    seen.add(processed)
            if "-" in d:
                processed = d.replace("-", " ")
                if processed and processed not in seen:
                    new_terms.append(processed)
                    seen.add(processed)

        entry["def"] = [d for d in entry["def"] if d not in terms_to_remove]
        entry["def"].extend(new_terms)

    return data


def load_defs_from_csv(csv_path: Path = DEFS_CSV) -> list[dict]:
    entries = []
    with csv_path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            entries.append(
                {
                    "def_id": int(row["def_id"]),
                    "vocab_id": int(row["vocab_id"]),
                    "def": split_gloss_parts(row["def"]),
                    "def_lang": row["def_lang"],
                }
            )
    return entries


def rebuild_defs_json(
    csv_path: Path = DEFS_CSV,
    output_path: Path = DEFS_JSON,
) -> list[dict]:
    data = process_definitions(load_defs_from_csv(csv_path))
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    return data


if __name__ == "__main__":
    data = rebuild_defs_json()
    empty = sum(1 for entry in data if not entry["def"])
    print(f"Wrote {len(data)} definition rows to {DEFS_JSON}")
    print(f"Empty gloss rows: {empty}")
