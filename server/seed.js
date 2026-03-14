/**
 * Seed script — creates demo users for testing
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Query = require('./models/Query');

const users = [
  { name: 'Admin User', email: 'admin@ecell.com', password: 'admin123', role: 'admin', domain: 'general' },
  { name: 'Tech Manager', email: 'manager@ecell.com', password: 'manager123', role: 'manager', domain: 'tech' },
  { name: 'Events Manager', email: 'events@ecell.com', password: 'events123', role: 'manager', domain: 'events' },
  { name: 'Team Member', email: 'member@ecell.com', password: 'member123', role: 'member', domain: 'general' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Query.deleteMany({});
    console.log('🗑  Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`👤 Created ${createdUsers.length} users`);

    const admin = createdUsers[0];
    const manager = createdUsers[1];
    const member = createdUsers[3];

    // Create sample queries
    const queries = [
      {
        title: 'Website login page is broken on mobile',
        description: 'The login button on the E-Cell website does not respond on mobile devices. Tested on iPhone 14 and Samsung S22. The issue has been reproducible since last week.',
        category: 'tech',
        priority: 'high',
        status: 'open',
        createdBy: member._id,
        assignedTo: manager._id,
        statusHistory: [{ status: 'open', changedBy: member._id }],
      },
      {
        title: 'Need banner designs for E-Summit 2025',
        description: 'We need social media banners (1080x1080 and 1920x1080) for E-Summit promotion. Deadline is end of this month. Please coordinate with the design team.',
        category: 'events',
        priority: 'medium',
        status: 'in_progress',
        createdBy: member._id,
        assignedTo: createdUsers[2]._id,
        statusHistory: [
          { status: 'open', changedBy: member._id },
          { status: 'in_progress', changedBy: createdUsers[2]._id, note: 'Working with design team' },
        ],
      },
      {
        title: 'Sponsorship portal not sending confirmation emails',
        description: 'Partners who submit the sponsorship form are not receiving the automatic confirmation email. This has been an issue for 3 days and we may be losing potential sponsors.',
        category: 'partnerships',
        priority: 'critical',
        status: 'open',
        createdBy: admin._id,
        statusHistory: [{ status: 'open', changedBy: admin._id }],
      },
    ];

    const createdQueries = await Query.create(queries);
    console.log(`📝 Created ${createdQueries.length} sample queries`);

    // Add a sample comment
    createdQueries[0].comments.push({
      author: manager._id,
      text: 'Investigating the issue. Looks like it might be a CSS overflow problem with the button container on small viewports.',
      isInternal: false,
    });
    await createdQueries[0].save();

    console.log('\n✅ Seed complete! Demo credentials:');
    users.forEach((u) => console.log(`   ${u.role}: ${u.email} / ${u.password}`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();