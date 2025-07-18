import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/discussion_provider.dart';
import '../providers/auth_provider.dart';
import '../models/discussion.dart';

class CreateDiscussionScreen extends StatefulWidget {
  final Discussion? discussionToEdit;

  const CreateDiscussionScreen({super.key, this.discussionToEdit});

  @override
  State<CreateDiscussionScreen> createState() => _CreateDiscussionScreenState();
}

class _CreateDiscussionScreenState extends State<CreateDiscussionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _tagController = TextEditingController();

  DiscussionCategory _selectedCategory = DiscussionCategory.general;
  List<String> _tags = [];
  bool _isLoading = false;

  bool get isEditing => widget.discussionToEdit != null;

  @override
  void initState() {
    super.initState();
    if (isEditing) {
      _populateFieldsForEditing();
    }
  }

  void _populateFieldsForEditing() {
    final discussion = widget.discussionToEdit!;
    _titleController.text = discussion.title;
    _contentController.text = discussion.content;
    _selectedCategory =
        DiscussionCategoryExtension.fromString(discussion.category);
    _tags = List.from(discussion.tags);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _tagController.dispose();
    super.dispose();
  }

  Future<void> _submitDiscussion() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final discussionProvider =
          Provider.of<DiscussionProvider>(context, listen: false);

      if (authProvider.token == null) {
        throw Exception('Authentication required');
      }

      Discussion? result;

      if (isEditing) {
        result = await discussionProvider.updateDiscussion(
          id: widget.discussionToEdit!.id,
          title: _titleController.text.trim(),
          content: _contentController.text.trim(),
          category: _selectedCategory.value,
          tags: _tags,
          token: authProvider.token!,
        );
      } else {
        result = await discussionProvider.createDiscussion(
          title: _titleController.text.trim(),
          content: _contentController.text.trim(),
          category: _selectedCategory.value,
          tags: _tags,
          token: authProvider.token!,
        );
      }

      if (result != null && mounted) {
        Navigator.pop(context, result);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isEditing
                ? 'Discussion updated successfully!'
                : 'Discussion created successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _addTag() {
    final tag = _tagController.text.trim();
    if (tag.isNotEmpty && !_tags.contains(tag) && _tags.length < 5) {
      setState(() {
        _tags.add(tag);
        _tagController.clear();
      });
    }
  }

  void _removeTag(String tag) {
    setState(() {
      _tags.remove(tag);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Discussion' : 'Create Discussion'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            )
          else
            TextButton(
              onPressed: _submitDiscussion,
              child: Text(
                isEditing ? 'UPDATE' : 'POST',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title field
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Discussion Title',
                  hintText: 'Enter a clear, descriptive title',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.title),
                ),
                maxLength: 200,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a title';
                  }
                  if (value.trim().length < 10) {
                    return 'Title must be at least 10 characters long';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Category selection
              DropdownButtonFormField<DiscussionCategory>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.category),
                ),
                items: DiscussionCategory.values.map((category) {
                  return DropdownMenuItem(
                    value: category,
                    child: Text(category.displayName),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _selectedCategory = value;
                    });
                  }
                },
              ),
              const SizedBox(height: 16),

              // Content field
              TextFormField(
                controller: _contentController,
                decoration: const InputDecoration(
                  labelText: 'Discussion Content',
                  hintText:
                      'Share your thoughts, ask questions, or start a conversation...',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.edit),
                  alignLabelWithHint: true,
                ),
                maxLines: 8,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter content for your discussion';
                  }
                  if (value.trim().length < 20) {
                    return 'Content must be at least 20 characters long';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Tags section
              const Text(
                'Tags (Optional)',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _tagController,
                      decoration: const InputDecoration(
                        hintText: 'Add a tag (press Enter to add)',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.tag),
                      ),
                      onSubmitted: (_) => _addTag(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _tags.length < 5 ? _addTag : null,
                    child: const Text('Add'),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Tags display
              if (_tags.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: _tags.map((tag) {
                    return Chip(
                      label: Text(tag),
                      onDeleted: () => _removeTag(tag),
                      deleteIcon: const Icon(Icons.close, size: 18),
                      backgroundColor: Colors.blue.shade50,
                    );
                  }).toList(),
                ),

              if (_tags.length >= 5)
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    'Maximum 5 tags allowed',
                    style: TextStyle(
                      color: Colors.orange,
                      fontSize: 12,
                    ),
                  ),
                ),

              const SizedBox(height: 24),

              // Guidelines
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline,
                            color: Colors.blue.shade600, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Discussion Guidelines',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.blue.shade600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '• Be respectful and constructive\n'
                      '• Use clear, descriptive titles\n'
                      '• Choose appropriate categories\n'
                      '• Add relevant tags for better discoverability\n'
                      '• Avoid duplicate posts',
                      style: TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Submit button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitDiscussion,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          isEditing ? 'UPDATE DISCUSSION' : 'POST DISCUSSION',
                          style: const TextStyle(
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
}
