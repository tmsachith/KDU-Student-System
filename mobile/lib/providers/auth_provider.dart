import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/google_signin_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _error;
  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;
  String? get token => TokenService.token;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    _isLoading = true;
    notifyListeners();

    await TokenService.init();
    final token = await TokenService.getToken();

    if (token != null) {
      final isValid = await ApiService.verifyToken();
      if (isValid) {
        _user = await TokenService.getUser();
        _isAuthenticated = true;
      } else {
        await TokenService.clearToken();
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await ApiService.login(email, password);

      // Validate that the user is a student for mobile app
      if (response.user.role != 'student') {
        _error =
            'Mobile app is only available for students. Please use the web app for other roles.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      await TokenService.saveToken(response.token);
      await TokenService.saveUser(response.user);

      _user = response.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(
      String name, String email, String password, String role) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Force student role for mobile app registration
      final response =
          await ApiService.register(name, email, password, 'student');

      await TokenService.saveToken(response.token);
      await TokenService.saveUser(response.user);

      _user = response.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> loginWithGoogle() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Sign in with Google
      final googleUser = await GoogleSignInService.signInWithGoogle();
      if (googleUser == null) {
        _error = 'Google Sign-In was cancelled';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      // Authenticate with backend
      final response =
          await GoogleSignInService.authenticateWithBackend(googleUser);
      if (response == null) {
        _error = 'Failed to authenticate with backend';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      // Validate that the user is a student for mobile app
      if (response.user.role != 'student') {
        _error =
            'Mobile app is only available for students. Please use the web app for other roles.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      await TokenService.saveToken(response.token);
      await TokenService.saveUser(response.user);

      _user = response.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await TokenService.clearToken();
    await GoogleSignInService.signOut(); // Also sign out from Google
    _user = null;
    _isAuthenticated = false;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<bool> refreshUserProfile() async {
    try {
      if (!_isAuthenticated || TokenService.token == null) {
        return false;
      }

      _isLoading = true;
      notifyListeners();

      // Get fresh user data from server
      final updatedUser = await ApiService.getProfile();

      // Update local storage with fresh data
      await TokenService.saveUser(updatedUser);

      // Update the current user in memory
      _user = updatedUser;
      _error = null;
      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Refresh user data on app resume/foreground
  Future<void> refreshOnAppResume() async {
    if (_isAuthenticated) {
      await refreshUserProfile();
    }
  }
}
