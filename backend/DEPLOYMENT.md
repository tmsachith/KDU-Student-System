# KDU Student System Backend - Vercel Deployment Guide

## 🚀 Deployment Setup

### 1. Vercel CLI Setup
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link
```

### 2. Environment Variables Setup

#### Required Environment Variables for Production:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Strong JWT secret key
- `NODE_ENV` - Set to "production"
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase client email
- `FIREBASE_PRIVATE_KEY` - Firebase private key

#### Set environment variables in Vercel:
```bash
# Set production environment variables
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add NODE_ENV production
# ... add all required variables
```

### 3. Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Deploy to preview (staging)
vercel
```

## 🔧 Development vs Production

### Local Development
- Uses `.env` file for environment variables
- MongoDB can be local or Atlas
- CORS allows localhost origins
- Detailed error logging
- Hot reload with nodemon

### Production (Vercel)
- Uses Vercel environment variables
- MongoDB Atlas (required for serverless)
- CORS restricted to production domains
- Production error handling
- Serverless functions

## 📁 File Structure
```
backend/
├── server.js              # Main server file (exports app for Vercel)
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── scripts/
│   └── pre-deploy.sh     # Pre-deployment script
├── config/               # Configuration files
├── middleware/           # Express middleware
├── models/               # Mongoose models
├── routes/               # API routes
└── services/             # Business logic services
```

## 🔄 Workflow for Updates

### 1. Local Development
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your local values

# Start development server
npm run dev
```

### 2. Testing Before Deployment
```bash
# Run tests (when implemented)
npm test

# Check for environment issues
node -e "require('dotenv').config(); console.log('Environment check:', !!process.env.MONGODB_URI)"
```

### 3. Deployment Process
```bash
# Commit your changes
git add .
git commit -m "Your commit message"
git push origin main

# Deploy to Vercel
vercel --prod
```

## 🔐 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use strong, unique JWT secrets
- Rotate secrets periodically
- Use MongoDB Atlas with IP whitelisting
- Enable MongoDB authentication

### CORS Configuration
- Restrict origins to your domains only
- Use HTTPS in production
- Implement rate limiting (future enhancement)

### Error Handling
- Production errors don't expose sensitive info
- Log errors for monitoring
- Implement proper HTTP status codes

## 🔍 Monitoring and Maintenance

### Health Checks
- `/api/health` - Basic health check
- `/api` - API information and endpoints

### Logs
- Check Vercel function logs: `vercel logs`
- Monitor MongoDB Atlas logs
- Set up error tracking (Sentry, etc.)

### Database Maintenance
- Regular backups (MongoDB Atlas handles this)
- Monitor database performance
- Index optimization
- Connection pooling

## 🚀 Performance Optimization

### Serverless Considerations
- Functions have cold start time
- Database connections should be reused
- Optimize bundle size
- Use environment-specific configurations

### MongoDB Optimization
- Use connection pooling
- Implement proper indexing
- Monitor query performance
- Use aggregation pipelines efficiently

## 🔧 Troubleshooting

### Common Issues
1. **Cold Start Delays**: First request after inactivity may be slow
2. **Database Connection Timeouts**: Use connection pooling
3. **Environment Variable Issues**: Check Vercel dashboard
4. **CORS Errors**: Verify origin configuration
5. **File Upload Issues**: Ensure Cloudinary configuration

### Debug Commands
```bash
# Check deployment status
vercel ls

# View function logs
vercel logs

# Check environment variables
vercel env ls

# Test local production build
NODE_ENV=production npm start
```

## 📋 Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] MongoDB Atlas database accessible
- [ ] Cloudinary account set up
- [ ] Firebase configuration complete
- [ ] CORS origins updated for production domain
- [ ] SSL certificate configured (Vercel handles this)
- [ ] Domain configured (if using custom domain)
- [ ] Health check endpoint working
- [ ] Error handling tested
- [ ] Performance tested
- [ ] Security review completed

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
