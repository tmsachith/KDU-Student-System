import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../providers/todo_provider.dart';
import '../providers/auth_provider.dart';
import '../models/todo.dart';
import 'add_todo_screen.dart';
import 'edit_todo_screen.dart';

class TodoListScreen extends StatefulWidget {
  const TodoListScreen({super.key});

  @override
  State<TodoListScreen> createState() => _TodoListScreenState();
}

class _TodoListScreenState extends State<TodoListScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadTodos();

    // Add listener for real-time search
    _searchController.addListener(() {
      // Immediate update for better responsiveness
      if (mounted) {
        setState(() {
          _searchQuery = _searchController.text;
        });
      }

      // Cancel previous timer if active
      if (_debounceTimer?.isActive ?? false) _debounceTimer?.cancel();

      // Optional: Add debounce for expensive operations if needed
      _debounceTimer = Timer(const Duration(milliseconds: 200), () {
        // Additional processing can go here if needed
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _loadTodos() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final todoProvider = Provider.of<TodoProvider>(context, listen: false);

    if (authProvider.token != null) {
      todoProvider.loadTodos(authProvider.token!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<TodoProvider, AuthProvider>(
      builder: (context, todoProvider, authProvider, child) {
        return GestureDetector(
          // Allow keyboard focus for desktop/web
          onTap: () => FocusScope.of(context).unfocus(),
          child: Scaffold(
            appBar: AppBar(
              title: _isSearching
                  ? TextField(
                      controller: _searchController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Search tasks...',
                        hintStyle: const TextStyle(color: Colors.white70),
                        border: InputBorder.none,
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear,
                                    color: Colors.white),
                                onPressed: () {
                                  _searchController.clear();
                                  if (mounted) {
                                    setState(() {
                                      _searchQuery = '';
                                    });
                                  }
                                },
                              )
                            : null,
                      ),
                      autofocus: true,
                    )
                  : const Text('My Tasks'),
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              bottom: TabBar(
                controller: _tabController,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white70,
                indicatorColor: Colors.white,
                tabs: const [
                  Tab(text: 'All'),
                  Tab(text: 'Pending'),
                  Tab(text: 'Completed'),
                ],
              ),
              actions: [
                IconButton(
                  icon: Icon(_isSearching ? Icons.close : Icons.search),
                  onPressed: () {
                    if (mounted) {
                      setState(() {
                        _isSearching = !_isSearching;
                        if (!_isSearching) {
                          _searchController.clear();
                          _searchQuery = '';
                        }
                      });
                    }
                  },
                ),
              ],
            ),
            body: Column(
              children: [
                // Search status indicator
                if (_isSearching && _searchQuery.isEmpty)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    color: Colors.blue[50],
                    child: Row(
                      children: [
                        Icon(Icons.search, color: Colors.blue[700], size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Start typing to search tasks...',
                            style: TextStyle(
                              color: Colors.blue[700],
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Search results indicator
                if (_searchQuery.isNotEmpty)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    color: Colors.blue[50],
                    child: Row(
                      children: [
                        Icon(Icons.search, color: Colors.blue[700], size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Searching for: "$_searchQuery"',
                            style: TextStyle(
                              color: Colors.blue[700],
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                        Text(
                          '${_getFilteredTodos(_getAllTodos(todoProvider)).length} found',
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Content
                Expanded(
                  child: todoProvider.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : todoProvider.error != null
                          ? _buildErrorWidget(todoProvider.error!)
                          : RefreshIndicator(
                              onRefresh: () async => _loadTodos(),
                              child: TabBarView(
                                controller: _tabController,
                                children: [
                                  // All todos
                                  Builder(
                                    builder: (context) {
                                      final filteredTodos =
                                          _getFilteredTodos(todoProvider.todos);
                                      return _buildTodoList(filteredTodos);
                                    },
                                  ),
                                  // Pending todos
                                  Builder(
                                    builder: (context) {
                                      final filteredTodos = _getFilteredTodos(
                                          todoProvider.pendingTodos);
                                      return _buildTodoList(filteredTodos);
                                    },
                                  ),
                                  // Completed todos
                                  Builder(
                                    builder: (context) {
                                      final filteredTodos = _getFilteredTodos(
                                          todoProvider.completedTodos);
                                      return _buildTodoList(filteredTodos);
                                    },
                                  ),
                                ],
                              ),
                            ),
                ),
              ],
            ),
            floatingActionButton: FloatingActionButton(
              onPressed: () => _navigateToAddTodo(),
              backgroundColor: Colors.blue,
              child: const Icon(Icons.add, color: Colors.white),
            ),
          ),
        );
      },
    );
  }

  List<Todo> _getFilteredTodos(List<Todo> todos) {
    if (_searchQuery.isEmpty) {
      return todos;
    }

    final query = _searchQuery.toLowerCase().trim();

    if (query.isEmpty) {
      return todos;
    }

    return todos.where((todo) {
      final titleMatch = todo.title.toLowerCase().contains(query);
      final descMatch = todo.description.toLowerCase().contains(query);
      return titleMatch || descMatch;
    }).toList();
  }

  List<Todo> _getAllTodos(TodoProvider todoProvider) {
    return todoProvider.todos;
  }

  Widget _buildHighlightedText(
    String text,
    String query, {
    bool isCompleted = false,
    bool isTitle = true,
  }) {
    final baseStyle = TextStyle(
      fontSize: isTitle ? 16 : 14,
      fontWeight: isTitle ? FontWeight.bold : FontWeight.normal,
      decoration:
          isCompleted ? TextDecoration.lineThrough : TextDecoration.none,
      color: isCompleted
          ? Colors.grey
          : (isTitle ? Colors.black : Colors.grey[700]),
    );

    if (query.isEmpty) {
      return Text(
        text,
        style: baseStyle,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      );
    }

    final List<TextSpan> spans = [];
    final lowerText = text.toLowerCase();
    final lowerQuery = query.toLowerCase();

    int currentIndex = 0;
    int startIndex = lowerText.indexOf(lowerQuery);

    while (startIndex != -1) {
      // Add text before the match
      if (startIndex > currentIndex) {
        spans.add(TextSpan(
          text: text.substring(currentIndex, startIndex),
          style: baseStyle,
        ));
      }

      // Add highlighted match
      spans.add(TextSpan(
        text: text.substring(startIndex, startIndex + query.length),
        style: baseStyle.copyWith(
          backgroundColor: isCompleted ? Colors.grey[300] : Colors.yellow,
          color: isCompleted ? Colors.grey[600] : Colors.black,
          fontWeight: FontWeight.bold,
        ),
      ));

      currentIndex = startIndex + query.length;
      startIndex = lowerText.indexOf(lowerQuery, currentIndex);
    }

    // Add remaining text
    if (currentIndex < text.length) {
      spans.add(TextSpan(
        text: text.substring(currentIndex),
        style: baseStyle,
      ));
    }

    return RichText(
      text: TextSpan(children: spans),
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
    );
  }

  Widget _buildTodoList(List<Todo> todos) {
    if (todos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _searchQuery.isNotEmpty ? Icons.search_off : Icons.task_alt,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              _searchQuery.isNotEmpty
                  ? 'No tasks found for "$_searchQuery"'
                  : 'No tasks yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty
                  ? 'Try searching with different keywords'
                  : 'Tap + to add your first task',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: todos.length,
      itemBuilder: (context, index) {
        final todo = todos[index];
        return _buildTodoCard(todo);
      },
    );
  }

  Widget _buildTodoCard(Todo todo) {
    final isOverdue = !todo.completed && todo.dueDate.isBefore(DateTime.now());
    final isDueToday = _isDueToday(todo.dueDate);

    return Dismissible(
      key: Key(todo.id!),
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        color: todo.completed ? Colors.orange : Colors.green,
        child: Icon(
          todo.completed ? Icons.undo : Icons.check,
          color: Colors.white,
          size: 32,
        ),
      ),
      secondaryBackground: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red,
        child: const Icon(
          Icons.delete,
          color: Colors.white,
          size: 32,
        ),
      ),
      onDismissed: (direction) {
        if (direction == DismissDirection.startToEnd) {
          _toggleTodoComplete(todo);
        } else {
          _deleteTodo(todo);
        }
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        elevation: 2,
        child: InkWell(
          onTap: () => _navigateToEditTodo(todo),
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Checkbox(
                      value: todo.completed,
                      onChanged: (_) => _toggleTodoComplete(todo),
                      activeColor: Colors.green,
                    ),
                    Expanded(
                      child: _buildHighlightedText(
                        todo.title,
                        _searchQuery.trim(),
                        isCompleted: todo.completed,
                        isTitle: true,
                      ),
                    ),
                    if (isOverdue)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'OVERDUE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      )
                    else if (isDueToday)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.orange,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'DUE TODAY',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                if (todo.description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _buildHighlightedText(
                    todo.description,
                    _searchQuery.trim(),
                    isCompleted: todo.completed,
                    isTitle: false,
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: isOverdue ? Colors.red : Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _formatDate(todo.dueDate),
                      style: TextStyle(
                        fontSize: 12,
                        color: isOverdue ? Colors.red : Colors.grey[600],
                        fontWeight:
                            isOverdue ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    const Spacer(),
                    if (todo.completed)
                      const Icon(
                        Icons.check_circle,
                        color: Colors.green,
                        size: 20,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorWidget(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.red,
          ),
          const SizedBox(height: 16),
          Text(
            'Something went wrong',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadTodos,
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  void _navigateToAddTodo() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const AddTodoScreen()),
    ).then((_) => _loadTodos());
  }

  void _navigateToEditTodo(Todo todo) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => EditTodoScreen(todo: todo)),
    ).then((_) => _loadTodos());
  }

  void _toggleTodoComplete(Todo todo) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final todoProvider = Provider.of<TodoProvider>(context, listen: false);

    if (authProvider.token != null && todo.id != null) {
      todoProvider.toggleTodoComplete(authProvider.token!, todo.id!);
    }
  }

  void _deleteTodo(Todo todo) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final todoProvider = Provider.of<TodoProvider>(context, listen: false);

    if (authProvider.token != null && todo.id != null) {
      todoProvider.deleteTodo(authProvider.token!, todo.id!);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${todo.title} deleted'),
          backgroundColor: Colors.red,
        ),
      );
    }
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

    // Format time
    final timeString =
        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';

    if (dateOnly == today) {
      return 'Today at $timeString';
    } else if (dateOnly == today.add(const Duration(days: 1))) {
      return 'Tomorrow at $timeString';
    } else if (dateOnly == today.subtract(const Duration(days: 1))) {
      return 'Yesterday at $timeString';
    } else {
      return '${date.day}/${date.month}/${date.year} at $timeString';
    }
  }
}
