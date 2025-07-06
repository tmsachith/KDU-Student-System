import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/todo.dart';
import '../services/notification_service.dart';

class NotificationManager {
  static final NotificationManager _instance = NotificationManager._internal();
  factory NotificationManager() => _instance;
  NotificationManager._internal();

  static bool _isInitialized = false;
  static Function(String)? _onNavigateToTodo;

  // Initialize notification manager
  static Future<void> initialize({Function(String)? onNavigateToTodo}) async {
    if (_isInitialized) return;

    _onNavigateToTodo = onNavigateToTodo;

    // Initialize notification service with callback
    await NotificationService.initialize(
      onNotificationTapped: _handleNotificationTap,
    );

    // Check if app was launched from notification
    await NotificationService.checkLaunchNotification();

    // Schedule daily summary if enabled
    await _scheduleDailySummaryIfEnabled();

    _isInitialized = true;
  }

  // Handle notification tap
  static void _handleNotificationTap(String? payload) {
    if (payload == null) return;

    try {
      final data = jsonDecode(payload);
      final type = data['type'] as String?;

      switch (type) {
        case 'todo_reminder':
          final todoId = data['todoId'] as String?;
          if (todoId != null && _onNavigateToTodo != null) {
            _onNavigateToTodo!(todoId);
          }
          break;
        case 'daily_summary':
          // Navigate to todo list
          if (_onNavigateToTodo != null) {
            _onNavigateToTodo!('todo_list');
          }
          break;
        case 'overdue_tasks':
          // Navigate to overdue tasks
          if (_onNavigateToTodo != null) {
            _onNavigateToTodo!('overdue_tasks');
          }
          break;
      }
    } catch (e) {
      debugPrint('Error parsing notification payload: $e');
    }
  }

  // Setup notifications for a new todo
  static Future<void> setupTodoNotifications(Todo todo) async {
    if (!_isInitialized) {
      await initialize();
    }

    // Don't schedule notifications for completed todos or past due dates
    if (todo.completed || todo.dueDate.isBefore(DateTime.now())) {
      return;
    }

    // Check if notifications are enabled for this user
    final notificationsEnabled =
        await getNotificationPreference('todo_reminders');
    if (!notificationsEnabled) return;

    // Get user's custom reminder times
    final reminderTimes = await getReminderTimes();
    final now = DateTime.now();
    final timeUntilDue = todo.dueDate.difference(now);

    print('Setting up notifications for todo: ${todo.title}');
    print('Time until due: ${timeUntilDue.inMinutes} minutes');
    print(
        'User reminder preferences: ${reminderTimes.map((r) => r.inMinutes).toList()} minutes');

    // Schedule notifications based on user's preferences
    for (final reminderTime in reminderTimes) {
      // Only schedule if there's enough time before the due date
      if (timeUntilDue.inMinutes >= reminderTime.inMinutes) {
        print(
            'Scheduling reminder ${reminderTime.inMinutes} minutes before due date');
        await NotificationService.scheduleTodoReminder(
          todo,
          customReminder: reminderTime,
        );
      } else {
        print(
            'Skipping ${reminderTime.inMinutes}-minute reminder - not enough time');
      }
    }

    // If no reminders could be scheduled from preferences, try a short-notice reminder
    final scheduledAny = reminderTimes.any(
        (reminderTime) => timeUntilDue.inMinutes >= reminderTime.inMinutes);

    if (!scheduledAny && timeUntilDue.inMinutes >= 1) {
      print(
          'No custom reminders could be scheduled, setting 1-minute reminder');
      await NotificationService.scheduleTodoReminder(
        todo,
        customReminder: const Duration(minutes: 1),
      );
    }
  }

  // Update notifications when todo is modified
  static Future<void> updateTodoNotifications(
      Todo oldTodo, Todo newTodo) async {
    // Cancel old notifications
    if (oldTodo.id != null) {
      await NotificationService.cancelTodoNotifications(oldTodo.id!);
    }

    // Setup new notifications if todo is not completed
    if (!newTodo.completed) {
      await setupTodoNotifications(newTodo);
    }
  }

  // Remove notifications when todo is deleted or completed
  static Future<void> removeTodoNotifications(String todoId) async {
    await NotificationService.cancelTodoNotifications(todoId);
  }

