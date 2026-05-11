"""
SentinelX Backend — Flask + SQLite + JWT
Run: python3 server.py
API listens on http://localhost:5000
"""

import sqlite3, hashlib, hmac, os, json, time
from datetime import datetime, timezone
from functools import wraps
from flask import Flask, request, jsonify, g, send_from_directory

import jwt as pyjwt

# ── Config ────────────────────────────────────────────────────
SECRET_KEY     = os.environ.get('SX_SECRET', 'sentinelx-dev-secret-change-in-prod')
DB_PATH        = os.environ.get('SX_DB_PATH', os.path.join(os.path.dirname(__file__), 'sentinelx.db'))
FRONTEND_DIR   = os.path.join(os.path.dirname(__file__), 'frontend')
ACCESS_TTL     = 60 * 60 * 8       # 8 hours
REFRESH_TTL    = 60 * 60 * 24 * 30 # 30 days

app = Flask(__name__, static_folder=None)
app.config['SECRET_KEY'] = SECRET_KEY

# ── DB helpers ────────────────────────────────────────────────
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA journal_mode=WAL')
        g.db.execute('PRAGMA foreign_keys=ON')
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db: db.close()

def query(sql, args=(), one=False):
    cur = get_db().execute(sql, args)
    rv  = cur.fetchall()
    return (rv[0] if rv else None) if one else rv

def execute(sql, args=()):
    db  = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur

def row_to_dict(row):
    return dict(row) if row else None

