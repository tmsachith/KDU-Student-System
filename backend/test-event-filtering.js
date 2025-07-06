// Test script to verify event filtering
// Run this in the backend directory: node test-event-filtering.js

const Event = require('./models/Event');
require('dotenv').config();

const testEventFiltering = async () => {
  try {
    console.log('Testing event filtering...\n');
    
    // Test 1: Count all events
    const totalEvents = await Event.countDocuments({});
    console.log(`Total events: ${totalEvents}`);
    
    // Test 2: Count approved events
    const approvedEvents = await Event.countDocuments({ isApproved: true });
    console.log(`Approved events: ${approvedEvents}`);
    
    // Test 3: Count pending events (improved logic)
    const pendingEvents = await Event.countDocuments({ 
      isApproved: false, 
      $or: [
        { rejectedBy: { $exists: false } },
        { rejectedBy: null }
      ]
    });
    console.log(`Pending events: ${pendingEvents}`);
    
    // Test 4: Count rejected events (improved logic)
    const rejectedEvents = await Event.countDocuments({ 
      rejectedBy: { $exists: true, $ne: null } 
    });
    console.log(`Rejected events: ${rejectedEvents}`);
    
    // Test 5: Show sample events with their statuses
    console.log('\nSample events:');
    const sampleEvents = await Event.find({})
      .select('title isApproved rejectedBy createdAt')
      .populate('rejectedBy', 'name')
      .limit(10);
    
    sampleEvents.forEach(event => {
      let status = 'pending';
      if (event.isApproved) {
        status = 'approved';
      } else if (event.rejectedBy) {
        status = 'rejected';
      }
      console.log(`- ${event.title}: ${status} (rejectedBy: ${event.rejectedBy ? event.rejectedBy.name : 'null'})`);
    });
    
    // Test 6: Verify totals add up
    const calculatedTotal = approvedEvents + pendingEvents + rejectedEvents;
    console.log(`\nVerification: ${approvedEvents} + ${pendingEvents} + ${rejectedEvents} = ${calculatedTotal}`);
    console.log(`Should equal total events: ${totalEvents}`);
    console.log(`Match: ${calculatedTotal === totalEvents ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('Error testing event filtering:', error);
  }
};

// Only run if this is the main module
if (require.main === module) {
  const mongoose = require('mongoose');
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kdu-student-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('Connected to MongoDB');
    testEventFiltering().then(() => {
      mongoose.connection.close();
    });
  }).catch(err => {
    console.error('MongoDB connection error:', err);
  });
}

module.exports = testEventFiltering;
