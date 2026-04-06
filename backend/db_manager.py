#!/usr/bin/env python3
"""
Database Management CLI
Standalone scripts for database management and troubleshooting
Usage: python db_manager.py [command]
"""

import sys
import os
import logging
from database_init import (
    initialize_database,
    view_migration_history,
    get_db_connection,
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


def cmd_init():
    """Initialize database schema"""
    print("\n🔧 Initializing database...\n")
    try:
        initialize_database()
        print("\n✅ Database initialized successfully!")
        return 0
    except Exception as e:
        logger.error(f"Error: {e}")
        return 1


def cmd_status():
    """Check database connection and schema status"""
    print("\n🔍 Checking database status...\n")
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Check if we can connect
            cur.execute("SELECT version();")
            version = cur.fetchone()
            print(f"✓ Connected to: {version[0][:80]}...\n")
            
            # Count tables
            cur.execute("""
                SELECT COUNT(*) as count FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            table_count = cur.fetchone()['count']
            print(f"✓ Tables in database: {table_count}\n")
            
            # List tables
            cur.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """)
            print("📋 Tables:")
            for row in cur.fetchall():
                print(f"   • {row['table_name']}")
            
            # Check migrations
            cur.execute("SELECT COUNT(*) as count FROM db_migrations")
            migration_count = cur.fetchone()['count']
            print(f"\n✓ Migrations applied: {migration_count}")
        
        conn.close()
        print("\n✅ Database status: OK\n")
        return 0
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}\n")
        return 1


def cmd_migrations():
    """View migration history"""
    print("\n📜 Migration History\n")
    try:
        view_migration_history()
        return 0
    except Exception as e:
        logger.error(f"Error: {e}")
        return 1


def cmd_reset():
    """Reset database (DELETE ALL DATA) - WARNING: DESTRUCTIVE"""
    print("\n⚠️  WARNING: This will DROP ALL TABLES!\n")
    response = input("Type 'YES' to confirm database reset: ")
    
    if response != "YES":
        print("Reset cancelled.")
        return 0
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Drop all tables in reverse order of dependencies
            tables = [
                'db_migrations',
                'chat_messages',
                'quiz_results',
                'gap_analysis',
                'learning_roadmaps',
                'chat_sessions',
                'claimed_skills',
                'users',
            ]
            
            for table in tables:
                try:
                    cur.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
                    print(f"✓ Dropped table: {table}")
                except Exception as e:
                    print(f"⚠️  Could not drop {table}: {e}")
            
            conn.commit()
        
        conn.close()
        print("\n✓ Database reset complete")
        print("Run 'python db_manager.py init' to reinitialize schema\n")
        return 0
    except Exception as e:
        logger.error(f"❌ Reset failed: {e}\n")
        return 1


def cmd_help():
    """Show help message"""
    print("""
╔════════════════════════════════════════════════════════════╗
║          IntelliLearn Database Management CLI              ║
╚════════════════════════════════════════════════════════════╝

Commands:
  init            Initialize or migrate database schema
  status          Check database connection and table status
  migrations      View applied migrations history
  reset           Reset database (DELETE ALL DATA) ⚠️
  help            Show this help message

Examples:
  python db_manager.py init
  python db_manager.py status
  python db_manager.py migrations

Environment Variables:
  PG_HOST         PostgreSQL host (default: localhost)
  PG_PORT         PostgreSQL port (default: 5432)
  PG_DB           Database name (default: intelli_learning)
  PG_USER         Database user (default: postgres)
  PG_PASSWORD     Database password (default: root)

""")
    return 0


def main():
    """Main CLI handler"""
    command = sys.argv[1] if len(sys.argv) > 1 else "help"
    
    commands = {
        "init": cmd_init,
        "status": cmd_status,
        "migrations": cmd_migrations,
        "reset": cmd_reset,
        "help": cmd_help,
        "--help": cmd_help,
        "-h": cmd_help,
    }
    
    if command not in commands:
        print(f"❌ Unknown command: '{command}'")
        cmd_help()
        return 1
    
    return commands[command]()


if __name__ == "__main__":
    sys.exit(main())
