-- ============================================================
-- STUDENT LOST & FOUND PORTAL - Seed Data
-- ============================================================

-- Categories
INSERT INTO categories (name, description, icon) VALUES
('Mobile Phone', 'Smartphones and mobile devices', '📱'),
('Laptop', 'Laptops, notebooks, and tablets', '💻'),
('Tablet', 'iPads and Android tablets', '📟'),
('Wallet', 'Wallets, purses, and card holders', '👛'),
('ID Card', 'Student ID, employee ID, access cards', '🪪'),
('Keys', 'House keys, vehicle keys, lockers', '🔑'),
('Books', 'Textbooks, notebooks, journals', '📚'),
('Bag', 'Backpacks, handbags, and luggage', '🎒'),
('Watch', 'Wristwatches and smartwatches', '⌚'),
('Earphones', 'Earphones, earbuds, headphones', '🎧'),
('Jewellery', 'Rings, chains, bracelets, earrings', '💍'),
('Documents', 'Papers, certificates, files', '📄'),
('Calculator', 'Scientific and graphical calculators', '🧮'),
('Clothing', 'Jackets, caps, scarves, sweaters', '👕'),
('Water Bottle', 'Water bottles and flasks', '🍶'),
('Umbrella', 'Umbrellas and rain gear', '☂️'),
('Charger', 'Phone chargers, laptop adapters', '🔌'),
('Other', 'Any other items not listed above', '📦');

-- Buildings
INSERT INTO buildings (building_name, description) VALUES
('CSE Block', 'Computer Science & Engineering Department'),
('ECE Block', 'Electronics & Communication Engineering'),
('Mechanical Block', 'Mechanical Engineering Department'),
('Civil Block', 'Civil Engineering Department'),
('MBA Block', 'Management Studies'),
('Science Block', 'Physics, Chemistry, Mathematics'),
('Library', 'Central Library Building'),
('Administrative Block', 'Administration and Examination Hall'),
('Cafeteria', 'Main Cafeteria and Food Court'),
('Sports Complex', 'Indoor and Outdoor Sports Facilities'),
('Hostel Block A', 'Boys Hostel Block A'),
('Hostel Block B', 'Girls Hostel Block B'),
('Auditorium', 'Main Auditorium'),
('Medical Centre', 'College Medical Centre');

-- Rooms for CSE Block
INSERT INTO rooms (building_id, room_number, floor) VALUES
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), '101', 1),
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), '102', 1),
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), '201', 2),
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), '202', 2),
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), '203', 2),
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), '204', 2),
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), '301', 3),
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), '302', 3),
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), 'Lab-1', 1),
((SELECT id FROM buildings WHERE building_name = 'CSE Block'), 'Lab-2', 2),
((SELECT id FROM buildings WHERE building_name = 'Library'), 'Reading Hall', 1),
((SELECT id FROM buildings WHERE building_name = 'Library'), 'Reference Section', 2),
((SELECT id FROM buildings WHERE building_name = 'Cafeteria'), 'Main Hall', 1),
((SELECT id FROM buildings WHERE building_name = 'Administrative Block'), 'Exam Hall 1', 1),
((SELECT id FROM buildings WHERE building_name = 'Administrative Block'), 'Exam Hall 2', 1);

-- ============================================================
-- DEMO USERS (passwords are: Password@123)
-- bcrypt hash of 'Password@123' with 12 rounds
-- ============================================================
INSERT INTO users (student_id, name, email, phone, department, year, section, password_hash, role) VALUES
('ADMIN001', 'Dr. Rajesh Kumar', 'admin@college.edu', '9876543210', 'Administration', NULL, NULL, '$2a$10$5QcZwDC9ahE/z8/C2T77FOepjdcq3A2pqudaiG65oI7ZwWYQORr7.', 'admin'),
('SUPER001', 'Prof. Ananya Singh', 'superadmin@college.edu', '9876543200', 'Administration', NULL, NULL, '$2a$10$5QcZwDC9ahE/z8/C2T77FOepjdcq3A2pqudaiG65oI7ZwWYQORr7.', 'superadmin'),
('21CSE001', 'Israel Orsu', 'israel@college.edu', '9876501234', 'CSE', 4, 'A', '$2a$10$5QcZwDC9ahE/z8/C2T77FOepjdcq3A2pqudaiG65oI7ZwWYQORr7.', 'student'),
('21CSE002', 'Priya Sharma', 'priya@college.edu', '9876502345', 'CSE', 4, 'A', '$2a$10$5QcZwDC9ahE/z8/C2T77FOepjdcq3A2pqudaiG65oI7ZwWYQORr7.', 'student'),
('21CSE003', 'Rahul Verma', 'rahul@college.edu', '9876503456', 'CSE', 3, 'B', '$2a$10$5QcZwDC9ahE/z8/C2T77FOepjdcq3A2pqudaiG65oI7ZwWYQORr7.', 'student'),
('21ECE001', 'Sneha Patel', 'sneha@college.edu', '9876504567', 'ECE', 2, 'A', '$2a$10$5QcZwDC9ahE/z8/C2T77FOepjdcq3A2pqudaiG65oI7ZwWYQORr7.', 'student'),
('21MBA001', 'Arjun Mehta', 'arjun@college.edu', '9876505678', 'MBA', 1, 'A', '$2a$10$5QcZwDC9ahE/z8/C2T77FOepjdcq3A2pqudaiG65oI7ZwWYQORr7.', 'student');

