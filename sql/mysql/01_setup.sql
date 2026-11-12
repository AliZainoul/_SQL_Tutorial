-- MySQL setup (reference version: 8.4 LTS; INTERSECT/EXCEPT need >= 8.0.31).
-- Run as an administrator: mysql -u root -p < sql/mysql/01_setup.sql
CREATE DATABASE bookstore CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'bookstore_user'@'localhost' IDENTIFIED BY 'change_me_please';
GRANT ALL PRIVILEGES ON bookstore.* TO 'bookstore_user'@'localhost';
-- Then connect with: mysql -u bookstore_user -p bookstore
