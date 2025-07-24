class Discussion {
  final String id;
  final String title;
  final String content;
  final User author;
  final String category;
  final List<String> tags;
  final List<DiscussionLike> likes;
  final List<Comment> comments;
  final int viewCount;
  final bool isReported;
  final List<Report> reportedBy;
  final bool isDeleted;
  final bool isPinned;
  final bool isLocked;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Admin approval fields
  final bool isApproved;
  final String? approvedBy;
  final DateTime? approvedAt;
  final String? rejectedBy;
  final DateTime? rejectedAt;
  final String? rejectionReason;
  final String status; // 'pending', 'approved', 'rejected', 'needs_update'
  final List<AdminFeedback> adminFeedback;

  // Computed properties
  final int likeCount;
  final int commentCount;
  final bool isLikedByUser;

  Discussion({
    required this.id,
    required this.title,
    required this.content,
    required this.author,
    required this.category,
    required this.tags,
    required this.likes,
    required this.comments,
    required this.viewCount,
    required this.isReported,
    required this.reportedBy,
    required this.isDeleted,
    required this.isPinned,
    required this.isLocked,
    required this.createdAt,
    required this.updatedAt,
    required this.isApproved,
    this.approvedBy,
    this.approvedAt,
    this.rejectedBy,
    this.rejectedAt,
    this.rejectionReason,
    required this.status,
    required this.adminFeedback,
    required this.likeCount,
    required this.commentCount,
    required this.isLikedByUser,
  });

  factory Discussion.fromJson(Map<String, dynamic> json) {
    return Discussion(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      author: json['author'] != null
          ? User.fromJson(json['author'])
          : User(
              id: '',
              name: 'Unknown User',
              email: '',
              role: 'student',
            ),
      category: json['category'] ?? 'general',
      tags: List<String>.from(json['tags'] ?? []),
      likes: (json['likes'] as List<dynamic>?)
              ?.map((like) => DiscussionLike.fromJson(like))
              .toList() ??
          [],
      comments: (json['comments'] as List<dynamic>?)
              ?.map((comment) => Comment.fromJson(comment))
              .toList() ??
          [],
      viewCount: json['viewCount'] ?? 0,
      isReported: json['isReported'] ?? false,
      reportedBy: (json['reportedBy'] as List<dynamic>?)
              ?.map((report) => Report.fromJson(report))
              .toList() ??
          [],
      isDeleted: json['isDeleted'] ?? false,
      isPinned: json['isPinned'] ?? false,
      isLocked: json['isLocked'] ?? false,
      createdAt:
          DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt:
          DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      // Admin approval fields
      isApproved: json['isApproved'] ?? false,
      approvedBy: json['approvedBy'] is Map ? json['approvedBy']['name'] : null,
      approvedAt: json['approvedAt'] != null
          ? DateTime.parse(json['approvedAt']).toLocal()
          : null,
      rejectedBy: json['rejectedBy'] is Map ? json['rejectedBy']['name'] : null,
      rejectedAt: json['rejectedAt'] != null
          ? DateTime.parse(json['rejectedAt']).toLocal()
          : null,
      rejectionReason: json['rejectionReason'],
      status: json['status'] ?? 'pending',
      adminFeedback: (json['adminFeedback'] as List<dynamic>?)
              ?.map((feedback) => AdminFeedback.fromJson(feedback))
              .toList() ??
          [],
      likeCount: json['likeCount'] ?? 0,
      commentCount: json['commentCount'] ?? 0,
      isLikedByUser: json['isLikedByUser'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'content': content,
      'author': author.toJson(),
      'category': category,
      'tags': tags,
      'likes': likes.map((like) => like.toJson()).toList(),
      'comments': comments.map((comment) => comment.toJson()).toList(),
      'viewCount': viewCount,
      'isReported': isReported,
      'reportedBy': reportedBy.map((report) => report.toJson()).toList(),
      'isDeleted': isDeleted,
      'isPinned': isPinned,
      'isLocked': isLocked,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'isApproved': isApproved,
      'approvedBy': approvedBy,
      'approvedAt': approvedAt?.toIso8601String(),
      'rejectedBy': rejectedBy,
      'rejectedAt': rejectedAt?.toIso8601String(),
      'rejectionReason': rejectionReason,
      'status': status,
      'adminFeedback': adminFeedback.map((feedback) => feedback.toJson()).toList(),
      'likeCount': likeCount,
      'commentCount': commentCount,
      'isLikedByUser': isLikedByUser,
    };
  }

  Discussion copyWith({
    String? id,
    String? title,
    String? content,
    User? author,
    String? category,
    List<String>? tags,
    List<DiscussionLike>? likes,
    List<Comment>? comments,
    int? viewCount,
    bool? isReported,
    List<Report>? reportedBy,
    bool? isDeleted,
    bool? isPinned,
    bool? isLocked,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isApproved,
    String? approvedBy,
    DateTime? approvedAt,
    String? rejectedBy,
    DateTime? rejectedAt,
    String? rejectionReason,
    String? status,
    List<AdminFeedback>? adminFeedback,
    int? likeCount,
    int? commentCount,
    bool? isLikedByUser,
  }) {
    return Discussion(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      author: author ?? this.author,
      category: category ?? this.category,
      tags: tags ?? this.tags,
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      viewCount: viewCount ?? this.viewCount,
      isReported: isReported ?? this.isReported,
      reportedBy: reportedBy ?? this.reportedBy,
      isDeleted: isDeleted ?? this.isDeleted,
      isPinned: isPinned ?? this.isPinned,
      isLocked: isLocked ?? this.isLocked,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isApproved: isApproved ?? this.isApproved,
      approvedBy: approvedBy ?? this.approvedBy,
      approvedAt: approvedAt ?? this.approvedAt,
      rejectedBy: rejectedBy ?? this.rejectedBy,
      rejectedAt: rejectedAt ?? this.rejectedAt,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      status: status ?? this.status,
      adminFeedback: adminFeedback ?? this.adminFeedback,
      likeCount: likeCount ?? this.likeCount,
      commentCount: commentCount ?? this.commentCount,
      isLikedByUser: isLikedByUser ?? this.isLikedByUser,
    );
  }

  // Status helper methods
  bool get isPending => status == 'pending';
  bool get isApprovedStatus => isApproved;
  bool get isRejected => status == 'rejected';
  bool get needsUpdate => status == 'needs_update';
  
  // Get unread feedback count
  int get unreadFeedbackCount => adminFeedback.where((feedback) => !feedback.isRead).length;
  
  // Get status display name
  String get statusDisplayName {
    return DiscussionStatusExtension.fromString(status).displayName;
  }

  bool get isUpcoming => false; // Not applicable for discussions
  bool get isOngoing => false; // Not applicable for discussions
}

class Comment {
  final String id;
  final String content;
  final User author;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<Comment> replies;
  final List<DiscussionLike> likes;
  final bool isReported;
  final List<Report> reportedBy;
  final bool isDeleted;
  final String? parentComment;

  // Computed properties
  final int likeCount;
  final bool isLikedByUser;

  Comment({
    required this.id,
    required this.content,
    required this.author,
    required this.createdAt,
    required this.updatedAt,
    required this.replies,
    required this.likes,
    required this.isReported,
    required this.reportedBy,
    required this.isDeleted,
    this.parentComment,
    required this.likeCount,
    required this.isLikedByUser,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['_id'] ?? '',
      content: json['content'] ?? '',
      author: json['author'] != null
          ? User.fromJson(json['author'])
          : User(
              id: '',
              name: 'Unknown User',
              email: '',
              role: 'student',
            ),
      createdAt:
          DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt:
          DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      replies: (json['replies'] as List<dynamic>?)
              ?.map((reply) => Comment.fromJson(reply))
              .toList() ??
          [],
      likes: (json['likes'] as List<dynamic>?)
              ?.map((like) => DiscussionLike.fromJson(like))
              .toList() ??
          [],
      isReported: json['isReported'] ?? false,
      reportedBy: (json['reportedBy'] as List<dynamic>?)
              ?.map((report) => Report.fromJson(report))
              .toList() ??
          [],
      isDeleted: json['isDeleted'] ?? false,
      parentComment: json['parentComment'],
      likeCount: json['likeCount'] ?? 0,
      isLikedByUser: json['isLikedByUser'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'content': content,
      'author': author.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'replies': replies.map((reply) => reply.toJson()).toList(),
      'likes': likes.map((like) => like.toJson()).toList(),
      'isReported': isReported,
      'reportedBy': reportedBy.map((report) => report.toJson()).toList(),
      'isDeleted': isDeleted,
      'parentComment': parentComment,
      'likeCount': likeCount,
      'isLikedByUser': isLikedByUser,
    };
  }

  Comment copyWith({
    String? id,
    String? content,
    User? author,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<Comment>? replies,
    List<DiscussionLike>? likes,
    bool? isReported,
    List<Report>? reportedBy,
    bool? isDeleted,
    String? parentComment,
    int? likeCount,
    bool? isLikedByUser,
  }) {
    return Comment(
      id: id ?? this.id,
      content: content ?? this.content,
      author: author ?? this.author,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      replies: replies ?? this.replies,
      likes: likes ?? this.likes,
      isReported: isReported ?? this.isReported,
      reportedBy: reportedBy ?? this.reportedBy,
      isDeleted: isDeleted ?? this.isDeleted,
      parentComment: parentComment ?? this.parentComment,
      likeCount: likeCount ?? this.likeCount,
      isLikedByUser: isLikedByUser ?? this.isLikedByUser,
    );
  }
}

class DiscussionLike {
  final User user;
  final DateTime createdAt;

  DiscussionLike({
    required this.user,
    required this.createdAt,
  });

  factory DiscussionLike.fromJson(Map<String, dynamic> json) {
    return DiscussionLike(
      user: User.fromJson(json['user'] ?? {}),
      createdAt:
          DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class Report {
  final User user;
  final String reason;
  final DateTime reportedAt;

  Report({
    required this.user,
    required this.reason,
    required this.reportedAt,
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      user: User.fromJson(json['user'] ?? {}),
      reason: json['reason'] ?? '',
      reportedAt: DateTime.parse(
          json['reportedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'reason': reason,
      'reportedAt': reportedAt.toIso8601String(),
    };
  }
}

// Import User model from existing user.dart
class User {
  final String id;
  final String name;
  final String email;
  final String? profileImageUrl;
  final String? currentProfileImageUrl;
  final String role;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.profileImageUrl,
    this.currentProfileImageUrl,
    required this.role,
  });

  factory User.fromJson(dynamic json) {
    // Handle case where author might be a string (ObjectId) instead of populated object
    if (json is String) {
      return User(
        id: json,
        name: 'Unknown User',
        email: '',
        role: 'student',
      );
    }

    // Handle normal case where json is a Map
    final Map<String, dynamic> userMap = json as Map<String, dynamic>;
    return User(
      id: userMap['_id'] ?? '',
      name: userMap['name'] ?? '',
      email: userMap['email'] ?? '',
      profileImageUrl: userMap['profileImageUrl'],
      currentProfileImageUrl: userMap['currentProfileImageUrl'],
      role: userMap['role'] ?? 'student',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'profileImageUrl': profileImageUrl,
      'currentProfileImageUrl': currentProfileImageUrl,
      'role': role,
    };
  }
}

// AdminFeedback class
class AdminFeedback {
  final String id;
  final String message;
  final User sentBy;
  final DateTime sentAt;
  final bool isRead;

  AdminFeedback({
    required this.id,
    required this.message,
    required this.sentBy,
    required this.sentAt,
    required this.isRead,
  });

  factory AdminFeedback.fromJson(Map<String, dynamic> json) {
    return AdminFeedback(
      id: json['_id'] ?? '',
      message: json['message'] ?? '',
      sentBy: json['sentBy'] != null
          ? User.fromJson(json['sentBy'])
          : User(
              id: '',
              name: 'Unknown Admin',
              email: '',
              role: 'admin',
            ),
      sentAt: DateTime.parse(json['sentAt'] ?? DateTime.now().toIso8601String()),
      isRead: json['isRead'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'message': message,
      'sentBy': sentBy.toJson(),
      'sentAt': sentAt.toIso8601String(),
      'isRead': isRead,
    };
  }
}

// Discussion Status enum
enum DiscussionStatus {
  pending,
  approved,
  rejected,
  needsUpdate,
}

extension DiscussionStatusExtension on DiscussionStatus {
  String get value {
    switch (this) {
      case DiscussionStatus.pending:
        return 'pending';
      case DiscussionStatus.approved:
        return 'approved';
      case DiscussionStatus.rejected:
        return 'rejected';
      case DiscussionStatus.needsUpdate:
        return 'needs_update';
    }
  }

  String get displayName {
    switch (this) {
      case DiscussionStatus.pending:
        return 'Pending Approval';
      case DiscussionStatus.approved:
        return 'Approved';
      case DiscussionStatus.rejected:
        return 'Rejected';
      case DiscussionStatus.needsUpdate:
        return 'Needs Update';
    }
  }

  static DiscussionStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return DiscussionStatus.pending;
      case 'approved':
        return DiscussionStatus.approved;
      case 'rejected':
        return DiscussionStatus.rejected;
      case 'needs_update':
        return DiscussionStatus.needsUpdate;
      default:
        return DiscussionStatus.pending;
    }
  }
}

// Discussion categories
enum DiscussionCategory {
  general,
  academic,
  events,
  technical,
  announcements,
  help,
}

extension DiscussionCategoryExtension on DiscussionCategory {
  String get value {
    switch (this) {
      case DiscussionCategory.general:
        return 'general';
      case DiscussionCategory.academic:
        return 'academic';
      case DiscussionCategory.events:
        return 'events';
      case DiscussionCategory.technical:
        return 'technical';
      case DiscussionCategory.announcements:
        return 'announcements';
      case DiscussionCategory.help:
        return 'help';
    }
  }

  String get displayName {
    switch (this) {
      case DiscussionCategory.general:
        return 'General';
      case DiscussionCategory.academic:
        return 'Academic';
      case DiscussionCategory.events:
        return 'Events';
      case DiscussionCategory.technical:
        return 'Technical';
      case DiscussionCategory.announcements:
        return 'Announcements';
      case DiscussionCategory.help:
        return 'Help & Support';
    }
  }

  static DiscussionCategory fromString(String category) {
    switch (category.toLowerCase()) {
      case 'general':
        return DiscussionCategory.general;
      case 'academic':
        return DiscussionCategory.academic;
      case 'events':
        return DiscussionCategory.events;
      case 'technical':
        return DiscussionCategory.technical;
      case 'announcements':
        return DiscussionCategory.announcements;
      case 'help':
        return DiscussionCategory.help;
      default:
        return DiscussionCategory.general;
    }
  }
}

// Pagination model
class DiscussionPagination {
  final int currentPage;
  final int totalPages;
  final int totalItems;
  final int itemsPerPage;
  final bool hasNextPage;
  final bool hasPreviousPage;

  DiscussionPagination({
    required this.currentPage,
    required this.totalPages,
    required this.totalItems,
    required this.itemsPerPage,
    required this.hasNextPage,
    required this.hasPreviousPage,
  });

  factory DiscussionPagination.fromJson(Map<String, dynamic> json) {
    return DiscussionPagination(
      currentPage: json['currentPage'] ?? 1,
      totalPages: json['totalPages'] ?? 1,
      totalItems: json['totalItems'] ?? 0,
      itemsPerPage: json['itemsPerPage'] ?? 10,
      hasNextPage: json['hasNextPage'] ?? false,
      hasPreviousPage: json['hasPreviousPage'] ?? false,
    );
  }
}

// Discussion response model
class DiscussionResponse {
  final List<Discussion> discussions;
  final DiscussionPagination pagination;

  DiscussionResponse({
    required this.discussions,
    required this.pagination,
  });

  factory DiscussionResponse.fromJson(Map<String, dynamic> json) {
    return DiscussionResponse(
      discussions: (json['discussions'] as List<dynamic>)
          .map((discussion) => Discussion.fromJson(discussion))
          .toList(),
      pagination: DiscussionPagination.fromJson(json['pagination'] ?? {}),
    );
  }
}
