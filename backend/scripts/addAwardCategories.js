const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');
require('dotenv').config();

// Award categories data
const awardCategories = [
  { name: 'Best student of the year', description: 'Recognizing the most outstanding student across all academic and extracurricular activities.' },
  { name: 'Best Governor of the year', description: 'Honoring the most effective and impactful student governor.' },
  { name: 'Best course representative of the year', description: 'Celebrating the most dedicated and effective course representative.' },
  { name: 'Most expensive male student', description: 'Recognizing the male student known for their luxurious lifestyle and fashion sense.' },
  { name: 'Most expensive female student', description: 'Recognizing the female student known for their luxurious lifestyle and fashion sense.' },
  { name: 'Most Entrepreneur female student of the year', description: 'Celebrating the most innovative and successful female student entrepreneur.' },
  { name: 'Most Entrepreneur male student of the year', description: 'Celebrating the most innovative and successful male student entrepreneur.' },
  { name: 'Most famous female student of the year', description: 'Honoring the most well-known and influential female student on campus.' },
  { name: 'Most famous male student of the year', description: 'Honoring the most well-known and influential male student on campus.' },
  { name: 'Most famous female Executive of the year', description: 'Recognizing the most prominent female student executive.' },
  { name: 'Most famous male Executive of the year', description: 'Recognizing the most prominent male student executive.' },
  { name: 'Most brilliant male student of the year', description: 'Celebrating academic excellence and intellectual prowess among male students.' },
  { name: 'Most brilliant female student of the year', description: 'Celebrating academic excellence and intellectual prowess among female students.' },
  { name: 'Most gallant female student of the year', description: 'Honoring courage, bravery, and noble character in female students.' },
  { name: 'Most gallant male student of the year', description: 'Honoring courage, bravery, and noble character in male students.' },
  { name: 'Most innovative female student of the year', description: 'Recognizing creativity and innovative thinking among female students.' },
  { name: 'Most active female student in school activities', description: 'Celebrating the most engaged female student in campus activities and events.' },
  { name: 'Most active male student in school activities', description: 'Celebrating the most engaged male student in campus activities and events.' },
  { name: 'Most integrity female student of the year', description: 'Honoring honesty, moral principles, and ethical behavior in female students.' },
  { name: 'Most integrity male student of the year', description: 'Honoring honesty, moral principles, and ethical behavior in male students.' },
  { name: 'Most peace Maker of the year (male)', description: 'Recognizing male students who promote harmony and resolve conflicts peacefully.' },
  { name: 'Most peace Maker of the year (female)', description: 'Recognizing female students who promote harmony and resolve conflicts peacefully.' },
  { name: 'Most responsible Female student of the year', description: 'Celebrating reliability, accountability, and maturity in female students.' },
  { name: 'Most responsible male student of the year', description: 'Celebrating reliability, accountability, and maturity in male students.' },
  { name: 'Most inspirational student of the year (male)', description: 'Honoring male students who motivate and inspire others through their actions.' },
  { name: 'Most inspirational student of the year (female)', description: 'Honoring female students who motivate and inspire others through their actions.' },
  { name: 'Most humble student of the year (male)', description: 'Recognizing modesty, humility, and down-to-earth character in male students.' },
  { name: 'Most humble student of the year (female)', description: 'Recognizing modesty, humility, and down-to-earth character in female students.' },
  { name: 'Most Sociable student of the year (male)', description: 'Celebrating the most friendly and socially engaging male student.' },
  { name: 'Most Sociable student of the year (female)', description: 'Celebrating the most friendly and socially engaging female student.' },
  { name: 'Most outstanding personality of the year (male)', description: 'Honoring exceptional character and personality traits in male students.' },
  { name: 'Most outstanding personality of the year (female)', description: 'Honoring exceptional character and personality traits in female students.' },
  { name: 'Most Respectful female student of the year', description: 'Recognizing courtesy, politeness, and respectful behavior in female students.' },
  { name: 'Most Respectful male student of the year', description: 'Recognizing courtesy, politeness, and respectful behavior in male students.' },
  { name: 'Most Disciplined female student of the year', description: 'Celebrating self-control, orderliness, and disciplined behavior in female students.' },
  { name: 'Most Disciplined Male student of the year', description: 'Celebrating self-control, orderliness, and disciplined behavior in male students.' },
  { name: 'Best team player of the year', description: 'Honoring students who excel in collaboration and teamwork across all activities.' },
  { name: 'Cultural icon Award(female)', description: 'Recognizing female students who best represent and promote cultural values and traditions.' },
  { name: 'Cultural icon Award (male)', description: 'Recognizing male students who best represent and promote cultural values and traditions.' },
  { name: 'Most popular Executive Member of the year', description: 'Celebrating the most beloved and well-regarded student executive member.' }
];

