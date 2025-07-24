import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/discussion.dart';
import 'api_service.dart';

class DiscussionService {
  // Get all discussions with filtering and pagination
  Future<DiscussionResponse> getDiscussions({
    String? category,
    String? search,
    String sort = 'recent',
    int page = 1,
    int limit = 10,
    String? author,
    String? tags,
    String? token,
  }) async {
    try {
      final Map<String, String> queryParams = {
        'sort': sort,
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (category != null && category != 'all') {
        queryParams['category'] = category;
      }

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      if (author != null && author.isNotEmpty) {
        queryParams['author'] = author;
      }

      if (tags != null && tags.isNotEmpty) {
        queryParams['tags'] = tags;
      }

      final uri = Uri.parse('${ApiService.baseUrl}/discussions')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return DiscussionResponse.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to load discussions: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching discussions: $e');
    }
  }

  // Get specific discussion by ID
  Future<Discussion> getDiscussion(String id, {String? token}) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/discussions/$id'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return Discussion.fromJson(json.decode(response.body));
      } else if (response.statusCode == 404) {
        throw Exception('Discussion not found');
      } else {
        throw Exception('Failed to load discussion: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching discussion: $e');
    }
  }

  // Create new discussion
  Future<Discussion> createDiscussion({
    required String title,
    required String content,
    required String category,
    required List<String> tags,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/discussions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'title': title,
          'content': content,
          'category': category,
          'tags': tags,
        }),
      );

      if (response.statusCode == 201) {
        return Discussion.fromJson(json.decode(response.body));
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to create discussion');
      }
    } catch (e) {
      throw Exception('Error creating discussion: $e');
    }
  }

  // Update discussion
  Future<Discussion> updateDiscussion({
    required String id,
    required String title,
    required String content,
    required String category,
    required List<String> tags,
    required String token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiService.baseUrl}/discussions/$id'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'title': title,
          'content': content,
          'category': category,
          'tags': tags,
        }),
      );

      if (response.statusCode == 200) {
        return Discussion.fromJson(json.decode(response.body));
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to update discussion');
      }
    } catch (e) {
      throw Exception('Error updating discussion: $e');
    }
  }

  // Delete discussion
  Future<void> deleteDiscussion(String id, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${ApiService.baseUrl}/discussions/$id'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to delete discussion');
      }
    } catch (e) {
      throw Exception('Error deleting discussion: $e');
    }
  }

  // Toggle like on discussion
  Future<Map<String, dynamic>> toggleDiscussionLike(
      String id, String token) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/discussions/$id/like'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to toggle like');
      }
    } catch (e) {
      throw Exception('Error toggling like: $e');
    }
  }

  // Add comment to discussion
  Future<Map<String, dynamic>> addComment({
    required String discussionId,
    required String content,
    String? parentComment,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/discussions/$discussionId/comments'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'content': content,
          if (parentComment != null) 'parentComment': parentComment,
        }),
      );

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to add comment');
      }
    } catch (e) {
      throw Exception('Error adding comment: $e');
    }
  }

  // Update comment
  Future<Map<String, dynamic>> updateComment({
    required String discussionId,
    required String commentId,
    required String content,
    required String token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse(
            '${ApiService.baseUrl}/discussions/$discussionId/comments/$commentId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'content': content,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to update comment');
      }
    } catch (e) {
      throw Exception('Error updating comment: $e');
    }
  }

  // Delete comment
  Future<void> deleteComment({
    required String discussionId,
    required String commentId,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse(
            '${ApiService.baseUrl}/discussions/$discussionId/comments/$commentId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to delete comment');
      }
    } catch (e) {
      throw Exception('Error deleting comment: $e');
    }
  }

  // Toggle like on comment
  Future<Map<String, dynamic>> toggleCommentLike({
    required String discussionId,
    required String commentId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(
            '${ApiService.baseUrl}/discussions/$discussionId/comments/$commentId/like'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(
            errorData['message'] ?? 'Failed to toggle comment like');
      }
    } catch (e) {
      throw Exception('Error toggling comment like: $e');
    }
  }

  // Report discussion
  Future<void> reportDiscussion({
    required String discussionId,
    required String reason,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/discussions/$discussionId/report'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'reason': reason,
        }),
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to report discussion');
      }
    } catch (e) {
      throw Exception('Error reporting discussion: $e');
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
      final response = await http.post(
        Uri.parse(
            '${ApiService.baseUrl}/discussions/$discussionId/comments/$commentId/report'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'reason': reason,
        }),
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to report comment');
      }
    } catch (e) {
      throw Exception('Error reporting comment: $e');
    }
  }

  // Get discussion statistics
  Future<Map<String, dynamic>> getDiscussionStats() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/discussions/stats/overview'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception(
            'Failed to load discussion stats: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching discussion stats: $e');
    }
  }

  // ================== USER DISCUSSION MANAGEMENT ==================

  // Get current user's discussions with all statuses
  Future<DiscussionResponse> getMyDiscussions({
    String status = 'all',
    int page = 1,
    int limit = 10,
    required String token,
  }) async {
    try {
      final Map<String, String> queryParams = {
        'status': status,
        'page': page.toString(),
        'limit': limit.toString(),
      };

      final uri = Uri.parse('${ApiService.baseUrl}/discussions/user/my-discussions')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return DiscussionResponse(
          discussions: (responseData['discussions'] as List<dynamic>)
              .map((discussion) => Discussion.fromJson(discussion))
              .toList(),
          pagination: DiscussionPagination.fromJson(responseData['pagination'] ?? {}),
        );
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to load your discussions');
      }
    } catch (e) {
      throw Exception('Error fetching your discussions: $e');
    }
  }

  // Get feedback for a discussion
  Future<List<AdminFeedback>> getDiscussionFeedback({
    required String discussionId,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/discussions/$discussionId/feedback'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return (responseData['feedback'] as List<dynamic>)
            .map((feedback) => AdminFeedback.fromJson(feedback))
            .toList();
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to load feedback');
      }
    } catch (e) {
      throw Exception('Error fetching feedback: $e');
    }
  }

  // Mark feedback as read
  Future<void> markFeedbackAsRead({
    required String discussionId,
    required String feedbackId,
    required String token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiService.baseUrl}/discussions/$discussionId/feedback/$feedbackId/read'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to mark feedback as read');
      }
    } catch (e) {
      throw Exception('Error marking feedback as read: $e');
    }
  }

  // ================== ADMIN METHODS (FOR FUTURE USE) ==================

  // Get all discussions for admin review
  Future<Map<String, dynamic>> getAdminDiscussions({
    String status = 'pending',
    String? category,
    String? search,
    int page = 1,
    int limit = 10,
    required String token,
  }) async {
    try {
      final Map<String, String> queryParams = {
        'status': status,
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (category != null && category != 'all') {
        queryParams['category'] = category;
      }

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final uri = Uri.parse('${ApiService.baseUrl}/discussions/admin/all')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to load admin discussions');
      }
    } catch (e) {
      throw Exception('Error fetching admin discussions: $e');
    }
  }

  // Approve discussion (Admin only)
  Future<Discussion> approveDiscussion({
    required String discussionId,
    required String token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiService.baseUrl}/discussions/$discussionId/approve'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return Discussion.fromJson(responseData['discussion']);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to approve discussion');
      }
    } catch (e) {
      throw Exception('Error approving discussion: $e');
    }
  }

  // Reject discussion (Admin only)
  Future<Discussion> rejectDiscussion({
    required String discussionId,
    String? reason,
    required String token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiService.baseUrl}/discussions/$discussionId/reject'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'reason': reason ?? 'No reason provided',
        }),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return Discussion.fromJson(responseData['discussion']);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to reject discussion');
      }
    } catch (e) {
      throw Exception('Error rejecting discussion: $e');
    }
  }

  // Send feedback to discussion author (Admin only)
  Future<Discussion> sendDiscussionFeedback({
    required String discussionId,
    required String message,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/discussions/$discussionId/feedback'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'message': message,
        }),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return Discussion.fromJson(responseData['discussion']);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to send feedback');
      }
    } catch (e) {
      throw Exception('Error sending feedback: $e');
    }
  }


}
