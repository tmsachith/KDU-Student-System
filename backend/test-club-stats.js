const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Event = require('./models/Event');

// Test script to verify club statistics endpoint
async function testClubStats() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/kdu-student-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find a club user
    const clubUser = await User.findOne({ role: 'club' });
    if (!clubUser) {
      console.log('No club user found. Creating one for testing...');
      // Could create a test club user here if needed
      return;
    }
    
    console.log('Found club user:', clubUser.email);
    
    // Count events for this club user
    const totalEvents = await Event.countDocuments({ createdBy: clubUser._id });
    const approvedEvents = await Event.countDocuments({ 
      createdBy: clubUser._id, 
      isApproved: true 
    });
    const pendingEvents = await Event.countDocuments({ 
      createdBy: clubUser._id,
      isApproved: false, 
      $or: [
        { rejectedBy: { $exists: false } },
        { rejectedBy: null }
      ]
    });
    const rejectedEvents = await Event.countDocuments({ 
      createdBy: clubUser._id,
      rejectedBy: { $exists: true, $ne: null } 
    });
    
    console.log('Club event statistics:');
    console.log('- Total events:', totalEvents);
    console.log('- Approved events:', approvedEvents);
    console.log('- Pending events:', pendingEvents);
    console.log('- Rejected events:', rejectedEvents);
    
    // Test the endpoint URL format
    console.log('\nEndpoint should be available at: GET /api/events/stats/my');
    console.log('With Authorization header containing JWT token for club user');
    
  } catch (error) {
    console.error('Error testing club stats:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

if (require.main === module) {
  testClubStats();
}

module.exports = { testClubStats };
