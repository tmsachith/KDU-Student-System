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

    // Set local timezone
    final String timeZoneName = await _getLocalTimeZone();
    tz.setLocalLocation(tz.getLocation(timeZoneName));

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

    // Create notification channels for Android
    if (Platform.isAndroid) {
      await _createNotificationChannels();
    }

    _isInitialized = true;
  }

  // Get local timezone
  static Future<String> _getLocalTimeZone() async {
    try {
      // Default to UTC if unable to determine
      return 'UTC';
    } catch (e) {
      return 'UTC';
    }
  }

  // Create notification channels for Android
  static Future<void> _createNotificationChannels() async {
    final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
        _notificationsPlugin.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    if (androidImplementation != null) {
      // Todo reminders channel
      const AndroidNotificationChannel todoRemindersChannel =
          AndroidNotificationChannel(
        'todo_reminders',
        'Todo Reminders',
        description: 'Notifications for todo task reminders',
        importance: Importance.high,
        enableVibration: true,
        playSound: true,
        enableLights: true,
      );

      // Overdue tasks channel
      const AndroidNotificationChannel overdueTasksChannel =
          AndroidNotificationChannel(
        'overdue_tasks',
        'Overdue Tasks',
        description: 'Notifications for overdue tasks',
        importance: Importance.high,
        enableVibration: true,
        playSound: true,
        enableLights: true,
      );

      // Daily summary channel
      const AndroidNotificationChannel dailySummaryChannel =
          AndroidNotificationChannel(
        'daily_summary',
        'Daily Summary',
        description: 'Daily summary of tasks',
        importance: Importance.defaultImportance,
        enableVibration: false,
        playSound: false,
      );

      await androidImplementation
          .createNotificationChannel(todoRemindersChannel);
      await androidImplementation
          .createNotificationChannel(overdueTasksChannel);
      await androidImplementation
          .createNotificationChannel(dailySummaryChannel);
    }
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
      print('Notifications not enabled, skipping reminder schedule');
      return;
    }

    // Calculate notification time
    DateTime notificationTime;
    final now = DateTime.now();

    if (customReminder != null) {
      notificationTime = todo.dueDate.subtract(customReminder);
    } else {
      // Default: notify 1 hour before due date
      notificationTime = todo.dueDate.subtract(const Duration(hours: 1));
    }

    // Don't schedule if the notification time is in the past
    if (notificationTime.isBefore(now)) {
      print('Notification time is in the past, skipping: $notificationTime');
      return;
    }

    // Generate unique ID for this notification
    final notificationId =
        '${todo.id}_${customReminder?.inMinutes ?? 60}'.hashCode;

    final tz.TZDateTime tzNotificationTime = tz.TZDateTime.from(
      notificationTime,
      tz.local,
    );

    print('Scheduling notification for todo: ${todo.title}');
    print('Notification time: $notificationTime');
    print('TZ Notification time: $tzNotificationTime');
    print('Notification ID: $notificationId');

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
    final timeUntilDue = todo.dueDate.difference(now);
    String notificationBody;

    if (timeUntilDue.inMinutes <= 60) {
      final minutes = timeUntilDue.inMinutes;
      notificationBody = minutes <= 0 ? 'Due now!' : 'Due in $minutes minutes!';
    } else if (timeUntilDue.inHours <= 24) {
      notificationBody = 'Due in ${timeUntilDue.inHours} hours!';
    } else {
      notificationBody = 'Due on ${_formatDueDate(todo.dueDate)}';
    }

    try {
      // Schedule the notification
      await _notificationsPlugin.zonedSchedule(
        notificationId,
        '📝 Task Reminder: ${todo.title}',
        notificationBody,
        tzNotificationTime,
        platformChannelSpecifics,
        payload: jsonEncode({
          'type': 'todo_reminder',
          'todoId': todo.id,
          'todoTitle': todo.title,
          'reminderMinutes': customReminder?.inMinutes ?? 60,
        }),
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      );

      print('Notification scheduled successfully with ID: $notificationId');

      // Store scheduled notification for tracking
      await _storeScheduledNotification(todo, customReminder);
    } catch (e) {
      print('Error scheduling notification: $e');

      // Fallback: try to schedule without exact timing
      try {
        await _notificationsPlugin.zonedSchedule(
          notificationId,
          '📝 Task Reminder: ${todo.title}',
          notificationBody,
          tzNotificationTime,
          platformChannelSpecifics,
          payload: jsonEncode({
            'type': 'todo_reminder',
            'todoId': todo.id,
            'todoTitle': todo.title,
            'reminderMinutes': customReminder?.inMinutes ?? 60,
          }),
          uiLocalNotificationDateInterpretation:
              UILocalNotificationDateInterpretation.absoluteTime,
          androidScheduleMode: AndroidScheduleMode.alarmClock,
        );

        print('Notification scheduled with fallback mode');
      } catch (e2) {
        print('Failed to schedule notification even with fallback: $e2');
      }
    }
  }

  // Schedule multiple reminders for a todo (e.g., 1 day, 1 hour, 15 minutes before)
  static Future<void> scheduleMultipleTodoReminders(Todo todo) async {
    final now = DateTime.now();
    final timeUntilDue = todo.dueDate.difference(now);

    // Only schedule if the task is not completed and due date is in the future
    if (todo.completed || todo.dueDate.isBefore(now)) {
      print('Skipping reminders for completed/past due todo: ${todo.title}');
      return;
    }

    print('Scheduling multiple reminders for todo: ${todo.title}');
    print('Time until due: ${timeUntilDue.inHours} hours');

    // Schedule reminders based on how far out the due date is
    final List<Duration> reminderTimes = [];

    if (timeUntilDue.inDays >= 1) {
      reminderTimes.add(const Duration(days: 1));
    }

    if (timeUntilDue.inHours >= 2) {
      reminderTimes.add(const Duration(hours: 1));
    }

    if (timeUntilDue.inMinutes >= 30) {
      reminderTimes.add(const Duration(minutes: 15));
    }

    // If no reminders can be scheduled, schedule one for 5 minutes before (if possible)
    if (reminderTimes.isEmpty && timeUntilDue.inMinutes >= 5) {
      reminderTimes.add(const Duration(minutes: 5));
    }

    print('Will schedule ${reminderTimes.length} reminders');

    for (final reminder in reminderTimes) {
      await scheduleTodoReminder(todo, customReminder: reminder);
    }
  }

  // Cancel all notifications for a specific todo
  static Future<void> cancelTodoNotifications(String todoId) async {
    print('Canceling notifications for todo: $todoId');

    final notifications = await getScheduledNotifications();
    int canceledCount = 0;

    for (final notification in notifications) {
      if (notification.payload != null) {
        try {
          final payloadData = jsonDecode(notification.payload!);
          if (payloadData['todoId'] == todoId) {
            await _notificationsPlugin.cancel(notification.id);
            canceledCount++;
            print('Canceled notification with ID: ${notification.id}');
          }
        } catch (e) {
          print('Error parsing notification payload: $e');
        }
      }
    }

    print('Canceled $canceledCount notifications for todo: $todoId');
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
  static Future<void> _storeScheduledNotification(
      Todo todo, Duration? customReminder) async {
    final prefs = await SharedPreferences.getInstance();
    final scheduledNotifications =
        prefs.getStringList('scheduled_notifications') ?? [];

    final notificationData = jsonEncode({
      'todoId': todo.id,
      'todoTitle': todo.title,
      'dueDate': todo.dueDate.toIso8601String(),
      'reminderMinutes': customReminder?.inMinutes ?? 60,
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
