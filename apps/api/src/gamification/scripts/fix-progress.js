const mongoose = require('mongoose');
require('dotenv').config();

async function fixStudentProgress() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cibereduca';

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  
  // Fix avatar.accessories from array to string and reset testsCompleted
  console.log('Fixing StudentProgress documents...');
  const result = await db.collection('studentprogresses').updateMany(
    {},
    { 
      $set: { 
        'avatar.accessories': '',
        'avatar.style': 'avataaars',
        testsCompleted: []
      }
    }
  );

  console.log('Updated', result.modifiedCount, 'documents');
  await mongoose.connection.close();
  console.log('Done!');
  process.exit(0);
}

fixStudentProgress().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
