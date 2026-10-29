// ============================================================
// MongoDB Seed Script
// Run: node scripts/seed-mongo.js
// ============================================================
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'student_lost_found' });
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  const User = require('../models/User');
  const Category = require('../models/Category');
  const Building = require('../models/Building');
  const LostItem = require('../models/LostItem');
  const FoundItem = require('../models/FoundItem');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Building.deleteMany({}),
    LostItem.deleteMany({}),
    FoundItem.deleteMany({}),
  ]);
  console.log('🧹 Cleared old data');

  // Hash password
  const hash = await bcrypt.hash('Password@123', 10);

  // Seed Users
  const users = await User.insertMany([
    { student_id: '21CSE001', name: 'Alex Johnson',      email: 'student@college.edu',      phone: '9876543210', department: 'CSE', year: 3, section: 'A', password_hash: hash, role: 'student' },
    { student_id: '21CSE002', name: 'Priya Sharma',      email: 'priya@college.edu',         phone: '9876543211', department: 'CSE', year: 2, section: 'B', password_hash: hash, role: 'student' },
    { student_id: '21ECE001', name: 'Rahul Verma',       email: 'rahul@college.edu',         phone: '9876543212', department: 'ECE', year: 3, section: 'A', password_hash: hash, role: 'student' },
    { student_id: 'FAC001',   name: 'Dr. Admin Kumar',   email: 'admin@college.edu',         phone: '9876543213', department: 'CSE', year: null, section: null, password_hash: hash, role: 'admin' },
    { student_id: 'SUPER001', name: 'Super Admin',       email: 'superadmin@college.edu',    phone: '9876543214', department: 'Administration', year: null, section: null, password_hash: hash, role: 'superadmin' },
  ]);
  console.log(`✅ Created ${users.length} users`);

  // Seed Categories
  const categories = await Category.insertMany([
    { name: 'Mobile Phone', icon: '📱' },
    { name: 'Laptop',       icon: '💻' },
    { name: 'Wallet',       icon: '👛' },
    { name: 'ID Card',      icon: '🪪' },
    { name: 'Keys',         icon: '🔑' },
    { name: 'Books',        icon: '📚' },
    { name: 'Bag',          icon: '🎒' },
    { name: 'Watch',        icon: '⌚' },
    { name: 'Earphones',    icon: '🎧' },
    { name: 'Other',        icon: '📦' },
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Seed Buildings
  const buildings = await Building.insertMany([
    { name: 'Main Block',      code: 'MB',  rooms: ['101','102','103','104','201','202','Lab-1','Lab-2'] },
    { name: 'Science Block',   code: 'SB',  rooms: ['S101','S102','S201','S202','S-Lab1'] },
    { name: 'Library',         code: 'LIB', rooms: ['Reading Hall','Reference Section','Computer Lab'] },
    { name: 'Hostel Block A',  code: 'HA',  rooms: ['A101','A102','A201','A202'] },
    { name: 'Cafeteria',       code: 'CAF', rooms: ['Main Hall','Counter 1','Counter 2'] },
  ]);
  console.log(`✅ Created ${buildings.length} buildings`);

  // Drop collections fully to reset indexes
  await mongoose.connection.db.dropCollection('lostitems').catch(() => {});
  await mongoose.connection.db.dropCollection('founditems').catch(() => {});

  // Seed Lost Items
  await LostItem.insertMany([
    { user_id: users[0]._id, lost_id: 'LOST-2026-00001', item_name: 'Black iPhone 13', category: 'Mobile Phone', colour: 'Black', brand: 'Apple', description: 'Black iPhone 13 with cracked screen protector', lost_date: new Date('2026-10-10'), building: 'Main Block', room_number: '201', status: 'active' },
    { user_id: users[1]._id, lost_id: 'LOST-2026-00002', item_name: 'Blue Wallet',     category: 'Wallet',       colour: 'Blue',  description: 'Blue leather wallet with student ID inside', lost_date: new Date('2026-10-11'), building: 'Library', status: 'active' },
    { user_id: users[2]._id, lost_id: 'LOST-2026-00003', item_name: 'Dell Laptop Bag', category: 'Bag',          colour: 'Black', brand: 'Dell', description: 'Black Dell laptop bag with power adapter', lost_date: new Date('2026-10-12'), building: 'Science Block', status: 'active' },
  ]);
  console.log('✅ Created lost items');

  // Seed Found Items
  await FoundItem.insertMany([
    { user_id: users[3]._id, found_id: 'FOUND-2026-00001', item_name: 'iPhone (Black)', category: 'Mobile Phone', colour: 'Black', brand: 'Apple', description: 'Found near room 201 stairs', found_date: new Date('2026-10-10'), building: 'Main Block', room_number: '201', storage_location: 'Security Office', status: 'active' },
    { user_id: users[1]._id, found_id: 'FOUND-2026-00002', item_name: 'Leather Wallet', category: 'Wallet',       colour: 'Blue',  description: 'Found in library reading hall', found_date: new Date('2026-10-11'), building: 'Library', storage_location: 'Help Desk', status: 'active' },
  ]);
  console.log('✅ Created found items');

  console.log('\n🎉 Database seeded successfully!');
  console.log('Demo Credentials (all use Password@123):');
  console.log('  Student:    student@college.edu');
  console.log('  Admin:      admin@college.edu');
  console.log('  SuperAdmin: superadmin@college.edu');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
