#!/usr/bin/env python
"""
Check if Friend model has the required columns
"""

import os
import sys
import django
from django.db import connection

# Setup Django
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

def check_friend_table():
    """Check Friend table structure"""
    try:
        with connection.cursor() as cursor:
            # Check if table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='todo_friend';")
            table_exists = cursor.fetchone()
            
            if not table_exists:
                print("❌ Friend table doesn't exist!")
                return
            
            print("✅ Friend table exists")
            
            # Get table columns
            cursor.execute("PRAGMA table_info(todo_friend);")
            columns = cursor.fetchall()
            
            print("\n📋 Columns in Friend table:")
            column_names = []
            for col in columns:
                print(f"   - {col[1]} ({col[2]})")
                column_names.append(col[1])
            
            # Check for required columns
            print("\n🔍 Checking required columns:")
            required_columns = ['friend_email', 'is_invitation']
            
            for col in required_columns:
                if col in column_names:
                    print(f"   ✅ {col} - EXISTS")
                else:
                    print(f"   ❌ {col} - MISSING")
            
            # Check Friend records
            cursor.execute("SELECT COUNT(*) FROM todo_friend;")
            count = cursor.fetchone()[0]
            print(f"\n📊 Total Friend records: {count}")
            
            # Try to check for invitations
            if 'is_invitation' in column_names:
                cursor.execute("SELECT COUNT(*) FROM todo_friend WHERE is_invitation = 1;")
                invitation_count = cursor.fetchone()[0]
                print(f"📧 Invitation records: {invitation_count}")
                
                if invitation_count > 0:
                    cursor.execute("SELECT id, friend_email FROM todo_friend WHERE is_invitation = 1;")
                    invitations = cursor.fetchall()
                    print("\n📧 Invitation details:")
                    for inv in invitations:
                        print(f"   ID: {inv[0]}, Email: {inv[1]}")
            else:
                print("⚠️ Cannot check invitations - column doesn't exist")
            
            print("\n" + "="*50)
            if 'friend_email' not in column_names or 'is_invitation' not in column_names:
                print("❌ MIGRATION NEEDED!")
                print("Run: python manage.py makemigrations")
                print("Run: python manage.py migrate")
            else:
                print("✅ All columns exist - system should work!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_friend_table()
