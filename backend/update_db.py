#!/usr/bin/env python3
import sqlite3
import os

# Database path
db_path = os.path.join(os.path.dirname(__file__), 'aegis_forensics.db')

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Updating case status values...")
    cursor.execute("UPDATE cases SET status = 'OPEN' WHERE status = 'open'")
    cursor.execute("UPDATE cases SET status = 'ANALYZING' WHERE status = 'analyzing'")
    cursor.execute("UPDATE cases SET status = 'CLOSED' WHERE status = 'closed'")
    cursor.execute("UPDATE cases SET status = 'SUSPENDED' WHERE status = 'suspended'")
    
    print("Updating case priority values...")
    cursor.execute("UPDATE cases SET priority = 'HIGH' WHERE priority = 'high'")
    cursor.execute("UPDATE cases SET priority = 'MEDIUM' WHERE priority = 'medium'")
    cursor.execute("UPDATE cases SET priority = 'LOW' WHERE priority = 'low'")
    cursor.execute("UPDATE cases SET priority = 'CRITICAL' WHERE priority = 'critical'")
    
    # Commit changes
    conn.commit()
    print("Database updated successfully!")
    
    # Show updated records
    cursor.execute("SELECT id, case_number, name, status, priority FROM cases")
    cases = cursor.fetchall()
    print("\nUpdated cases:")
    for case in cases:
        print(f"  Case {case[0]}: {case[1]} - {case[2]} - Status: {case[3]}, Priority: {case[4]}")
    
except Exception as e:
    print(f"Error updating database: {e}")
    conn.rollback()
finally:
    conn.close()
