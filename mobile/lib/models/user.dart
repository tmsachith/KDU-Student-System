class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final bool isEmailVerified;
  final bool isGoogleUser;
  final String? profileImageUrl;
  final String? googleProfileImageUrl;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'student', // Default to student role for mobile app
    this.isEmailVerified = false,
    this.isGoogleUser = false,
    this.profileImageUrl,
    this.googleProfileImageUrl,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: 'student', // Force student role for mobile app
      isEmailVerified: json['isEmailVerified'] ?? false,
      isGoogleUser: json['isGoogleUser'] ?? false,
      profileImageUrl: json['profileImageUrl'],
      googleProfileImageUrl: json['googleProfileImageUrl'],
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': 'student', // Always send student role from mobile
      'isEmailVerified': isEmailVerified,
      'isGoogleUser': isGoogleUser,
      'profileImageUrl': profileImageUrl,
      'googleProfileImageUrl': googleProfileImageUrl,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  // Helper method to get the current profile image URL
  String? get currentProfileImageUrl {
    if (isGoogleUser && googleProfileImageUrl != null) {
      return googleProfileImageUrl;
    }
    return profileImageUrl;
  }
}

class AuthResponse {
  final String message;
  final String token;
  final User user;

  AuthResponse({
    required this.message,
    required this.token,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      message: json['message'] ?? '',
      token: json['token'] ?? '',
      user: User.fromJson(json['user']),
    );
  }
}
