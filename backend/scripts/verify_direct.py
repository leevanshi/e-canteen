import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from database import otp_collection
from datetime import datetime, timezone
email='test@example.com'
try:
    rec = otp_collection.find_one({'email': email, 'otp': '653246'})
    print('rec', rec)
    if not rec:
        print('No record')
        sys.exit(1)
    if rec['expires_at'] < datetime.now(timezone.utc):
        print('Expired')
        sys.exit(1)
    otp_collection.update_one({'email': email}, {'$set': {'verified': True}})
    print('Updated')
except Exception as e:
    print('ERROR', type(e).__name__, e)
    sys.exit(1)
