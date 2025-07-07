import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'notification_settings_screen.dart';
import 'notification_debug_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Account Settings Section
          _buildSectionTitle('Account'),
          _buildSettingsTile(
            context,
            icon: Icons.person,
            title: 'Profile Settings',
            subtitle: 'Edit your profile information',
            onTap: () {
              // Navigate to profile settings
              Navigator.pushNamed(context, '/profile');
            },
          ),
          _buildSettingsTile(
            context,
            icon: Icons.security,
            title: 'Privacy & Security',
            subtitle: 'Manage your privacy settings',
            onTap: () {
              _showComingSoonDialog(context, 'Privacy & Security');
            },
          ),

          const SizedBox(height: 24),

          // Notification Settings Section
          _buildSectionTitle('Notifications'),
          _buildSettingsTile(
            context,
            icon: Icons.notifications,
            title: 'Notification Settings',
            subtitle: 'Manage your notification preferences',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const NotificationSettingsScreen(),
                ),
              );
            },
          ),
          if (kDebugMode)
            _buildSettingsTile(
              context,
              icon: Icons.bug_report,
              title: 'Notification Debug',
              subtitle: 'Debug notification system',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const NotificationDebugScreen(),
                  ),
                );
              },
            ),

          const SizedBox(height: 24),

          // App Settings Section
          _buildSectionTitle('App Settings'),
          _buildSettingsTile(
            context,
            icon: Icons.palette,
            title: 'Theme',
            subtitle: 'Choose your app theme',
            onTap: () {
              _showComingSoonDialog(context, 'Theme Settings');
            },
          ),
          _buildSettingsTile(
            context,
            icon: Icons.language,
            title: 'Language',
            subtitle: 'Change app language',
            onTap: () {
              _showComingSoonDialog(context, 'Language Settings');
            },
          ),
          _buildSettingsTile(
            context,
            icon: Icons.storage,
            title: 'Storage',
            subtitle: 'Manage app storage and cache',
            onTap: () {
              _showComingSoonDialog(context, 'Storage Settings');
            },
          ),

          const SizedBox(height: 24),

          // Tasks Settings Section
          _buildSectionTitle('Tasks'),
          _buildSettingsTile(
            context,
            icon: Icons.task_alt,
            title: 'Task Preferences',
            subtitle: 'Configure default task settings',
            onTap: () {
              _showComingSoonDialog(context, 'Task Preferences');
            },
          ),
          _buildSettingsTile(
            context,
            icon: Icons.access_time,
            title: 'Reminder Settings',
            subtitle: 'Set default reminder times',
            onTap: () {
              _showComingSoonDialog(context, 'Reminder Settings');
            },
          ),

          const SizedBox(height: 24),

          // Events Settings Section
          _buildSectionTitle('Events'),
          _buildSettingsTile(
            context,
            icon: Icons.event,
            title: 'Event Preferences',
            subtitle: 'Configure event display options',
            onTap: () {
              _showComingSoonDialog(context, 'Event Preferences');
            },
          ),
          _buildSettingsTile(
            context,
            icon: Icons.filter_list,
            title: 'Event Filters',
            subtitle: 'Set default event filters',
            onTap: () {
              _showComingSoonDialog(context, 'Event Filters');
            },
          ),

          const SizedBox(height: 24),

          // Support Section
          _buildSectionTitle('Support'),
          _buildSettingsTile(
            context,
            icon: Icons.help,
            title: 'Help & Support',
            subtitle: 'Get help and contact support',
            onTap: () {
              _showComingSoonDialog(context, 'Help & Support');
            },
          ),
          _buildSettingsTile(
            context,
            icon: Icons.feedback,
            title: 'Send Feedback',
            subtitle: 'Share your thoughts with us',
            onTap: () {
              _showComingSoonDialog(context, 'Send Feedback');
            },
          ),
          _buildSettingsTile(
            context,
            icon: Icons.info,
            title: 'About',
            subtitle: 'App version and information',
            onTap: () {
              _showAboutDialog(context);
            },
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
      ),
    );
  }

  Widget _buildSettingsTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(
          icon,
          color: Colors.blue,
          size: 24,
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 16,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 14,
          ),
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios,
          size: 16,
          color: Colors.grey,
        ),
        onTap: onTap,
      ),
    );
  }

  void _showComingSoonDialog(BuildContext context, String feature) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(feature),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.construction,
              size: 48,
              color: Colors.orange[400],
            ),
            const SizedBox(height: 16),
            const Text(
              'Coming Soon!',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'This feature is currently under development and will be available in a future update.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About KDU Student Portal'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('KDU Student Management System'),
            SizedBox(height: 8),
            Text('Version: 1.0.0'),
            SizedBox(height: 8),
            Text(
                'A comprehensive platform for students to manage their academic tasks and activities.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
