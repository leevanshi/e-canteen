import logging
from database import users_collection

logger = logging.getLogger(__name__)


# ================= WALLET DEDUCTION =================

def handle_wallet_deduction(data):
    """
    Deduct wallet balance when an order is created.
    """

    try:

        user_id = data.get("user_id")
        total = data.get("total")

        if not user_id or not total:
            return

        users_collection.update_one(
            {"_id": user_id},
            {"$inc": {"wallet_balance": -total}}
        )

        logger.info(f"Wallet deducted: {total} for user {user_id}")

    except Exception as e:
        logger.error(f"Wallet deduction failed: {e}")


# ================= KITCHEN LOG =================

def handle_kitchen_log(data):
    """
    Log order for kitchen processing.
    """

    try:

        order_id = data.get("order_id")

        logger.info(f"Kitchen received order {order_id}")

    except Exception as e:
        logger.error(f"Kitchen log failed: {e}")