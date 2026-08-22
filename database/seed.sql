-- Seed script for College Hostel Management System

USE `hostel_management`;

-- Seed Roles
INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'SUPER_ADMIN'),
(2, 'SUPERINTENDENT'),
(3, 'STUDENT')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Hostels
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
