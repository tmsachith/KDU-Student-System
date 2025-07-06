class Todo {
  final String? id;
  final String title;
  final String description;
  final DateTime dueDate;
  final bool completed;
  final String userId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Todo({
    this.id,
    required this.title,
    required this.description,
    required this.dueDate,
    this.completed = false,
    required this.userId,
    this.createdAt,
    this.updatedAt,
  });

  factory Todo.fromJson(Map<String, dynamic> json) {
    // Parse the date string and explicitly convert to local time
    final dueDateString = json['dueDate'];
    final dueDate = DateTime.parse(dueDateString);

    // Debug print to check parsing
    print('Parsing dueDate: $dueDateString');
    print('Parsed as: $dueDate');
    print('Is UTC: ${dueDate.isUtc}');
    print('Converting to local: ${dueDate.toLocal()}');

    return Todo(
      id: json['id'] ?? json['_id'],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      dueDate: dueDate.toLocal(),
      completed: json['completed'] ?? false,
      userId: json['userId'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt']).toLocal()
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt']).toLocal()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'title': title,
      'description': description,
      'dueDate': dueDate.toUtc().toIso8601String(),
      'completed': completed,
      'userId': userId,
      if (createdAt != null) 'createdAt': createdAt!.toUtc().toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toUtc().toIso8601String(),
    };
  }

  Todo copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? dueDate,
    bool? completed,
    String? userId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Todo(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      dueDate: dueDate ?? this.dueDate,
      completed: completed ?? this.completed,
      userId: userId ?? this.userId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'Todo(id: $id, title: $title, description: $description, dueDate: $dueDate, completed: $completed, userId: $userId)';
  }
}
