# KDU Student System

A complete full-stack application with role-based authentication system featuring React TypeScript web interface (admin/club only), Flutter mobile app (students only with Google Sign-In), and Node.js backend with MongoDB database.

## 🎯 Role-Based Access Control

### Web Application (Administrators & Club Managers Only)
- ✅ **Administrators**: Full system access and user management
- ✅ **Club Managers**: Club management and event organization
- ❌ **Students**: Access blocked - redirected to mobile app

### Mobile Application (Students Only)
- ✅ **Students**: Full mobile access with traditional and Google Sign-In
- ❌ **Administrators**: Access blocked - redirected to web app
- ❌ **Club Managers**: Access blocked - redirected to web app

## 📱 Platform-Specific Features

### Web Features (Admin/Club)
- Role-based dashboard access
- User management (Admin only)
- Club management interface
- Event organization tools
- Student registration blocked

### Mobile Features (Students)
- Student-only authentication
- Google Sign-In integration
- Course access and management
- Club participation
- University activity updates
- Traditional email/password login

## Project Structure

```
KDU Student System/
├── backend/           # Node.js + Express + MongoDB API
├── web/              # React TypeScript + Tailwind CSS
├── mobile/           # Flutter Mobile App
└── README.md         # This file
```

## 🚀 Features

### Authentication System
- Platform-specific role enforcement
- JWT token-based authentication
- Google OAuth integration (mobile only)
- Secure password hashing with bcryptjs
- Token verification and validation
- Automatic role-based redirects

### Security Features
- Role validation at multiple levels (frontend, backend)
- Student access blocked on web platform
- Non-student access blocked on mobile platform
- Google Sign-In with backend verification
- Protected routes with role authorization

### Technology Stack

#### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Google Auth Library** for OAuth verification
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **CORS** for cross-origin requests

#### Web Frontend (Admin/Club Only)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management
- **Role-based access control**

#### Mobile App (Students Only)
- **Flutter** with Dart
- **Google Sign-In** integration
- **Provider** for state management
- **HTTP** package for API calls
- **SharedPreferences** for local storage
- **Student-only access enforcement**

## 🚀 Quick Start

> **Important**: For detailed setup instructions including Google Sign-In configuration, see [SETUP.md](./SETUP.md)

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Flutter SDK (v3.6 or higher)
- Google Cloud Console account (for Google Sign-In)

### 1. Backend Setup

```bash
cd backend
npm install
npm install google-auth-library
```

Configure `.env` file:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kdu_student_system
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=your_google_client_id_here
```

Start the server:
```bash
npm run dev
```

### 2. Web Application Setup (Admin/Club Access)

```bash
cd web
npm install
npm start
```

**Access**: http://localhost:3000 (Admin/Club users only)

### 3. Mobile Application Setup (Student Access)

```bash
cd mobile
flutter pub get
flutter run
```

**Note**: Requires Google Sign-In configuration for full functionality

## 📚 Detailed Setup

For complete setup instructions including:
- Google OAuth configuration
- SHA-1 fingerprint setup
- google-services.json configuration
- iOS setup (if applicable)
- Troubleshooting guide

**See the detailed [SETUP.md](./SETUP.md) guide**
   ```

3. Configure environment variables:
   - The `.env` file is already configured for local development
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The web app will be available at `http://localhost:3000`

### Mobile App Setup

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Update API configuration:
   - For Android Emulator: `http://10.0.2.2:5000/api`
   - For iOS Simulator: `http://localhost:5000/api`
   - For Physical Device: `http://YOUR_COMPUTER_IP:5000/api`

4. Run the app:
   ```bash
   flutter run
   ```

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/profile` | Get user profile | Private |
| GET | `/api/auth/verify` | Verify token | Private |
| GET | `/api/auth/admin-only` | Admin only route | Admin |
| GET | `/api/auth/club-or-admin` | Club/Admin route | Club/Admin |

### User Registration Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

### User Login Request Body
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, hashed, min 6 chars),
  role: String (enum: ['student', 'club', 'admin'], default: 'student'),
  createdAt: Date (default: Date.now)
}
```

## Development

### Running All Services
1. Start MongoDB service
2. Run backend: `cd backend && npm run dev`
3. Run web frontend: `cd web && npm start`
4. Run mobile app: `cd mobile && flutter run`

### Testing User Accounts
You can create test accounts with different roles:

1. **Student Account**:
   - Role: `student`
   - Access: Student portal

2. **Club Account**:
   - Role: `club`
   - Access: Club management features

3. **Admin Account**:
   - Role: `admin`
   - Access: Full system administration

## Security Features

- Password hashing with bcryptjs (cost factor: 12)
- JWT tokens with expiration
- Input validation and sanitization
- CORS configuration
- Role-based route protection
- Token verification middleware

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support or questions, please create an issue in the repository.
