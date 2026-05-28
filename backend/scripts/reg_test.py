import requests, sys, time

base='http://127.0.0.1:8002/auth'
email='leevanshi.sharma813@nmims.in'

try:
    r = requests.post(base+'/send-otp', json={'email': email}, timeout=60)
    print('SEND_OTP', r.status_code, r.text)
    if r.status_code != 200:
        sys.exit(1)
    otp = r.json().get('otp')
    time.sleep(0.5)
    r = requests.post(base+'/verify-otp', json={'email': email, 'otp': otp}, timeout=60)
    print('VERIFY_OTP', r.status_code, r.text)
    if r.status_code != 200:
        sys.exit(1)
    payload = {'name':'Lee Evanshi','email':email,'password':'TestPass123','role':'student'}
    r = requests.post(base+'/register', json=payload, timeout=60)
    print('REGISTER', r.status_code, r.text)
except Exception as e:
    print('ERROR', type(e).__name__, e)
    sys.exit(1)
