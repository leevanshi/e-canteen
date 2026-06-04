#!/usr/bin/env python3
"""
Small debug script to print registered FastAPI routes from server.py.
Usage: python backend/print_routes.py
"""
from pathlib import Path
import sys
import os

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Load env
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except Exception:
    pass

try:
    import server
except Exception as e:
    print('ERROR: failed to import server module:', e)
    raise

print('\nRegistered FastAPI routes:')
for route in server.app.routes:
    try:
        methods = getattr(route, 'methods', None)
        print(route.path, methods)
    except Exception:
        print(route)

print('\nDone.')
