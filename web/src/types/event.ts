export interface Event {
  id: string;
  title: string;
  description: string;
  organizer: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  category: 'academic' | 'cultural' | 'sports' | 'workshop' | 'seminar' | 'social' | 'other';
  isApproved: boolean;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  rejectedBy?: {
    id: string;
    name: string;
    email: string;
  };
  rejectedAt?: string;
  rejectionReason?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  maxAttendees?: number;
  registrationRequired: boolean;
  registrationDeadline?: string;
  eventType: 'university' | 'club';
  tags: string[];
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  isPublic: boolean;
  attendees: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  organizer: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  category?: 'academic' | 'cultural' | 'sports' | 'workshop' | 'seminar' | 'social' | 'other';
  eventType: 'university' | 'club';
  maxAttendees?: number;
  registrationRequired?: boolean;
  registrationDeadline?: string;
  contactEmail?: string;
  contactPhone?: string;
  isPublic?: boolean;
  tags?: string[];
  imageUrl?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export interface EventsResponse {
  events: Event[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEvents: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AdminEventsResponse extends EventsResponse {
  statistics: {
    totalEvents: number;
    approvedEvents: number;
    pendingEvents: number;
    rejectedEvents: number;
  };
}

export interface EventStatistics {
  overview: {
    totalEvents: number;
    approvedEvents: number;
    pendingEvents: number;
    rejectedEvents: number;
    upcomingEvents: number;
    thisMonthEvents: number;
  };
  categoryStats: Array<{
    _id: string;
    count: number;
  }>;
  eventTypeStats: Array<{
    _id: string;
    count: number;
  }>;
  viewStats?: {
    totalViews: number;
    avgViewsPerEvent: number;
    mostViewedEvent: number;
  };
}

export interface EventFilters {
  page?: number;
  limit?: number;
  status?: 'approved' | 'pending' | 'rejected' | 'all';
  category?: string;
  eventType?: string;
  search?: string;
  upcoming?: boolean;
  startDate?: string;
  endDate?: string;
}
