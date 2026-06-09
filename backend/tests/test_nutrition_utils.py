import sys
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from services.nutrition_utils import extract_nutrition, calculate_health_score


class TestNutritionUtils(unittest.TestCase):
    def test_extract_from_nested_nutrition_object(self):
        item = {
            "name": "Amritsari Kulche & Chole",
            "nutrition": {
                "calories": 227,
                "protein": 24,
                "carbs": 59,
                "fats": 11,
                "health_score": 47,
            },
        }
        nut = extract_nutrition(item)
        self.assertEqual(nut["calories"], 227)
        self.assertEqual(nut["protein"], 24)
        self.assertEqual(nut["health_score"], 47)

    def test_extract_from_flat_fields(self):
        item = {
            "name": "Tea",
            "calories": 506,
            "protein": 10,
            "carbs": 26,
            "fats": 18,
            "health_score": 59,
        }
        nut = extract_nutrition(item)
        self.assertEqual(nut["calories"], 506)
        self.assertEqual(nut["health_score"], 59)

    def test_calculate_health_score_when_missing(self):
        item = {"calories": 300, "protein": 20, "carbs": 30, "fats": 10}
        nut = extract_nutrition(item)
        self.assertGreater(nut["health_score"], 0)
        self.assertLessEqual(nut["health_score"], 100)


if __name__ == "__main__":
    unittest.main()
