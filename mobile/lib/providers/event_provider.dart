import 'package:flutter/foundation.dart';
import '../models/event.dart';
import '../services/api_service.dart';

class EventProvider with ChangeNotifier {
  List<Event> _events = [];
  List<Event> _myEvents = [];
  List<Event> _adminEvents = [];
  Map<String, dynamic> _eventStatistics = {};
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;

  // Getters
  List<Event> get events => _events;
  List<Event> get myEvents => _myEvents;
  List<Event> get adminEvents => _adminEvents;
  Map<String, dynamic> get eventStatistics => _eventStatistics;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMore => _hasMore;

  // Filtered events
  List<Event> get upcomingEvents =>
      _events.where((event) => event.isUpcoming).toList();
  List<Event> get ongoingEvents =>
      _events.where((event) => event.isOngoing).toList();
  List<Event> get pastEvents => _events.where((event) => event.isPast).toList();

  // Get events by category
  List<Event> getEventsByCategory(String category) {
    return _events.where((event) => event.category == category).toList();
  }

  // Get events by type
  List<Event> getEventsByType(String eventType) {
    return _events.where((event) => event.eventType == eventType).toList();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Set error state
  void _setError(String error) {
    _error = error;
    _isLoading = false;
    notifyListeners();
  }

  // Fetch all approved events (for mobile students)
  Future<void> fetchEvents({
    bool refresh = false,
    String? category,
    String? eventType,
    String? search,
    bool upcoming = true,
  }) async {
    try {
      if (refresh) {
        _currentPage = 1;
        _hasMore = true;
        _events.clear();
      }

      _setLoading(true);
      clearError();

      final newEvents = await ApiService.getEvents(
        page: _currentPage,
        limit: 10,
        category: category,
        eventType: eventType,
        search: search,
        upcoming: upcoming,
      );

      if (refresh) {
        _events = newEvents;
      } else {
        _events.addAll(newEvents);
      }

      _hasMore = newEvents.length == 10;
      _currentPage++;

      _setLoading(false);
    } catch (e) {
      _setError(e.toString());
    }
  }

  // Load more events
  Future<void> loadMoreEvents({
    String? category,
    String? eventType,
    String? search,
    bool upcoming = true,
  }) async {
    if (_isLoading || !_hasMore) return;

    await fetchEvents(
      category: category,
      eventType: eventType,
      search: search,
      upcoming: upcoming,
    );
  }

  // Get event by ID
  Future<Event?> getEventById(String id) async {
    try {
      // First check if event exists in local cache
      final cachedEvent = _events.firstWhere(
        (event) => event.id == id,
        orElse: () => _myEvents.firstWhere(
          (event) => event.id == id,
          orElse: () => _adminEvents.firstWhere(
            (event) => event.id == id,
            orElse: () => throw Exception('Event not found'),
          ),
        ),
      );

      return cachedEvent;
    } catch (e) {
      try {
        // If not in cache, fetch from API
        final event = await ApiService.getEventById(id);
        return event;
      } catch (e) {
        _setError(e.toString());
        return null;
      }
    }
  }

  // Create new event (Club/Admin only)
  Future<Event?> createEvent(Map<String, dynamic> eventData) async {
    try {
      _setLoading(true);
      clearError();

      final event = await ApiService.createEvent(eventData);
      _myEvents.insert(0, event);

      _setLoading(false);
      return event;
    } catch (e) {
      _setError(e.toString());
      return null;
    }
  }

  // Update event (Creator/Admin only)
  Future<Event?> updateEvent(String id, Map<String, dynamic> eventData) async {
    try {
      _setLoading(true);
      clearError();

      final updatedEvent = await ApiService.updateEvent(id, eventData);

      // Update in local lists
      _updateEventInLists(updatedEvent);

      _setLoading(false);
      return updatedEvent;
    } catch (e) {
      _setError(e.toString());
      return null;
    }
  }

  // Delete event (Creator/Admin only)
  Future<bool> deleteEvent(String id) async {
    try {
      _setLoading(true);
      clearError();

      await ApiService.deleteEvent(id);

      // Remove from local lists
      _events.removeWhere((event) => event.id == id);
      _myEvents.removeWhere((event) => event.id == id);
      _adminEvents.removeWhere((event) => event.id == id);

      _setLoading(false);
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    }
  }

  // Fetch user's events (Club/Admin only)
  Future<void> fetchMyEvents({
    bool refresh = false,
    String? status,
  }) async {
    try {
      if (refresh) {
        _myEvents.clear();
      }

      _setLoading(true);
      clearError();

      final events = await ApiService.getMyEvents(
        page: 1,
        limit: 50, // Get more events for user's own list
        status: status,
      );

      _myEvents = events;
      _setLoading(false);
    } catch (e) {
      _setError(e.toString());
    }
  }

  // Fetch admin events (Admin only)
  Future<void> fetchAdminEvents({
    bool refresh = false,
    String? status,
    String? category,
    String? eventType,
  }) async {
    try {
      if (refresh) {
        _adminEvents.clear();
      }

      _setLoading(true);
      clearError();

      final result = await ApiService.getAdminEvents(
        page: 1,
        limit: 50,
        status: status,
        category: category,
        eventType: eventType,
      );

      _adminEvents = result['events'];
      _eventStatistics = result['statistics'];

      _setLoading(false);
    } catch (e) {
      _setError(e.toString());
    }
  }

  // Approve event (Admin only)
  Future<Event?> approveEvent(String id) async {
    try {
      _setLoading(true);
      clearError();

      final approvedEvent = await ApiService.approveEvent(id);

      // Update in local lists
      _updateEventInLists(approvedEvent);

      _setLoading(false);
      return approvedEvent;
    } catch (e) {
      _setError(e.toString());
      return null;
    }
  }

  // Reject event (Admin only)
  Future<Event?> rejectEvent(String id, String? reason) async {
    try {
      _setLoading(true);
      clearError();

      final rejectedEvent = await ApiService.rejectEvent(id, reason);

      // Update in local lists
      _updateEventInLists(rejectedEvent);

      _setLoading(false);
      return rejectedEvent;
    } catch (e) {
      _setError(e.toString());
      return null;
    }
  }

  // Fetch event statistics (Admin only)
  Future<void> fetchEventStatistics() async {
    try {
      _setLoading(true);
      clearError();

      final statistics = await ApiService.getEventStatistics();
      _eventStatistics = statistics;

      _setLoading(false);
    } catch (e) {
      _setError(e.toString());
    }
  }

  // Helper method to update event in all lists
  void _updateEventInLists(Event updatedEvent) {
    final eventId = updatedEvent.id;

    // Update in events list
    final eventIndex = _events.indexWhere((event) => event.id == eventId);
    if (eventIndex != -1) {
      _events[eventIndex] = updatedEvent;
    }

    // Update in my events list
    final myEventIndex = _myEvents.indexWhere((event) => event.id == eventId);
    if (myEventIndex != -1) {
      _myEvents[myEventIndex] = updatedEvent;
    }

    // Update in admin events list
    final adminEventIndex =
        _adminEvents.indexWhere((event) => event.id == eventId);
    if (adminEventIndex != -1) {
      _adminEvents[adminEventIndex] = updatedEvent;
    }
  }

  // Search events
  Future<List<Event>> searchEvents(String query) async {
    try {
      final events = await ApiService.getEvents(
        page: 1,
        limit: 20,
        search: query,
      );
      return events;
    } catch (e) {
      _setError(e.toString());
      return [];
    }
  }

  // Get filtered events
  List<Event> getFilteredEvents({
    String? category,
    String? eventType,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    List<Event> filteredEvents = List.from(_events);

    if (category != null && category != 'all') {
      filteredEvents =
          filteredEvents.where((event) => event.category == category).toList();
    }

    if (eventType != null && eventType != 'all') {
      filteredEvents = filteredEvents
          .where((event) => event.eventType == eventType)
          .toList();
    }

    if (status != null) {
      switch (status) {
        case 'upcoming':
          filteredEvents =
              filteredEvents.where((event) => event.isUpcoming).toList();
          break;
        case 'ongoing':
          filteredEvents =
              filteredEvents.where((event) => event.isOngoing).toList();
          break;
        case 'past':
          filteredEvents =
              filteredEvents.where((event) => event.isPast).toList();
          break;
      }
    }

    if (startDate != null) {
      filteredEvents = filteredEvents
          .where((event) => event.startDateTime.isAfter(startDate))
          .toList();
    }

    if (endDate != null) {
      filteredEvents = filteredEvents
          .where((event) => event.endDateTime.isBefore(endDate))
          .toList();
    }

    return filteredEvents;
  }

  // Clear all data
  void clearAllData() {
    _events.clear();
    _myEvents.clear();
    _adminEvents.clear();
    _eventStatistics.clear();
    _error = null;
    _isLoading = false;
    _currentPage = 1;
    _hasMore = true;
    notifyListeners();
  }
}
