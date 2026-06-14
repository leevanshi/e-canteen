"""
Security Middleware for Admin Routes
Provides enhanced security validation for admin endpoints
"""

from fastapi import HTTPException, Request
from routes.auth import get_current_user_from_header
import logging

logger = logging.getLogger(__name__)


async def validate_admin_request(request: Request):
    """
    Validate that the request is from an authenticated admin user.
    This middleware should be applied to all admin routes.
    """
    
    # Get authorization header
    auth_header = request.headers.get("authorization")
    
    if not auth_header:
        logger.warning(f"Unauthorized access attempt to {request.url.path} - No auth header")
        raise HTTPException(401, "Authorization required")
    
    try:
        # Validate token and get user
        user = get_current_user_from_header(auth_header)
        
        # Validate admin role
        if user.get("role") != "admin":
            logger.warning(f"Unauthorized access attempt to {request.url.path} - User role: {user.get('role')}")
            raise HTTPException(403, "Admin access required")
        
        # Attach user to request state for use in route handlers
        request.state.user = user
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Security validation failed for {request.url.path}: {e}")
        raise HTTPException(401, "Invalid authentication")


async def validate_token_integrity(request: Request):
    """
    Validate JWT token integrity and expiration.
    Additional security check beyond basic authentication.
    """
    
    auth_header = request.headers.get("authorization")
    
    if not auth_header:
        raise HTTPException(401, "Authorization required")
    
    try:
        user = get_current_user_from_header(auth_header)
        
        # Additional validation checks can be added here
        # - Check if token is blacklisted
        # - Check if user session is active
        # - Check IP restrictions
        # - Check device fingerprint
        
        request.state.user = user
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
        raise HTTPException(401, "Invalid or expired token")


def log_admin_action(action: str, user_id: str, details: dict = None):
    """
    Log admin actions for audit trail.
    """
    try:
        from services.audit import log_audit
        log_audit(action, user_id=user_id, details=details or {})
    except Exception as e:
        logger.error(f"Failed to log admin action: {e}")
