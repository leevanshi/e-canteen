"""Nutrition field extraction and health score calculation for menu items."""


def calculate_health_score(
    calories: float,
    protein: float,
    carbs: float,
    fats: float,
    fiber: float = 0,
    sugar: float = 0,
    sodium: float = 0,
) -> int:
    """Derive a 0–100 health score from macro nutrients when none is stored."""
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


def extract_nutrition(item: dict) -> dict:
    """Read nutrition from flat fields or nested `nutrition` object."""
    nested = item.get("nutrition") if isinstance(item.get("nutrition"), dict) else {}

    def pick(key, default=0):
        val = item.get(key)
        if val is None:
            val = nested.get(key, default)
        return default if val is None else val

    calories = pick("calories", 0)
    protein = pick("protein", 0.0)
    carbs = pick("carbs", 0.0)
    fats = pick("fats", 0.0)
    fiber = pick("fiber", 0.0)
    sugar = pick("sugar", 0.0)
    sodium = pick("sodium", 0.0)
    serving_size = pick("serving_size", "1 portion")
    if serving_size == 0:
        serving_size = nested.get("serving_size", "1 portion")

    health_score = pick("health_score", 0)
    if (not health_score or health_score == 0) and calories > 0:
        health_score = calculate_health_score(
            calories, protein, carbs, fats, fiber, sugar, sodium
        )

    return {
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fats": fats,
        "fiber": fiber,
        "sugar": sugar,
        "sodium": sodium,
        "serving_size": serving_size if isinstance(serving_size, str) else "1 portion",
        "health_score": health_score,
    }
