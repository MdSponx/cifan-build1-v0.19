import { useState, useCallback } from 'react';
import { Activity, ActivityFormData, ActivityStatus } from '../types/activities';
import { activitiesService } from '../services/activitiesService';
import { useAuth } from '../components/auth/AuthContext';

interface UseActivityFormOptions {
  activityId?: string;
  initialData?: Partial<ActivityFormData>;
  onSuccess?: (activity: Activity) => void;
  onError?: (error: string) => void;
}

interface UseActivityFormReturn {
  formData: ActivityFormData;
  isSubmitting: boolean;
  error: string | null;
  isDirty: boolean;
  updateField: <K extends keyof ActivityFormData>(field: K, value: ActivityFormData[K]) => void;
  updateFields: (updates: Partial<ActivityFormData>) => void;
  resetForm: () => void;
  submitForm: () => Promise<Activity | null>;
  validateForm: () => { isValid: boolean; errors: Record<string, string> };
  setFormData: (data: ActivityFormData) => void;
}

const getInitialFormData = (): ActivityFormData => ({
  image: null,
  name: '',
  shortDescription: '',
  status: 'draft',
  isPublic: false,
  maxParticipants: 0,
  eventDate: '',
  startTime: '',
  endTime: '',
  registrationDeadline: '',
  venueName: '',
  venueLocation: '',
  description: '',
  organizers: [],
  tags: [],
  contactEmail: '',
  contactName: '',
  contactPhone: ''
});

