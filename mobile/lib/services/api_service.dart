import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../models/event.dart';

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

  // Event API methods

  // Get all approved events
  static Future<List<Event>> getEvents({
    int page = 1,
    int limit = 10,
    String? category,
    String? eventType,
    String? search,
    bool upcoming = true,
    String? startDate,
    String? endDate,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      'upcoming': upcoming.toString(),
    };

    if (category != null) queryParams['category'] = category;
    if (eventType != null) queryParams['eventType'] = eventType;
    if (search != null) queryParams['search'] = search;
    if (startDate != null) queryParams['startDate'] = startDate;
    if (endDate != null) queryParams['endDate'] = endDate;

    final uri =
        Uri.parse('$baseUrl/events').replace(queryParameters: queryParams);

    final response = await http.get(uri, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final List<dynamic> eventsJson = data['events'];
      return eventsJson.map((json) => Event.fromJson(json)).toList();
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to fetch events');
    }
  }

  // Get event by ID
  static Future<Event> getEventById(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/events/$id'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Event.fromJson(data['event']);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to fetch event');
    }
  }

  // Create new event (Club/Admin only)
  static Future<Event> createEvent(Map<String, dynamic> eventData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/events'),
      headers: authHeaders,
      body: jsonEncode(eventData),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return Event.fromJson(data['event']);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to create event');
    }
  }

  // Update event (Creator/Admin only)
  static Future<Event> updateEvent(
      String id, Map<String, dynamic> eventData) async {
    final response = await http.put(
      Uri.parse('$baseUrl/events/$id'),
      headers: authHeaders,
      body: jsonEncode(eventData),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Event.fromJson(data['event']);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to update event');
    }
  }

  // Delete event (Creator/Admin only)
  static Future<void> deleteEvent(String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/events/$id'),
      headers: authHeaders,
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to delete event');
    }
  }

  // Get user's events (Club/Admin only)
  static Future<List<Event>> getMyEvents({
    int page = 1,
    int limit = 10,
    String? status,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (status != null) queryParams['status'] = status;

    final uri = Uri.parse('$baseUrl/events/my/events')
        .replace(queryParameters: queryParams);

    final response = await http.get(uri, headers: authHeaders);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final List<dynamic> eventsJson = data['events'];
      return eventsJson.map((json) => Event.fromJson(json)).toList();
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to fetch your events');
    }
  }

  // Get all events for admin review (Admin only)
  static Future<Map<String, dynamic>> getAdminEvents({
    int page = 1,
    int limit = 10,
    String? status,
    String? category,
    String? eventType,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (status != null) queryParams['status'] = status;
    if (category != null) queryParams['category'] = category;
    if (eventType != null) queryParams['eventType'] = eventType;

    final uri = Uri.parse('$baseUrl/events/admin/all')
        .replace(queryParameters: queryParams);

    final response = await http.get(uri, headers: authHeaders);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'events': (data['events'] as List<dynamic>)
            .map((json) => Event.fromJson(json))
            .toList(),
        'pagination': data['pagination'],
        'statistics': data['statistics'],
      };
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to fetch admin events');
    }
  }

  // Approve event (Admin only)
  static Future<Event> approveEvent(String id) async {
    final response = await http.put(
      Uri.parse('$baseUrl/events/$id/approve'),
      headers: authHeaders,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Event.fromJson(data['event']);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to approve event');
    }
  }

  // Reject event (Admin only)
  static Future<Event> rejectEvent(String id, String? reason) async {
    final response = await http.put(
      Uri.parse('$baseUrl/events/$id/reject'),
      headers: authHeaders,
      body: jsonEncode({'reason': reason}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Event.fromJson(data['event']);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to reject event');
    }
  }

  // Get event statistics (Admin only)
  static Future<Map<String, dynamic>> getEventStatistics() async {
    final response = await http.get(
      Uri.parse('$baseUrl/events/stats/overview'),
      headers: authHeaders,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to fetch event statistics');
    }
  }

  // Profile API methods

  // Update user name
  static Future<User> updateUserName(String name) async {
    if (TokenService.token == null) {
      throw Exception('No token available');
    }

    final response = await http.put(
      Uri.parse('$baseUrl/profile/name'),
      headers: authHeaders,
      body: jsonEncode({
        'name': name,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return User.fromJson(data['user']);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to update name');
    }
  }

  // Upload profile image
  static Future<String> uploadProfileImage(String imagePath) async {
    if (TokenService.token == null) {
      throw Exception('No token available');
    }

    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/profile/upload-image'),
    );

    request.headers.addAll({
      'Authorization': 'Bearer ${TokenService.token}',
    });

    request.files.add(
      await http.MultipartFile.fromPath('profileImage', imagePath),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['imageUrl'];
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to upload image');
    }
  }

  // Remove profile image
  static Future<void> removeProfileImage() async {
    if (TokenService.token == null) {
      throw Exception('No token available');
    }

    final response = await http.delete(
      Uri.parse('$baseUrl/profile/remove-image'),
      headers: authHeaders,
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to remove image');
    }
  }

  // Get updated profile
  static Future<User> getUpdatedProfile() async {
    if (TokenService.token == null) {
      throw Exception('No token available');
    }

    final response = await http.get(
      Uri.parse('$baseUrl/profile'),
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
