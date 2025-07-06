import 'package:flutter/material.dart';
import '../services/notification_manager.dart';
import '../services/notification_service.dart';
import '../models/todo.dart';

class NotificationDebugScreen extends StatefulWidget {
  const NotificationDebugScreen({super.key});

  @override
  State<NotificationDebugScreen> createState() =>
      _NotificationDebugScreenState();
}

class _NotificationDebugScreenState extends State<NotificationDebugScreen> {
  List<String> _debugLogs = [];
  Map<String, dynamic>? _notificationStats;

  @override
  void initState() {
    super.initState();
    _loadNotificationStats();
  }

  void _addLog(String message) {
    setState(() {
      _debugLogs.add('${DateTime.now().toIso8601String()}: $message');
    });
  }

  Future<void> _loadNotificationStats() async {
    try {
      final stats = await NotificationManager.getNotificationStats();
      final reminderTimes = await NotificationManager.getReminderTimes();

      setState(() {
        _notificationStats = stats;
        _notificationStats!['reminderTimes'] =
            reminderTimes.map((r) => '${r.inMinutes} min').join(', ');
      });

      _addLog('Notification stats loaded: $stats');
      _addLog(
          'User reminder times: ${reminderTimes.map((r) => r.inMinutes).toList()} minutes');
    } catch (e) {
      _addLog('Error loading notification stats: $e');
    }
  }

  Future<void> _requestPermissions() async {
    try {
      _addLog('Requesting notification permissions...');
      final granted =
          await NotificationManager.requestNotificationPermissions();
      _addLog('Notification permissions granted: $granted');

      final enabled = await NotificationManager.areNotificationsEnabled();
      _addLog('Notifications enabled: $enabled');

      await _loadNotificationStats();
    } catch (e) {
      _addLog('Error requesting permissions: $e');
    }
  }

  Future<void> _showTestNotification() async {
    try {
      _addLog('Showing test notification...');
      await NotificationManager.showTestNotification();
      _addLog('Test notification sent');
    } catch (e) {
      _addLog('Error showing test notification: $e');
    }
  }

  Future<void> _scheduleTestTodoNotification() async {
    try {
      _addLog('Scheduling test todo notification...');

      // Create a test todo with due date 2 minutes from now
      final testTodo = Todo(
        id: 'test_todo_${DateTime.now().millisecondsSinceEpoch}',
        title: 'Test Todo Notification',
        description: 'This is a test notification for debugging',
        dueDate: DateTime.now().add(const Duration(minutes: 2)),
        userId: 'debug_user',
        completed: false,
      );

      await NotificationManager.setupTodoNotifications(testTodo);
      _addLog('Test todo notification scheduled for: ${testTodo.dueDate}');

      await _loadNotificationStats();
    } catch (e) {
      _addLog('Error scheduling test todo notification: $e');
    }
  }

  Future<void> _checkScheduledNotifications() async {
    try {
      _addLog('Checking scheduled notifications...');
      final scheduled = await NotificationService.getScheduledNotifications();
      _addLog('Found ${scheduled.length} scheduled notifications');

      for (var notification in scheduled) {
        _addLog(
            'Notification ID: ${notification.id}, Title: ${notification.title}');
      }
    } catch (e) {
      _addLog('Error checking scheduled notifications: $e');
    }
  }

  Future<void> _cancelAllNotifications() async {
    try {
      _addLog('Canceling all notifications...');
      await NotificationService.cancelAllNotifications();
      _addLog('All notifications canceled');

      await _loadNotificationStats();
    } catch (e) {
      _addLog('Error canceling notifications: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Debug'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Stats section
          if (_notificationStats != null)
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Notification Stats',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Text(
                      'Total Scheduled: ${_notificationStats!['totalScheduled']}'),
                  Text(
                      'Todo Reminders: ${_notificationStats!['todoReminders']}'),
                  Text(
                      'Notifications Enabled: ${_notificationStats!['notificationsEnabled']}'),
                  if (_notificationStats!.containsKey('reminderTimes'))
                    Text(
                        'Reminder Times: ${_notificationStats!['reminderTimes']}'),
                ],
              ),
            ),

          // Control buttons
          Container(
            margin: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ElevatedButton(
                  onPressed: _requestPermissions,
                  child: const Text('Request Permissions'),
                ),
                ElevatedButton(
                  onPressed: _showTestNotification,
                  child: const Text('Test Notification'),
                ),
                ElevatedButton(
                  onPressed: _scheduleTestTodoNotification,
                  child: const Text('Schedule Test Todo'),
                ),
                ElevatedButton(
                  onPressed: _checkScheduledNotifications,
                  child: const Text('Check Scheduled'),
                ),
                ElevatedButton(
                  onPressed: _cancelAllNotifications,
                  child: const Text('Cancel All'),
                ),
                ElevatedButton(
                  onPressed: _loadNotificationStats,
                  child: const Text('Refresh Stats'),
                ),
              ],
            ),
          ),

          // Debug logs
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Debug Logs',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            _debugLogs.clear();
                          });
                        },
                        icon: const Icon(Icons.clear, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: _debugLogs
                            .map((log) => Padding(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 2),
                                  child: Text(
                                    log,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontFamily: 'monospace',
                                      fontSize: 12,
                                    ),
                                  ),
                                ))
                            .toList(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
