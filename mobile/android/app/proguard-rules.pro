# Flutter Local Notifications
-keep class com.dexterous.** { *; }
-keep class androidx.core.app.NotificationCompat { *; }
-keep class androidx.core.app.NotificationCompat$* { *; }

# Keep timezone data
-keep class com.android.icu.text.** { *; }
-keep class java.time.** { *; }

# Keep notification related classes
-keep class android.app.** { *; }
-keep class androidx.work.** { *; }
