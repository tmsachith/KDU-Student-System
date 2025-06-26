# KDU Student System Web

React TypeScript web application with Tailwind CSS.

## Features
- User authentication (login/register)
- Role-based dashboard
- Responsive design with Tailwind CSS
- Context API for state management
- Protected routes
- JWT token storage in localStorage

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Pages
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Role-based dashboard (Protected)

## User Roles
- **Student**: Green badge, student portal access
- **Club**: Blue badge, club management access
- **Admin**: Red badge, admin panel access