export const useActivityForm = (options: UseActivityFormOptions = {}): UseActivityFormReturn => {
  const { activityId, initialData, onSuccess, onError } = options;
  const { user } = useAuth();

  // Initialize form data
  const [formData, setFormData] = useState<ActivityFormData>(() => ({
    ...getInitialFormData(),
    ...initialData
  }));

  const [originalData] = useState<ActivityFormData>(() => ({
    ...getInitialFormData(),
    ...initialData
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if form has been modified
  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Update single field
  const updateField = useCallback(<K extends keyof ActivityFormData>(
    field: K, 
    value: ActivityFormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error]);

  // Update multiple fields
  const updateFields = useCallback((updates: Partial<ActivityFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  }, [error]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData({
      ...getInitialFormData(),
      ...initialData
    });
    setError(null);
  }, [initialData]);

  // Set entire form data
  const setFormDataCallback = useCallback((data: ActivityFormData) => {
    setFormData(data);
    setError(null);
  }, []);

  // Form validation
  const validateForm = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name.trim()) {
      errors.name = 'Activity name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Activity name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Activity name must be less than 100 characters';
    }

    if (!formData.shortDescription.trim()) {
      errors.shortDescription = 'Short description is required';
    } else if (formData.shortDescription.trim().length < 10) {
      errors.shortDescription = 'Short description must be at least 10 characters';
    } else if (formData.shortDescription.trim().length > 200) {
      errors.shortDescription = 'Short description must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Full description is required';
    } else if (formData.description.trim().length < 50) {
      errors.description = 'Full description must be at least 50 characters';
    }

    if (!formData.eventDate) {
      errors.eventDate = 'Event date is required';
    } else {
      const eventDate = new Date(formData.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        errors.eventDate = 'Event date cannot be in the past';
      }
    }

    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }

    // Validate time range
    if (formData.startTime && formData.endTime) {
      const startTime = new Date(`2000-01-01T${formData.startTime}`);
      const endTime = new Date(`2000-01-01T${formData.endTime}`);
      
      if (endTime <= startTime) {
        errors.endTime = 'End time must be after start time';
      }
    }

    if (!formData.registrationDeadline) {
      errors.registrationDeadline = 'Registration deadline is required';
    } else if (formData.eventDate) {
      const regDeadline = new Date(formData.registrationDeadline);
      const eventDate = new Date(formData.eventDate);
      
      if (regDeadline >= eventDate) {
        errors.registrationDeadline = 'Registration deadline must be before event date';
      }
    }

    if (!formData.venueName.trim()) {
      errors.venueName = 'Venue name is required';
    } else if (formData.venueName.trim().length < 3) {
      errors.venueName = 'Venue name must be at least 3 characters';
    }

    if (formData.maxParticipants < 0) {
      errors.maxParticipants = 'Maximum participants cannot be negative';
    } else if (formData.maxParticipants > 10000) {
      errors.maxParticipants = 'Maximum participants cannot exceed 10,000';
    }

    if (formData.organizers.length === 0) {
      errors.organizers = 'At least one organizer is required';
    }

    if (formData.tags.length === 0) {
      errors.tags = 'At least one tag is required';
    } else if (formData.tags.length > 10) {
      errors.tags = 'Maximum 10 tags allowed';
    }

    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail.trim())) {
        errors.contactEmail = 'Please enter a valid email address';
      }
    }

    if (!formData.contactName.trim()) {
      errors.contactName = 'Contact name is required';
    } else if (formData.contactName.trim().length < 2) {
      errors.contactName = 'Contact name must be at least 2 characters';
    }

    // Optional phone validation
    if (formData.contactPhone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.contactPhone.trim().replace(/[\s\-\(\)]/g, ''))) {
        errors.contactPhone = 'Please enter a valid phone number';
      }
    }

    // Venue location validation (optional but if provided, should be valid URL)
    if (formData.venueLocation?.trim()) {
      try {
        new URL(formData.venueLocation.trim());
      } catch {
        errors.venueLocation = 'Please enter a valid URL for venue location';
      }
    }

    // Image validation
    if (formData.image) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (formData.image.size > maxSize) {
        errors.image = 'Image file size must be less than 5MB';
      }

      if (!allowedTypes.includes(formData.image.type)) {
        errors.image = 'Only JPEG, PNG, and WebP images are allowed';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [formData]);

  // Submit form
  const submitForm = useCallback(async (): Promise<Activity | null> => {
    if (!user) {
      const errorMsg = 'User must be authenticated to create/update activities';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    }

    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      onError?.(firstError);
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let result: Activity;

      if (activityId) {
        // Update existing activity
        result = await activitiesService.updateActivity(activityId, formData, user.uid);
      } else {
        // Create new activity
        result = await activitiesService.createActivity(formData, user.uid);
      }

      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save activity';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, activityId, validateForm, onSuccess, onError]);

  return {
    formData,
    isSubmitting,
    error,
    isDirty,
    updateField,
    updateFields,
    resetForm,
    submitForm,
    validateForm,
    setFormData: setFormDataCallback
  };
};

// Helper hook for loading existing activity data into form
interface UseActivityFormLoaderOptions {
  activityId: string;
  onLoad?: (activity: Activity) => void;
  onError?: (error: string) => void;
}

interface UseActivityFormLoaderReturn {
  isLoading: boolean;
  error: string | null;
  activity: Activity | null;
  loadActivity: () => Promise<void>;
}

export const useActivityFormLoader = (options: UseActivityFormLoaderOptions): UseActivityFormLoaderReturn => {
  const { activityId, onLoad, onError } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);

  const loadActivity = useCallback(async () => {
    if (!activityId) return;

    try {
      setIsLoading(true);
      setError(null);

      const activityData = await activitiesService.getActivityById(activityId);
      
      if (!activityData) {
        throw new Error('Activity not found');
      }

      setActivity(activityData);
      onLoad?.(activityData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load activity';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [activityId, onLoad, onError]);

  return {
    isLoading,
    error,
    activity,
    loadActivity
  };
};

// Helper function to convert Activity to ActivityFormData
export const activityToFormData = (activity: Activity): ActivityFormData => ({
  image: null, // Image file is not stored, only URL
  name: activity.name,
  shortDescription: activity.shortDescription,
  status: activity.status,
  isPublic: activity.isPublic,
  maxParticipants: activity.maxParticipants,
  eventDate: activity.eventDate,
  startTime: activity.startTime,
  endTime: activity.endTime,
  registrationDeadline: activity.registrationDeadline,
  venueName: activity.venueName,
  venueLocation: activity.venueLocation || '',
  description: activity.description,
  organizers: [...activity.organizers],
  tags: [...activity.tags],
  contactEmail: activity.contactEmail,
  contactName: activity.contactName,
  contactPhone: activity.contactPhone
});

export default useActivityForm;
