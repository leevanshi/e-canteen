"""
Populate nutrition fields for all menu items in MongoDB.

Usage (from backend/):
    python scripts/seed_menu_nutrition.py
    python scripts/seed_menu_nutrition.py --dry-run
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from database import menu_collection
from services.nutrition_utils import resolve_nutrition_for_item


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    items = list(menu_collection.find({}))
    updated = 0

    for item in items:
        nut = resolve_nutrition_for_item(item)
        if nut["calories"] <= 0:
            print(f"SKIP (no nutrition): {item.get('name')}")
            continue

        if args.dry_run:
            print(f"DRY RUN {item.get('name')}: {nut}")
            updated += 1
            continue

        menu_collection.update_one(
            {"_id": item["_id"]},
            {"$set": nut},
        )
        updated += 1

    print(f"{'Would update' if args.dry_run else 'Updated'} {updated}/{len(items)} menu items")


if __name__ == "__main__":
    main()