  // Check for overdue todos and show notification
  static Future<void> checkAndNotifyOverdueTodos(List<Todo> todos) async {
    final now = DateTime.now();
    final overdueTodos = todos
        .where((todo) => !todo.completed && todo.dueDate.isBefore(now))
        .toList();

    if (overdueTodos.isNotEmpty) {
      final lastOverdueCheck = await getLastOverdueCheckTime();
      final timeSinceLastCheck = now.difference(lastOverdueCheck);

      // Only show overdue notification once every 4 hours
      if (timeSinceLastCheck.inHours >= 4) {
        await NotificationService.showOverdueTaskNotification(overdueTodos);
        await setLastOverdueCheckTime(now);
      }
    }
  }

  // Setup notifications for all todos
  static Future<void> setupAllTodoNotifications(List<Todo> todos) async {
    // Cancel all existing todo notifications first
    await cancelAllTodoNotifications();

    // Setup notifications for each todo
    for (final todo in todos) {
      await setupTodoNotifications(todo);
    }
  }

  // Cancel all todo notifications
  static Future<void> cancelAllTodoNotifications() async {
    final notifications = await NotificationService.getScheduledNotifications();

    for (final notification in notifications) {
      if (notification.payload != null) {
        try {
          final payloadData = jsonDecode(notification.payload!);
          if (payloadData['type'] == 'todo_reminder') {
            await NotificationService.cancelTodoNotifications(
                payloadData['todoId']);
          }
        } catch (e) {
          // Handle JSON decode error
        }
      }
    }
  }

  // Request notification permissions
  static Future<bool> requestNotificationPermissions() async {
    return await NotificationService.requestPermissions();
  }

  // Check if notifications are enabled
  static Future<bool> areNotificationsEnabled() async {
    return await NotificationService.areNotificationsEnabled();
  }

  // Notification preferences management
  static Future<void> setNotificationPreference(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notification_$key', value);

    // If disabling notifications, cancel relevant notifications
    if (!value) {
      switch (key) {
        case 'todo_reminders':
          await cancelAllTodoNotifications();
          break;
        case 'daily_summary':
          await NotificationService.cancelAllNotifications();
          break;
      }
    } else {
      // If enabling, reschedule notifications
      switch (key) {
        case 'daily_summary':
          await NotificationService.scheduleDailySummary();
          break;
      }
    }
  }

  static Future<bool> getNotificationPreference(String key) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('notification_$key') ?? true; // Default to enabled
  }

  // Set notification reminder times preference
  static Future<void> setReminderTimes(List<Duration> reminderTimes) async {
    final prefs = await SharedPreferences.getInstance();
    final reminderStrings =
        reminderTimes.map((d) => d.inMinutes.toString()).toList();
    await prefs.setStringList('reminder_times', reminderStrings);
  }

  static Future<List<Duration>> getReminderTimes() async {
    final prefs = await SharedPreferences.getInstance();
    final reminderStrings = prefs.getStringList('reminder_times') ??
        ['60', '15']; // Default: 1 hour and 15 minutes
    return reminderStrings.map((s) => Duration(minutes: int.parse(s))).toList();
  }

  // Track last overdue check time
  static Future<void> setLastOverdueCheckTime(DateTime time) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('last_overdue_check', time.toIso8601String());
  }

  static Future<DateTime> getLastOverdueCheckTime() async {
    final prefs = await SharedPreferences.getInstance();
    final timeString = prefs.getString('last_overdue_check');
    if (timeString != null) {
      try {
        return DateTime.parse(timeString);
      } catch (e) {
        return DateTime.now().subtract(const Duration(days: 1));
      }
    }
    return DateTime.now().subtract(const Duration(days: 1));
  }

  // Schedule daily summary if enabled
  static Future<void> _scheduleDailySummaryIfEnabled() async {
    final enabled = await getNotificationPreference('daily_summary');
    if (enabled) {
      await NotificationService.scheduleDailySummary();
    }
  }

  // Get notification statistics
  static Future<Map<String, dynamic>> getNotificationStats() async {
    final scheduled = await NotificationService.getScheduledNotifications();
    final todoReminders = scheduled.where((n) {
      if (n.payload != null) {
        try {
          final data = jsonDecode(n.payload!);
          return data['type'] == 'todo_reminder';
        } catch (e) {
          return false;
        }
      }
      return false;
    }).length;

    return {
      'totalScheduled': scheduled.length,
      'todoReminders': todoReminders,
      'notificationsEnabled': await areNotificationsEnabled(),
    };
  }

  // Show immediate notification for testing
  static Future<void> showTestNotification() async {
    await NotificationService.showOverdueTaskNotification([
      Todo(
        id: 'test',
        title: 'Test Notification',
        description: 'This is a test notification',
        dueDate: DateTime.now(),
        userId: 'test_user',
      ),
    ]);
  }
}
