import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/event_provider.dart';
import '../models/event.dart';
import 'event_detail_screen.dart';

class EventsListScreen extends StatefulWidget {
  const EventsListScreen({super.key});

  @override
  State<EventsListScreen> createState() => _EventsListScreenState();
}

class _EventsListScreenState extends State<EventsListScreen> {
  final ScrollController _scrollController = ScrollController();
  String _selectedCategory = 'all';
  String _selectedType = 'all';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_scrollListener);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchEvents();
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_scrollListener);
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _scrollListener() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      _loadMoreEvents();
    }
  }

  Future<void> _fetchEvents() async {
    final eventProvider = Provider.of<EventProvider>(context, listen: false);
    await eventProvider.fetchEvents(
      refresh: true,
      category: _selectedCategory != 'all' ? _selectedCategory : null,
      eventType: _selectedType != 'all' ? _selectedType : null,
      search: _searchQuery.isNotEmpty ? _searchQuery : null,
    );
  }

  Future<void> _loadMoreEvents() async {
    final eventProvider = Provider.of<EventProvider>(context, listen: false);
    await eventProvider.loadMoreEvents(
      category: _selectedCategory != 'all' ? _selectedCategory : null,
      eventType: _selectedType != 'all' ? _selectedType : null,
      search: _searchQuery.isNotEmpty ? _searchQuery : null,
    );
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
    // Debounce the search
    Future.delayed(const Duration(milliseconds: 500), () {
      if (_searchQuery == query) {
        _fetchEvents();
      }
    });
  }

  void _onFilterChanged() {
    _fetchEvents();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Events'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon:
                Icon(_showFilters ? Icons.filter_list : Icons.filter_list_off),
            onPressed: () {
              setState(() {
                _showFilters = !_showFilters;
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search events...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
              ),
              onChanged: _onSearchChanged,
            ),
          ),

          // Filters
          if (_showFilters)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedCategory,
                          decoration: const InputDecoration(
                            labelText: 'Category',
                            border: OutlineInputBorder(),
                          ),
                          items: const [
                            DropdownMenuItem(
                                value: 'all', child: Text('All Categories')),
                            DropdownMenuItem(
                                value: 'academic', child: Text('Academic')),
                            DropdownMenuItem(
                                value: 'cultural', child: Text('Cultural')),
                            DropdownMenuItem(
                                value: 'sports', child: Text('Sports')),
                            DropdownMenuItem(
                                value: 'workshop', child: Text('Workshop')),
                            DropdownMenuItem(
                                value: 'seminar', child: Text('Seminar')),
                            DropdownMenuItem(
                                value: 'social', child: Text('Social')),
                            DropdownMenuItem(
                                value: 'other', child: Text('Other')),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _selectedCategory = value!;
                            });
                            _onFilterChanged();
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedType,
                          decoration: const InputDecoration(
                            labelText: 'Type',
                            border: OutlineInputBorder(),
                          ),
                          items: const [
                            DropdownMenuItem(
                                value: 'all', child: Text('All Types')),
                            DropdownMenuItem(
                                value: 'university', child: Text('University')),
                            DropdownMenuItem(
                                value: 'club', child: Text('Club')),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _selectedType = value!;
                            });
                            _onFilterChanged();
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setState(() {
                              _selectedCategory = 'all';
                              _selectedType = 'all';
                              _searchQuery = '';
                              _searchController.clear();
                            });
                            _onFilterChanged();
                          },
                          child: const Text('Clear Filters'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          // Events List
          Expanded(
            child: Consumer<EventProvider>(
              builder: (context, eventProvider, child) {
                if (eventProvider.isLoading && eventProvider.events.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (eventProvider.error != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Error loading events',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          eventProvider.error!,
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            eventProvider.clearError();
                            _fetchEvents();
                          },
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                if (eventProvider.events.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.event_busy,
                          size: 64,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No events found',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w500),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Try adjusting your search or filters',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: _fetchEvents,
                  child: ListView.builder(
                    controller: _scrollController,
                    itemCount: eventProvider.events.length +
                        (eventProvider.hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == eventProvider.events.length) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }

                      final event = eventProvider.events[index];
                      return EventCard(
                        event: event,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  EventDetailScreen(event: event),
                            ),
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class EventCard extends StatelessWidget {
  final Event event;
  final VoidCallback onTap;

  const EventCard({
    super.key,
    required this.event,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Event Image with overlays
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    child: event.imageUrl != null && event.imageUrl!.isNotEmpty
                        ? Image.network(
                            event.imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return _buildPlaceholderImage();
                            },
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return _buildPlaceholderImage();
                            },
                          )
                        : _buildPlaceholderImage(),
                  ),
                ),

                // Gradient overlay for better text readability
                ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withOpacity(0.4),
                          Colors.black.withOpacity(0.1),
                          Colors.black.withOpacity(0.6),
                          Colors.black.withOpacity(0.85),
                        ],
                        stops: const [0.0, 0.3, 0.7, 1.0],
                      ),
                    ),
                  ),
                ),

                // Status chip positioned at top right
                Positioned(
                  top: 12,
                  right: 12,
                  child: _buildStatusChip(),
                ),

                // Club logo positioned at top left
                if (event.clubLogoUrl != null && event.clubLogoUrl!.isNotEmpty)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.network(
                          event.clubLogoUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              decoration: BoxDecoration(
                                color: Colors.blue,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.group,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),

                // Event title and date at bottom
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Event title
                        Text(
                          event.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            shadows: [
                              Shadow(
                                offset: Offset(0, 2),
                                blurRadius: 6,
                                color: Colors.black87,
                              ),
                              Shadow(
                                offset: Offset(0, 1),
                                blurRadius: 3,
                                color: Colors.black54,
                              ),
                            ],
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),

                        // Date and time
                        Row(
                          children: [
                            const Icon(
                              Icons.access_time,
                              size: 16,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                _formatDateTime(event.startDateTime),
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Colors.white,
                                  fontWeight: FontWeight.w500,
                                  shadows: [
                                    Shadow(
                                      offset: Offset(0, 2),
                                      blurRadius: 6,
                                      color: Colors.black87,
                                    ),
                                    Shadow(
                                      offset: Offset(0, 1),
                                      blurRadius: 3,
                                      color: Colors.black54,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(15),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 8),
            Text(
              'Event Image',
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip() {
    Color color;
    String text;

    if (event.isOngoing) {
      color = Colors.green;
      text = 'Ongoing';
    } else if (event.isUpcoming) {
      color = Colors.blue;
      text = 'Upcoming';
    } else {
      color = Colors.grey;
      text = 'Past';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.9),
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    // Format as "Dec 15, 2024 at 2:30 PM"
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    final month = months[dateTime.month - 1];
    final day = dateTime.day;
    final year = dateTime.year;

    final hour = dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);

    return '$month $day, $year at $displayHour:$minute $period';
  }
}
