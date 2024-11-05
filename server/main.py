# server/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import hashlib
import secrets
import string
from datetime import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default master password (for testing purposes)
DEFAULT_MASTER_PASSWORD = "admin123"
DEFAULT_MASTER_PASSWORD_HASH = hashlib.sha256(DEFAULT_MASTER_PASSWORD.encode()).hexdigest()

# Add this model for delete request
class DeletePasswordRequest(BaseModel):
    master_password: str

# Database initialization
def init_db():
    conn = sqlite3.connect('passwords.db')
    c = conn.cursor()
    
    # Create tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            master_password_hash TEXT NOT NULL
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS passwords (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT,
            email TEXT NOT NULL,  -- New field
            category_id INTEGER,
            password TEXT NOT NULL,
            created_at TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
    ''')

    # Check if default master password exists, if not insert it
    c.execute('SELECT id FROM users WHERE id = 1')
    if not c.fetchone():
        c.execute('INSERT INTO users (id, master_password_hash) VALUES (1, ?)', 
                 (DEFAULT_MASTER_PASSWORD_HASH,))
        
        # Insert some default categories for testing
        categories = ['Uncategorized', 'Email', 'Social Media', 'Banking', 'Work']
        for category in categories:
            c.execute('INSERT INTO categories (name) VALUES (?)', (category,))
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Pydantic models
class User(BaseModel):
    master_password: str

class Category(BaseModel):
    name: str

class PasswordItem(BaseModel):
    name: str
    email: str  # New field
    url: Optional[str] = None
    category_id: Optional[int] = None
    password: str
    master_password: str

# Authentication
def verify_master_password(master_password: str):
    conn = sqlite3.connect('passwords.db')
    c = conn.cursor()
    c.execute('SELECT master_password_hash FROM users WHERE id = 1')
    result = c.fetchone()
    conn.close()
    
    if not result:
        return False
    
    hashed_input = hashlib.sha256(master_password.encode()).hexdigest()
    return hashed_input == result[0]

# Routes
@app.post("/auth/setup")
async def setup_master_password(user: User):
    conn = sqlite3.connect('passwords.db')
    c = conn.cursor()
    
    # Check if master password already exists
    c.execute('SELECT id FROM users WHERE id = 1')
    if c.fetchone():
        raise HTTPException(status_code=400, detail="Master password already set")
    
    # Hash and store master password
    hashed_password = hashlib.sha256(user.master_password.encode()).hexdigest()
    c.execute('INSERT INTO users (id, master_password_hash) VALUES (1, ?)', (hashed_password,))
    
    conn.commit()
    conn.close()
    return {"message": "Master password set successfully"}

@app.post("/auth/login")
async def login(user: User):
    if verify_master_password(user.master_password):
        return {"message": "Login successful"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid master password"
    )

@app.post("/categories")
async def create_category(category: Category, master_password: str):
    if not verify_master_password(master_password):
        raise HTTPException(status_code=401, detail="Invalid master password")
    
    conn = sqlite3.connect('passwords.db')
    c = conn.cursor()
    c.execute('INSERT INTO categories (name) VALUES (?)', (category.name,))
    category_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return {"id": category_id, "name": category.name}

@app.get("/categories")
async def get_categories(master_password: str):
    if not verify_master_password(master_password):
        raise HTTPException(status_code=401, detail="Invalid master password")
    
    conn = sqlite3.connect('passwords.db')
    c = conn.cursor()
    c.execute('SELECT id, name FROM categories')
    categories = [{"id": row[0], "name": row[1]} for row in c.fetchall()]
    conn.close()
    
    return categories

@app.post("/passwords")
async def create_password(password_item: PasswordItem):
    if not verify_master_password(password_item.master_password):
        raise HTTPException(status_code=401, detail="Invalid master password")
    
    conn = sqlite3.connect('passwords.db')
    c = conn.cursor()
    c.execute(
        'INSERT INTO passwords (name, email, url, category_id, password, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        (password_item.name, password_item.email, password_item.url, password_item.category_id, 
         password_item.password, datetime.now())
    )
    password_id = c.lastrowid
    conn.commit()
    conn.close()
    
    response_data = password_item.dict()
    del response_data['master_password']
    return {"id": password_id, **response_data}

@app.get("/passwords")
async def get_passwords(master_password: str):
    if not verify_master_password(master_password):
        raise HTTPException(status_code=401, detail="Invalid master password")
    
    conn = sqlite3.connect('passwords.db')
    c = conn.cursor()
    c.execute('''
        SELECT p.id, p.name, p.email, p.url, p.category_id, c.name, p.password, p.created_at 
        FROM passwords p 
        LEFT JOIN categories c ON p.category_id = c.id
    ''')
    passwords = [
        {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "url": row[3],
            "category_id": row[4],
            "category_name": row[5],
            "password": row[6],
            "created_at": row[7]
        }
        for row in c.fetchall()
    ]
    conn.close()
    
    return passwords

@app.get("/generate-password")
async def generate_password(
    length: int = 16,
    include_uppercase: bool = True,
    include_numbers: bool = True,
    include_symbols: bool = True
):
    characters = string.ascii_lowercase
    if include_uppercase:
        characters += string.ascii_uppercase
    if include_numbers:
        characters += string.digits
    if include_symbols:
        characters += "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return {"password": password}


@app.delete("/passwords/{password_id}")
async def delete_password(password_id: int, request: DeletePasswordRequest):
    if not verify_master_password(request.master_password):
        raise HTTPException(status_code=401, detail="Invalid master password")
    
    conn = sqlite3.connect('passwords.db')
    c = conn.cursor()
    c.execute('DELETE FROM passwords WHERE id = ?', (password_id,))
    conn.commit()
    conn.close()
    
    return {"message": "Password deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)