// Icon mapping for different category types
const getIconForCategory = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('best') || lowerName.includes('outstanding')) return 'star';
  if (lowerName.includes('governor') || lowerName.includes('executive')) return 'crown';
  if (lowerName.includes('entrepreneur')) return 'briefcase';
  if (lowerName.includes('famous') || lowerName.includes('popular')) return 'trending-up';
  if (lowerName.includes('brilliant')) return 'brain';
  if (lowerName.includes('gallant')) return 'shield';
  if (lowerName.includes('innovative')) return 'lightbulb';
  if (lowerName.includes('active')) return 'activity';
  if (lowerName.includes('integrity')) return 'check-circle';
  if (lowerName.includes('peace')) return 'heart';
  if (lowerName.includes('responsible')) return 'user-check';
  if (lowerName.includes('inspirational')) return 'zap';
  if (lowerName.includes('humble')) return 'smile';
  if (lowerName.includes('sociable')) return 'users';
  if (lowerName.includes('respectful')) return 'thumbs-up';
  if (lowerName.includes('disciplined')) return 'target';
  if (lowerName.includes('team')) return 'users';
  if (lowerName.includes('cultural')) return 'globe';
  if (lowerName.includes('expensive')) return 'diamond';
  return 'trophy';
};

// Color mapping for different category types
const getColorForCategory = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('best') || lowerName.includes('outstanding')) return '#FFD700'; // Gold
  if (lowerName.includes('governor') || lowerName.includes('executive')) return '#8B5CF6'; // Purple
  if (lowerName.includes('entrepreneur')) return '#10B981'; // Green
  if (lowerName.includes('famous') || lowerName.includes('popular')) return '#F59E0B'; // Orange
  if (lowerName.includes('brilliant')) return '#3B82F6'; // Blue
  if (lowerName.includes('gallant')) return '#DC2626'; // Red
  if (lowerName.includes('innovative')) return '#06B6D4'; // Cyan
  if (lowerName.includes('active')) return '#84CC16'; // Lime
  if (lowerName.includes('integrity')) return '#059669'; // Emerald
  if (lowerName.includes('peace')) return '#EC4899'; // Pink
  if (lowerName.includes('responsible')) return '#7C3AED'; // Violet
  if (lowerName.includes('inspirational')) return '#F97316'; // Orange
  if (lowerName.includes('humble')) return '#65A30D'; // Green
  if (lowerName.includes('sociable')) return '#0EA5E9'; // Sky
  if (lowerName.includes('respectful')) return '#8B5CF6'; // Purple
  if (lowerName.includes('disciplined')) return '#DC2626'; // Red
  if (lowerName.includes('team')) return '#059669'; // Emerald
  if (lowerName.includes('cultural')) return '#7C2D12'; // Brown
  if (lowerName.includes('expensive')) return '#BE185D'; // Rose
  return '#3B82F6'; // Default blue
};

async function addAwardCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create an admin user to set as creator
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Creating default admin user...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      adminUser = new User({
         firstName: 'System',
         lastName: 'Administrator',
         email: 'admin@sandwichaward.com',
         password: hashedPassword,
         role: 'admin',
         isActive: true,
         isVerified: true,
         phoneNumber: '+2348000000000',
         isStudent: false
       });
      
      await adminUser.save();
      console.log('✅ Created default admin user: admin@sandwichaward.com (password: admin123)');
    }

    console.log(`Using admin user: ${adminUser.firstName} ${adminUser.lastName}`);

    // Set voting dates (start in 1 week, end in 1 month)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Start in 1 week
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // End in 1 month

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < awardCategories.length; i++) {
      const categoryData = awardCategories[i];
      
      // Check if category already exists
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') }
      });

      if (existingCategory) {
        console.log(`⚠️  Category "${categoryData.name}" already exists, skipping...`);
        skipCount++;
        continue;
      }

      // Create new category
      const category = new Category({
        name: categoryData.name,
        description: categoryData.description,
        icon: getIconForCategory(categoryData.name),
        color: getColorForCategory(categoryData.name),
        displayOrder: i + 1,
        votingSettings: {
          startDate: startDate,
          endDate: endDate,
          votePrice: 100, // Default ₦100 per vote
          maxVotesPerUser: null, // Unlimited votes per user
          requirePayment: true
        },
        eligibilityCriteria: {
          faculties: [], // Open to all faculties
          departments: [], // Open to all departments
          levels: ['100', '200', '300', '400', '500'], // All levels
          minLevel: '100',
          maxLevel: '500'
        },
        allowSelfNomination: true,
        maxNominees: 50,
        isActive: true,
        featured: false,
        createdBy: adminUser._id
      });

      await category.save();
      console.log(`✅ Created category: "${categoryData.name}"`);
      successCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully created: ${successCount} categories`);
    console.log(`⚠️  Skipped (already exists): ${skipCount} categories`);
    console.log(`📅 Voting period: ${startDate.toDateString()} to ${endDate.toDateString()}`);
    console.log(`💰 Vote price: ₦100 per vote`);
    
  } catch (error) {
    console.error('Error adding award categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
addAwardCategories();