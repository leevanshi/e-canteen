"""
Centralized Error Monitoring & Logging Service
Logs all system events with timestamps, severity levels, and context
"""
import logging
import sys
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from database import error_logs_collection
from bson import ObjectId

class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class ErrorLogger:
    """Centralized error logging service"""
    
    def __init__(self):
        self.logger = logging.getLogger("e-canteen")
        self.logger.setLevel(logging.INFO)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '%(asctime)s [%(levelname)s] %(name)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
    
    def _log_to_database(
        self,
        level: LogLevel,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None
    ):
        """Log event to database for persistence and analysis"""
        try:
            log_entry = {
                "level": level.value,
                "message": message,
                "context": context or {},
                "user_id": user_id,
                "request_id": request_id,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
            error_logs_collection.insert_one(log_entry)
        except Exception as e:
            # Don't fail if database logging fails
            self.logger.error(f"Failed to log to database: {e}")
    
    def debug(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs):
        """Log debug message"""
        self.logger.debug(message)
        self._log_to_database(LogLevel.DEBUG, message, context, **kwargs)
    
    def info(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs):
        """Log info message"""
        self.logger.info(message)
        self._log_to_database(LogLevel.INFO, message, context, **kwargs)
    
    def warning(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs):
        """Log warning message"""
        self.logger.warning(message)
        self._log_to_database(LogLevel.WARNING, message, context, **kwargs)
    
    def error(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs):
        """Log error message"""
        self.logger.error(message)
        self._log_to_database(LogLevel.ERROR, message, context, **kwargs)
    
    def critical(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs):
        """Log critical message"""
        self.logger.critical(message)
        self._log_to_database(LogLevel.CRITICAL, message, context, **kwargs)
    
    def log_auth_failure(
        self,
        reason: str,
        email: Optional[str] = None,
        ip_address: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """Log authentication failure"""
        self.error(
            f"Authentication failure: {reason}",
            context={
                "type": "auth_failure",
                "email": email,
                "ip_address": ip_address,
                **(context or {})
            }
        )
    
    def log_order_failure(
        self,
        order_id: Optional[str],
        reason: str,
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """Log order placement failure"""
        self.error(
            f"Order placement failure: {reason}",
            context={
                "type": "order_failure",
                "order_id": order_id,
                "user_id": user_id,
                **(context or {})
            },
            user_id=user_id
        )
    
    def log_payment_failure(
        self,
        order_id: Optional[str],
        reason: str,
        amount: Optional[float] = None,
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """Log payment failure"""
        self.error(
            f"Payment failure: {reason}",
            context={
                "type": "payment_failure",
                "order_id": order_id,
                "amount": amount,
                "user_id": user_id,
                **(context or {})
            },
            user_id=user_id
        )
    
    def log_inventory_failure(
        self,
        item_id: Optional[str],
        reason: str,
        context: Optional[Dict[str, Any]] = None
    ):
        """Log inventory operation failure"""
        self.error(
            f"Inventory operation failure: {reason}",
            context={
                "type": "inventory_failure",
                "item_id": item_id,
                **(context or {})
            }
        )
    
    def log_system_error(
        self,
        component: str,
        reason: str,
        context: Optional[Dict[str, Any]] = None
    ):
        """Log system-level error"""
        self.critical(
            f"System error in {component}: {reason}",
            context={
                "type": "system_error",
                "component": component,
                **(context or {})
            }
        )

# Global error logger instance
error_logger = ErrorLogger()
