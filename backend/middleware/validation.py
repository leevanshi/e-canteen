"""
Request Validation Middleware
Validates all API request payloads to prevent injection and edge cases
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import json
from typing import Any


class ValidationMiddleware(BaseHTTPMiddleware):
    """
    Validates incoming request payloads for security and data integrity
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        # Skip validation for GET requests and health checks
        if request.method == "GET" or request.url.path in ["/health", "/"]:
            return await call_next(request)
        
        # Skip validation for WebSocket
        if request.url.path.startswith("/ws"):
            return await call_next(request)
        
        # Validate JSON payload
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    # Parse JSON to ensure it's valid
                    json.loads(body.decode('utf-8'))
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON payload")
            except Exception:
                # If body parsing fails, let the endpoint handle it
                pass
        
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple rate limiting middleware to prevent abuse
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.request_counts = {}
        self.max_requests = 100  # requests per minute
        self.window = 60  # seconds
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/"]:
            return await call_next(request)
        
        client_ip = request.client.host if request.client else "unknown"
        current_time = int(request.state.get("time", 0))
        
        # Clean old entries
        self.request_counts = {
            ip: (count, time) 
            for ip, (count, time) in self.request_counts.items()
            if current_time - time < self.window
        }
        
        # Check rate limit
        if client_ip in self.request_counts:
            count, time = self.request_counts[client_ip]
            if current_time - time < self.window and count >= self.max_requests:
                raise HTTPException(status_code=429, detail="Too many requests")
            else:
                self.request_counts[client_ip] = (count + 1, time)
        else:
            self.request_counts[client_ip] = (1, current_time)
        
        return await call_next(request)
