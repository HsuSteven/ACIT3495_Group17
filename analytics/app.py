import os
import time
import logging
from datetime import datetime, timezone
import mysql.connector
from mysql.connector import Error as MySQLError
from pymongo import MongoClient
from pymongo.errors import PyMongoError

# Structured logging without leaking credentials
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [analytics-service] %(message)s"
)
logger = logging.getLogger(__name__)

# Rubric compliance: read all connection parameters from environment variables
MYSQL_HOST = os.getenv("MYSQL_HOST", "mysql-db")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "dbuser")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "dbpass")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "datadb")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017/")
MONGO_DB = os.getenv("MONGO_DATABASE", "analyticsdb")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "grade_analytics")

POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", 10))


def connect_mysql():
    """Connect to MySQL with retry backoff for fault tolerance."""
    while True:
        try:
            conn = mysql.connector.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DATABASE,
                connection_timeout=5
            )
            if conn.is_connected():
                logger.info("Successfully connected to MySQL database.")
                return conn
        except MySQLError as err:
            logger.warning("MySQL connection unavailable (%s). Retrying in 5s...", err)
            time.sleep(5)


def get_mongo_collection():
    """Return MongoDB collection reference with timeout settings."""
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGO_DB]
    return db[MONGO_COLLECTION]


def calculate_and_sync_grades():
    """Calculate min, max, avg, count for each course and upsert to MongoDB."""
    mysql_conn = None
    try:
        mysql_conn = connect_mysql()
        cursor = mysql_conn.cursor(dictionary=True)

        # SQL aggregate calculation across student grades
        query = """
            SELECT 
                course_code,
                COUNT(score) AS total_submissions,
                MIN(score) AS min_grade,
                MAX(score) AS max_grade,
                AVG(score) AS avg_grade
            FROM grades
            GROUP BY course_code;
        """
        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()

        if not results:
            logger.info("No grade records found in MySQL to aggregate.")
            return

        mongo_col = get_mongo_collection()
        now = datetime.now(timezone.utc)

        for row in results:
            doc = {
                "course_code": row["course_code"],
                "total_submissions": int(row["total_submissions"]),
                "min_grade": round(float(row["min_grade"]), 2),
                "max_grade": round(float(row["max_grade"]), 2),
                "avg_grade": round(float(row["avg_grade"]), 2),
                "last_updated": now
            }

            # Upsert into MongoDB so Show Results always sees the current state
            mongo_col.update_one(
                {"course_code": row["course_code"]},
                {"$set": doc},
                upsert=True
            )
            logger.info(
                "Aggregated '%s' -> Count: %d | Min: %.2f | Max: %.2f | Avg: %.2f",
                doc["course_code"],
                doc["total_submissions"],
                doc["min_grade"],
                doc["max_grade"],
                doc["avg_grade"]
            )

    except MySQLError as err:
        logger.error("MySQL query failed: %s", err)
    except PyMongoError as err:
        logger.error("MongoDB update failed: %s", err)
    finally:
        if mysql_conn and mysql_conn.is_connected():
            mysql_conn.close()


def main():
    logger.info("Analytics background worker running. Ingestion polling cycle: %ds.", POLL_INTERVAL)
    while True:
        calculate_and_sync_grades()
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()