-- Seed script for College Hostel Management System

USE `hostel_management`;

-- 1. Seed Roles
INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'SUPER_ADMIN'),
(2, 'SUPERINTENDENT'),
(3, 'STUDENT')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Seed Hostels
INSERT INTO `hostels` (`id`, `name`, `code`, `gender`, `location`, `status`) VALUES
(1, 'Meridian Boys Hostel', 'MBH', 'MALE', 'North Campus, Block A', 'ACTIVE'),
(2, 'Meridian Girls Hostel', 'MGH', 'FEMALE', 'North Campus, Block B', 'ACTIVE'),
(3, 'BEC Boys Hostel', 'BBH', 'MALE', 'West Campus, Sector 1', 'ACTIVE'),
(4, 'BEC Kara Hostel', 'BKH', 'FEMALE', 'West Campus, Sector 2', 'ACTIVE'),
(5, 'Barmunda Boys Hostel', 'BMBH', 'MALE', 'Barmunda Sub-campus', 'ACTIVE'),
(6, 'Barmunda Girls Hostel', 'BMGH', 'FEMALE', 'Barmunda Sub-campus', 'ACTIVE')
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), 
    `code` = VALUES(`code`), 
    `gender` = VALUES(`gender`), 
    `location` = VALUES(`location`), 
    `status` = VALUES(`status`);

-- 3. Seed Users (Password is 'password123' for all)
INSERT INTO `users` (`id`, `role_id`, `username`, `email`, `password_hash`, `status`) VALUES
(1, 1, 'superadmin', 'admin@hostel.com', '$2a$10$4Jxpj3KHrl97nGMI.WCJY.t.cIrps9.jO01O0kYZNZ6X1RoTtCyWe', 'ACTIVE'),
(2, 2, 'warden', 'warden@hostel.com', '$2a$10$4Jxpj3KHrl97nGMI.WCJY.t.cIrps9.jO01O0kYZNZ6X1RoTtCyWe', 'ACTIVE'),
(3, 3, 'student', 'student@hostel.com', '$2a$10$4Jxpj3KHrl97nGMI.WCJY.t.cIrps9.jO01O0kYZNZ6X1RoTtCyWe', 'ACTIVE')
ON DUPLICATE KEY UPDATE
    `role_id` = VALUES(`role_id`),
    `username` = VALUES(`username`),
    `email` = VALUES(`email`),
    `password_hash` = VALUES(`password_hash`),
    `status` = VALUES(`status`);

-- 4. Seed Superintendent to Hostel Assignments
INSERT INTO `superintendent_hostels` (`id`, `user_id`, `hostel_id`) VALUES
(1, 2, 1), -- warden manages Meridian Boys Hostel
(2, 2, 3)  -- warden also manages BEC Boys Hostel
ON DUPLICATE KEY UPDATE
    `user_id` = VALUES(`user_id`),
    `hostel_id` = VALUES(`hostel_id`);

-- 5. Seed Student Record details
INSERT INTO `students` (`id`, `user_id`, `student_id`, `roll_number`, `full_name`, `phone`, `email`, `branch`, `course`, `year`, `semester`, `bed_id`, `admission_date`, `status`) VALUES
(1, 3, 'STD2026001', 'CSE-2026-089', 'John Doe', '9876543210', 'student@hostel.com', 'Computer Science', 'B.Tech', 3, 5, NULL, '2024-07-15', 'ACTIVE')
ON DUPLICATE KEY UPDATE
    `user_id` = VALUES(`user_id`),
    `student_id` = VALUES(`student_id`),
    `roll_number` = VALUES(`roll_number`),
    `full_name` = VALUES(`full_name`),
    `phone` = VALUES(`phone`),
    `email` = VALUES(`email`),
    `branch` = VALUES(`branch`),
    `course` = VALUES(`course`),
    `year` = VALUES(`year`),
    `semester` = VALUES(`semester`),
    `admission_date` = VALUES(`admission_date`),
    `status` = VALUES(`status`);
