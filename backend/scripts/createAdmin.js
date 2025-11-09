require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
  const mongoURI = process.env.MONGODB_URI;

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@sandwichaward.com';
    const plainPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let adminUser = await User.findOne({ email });

    if (adminUser) {
      // Ensure admin role and active/verified flags
      adminUser.role = 'admin';
      adminUser.isActive = true;
      adminUser.isVerified = true;
      // Always set the password in plaintext; model pre-save hook will hash it
      adminUser.password = plainPassword;
      await adminUser.save();
      console.log(`ℹ️ Admin user already existed. Ensured role, status, and password for ${email}.`);
    } else {
      adminUser = new User({
        firstName: 'System',
        lastName: 'Administrator',
        email,
        // Set plaintext; User model pre-save hook hashes it
        password: plainPassword,
        role: 'admin',
        isActive: true,
        isVerified: true,
        phoneNumber: '+2348000000000',
        isStudent: false,
      });
      await adminUser.save();
      console.log(`✅ Created admin user: ${email} (password: ${plainPassword})`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 Disconnected from MongoDB');
    } catch {}
  }
}

createAdmin();