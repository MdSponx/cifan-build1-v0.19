export interface Activity {
  id: string;
  
  // Overview
  image?: string;
  name: string;
  shortDescription: string;
  status: ActivityStatus;
  isPublic: boolean;
  needSubmission: boolean; // New field for registration requirement
  maxParticipants: number;
  
  // Date and Venue
  isOneDayActivity: boolean; // New field for one day activities
  eventDate: string; // ISO date string (start date)
  eventEndDate?: string; // ISO date string (end date for multi-day events)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  registrationDeadline: string; // ISO date string
  venueName: string;
  venueLocation?: string; // URL to location or address
  
  // Detail
  description: string;
  organizers: string[];
  
  // Tags
  tags: string[];
  
  // Contact
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  
  // System fields
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // User UID
  updatedBy: string; // User UID
  
  // Statistics (optional)
  registeredParticipants?: number;
  waitlistCount?: number;
  views?: number;
}

export type ActivityStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface ActivityTag {
  id: string;
  en: string;
  th: string;
  category?: 'type' | 'format' | 'audience' | 'custom';
}

export interface ActivityFormData {
  // Overview
  image: File | null;
  name: string;
  shortDescription: string;
  status: ActivityStatus;
  isPublic: boolean;
  needSubmission: boolean; // New field for registration requirement
  maxParticipants: number;
  
  // Date and Venue
  isOneDayActivity: boolean; // New field for one day activities
  eventDate: string; // ISO date string (start date)
  eventEndDate: string; // ISO date string (end date for multi-day events)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  registrationDeadline: string; // ISO date string
  venueName: string;
  venueLocation: string;
  
  // Detail
  description: string;
  organizers: string[];
  
  // Tags
  tags: string[];
  
  // Contact
  contactEmail: string;
  contactName: string;
  contactPhone: string;
}

export interface ActivityFilters {
  search?: string;
  status?: ActivityStatus | 'all';
  tags?: string[];
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  isPublic?: boolean;
  hasAvailableSpots?: boolean;
  organizer?: string;
}

export interface ActivitySortOptions {
  field: 'name' | 'eventDate' | 'createdAt' | 'updatedAt' | 'status' | 'registeredParticipants' | 'maxParticipants';
  direction: 'asc' | 'desc';
}

// Default activity tags with Thai/English labels
export const DEFAULT_ACTIVITY_TAGS: ActivityTag[] = [
  // Event Types
  { id: 'panel', en: 'Panel Discussion', th: 'แผงอภิปราย', category: 'type' },
  { id: 'workshop', en: 'Workshop', th: 'เวิร์กช็อป', category: 'type' },
  { id: 'masterclass', en: 'Masterclass', th: 'คลาสพิเศษ', category: 'type' },
  { id: 'talk', en: 'Talk', th: 'การบรรยาย', category: 'type' },
  { id: 'seminar', en: 'Seminar', th: 'สัมมนา', category: 'type' },
  { id: 'networking', en: 'Networking', th: 'การเชื่อมโยงเครือข่าย', category: 'type' },
  { id: 'ceremony', en: 'Ceremony', th: 'พิธีการ', category: 'type' },
  { id: 'concert', en: 'Concert', th: 'คอนเสิร์ต', category: 'type' },
  { id: 'exhibition', en: 'Exhibition', th: 'นิทรรศการ', category: 'type' },
  
  // Film-related Events
  { id: 'screening', en: 'Film Screening', th: 'การฉายภาพยนตร์', category: 'format' },
  { id: 'short-film', en: 'Short Film Event', th: 'งานหนังสั้น', category: 'format' },
  { id: 'feature-film', en: 'Feature Film Event', th: 'งานหนังยาว', category: 'format' },
  { id: 'documentary', en: 'Documentary Event', th: 'งานสารคดี', category: 'format' },
  { id: 'animation', en: 'Animation Event', th: 'งานแอนิเมชัน', category: 'format' },
  { id: 'competition', en: 'Competition', th: 'การแข่งขัน', category: 'format' },
  { id: 'awards', en: 'Awards Ceremony', th: 'พิธีมอบรางวัล', category: 'type' },
  
  // Audience Types
  { id: 'youth', en: 'Youth Event', th: 'กิจกรรมเยาวชน', category: 'audience' },
  { id: 'students', en: 'Students', th: 'นักเรียน/นักศึกษา', category: 'audience' },
  { id: 'professionals', en: 'Professionals', th: 'มืออาชีพ', category: 'audience' },
  { id: 'general-public', en: 'General Public', th: 'ประชาชนทั่วไป', category: 'audience' },
  { id: 'industry', en: 'Industry', th: 'วงการภาพยนตร์', category: 'audience' },
  
  // Special Categories
  { id: 'vip', en: 'VIP Event', th: 'งานวีไอพี', category: 'custom' },
  { id: 'free', en: 'Free Event', th: 'งานฟรี', category: 'custom' },
  { id: 'paid', en: 'Paid Event', th: 'งานเสียค่าใช้จ่าย', category: 'custom' },
  { id: 'online', en: 'Online Event', th: 'งานออนไลน์', category: 'custom' },
  { id: 'hybrid', en: 'Hybrid Event', th: 'งานแบบผสม', category: 'custom' }
];

