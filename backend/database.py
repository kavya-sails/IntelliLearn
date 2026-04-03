import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from contextlib import contextmanager

load_dotenv()


def get_db_config():
    return {
        "host": os.getenv("PG_HOST", "localhost"),
        "port": int(os.getenv("PG_PORT", "5432")),
        "dbname": os.getenv("PG_DB", "intelli_learning"),
        "user": os.getenv("PG_USER", "postgres"),
        "password": os.getenv("PG_PASSWORD", "root"),
    }


@contextmanager
def get_db_connection():
    conn = psycopg2.connect(**get_db_config())
    conn.autocommit = True
    try:
        yield conn
    finally:
        conn.close()


def get_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
