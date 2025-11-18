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
    
    print("Updating evidence file_size and file_type from file_path...")
    cursor.execute("SELECT id, filename, file_path FROM evidence WHERE file_size IS NULL OR file_type IS NULL")
    evidence_list = cursor.fetchall()
    
    for evidence_id, filename, file_path in evidence_list:
        file_size = 0
        file_type = "unknown"
        
        # Get file size
        if file_path and os.path.exists(file_path):
            try:
                file_size = os.path.getsize(file_path)
            except:
                pass
        
        # Get file type from filename
        if filename:
            file_type = os.path.splitext(filename)[1].lower()
            if not file_type:
                file_type = "unknown"
        
        cursor.execute(
            "UPDATE evidence SET file_size = ?, file_type = ? WHERE id = ?",
            (file_size, file_type, evidence_id)
        )
        print(f"  Updated evidence {evidence_id}: {filename} - Size: {file_size} bytes, Type: {file_type}")
    
    # Commit changes
    conn.commit()
    print("\nDatabase updated successfully!")
    
    # Show updated records
    cursor.execute("SELECT id, case_number, name, status, priority FROM cases")
    cases = cursor.fetchall()
    print("\nUpdated cases:")
    for case in cases:
        print(f"  Case {case[0]}: {case[1]} - {case[2]} - Status: {case[3]}, Priority: {case[4]}")
    
    cursor.execute("SELECT id, filename, file_size, file_type FROM evidence")
    evidence = cursor.fetchall()
    print("\nUpdated evidence:")
    for ev in evidence:
        print(f"  Evidence {ev[0]}: {ev[1]} - Size: {ev[2]} bytes, Type: {ev[3]}")
    
except Exception as e:
    print(f"Error updating database: {e}")
    conn.rollback()
finally:
    conn.close()
