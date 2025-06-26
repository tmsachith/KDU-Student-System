import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/todo.dart';
import 'api_service.dart';

class TodoService {
  static const String baseUrl = ApiService.baseUrl;
  // Get all todos for the current user
  static Future<List<Todo>> getTodos(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/todos'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> todosData = data['todos'] ?? [];
        return todosData.map((json) => Todo.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load todos: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching todos: $e');
    }
  }

  // Create a new todo
  static Future<Todo> createTodo(String token, Todo todo) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/todos'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(todo.toJson()),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Todo.fromJson(data['todo']);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to create todo');
      }
    } catch (e) {
      throw Exception('Error creating todo: $e');
    }
  }

  // Update an existing todo
  static Future<Todo> updateTodo(String token, String todoId, Todo todo) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/todos/$todoId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(todo.toJson()),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Todo.fromJson(data['todo']);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to update todo');
      }
    } catch (e) {
      throw Exception('Error updating todo: $e');
    }
  }

  // Toggle todo completion status
  static Future<Todo> toggleTodoComplete(String token, String todoId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/todos/$todoId/toggle'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Todo.fromJson(data['todo']);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to toggle todo');
      }
    } catch (e) {
      throw Exception('Error toggling todo: $e');
    }
  }

  // Delete a todo
  static Future<void> deleteTodo(String token, String todoId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/todos/$todoId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to delete todo');
      }
    } catch (e) {
      throw Exception('Error deleting todo: $e');
    }
  }

  // Get todo statistics
  static Future<Map<String, dynamic>> getTodoStats(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/todos/stats'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load todo stats: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching todo stats: $e');
    }
  }
}
