# KDU Student System Mobile

Flutter mobile application for Android and iOS.

## Features
- User authentication (login/register)
- Role-based dashboard
- Material Design UI
- Provider state management
- JWT token storage with SharedPreferences
- HTTP API integration

## Setup

1. Install dependencies:
   ```bash
   flutter pub get
   ```

2. Configure API endpoint in `lib/services/api_service.dart`:
   - Android Emulator: `http://10.0.2.2:5000/api`
   - iOS Simulator: `http://localhost:5000/api`
   - Physical Device: `http://YOUR_IP:5000/api`

3. Run the app:
   ```bash
   flutter run
   ```

4. Build for release:
   ```bash
   # Android
   flutter build apk
   
   # iOS
   flutter build ios
   ```

## Screens
- Login Screen
- Register Screen  
- Dashboard Screen (Role-based content)

## Dependencies
- `provider` - State management
- `http` - API calls
- `shared_preferences` - Local storage
