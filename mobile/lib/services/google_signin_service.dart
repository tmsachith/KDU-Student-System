import 'package:google_sign_in/google_sign_in.dart';
import '../models/user.dart';
import 'api_service.dart';

class GoogleSignInService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    // Web client ID for server-side verification (this should be your web client ID)
    serverClientId:
        '404431907599-utm0ntqiml6g9rf2plejhcmti596v69e.apps.googleusercontent.com',
    scopes: [
      'email',
      'profile',
    ],
    // Force account selection every time
    forceCodeForRefreshToken: true,
  );
  static Future<GoogleSignInAccount?> signInWithGoogle() async {
    try {
      // Check if Google Play services are available
      await _googleSignIn.signOut(); // Clear any previous session

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        print('Google Sign-In was cancelled by user');
        return null;
      }

      return googleUser;
    } catch (error) {
      print('Google Sign-In Error: $error');

      // More specific error handling
      if (error.toString().contains('SIGN_IN_CANCELLED')) {
        print('User cancelled the sign-in process');
      } else if (error.toString().contains('SIGN_IN_FAILED')) {
        print('Sign-in failed - check configuration');
      } else if (error.toString().contains('NETWORK_ERROR')) {
        print('Network error during sign-in');
      }

      return null;
    }
  }

  static Future<AuthResponse?> authenticateWithBackend(
      GoogleSignInAccount googleUser) async {
    try {
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // Send Google token to your backend for verification and user creation/login
      final response = await ApiService.googleLogin(
        googleAuth.idToken!,
        googleAuth.accessToken!,
        googleUser.email,
        googleUser.displayName ?? 'Student',
      );

      return response;
    } catch (error) {
      print('Backend Authentication Error: $error');
      throw Exception('Failed to authenticate with backend: $error');
    }
  }

  static Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
    } catch (error) {
      print('Google Sign-Out Error: $error');
    }
  }

  static Future<bool> isSignedIn() async {
    return await _googleSignIn.isSignedIn();
  }
}
