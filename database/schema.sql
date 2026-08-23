-- College Hostel Management System Database Schema

CREATE DATABASE IF NOT EXISTS `hostel_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hostel_management`;

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT NOT NULL,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Hostels Table
CREATE TABLE IF NOT EXISTS `hostels` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `code` VARCHAR(10) NOT NULL UNIQUE,
    `gender` ENUM('MALE', 'FEMALE', 'COED') NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Floors Table
CREATE TABLE IF NOT EXISTS `floors` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `hostel_id` INT NOT NULL,
    `floor_name` VARCHAR(50) NOT NULL,
    `floor_number` INT NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `unique_hostel_floor` (`hostel_id`, `floor_number`)
) ENGINE=InnoDB;

-- 5. Rooms Table
CREATE TABLE IF NOT EXISTS `rooms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `hostel_id` INT NOT NULL,
    `floor_id` INT NOT NULL,
    `room_number` VARCHAR(20) NOT NULL,
    `capacity` INT NOT NULL DEFAULT 4,
    `status` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `unique_hostel_room` (`hostel_id`, `room_number`)
) ENGINE=InnoDB;

-- 6. Beds Table
CREATE TABLE IF NOT EXISTS `beds` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_id` INT NOT NULL,
    `bed_number` VARCHAR(20) NOT NULL,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') DEFAULT 'AVAILABLE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `unique_room_bed` (`room_id`, `bed_number`)
) ENGINE=InnoDB;

-- 7. Students Table
CREATE TABLE IF NOT EXISTS `students` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `student_id` VARCHAR(50) NOT NULL UNIQUE,
    `roll_number` VARCHAR(50) NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NOT NULL,
    `photo_url` VARCHAR(255) DEFAULT NULL,
    `cloudinary_public_id` VARCHAR(100) DEFAULT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `branch` VARCHAR(100) NOT NULL,
    `course` VARCHAR(100) NOT NULL,
    `year` INT NOT NULL,
    `semester` INT NOT NULL,
    `bed_id` INT DEFAULT NULL UNIQUE, -- Unique constraint enforces one student per bed, nullable when not assigned
    `admission_date` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'GRADUATED') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`bed_id`) REFERENCES `beds` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. Superintendent Hostels Table (Many-to-Many Superintendent to Hostels assignment)
CREATE TABLE IF NOT EXISTS `superintendent_hostels` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `hostel_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `unique_superintendent_hostel` (`user_id`, `hostel_id`)
) ENGINE=InnoDB;

-- 9. Attendance Table
CREATE TABLE IF NOT EXISTS `attendance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `hostel_id` INT NOT NULL,
    `attendance_date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT') NOT NULL,
    `marked_by` INT NOT NULL, -- User ID of who marked the attendance (superintendent/admin)
    `marked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY `unique_student_date` (`student_id`, `attendance_date`)
) ENGINE=InnoDB;

-- 10. Notices Table
CREATE TABLE IF NOT EXISTS `notices` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `created_by` INT NOT NULL, -- User ID of the creator
    `hostel_id` INT DEFAULT NULL, -- Null represents a general notice for all hostels
    `priority` ENUM('GENERAL', 'IMPORTANT', 'URGENT') DEFAULT 'GENERAL',
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
    `published_at` TIMESTAMP DEFAULT NULL,
    `expires_at` TIMESTAMP DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 11. Notice Reads Table
CREATE TABLE IF NOT EXISTS `notice_reads` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `notice_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`notice_id`) REFERENCES `notices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `unique_notice_user_read` (`notice_id`, `user_id`)
) ENGINE=InnoDB;

-- Create Indexes for performance optimization
CREATE INDEX idx_student_roll ON students(roll_number);
CREATE INDEX idx_student_email ON students(email);
CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_room_number ON rooms(room_number);
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_notices_status ON notices(status);
CREATE INDEX idx_notices_hostel_id ON notices(hostel_id);
CREATE INDEX idx_notices_priority ON notices(priority);
CREATE INDEX idx_notices_published_at ON notices(published_at);
CREATE INDEX idx_notices_expires_at ON notices(expires_at);
CREATE INDEX idx_notice_reads_notice_id ON notice_reads(notice_id);
CREATE INDEX idx_notice_reads_user_id ON notice_reads(user_id);
