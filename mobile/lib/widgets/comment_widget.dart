import 'package:flutter/material.dart';
import '../models/discussion.dart';

class CommentWidget extends StatelessWidget {
  final Comment comment;
  final String discussionId;
  final Function(String)? onLike;
  final Function(String)? onReply;
  final Function(String)? onReport;
  final bool isReply;

  const CommentWidget({
    super.key,
    required this.comment,
    required this.discussionId,
    this.onLike,
    this.onReply,
    this.onReport,
    this.isReply = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Comment header
          Row(
            children: [
              // Author avatar
              CircleAvatar(
                radius: 16,
                backgroundColor: Colors.blue,
                backgroundImage: comment.author.currentProfileImageUrl != null
                    ? NetworkImage(comment.author.currentProfileImageUrl!)
                    : null,
                child: comment.author.currentProfileImageUrl == null
                    ? Text(
                        comment.author.name.isNotEmpty
                            ? comment.author.name[0].toUpperCase()
                            : 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : null,
              ),

              const SizedBox(width: 12),

              // Author name and time
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      comment.author.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      _formatDate(comment.createdAt),
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              // More actions
              PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'report' && onReport != null) {
                    onReport!(comment.id);
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'report',
                    child: ListTile(
                      leading: Icon(Icons.flag, size: 16),
                      title: Text('Report', style: TextStyle(fontSize: 14)),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ],
                child:
                    const Icon(Icons.more_vert, size: 16, color: Colors.grey),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Comment content
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Text(
              comment.content,
              style: const TextStyle(
                fontSize: 14,
                height: 1.4,
              ),
            ),
          ),

          const SizedBox(height: 8),

          // Comment actions
          Row(
            children: [
              // Like button
              InkWell(
                onTap: () {
                  if (onLike != null) {
                    onLike!(comment.id);
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    children: [
                      Icon(
                        comment.isLikedByUser
                            ? Icons.favorite
                            : Icons.favorite_border,
                        size: 16,
                        color: comment.isLikedByUser
                            ? Colors.red
                            : Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${comment.likeCount}',
                        style: TextStyle(
                          fontSize: 12,
                          color: comment.isLikedByUser
                              ? Colors.red
                              : Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(width: 16),

              // Reply button (only for top-level comments)
              if (!isReply)
                InkWell(
                  onTap: () {
                    if (onReply != null) {
                      onReply!(comment.id);
                    }
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Row(
                      children: [
                        Icon(
                          Icons.reply,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Reply',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Edit timestamp if edited
              if (comment.updatedAt != comment.createdAt)
                Padding(
                  padding: const EdgeInsets.only(left: 16),
                  child: Text(
                    'Edited',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.grey[500],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
            ],
          ),

          // Replies (nested comments)
          if (comment.replies.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 32, top: 12),
              child: Column(
                children: comment.replies.map((reply) {
                  return CommentWidget(
                    comment: reply,
                    discussionId: discussionId,
                    onLike: onLike,
                    onReply: onReply,
                    onReport: onReport,
                    isReply: true, // Mark nested comments as replies
                  );
                }).toList(),
              ),
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
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes ago';
    } else {
      return 'Just now';
    }
  }
}
