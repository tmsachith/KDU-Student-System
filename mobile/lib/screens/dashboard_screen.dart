import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/todo_provider.dart';
import '../providers/event_provider.dart';
import '../models/todo.dart';
import '../models/event.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';
import 'event_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with WidgetsBindingObserver {
  bool _hasInitialized = false;
  DateTime? _lastRefreshTime;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Load initial data only once
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_hasInitialized) {
        _loadInitialData();
      }
    });
  }

  Future<void> _loadInitialData() async {
    if (_hasInitialized) return;

    _hasInitialized = true;
    await _loadRecentTodos();
    await _loadRecentEvents();
    _lastRefreshTime = DateTime.now();
  }

  Future<void> _loadRecentTodos() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final todoProvider = Provider.of<TodoProvider>(context, listen: false);

    if (authProvider.token != null) {
      await todoProvider.loadTodos(authProvider.token!);
    }
  }

  Future<void> _loadRecentEvents() async {
    final eventProvider = Provider.of<EventProvider>(context, listen: false);
    // Load recent approved events
    await eventProvider.fetchEvents(
      refresh: true,
      category: null,
      eventType: null,
      search: null,
      upcoming: true,
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    // Only refresh if app was in background for more than 5 minutes
    if (state == AppLifecycleState.resumed) {
      final now = DateTime.now();
      if (_lastRefreshTime == null ||
          now.difference(_lastRefreshTime!).inMinutes > 5) {
        _refreshUserData();
        _lastRefreshTime = now;
      }
    }
  }

  Future<void> _refreshUserData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.refreshUserProfile();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer3<AuthProvider, TodoProvider, EventProvider>(
      builder: (context, authProvider, todoProvider, eventProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('KDU Student Portal'),
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
          ),
          drawer: _buildDrawer(context, authProvider),
          body: RefreshIndicator(
            onRefresh: () async {
              _lastRefreshTime = DateTime.now();
              await _refreshUserData();
              await _loadRecentTodos();
              await _loadRecentEvents();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Recent Todos Section
                  _buildRecentTodosSection(context, todoProvider),

                  const SizedBox(height: 24),

                  // Recent Events Section
                  _buildRecentEventsSection(context, eventProvider),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildRecentTodosSection(
      BuildContext context, TodoProvider todoProvider) {
    final recentTodos = todoProvider.todos.take(3).toList();

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Tasks',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/todos');
                  },
                  child: const Text('Show More'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (todoProvider.isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20.0),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (recentTodos.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    Icon(
                      Icons.task_alt,
                      size: 48,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No tasks yet',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Create your first task to get started',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              )
            else
              Column(
                children:
                    recentTodos.map((todo) => _buildTodoItem(todo)).toList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTodoItem(Todo todo) {
    final isOverdue = !todo.completed && todo.dueDate.isBefore(DateTime.now());
    final isDueToday = _isDueToday(todo.dueDate);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Icon(
            todo.completed ? Icons.check_circle : Icons.radio_button_unchecked,
            color: todo.completed
                ? Colors.green
                : (isOverdue ? Colors.red : Colors.grey),
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  todo.title,
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    decoration:
                        todo.completed ? TextDecoration.lineThrough : null,
                    color: todo.completed ? Colors.grey : null,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  _formatDate(todo.dueDate),
                  style: TextStyle(
                    fontSize: 12,
                    color: isOverdue
                        ? Colors.red
                        : (isDueToday ? Colors.orange : Colors.grey[600]),
                    fontWeight: isOverdue || isDueToday
                        ? FontWeight.bold
                        : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
          if (isOverdue)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'OVERDUE',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          else if (isDueToday)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.orange,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'TODAY',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool _isDueToday(DateTime dueDate) {
    final today = DateTime.now();
    return dueDate.year == today.year &&
        dueDate.month == today.month &&
        dueDate.day == today.day;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);

    if (dateOnly == today) {
      return 'Today';
    } else if (dateOnly == today.add(const Duration(days: 1))) {
      return 'Tomorrow';
    } else if (dateOnly == today.subtract(const Duration(days: 1))) {
      return 'Yesterday';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
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

  void _showLogoutDialog(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Logout'),
          content: const Text('Are you sure you want to logout?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                authProvider.logout();
                Navigator.of(context).pushReplacementNamed('/login');
              },
              child: const Text('Logout', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDrawer(BuildContext context, AuthProvider authProvider) {
    final user = authProvider.user;

    return Drawer(
      child: Column(
        children: [
          // Drawer Header
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              color: Colors.blue,
            ),
            accountName: Text(
              user?.name ?? 'Student',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            accountEmail: Text(
              user?.email ?? '',
              style: const TextStyle(fontSize: 14),
            ),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              backgroundImage: user?.currentProfileImageUrl != null
                  ? NetworkImage(user!.currentProfileImageUrl!)
                  : null,
              child: user?.currentProfileImageUrl == null
                  ? Text(
                      (user?.name != null && user!.name.isNotEmpty)
                          ? user.name.substring(0, 1).toUpperCase()
                          : 'S',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    )
                  : null,
            ),
          ),

          // Menu Items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ListTile(
                  leading: const Icon(Icons.dashboard, color: Colors.blue),
                  title: const Text('Dashboard'),
                  onTap: () {
                    Navigator.pop(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.person, color: Colors.green),
                  title: const Text('Profile'),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const ProfileScreen()),
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.task, color: Colors.orange),
                  title: const Text('My Tasks'),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/todos');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.settings, color: Colors.grey),
                  title: const Text('Settings'),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const SettingsScreen()),
                    );
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.info, color: Colors.blue),
                  title: const Text('About'),
                  onTap: () {
                    Navigator.pop(context);
                    _showAboutDialog(context);
                  },
                ),
              ],
            ),
          ),

          // Logout Button at Bottom
          Container(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _showLogoutDialog(context, authProvider);
                },
                icon: const Icon(Icons.logout, color: Colors.white),
                label:
                    const Text('Logout', style: TextStyle(color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentEventsSection(
      BuildContext context, EventProvider eventProvider) {
    // Get recent upcoming events (limit to 5 for performance)
    final recentEvents = eventProvider.events
        .where((event) => event.isUpcoming || event.isOngoing)
        .take(5)
        .toList();

    return Card(
      elevation: 0,
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Events',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/events');
                  },
                  child: const Text('View All'),
                ),
              ],
            ),
          ),
          if (eventProvider.isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(20.0),
                child: CircularProgressIndicator(),
              ),
            )
          else if (recentEvents.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20.0),
              child: Column(
                children: [
                  Icon(
                    Icons.event,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'No upcoming events',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Check back later for new events',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
            )
          else
            SizedBox(
              height: 220, // Fixed height for the horizontal scroll
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                itemCount: recentEvents.length,
                itemBuilder: (context, index) {
                  final event = recentEvents[index];
                  return Container(
                    width: 280, // Fixed width for each event card
                    margin: EdgeInsets.only(
                      right: index < recentEvents.length - 1 ? 12 : 0,
                    ),
                    child: _buildHorizontalEventCard(context, event),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHorizontalEventCard(BuildContext context, Event event) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => EventDetailScreen(event: event),
            ),
          );
        },
        borderRadius: BorderRadius.circular(15),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: Stack(
            children: [
              // Event Image
              Container(
                width: double.infinity,
                height: double.infinity,
                child: event.imageUrl != null && event.imageUrl!.isNotEmpty
                    ? Image.network(
                        event.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return _buildHorizontalPlaceholderImage();
                        },
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return _buildHorizontalPlaceholderImage();
                        },
                      )
                    : _buildHorizontalPlaceholderImage(),
              ),

              // Gradient overlay
              Container(
                width: double.infinity,
                height: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.4),
                      Colors.black.withOpacity(0.1),
                      Colors.black.withOpacity(0.6),
                      Colors.black.withOpacity(0.85),
                    ],
                    stops: const [0.0, 0.3, 0.7, 1.0],
                  ),
                ),
              ),

              // Status chip
              Positioned(
                top: 8,
                right: 8,
                child: _buildHorizontalStatusChip(event),
              ),

              // Club logo
              if (event.clubLogoUrl != null && event.clubLogoUrl!.isNotEmpty)
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: Image.network(
                        event.clubLogoUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.blue,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.group,
                                color: Colors.white,
                                size: 16,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),

              // Event title and date
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          shadows: [
                            Shadow(
                              offset: Offset(0, 2),
                              blurRadius: 6,
                              color: Colors.black87,
                            ),
                            Shadow(
                              offset: Offset(0, 1),
                              blurRadius: 3,
                              color: Colors.black54,
                            ),
                          ],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.access_time,
                            size: 12,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              _formatCompactDateTime(event.startDateTime),
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                                shadows: [
                                  Shadow(
                                    offset: Offset(0, 2),
                                    blurRadius: 6,
                                    color: Colors.black87,
                                  ),
                                  Shadow(
                                    offset: Offset(0, 1),
                                    blurRadius: 3,
                                    color: Colors.black54,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHorizontalPlaceholderImage() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(15),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event,
              size: 32,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 4),
            Text(
              'Event Image',
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHorizontalStatusChip(Event event) {
    Color color;
    String text;

    if (event.isOngoing) {
      color = Colors.green;
      text = 'Ongoing';
    } else if (event.isUpcoming) {
      color = Colors.blue;
      text = 'Upcoming';
    } else {
      color = Colors.grey;
      text = 'Past';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatCompactDateTime(DateTime dateTime) {
    // Compact format: "Dec 15 at 2:30 PM"
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    final month = months[dateTime.month - 1];
    final day = dateTime.day;

    final hour = dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);

    return '$month $day at $displayHour:$minute $period';
  }
}
