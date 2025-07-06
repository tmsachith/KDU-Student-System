import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/todo_provider.dart';
import '../providers/auth_provider.dart';
import '../models/todo.dart';

class AddTodoScreen extends StatefulWidget {
  const AddTodoScreen({super.key});

  @override
  State<AddTodoScreen> createState() => _AddTodoScreenState();
}

class _AddTodoScreenState extends State<AddTodoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  late DateTime _selectedDate;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Initialize with today's date and current time + 1 hour
    final now = DateTime.now();
    _selectedDate = now.add(const Duration(hours: 1));
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add New Task'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveTodo,
            child: const Text(
              'SAVE',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title field
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Task Title *',
                  border: OutlineInputBorder(),
                  hintText: 'Enter task title',
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a task title';
                  }
                  if (value.trim().length > 100) {
                    return 'Title must be less than 100 characters';
                  }
                  return null;
                },
                textInputAction: TextInputAction.next,
              ),

              const SizedBox(height: 16),

              // Description field
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                  hintText: 'Enter task description (optional)',
                ),
                maxLines: 4,
                validator: (value) {
                  if (value != null && value.length > 500) {
                    return 'Description must be less than 500 characters';
                  }
                  return null;
                },
                textInputAction: TextInputAction.newline,
              ),

              const SizedBox(height: 16),

              // Due date field
              const Text(
                'Due Date *',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: _selectDate,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today, color: Colors.blue),
                      const SizedBox(width: 12),
                      Text(
                        _formatDate(_selectedDate),
                        style: const TextStyle(fontSize: 16),
                      ),
                      const Spacer(),
                      const Icon(Icons.arrow_drop_down, color: Colors.grey),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Time selection button
              InkWell(
                onTap: _selectTime,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.access_time, color: Colors.blue),
                      const SizedBox(width: 12),
                      Text(
                        'Time: ${_selectedDate.hour.toString().padLeft(2, '0')}:${_selectedDate.minute.toString().padLeft(2, '0')}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const Spacer(),
                      const Icon(Icons.arrow_drop_down, color: Colors.grey),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Quick date options
              const Text(
                'Quick Options',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  _buildQuickDateChip(
                      'Today', DateTime.now().add(const Duration(hours: 1))),
                  _buildQuickDateChip(
                      'Tomorrow',
                      DateTime.now().add(const Duration(days: 1)).copyWith(
                          hour: 9, minute: 0, second: 0, millisecond: 0)),
                  _buildQuickDateChip(
                      'Next Week',
                      DateTime.now().add(const Duration(days: 7)).copyWith(
                          hour: 9, minute: 0, second: 0, millisecond: 0)),
                  _buildQuickDateChip(
                      'Next Month',
                      DateTime.now().add(const Duration(days: 30)).copyWith(
                          hour: 9, minute: 0, second: 0, millisecond: 0)),
                ],
              ),

              const SizedBox(height: 32),

              // Save button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveTodo,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        )
                      : const Text(
                          'Create Task',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickDateChip(String label, DateTime date) {
    final isSelected = _isSameDay(_selectedDate, date);

    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedDate = date;
          });
        }
      },
      selectedColor: Colors.blue.withOpacity(0.3),
      checkmarkColor: Colors.blue,
    );
  }

  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
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

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate.isAfter(DateTime.now())
          ? _selectedDate
          : DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Colors.blue,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      // Always show time picker after date selection
      final TimeOfDay? timePicked = await showTimePicker(
        context: context,
        initialTime:
            TimeOfDay(hour: _selectedDate.hour, minute: _selectedDate.minute),
        builder: (context, child) {
          return Theme(
            data: Theme.of(context).copyWith(
              colorScheme: const ColorScheme.light(
                primary: Colors.blue,
                onPrimary: Colors.white,
                surface: Colors.white,
                onSurface: Colors.black,
              ),
            ),
            child: child!,
          );
        },
      );

      setState(() {
        if (timePicked != null) {
          // User selected both date and time
          _selectedDate = DateTime(
            picked.year,
            picked.month,
            picked.day,
            timePicked.hour,
            timePicked.minute,
            0, // seconds
            0, // milliseconds
          );
        } else {
          // User cancelled time picker, preserve existing time
          _selectedDate = DateTime(
            picked.year,
            picked.month,
            picked.day,
            _selectedDate.hour,
            _selectedDate.minute,
            0, // seconds
            0, // milliseconds
          );
        }

        // Debug print to check the selected date/time
        print('Selected date/time: $_selectedDate');
        print('Is Local: ${_selectedDate.isUtc ? "UTC" : "Local"}');
        print('Timezone offset: ${_selectedDate.timeZoneOffset}');
      });
    }
  }

  Future<void> _selectTime() async {
    final TimeOfDay? timePicked = await showTimePicker(
      context: context,
      initialTime:
          TimeOfDay(hour: _selectedDate.hour, minute: _selectedDate.minute),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Colors.blue,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (timePicked != null) {
      final newDateTime = DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        timePicked.hour,
        timePicked.minute,
        0, // seconds
        0, // milliseconds
      );

      setState(() {
        _selectedDate = newDateTime;

        // Debug print to check the selected time
        print('Selected time: ${timePicked.hour}:${timePicked.minute}');
        print('Final DateTime: $_selectedDate');
        print('Is Local: ${_selectedDate.isUtc ? "UTC" : "Local"}');
        print('Timezone offset: ${_selectedDate.timeZoneOffset}');
      });
    }
  }

  Future<void> _saveTodo() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final todoProvider = Provider.of<TodoProvider>(context, listen: false);
    if (authProvider.token == null || authProvider.user == null) {
      _showErrorDialog('Authentication error. Please log in again.');
      setState(() {
        _isLoading = false;
      });
      return;
    }

    final todo = Todo(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      dueDate: _selectedDate,
      userId: authProvider.user!.id,
    );

    // Debug print to check what's being saved
    print('Saving todo with dueDate: ${todo.dueDate}');
    print('Hour: ${todo.dueDate.hour}, Minute: ${todo.dueDate.minute}');
    print('Is UTC: ${todo.dueDate.isUtc}');
    print('Timezone offset: ${todo.dueDate.timeZoneOffset}');
    print('ISO String: ${todo.dueDate.toIso8601String()}');
    print('UTC ISO String: ${todo.dueDate.toUtc().toIso8601String()}');
    print('Local String: ${todo.dueDate.toLocal()}');

    final success = await todoProvider.addTodo(authProvider.token!, todo);

    setState(() {
      _isLoading = false;
    });

    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Task "${todo.title}" created successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } else {
      _showErrorDialog(todoProvider.error ?? 'Failed to create task');
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
