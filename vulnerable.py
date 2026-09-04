# vulnerable.py
import os
import sqlite3

# 1. Hardcoded API Key (AI should flag this)
AWS_SECRET_KEY = "AKIAIOSFODNN7INVALIDKEY"

def search_user(user_input):
    # 2. SQL Injection (Semgrep & SonarQube should flag this)
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE username = '{user_input}'"
    cursor.execute(query)
    return cursor.fetchall()

def run_command(cmd):
    # 3. Command Injection (Semgrep & SonarQube should flag this)
    os.system(cmd)