class Environment {
  static const String dev = 'development';
  static const String prod = 'production';

  // Get environment from build configuration
  static const String currentEnvironment =
      String.fromEnvironment('ENV', defaultValue: dev);

  // Production backend URL
  static const String productionApiUrl =
      'https://kdu-student-system-backend.vercel.app/api';

  // Development backend URLs
  static const String localApiUrl =
      'http://localhost:5000/api'; // iOS Simulator
  static const String androidEmulatorApiUrl =
      'http://10.0.2.2:5000/api'; // Android Emulator

  // Smart API URL selection
  static String get apiUrl {
    // If explicitly set to production, use production URL
    if (currentEnvironment == prod) {
      return productionApiUrl;
    }

    // For development, detect platform
    return _getDevApiUrl();
  }

  static String _getDevApiUrl() {
    // Try to detect if running on emulator vs real device
    // This is a simple approach - you might want to make this more sophisticated
    try {
      // For now, default to Android emulator URL for development
      // You can manually switch this based on your development setup
      return androidEmulatorApiUrl;

      // If you're developing on iOS simulator, change to:
      // return localApiUrl;
    } catch (e) {
      return androidEmulatorApiUrl;
    }
  }

  // Helper methods to check environment
  static bool get isDevelopment => currentEnvironment == dev;
  static bool get isProduction => currentEnvironment == prod;

  // Debug information
  static Map<String, dynamic> get debugInfo => {
        'environment': currentEnvironment,
        'apiUrl': apiUrl,
        'isDevelopment': isDevelopment,
        'isProduction': isProduction,
      };
}