# ── Schema ────────────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    first      TEXT    NOT NULL,
    last       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'Analyst',
    initials   TEXT,
    color      TEXT,
    bg         TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vm_records (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cvss_id    TEXT    NOT NULL,
    name       TEXT,
    asset      TEXT    NOT NULL,
    severity   TEXT    NOT NULL DEFAULT 'Medium',
    status     TEXT    NOT NULL DEFAULT 'Open',
    ticket     TEXT,
    cvss_score TEXT,
    category   TEXT,
    comment    TEXT,
    period     TEXT,
    evidence   TEXT    DEFAULT '[]',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS esc_records (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        TEXT    NOT NULL,
    asset       TEXT    NOT NULL,
    total_ep    INTEGER NOT NULL DEFAULT 0,
    total_srv   INTEGER NOT NULL DEFAULT 0,
    updated_ep  INTEGER NOT NULL DEFAULT 0,
    updated_srv INTEGER NOT NULL DEFAULT 0,
    ep_pct      INTEGER NOT NULL DEFAULT 0,
    srv_pct     INTEGER NOT NULL DEFAULT 0,
    notes       TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vm_user   ON vm_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vm_period ON vm_records(period);
CREATE INDEX IF NOT EXISTS idx_esc_user  ON esc_records(user_id);
CREATE INDEX IF NOT EXISTS idx_esc_date  ON esc_records(date);
"""

def init_db():
    with sqlite3.connect(DB_PATH) as db:
        db.executescript(SCHEMA)
        # seed default users if empty
        cur = db.execute('SELECT COUNT(*) FROM users')
        if cur.fetchone()[0] == 0:
            defaults = [
                ('Admin',    'User',    'admin@sentinelx.com',   'admin123',   'Admin',   'AU', '#ff6b6b', 'rgba(255,107,107,0.15)'),
                ('Security', 'Analyst', 'analyst@sentinelx.com', 'analyst123', 'Analyst', 'SA', '#58a6ff', 'rgba(88,166,255,0.15)'),
                ('Read',     'Viewer',  'viewer@sentinelx.com',  'viewer123',  'Viewer',  'RV', '#69db7c', 'rgba(105,219,124,0.15)'),
            ]
            for (first, last, email, pw, role, initials, color, bg) in defaults:
                db.execute(
                    'INSERT INTO users (first,last,email,password,role,initials,color,bg) VALUES (?,?,?,?,?,?,?,?)',
                    (first, last, email, hash_pw(pw), role, initials, color, bg)
                )
            db.commit()
        print(f'[SentinelX] DB ready at {DB_PATH}')

# ── Password hashing (sha256 + hmac — no bcrypt needed) ───────
def hash_pw(pw: str) -> str:
    return hmac.new(SECRET_KEY.encode(), pw.encode(), hashlib.sha256).hexdigest()

def check_pw(pw: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_pw(pw), hashed)

# ── JWT helpers ───────────────────────────────────────────────
def make_access_token(user):
    payload = {
        'sub':      user['id'],
        'email':    user['email'],
        'role':     user['role'],
        'type':     'access',
        'exp':      int(time.time()) + ACCESS_TTL,
        'iat':      int(time.time()),
    }
    return pyjwt.encode(payload, SECRET_KEY, algorithm='HS256')

def make_refresh_token(user_id):
    payload = {
        'sub':  user_id,
        'type': 'refresh',
        'exp':  int(time.time()) + REFRESH_TTL,
        'iat':  int(time.time()),
        'jti':  os.urandom(16).hex(),
    }
    token = pyjwt.encode(payload, SECRET_KEY, algorithm='HS256')
    execute(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?,?,?)',
        (user_id, token, int(time.time()) + REFRESH_TTL)
    )
    return token

def decode_token(token):
    return pyjwt.decode(token, SECRET_KEY, algorithms=['HS256'])

# ── Auth middleware ───────────────────────────────────────────
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'Missing token'}), 401
        try:
            payload = decode_token(auth.split(' ', 1)[1])
            if payload.get('type') != 'access':
                return jsonify({'error': 'Invalid token type'}), 401
            g.user_id   = payload['sub']
            g.user_role = payload['role']
            g.user_email= payload['email']
        except pyjwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired', 'code': 'TOKEN_EXPIRED'}), 401
        except pyjwt.InvalidTokenError as e:
            return jsonify({'error': f'Invalid token: {e}'}), 401
        return f(*args, **kwargs)
    return decorated

def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.user_role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# ── CORS (manual, no package needed) ─────────────────────────
@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin']  = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 204

# ── Serve frontend ────────────────────────────────────────────
@app.route('/')
@app.route('/<path:filename>')
def serve_frontend(filename='index.html'):
    safe = filename if filename != '/' else 'index.html'
    try:
        return send_from_directory(FRONTEND_DIR, safe)
    except Exception:
        return send_from_directory(FRONTEND_DIR, 'index.html')

# ══════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════

@app.post('/api/auth/signin')
def signin():
    data  = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    pw    = data.get('password') or ''
    if not email or not pw:
        return jsonify({'error': 'Email and password required'}), 400
    user = row_to_dict(query('SELECT * FROM users WHERE email=? COLLATE NOCASE', (email,), one=True))
    if not user or not check_pw(pw, user['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    access  = make_access_token(user)
    refresh = make_refresh_token(user['id'])
    return jsonify({
        'access_token':  access,
        'refresh_token': refresh,
        'user': _safe_user(user),
    })

@app.post('/api/auth/signup')
def signup():
    data     = request.get_json(silent=True) or {}
    first    = (data.get('first') or '').strip()
    last     = (data.get('last')  or '').strip()
    email    = (data.get('email') or '').strip().lower()
    pw       = data.get('password') or ''
    role     = data.get('role', 'Analyst')
    if not all([first, last, email, pw]):
        return jsonify({'error': 'All fields required'}), 400
    if len(pw) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if role not in ('Admin', 'Analyst', 'Viewer'):
        role = 'Analyst'
    existing = query('SELECT id FROM users WHERE email=? COLLATE NOCASE', (email,), one=True)
    if existing:
        return jsonify({'error': 'Email already registered'}), 409
    colors   = {'Admin': '#ff6b6b', 'Analyst': '#58a6ff', 'Viewer': '#69db7c'}
    bgs      = {'Admin': 'rgba(255,107,107,0.15)', 'Analyst': 'rgba(88,166,255,0.15)', 'Viewer': 'rgba(105,219,124,0.15)'}
    initials = (first[0] + (last[0] if last else '')).upper()
    cur = execute(
        'INSERT INTO users (first,last,email,password,role,initials,color,bg) VALUES (?,?,?,?,?,?,?,?)',
        (first, last, email, hash_pw(pw), role, initials, colors.get(role,'#8d96a0'), bgs.get(role,'rgba(141,150,160,0.15)'))
    )
    user = row_to_dict(query('SELECT * FROM users WHERE id=?', (cur.lastrowid,), one=True))
    access  = make_access_token(user)
    refresh = make_refresh_token(user['id'])
    return jsonify({'access_token': access, 'refresh_token': refresh, 'user': _safe_user(user)}), 201

@app.post('/api/auth/refresh')
def refresh():
    data  = request.get_json(silent=True) or {}
    token = data.get('refresh_token') or ''
    if not token:
        return jsonify({'error': 'Refresh token required'}), 400
    try:
        payload = decode_token(token)
        if payload.get('type') != 'refresh':
            return jsonify({'error': 'Invalid token type'}), 401
    except pyjwt.ExpiredSignatureError:
        return jsonify({'error': 'Refresh token expired, please sign in again', 'code': 'REFRESH_EXPIRED'}), 401
    except pyjwt.InvalidTokenError:
        return jsonify({'error': 'Invalid refresh token'}), 401
    # Verify token exists in DB (not revoked)
    db_token = query('SELECT * FROM refresh_tokens WHERE token=?', (token,), one=True)
    if not db_token:
        return jsonify({'error': 'Token revoked or not found'}), 401
    user = row_to_dict(query('SELECT * FROM users WHERE id=?', (payload['sub'],), one=True))
    if not user:
        return jsonify({'error': 'User not found'}), 401
    # Rotate: delete old, issue new
    execute('DELETE FROM refresh_tokens WHERE token=?', (token,))
    new_access  = make_access_token(user)
    new_refresh = make_refresh_token(user['id'])
    return jsonify({'access_token': new_access, 'refresh_token': new_refresh, 'user': _safe_user(user)})

@app.post('/api/auth/signout')
@require_auth
def signout():
    data  = request.get_json(silent=True) or {}
    token = data.get('refresh_token') or ''
    if token:
        execute('DELETE FROM refresh_tokens WHERE token=?', (token,))
    return jsonify({'ok': True})

@app.get('/api/auth/me')
@require_auth
def me():
    user = row_to_dict(query('SELECT * FROM users WHERE id=?', (g.user_id,), one=True))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': _safe_user(user)})

def _safe_user(u):
    return {k: v for k, v in u.items() if k != 'password'}

# ══════════════════════════════════════════════════════════════
# USER MANAGEMENT ROUTES
# ══════════════════════════════════════════════════════════════

@app.get('/api/users')
@require_auth
def get_users():
    # Admins see all; others see only themselves
    if g.user_role == 'Admin':
        users = [_safe_user(dict(u)) for u in query('SELECT * FROM users ORDER BY id')]
    else:
        users = [_safe_user(dict(u)) for u in query('SELECT * FROM users WHERE id=?', (g.user_id,))]
    return jsonify({'users': users})

@app.delete('/api/users/<int:uid>')
@require_auth
@require_role('Admin')
def delete_user(uid):
    if uid == g.user_id:
        return jsonify({'error': 'Cannot delete yourself'}), 400
    execute('DELETE FROM users WHERE id=?', (uid,))
    return jsonify({'ok': True})

@app.patch('/api/users/<int:uid>/role')
@require_auth
@require_role('Admin')
def update_role(uid):
    data = request.get_json(silent=True) or {}
    role = data.get('role')
    if role not in ('Admin', 'Analyst', 'Viewer'):
        return jsonify({'error': 'Invalid role'}), 400
    execute('UPDATE users SET role=? WHERE id=?', (role, uid))
    return jsonify({'ok': True})

@app.patch('/api/users/me/password')
@require_auth
def change_password():
    data     = request.get_json(silent=True) or {}
    current  = data.get('current_password') or ''
    new_pw   = data.get('new_password') or ''
    if len(new_pw) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    user = row_to_dict(query('SELECT * FROM users WHERE id=?', (g.user_id,), one=True))
    if not check_pw(current, user['password']):
        return jsonify({'error': 'Current password incorrect'}), 401
    execute('UPDATE users SET password=? WHERE id=?', (hash_pw(new_pw), g.user_id))
    # Revoke all refresh tokens (force re-login on other devices)
    execute('DELETE FROM refresh_tokens WHERE user_id=?', (g.user_id,))
    return jsonify({'ok': True})

# ══════════════════════════════════════════════════════════════
# VM ROUTES
# ══════════════════════════════════════════════════════════════

def vm_row(r):
    d = dict(r)
    d['evidence'] = json.loads(d.get('evidence') or '[]')
    return d

@app.get('/api/vm')
@require_auth
def vm_list():
    period = request.args.get('period')
    asset  = request.args.get('asset')
    sql    = 'SELECT * FROM vm_records WHERE user_id=?'
    args   = [g.user_id]
    if period and period != 'all':
        sql += ' AND period=?'; args.append(period)
    if asset and asset != 'all':
        sql += ' AND asset=?'; args.append(asset)
    sql += ' ORDER BY created_at DESC'
    rows = [vm_row(r) for r in query(sql, args)]
    return jsonify({'records': rows})

@app.post('/api/vm')
@require_auth
@require_role('Admin', 'Analyst')
def vm_create():
    data = request.get_json(silent=True) or {}
    if not data.get('asset') or not data.get('cvss_id'):
        return jsonify({'error': 'asset and cvss_id required'}), 400
    cur = execute(
        '''INSERT INTO vm_records
           (user_id,cvss_id,name,asset,severity,status,ticket,cvss_score,category,comment,period,evidence)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
        (g.user_id,
         data.get('cvss_id',''),
         data.get('name',''),
         data.get('asset',''),
         data.get('severity','Medium'),
         data.get('status','Open'),
         data.get('ticket',''),
         data.get('cvss_score',''),
         data.get('category',''),
         data.get('comment',''),
         data.get('period',''),
         json.dumps(data.get('evidence',[])))
    )
    row = vm_row(query('SELECT * FROM vm_records WHERE id=?', (cur.lastrowid,), one=True))
    return jsonify({'record': row}), 201

@app.put('/api/vm/<int:rid>')
@require_auth
@require_role('Admin', 'Analyst')
def vm_update(rid):
    rec = query('SELECT * FROM vm_records WHERE id=? AND user_id=?', (rid, g.user_id), one=True)
    if not rec:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json(silent=True) or {}
    fields = ['cvss_id','name','asset','severity','status','ticket','cvss_score','category','comment','period']
    updates = {f: data[f] for f in fields if f in data}
    if 'evidence' in data:
        updates['evidence'] = json.dumps(data['evidence'])
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    if not updates:
        return jsonify({'record': vm_row(rec)}), 200
    set_clause = ', '.join(f'{k}=?' for k in updates)
    execute(f'UPDATE vm_records SET {set_clause} WHERE id=?', (*updates.values(), rid))
    row = vm_row(query('SELECT * FROM vm_records WHERE id=?', (rid,), one=True))
    return jsonify({'record': row})

@app.delete('/api/vm/<int:rid>')
@require_auth
@require_role('Admin', 'Analyst')
def vm_delete(rid):
    rec = query('SELECT id FROM vm_records WHERE id=? AND user_id=?', (rid, g.user_id), one=True)
    if not rec:
        return jsonify({'error': 'Not found'}), 404
    execute('DELETE FROM vm_records WHERE id=?', (rid,))
    return jsonify({'ok': True})

@app.post('/api/vm/bulk')
@require_auth
@require_role('Admin', 'Analyst')
def vm_bulk():
    data    = request.get_json(silent=True) or {}
    records = data.get('records', [])
    if not records:
        return jsonify({'error': 'No records provided'}), 400
    VALID_SEV    = {'Critical','High','Medium','Low'}
    VALID_STATUS = {'Open','In Progress','Resolved'}
    inserted = 0
    for r in records:
        if not r.get('asset') or not r.get('cvss_id'):
            continue
        execute(
            '''INSERT INTO vm_records
               (user_id,cvss_id,name,asset,severity,status,ticket,cvss_score,category,comment,period,evidence)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
            (g.user_id,
             r.get('cvss_id',''),
             r.get('name',''),
             r.get('asset',''),
             r.get('severity','Medium') if r.get('severity') in VALID_SEV else 'Medium',
             r.get('status','Open')     if r.get('status')   in VALID_STATUS else 'Open',
             r.get('ticket',''),
             r.get('cvss_score',''),
             r.get('category',''),
             r.get('comment','') or r.get('name',''),
             r.get('period',''),
             json.dumps([]))
        )
        inserted += 1
    return jsonify({'inserted': inserted}), 201

# ══════════════════════════════════════════════════════════════
# ESC ROUTES
# ══════════════════════════════════════════════════════════════

def esc_row(r):
    return dict(r)

@app.get('/api/esc')
@require_auth
def esc_list():
    period = request.args.get('period')
    asset  = request.args.get('asset')
    sql    = 'SELECT * FROM esc_records WHERE user_id=?'
    args   = [g.user_id]
    if period and period != 'all':
        sql += ' AND date LIKE ?'; args.append(period + '%')
    if asset and asset != 'all':
        sql += ' AND asset=?'; args.append(asset)
    sql += ' ORDER BY date DESC, created_at DESC'
    rows = [esc_row(r) for r in query(sql, args)]
    return jsonify({'records': rows})

@app.post('/api/esc')
@require_auth
@require_role('Admin', 'Analyst')
def esc_create():
    data = request.get_json(silent=True) or {}
    if not data.get('asset') or not data.get('date'):
        return jsonify({'error': 'asset and date required'}), 400
    tep  = int(data.get('total_ep',  0) or 0)
    tsrv = int(data.get('total_srv', 0) or 0)
    uep  = min(int(data.get('updated_ep',  0) or 0), tep)
    usrv = min(int(data.get('updated_srv', 0) or 0), tsrv)
    ep_pct  = round(uep  / tep  * 100) if tep  > 0 else 0
    srv_pct = round(usrv / tsrv * 100) if tsrv > 0 else 0
    cur = execute(
        '''INSERT INTO esc_records
           (user_id,date,asset,total_ep,total_srv,updated_ep,updated_srv,ep_pct,srv_pct,notes)
           VALUES (?,?,?,?,?,?,?,?,?,?)''',
        (g.user_id, data['date'], data['asset'], tep, tsrv, uep, usrv, ep_pct, srv_pct,
         data.get('notes',''))
    )
    row = esc_row(query('SELECT * FROM esc_records WHERE id=?', (cur.lastrowid,), one=True))
    return jsonify({'record': row}), 201

@app.put('/api/esc/<int:rid>')
@require_auth
@require_role('Admin', 'Analyst')
def esc_update(rid):
    rec = query('SELECT * FROM esc_records WHERE id=? AND user_id=?', (rid, g.user_id), one=True)
    if not rec:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json(silent=True) or {}
    tep  = int(data.get('total_ep',  rec['total_ep'])  or 0)
    tsrv = int(data.get('total_srv', rec['total_srv']) or 0)
    uep  = min(int(data.get('updated_ep',  rec['updated_ep'])  or 0), tep)
    usrv = min(int(data.get('updated_srv', rec['updated_srv']) or 0), tsrv)
    execute(
        '''UPDATE esc_records SET
           date=?, asset=?, total_ep=?, total_srv=?, updated_ep=?, updated_srv=?,
           ep_pct=?, srv_pct=?, notes=?, updated_at=datetime('now')
           WHERE id=?''',
        (data.get('date', rec['date']), data.get('asset', rec['asset']),
         tep, tsrv, uep, usrv,
         round(uep/tep*100) if tep>0 else 0,
         round(usrv/tsrv*100) if tsrv>0 else 0,
         data.get('notes', rec['notes']),
         rid)
    )
    row = esc_row(query('SELECT * FROM esc_records WHERE id=?', (rid,), one=True))
    return jsonify({'record': row})

@app.delete('/api/esc/<int:rid>')
@require_auth
@require_role('Admin', 'Analyst')
def esc_delete(rid):
    rec = query('SELECT id FROM esc_records WHERE id=? AND user_id=?', (rid, g.user_id), one=True)
    if not rec:
        return jsonify({'error': 'Not found'}), 404
    execute('DELETE FROM esc_records WHERE id=?', (rid,))
    return jsonify({'ok': True})

@app.post('/api/esc/bulk')
@require_auth
@require_role('Admin', 'Analyst')
def esc_bulk():
    data    = request.get_json(silent=True) or {}
    records = data.get('records', [])
    if not records:
        return jsonify({'error': 'No records provided'}), 400
    inserted = 0
    for r in records:
        if not r.get('asset') or not r.get('date'):
            continue
        tep  = int(r.get('total_ep',  0) or 0)
        tsrv = int(r.get('total_srv', 0) or 0)
        uep  = min(int(r.get('updated_ep',  0) or 0), tep)
        usrv = min(int(r.get('updated_srv', 0) or 0), tsrv)
        execute(
            '''INSERT INTO esc_records
               (user_id,date,asset,total_ep,total_srv,updated_ep,updated_srv,ep_pct,srv_pct,notes)
               VALUES (?,?,?,?,?,?,?,?,?,?)''',
            (g.user_id, r['date'], r['asset'], tep, tsrv, uep, usrv,
             round(uep/tep*100) if tep>0 else 0,
             round(usrv/tsrv*100) if tsrv>0 else 0,
             r.get('notes',''))
        )
        inserted += 1
    return jsonify({'inserted': inserted}), 201

# ══════════════════════════════════════════════════════════════
# COMPARE ROUTES  — available periods per user
# ══════════════════════════════════════════════════════════════

@app.get('/api/vm/periods')
@require_auth
def vm_periods():
    rows = query(
        "SELECT DISTINCT period FROM vm_records WHERE user_id=? AND period != '' ORDER BY period DESC",
        (g.user_id,)
    )
    return jsonify({'periods': [r['period'] for r in rows]})

@app.get('/api/esc/periods')
@require_auth
def esc_periods():
    rows = query(
        "SELECT DISTINCT substr(date,1,7) AS period FROM esc_records WHERE user_id=? ORDER BY period DESC",
        (g.user_id,)
    )
    return jsonify({'periods': [r['period'] for r in rows]})

# ── Health check ──────────────────────────────────────────────
@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'time': datetime.now(timezone.utc).isoformat()})

# ── Init DB on module load (works for gunicorn + direct run) ──
init_db()

# ── Run ───────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f'[SentinelX] Server running at http://localhost:{port}')
    print('[SentinelX] Default accounts:')
    print('  admin@sentinelx.com   / admin123   (Admin)')
    print('  analyst@sentinelx.com / analyst123 (Analyst)')
    print('  viewer@sentinelx.com  / viewer123  (Viewer)')
    app.run(host='0.0.0.0', port=port, debug=False)
