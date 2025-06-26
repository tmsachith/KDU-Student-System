import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/todo.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  static final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static bool _isInitialized = false;
  static Function(String?)? _onNotificationTapped;

  // Initialize the notification service
  static Future<void> initialize(
      {Function(String?)? onNotificationTapped}) async {
    if (_isInitialized) return;

    _onNotificationTapped = onNotificationTapped;

    // Initialize timezone data
    tz.initializeTimeZones();

    // Android initialization settings
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS initialization settings
    const DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );

    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsDarwin,
    );

    await _notificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationResponse,
    );

    _isInitialized = true;
  }

  // Handle notification tap
  static void _onNotificationResponse(NotificationResponse response) {
    if (_onNotificationTapped != null) {
      _onNotificationTapped!(response.payload);
    }
  }

  // Request notification permissions
  static Future<bool> requestPermissions() async {
    if (Platform.isAndroid) {
      final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
          _notificationsPlugin.resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();

      if (androidImplementation != null) {
        await androidImplementation.requestNotificationsPermission();
        await androidImplementation.requestExactAlarmsPermission();
      }

      // Request permission handler permissions for Android 13+
      final status = await Permission.notification.request();
      return status.isGranted;
    } else if (Platform.isIOS) {
      final bool? result = await _notificationsPlugin
          .resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin>()
          ?.requestPermissions(
            alert: true,
            badge: true,
            sound: true,
          );
      return result ?? false;
    }
    return true;
  }

  // Check if notifications are enabled
  static Future<bool> areNotificationsEnabled() async {
    if (Platform.isAndroid) {
      final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
          _notificationsPlugin.resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();

      if (androidImplementation != null) {
        final bool? enabled =
            await androidImplementation.areNotificationsEnabled();
        return enabled ?? false;
      }
    }
    return await Permission.notification.isGranted;
  }

  // Schedule a notification for a todo reminder
  static Future<void> scheduleTodoReminder(Todo todo,
      {Duration? customReminder}) async {
    if (!_isInitialized) {
      await initialize();
    }

    final bool hasPermission = await areNotificationsEnabled();
    if (!hasPermission) {
      return;
    }

    // Calculate notification time
    DateTime notificationTime;

    if (customReminder != null) {
      notificationTime = todo.dueDate.subtract(customReminder);
    } else {
      // Default: notify 1 hour before due date, or immediately if due date is within 1 hour
      notificationTime = todo.dueDate.subtract(const Duration(hours: 1));
      if (notificationTime.isBefore(DateTime.now())) {
        notificationTime = DateTime.now().add(const Duration(minutes: 1));
      }
    }

    // Don't schedule if the notification time is in the past
    if (notificationTime.isBefore(DateTime.now())) {
      return;
    }

    final tz.TZDateTime tzNotificationTime = tz.TZDateTime.from(
      notificationTime,
      tz.local,
    );

    // Create notification details
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'todo_reminders',
      'Todo Reminders',
      channelDescription: 'Notifications for todo task reminders',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      playSound: true,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFF2196F3),
      styleInformation: BigTextStyleInformation(''),
    );

    const DarwinNotificationDetails iOSPlatformChannelSpecifics =
        DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );

    // Determine notification message based on due date
    final now = DateTime.now();
    final timeUntilDue = todo.dueDate.difference(now);
    String notificationBody;

    if (timeUntilDue.inHours <= 1) {
      notificationBody = 'Due in ${timeUntilDue.inMinutes} minutes!';
    } else if (timeUntilDue.inHours <= 24) {
      notificationBody = 'Due in ${timeUntilDue.inHours} hours!';
    } else {
      notificationBody = 'Due on ${_formatDueDate(todo.dueDate)}';
    }

    // Schedule the notification
    await _notificationsPlugin.zonedSchedule(
      todo.id?.hashCode ?? DateTime.now().millisecondsSinceEpoch,
      '📝 Task Reminder: ${todo.title}',
      notificationBody,
      tzNotificationTime,
      platformChannelSpecifics,
      payload: jsonEncode({
        'type': 'todo_reminder',
        'todoId': todo.id,
        'todoTitle': todo.title,
      }),
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
    );

    // Store scheduled notification for tracking
    await _storeScheduledNotification(todo);
  }

  // Schedule multiple reminders for a todo (e.g., 1 day, 1 hour, 15 minutes before)
  static Future<void> scheduleMultipleTodoReminders(Todo todo) async {
    final now = DateTime.now();
    final timeUntilDue = todo.dueDate.difference(now);

    // Only schedule if the task is not completed and due date is in the future
    if (todo.completed || todo.dueDate.isBefore(now)) {
      return;
    }

    // Schedule reminders based on how far out the due date is
    if (timeUntilDue.inDays >= 1) {
      // 1 day before
      await scheduleTodoReminder(todo, customReminder: const Duration(days: 1));
    }

    if (timeUntilDue.inHours >= 2) {
      // 1 hour before
      await scheduleTodoReminder(todo,
          customReminder: const Duration(hours: 1));
    }

    if (timeUntilDue.inMinutes >= 30) {
      // 15 minutes before
      await scheduleTodoReminder(todo,
          customReminder: const Duration(minutes: 15));
    }
  }

  // Cancel all notifications for a specific todo
  static Future<void> cancelTodoNotifications(String todoId) async {
    final notifications = await getScheduledNotifications();

    for (final notification in notifications) {
      if (notification.payload != null) {
        try {
          final payloadData = jsonDecode(notification.payload!);
          if (payloadData['todoId'] == todoId) {
            await _notificationsPlugin.cancel(notification.id);
          }
        } catch (e) {
          // Handle JSON decode error
        }
      }
    }

    await _removeScheduledNotification(todoId);
  }

  // Get all scheduled notifications
  static Future<List<PendingNotificationRequest>>
      getScheduledNotifications() async {
    return await _notificationsPlugin.pendingNotificationRequests();
  }

  // Schedule daily summary notification
  static Future<void> scheduleDailySummary() async {
    if (!_isInitialized) {
      await initialize();
    }
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'daily_summary',
      'Daily Summary',
      channelDescription: 'Daily summary of tasks',
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      showWhen: true,
    );

    const DarwinNotificationDetails iOSPlatformChannelSpecifics =
        DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );

    // Schedule for 9 AM every day
    final now = DateTime.now();
    var scheduledTime = DateTime(now.year, now.month, now.day, 9, 0);

    if (scheduledTime.isBefore(now)) {
      scheduledTime = scheduledTime.add(const Duration(days: 1));
    }

    final tz.TZDateTime tzScheduledTime = tz.TZDateTime.from(
      scheduledTime,
      tz.local,
    );

    try {
      await _notificationsPlugin.zonedSchedule(
        999999, // Unique ID for daily summary
        '📅 Daily Task Summary',
        'Check your tasks for today',
        tzScheduledTime,
        platformChannelSpecifics,
        payload: jsonEncode({
          'type': 'daily_summary',
        }),
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: DateTimeComponents.time,
      );
    } catch (e) {
      print('Failed to schedule daily summary notification: $e');
      // If exact alarms are not permitted, daily summary will be disabled
      // but other notification features will still work
    }
  }

  // Show immediate notification for overdue tasks
  static Future<void> showOverdueTaskNotification(
      List<Todo> overdueTasks) async {
    if (overdueTasks.isEmpty) return;

    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'overdue_tasks',
      'Overdue Tasks',
      channelDescription: 'Notifications for overdue tasks',
      importance: Importance.high,
      priority: Priority.high,
      color: Color(0xFFFF5722),
      enableVibration: true,
      playSound: true,
    );

    const DarwinNotificationDetails iOSPlatformChannelSpecifics =
        DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );

    final String title = overdueTasks.length == 1
        ? '⚠️ Overdue Task'
        : '⚠️ ${overdueTasks.length} Overdue Tasks';

    final String body = overdueTasks.length == 1
        ? overdueTasks.first.title
        : 'You have ${overdueTasks.length} overdue tasks';

    await _notificationsPlugin.show(
      888888, // Unique ID for overdue notifications
      title,
      body,
      platformChannelSpecifics,
      payload: jsonEncode({
        'type': 'overdue_tasks',
        'count': overdueTasks.length,
      }),
    );
  }

  // Cancel all notifications
  static Future<void> cancelAllNotifications() async {
    await _notificationsPlugin.cancelAll();
    await _clearAllScheduledNotifications();
  }

  // Helper methods for storing notification data
  static Future<void> _storeScheduledNotification(Todo todo) async {
    final prefs = await SharedPreferences.getInstance();
    final scheduledNotifications =
        prefs.getStringList('scheduled_notifications') ?? [];

    final notificationData = jsonEncode({
      'todoId': todo.id,
      'todoTitle': todo.title,
      'dueDate': todo.dueDate.toIso8601String(),
      'scheduledAt': DateTime.now().toIso8601String(),
    });

    scheduledNotifications.add(notificationData);
    await prefs.setStringList(
        'scheduled_notifications', scheduledNotifications);
  }

  static Future<void> _removeScheduledNotification(String todoId) async {
    final prefs = await SharedPreferences.getInstance();
    final scheduledNotifications =
        prefs.getStringList('scheduled_notifications') ?? [];

    scheduledNotifications.removeWhere((notificationString) {
      try {
        final data = jsonDecode(notificationString);
        return data['todoId'] == todoId;
      } catch (e) {
        return false;
      }
    });

    await prefs.setStringList(
        'scheduled_notifications', scheduledNotifications);
  }

  static Future<void> _clearAllScheduledNotifications() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('scheduled_notifications');
  }

  // Helper method to format due date
  static String _formatDueDate(DateTime dueDate) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(dueDate.year, dueDate.month, dueDate.day);

    if (dateOnly == today) {
      return 'today at ${_formatTime(dueDate)}';
    } else if (dateOnly == today.add(const Duration(days: 1))) {
      return 'tomorrow at ${_formatTime(dueDate)}';
    } else {
      return '${dueDate.day}/${dueDate.month}/${dueDate.year} at ${_formatTime(dueDate)}';
    }
  }

  static String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return '$displayHour:$minute $period';
  }

  // Check and handle app launch from notification
  static Future<void> checkLaunchNotification() async {
    final NotificationAppLaunchDetails? notificationAppLaunchDetails =
        await _notificationsPlugin.getNotificationAppLaunchDetails();

    if (notificationAppLaunchDetails?.didNotificationLaunchApp ?? false) {
      final String? payload =
          notificationAppLaunchDetails?.notificationResponse?.payload;
      if (payload != null && _onNotificationTapped != null) {
        _onNotificationTapped!(payload);
      }
    }
  }
}
