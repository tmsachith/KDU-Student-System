import 'package:flutter/material.dart';
import '../models/discussion.dart';

class DiscussionActions extends StatelessWidget {
  final Discussion discussion;
  final VoidCallback? onLike;
  final VoidCallback? onReport;

  const DiscussionActions({
    super.key,
    required this.discussion,
    this.onLike,
    this.onReport,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          // Like button
          Expanded(
            child: InkWell(
              onTap: onLike,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      discussion.isLikedByUser
                          ? Icons.favorite
                          : Icons.favorite_border,
                      size: 20,
                      color: discussion.isLikedByUser
                          ? Colors.red
                          : Colors.grey[600],
                    ),
                    const SizedBox(width: 8),
                    Text(
                      discussion.isLikedByUser ? 'Liked' : 'Like',
                      style: TextStyle(
                        color: discussion.isLikedByUser
                            ? Colors.red
                            : Colors.grey[600],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '(${discussion.likeCount})',
                      style: TextStyle(
                        color: discussion.isLikedByUser
                            ? Colors.red
                            : Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Divider
          Container(
            height: 30,
            width: 1,
            color: Colors.grey.shade300,
          ),

          // Comment indicator
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.comment,
                    size: 20,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Comment',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '(${discussion.commentCount})',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Divider
          Container(
            height: 30,
            width: 1,
            color: Colors.grey.shade300,
          ),

          // Report button
          Expanded(
            child: InkWell(
              onTap: onReport,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.flag,
                      size: 20,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Report',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
