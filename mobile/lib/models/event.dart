class Event {
  final String? id;
  final String title;
  final String description;
  final String organizer;
  final String location;
  final DateTime startDateTime;
  final DateTime endDateTime;
  final String category;
  final bool isApproved;
  final String? approvedBy;
  final DateTime? approvedAt;
  final String? rejectedBy;
  final DateTime? rejectedAt;
  final String? rejectionReason;
  final String createdBy;
  final int? maxAttendees;
  final bool registrationRequired;
  final DateTime? registrationDeadline;
  final String eventType;
  final List<String> tags;
  final String? imageUrl;
  final String? contactEmail;
  final String? contactPhone;
  final bool isPublic;
  final List<String> attendees;
  final int? viewCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Event({
    this.id,
    required this.title,
    required this.description,
    required this.organizer,
    required this.location,
    required this.startDateTime,
    required this.endDateTime,
    required this.category,
    this.isApproved = false,
    this.approvedBy,
    this.approvedAt,
    this.rejectedBy,
    this.rejectedAt,
    this.rejectionReason,
    required this.createdBy,
    this.maxAttendees,
    this.registrationRequired = false,
    this.registrationDeadline,
    required this.eventType,
    this.tags = const [],
    this.imageUrl,
    this.contactEmail,
    this.contactPhone,
    this.isPublic = true,
    this.attendees = const [],
    this.viewCount,
    this.createdAt,
    this.updatedAt,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] ?? json['_id'],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      organizer: json['organizer'] ?? '',
      location: json['location'] ?? '',
      startDateTime: DateTime.parse(json['startDateTime']).toLocal(),
      endDateTime: DateTime.parse(json['endDateTime']).toLocal(),
      category: json['category'] ?? 'other',
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
      createdBy: json['createdBy'] is Map
          ? json['createdBy']['name'] ?? ''
          : json['createdBy'] ?? '',
      maxAttendees: json['maxAttendees'],
      registrationRequired: json['registrationRequired'] ?? false,
      registrationDeadline: json['registrationDeadline'] != null
          ? DateTime.parse(json['registrationDeadline']).toLocal()
          : null,
      eventType: json['eventType'] ?? 'other',
      tags: json['tags'] != null ? List<String>.from(json['tags']) : [],
      imageUrl: json['imageUrl'],
      contactEmail: json['contactEmail'],
      contactPhone: json['contactPhone'],
      isPublic: json['isPublic'] ?? true,
      attendees:
          json['attendees'] != null ? List<String>.from(json['attendees']) : [],
      viewCount: json['viewCount'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt']).toLocal()
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt']).toLocal()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'organizer': organizer,
      'location': location,
      'startDateTime': startDateTime.toUtc().toIso8601String(),
      'endDateTime': endDateTime.toUtc().toIso8601String(),
      'category': category,
      'isApproved': isApproved,
      'approvedBy': approvedBy,
      'approvedAt': approvedAt?.toUtc().toIso8601String(),
      'rejectedBy': rejectedBy,
      'rejectedAt': rejectedAt?.toUtc().toIso8601String(),
      'rejectionReason': rejectionReason,
      'createdBy': createdBy,
      'maxAttendees': maxAttendees,
      'registrationRequired': registrationRequired,
      'registrationDeadline': registrationDeadline?.toUtc().toIso8601String(),
      'eventType': eventType,
      'tags': tags,
      'imageUrl': imageUrl,
      'contactEmail': contactEmail,
      'contactPhone': contactPhone,
      'isPublic': isPublic,
      'attendees': attendees,
      'viewCount': viewCount,
      'createdAt': createdAt?.toUtc().toIso8601String(),
      'updatedAt': updatedAt?.toUtc().toIso8601String(),
    };
  }

  // Helper methods
  bool get isUpcoming => startDateTime.isAfter(DateTime.now());
  bool get isOngoing =>
      DateTime.now().isAfter(startDateTime) &&
      DateTime.now().isBefore(endDateTime);
  bool get isPast => endDateTime.isBefore(DateTime.now());
  bool get canRegister =>
      registrationRequired &&
      (registrationDeadline?.isAfter(DateTime.now()) ?? true) &&
      isUpcoming;

  String get statusText {
    if (isPast) return 'Past';
    if (isOngoing) return 'Ongoing';
    if (isUpcoming) return 'Upcoming';
    return 'Unknown';
  }

  String get categoryDisplayName {
    switch (category) {
      case 'academic':
        return 'Academic';
      case 'cultural':
        return 'Cultural';
      case 'sports':
        return 'Sports';
      case 'workshop':
        return 'Workshop';
      case 'seminar':
        return 'Seminar';
      case 'social':
        return 'Social';
      default:
        return 'Other';
    }
  }

  String get eventTypeDisplayName {
    switch (eventType) {
      case 'university':
        return 'University';
      case 'club':
        return 'Club';
      default:
        return 'Other';
    }
  }

  Event copyWith({
    String? id,
    String? title,
    String? description,
    String? organizer,
    String? location,
    DateTime? startDateTime,
    DateTime? endDateTime,
    String? category,
    bool? isApproved,
    String? approvedBy,
    DateTime? approvedAt,
    String? rejectedBy,
    DateTime? rejectedAt,
    String? rejectionReason,
    String? createdBy,
    int? maxAttendees,
    bool? registrationRequired,
    DateTime? registrationDeadline,
    String? eventType,
    List<String>? tags,
    String? imageUrl,
    String? contactEmail,
    String? contactPhone,
    bool? isPublic,
    List<String>? attendees,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Event(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      organizer: organizer ?? this.organizer,
      location: location ?? this.location,
      startDateTime: startDateTime ?? this.startDateTime,
      endDateTime: endDateTime ?? this.endDateTime,
      category: category ?? this.category,
      isApproved: isApproved ?? this.isApproved,
      approvedBy: approvedBy ?? this.approvedBy,
      approvedAt: approvedAt ?? this.approvedAt,
      rejectedBy: rejectedBy ?? this.rejectedBy,
      rejectedAt: rejectedAt ?? this.rejectedAt,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      createdBy: createdBy ?? this.createdBy,
      maxAttendees: maxAttendees ?? this.maxAttendees,
      registrationRequired: registrationRequired ?? this.registrationRequired,
      registrationDeadline: registrationDeadline ?? this.registrationDeadline,
      eventType: eventType ?? this.eventType,
      tags: tags ?? this.tags,
      imageUrl: imageUrl ?? this.imageUrl,
      contactEmail: contactEmail ?? this.contactEmail,
      contactPhone: contactPhone ?? this.contactPhone,
      isPublic: isPublic ?? this.isPublic,
      attendees: attendees ?? this.attendees,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'Event(id: $id, title: $title, startDateTime: $startDateTime, category: $category, isApproved: $isApproved)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Event && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
