CREATE DATABASE IF NOT EXISTS db;
USE db;

CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(32) NOT NULL,
    course_code VARCHAR(32) NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_course_code (course_code)
);

INSERT INTO grades (student_id, course_code, score) VALUES
    ('A01012345', 'ACIT3495', 84.50),
    ('A01054321', 'ACIT3495', 92.00),
    ('A01098765', 'ACIT3495', 76.50),
    ('A01033445', 'ACIT3495', 88.00),
    ('A01012345', 'COMP3855', 71.00),
    ('A01054321', 'COMP3855', 83.50),
    ('A01098765', 'COMP3855', 68.00);