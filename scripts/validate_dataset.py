"""Fail fast on unsafe university-data releases.

This intentionally does not claim that a scraped value is correct. It identifies
records that need an official-source review before they are shown as facts.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "data" / "processed" / "master_universities.json"
EMBEDDINGS = ROOT / "data" / "processed" / "university_embeddings.json"

def main() -> int:
    records = json.loads(DATASET.read_text(encoding="utf-8"))
    embeddings = json.loads(EMBEDDINGS.read_text(encoding="utf-8"))
    errors: list[str] = []
    warnings: list[str] = []
    ids = [item.get("id") for item in records]

    if len(ids) != len(set(ids)):
        errors.append("duplicate university IDs")
    if set(ids) != {item.get("id") for item in embeddings.get("vectorizedIndex", [])}:
        errors.append("embedding index IDs do not match the master dataset")

    for item in records:
        label = f"{item.get('id', '?')} ({item.get('name', '?')})"
        if not item.get("name") or not item.get("city") or item.get("type") not in {"Public", "Private"}:
            errors.append(f"missing required identity field: {label}")
        if not isinstance(item.get("programs"), list) or not item["programs"]:
            errors.append(f"missing program list: {label}")
        if not isinstance(item.get("fee_range_max"), int) or item["fee_range_max"] <= 0:
            errors.append(f"invalid annual fee: {label}")
        website = item.get("website", "")
        if website and not re.match(r"^https://", website):
            warnings.append(f"non-HTTPS website: {label}")
        # These patterns are generated placeholders, not verified contact details.
        if re.match(r"^info@[a-z0-9]+\.edu\.pk$", item.get("email", "")):
            warnings.append(f"generated-looking email needs verification: {label}")
        if item.get("phone") == "+92-51-111-000-111":
            warnings.append(f"placeholder phone needs verification: {label}")

    fees = Counter(item.get("fee_range_max") for item in records)
    repeated = sum(count for count in fees.values() if count >= 10)
    if repeated:
        warnings.append(f"{repeated} records share repeated fee estimates; do not market fees as verified")

    print(f"Validated {len(records)} universities and {len(embeddings.get('vectorizedIndex', []))} embedding documents.")
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    print(f"Result: {len(errors)} error(s), {len(warnings)} warning(s).")
    return 1 if errors else 0

if __name__ == "__main__":
    sys.exit(main())
