import 'package:flutter/material.dart';
import '../models/discussion.dart';

class DiscussionCard extends StatelessWidget {
  final Discussion discussion;
  final VoidCallback onTap;
  final VoidCallback? onLike;
  final VoidCallback? onReport;

  const DiscussionCard({
    super.key,
    required this.discussion,
    required this.onTap,
    this.onLike,
    this.onReport,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with category and actions
              Row(
                children: [
                  // Category chip
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getCategoryColor(discussion.category),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      DiscussionCategoryExtension.fromString(
                              discussion.category)
                          .displayName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),

                  // Pinned indicator
                  if (discussion.isPinned)
                    Container(
                      margin: const EdgeInsets.only(left: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.push_pin, size: 10, color: Colors.white),
                          SizedBox(width: 2),
                          Text(
                            'PINNED',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Locked indicator
                  if (discussion.isLocked)
                    Container(
                      margin: const EdgeInsets.only(left: 8),
                      child: const Icon(
                        Icons.lock,
                        size: 16,
                        color: Colors.grey,
                      ),
                    ),

                  const Spacer(),

                  // More actions
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      if (value == 'report' && onReport != null) {
                        onReport!();
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
                    child: const Icon(Icons.more_vert,
                        size: 16, color: Colors.grey),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Discussion title
              Text(
                discussion.title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              const SizedBox(height: 8),

              // Discussion content preview
              Text(
                discussion.content,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  height: 1.4,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),

              const SizedBox(height: 12),

              // Tags
              if (discussion.tags.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: discussion.tags.take(3).map((tag) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          tag,
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontSize: 10,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),

              // Footer with author info and stats
              Row(
                children: [
                  // Author avatar
                  CircleAvatar(
                    radius: 12,
                    backgroundColor: Colors.blue,
                    backgroundImage:
                        discussion.author.currentProfileImageUrl != null
                            ? NetworkImage(
                                discussion.author.currentProfileImageUrl!)
                            : null,
                    child: discussion.author.currentProfileImageUrl == null
                        ? Text(
                            discussion.author.name.isNotEmpty
                                ? discussion.author.name[0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),

                  const SizedBox(width: 8),

                  // Author name and time
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          discussion.author.name,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          _formatDate(discussion.createdAt),
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Stats
                  Row(
                    children: [
                      // View count
                      Icon(Icons.visibility, size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        '${discussion.viewCount}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),

                      const SizedBox(width: 12),

                      // Like button and count
                      InkWell(
                        onTap: onLike,
                        borderRadius: BorderRadius.circular(16),
                        child: Padding(
                          padding: const EdgeInsets.all(4),
                          child: Row(
                            children: [
                              Icon(
                                discussion.isLikedByUser
                                    ? Icons.favorite
                                    : Icons.favorite_border,
                                size: 14,
                                color: discussion.isLikedByUser
                                    ? Colors.red
                                    : Colors.grey[600],
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${discussion.likeCount}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: discussion.isLikedByUser
                                      ? Colors.red
                                      : Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(width: 12),

                      // Comment count
                      Icon(Icons.comment, size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        '${discussion.commentCount}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'general':
        return Colors.blue;
      case 'academic':
        return Colors.green;
      case 'events':
        return Colors.purple;
      case 'technical':
        return Colors.orange;
      case 'announcements':
        return Colors.red;
      case 'help':
        return Colors.teal;
      default:
        return Colors.grey;
    }
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
