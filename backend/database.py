import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path

DB_PATH = Path("serpent.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        google_id TEXT UNIQUE,
        name TEXT,
        email TEXT,
        avatar_url TEXT,
        country TEXT,
        created_at TIMESTAMP
    )''')
    
    # Scores table
    c.execute('''CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        score INTEGER,
        level INTEGER,
        timestamp TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    
    # Users table update for manual auth
    try:
        c.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
        c.execute("ALTER TABLE users ADD COLUMN username TEXT")
    except sqlite3.OperationalError:
        pass # Columns might already exist

    # Ensure username is unique index
    try:
        c.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_username ON users(username)")
    except:
        pass

    conn.commit()
    conn.close()

def get_user_by_google_id(google_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE google_id = ?", (google_id,))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_username(username):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

def get_user(user_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

def create_manual_user(username, password_hash, name, country):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Check if username exists
    c.execute("SELECT id FROM users WHERE username = ?", (username,))
    if c.fetchone():
        conn.close()
        raise ValueError("Username already exists")

    user_id = str(uuid.uuid4())
    c.execute("INSERT INTO users (id, username, password_hash, name, country, created_at) VALUES (?, ?, ?, ?, ?, ?)",
              (user_id, username, password_hash, name, country, datetime.now()))
    
    conn.commit()
    conn.close()
    return get_user(user_id)

def create_or_update_user(google_id, name, email, avatar_url=None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Check if exists
    c.execute("SELECT id FROM users WHERE google_id = ?", (google_id,))
    existing = c.fetchone()
    
    if existing:
        user_id = existing[0]
        # Update name/avatar if provided
        if avatar_url:
            c.execute("UPDATE users SET name = ?, avatar_url = ? WHERE id = ?", (name, avatar_url, user_id))
        else:
            c.execute("UPDATE users SET name = ? WHERE id = ?", (name, user_id))
    else:
        user_id = str(uuid.uuid4())
        c.execute("INSERT INTO users (id, google_id, name, email, avatar_url, country, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  (user_id, google_id, name, email, avatar_url, "GLOBAL", datetime.now()))
    
    conn.commit()
    conn.close()
    return get_user(user_id)

def update_profile(user_id, name, country=None, avatar_url=None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    updates = []
    params = []
    
    if name:
        updates.append("name = ?")
        params.append(name)
    if country:
        updates.append("country = ?")
        params.append(country)
    if avatar_url:
        updates.append("avatar_url = ?")
        params.append(avatar_url)
        
    params.append(user_id)
    
    if updates:
        sql = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        c.execute(sql, params)
        conn.commit()
        
    conn.close()
    return get_user(user_id)

def add_score(user_id, score, level):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO scores (user_id, score, level, timestamp) VALUES (?, ?, ?, ?)",
              (user_id, score, level, datetime.now()))
    conn.commit()
    conn.close()

def get_leaderboard(country=None, limit=10):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    query = '''
    SELECT u.name, u.country, u.avatar_url, MAX(s.score) as high_score, SUM(s.score) as total_score
    FROM scores s
    JOIN users u ON s.user_id = u.id
    '''
    
    params = []
    if country and country != 'GLOBAL':
        query += " WHERE u.country = ?"
        params.append(country)
        
    query += " GROUP BY s.user_id ORDER BY high_score DESC LIMIT ?"
    params.append(limit)
    
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]
