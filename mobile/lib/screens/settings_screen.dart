import 'package:flutter/material.dart';

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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Coming Soon Section
            Center(
              child: Column(
                children: [
                  Icon(
                    Icons.settings,
                    size: 80,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Settings',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Coming Soon!',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'We\'re working on bringing you amazing settings and customization options.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 48),

            // Placeholder Settings Items
            const Text(
              'Future Settings',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            Card(
              child: Column(
                children: [
                  _buildSettingsItem(
                    Icons.notifications,
                    'Notifications',
                    'Push notifications for tasks and updates',
                    false,
                  ),
                  const Divider(height: 1),
                  _buildSettingsItem(
                    Icons.dark_mode,
                    'Dark Mode',
                    'Switch between light and dark themes',
                    false,
                  ),
                  const Divider(height: 1),
                  _buildSettingsItem(
                    Icons.language,
                    'Language',
                    'Choose your preferred language',
                    false,
                  ),
                  const Divider(height: 1),
                  _buildSettingsItem(
                    Icons.security,
                    'Privacy & Security',
                    'Manage your privacy settings',
                    false,
                  ),
                  const Divider(height: 1),
                  _buildSettingsItem(
                    Icons.sync,
                    'Sync Settings',
                    'Control data synchronization',
                    false,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // App Information
            const Text(
              'App Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            Card(
              child: Column(
                children: [
                  _buildInfoItem(
                    Icons.info,
                    'Version',
                    '1.0.0',
                  ),
                  const Divider(height: 1),
                  _buildInfoItem(
                    Icons.school,
                    'About',
                    'KDU Student Management System',
                  ),
                  const Divider(height: 1),
                  _buildInfoItem(
                    Icons.support,
                    'Support',
                    'support@kdu.ac.lk',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsItem(
      IconData icon, String title, String subtitle, bool enabled) {
    return ListTile(
      leading: Icon(
        icon,
        color: enabled ? Colors.blue : Colors.grey,
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.w500,
          color: enabled ? Colors.black : Colors.grey,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          fontSize: 12,
          color: enabled ? Colors.grey[600] : Colors.grey[400],
        ),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        size: 16,
        color: enabled ? Colors.grey : Colors.grey[300],
      ),
      onTap: enabled
          ? () {
              // TODO: Implement settings functionality
            }
          : null,
    );
  }

  Widget _buildInfoItem(IconData icon, String title, String value) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        value,
        style: TextStyle(
          fontSize: 12,
          color: Colors.grey[600],
        ),
      ),
    );
  }
}
