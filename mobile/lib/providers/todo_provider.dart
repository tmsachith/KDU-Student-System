import 'package:flutter/material.dart';
import '../models/todo.dart';
import '../services/todo_service.dart';
import '../services/notification_manager.dart';

class TodoProvider with ChangeNotifier {
  List<Todo> _todos = [];
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _stats;

  List<Todo> get todos => _todos;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get stats => _stats;

  // Get filtered todos
  List<Todo> get completedTodos =>
      _todos.where((todo) => todo.completed).toList();
  List<Todo> get pendingTodos =>
      _todos.where((todo) => !todo.completed).toList();
  List<Todo> get overdueTodos => _todos
      .where((todo) => !todo.completed && todo.dueDate.isBefore(DateTime.now()))
      .toList(); // Load all todos
  Future<void> loadTodos(String token) async {
    // Don't reload if already loading
    if (_isLoading) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _todos = await TodoService.getTodos(token);

      // Setup notifications for all todos and check for overdue tasks
      await NotificationManager.setupAllTodoNotifications(_todos);
      await NotificationManager.checkAndNotifyOverdueTodos(_todos);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Add a new todo
  Future<bool> addTodo(String token, Todo todo) async {
    _error = null;

    try {
      final newTodo = await TodoService.createTodo(token, todo);
      _todos.add(newTodo);

      // Setup notifications for the new todo
      await NotificationManager.setupTodoNotifications(newTodo);

      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Update a todo
  Future<bool> updateTodo(String token, String todoId, Todo updatedTodo) async {
    _error = null;

    try {
      final oldTodo = _todos.firstWhere((t) => t.id == todoId);
      final todo = await TodoService.updateTodo(token, todoId, updatedTodo);
      final index = _todos.indexWhere((t) => t.id == todoId);
      if (index != -1) {
        _todos[index] = todo;

        // Update notifications for the modified todo
        await NotificationManager.updateTodoNotifications(oldTodo, todo);

        notifyListeners();
      }
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Toggle todo completion
  Future<bool> toggleTodoComplete(String token, String todoId) async {
    _error = null;

    try {
      final todo = await TodoService.toggleTodoComplete(token, todoId);
      final index = _todos.indexWhere((t) => t.id == todoId);
      if (index != -1) {
        _todos[index] = todo;

        // Update notifications based on completion status
        if (todo.completed) {
          // Remove notifications for completed todo
          await NotificationManager.removeTodoNotifications(todoId);
        } else {
          // Setup notifications for uncompleted todo
          await NotificationManager.setupTodoNotifications(todo);
        }

        notifyListeners();
      }
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Delete a todo
  Future<bool> deleteTodo(String token, String todoId) async {
    _error = null;

    try {
      await TodoService.deleteTodo(token, todoId);
      _todos.removeWhere((todo) => todo.id == todoId);

      // Remove notifications for deleted todo
      await NotificationManager.removeTodoNotifications(todoId);

      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Load todo statistics
  Future<void> loadStats(String token) async {
    try {
      _stats = await TodoService.getTodoStats(token);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Search todos
  List<Todo> searchTodos(String query) {
    if (query.isEmpty) return _todos;

    return _todos
        .where((todo) =>
            todo.title.toLowerCase().contains(query.toLowerCase()) ||
            todo.description.toLowerCase().contains(query.toLowerCase()))
        .toList();
  }

  // Sort todos by due date
  List<Todo> get todosSortedByDueDate {
    final sortedTodos = [..._todos];
    sortedTodos.sort((a, b) => a.dueDate.compareTo(b.dueDate));
    return sortedTodos;
  }

  // Get todos for today
  List<Todo> get todosForToday {
    final today = DateTime.now();
    return _todos
        .where((todo) =>
            todo.dueDate.year == today.year &&
            todo.dueDate.month == today.month &&
            todo.dueDate.day == today.day)
        .toList();
  }
}
