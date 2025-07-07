import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import '../providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isEditingName = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImage() async {
    // Show dialog to choose between camera and gallery
    final ImageSource? source = await showDialog<ImageSource>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Select Image Source'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.only(bottom: 16.0),
                child: Text(
                  'Supported formats: JPG, PNG, WebP\nMaximum size: 5MB',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Camera'),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Gallery'),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
            ],
          ),
        );
      },
    );

    if (source == null) return;

    // Check and request permissions
    final hasPermissions = await _checkPermissions(source);
    if (!hasPermissions) return;

    final picker = ImagePicker();

    try {
      final XFile? image = await picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
        preferredCameraDevice: CameraDevice.front,
        requestFullMetadata:
            false, // This might help with emulator compatibility
      );

      if (image != null) {
        // Debug information for camera photos
        print(
            'Image selected: ${image.name}, Path: ${image.path}, Source: $source');

        // Validate file size (5MB max)
        final fileSize = await image.length();
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes

        if (fileSize > maxSize) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Image size must be less than 5MB'),
                backgroundColor: Colors.orange,
              ),
            );
          }
          return;
        }

        // Validate file extension (skip for camera photos as they might not have proper extensions)
        final fileName = image.name.toLowerCase();
        final isFromCamera = source == ImageSource.camera;

        // Additional validation: check if the file path suggests it's an image
        final imagePath = image.path.toLowerCase();
        final hasImageExtension = imagePath.endsWith('.jpg') ||
            imagePath.endsWith('.jpeg') ||
            imagePath.endsWith('.png') ||
            imagePath.endsWith('.webp');

        if (!isFromCamera &&
            !hasImageExtension &&
            !fileName.endsWith('.jpg') &&
            !fileName.endsWith('.jpeg') &&
            !fileName.endsWith('.png') &&
            !fileName.endsWith('.webp') &&
            !fileName.contains(
                'image') && // Some systems use generic names like "image_picker_xxx"
            !imagePath.contains('image') &&
            fileName.isNotEmpty) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                    'Invalid file type: $fileName\nPlease select a valid image file (JPG, PNG, WebP)'),
                backgroundColor: Colors.orange,
                duration: const Duration(seconds: 4),
              ),
            );
          }
          return;
        }

        // For camera photos, always allow since they should be valid images
        if (isFromCamera) {
          print('Camera photo accepted: ${image.name}');
        }

        // Show loading indicator
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 16),
                  Text('Uploading image...'),
                ],
              ),
              duration: Duration(seconds: 10),
            ),
          );
        }

        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final success = await authProvider.uploadProfileImage(image.path);

        // Clear the loading snackbar
        if (mounted) {
          ScaffoldMessenger.of(context).clearSnackBars();

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(success
                  ? 'Profile image updated successfully!'
                  : authProvider.error ?? 'Failed to update profile image'),
              backgroundColor: success ? Colors.green : Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).clearSnackBars();

        String errorMessage = 'Error selecting image';
        if (e.toString().contains('camera_access_denied')) {
          errorMessage =
              'Camera access denied. Please enable camera permission in settings.';
        } else if (e.toString().contains('photo_access_denied')) {
          errorMessage =
              'Photo access denied. Please enable photo permission in settings.';
        } else if (e.toString().contains('cancelled')) {
          // Don't show error for user cancellation
          return;
        } else {
          errorMessage = 'Error selecting image: ${e.toString()}';
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            action: e.toString().contains('denied')
                ? SnackBarAction(
                    label: 'Settings',
                    textColor: Colors.white,
                    onPressed: () => openAppSettings(),
                  )
                : null,
          ),
        );
      }
    }
  }

  Future<void> _removeProfileImage() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Profile Image'),
        content:
            const Text('Are you sure you want to remove your profile image?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await authProvider.removeProfileImage();

              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success
                        ? 'Profile image removed successfully!'
                        : authProvider.error ??
                            'Failed to remove profile image'),
                    backgroundColor: success ? Colors.green : Colors.red,
                  ),
                );
              }
            },
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Future<void> _updateName() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success =
        await authProvider.updateUserName(_nameController.text.trim());

    if (mounted) {
      if (success) {
        setState(() {
          _isEditingName = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Name updated successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.error ?? 'Failed to update name'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // Check and request permissions
  Future<bool> _checkPermissions(ImageSource source) async {
    try {
      if (source == ImageSource.camera) {
        final status = await Permission.camera.request();
        print('Camera permission status: $status');

        if (status != PermissionStatus.granted) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                    'Camera permission is required to take photos. Status: $status'),
                backgroundColor: Colors.orange,
                action: SnackBarAction(
                  label: 'Settings',
                  textColor: Colors.white,
                  onPressed: () => openAppSettings(),
                ),
              ),
            );
          }
          return false;
        }
      } else {
        // For gallery access, try photos permission first (iOS/Android 13+)
        PermissionStatus status = await Permission.photos.request();
        print('Photos permission status: $status');

        // If photos permission is not available, try storage permission (older Android)
        if (status == PermissionStatus.denied ||
            status == PermissionStatus.permanentlyDenied) {
          status = await Permission.storage.request();
          print('Storage permission status: $status');
        }

        if (status != PermissionStatus.granted) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                    'Storage permission is required to access photos. Status: $status'),
                backgroundColor: Colors.orange,
                action: SnackBarAction(
                  label: 'Settings',
                  textColor: Colors.white,
                  onPressed: () => openAppSettings(),
                ),
              ),
            );
          }
          return false;
        }
      }
      return true;
    } catch (e) {
      print('Permission error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Permission error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.user;

          if (user == null) {
            return const Center(
              child: Text('No user data available'),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile Header with Image
                Center(
                  child: Column(
                    children: [
                      Stack(
                        children: [
                          CircleAvatar(
                            radius: 60,
                            backgroundColor: Colors.blue[100],
                            backgroundImage: user.currentProfileImageUrl != null
                                ? NetworkImage(user.currentProfileImageUrl!)
                                : null,
                            child: user.currentProfileImageUrl == null
                                ? Text(
                                    user.name.isNotEmpty
                                        ? user.name
                                            .substring(0, 1)
                                            .toUpperCase()
                                        : 'S',
                                    style: const TextStyle(
                                      fontSize: 36,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue,
                                    ),
                                  )
                                : null,
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: PopupMenuButton<String>(
                              onSelected: (value) {
                                if (value == 'upload') {
                                  _pickAndUploadImage();
                                } else if (value == 'remove') {
                                  _removeProfileImage();
                                }
                              },
                              itemBuilder: (context) => [
                                const PopupMenuItem(
                                  value: 'upload',
                                  child: Row(
                                    children: [
                                      Icon(Icons.add_a_photo),
                                      SizedBox(width: 8),
                                      Text('Change Photo'),
                                    ],
                                  ),
                                ),
                                if (user.currentProfileImageUrl != null &&
                                    !user.isGoogleUser)
                                  const PopupMenuItem(
                                    value: 'remove',
                                    child: Row(
                                      children: [
                                        Icon(Icons.delete, color: Colors.red),
                                        SizedBox(width: 8),
                                        Text('Remove Photo',
                                            style:
                                                TextStyle(color: Colors.red)),
                                      ],
                                    ),
                                  ),
                              ],
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: const BoxDecoration(
                                  color: Colors.blue,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.camera_alt,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Name Section (Editable)
                      if (_isEditingName)
                        Form(
                          key: _formKey,
                          child: Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _nameController,
                                  decoration: const InputDecoration(
                                    labelText: 'Full Name',
                                    border: OutlineInputBorder(),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Name cannot be empty';
                                    }
                                    if (value.trim().length < 2) {
                                      return 'Name must be at least 2 characters';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                onPressed:
                                    authProvider.isLoading ? null : _updateName,
                                icon: authProvider.isLoading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2),
                                      )
                                    : const Icon(Icons.check,
                                        color: Colors.green),
                              ),
                              IconButton(
                                onPressed: () {
                                  setState(() {
                                    _isEditingName = false;
                                    _nameController.clear();
                                  });
                                },
                                icon:
                                    const Icon(Icons.cancel, color: Colors.red),
                              ),
                            ],
                          ),
                        )
                      else
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              user.name,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                setState(() {
                                  _isEditingName = true;
                                  _nameController.text = user.name;
                                });
                              },
                              icon: const Icon(Icons.edit, size: 20),
                            ),
                          ],
                        ),

                      const SizedBox(height: 8),
                      Text(
                        user.email,
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Profile Information Cards
                _buildInfoCard(
                  'Account Type',
                  'Student Account',
                  Icons.school,
                  Colors.blue,
                ),

                const SizedBox(height: 16),

                _buildInfoCard(
                  'Login Method',
                  user.isGoogleUser ? 'Google Sign-In' : 'Email & Password',
                  user.isGoogleUser ? Icons.account_circle : Icons.email,
                  user.isGoogleUser ? Colors.red : Colors.orange,
                ),

                const SizedBox(height: 16),

                Card(
                  color: user.isEmailVerified
                      ? Colors.green[50]
                      : Colors.orange[50],
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Icon(
                          user.isEmailVerified
                              ? Icons.check_circle
                              : Icons.warning,
                          color: user.isEmailVerified
                              ? Colors.green
                              : Colors.orange,
                          size: 32,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user.isEmailVerified
                                    ? 'Account Verified'
                                    : 'Email Verification Required',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: user.isEmailVerified
                                      ? Colors.green[700]
                                      : Colors.orange[700],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                user.isEmailVerified
                                    ? 'Your account is fully verified and active.'
                                    : 'Please check your email and verify your account.',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: user.isEmailVerified
                                      ? Colors.green[600]
                                      : Colors.orange[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Refresh Profile Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: authProvider.isLoading
                        ? null
                        : () async {
                            await authProvider.refreshUserProfile();
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content:
                                      Text('Profile refreshed successfully!'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                            }
                          },
                    icon: authProvider.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Icon(Icons.refresh, color: Colors.white),
                    label: const Text('Refresh Profile',
                        style: TextStyle(color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoCard(
      String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
