import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/discussion_provider.dart';
import '../providers/auth_provider.dart';
import '../models/discussion.dart';
import '../widgets/comment_widget.dart';
import '../widgets/discussion_actions.dart';
import 'create_discussion_screen.dart';

class DiscussionDetailScreen extends StatefulWidget {
  final String discussionId;

  const DiscussionDetailScreen({super.key, required this.discussionId});

  @override
  State<DiscussionDetailScreen> createState() => _DiscussionDetailScreenState();
}

class _DiscussionDetailScreenState extends State<DiscussionDetailScreen> {
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isAddingComment = false;
  String? _replyingToCommentId;
  Comment? _replyingToComment;

  @override
  void initState() {
    super.initState();
    _loadDiscussion();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadDiscussion() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final discussionProvider =
        Provider.of<DiscussionProvider>(context, listen: false);

    await discussionProvider.loadDiscussion(
      widget.discussionId,
      token: authProvider.token,
    );
  }

  Future<void> _addComment() async {
    if (_commentController.text.trim().isEmpty) return;

    setState(() {
      _isAddingComment = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final discussionProvider =
          Provider.of<DiscussionProvider>(context, listen: false);

      await discussionProvider.addComment(
        discussionId: widget.discussionId,
        content: _commentController.text.trim(),
        parentComment: _replyingToCommentId,
        token: authProvider.token!,
      );

      _commentController.clear();
      _cancelReply();

      // Scroll to bottom to show new comment
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Comment added successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error adding comment: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isAddingComment = false;
      });
    }
  }

  void _startReply(String commentId) {
    final discussionProvider =
        Provider.of<DiscussionProvider>(context, listen: false);
    final currentDiscussion = discussionProvider.currentDiscussion;

    if (currentDiscussion != null) {
      final comment = _findCommentById(currentDiscussion.comments, commentId);
      if (comment != null) {
        setState(() {
          _replyingToCommentId = commentId;
          _replyingToComment = comment;
        });
        // Focus on the comment input
        FocusScope.of(context).requestFocus(FocusNode());
      }
    }
  }

  Comment? _findCommentById(List<Comment> comments, String commentId) {
    for (var comment in comments) {
      if (comment.id == commentId) {
        return comment;
      }
      // Check in replies recursively
      final foundInReplies = _findCommentById(comment.replies, commentId);
      if (foundInReplies != null) {
        return foundInReplies;
      }
    }
    return null;
  }

  void _cancelReply() {
    setState(() {
      _replyingToCommentId = null;
      _replyingToComment = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Discussion'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          Consumer<DiscussionProvider>(
            builder: (context, discussionProvider, child) {
              final discussion = discussionProvider.currentDiscussion;
              final authProvider =
                  Provider.of<AuthProvider>(context, listen: false);

              if (discussion != null &&
                  authProvider.user != null &&
                  discussion.author.id == authProvider.user!.id) {
                return PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'edit') {
                      _editDiscussion(discussion);
                    } else if (value == 'delete') {
                      _deleteDiscussion(discussion);
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'edit',
                      child: ListTile(
                        leading: Icon(Icons.edit),
                        title: Text('Edit'),
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: ListTile(
                        leading: Icon(Icons.delete, color: Colors.red),
                        title:
                            Text('Delete', style: TextStyle(color: Colors.red)),
                      ),
                    ),
                  ],
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<DiscussionProvider>(
        builder: (context, discussionProvider, child) {
          if (discussionProvider.isLoadingDiscussion) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (discussionProvider.discussionError.isNotEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading discussion',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    discussionProvider.discussionError,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadDiscussion,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final discussion = discussionProvider.currentDiscussion;
          if (discussion == null) {
            return const Center(
              child: Text('Discussion not found'),
            );
          }

          return Column(
            children: [
              // Discussion content
              Expanded(
                child: SingleChildScrollView(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Discussion header
                      _buildDiscussionHeader(discussion),
                      const SizedBox(height: 16),

                      // Status info for discussion author
                      Consumer<AuthProvider>(
                        builder: (context, authProvider, child) {
                          final isAuthor = authProvider.user?.id == discussion.author.id;
                          return _buildStatusInfo(discussion, isAuthor);
                        },
                      ),

                      // Discussion content
                      _buildDiscussionContent(discussion),
                      const SizedBox(height: 16),

                      // Discussion actions
                      DiscussionActions(
                        discussion: discussion,
                        onLike: () {
                          final authProvider =
                              Provider.of<AuthProvider>(context, listen: false);
                          if (authProvider.token != null) {
                            discussionProvider.toggleDiscussionLike(
                              discussion.id,
                              authProvider.token!,
                            );
                          }
                        },
                        onReport: () {
                          _showReportDialog(discussion);
                        },
                      ),
                      const SizedBox(height: 24),

                      // Comments section
                      _buildCommentsSection(discussion),
                    ],
                  ),
                ),
              ),

              // Comment input
              _buildCommentInput(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDiscussionHeader(Discussion discussion) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category and date
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                DiscussionCategoryExtension.fromString(discussion.category)
                    .displayName,
                style: TextStyle(
                  color: Colors.blue.shade800,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const Spacer(),
            Text(
              _formatDate(discussion.createdAt),
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Title
        Text(
          discussion.title,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),

        // Author info
        Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.blue,
              backgroundImage: discussion.author.currentProfileImageUrl != null
                  ? NetworkImage(discussion.author.currentProfileImageUrl!)
                  : null,
              child: discussion.author.currentProfileImageUrl == null
                  ? Text(
                      discussion.author.name.isNotEmpty
                          ? discussion.author.name[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  discussion.author.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '${discussion.viewCount} views',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDiscussionContent(Discussion discussion) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Content
        Text(
          discussion.content,
          style: const TextStyle(
            fontSize: 16,
            height: 1.6,
          ),
        ),
        const SizedBox(height: 16),

        // Tags
        if (discussion.tags.isNotEmpty)
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: discussion.tags.map((tag) {
              return Chip(
                label: Text(tag),
                backgroundColor: Colors.grey.shade100,
                labelStyle: TextStyle(
                  color: Colors.grey[700],
                  fontSize: 12,
                ),
              );
            }).toList(),
          ),
      ],
    );
  }

  Widget _buildCommentsSection(Discussion discussion) {
    final visibleComments =
        discussion.comments.where((comment) => !comment.isDeleted).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Comments (${visibleComments.length})',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        if (visibleComments.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            child: Column(
              children: [
                Icon(
                  Icons.comment_outlined,
                  size: 48,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 8),
                Text(
                  'No comments yet',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Be the first to comment!',
                  style: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: visibleComments.length,
            itemBuilder: (context, index) {
              final comment = visibleComments[index];
              return CommentWidget(
                comment: comment,
                discussionId: discussion.id,
                onLike: (commentId) {
                  final authProvider =
                      Provider.of<AuthProvider>(context, listen: false);
                  final discussionProvider =
                      Provider.of<DiscussionProvider>(context, listen: false);

                  if (authProvider.token != null) {
                    discussionProvider.toggleCommentLike(
                      discussionId: discussion.id,
                      commentId: commentId,
                      token: authProvider.token!,
                    );
                  }
                },
                onReply: (parentCommentId) {
                  _startReply(parentCommentId);
                },
                onReport: (commentId) {
                  final commentToReport =
                      _findCommentById(discussion.comments, commentId);
                  if (commentToReport != null) {
                    _showReportCommentDialog(discussion.id, commentToReport);
                  }
                },
              );
            },
          ),
      ],
    );
  }

  Widget _buildCommentInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.2),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Reply indicator
          if (_replyingToComment != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.reply,
                    size: 16,
                    color: Colors.blue.shade600,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Replying to ${_replyingToComment!.author.name}',
                      style: TextStyle(
                        color: Colors.blue.shade600,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: _cancelReply,
                    icon: Icon(
                      Icons.close,
                      size: 16,
                      color: Colors.blue.shade600,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 24,
                      minHeight: 24,
                    ),
                    padding: EdgeInsets.zero,
                  ),
                ],
              ),
            ),

          // Comment input
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _commentController,
                  maxLines: null,
                  decoration: InputDecoration(
                    hintText: _replyingToComment != null
                        ? 'Write a reply...'
                        : 'Add a comment...',
                    border: const OutlineInputBorder(),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _isAddingComment ? null : _addComment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isAddingComment
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(_replyingToComment != null ? 'Reply' : 'Post'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusInfo(Discussion discussion, bool isAuthor) {
    if (!isAuthor) return const SizedBox.shrink();

    Color statusColor;
    IconData statusIcon;
    String statusMessage;

    switch (discussion.status) {
      case 'pending':
        statusColor = Colors.amber;
        statusIcon = Icons.hourglass_empty;
        statusMessage = 'Your discussion is pending admin approval.';
        break;
      case 'approved':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusMessage = 'Your discussion has been approved and is now public.';
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
        statusMessage = 'Your discussion was rejected. ${discussion.rejectionReason ?? ''}';
        break;
      case 'needs_update':
        statusColor = Colors.orange;
        statusIcon = Icons.update;
        statusMessage = 'Your discussion needs updates based on admin feedback.';
        break;
      default:
        return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(statusIcon, color: statusColor, size: 20),
              const SizedBox(width: 8),
              Text(
                'Discussion Status',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: statusColor,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            statusMessage,
            style: TextStyle(
              color: statusColor.withOpacity(0.8),
              fontSize: 14,
            ),
          ),
          if (discussion.status == 'needs_update' && discussion.adminFeedback.isNotEmpty) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => _showFeedbackDialog(discussion),
              icon: const Icon(Icons.feedback, size: 16),
              label: const Text('View Admin Feedback'),
              style: ElevatedButton.styleFrom(
                backgroundColor: statusColor,
                foregroundColor: Colors.white,
              ),
            ),
          ],
          if (discussion.status == 'rejected' || discussion.status == 'needs_update') ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => _editDiscussion(discussion),
              icon: const Icon(Icons.edit, size: 16),
              label: const Text('Edit & Resubmit'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showFeedbackDialog(Discussion discussion) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Admin Feedback'),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'The admin has provided feedback on your discussion:',
                style: TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 16),
              Container(
                constraints: const BoxConstraints(maxHeight: 300),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: discussion.adminFeedback.length,
                  itemBuilder: (context, index) {
                    final feedback = discussion.adminFeedback[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                feedback.sentBy.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                _formatDate(feedback.sentAt),
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            feedback.message,
                            style: const TextStyle(fontSize: 14),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _editDiscussion(discussion);
            },
            child: const Text('Edit Discussion'),
          ),
        ],
      ),
    );
  }

  void _editDiscussion(Discussion discussion) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CreateDiscussionScreen(
          discussionToEdit: discussion,
        ),
      ),
    ).then((result) {
      if (result != null) {
        _loadDiscussion();
      }
    });
  }

  void _deleteDiscussion(Discussion discussion) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Discussion'),
        content: const Text(
            'Are you sure you want to delete this discussion? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);

              try {
                final authProvider =
                    Provider.of<AuthProvider>(context, listen: false);
                final discussionProvider =
                    Provider.of<DiscussionProvider>(context, listen: false);

                await discussionProvider.deleteDiscussion(
                  discussion.id,
                  authProvider.token!,
                );

                Navigator.pop(context);

                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Discussion deleted successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error deleting discussion: ${e.toString()}'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showReportDialog(Discussion discussion) {
    final TextEditingController reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report Discussion'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
                'Please provide a reason for reporting this discussion:'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Enter reason...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              if (reasonController.text.trim().isNotEmpty) {
                try {
                  final authProvider =
                      Provider.of<AuthProvider>(context, listen: false);
                  final discussionProvider =
                      Provider.of<DiscussionProvider>(context, listen: false);

                  await discussionProvider.reportDiscussion(
                    discussionId: discussion.id,
                    reason: reasonController.text.trim(),
                    token: authProvider.token!,
                  );

                  Navigator.pop(context);

                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Discussion reported successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content:
                          Text('Error reporting discussion: ${e.toString()}'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Report'),
          ),
        ],
      ),
    );
  }

  void _showReportCommentDialog(String discussionId, Comment comment) {
    final TextEditingController reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report Comment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Please provide a reason for reporting this comment:'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Enter reason...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              if (reasonController.text.trim().isNotEmpty) {
                try {
                  final authProvider =
                      Provider.of<AuthProvider>(context, listen: false);
                  final discussionProvider =
                      Provider.of<DiscussionProvider>(context, listen: false);

                  await discussionProvider.reportComment(
                    discussionId: discussionId,
                    commentId: comment.id,
                    reason: reasonController.text.trim(),
                    token: authProvider.token!,
                  );

                  Navigator.pop(context);

                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Comment reported successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error reporting comment: ${e.toString()}'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Report'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return '${date.day}/${date.month}/${date.year}';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
