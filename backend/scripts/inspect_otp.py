import sys, os, bson.json_util as j
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from database import otp_collection
rec = otp_collection.find_one({'email':'leevanshi.sharma813@nmims.in'})
print(j.dumps(rec))
