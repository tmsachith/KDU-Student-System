const mongoose = require('mongoose');

// Database connection utility for different environments
class DatabaseConnection {
  static async connect() {
    try {
      const uri = process.env.MONGODB_URI;
      
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: process.env.NODE_ENV === 'production' ? 5 : 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
      };

      // Additional production settings
      if (process.env.NODE_ENV === 'production') {
        options.retryWrites = true;
        options.w = 'majority';
      }

      await mongoose.connect(uri, options);
      
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

      return mongoose.connection;
    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error.message);
      
      // In serverless environments, don't exit the process
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
      
      throw error;
    }
  }

  static async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('📴 MongoDB connection closed');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }

  static getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      state: states[mongoose.connection.readyState],
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      port: mongoose.connection.port
    };
  }
}

module.exports = DatabaseConnection;
