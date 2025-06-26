# KDU Student Mobile App

## Overview

This is the official mobile application for KDU University students. The app provides an exclusive portal for students to access their courses, join clubs, and participate in university activities.

## Target Users

**Students Only** - This mobile application is specifically designed for students. Faculty, club administrators, and system administrators should use the web application instead.

## Features

- **Student Authentication**: Secure login for students only
- **Google Sign-In**: Quick authentication using Google accounts
- **Student Registration**: Easy account creation for new students
- **Student Dashboard**: Personalized portal with student-specific features
- **Course Access**: View and manage enrolled courses
- **Club Participation**: Browse and join university clubs
- **University Activities**: Stay updated with campus events and activities

## Role Restrictions

- ✅ **Students**: Full access to mobile app features
- ❌ **Club Administrators**: Use web application instead
- ❌ **System Administrators**: Use web application instead

## Getting Started

### Prerequisites

- Flutter SDK (3.6.1 or higher)
- Dart SDK
- Android Studio or VS Code with Flutter extensions
- Android device/emulator or iOS device/simulator

### Installation

1. Clone the repository
2. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
3. Install dependencies:
   ```bash
   flutter pub get
   ```
4. Run the app:
   ```bash
   flutter run
   ```

### Environment Setup

Make sure your backend API is running and accessible from your mobile device/emulator.

### Google Sign-In Setup

To enable Google Sign-In functionality:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Sign-In API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sign-In API" and enable it

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Create credentials for both Android and iOS

4. **Configure Android**:
   - Add your app's package name
   - Get SHA-1 fingerprint: `keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore`
   - Download the `google-services.json` file and place it in `android/app/`

5. **Configure iOS**:
   - Add your app's bundle identifier
   - Download the `GoogleService-Info.plist` file and add it to `ios/Runner/`

6. **Update Backend**:
   - Add your Google Client ID to the backend `.env` file:
     ```
     GOOGLE_CLIENT_ID=your_google_client_id_here
     ```

For detailed setup instructions, refer to the [Google Sign-In Flutter documentation](https://firebase.google.com/docs/auth/flutter/federated-auth).

## Authentication

- Only student accounts can log into the mobile app
- **Traditional Login**: Email and password authentication
- **Google Sign-In**: Quick authentication using Google accounts (student role enforced)
- Non-student users will receive an error message directing them to use the web application
- All new registrations through the mobile app are automatically assigned the "student" role

## Architecture

- **State Management**: Provider pattern
- **HTTP Client**: Standard HTTP package
- **Local Storage**: SharedPreferences for token storage
- **UI Framework**: Material Design widgets

## Support

For technical support or questions about the mobile app, please contact the KDU IT department.

---

**Note**: For club management and administrative functions, please use the KDU Student System web application.
