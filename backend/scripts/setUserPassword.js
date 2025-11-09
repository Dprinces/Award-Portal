const path = require('path');
// Load backend/.env explicitly so running from repo root works
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Usage:
 *  node backend/scripts/setUserPassword.js --id <USER_ID> --password <NEW_PASSWORD>
 *  node backend/scripts/setUserPassword.js --email <EMAIL> --password <NEW_PASSWORD>
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    const val = args[i + 1];
    if (key === '--id' || key === '--email' || key === '--password') {
      out[key.replace('--', '')] = val;
      i++;
    }
  }
  return out;
}

async function main() {
  const { id, email, password } = parseArgs();

  if ((!id && !email) || !password) {
    console.error('Usage: --id <USER_ID> or --email <EMAIL> and --password <NEW_PASSWORD>');
    process.exit(1);
  }

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    const query = id ? { _id: id } : { email };
    const user = await User.findOne(query);
    if (!user) {
      console.error('❌ User not found for query:', query);
      process.exit(1);
    }

    user.password = password; // Pre-save hook will hash
    user.isActive = true;
    user.isVerified = user.isVerified ?? true;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    console.log(`✅ Password updated for user ${user.email} (id: ${user._id}).`);
    console.log('   The user can now log in with the new password.');
  } catch (err) {
    console.error('❌ Error updating user password:', err);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 Disconnected from MongoDB');
    } catch {}
  }
}

main();