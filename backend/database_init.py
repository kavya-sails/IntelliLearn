"""
Database Migration Module
Automatically initializes and applies database schema changes on application startup
"""

import os
import logging
import psycopg2
import psycopg2.extras
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def get_db_connection():
    """Create a database connection"""
    return psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", "5432")),
        dbname=os.getenv("PG_DB", "intelli_learning"),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASSWORD", "root"),
    )


def create_migrations_table(conn):
    """Create the migrations tracking table if it doesn't exist"""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS db_migrations (
                    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    migration_name VARCHAR(255) NOT NULL UNIQUE,
                    executed_at TIMESTAMPTZ DEFAULT now(),
                    status VARCHAR(50) DEFAULT 'completed'
                );
            """)
            conn.commit()
            logger.info("✓ Migrations tracking table created/verified")
    except psycopg2.Error as e:
        logger.error(f"✗ Error creating migrations table: {e}")
        raise


def is_migration_applied(conn, migration_name):
    """Check if a migration has already been applied"""
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT COUNT(*) as count FROM db_migrations WHERE migration_name = %s",
                (migration_name,)
            )
            result = cur.fetchone()
            return result['count'] > 0
    except psycopg2.Error as e:
        logger.warning(f"Could not check migration status: {e}")
        return False


def mark_migration_applied(conn, migration_name):
    """Mark a migration as applied"""
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO db_migrations (migration_name) VALUES (%s)",
                (migration_name,)
            )
            conn.commit()
            logger.info(f"✓ Marked migration as applied: {migration_name}")
    except psycopg2.Error as e:
        logger.error(f"✗ Error marking migration as applied: {e}")
        raise


def execute_sql_file(conn, sql_content, migration_name):
    """Execute SQL statements from content"""
    try:
        with conn.cursor() as cur:
            # Split by semicolon and process each statement
            statements = sql_content.split(';')
            statement_count = 0
            
            for statement in statements:
                # Remove comments and whitespace
                lines = statement.split('\n')
                clean_lines = []
                
                for line in lines:
                    # Remove inline comments
                    if '--' in line:
                        line = line[:line.index('--')]
                    line = line.strip()
                    if line:
                        clean_lines.append(line)
                
                # Reconstruct statement
                clean_statement = ' '.join(clean_lines).strip()
                
                if not clean_statement:
                    continue
                
                statement_count += 1
                try:
                    # Log full statement for debugging
                    stmt_preview = clean_statement[:150] + ('...' if len(clean_statement) > 150 else '')
                    logger.debug(f"  Executing statement {statement_count}: {stmt_preview}")
                    logger.debug(f"    Full SQL: {clean_statement}")
                    
                    cur.execute(clean_statement)
                    logger.debug(f"    ✓ Success")
                except psycopg2.Error as e:
                    # Ignore table/index already exists errors for idempotency
                    error_str = str(e).lower()
                    if "already exists" in error_str or "duplicate" in error_str:
                        logger.debug(f"  ⓘ Already exists (idempotent): {stmt_preview}")
                    else:
                        logger.error(f"  ✗ Error in statement {statement_count}:")
                        logger.error(f"     SQL: {clean_statement[:300]}")
                        logger.error(f"  ✗ Database error: {str(e)}")
                        raise
            
            conn.commit()
            logger.info(f"✓ Successfully executed {statement_count} statements in migration: {migration_name}")
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"✗ Error executing migration {migration_name}: {e}")
        raise


def read_schema_file(schema_path):
    """Read the database schema SQL file"""
    try:
        with open(schema_path, 'r') as f:
            content = f.read()
            logger.info(f"✓ Read schema file: {schema_path}")
            return content
    except FileNotFoundError:
        logger.error(f"✗ Schema file not found: {schema_path}")
        raise
    except Exception as e:
        logger.error(f"✗ Error reading schema file: {e}")
        raise


def initialize_database():
    """
    Initialize database by executing schema migrations
    This is called automatically on application startup
    """
    logger.info("\n" + "="*60)
    logger.info("DATABASE INITIALIZATION STARTED")
    logger.info("="*60)
    
    try:
        # Connect to database
        conn = get_db_connection()
        conn.autocommit = True
        logger.info("✓ Connected to database")
        
        # Create migrations tracking table
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS db_migrations (
                    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    migration_name VARCHAR(255) NOT NULL UNIQUE,
                    executed_at TIMESTAMPTZ DEFAULT now(),
                    status VARCHAR(50) DEFAULT 'completed'
                );
            """)
        logger.info("✓ Migrations tracking table ready")
        
        # Get schema file path
        schema_path = os.path.join(
            os.path.dirname(__file__), 
            'models', 
            'db_schemas.sql'
        )
        
        # Read schema file
        schema_content = read_schema_file(schema_path)
        
        # Check if main schema migration has been applied
        migration_name = "001_initialize_schema"
        if not is_migration_applied(conn, migration_name):
            logger.info(f"\n📋 Applying migration: {migration_name}")
            execute_sql_file(conn, schema_content, migration_name)
            mark_migration_applied(conn, migration_name)
            logger.info(f"✓ Migration {migration_name} completed successfully")
        else:
            logger.info(f"ⓘ Migration {migration_name} already applied (skipping)")
        
        # Verify all tables exist
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            tables = cur.fetchall()
            logger.info(f"\n✓ Database has {len(tables)} tables:")
            for table in tables:
                logger.info(f"  • {table['table_name']}")
        
        conn.close()
        logger.info("\n" + "="*60)
        logger.info("✅ DATABASE INITIALIZATION COMPLETED SUCCESSFULLY")
        logger.info("="*60 + "\n")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ DATABASE INITIALIZATION FAILED: {e}")
        logger.error("="*60 + "\n")
        raise


def run_custom_migration(migration_name, sql_content):
    """
    Run a custom migration
    Usage: Useful for adding new features after app start
    """
    logger.info(f"\n📋 Running custom migration: {migration_name}")
    
    try:
        conn = get_db_connection()
        conn.autocommit = True
        
        if not is_migration_applied(conn, migration_name):
            execute_sql_file(conn, sql_content, migration_name)
            mark_migration_applied(conn, migration_name)
            logger.info(f"✓ Custom migration {migration_name} completed")
            result = True
        else:
            logger.info(f"ⓘ Migration {migration_name} already applied")
            result = False
        
        conn.close()
        return result
        
    except Exception as e:
        logger.error(f"✗ Error running custom migration: {e}")
        raise


def view_migration_history():
    """View all applied migrations"""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT migration_name, executed_at, status 
                FROM db_migrations 
                ORDER BY executed_at DESC
            """)
            migrations = cur.fetchall()
            logger.info("\n📋 Migration History:")
            for migration in migrations:
                logger.info(f"  • {migration['migration_name']} - {migration['executed_at']} [{migration['status']}]")
        conn.close()
    except Exception as e:
        logger.warning(f"Could not fetch migration history: {e}")


if __name__ == "__main__":
    # Can be run standalone: python -m database_init
    try:
        initialize_database()
        view_migration_history()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        exit(1)
