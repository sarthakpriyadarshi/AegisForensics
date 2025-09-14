#!/usr/bin/env python3
"""
Database Initialization Script for Aegis Forensics
This script creates the database and tables if they don't exist,
and optionally seeds with sample data.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from models import init_db, DB_URL, SessionLocal
from models import User, Case, CaseStatus, CasePriority
import bcrypt

def check_database_status():
    """Check if database exists and has data"""
    db_path = DB_URL.replace('sqlite:///', '')
    db_exists = os.path.exists(db_path)
    
    print(f"Database path: {os.path.abspath(db_path)}")
    print(f"Database exists: {db_exists}")
    
    if db_exists:
        session = SessionLocal()
        try:
            user_count = session.query(User).count()
            case_count = session.query(Case).count()
            print(f"Users in database: {user_count}")
            print(f"Cases in database: {case_count}")
        except Exception as e:
            print(f"Error checking database contents: {e}")
        finally:
            session.close()
    
    return db_exists

def force_recreate_database():
    """Force recreate the database (WARNING: This will delete all data!)"""
    db_path = DB_URL.replace('sqlite:///', '')
    
    if os.path.exists(db_path):
        response = input(f"WARNING: This will delete the existing database at {db_path}. Continue? (y/N): ")
        if response.lower() != 'y':
            print("Operation cancelled.")
            return False
        
        os.remove(db_path)
        print("Existing database deleted.")
    
    init_db()
    print("Database recreated successfully!")
    return True

def add_sample_user():
    """Add a sample admin user interactively"""
    session = SessionLocal()
    try:
        print("\n=== Creating Admin User ===")
        full_name = input("Full Name (Admin User): ").strip() or "Admin User"
        email = input("Email (admin@aegisforensics.com): ").strip() or "admin@aegisforensics.com"
        organization = input("Organization (Aegis Forensics): ").strip() or "Aegis Forensics"
        
        # Check if user already exists
        existing_user = session.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists!")
            return
        
        password = input("Password (admin123): ").strip() or "admin123"
        
        # Hash password
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        user = User(
            full_name=full_name,
            email=email,
            organization=organization,
            timezone="UTC",
            password_hash=password_hash,
            is_admin=True
        )
        
        session.add(user)
        session.commit()
        print(f"Admin user created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        
    except Exception as e:
        print(f"Error creating user: {e}")
        session.rollback()
    finally:
        session.close()

def main():
    """Main function"""
    print("=== Aegis Forensics Database Initialization ===\n")
    
    while True:
        print("Options:")
        print("1. Check database status")
        print("2. Initialize database (create if not exists)")
        print("3. Force recreate database (WARNING: Deletes all data)")
        print("4. Add admin user")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == '1':
            check_database_status()
        
        elif choice == '2':
            print("Initializing database...")
            init_db()
            print("Database initialization complete!")
        
        elif choice == '3':
            force_recreate_database()
        
        elif choice == '4':
            add_sample_user()
        
        elif choice == '5':
            print("Goodbye!")
            break
        
        else:
            print("Invalid choice. Please enter 1-5.")
        
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    main()
