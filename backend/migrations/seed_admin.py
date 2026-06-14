"""
Database Migration: Seed default admin account
This script creates a single default admin account with secure credentials.
"""

import sys
from pathlib import Path

# Add parent directory to path to import database module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import users_collection, wallet_collection
from passlib.context import CryptContext
from datetime import datetime, timezone
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Secure password hashing
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")

# Default admin credentials
DEFAULT_ADMIN_EMAIL = "admin@ecanteen.com"
DEFAULT_ADMIN_PASSWORD = "ChangeMe123!"  # Temporary password, must be changed in production
DEFAULT_ADMIN_NAME = "System Administrator"


def seed_admin_account():
    """
    Create a single default admin account.
    If an admin already exists, this will skip creation.
    """
    
    logger.info("=" * 80)
    logger.info("STARTING MIGRATION: Seed Default Admin Account")
    logger.info("=" * 80)
    
    # Check if admin already exists
    existing_admin = users_collection.find_one({"role": "admin"})
    
    if existing_admin:
        logger.info(f"Admin account already exists: {existing_admin.get('email')}")
        logger.info("Skipping admin creation.")
        return
    
    # Hash the password
    hashed_password = pwd_context.hash(DEFAULT_ADMIN_PASSWORD)
    
    # Create admin user
    admin_user = {
        "name": DEFAULT_ADMIN_NAME,
        "email": DEFAULT_ADMIN_EMAIL,
        "password": hashed_password,
        "role": "admin",
        "created_at": datetime.now(timezone.utc),
        "is_default_admin": True  # Flag to identify this as the default admin
    }
    
    try:
        # Insert admin user
        result = users_collection.insert_one(admin_user)
        admin_id = result.inserted_id
        
        logger.info(f"Created admin account with ID: {admin_id}")
        logger.info(f"Email: {DEFAULT_ADMIN_EMAIL}")
        logger.info(f"Password: {DEFAULT_ADMIN_PASSWORD} (TEMPORARY - CHANGE IMMEDIATELY)")
        
        # Create wallet for admin
        wallet = {
            "user_id": admin_id,
            "balance": 0,
            "created_at": datetime.now(timezone.utc)
        }
        wallet_collection.insert_one(wallet)
        
        logger.info("Created wallet for admin account")
        
        logger.info("\n" + "=" * 80)
        logger.info("MIGRATION COMPLETE")
        logger.info("=" * 80)
        logger.info("IMPORTANT: Change the default admin password immediately!")
        logger.info("This can only be done through direct database update or secure backend process.")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"Failed to create admin account: {e}")
        raise


if __name__ == "__main__":
    try:
        seed_admin_account()
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
