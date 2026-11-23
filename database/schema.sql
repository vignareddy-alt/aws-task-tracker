-- =============================================================
-- AWS Task Tracker - MySQL schema
-- Run with:  mysql -u root -p < database/schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS aws_task_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aws_task_tracker;

CREATE TABLE IF NOT EXISTS tasks (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title        VARCHAR(150) NOT NULL,
  description  TEXT NULL,
  status       ENUM('PENDING', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  priority     ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
  due_date     DATE NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_title (title)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Optional: a dedicated, least-privilege application user.
-- Recommended for production (EC2) instead of using root.
-- Uncomment, change the password, and run as an admin user.
-- -------------------------------------------------------------
-- CREATE USER IF NOT EXISTS 'task_app'@'localhost' IDENTIFIED BY 'change_me_strong_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON aws_task_tracker.* TO 'task_app'@'localhost';
-- FLUSH PRIVILEGES;