-- ============================================================
-- DEMO LOST ITEMS
-- ============================================================
INSERT INTO lost_items (lost_id, user_id, item_name, category, colour, brand, description, lost_date, lost_time, building, room_number, specific_location, additional_info, status) VALUES
('LOST-2026-00001', (SELECT id FROM users WHERE student_id = '21CSE001'), 'Black Wallet', 'Wallet', 'Black', 'Wildhorn', 'Leather wallet with student ID card, one debit card, and some cash. Has a small scratch on the front.', '2026-10-05', '10:30:00', 'CSE Block', '204', 'Near the back row of classroom', 'Contains student ID 21CSE001 and SBI debit card', 'active'),
('LOST-2026-00002', (SELECT id FROM users WHERE student_id = '21CSE002'), 'Blue Water Bottle', 'Water Bottle', 'Blue', 'Milton', 'Steel water bottle, 1 litre capacity. Has stickers on the side. Name written at the bottom.', '2026-10-06', '12:00:00', 'CSE Block', '204', 'Left on desk near window', 'Name written at the bottom: Priya', 'active'),
('LOST-2026-00003', (SELECT id FROM users WHERE student_id = '21ECE001'), 'Black Samsung Phone', 'Mobile Phone', 'Black', 'Samsung', 'Samsung Galaxy A53, black colour with cracked screen protector. Has yellow phone cover.', '2026-10-04', '14:00:00', 'Library', 'Reading Hall', 'Left on reading table row 5', 'Lock screen has a butterfly wallpaper', 'active'),
('LOST-2026-00004', (SELECT id FROM users WHERE student_id = '21CSE003'), 'Scientific Calculator', 'Calculator', 'Black', 'Casio', 'Casio FX-991EX scientific calculator. Has my name written on the back.', '2026-10-06', '09:00:00', 'CSE Block', '201', 'Exam hall, row 3', 'Name Rahul written with marker', 'active'),
('LOST-2026-00005', (SELECT id FROM users WHERE student_id = '21MBA001'), 'White Apple AirPods', 'Earphones', 'White', 'Apple', 'AirPods Pro 2nd generation in white charging case.', '2026-10-03', '16:00:00', 'Cafeteria', 'Main Hall', 'Near the food counter', 'Case has a small dent on the lid', 'active');

-- ============================================================
-- DEMO FOUND ITEMS
-- ============================================================
INSERT INTO found_items (found_id, user_id, item_name, category, colour, brand, description, found_date, found_time, building, room_number, specific_location, additional_details, status) VALUES
('FOUND-2026-00001', (SELECT id FROM users WHERE student_id = '21CSE003'), 'Black Wallet', 'Wallet', 'Black', 'Wildhorn', 'Found a black leather wallet near classroom back row. Contains some cards.', '2026-10-05', '11:00:00', 'CSE Block', '204', 'Found under the desk at the back', 'Submitted to admin office', 'possible_match'),
('FOUND-2026-00002', (SELECT id FROM users WHERE student_id = '21CSE001'), 'Blue Milton Bottle', 'Water Bottle', 'Blue', 'Milton', 'Found a blue steel water bottle on a desk. Has stickers on it. Name at bottom.', '2026-10-06', '13:30:00', 'CSE Block', '204', 'Found on the window side desk', 'Name appears to start with P', 'possible_match'),
('FOUND-2026-00003', (SELECT id FROM users WHERE student_id = '21MBA001'), 'Samsung Phone Black', 'Mobile Phone', 'Black', 'Samsung', 'Found a Samsung smartphone on the reading table. Has yellow cover and cracked screen protector.', '2026-10-04', '15:30:00', 'Library', 'Reading Hall', 'Table row 5, reading section', 'Phone was switched on when found', 'possible_match'),
('FOUND-2026-00004', (SELECT id FROM users WHERE student_id = '21CSE002'), 'Casio Calculator', 'Calculator', 'Black', 'Casio', 'Found a Casio scientific calculator after exam. Name written on back.', '2026-10-06', '10:30:00', 'CSE Block', '201', 'Found under a chair after exam', 'Name looks like Rahul', 'possible_match'),
('FOUND-2026-00005', (SELECT id FROM users WHERE student_id = '21ECE001'), 'AirPods White', 'Earphones', 'White', 'Apple', 'Found white AirPods case near food counter in cafeteria. Case has small dent.', '2026-10-03', '17:00:00', 'Cafeteria', 'Main Hall', 'Near the food counter area', 'AirPods are inside the case', 'possible_match');

