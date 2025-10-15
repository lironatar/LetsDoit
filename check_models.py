#!/usr/bin/env python
"""
Script to check if models exist in the database
"""

import os
import sys
import django

# Add the project directory to Python path
project_dir = r"c:\Users\liron\OneDrive\שולחן העבודה\New folder\ToDoFast2"
sys.path.insert(0, project_dir)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')

# Setup Django
django.setup()

from django.db import connection
from django.core.management import call_command

def check_table_exists(table_name):
    """Check if a table exists in the database"""
    with connection.cursor() as cursor:
        cursor.execute(f"""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='{table_name}';
        """)
        result = cursor.fetchone()
        return result is not None

def check_table_structure(table_name):
    """Get table structure"""
    with connection.cursor() as cursor:
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        return columns

def main():
    print("🔍 Checking database models...")
    print("=" * 50)
    
    # Check Friend table
    friend_exists = check_table_exists('todo_friend')
    print(f"📋 Friend table exists: {'✅ YES' if friend_exists else '❌ NO'}")
    
    if friend_exists:
        friend_columns = check_table_structure('todo_friend')
        print("   Columns in Friend table:")
        for col in friend_columns:
            print(f"   - {col[1]} ({col[2]})")
    
    print()
    
    # Check FriendInvitation table
    invitation_exists = check_table_exists('todo_friendinvitation')
    print(f"📧 FriendInvitation table exists: {'✅ YES' if invitation_exists else '❌ NO'}")
    
    if invitation_exists:
        invitation_columns = check_table_structure('todo_friendinvitation')
        print("   Columns in FriendInvitation table:")
        for col in invitation_columns:
            print(f"   - {col[1]} ({col[2]})")
    
    print()
    
    # Check migration status
    print("📦 Migration status:")
    try:
        from django.db.migrations.executor import MigrationExecutor
        from django.db import connection
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if plan:
            print("   ⚠️ Pending migrations:")
            for migration, backwards in plan:
                print(f"   - {migration}")
        else:
            print("   ✅ All migrations applied")
    except Exception as e:
        print(f"   ❌ Error checking migrations: {e}")
    
    print()
    
    # Test model imports
    print("🧪 Testing model imports:")
    try:
        from todo.models import Friend
        print("   ✅ Friend model imported successfully")
        
        # Try to count Friend records
        friend_count = Friend.objects.count()
        print(f"   📊 Friend records in database: {friend_count}")
        
    except Exception as e:
        print(f"   ❌ Friend model error: {e}")
    
    try:
        from todo.models import FriendInvitation
        print("   ✅ FriendInvitation model imported successfully")
        
        # Try to count FriendInvitation records
        invitation_count = FriendInvitation.objects.count()
        print(f"   📊 FriendInvitation records in database: {invitation_count}")
        
    except Exception as e:
        print(f"   ❌ FriendInvitation model error: {e}")
    
    print()
    print("=" * 50)
    print("🔧 Recommendations:")
    
    if not invitation_exists:
        print("   1. Run migration to create FriendInvitation table:")
        print("      python manage.py makemigrations")
        print("      python manage.py migrate")
    
    if friend_exists:
        # Check if Friend table has new columns
        friend_columns = [col[1] for col in check_table_structure('todo_friend')]
        if 'friend_email' not in friend_columns or 'is_invitation' not in friend_columns:
            print("   2. Friend table needs new columns (friend_email, is_invitation)")
            print("      Run: python manage.py migrate")

if __name__ == "__main__":
    main()
