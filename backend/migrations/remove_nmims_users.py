"""
Database Migration: Remove all @nmims.in users and associated data
This script permanently deletes all users with @nmims.in email addresses
and their associated data from all collections.
"""

import sys
from pathlib import Path

# Add parent directory to path to import database module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import (
    users_collection,
    orders_collection,
    wallet_collection,
    wallet_txn_collection,
    otp_collection,
    feedback_collection,
    audit_collection,
    inventory_collection,
    monthly_menu_collection,
    counters_collection
)
from pymongo import MongoClient
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def remove_nmims_users():
    """
    Remove all users with @nmims.in email addresses and their associated data.
    """
    
    logger.info("=" * 80)
    logger.info("STARTING MIGRATION: Remove @nmims.in users")
    logger.info("=" * 80)
    
    # Find all users with @nmims.in email
    nmims_users = list(users_collection.find({"email": {"$regex": r"@nmims\.in$", "$options": "i"}}))
    
    if not nmims_users:
        logger.info("No @nmims.in users found. Migration complete.")
        return
    
    logger.info(f"Found {len(nmims_users)} users with @nmims.in email addresses")
    
    # Get all user IDs
    user_ids = [str(user["_id"]) for user in nmims_users]
    
    # Log users to be deleted
    logger.info("Users to be deleted:")
    for user in nmims_users:
        logger.info(f"  - {user.get('email')} (ID: {user['_id']}, Role: {user.get('role')})")
    
    # Confirm before deletion
    response = input("\nAre you sure you want to delete these users and ALL their associated data? (yes/no): ")
    if response.lower() != "yes":
        logger.info("Migration cancelled by user.")
        return
    
    logger.info("\nDeleting associated data...")
    
    # Delete orders
    orders_result = orders_collection.delete_many({"user_id": {"$in": user_ids}})
    logger.info(f"  - Deleted {orders_result.deleted_count} orders")
    
    # Delete wallet records
    wallet_result = wallet_collection.delete_many({"user_id": {"$in": [ObjectId(uid) for uid in user_ids]}})
    logger.info(f"  - Deleted {wallet_result.deleted_count} wallet records")
    
    # Delete wallet transactions
    wallet_txn_result = wallet_txn_collection.delete_many({"user_id": {"$in": user_ids}})
    logger.info(f"  - Deleted {wallet_txn_result.deleted_count} wallet transactions")
    
    # Delete OTP records
    otp_result = otp_collection.delete_many({"email": {"$regex": r"@nmims\.in$", "$options": "i"}})
    logger.info(f"  - Deleted {otp_result.deleted_count} OTP records")
    
    # Delete feedback
    feedback_result = feedback_collection.delete_many({"user_id": {"$in": user_ids}})
    logger.info(f"  - Deleted {feedback_result.deleted_count} feedback records")
    
    # Delete audit logs
    audit_result = audit_collection.delete_many({"user_id": {"$in": user_ids}})
    logger.info(f"  - Deleted {audit_result.deleted_count} audit logs")
    
    # Finally, delete the users
    users_result = users_collection.delete_many({"email": {"$regex": r"@nmims\.in$", "$options": "i"}})
    logger.info(f"  - Deleted {users_result.deleted_count} users")
    
    logger.info("\n" + "=" * 80)
    logger.info("MIGRATION COMPLETE")
    logger.info("=" * 80)
    logger.info(f"Total users deleted: {users_result.deleted_count}")
    logger.info(f"Total orders deleted: {orders_result.deleted_count}")
    logger.info(f"Total wallet records deleted: {wallet_result.deleted_count}")
    logger.info(f"Total wallet transactions deleted: {wallet_txn_result.deleted_count}")
    logger.info(f"Total OTP records deleted: {otp_result.deleted_count}")
    logger.info(f"Total feedback records deleted: {feedback_result.deleted_count}")
    logger.info(f"Total audit logs deleted: {audit_result.deleted_count}")
    logger.info("=" * 80)


if __name__ == "__main__":
    try:
        remove_nmims_users()
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
