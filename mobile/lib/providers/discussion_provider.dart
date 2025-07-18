import 'package:flutter/material.dart';
import '../models/discussion.dart';
import '../services/discussion_service.dart';

class DiscussionProvider extends ChangeNotifier {
  final DiscussionService _discussionService = DiscussionService();

  // Discussion list state
  List<Discussion> _discussions = [];
  DiscussionPagination? _pagination;
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String _error = '';

  // Current discussion state
  Discussion? _currentDiscussion;
  bool _isLoadingDiscussion = false;
  String _discussionError = '';

  // Filters and sorting
  String _selectedCategory = 'all';
  String _searchQuery = '';
  String _sortBy = 'recent';
  int _currentPage = 1;

  // Getters
  List<Discussion> get discussions => _discussions;
  DiscussionPagination? get pagination => _pagination;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String get error => _error;

  Discussion? get currentDiscussion => _currentDiscussion;
  bool get isLoadingDiscussion => _isLoadingDiscussion;
  String get discussionError => _discussionError;

  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  String get sortBy => _sortBy;
  int get currentPage => _currentPage;

  bool get hasMore => _pagination?.hasNextPage ?? false;

  // Load discussions with filtering and pagination
  Future<void> loadDiscussions({
    String? category,
    String? search,
    String? sort,
    bool refresh = false,
    String? token,
  }) async {
    if (refresh) {
      _currentPage = 1;
      _discussions.clear();
    }

    if (_isLoading || _isLoadingMore) return;

    if (refresh) {
      _isLoading = true;
      _error = '';
    } else {
      _isLoadingMore = true;
    }

    // Update filters if provided
    if (category != null) _selectedCategory = category;
    if (search != null) _searchQuery = search;
    if (sort != null) _sortBy = sort;

    notifyListeners();

    try {
      final response = await _discussionService.getDiscussions(
        category: _selectedCategory,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        sort: _sortBy,
        page: _currentPage,
        limit: 10,
        token: token,
      );

      if (refresh) {
        _discussions = response.discussions;
      } else {
        _discussions.addAll(response.discussions);
      }

      _pagination = response.pagination;
      _currentPage++;
      _error = '';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  // Load specific discussion
  Future<void> loadDiscussion(String id, {String? token}) async {
    _isLoadingDiscussion = true;
    _discussionError = '';
    notifyListeners();

    try {
      _currentDiscussion =
          await _discussionService.getDiscussion(id, token: token);
      _discussionError = '';
    } catch (e) {
      _discussionError = e.toString();
    } finally {
      _isLoadingDiscussion = false;
      notifyListeners();
    }
  }

  // Create new discussion
  Future<Discussion?> createDiscussion({
    required String title,
    required String content,
    required String category,
    required List<String> tags,
    required String token,
  }) async {
    try {
      final discussion = await _discussionService.createDiscussion(
        title: title,
        content: content,
        category: category,
        tags: tags,
        token: token,
      );

      // Add to the beginning of the list if it matches current filters
      if (_selectedCategory == 'all' || _selectedCategory == category) {
        _discussions.insert(0, discussion);
        notifyListeners();
      }

      return discussion;
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Update discussion
  Future<Discussion?> updateDiscussion({
    required String id,
    required String title,
    required String content,
    required String category,
    required List<String> tags,
    required String token,
  }) async {
    try {
      final discussion = await _discussionService.updateDiscussion(
        id: id,
        title: title,
        content: content,
        category: category,
        tags: tags,
        token: token,
      );

      // Update in the list
      final index = _discussions.indexWhere((d) => d.id == id);
      if (index != -1) {
        _discussions[index] = discussion;
      }

      // Update current discussion if it's the same
      if (_currentDiscussion?.id == id) {
        _currentDiscussion = discussion;
      }

      notifyListeners();
      return discussion;
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Delete discussion
  Future<void> deleteDiscussion(String id, String token) async {
    try {
      await _discussionService.deleteDiscussion(id, token);

      // Remove from the list
      _discussions.removeWhere((d) => d.id == id);

      // Clear current discussion if it's the same
      if (_currentDiscussion?.id == id) {
        _currentDiscussion = null;
      }

      notifyListeners();
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Toggle like on discussion
  Future<void> toggleDiscussionLike(String id, String token) async {
    try {
      final result = await _discussionService.toggleDiscussionLike(id, token);

      // Update in the list
      final index = _discussions.indexWhere((d) => d.id == id);
      if (index != -1) {
        _discussions[index] = _discussions[index].copyWith(
          likeCount: result['likeCount'],
          isLikedByUser: result['isLiked'],
        );
      }

      // Update current discussion if it's the same
      if (_currentDiscussion?.id == id) {
        _currentDiscussion = _currentDiscussion!.copyWith(
          likeCount: result['likeCount'],
          isLikedByUser: result['isLiked'],
        );
      }

      notifyListeners();
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Add comment to discussion
  Future<void> addComment({
    required String discussionId,
    required String content,
    String? parentComment,
    required String token,
  }) async {
    try {
      final result = await _discussionService.addComment(
        discussionId: discussionId,
        content: content,
        parentComment: parentComment,
        token: token,
      );

      // Update current discussion if it's the same
      if (_currentDiscussion?.id == discussionId) {
        // Reload the discussion to get updated comments
        await loadDiscussion(discussionId, token: token);
      }

      // Update comment count in the list
      final index = _discussions.indexWhere((d) => d.id == discussionId);
      if (index != -1) {
        _discussions[index] = _discussions[index].copyWith(
          commentCount: result['totalComments'],
        );
      }

      notifyListeners();
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Update comment
  Future<void> updateComment({
    required String discussionId,
    required String commentId,
    required String content,
    required String token,
  }) async {
    try {
      await _discussionService.updateComment(
        discussionId: discussionId,
        commentId: commentId,
        content: content,
        token: token,
      );

      // Reload the discussion to get updated comments
      if (_currentDiscussion?.id == discussionId) {
        await loadDiscussion(discussionId, token: token);
      }

      notifyListeners();
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Delete comment
  Future<void> deleteComment({
    required String discussionId,
    required String commentId,
    required String token,
  }) async {
    try {
      await _discussionService.deleteComment(
        discussionId: discussionId,
        commentId: commentId,
        token: token,
      );

      // Reload the discussion to get updated comments
      if (_currentDiscussion?.id == discussionId) {
        await loadDiscussion(discussionId, token: token);
      }

      notifyListeners();
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Toggle like on comment
  Future<void> toggleCommentLike({
    required String discussionId,
    required String commentId,
    required String token,
  }) async {
    try {
      final result = await _discussionService.toggleCommentLike(
        discussionId: discussionId,
        commentId: commentId,
        token: token,
      );

      // Update the specific comment in current discussion without full reload
      if (_currentDiscussion?.id == discussionId) {
        _currentDiscussion = _updateCommentInDiscussion(_currentDiscussion!,
            commentId, result['likeCount'], result['isLiked']);
      }

      notifyListeners();
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Helper method to update a specific comment's like status recursively
  Discussion _updateCommentInDiscussion(
      Discussion discussion, String commentId, int likeCount, bool isLiked) {
    List<Comment> updatedComments = discussion.comments.map((comment) {
      return _updateCommentRecursively(comment, commentId, likeCount, isLiked);
    }).toList();

    return discussion.copyWith(comments: updatedComments);
  }

  // Helper method to recursively update comment like status
  Comment _updateCommentRecursively(
      Comment comment, String targetId, int likeCount, bool isLiked) {
    if (comment.id == targetId) {
      return comment.copyWith(
        likeCount: likeCount,
        isLikedByUser: isLiked,
      );
    }

    if (comment.replies.isNotEmpty) {
      List<Comment> updatedReplies = comment.replies.map((reply) {
        return _updateCommentRecursively(reply, targetId, likeCount, isLiked);
      }).toList();

      return comment.copyWith(replies: updatedReplies);
    }

    return comment;
  }

  // Report discussion
  Future<void> reportDiscussion({
    required String discussionId,
    required String reason,
    required String token,
  }) async {
    try {
      await _discussionService.reportDiscussion(
        discussionId: discussionId,
        reason: reason,
        token: token,
      );
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Report comment
  Future<void> reportComment({
    required String discussionId,
    required String commentId,
    required String reason,
    required String token,
  }) async {
    try {
      await _discussionService.reportComment(
        discussionId: discussionId,
        commentId: commentId,
        reason: reason,
        token: token,
      );
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  // Search discussions
  Future<void> searchDiscussions(String query, {String? token}) async {
    _searchQuery = query;
    await loadDiscussions(search: query, refresh: true, token: token);
  }

  // Filter by category
  Future<void> filterByCategory(String category, {String? token}) async {
    _selectedCategory = category;
    await loadDiscussions(category: category, refresh: true, token: token);
  }

  // Sort discussions
  Future<void> sortDiscussions(String sortBy, {String? token}) async {
    _sortBy = sortBy;
    await loadDiscussions(sort: sortBy, refresh: true, token: token);
  }

  // Clear current discussion
  void clearCurrentDiscussion() {
    _currentDiscussion = null;
    _discussionError = '';
    notifyListeners();
  }

  // Clear all data
  void clearAll() {
    _discussions.clear();
    _pagination = null;
    _currentDiscussion = null;
    _error = '';
    _discussionError = '';
    _selectedCategory = 'all';
    _searchQuery = '';
    _sortBy = 'recent';
    _currentPage = 1;
    notifyListeners();
  }

  // Get discussion by ID from cache
  Discussion? getDiscussionById(String id) {
    try {
      return _discussions.firstWhere((d) => d.id == id);
    } catch (e) {
      return null;
    }
  }
}
