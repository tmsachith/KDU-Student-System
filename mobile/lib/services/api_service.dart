import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

class ApiService {
  static const String baseUrl =
      'http://10.0.2.2:5000/api'; // For Android emulator
  // Use 'http://localhost:5000/api' for iOS simulator
  // Use your actual IP address for physical devices

  static Map<String, String> get headers => {
        'Content-Type': 'application/json',
      };

  static Map<String, String> get authHeaders {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${TokenService.token}',
    };
  }

  // Login
  static Future<AuthResponse> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: headers,
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return AuthResponse.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Login failed');
    }
  }

  // Register
  static Future<AuthResponse> register(
    String name,
    String email,
    String password,
    String role,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: headers,
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return AuthResponse.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Registration failed');
    }
  }

  // Get Profile
  static Future<User> getProfile() async {
    if (TokenService.token == null) {
      throw Exception('No token available');
    }

    final response = await http.get(
      Uri.parse('$baseUrl/auth/profile'),
      headers: authHeaders,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return User.fromJson(data['user']);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to get profile');
    }
  }

  // Verify Token
  static Future<bool> verifyToken() async {
    if (TokenService.token == null) {
      return false;
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/verify'),
        headers: authHeaders,
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Google Login
  static Future<AuthResponse> googleLogin(
    String idToken,
    String accessToken,
    String email,
    String name,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/google'),
      headers: headers,
      body: jsonEncode({
        'idToken': idToken,
        'accessToken': accessToken,
        'email': email,
        'name': name,
        'role': 'student', // Force student role for mobile app
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return AuthResponse.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Google login failed');
    }
  }

  // Resend Verification Email
  static Future<bool> resendVerificationEmail(String email) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/resend-verification'),
      headers: headers,
      body: jsonEncode({
        'email': email,
      }),
    );

    return response.statusCode == 200;
  }
}

class TokenService {
  static String? _token;
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  static String? get token => _token;

  static Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  static Future<String?> getToken() async {
    if (_token != null) return _token;

    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    return _token;
  }

  static Future<User?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userKey);

    if (userJson != null) {
      final userData = jsonDecode(userJson);
      return User.fromJson(userData);
    }

    return null;
  }

  static Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  static Future<void> init() async {
    await getToken();
  }
}
