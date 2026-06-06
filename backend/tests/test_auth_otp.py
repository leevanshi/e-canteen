import os
import sys
import unittest
from pathlib import Path
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure backend is importable when tests run from repo root.
ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
import server


class FakeCollection:
    def __init__(self):
        self._documents = []

    def delete_many(self, query):
        self._documents = [doc for doc in self._documents if not all(doc.get(k) == v for k, v in query.items())]

    def insert_one(self, document):
        self._documents.append(document)
        return MagicMock(inserted_id=1)

    def find_one(self, query):
        for doc in self._documents:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def update_one(self, query, update):
        doc = self.find_one(query)
        if not doc:
            return MagicMock(modified_count=0)
        for op, values in update.items():
            if op == "$set":
                doc.update(values)
        return MagicMock(modified_count=1)


class TestAuthOtpFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["SMTP_SUPPRESS_SEND"] = "True"
        os.environ["SMTP_DEBUG"] = "True"

        # Prevent startup from attempting a real MongoDB connection.
        cls.connect_patcher = patch("server.connect_with_retry")
        cls.init_patcher = patch("server.init_indexes")
        cls.mock_connect = cls.connect_patcher.start()
        cls.mock_init = cls.init_patcher.start()
        cls.addClassCleanup(cls.connect_patcher.stop)
        cls.addClassCleanup(cls.init_patcher.stop)

        cls.client = TestClient(server.app)

    def setUp(self):
        self.otp_collection = FakeCollection()
        self.users_collection = FakeCollection()
        self.patcher_otp = patch("routes.auth.otp_collection", self.otp_collection)
        self.patcher_users = patch("routes.auth.users_collection", self.users_collection)
        self.mock_otp = self.patcher_otp.start()
        self.mock_users = self.patcher_users.start()
        self.addCleanup(self.patcher_otp.stop)
        self.addCleanup(self.patcher_users.stop)

        self.send_otp_email = AsyncMock(return_value=True)
        self.welcome_email = AsyncMock(return_value=True)
        self.patcher_send_otp = patch("routes.auth.send_otp_email", self.send_otp_email)
        self.patcher_welcome = patch("routes.auth.send_welcome_email", self.welcome_email)
        self.patcher_send_otp.start()
        self.patcher_welcome.start()
        self.addCleanup(self.patcher_send_otp.stop)
        self.addCleanup(self.patcher_welcome.stop)

        routes_auth = __import__("routes.auth", fromlist=["otp_requests"])
        routes_auth.otp_requests.clear()

    def test_gmail_registration_flow(self):
        email = "testuser@gmail.com"
        password = "StrongPass1"

        # Step 1: send OTP
        response = self.client.post("/auth/send-otp", json={"email": email})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "OTP sent to email")
        self.assertTrue(self.send_otp_email.called)

        # Frozen OTP inserted by the route; retrieve it from the fake collection.
        otp_record = self.otp_collection.find_one({"email": email})
        self.assertIsNotNone(otp_record)
        self.assertIn("otp", otp_record)

        # Step 2: verify OTP
        verify_response = self.client.post("/auth/verify-otp", json={"email": email, "otp": otp_record["otp"]})
        self.assertEqual(verify_response.status_code, 200)
        self.assertEqual(verify_response.json()["message"], "OTP verified successfully")

        # Step 3: register user after OTP verification
        register_response = self.client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": email,
                "password": password,
                "role": "student",
            },
        )
        self.assertEqual(register_response.status_code, 200)
        self.assertEqual(register_response.json()["message"], "Student registered successfully")

        user_record = self.users_collection.find_one({"email": email})
        self.assertIsNotNone(user_record)
        self.assertEqual(user_record["name"], "Test User")


if __name__ == "__main__":
    unittest.main()
