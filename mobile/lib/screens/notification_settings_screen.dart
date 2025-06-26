import 'package:flutter/material.dart';
import '../services/notification_manager.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends State<NotificationSettingsScreen> {
  bool _todoRemindersEnabled = true;
  bool _dailySummaryEnabled = true;
  bool _overdueNotificationsEnabled = true;
  bool _notificationsPermissionGranted = false;
  List<Duration> _reminderTimes = [
    const Duration(hours: 1),
    const Duration(minutes: 15)
  ];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final todoReminders =
          await NotificationManager.getNotificationPreference('todo_reminders');
      final dailySummary =
          await NotificationManager.getNotificationPreference('daily_summary');
      final overdueNotifications =
          await NotificationManager.getNotificationPreference(
              'overdue_notifications');
      final permissionGranted =
          await NotificationManager.areNotificationsEnabled();
      final reminderTimes = await NotificationManager.getReminderTimes();

      setState(() {
        _todoRemindersEnabled = todoReminders;
        _dailySummaryEnabled = dailySummary;
        _overdueNotificationsEnabled = overdueNotifications;
        _notificationsPermissionGranted = permissionGranted;
        _reminderTimes = reminderTimes;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _requestPermission() async {
    final granted = await NotificationManager.requestNotificationPermissions();
    setState(() {
      _notificationsPermissionGranted = granted;
    });

    if (granted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Notification permissions granted!'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Notification permissions denied. Please enable them in device settings.'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  Future<void> _testNotification() async {
    await NotificationManager.showTestNotification();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Test notification sent!'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  Future<void> _showReminderTimesDialog() async {
    final List<Duration> availableReminders = [
      const Duration(days: 1),
      const Duration(hours: 12),
      const Duration(hours: 6),
      const Duration(hours: 2),
      const Duration(hours: 1),
      const Duration(minutes: 30),
      const Duration(minutes: 15),
      const Duration(minutes: 5),
    ];

    List<Duration> selectedReminders = [..._reminderTimes];

    final result = await showDialog<List<Duration>>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Reminder Times'),
          content: SizedBox(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Select when you want to be reminded before task due dates:',
                  style: TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 16),
                ...availableReminders.map((duration) {
                  final isSelected = selectedReminders.contains(duration);
                  return CheckboxListTile(
                    title: Text(_formatDuration(duration)),
                    value: isSelected,
                    onChanged: (value) {
                      setDialogState(() {
                        if (value == true) {
                          selectedReminders.add(duration);
                        } else {
                          selectedReminders.remove(duration);
                        }
                        selectedReminders
                            .sort((a, b) => b.inMinutes.compareTo(a.inMinutes));
                      });
                    },
                  );
                }),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, selectedReminders),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );

    if (result != null) {
      setState(() {
        _reminderTimes = result;
      });
      await NotificationManager.setReminderTimes(result);
    }
  }

  String _formatDuration(Duration duration) {
    if (duration.inDays > 0) {
      return '${duration.inDays} day${duration.inDays > 1 ? 's' : ''} before';
    } else if (duration.inHours > 0) {
      return '${duration.inHours} hour${duration.inHours > 1 ? 's' : ''} before';
    } else {
      return '${duration.inMinutes} minute${duration.inMinutes > 1 ? 's' : ''} before';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Settings'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Permission status card
                Card(
                  color: _notificationsPermissionGranted
                      ? Colors.green[50]
                      : Colors.orange[50],
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              _notificationsPermissionGranted
                                  ? Icons.check_circle
                                  : Icons.warning,
                              color: _notificationsPermissionGranted
                                  ? Colors.green
                                  : Colors.orange,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Permission Status',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _notificationsPermissionGranted
                                    ? Colors.green[800]
                                    : Colors.orange[800],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _notificationsPermissionGranted
                              ? 'Notifications are enabled and working properly.'
                              : 'Notifications are disabled. Enable them to receive task reminders.',
                          style: TextStyle(
                            color: _notificationsPermissionGranted
                                ? Colors.green[700]
                                : Colors.orange[700],
                          ),
                        ),
                        if (!_notificationsPermissionGranted) ...[
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _requestPermission,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              foregroundColor: Colors.white,
                            ),
                            child: const Text('Enable Notifications'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Notification types
                const Text(
                  'Notification Types',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),

                // Todo reminders
                Card(
                  child: SwitchListTile(
                    title: const Text('Task Reminders'),
                    subtitle: const Text('Get notified before tasks are due'),
                    value: _todoRemindersEnabled &&
                        _notificationsPermissionGranted,
                    onChanged: _notificationsPermissionGranted
                        ? (value) async {
                            setState(() {
                              _todoRemindersEnabled = value;
                            });
                            await NotificationManager.setNotificationPreference(
                                'todo_reminders', value);
                          }
                        : null,
                    secondary: const Icon(Icons.alarm),
                  ),
                ),

                // Daily summary
                Card(
                  child: SwitchListTile(
                    title: const Text('Daily Summary'),
                    subtitle:
                        const Text('Daily overview of your tasks at 9:00 AM'),
                    value:
                        _dailySummaryEnabled && _notificationsPermissionGranted,
                    onChanged: _notificationsPermissionGranted
                        ? (value) async {
                            setState(() {
                              _dailySummaryEnabled = value;
                            });
                            await NotificationManager.setNotificationPreference(
                                'daily_summary', value);
                          }
                        : null,
                    secondary: const Icon(Icons.today),
                  ),
                ),

                // Overdue notifications
                Card(
                  child: SwitchListTile(
                    title: const Text('Overdue Task Alerts'),
                    subtitle: const Text('Get notified about overdue tasks'),
                    value: _overdueNotificationsEnabled &&
                        _notificationsPermissionGranted,
                    onChanged: _notificationsPermissionGranted
                        ? (value) async {
                            setState(() {
                              _overdueNotificationsEnabled = value;
                            });
                            await NotificationManager.setNotificationPreference(
                                'overdue_notifications', value);
                          }
                        : null,
                    secondary: const Icon(Icons.warning),
                  ),
                ),

                const SizedBox(height: 24),

                // Reminder times
                const Text(
                  'Reminder Settings',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),

                Card(
                  child: ListTile(
                    title: const Text('Reminder Times'),
                    subtitle: Text(
                      _reminderTimes.isNotEmpty
                          ? _reminderTimes.map(_formatDuration).join(', ')
                          : 'No reminders set',
                    ),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap:
                        _notificationsPermissionGranted && _todoRemindersEnabled
                            ? _showReminderTimesDialog
                            : null,
                    enabled: _notificationsPermissionGranted &&
                        _todoRemindersEnabled,
                  ),
                ),

                const SizedBox(height: 24),

                // Test notification
                Card(
                  child: ListTile(
                    title: const Text('Test Notification'),
                    subtitle: const Text(
                        'Send a test notification to verify it\'s working'),
                    trailing: const Icon(Icons.send),
                    onTap: _notificationsPermissionGranted
                        ? _testNotification
                        : null,
                    enabled: _notificationsPermissionGranted,
                  ),
                ),

                const SizedBox(height: 24),

                // Statistics
                FutureBuilder<Map<String, dynamic>>(
                  future: NotificationManager.getNotificationStats(),
                  builder: (context, snapshot) {
                    if (snapshot.hasData) {
                      final stats = snapshot.data!;
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Statistics',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                  'Scheduled notifications: ${stats['totalScheduled']}'),
                              Text('Todo reminders: ${stats['todoReminders']}'),
                              Text(
                                  'Notifications enabled: ${stats['notificationsEnabled'] ? 'Yes' : 'No'}'),
                            ],
                          ),
                        ),
                      );
                    }
                    return const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('Loading statistics...'),
                      ),
                    );
                  },
                ),
              ],
            ),
    );
  }
}
