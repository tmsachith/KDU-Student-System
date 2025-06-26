# KDU Student System Backend

Node.js Express API with MongoDB and JWT authentication.

## Features
- User registration and login
- JWT token authentication
- Role-based access control
- Password hashing with bcryptjs
- Input validation
- MongoDB integration with Mongoose

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/kdu_student_system
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   ```

3. Start MongoDB service

4. Run the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Protected)
- `GET /api/auth/verify` - Verify token (Protected)
- `GET /api/auth/admin-only` - Admin route (Admin only)
- `GET /api/auth/club-or-admin` - Club/Admin route (Club/Admin only)

## User Roles
- `student` - Default role for students
- `club` - Club administrators
- `admin` - System administrators