// Status options with labels and colors
export const ACTIVITY_STATUS_OPTIONS = [
  { 
    value: 'draft' as ActivityStatus, 
    label: 'Draft', 
    labelTh: 'ร่าง', 
    color: 'gray',
    description: 'Event is being prepared',
    descriptionTh: 'กำลังเตรียมงาน'
  },
  { 
    value: 'published' as ActivityStatus, 
    label: 'Published', 
    labelTh: 'เผยแพร่แล้ว', 
    color: 'green',
    description: 'Event is live and accepting registrations',
    descriptionTh: 'งานเปิดให้ลงทะเบียนแล้ว'
  },
  { 
    value: 'cancelled' as ActivityStatus, 
    label: 'Cancelled', 
    labelTh: 'ยกเลิก', 
    color: 'red',
    description: 'Event has been cancelled',
    descriptionTh: 'งานถูกยกเลิก'
  },
  { 
    value: 'completed' as ActivityStatus, 
    label: 'Completed', 
    labelTh: 'เสร็จสิ้น', 
    color: 'blue',
    description: 'Event has finished',
    descriptionTh: 'งานเสร็จสิ้นแล้ว'
  }
];

// API Response types
export interface ActivityListResponse {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ActivityCreateRequest {
  activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
  imageFile?: File;
}

export interface ActivityUpdateRequest {
  id: string;
  activity: Partial<Omit<Activity, 'id' | 'createdAt' | 'createdBy'>>;
  imageFile?: File;
}

export interface ActivityDeleteRequest {
  id: string;
}

export interface BulkActivityRequest {
  activityIds: string[];
  action: 'delete' | 'publish' | 'unpublish' | 'duplicate' | 'cancel' | 'complete';
  updates?: Partial<ActivityFormData>;
}

// Component Props types
export interface ActivitiesFormProps {
  activity?: Activity;
  onSubmit: (formData: ActivityFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  errors?: ActivityValidationErrors;
}

export interface ActivitiesGalleryProps {
  activities?: Activity[];
  onCreateNew: () => void;
  onEditActivity: (activity: Activity) => void;
  onViewActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onDuplicateActivity: (activity: Activity) => void;
  onBulkAction: (activityIds: string[], action: string) => void;
  isLoading?: boolean;
  filters?: ActivityFilters;
  onFiltersChange?: (filters: ActivityFilters) => void;
}

export interface ActivityCardProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onView: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onDuplicate: (activity: Activity) => void;
  onSelect?: (activityId: string, selected: boolean) => void;
  isSelected?: boolean;
  showActions?: boolean;
  showBulkSelect?: boolean;
  language?: 'en' | 'th';
}

export interface ActivityFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  availableTags: ActivityTag[];
  onReset: () => void;
  isLoading?: boolean;
}

// Validation types
export interface ActivityValidationErrors {
  name?: string;
  shortDescription?: string;
  eventDate?: string;
  eventEndDate?: string;
  startTime?: string;
  endTime?: string;
  registrationDeadline?: string;
  venueName?: string;
  venueLocation?: string;
  description?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  maxParticipants?: string;
  image?: string;
  organizers?: string;
  tags?: string;
  general?: string;
}

// Hook types
export interface UseActivitiesReturn {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: ActivityFilters;
  sortOptions: ActivitySortOptions;
  
  // Actions
  fetchActivities: () => Promise<void>;
  createActivity: (formData: ActivityFormData) => Promise<Activity>;
  updateActivity: (id: string, formData: Partial<ActivityFormData>) => Promise<Activity>;
  deleteActivity: (id: string) => Promise<void>;
  duplicateActivity: (activity: Activity) => Promise<Activity>;
  bulkActions: (activityIds: string[], action: string) => Promise<void>;
  
  // Filters and sorting
  setFilters: (filters: ActivityFilters) => void;
  setSortOptions: (sortOptions: ActivitySortOptions) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;
  refreshData: () => Promise<void>;
}

// Analytics types
export interface ActivityAnalytics {
  totalActivities: number;
  activitiesByStatus: Record<ActivityStatus, number>;
  totalParticipants: number;
  averageParticipantsPerEvent: number;
  upcomingEvents: number;
  completedEvents: number;
  popularTags: Array<{ tag: string; count: number }>;
  monthlyTrends: Array<{
    month: string;
    eventsCreated: number;
    eventsCompleted: number;
    totalParticipants: number;
  }>;
}

// Database/Firestore document structure
export interface ActivityFirestoreDoc {
  id: string;
  name: string;
  shortDescription: string;
  status: ActivityStatus;
  isPublic: boolean;
  needSubmission: boolean; // New field for registration requirement
  maxParticipants: number;
  isOneDayActivity: boolean; // New field for one day activities
  eventDate: string; // ISO date string (start date)
  eventEndDate?: string; // ISO date string (end date for multi-day events)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  registrationDeadline: string; // ISO date string
  venueName: string;
  venueLocation?: string;
  description: string;
  organizers: string[];
  tags: string[];
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  imageUrl?: string;
  imagePath?: string; // Firebase Storage path for cleanup
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  createdBy: string; // User UID
  updatedBy: string; // User UID
  registeredParticipants?: number;
  waitlistCount?: number;
  views?: number;
}

// Utility types
export interface ActivitySearchResult {
  activities: Activity[];
  totalResults: number;
  searchTerm: string;
  suggestions?: string[];
}

export interface ActivityExportData {
  activity: Activity;
  participantCount: number;
  registrationStatus: 'open' | 'closed' | 'full';
  daysUntilEvent: number;
}

// Form validation helpers
export const ACTIVITY_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  shortDescription: {
    required: true,
    minLength: 10,
    maxLength: 200
  },
  description: {
    required: true,
    minLength: 50,
    maxLength: 2000
  },
  maxParticipants: {
    required: true,
    min: 1,
    max: 10000
  },
  contactEmail: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  contactPhone: {
    required: true,
    minLength: 8,
    maxLength: 15
  },
  organizers: {
    required: true,
    minItems: 1,
    maxItems: 10
  },
  tags: {
    required: false,
    maxItems: 8
  },
  image: {
    required: false,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
};
