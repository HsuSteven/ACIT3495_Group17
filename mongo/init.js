db = db.getSiblingDB('analyticsdb');
db.grade_analytics.createIndex({ course_code: 1 }, { unique: true });