-- ============================================================
-- DEMO MATCHES (high score matches)
-- ============================================================
INSERT INTO matches (lost_item_id, found_item_id, match_score, match_breakdown, match_reason, status) VALUES
(
    (SELECT id FROM lost_items WHERE lost_id = 'LOST-2026-00001'),
    (SELECT id FROM found_items WHERE found_id = 'FOUND-2026-00001'),
    96.00,
    '{"item_name": 25, "category": 15, "colour": 15, "brand": 10, "building": 10, "room_number": 10, "date": 5, "description": 6}'::jsonb,
    'High match: Same item name (wallet), same colour (black), same brand (Wildhorn), same location (CSE Block Room 204), same date',
    'contact_requested'
),
(
    (SELECT id FROM lost_items WHERE lost_id = 'LOST-2026-00002'),
    (SELECT id FROM found_items WHERE found_id = 'FOUND-2026-00002'),
    98.00,
    '{"item_name": 25, "category": 15, "colour": 15, "brand": 10, "building": 10, "room_number": 10, "date": 5, "description": 8}'::jsonb,
    'Excellent match: Same building (CSE Block), room (204), date, colour (blue), brand (Milton)',
    'pending'
),
(
    (SELECT id FROM lost_items WHERE lost_id = 'LOST-2026-00003'),
    (SELECT id FROM found_items WHERE found_id = 'FOUND-2026-00003'),
    92.00,
    '{"item_name": 22, "category": 15, "colour": 15, "brand": 10, "building": 10, "room_number": 10, "date": 5, "description": 5}'::jsonb,
    'Strong match: Same phone brand Samsung, same location Library Reading Hall, same date, yellow cover mentioned by both',
    'pending'
);

-- Update statuses based on matches
UPDATE lost_items SET status = 'possible_match' WHERE lost_id IN ('LOST-2026-00001', 'LOST-2026-00002', 'LOST-2026-00003');

-- ============================================================
-- DEMO NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES
((SELECT id FROM users WHERE student_id = '21CSE001'), 'Possible Match Found! 🎯', 'Your lost Black Wallet may match a recently found item. Match Score: 96%. Click to view details.', 'match', (SELECT id FROM matches WHERE match_score = 96.00), 'match'),
((SELECT id FROM users WHERE student_id = '21CSE003'), 'Contact Request Received', 'A student believes the wallet you found might be theirs. They have requested contact. Please respond.', 'contact', (SELECT id FROM matches WHERE match_score = 96.00), 'match'),
((SELECT id FROM users WHERE student_id = '21CSE002'), 'Possible Match Found! 🎯', 'Your lost Blue Water Bottle may match a recently found item. Match Score: 98%. Click to view.', 'match', (SELECT id FROM matches WHERE match_score = 98.00), 'match'),
((SELECT id FROM users WHERE student_id = '21ECE001'), 'Possible Match Found! 🎯', 'Your lost Black Samsung Phone may match a found item. Match Score: 92%. Click to view.', 'match', (SELECT id FROM matches WHERE match_score = 92.00), 'match'),
((SELECT id FROM users WHERE student_id = '21CSE001'), 'Lost Item Report Submitted', 'Your lost item report LOST-2026-00001 for Black Wallet has been submitted successfully.', 'info', NULL, 'lost');

-- ============================================================
-- DEMO ACTIVITY LOGS
-- ============================================================
INSERT INTO activity_logs (user_id, action, description) VALUES
((SELECT id FROM users WHERE student_id = '21CSE001'), 'LOST_REPORT_SUBMITTED', 'Submitted lost item report for Black Wallet (LOST-2026-00001)'),
((SELECT id FROM users WHERE student_id = '21CSE003'), 'FOUND_REPORT_SUBMITTED', 'Submitted found item report for Black Wallet (FOUND-2026-00001)'),
((SELECT id FROM users WHERE student_id = '21CSE001'), 'MATCH_VIEWED', 'Viewed possible match for LOST-2026-00001'),
((SELECT id FROM users WHERE student_id = '21CSE001'), 'CONTACT_REQUESTED', 'Requested contact for match on Black Wallet');

COMMIT;
