import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/event.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:add_2_calendar/add_2_calendar.dart' as calendar;

class EventDetailScreen extends StatefulWidget {
  final Event event;

  const EventDetailScreen({
    super.key,
    required this.event,
  });

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final event = widget.event; // Local reference for cleaner code
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.event.title),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _shareEvent(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Event Image (if available)
            if (widget.event.imageUrl != null)
              Container(
                height: 200,
                width: double.infinity,
                child: Image.network(
                  widget.event.imageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 200,
                      color: Colors.grey[300],
                      child: const Center(
                        child: Icon(
                          Icons.image_not_supported,
                          size: 64,
                          color: Colors.grey,
                        ),
                      ),
                    );
                  },
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Event Status
                  Row(
                    children: [
                      _buildStatusChip(),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getEventTypeColor(event.eventType),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          event.eventTypeDisplayName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Event Title
                  Text(
                    event.title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),

                  // Organizer with club logo
                  Row(
                    children: [
                      // Club logo if available
                      if (event.clubLogoUrl != null &&
                          event.clubLogoUrl!.isNotEmpty) ...[
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(6),
                            border:
                                Border.all(color: Colors.grey[300]!, width: 1),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(5),
                            child: Image.network(
                              event.clubLogoUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  decoration: BoxDecoration(
                                    color: Colors.blue,
                                    borderRadius: BorderRadius.circular(5),
                                  ),
                                  child: const Center(
                                    child: Icon(
                                      Icons.group,
                                      color: Colors.white,
                                      size: 16,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                      ] else ...[
                        Icon(
                          Icons.group,
                          size: 20,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 8),
                      ],
                      Expanded(
                        child: Text(
                          'Organized by ${event.organizer}',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Date and Time
                  _buildInfoSection(
                    icon: Icons.access_time,
                    title: 'Date & Time',
                    content: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Start: ${_formatDateTime(event.startDateTime)}',
                          style: const TextStyle(fontSize: 16),
                        ),
                        Text(
                          'End: ${_formatDateTime(event.endDateTime)}',
                          style: const TextStyle(fontSize: 16),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Duration: ${_formatDuration(event.endDateTime.difference(event.startDateTime))}',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Location
                  _buildInfoSection(
                    icon: Icons.location_on,
                    title: 'Location',
                    content: Text(
                      event.location,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),

                  // Description
                  _buildInfoSection(
                    icon: Icons.description,
                    title: 'Description',
                    content: Text(
                      event.description,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),

                  // Category
                  _buildInfoSection(
                    icon: Icons.category,
                    title: 'Category',
                    content: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getCategoryColor(event.category),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        event.categoryDisplayName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),

                  // Tags
                  if (event.tags.isNotEmpty)
                    _buildInfoSection(
                      icon: Icons.label,
                      title: 'Tags',
                      content: Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: event.tags.map((tag) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.grey[300],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              tag,
                              style: const TextStyle(fontSize: 12),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                  // Registration Info
                  if (event.registrationRequired)
                    _buildInfoSection(
                      icon: Icons.how_to_reg,
                      title: 'Registration',
                      content: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Registration Required',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color:
                                  event.canRegister ? Colors.green : Colors.red,
                            ),
                          ),
                          if (event.registrationDeadline != null)
                            Text(
                              'Deadline: ${_formatDateTime(event.registrationDeadline!)}',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 14,
                              ),
                            ),
                          if (event.maxAttendees != null)
                            Text(
                              'Max Attendees: ${event.maxAttendees}',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 14,
                              ),
                            ),
                        ],
                      ),
                    ),

                  // Contact Information
                  if (event.contactEmail != null || event.contactPhone != null)
                    _buildInfoSection(
                      icon: Icons.contact_mail,
                      title: 'Contact',
                      content: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (event.contactEmail != null)
                            InkWell(
                              onTap: () => _launchEmail(event.contactEmail!),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.email,
                                    size: 16,
                                    color: Colors.blue,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    event.contactEmail!,
                                    style: const TextStyle(
                                      color: Colors.blue,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          if (event.contactPhone != null)
                            InkWell(
                              onTap: () => _launchPhone(event.contactPhone!),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.phone,
                                    size: 16,
                                    color: Colors.blue,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    event.contactPhone!,
                                    style: const TextStyle(
                                      color: Colors.blue,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),

                  // Created Info
                  if (event.createdAt != null)
                    _buildInfoSection(
                      icon: Icons.info,
                      title: 'Event Info',
                      content: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Created: ${_formatDateTime(event.createdAt!)}',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                          if (event.approvedAt != null)
                            Text(
                              'Approved: ${_formatDateTime(event.approvedAt!)}',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 14,
                              ),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _saveToCalendar(context),
        icon: const Icon(Icons.calendar_today),
        label: const Text('Save to Calendar'),
      ),
    );
  }

  Widget _buildInfoSection({
    required IconData icon,
    required String title,
    required Widget content,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 24,
            color: Colors.grey[600],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                content,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip() {
    Color color;
    String text;

    if (widget.event.isOngoing) {
      color = Colors.green;
      text = 'Ongoing';
    } else if (widget.event.isUpcoming) {
      color = Colors.blue;
      text = 'Upcoming';
    } else {
      color = Colors.grey;
      text = 'Past';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Color _getEventTypeColor(String eventType) {
    switch (eventType) {
      case 'university':
        return Colors.purple;
      case 'club':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Color _getCategoryColor(String category) {
    switch (category) {
      case 'academic':
        return Colors.blue;
      case 'cultural':
        return Colors.pink;
      case 'sports':
        return Colors.green;
      case 'workshop':
        return Colors.orange;
      case 'seminar':
        return Colors.purple;
      case 'social':
        return Colors.teal;
      default:
        return Colors.grey;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} at ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);

    if (hours > 0) {
      return '$hours hour${hours > 1 ? 's' : ''}${minutes > 0 ? ' $minutes min' : ''}';
    } else {
      return '$minutes minutes';
    }
  }

  void _shareEvent(BuildContext context) {
    final eventText = '''
${widget.event.title}

📅 ${_formatDateTime(widget.event.startDateTime)}
📍 ${widget.event.location}
👥 ${widget.event.organizer}

${widget.event.description}

#KDUEvents #${widget.event.categoryDisplayName}
''';

    Clipboard.setData(ClipboardData(text: eventText));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Event details copied to clipboard!'),
      ),
    );
  }

  void _launchEmail(String email) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: email,
      query:
          'subject=${Uri.encodeComponent('Regarding ${widget.event.title}')}',
    );

    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    }
  }

  void _launchPhone(String phone) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phone);

    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    }
  }

  void _saveToCalendar(BuildContext context) {
    final calendar.Event calendarEvent = calendar.Event(
      title: widget.event.title,
      description:
          '${widget.event.description}\n\nOrganizer: ${widget.event.organizer}',
      location: widget.event.location,
      startDate: widget.event.startDateTime,
      endDate: widget.event.endDateTime,
      allDay: false,
    );

    calendar.Add2Calendar.addEvent2Cal(calendarEvent).then((success) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Event saved to calendar!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to save event to calendar'),
            backgroundColor: Colors.red,
          ),
        );
      }
    });
  }
}
