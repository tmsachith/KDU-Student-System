// Environment validation utility
class EnvironmentValidator {
  static requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
  ];

  static optionalVars = [
    'NODE_ENV',
    'PORT',
    'CORS_ORIGINS',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'EMAIL_SERVICE',
    'EMAIL_USER',
    'EMAIL_PASS',
    'MAX_FILE_SIZE',
    'ALLOWED_FILE_TYPES'
  ];

  static validate() {
    const missing = [];
    const warnings = [];
    
    // Check required variables
    for (const varName of this.requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    // Check optional but recommended variables
    for (const varName of this.optionalVars) {
      if (!process.env[varName]) {
        warnings.push(varName);
      }
    }

    // Log results
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(var_ => console.error(`   - ${var_}`));
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    }

    if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  Missing optional environment variables:');
      warnings.forEach(var_ => console.warn(`   - ${var_}`));
    }

    // Validate specific formats
    this.validateFormats();

    if (missing.length === 0) {
      console.log('✅ Environment validation passed');
    }

    return { missing, warnings };
  }

  static validateFormats() {
    // Validate MongoDB URI format
    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
      console.error('❌ MONGODB_URI should start with "mongodb://" or "mongodb+srv://"');
    }

    // Validate JWT Secret length
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      console.warn('⚠️  JWT_SECRET should be at least 32 characters long');
    }

    // Validate CORS origins format
    if (process.env.CORS_ORIGINS) {
      const origins = process.env.CORS_ORIGINS.split(',');
      origins.forEach(origin => {
        const trimmed = origin.trim();
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          console.warn(`⚠️  CORS origin should include protocol: ${trimmed}`);
        }
      });
    }

    // Validate NODE_ENV
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
      console.warn('⚠️  NODE_ENV should be one of: development, production, test');
    }
  }

  static getConfig() {
    return {
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/kdu-student-system',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      },
      jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      },
      cors: {
        origins: process.env.CORS_ORIGINS 
          ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
          : ['http://localhost:3000', 'http://localhost:8080']
      },
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
      },
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
      },
      email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
        allowedTypes: process.env.ALLOWED_FILE_TYPES 
          ? process.env.ALLOWED_FILE_TYPES.split(',')
          : ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      }
    };
  }

  static logConfig() {
    const config = this.getConfig();
    console.log('🔧 Current Configuration:');
    console.log(`   Environment: ${config.environment}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${config.mongodb.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    console.log(`   CORS Origins: ${config.cors.origins.join(', ')}`);
    console.log(`   JWT Expires: ${config.jwt.expiresIn}`);
    console.log(`   Max File Size: ${(config.upload.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
  }
}

module.exports = EnvironmentValidator;
