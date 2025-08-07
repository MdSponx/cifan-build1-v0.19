import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { useNotificationHelpers } from '../ui/NotificationContext';
import ActivitiesGallery from './ActivitiesGallery';
import ActivitiesForm from './ActivitiesForm';
import { Activity, ActivityFormData } from '../../types/activities';
import { activitiesService } from '../../services/activitiesService';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';

interface ActivitiesRouterProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const ActivitiesRouter: React.FC<ActivitiesRouterProps> = ({
  currentRoute,
  onNavigate
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user } = useAuth();
  const { showLoading, updateToSuccess, updateToError } = useNotificationHelpers();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State management
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content translations
  const content = {
    th: {
      loading: 'กำลังโหลด...',
      error: 'เกิดข้อผิดพลาด',
      backToGallery: 'กลับไปยังแกลเลอรี่',
      createActivity: 'สร้างกิจกรรมใหม่',
      editActivity: 'แก้ไขกิจกรรม',
      activityNotFound: 'ไม่พบกิจกรรม',
      savingActivity: 'กำลังบันทึกกิจกรรม...',
      activitySaved: 'บันทึกกิจกรรมเรียบร้อยแล้ว',
      activityCreated: 'สร้างกิจกรรมเรียบร้อยแล้ว',
      activityUpdated: 'อัปเดตกิจกรรมเรียบร้อยแล้ว'
    },
    en: {
      loading: 'Loading...',
      error: 'An error occurred',
      backToGallery: 'Back to Gallery',
      createActivity: 'Create New Activity',
      editActivity: 'Edit Activity',
      activityNotFound: 'Activity not found',
      savingActivity: 'Saving activity...',
      activitySaved: 'Activity saved successfully',
      activityCreated: 'Activity created successfully',
      activityUpdated: 'Activity updated successfully'
    }
  };

  const currentContent = content[currentLanguage];

  // Parse current route to determine view and parameters
  const parseRoute = (route: string) => {
    const parts = route.split('/');
    
    if (parts.length === 2 && parts[1] === 'activities') {
      return { view: 'gallery', filter: null, activityId: null };
    }
    
    if (parts.length === 3) {
      const action = parts[2];
      
      switch (action) {
        case 'create':
          return { view: 'create', filter: null, activityId: null };
        case 'workshops':
          return { view: 'gallery', filter: 'workshop', activityId: null };
        case 'screenings':
          return { view: 'gallery', filter: 'screening', activityId: null };
        case 'ceremonies':
          return { view: 'gallery', filter: 'ceremony', activityId: null };
        default:
          return { view: 'gallery', filter: null, activityId: null };
      }
    }
    
    if (parts.length === 4 && parts[2] === 'edit') {
      return { view: 'edit', filter: null, activityId: parts[3] };
    }
    
    return { view: 'gallery', filter: null, activityId: null };
  };

  const { view, filter, activityId } = parseRoute(currentRoute);

  // Load activities on mount
  useEffect(() => {
    loadActivities();
  }, []);

  // Load specific activity for editing
  useEffect(() => {
    if (view === 'edit' && activityId) {
      loadActivity(activityId);
    } else {
      setCurrentActivity(null);
    }
  }, [view, activityId]);

  // Load all activities
  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await activitiesService.getActivities();
      setActivities(response.activities);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(currentContent.error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific activity
  const loadActivity = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const activity = await activitiesService.getActivityById(id);
      setCurrentActivity(activity);
    } catch (err) {
      console.error('Error loading activity:', err);
      setError(currentContent.activityNotFound);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (formData: ActivityFormData) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    // Show loading notification
    const notificationId = showLoading(
      currentContent.savingActivity,
      view === 'create' ? 'Creating new activity...' : 'Updating activity...'
    );

    try {
      setIsLoading(true);
      setError(null);

      let savedActivity: Activity;

      if (view === 'create') {
        savedActivity = await activitiesService.createActivity(formData, user.uid);
        setActivities(prev => [savedActivity, ...prev]);
        
        // Update notification to success
        updateToSuccess(
          notificationId,
          currentContent.activityCreated,
          `Activity "${savedActivity.name}" has been created successfully`
        );
      } else if (view === 'edit' && currentActivity) {
        savedActivity = await activitiesService.updateActivity(currentActivity.id, formData, user.uid);
        setActivities(prev => prev.map(a => a.id === savedActivity.id ? savedActivity : a));
        
        // Update notification to success
        updateToSuccess(
          notificationId,
          currentContent.activityUpdated,
          `Activity "${savedActivity.name}" has been updated successfully`
        );
      } else {
        throw new Error('Invalid form submission state');
      }

      // Navigate back to gallery after a short delay to show success message
      setTimeout(() => {
        onNavigate('admin/activities');
      }, 1500);
    } catch (err) {
      console.error('Error saving activity:', err);
      const errorMessage = err instanceof Error ? err.message : currentContent.error;
      setError(errorMessage);
      
      // Update notification to error
      updateToError(
        notificationId,
        'Failed to save activity',
        errorMessage
      );
      
      throw err; // Re-throw to let form handle the error
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    onNavigate('admin/activities');
  };

  // Handle navigation from gallery
  const handleGalleryNavigate = (route: string) => {
    onNavigate(route);
  };

  // Filter activities based on current filter
  const getFilteredActivities = () => {
    if (!filter) return activities;
    
    return activities.filter(activity => 
      activity.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
    );
  };

  // Loading state
  if (isLoading && (view === 'edit' && !currentActivity)) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="glass-container rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FCB283] mx-auto mb-4" />
          <p className={`${getClass('body')} text-white/80`}>
            {currentContent.loading}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && (view === 'edit' && !currentActivity)) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="glass-container rounded-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <ArrowLeft className="w-8 h-8 text-red-400" />
          </div>
          
          <h2 className={`text-xl ${getClass('header')} text-white mb-4`}>
            {error}
          </h2>
          
          <AnimatedButton
            variant="primary"
            size="medium"
            onClick={() => onNavigate('admin/activities')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentContent.backToGallery}
          </AnimatedButton>
        </div>
      </div>
    );
  }

  // Render based on current view
  switch (view) {
    case 'create':
      return (
        <ActivitiesForm
          mode="create"
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isLoading}
        />
      );

    case 'edit':
      if (!currentActivity && !isLoading) {
        return (
          <div className="flex items-center justify-center min-h-96">
            <div className="glass-container rounded-xl p-8 text-center max-w-md">
              <h2 className={`text-xl ${getClass('header')} text-white mb-4`}>
                {currentContent.activityNotFound}
              </h2>
              
              <AnimatedButton
                variant="primary"
                size="medium"
                onClick={() => onNavigate('admin/activities')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentContent.backToGallery}
              </AnimatedButton>
            </div>
          </div>
        );
      }

      return (
        <ActivitiesForm
          activity={currentActivity}
          mode="edit"
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isLoading}
        />
      );

    case 'gallery':
    default:
      return (
        <ActivitiesGallery
          activities={getFilteredActivities()}
          filter={filter}
          onNavigate={handleGalleryNavigate}
          onRefresh={loadActivities}
          isLoading={isLoading}
        />
      );
  }
};

export default ActivitiesRouter;
