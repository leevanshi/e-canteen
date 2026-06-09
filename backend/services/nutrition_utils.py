"""Nutrition field extraction, estimation, and health score calculation for menu items."""
import json
import re
from pathlib import Path

_SEED_PATH = Path(__file__).resolve().parents[1] / "data" / "menu_nutrition_seed.json"
_SEED_CACHE: dict | None = None


def _load_seed() -> dict:
    global _SEED_CACHE
    if _SEED_CACHE is None:
        if _SEED_PATH.exists():
            _SEED_CACHE = json.loads(_SEED_PATH.read_text(encoding="utf-8"))
        else:
            _SEED_CACHE = {}
    return _SEED_CACHE


def calculate_health_score(
    calories: float,
    protein: float,
    carbs: float,
    fats: float,
    fiber: float = 0,
    sugar: float = 0,
    sodium: float = 0,
) -> int:
    """Derive a 0–100 health score from macro nutrients."""
    if not calories or calories <= 0:
        return 0

    score = 50.0
    score += min((protein / max(calories / 200, 1)) * 12, 22)
    score += min(fiber * 2.5, 15)
    if calories > 550:
        score -= min((calories - 550) / 25, 18)
    if carbs > 80:
        score -= min((carbs - 80) / 8, 12)
    if fats > 30:
        score -= min((fats - 30) / 4, 10)
    score -= min(sugar / 4, 12)
    score -= min(sodium / 120, 10)

    return max(0, min(100, int(round(score))))


def build_nutrition_record(
    calories: int,
    protein: float,
    carbs: float,
    fats: float,
    fiber: float = 0,
    sugar: float = 0,
    sodium: float = 0,
    serving_size: str = "1 portion",
    health_score: int = 0,
) -> dict:
    if health_score <= 0 and calories > 0:
        health_score = calculate_health_score(
            calories, protein, carbs, fats, fiber, sugar, sodium
        )
    return {
        "calories": int(calories),
        "protein": float(protein),
        "carbs": float(carbs),
        "fats": float(fats),
        "fiber": float(fiber),
        "sugar": float(sugar),
        "sodium": float(sodium),
        "serving_size": serving_size or "1 portion",
        "health_score": int(health_score),
    }


def estimate_nutrition_for_item(item: dict) -> dict:
    """Generate realistic nutrition estimates from item name/category when DB has no data."""
    name = (item.get("name") or "").lower()
    category = (item.get("category") or "").lower()
    price = float(item.get("price") or 50)

    # Category baselines (per portion)
    templates = [
        (r"black coffee|coffee|tea", dict(calories=15, protein=1, carbs=2, fats=0, fiber=0, sugar=1, sodium=5)),
        (r"pastry|brownie|muffin|dessert", dict(calories=320, protein=5, carbs=42, fats=16, fiber=2, sugar=28, sodium=180)),
        (r"kulche|chole|chole kulche", dict(calories=380, protein=14, carbs=52, fats=14, fiber=8, sugar=6, sodium=620)),
        (r"dosa", dict(calories=290, protein=8, carbs=44, fats=10, fiber=3, sugar=3, sodium=480)),
        (r"maggi|noodle", dict(calories=340, protein=9, carbs=48, fats=12, fiber=2, sugar=4, sodium=780)),
        (r"burger|sandwich|wrap|pav", dict(calories=420, protein=14, carbs=46, fats=18, fiber=4, sugar=6, sodium=720)),
        (r"pasta", dict(calories=450, protein=12, carbs=58, fats=16, fiber=3, sugar=5, sodium=640)),
        (r"momo|spring roll", dict(calories=280, protein=10, carbs=32, fats=12, fiber=2, sugar=3, sodium=560)),
        (r"fries|potato", dict(calories=360, protein=5, carbs=48, fats=18, fiber=4, sugar=1, sodium=420)),
        (r"fried rice|rice", dict(calories=390, protein=11, carbs=56, fats=12, fiber=2, sugar=3, sodium=680)),
        (r"paneer|tikka|bhurji|manchurian|chilly", dict(calories=340, protein=18, carbs=22, fats=22, fiber=3, sugar=5, sodium=720)),
        (r"egg|omelette|curry", dict(calories=280, protein=16, carbs=8, fats=20, fiber=1, sugar=2, sodium=520)),
        (r"naan|parantha|garlic bread|bread", dict(calories=260, protein=7, carbs=42, fats=8, fiber=2, sugar=3, sodium=480)),
        (r"mushroom|masala", dict(calories=220, protein=8, carbs=18, fats=14, fiber=4, sugar=4, sodium=540)),
    ]

    base = dict(calories=300, protein=10, carbs=38, fats=12, fiber=3, sugar=5, sodium=500)
    for pattern, tpl in templates:
        if re.search(pattern, name) or re.search(pattern, category):
            base = tpl.copy()
            break

    # Scale slightly by price (campus canteen portions)
    scale = min(max(price / 80, 0.75), 1.35)
    return build_nutrition_record(
        calories=int(base["calories"] * scale),
        protein=round(base["protein"] * scale, 1),
        carbs=round(base["carbs"] * scale, 1),
        fats=round(base["fats"] * scale, 1),
        fiber=round(base.get("fiber", 0) * scale, 1),
        sugar=round(base.get("sugar", 0) * scale, 1),
        sodium=int(base.get("sodium", 0) * scale),
    )


def resolve_nutrition_for_item(item: dict) -> dict:
    """Resolve nutrition from DB fields, seed file, or estimation — never return empty zeros."""
    name = (item.get("name") or "").strip()
    nested = item.get("nutrition") if isinstance(item.get("nutrition"), dict) else {}

    def pick(key, default=0):
        val = item.get(key)
        if val is None:
            val = nested.get(key, default)
        return default if val is None else val

    calories = pick("calories", 0)
    if calories and calories > 0:
        return build_nutrition_record(
            calories=int(calories),
            protein=float(pick("protein", 0)),
            carbs=float(pick("carbs", 0)),
            fats=float(pick("fats", 0)),
            fiber=float(pick("fiber", 0)),
            sugar=float(pick("sugar", 0)),
            sodium=float(pick("sodium", 0)),
            serving_size=pick("serving_size", "1 portion") if isinstance(pick("serving_size", "1 portion"), str) else "1 portion",
            health_score=int(pick("health_score", 0)),
        )

    seed = _load_seed().get(name)
    if seed:
        return build_nutrition_record(
            calories=int(seed.get("calories") or 0),
            protein=float(seed.get("protein") or 0),
            carbs=float(seed.get("carbs") or 0),
            fats=float(seed.get("fats") or 0),
            fiber=float(seed.get("fiber") or 0),
            sugar=float(seed.get("sugar") or 0),
            sodium=float(seed.get("sodium") or 0),
            health_score=int(seed.get("health_score") or 0),
        )

    return estimate_nutrition_for_item(item)


def extract_nutrition(item: dict) -> dict:
    """Public API used by menu routes."""
    return resolve_nutrition_for_item(item)


def ensure_menu_nutrition_seeded(menu_collection) -> int:
    """Persist nutrition to DB for items missing calories. Returns count updated."""
    updated = 0
    for item in menu_collection.find({}):
        if item.get("calories"):
            continue
        nut = resolve_nutrition_for_item(item)
        if nut["calories"] <= 0:
            continue
        menu_collection.update_one({"_id": item["_id"]}, {"$set": nut})
        updated += 1
    return updated
