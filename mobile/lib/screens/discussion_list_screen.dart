import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/discussion_provider.dart';
import '../providers/auth_provider.dart';
import '../models/discussion.dart';
import 'discussion_detail_screen.dart';
import 'create_discussion_screen.dart';
import 'my_discussions_screen.dart';
import '../widgets/discussion_card.dart';
import '../widgets/discussion_filters.dart';

class DiscussionListScreen extends StatefulWidget {
  const DiscussionListScreen({super.key});

  @override
  State<DiscussionListScreen> createState() => _DiscussionListScreenState();
}

class _DiscussionListScreenState extends State<DiscussionListScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);

    // Load initial discussions
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialDiscussions();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      _loadMoreDiscussions();
    }
  }

  Future<void> _loadInitialDiscussions() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final discussionProvider =
        Provider.of<DiscussionProvider>(context, listen: false);

    await discussionProvider.loadDiscussions(
      refresh: true,
      token: authProvider.token,
    );
  }

  Future<void> _loadMoreDiscussions() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final discussionProvider =
        Provider.of<DiscussionProvider>(context, listen: false);

    if (discussionProvider.hasMore && !discussionProvider.isLoadingMore) {
      await discussionProvider.loadDiscussions(
        refresh: false,
        token: authProvider.token,
      );
    }
  }

  Future<void> _refreshDiscussions() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final discussionProvider =
        Provider.of<DiscussionProvider>(context, listen: false);

    await discussionProvider.loadDiscussions(
      refresh: true,
      token: authProvider.token,
    );
  }

  void _startSearch() {
    setState(() {
      _isSearching = true;
    });
  }

  void _stopSearch() {
    setState(() {
      _isSearching = false;
    });
    _searchController.clear();
    _refreshDiscussions();
  }

  Future<void> _performSearch(String query) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final discussionProvider =
        Provider.of<DiscussionProvider>(context, listen: false);

    await discussionProvider.searchDiscussions(
      query,
      token: authProvider.token,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Search discussions...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: Colors.white70),
                ),
                style: const TextStyle(color: Colors.white),
                onSubmitted: _performSearch,
              )
            : const Text('Discussion Forum'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          if (_isSearching)
            IconButton(
              icon: const Icon(Icons.clear),
              onPressed: _stopSearch,
            )
          else
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: _startSearch,
            ),
          // My Discussions button
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const MyDiscussionsScreen(),
                ),
              );
            },
            tooltip: 'My Discussions',
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              final authProvider =
                  Provider.of<AuthProvider>(context, listen: false);
              final discussionProvider =
                  Provider.of<DiscussionProvider>(context, listen: false);

              discussionProvider.sortDiscussions(value,
                  token: authProvider.token);
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'recent',
                child: ListTile(
                  leading: Icon(Icons.schedule),
                  title: Text('Recent'),
                ),
              ),
              const PopupMenuItem(
                value: 'popular',
                child: ListTile(
                  leading: Icon(Icons.trending_up),
                  title: Text('Popular'),
                ),
              ),
              const PopupMenuItem(
                value: 'mostLiked',
                child: ListTile(
                  leading: Icon(Icons.favorite),
                  title: Text('Most Liked'),
                ),
              ),
              const PopupMenuItem(
                value: 'mostCommented',
                child: ListTile(
                  leading: Icon(Icons.comment),
                  title: Text('Most Commented'),
                ),
              ),
            ],
          ),
        ],
      ),
      body: Consumer<DiscussionProvider>(
        builder: (context, discussionProvider, child) {
          return Column(
            children: [
              // Category filters
              DiscussionFilters(
                selectedCategory: discussionProvider.selectedCategory,
                onCategoryChanged: (category) {
                  final authProvider =
                      Provider.of<AuthProvider>(context, listen: false);
                  discussionProvider.filterByCategory(category,
                      token: authProvider.token);
                },
              ),

              // Discussions list
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _refreshDiscussions,
                  child: _buildDiscussionsList(discussionProvider),
                ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const CreateDiscussionScreen(),
            ),
          );
        },
        backgroundColor: Colors.blue,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildDiscussionsList(DiscussionProvider discussionProvider) {
    if (discussionProvider.isLoading &&
        discussionProvider.discussions.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (discussionProvider.error.isNotEmpty &&
        discussionProvider.discussions.isEmpty) {
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
              'Error loading discussions',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              discussionProvider.error,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _refreshDiscussions,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (discussionProvider.discussions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.forum_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No discussions yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Start a new discussion to get the conversation going!',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: discussionProvider.discussions.length +
          (discussionProvider.hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == discussionProvider.discussions.length) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
          );
        }

        final discussion = discussionProvider.discussions[index];
        return DiscussionCard(
          discussion: discussion,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => DiscussionDetailScreen(
                  discussionId: discussion.id,
                ),
              ),
            );
          },
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
        );
      },
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
}
