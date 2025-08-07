import { useState, useEffect, useCallback } from 'react';
import { Activity, ActivityFilters, ActivitySortOptions } from '../types/activities';
import { activitiesService } from '../services/activitiesService';

interface UseActivitiesOptions {
  filters?: ActivityFilters;
  sortBy?: ActivitySortOptions;
  page?: number;
  limit?: number;
  autoLoad?: boolean;
}

interface UseActivitiesReturn {
  activities: Activity[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadActivities: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  updateActivity: (activityId: string, updates: Partial<Activity>) => void;
  removeActivity: (activityId: string) => void;
  addActivity: (activity: Activity) => void;
}

export const useActivities = (options: UseActivitiesOptions = {}): UseActivitiesReturn => {
  const {
    filters,
    sortBy,
    page = 1,
    limit = 10,
    autoLoad = true
  } = options;

  // State management
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const totalPages = Math.ceil(totalCount / limit);
  const hasMore = currentPage < totalPages;

  // Load activities function
  const loadActivities = useCallback(async (pageToLoad = 1, append = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await activitiesService.getActivities(
        filters,
        sortBy,
        pageToLoad,
        limit
      );

      if (append) {
        setActivities(prev => [...prev, ...response.activities]);
      } else {
        setActivities(response.activities);
      }

      setTotalCount(response.total);
      setCurrentPage(pageToLoad);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortBy, limit]);

  // Load more activities (pagination)
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await loadActivities(currentPage + 1, true);
    }
  }, [hasMore, isLoading, currentPage, loadActivities]);

  // Refresh activities
  const refresh = useCallback(async () => {
    setCurrentPage(1);
    await loadActivities(1, false);
  }, [loadActivities]);

  // Update activity in local state
  const updateActivity = useCallback((activityId: string, updates: Partial<Activity>) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId
          ? { ...activity, ...updates }
          : activity
      )
    );
  }, []);

  // Remove activity from local state
  const removeActivity = useCallback((activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
    setTotalCount(prev => prev - 1);
  }, []);

  // Add activity to local state
  const addActivity = useCallback((activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
    setTotalCount(prev => prev + 1);
  }, []);

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadActivities(1, false);
    }
  }, [autoLoad, loadActivities]);

  return {
    activities,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    error,
    hasMore,
    loadActivities: () => loadActivities(1, false),
    loadMore,
    refresh,
    updateActivity,
    removeActivity,
    addActivity
  };
};

// Hook for single activity
interface UseActivityOptions {
  activityId: string;
  autoLoad?: boolean;
}

interface UseActivityReturn {
  activity: Activity | null;
  isLoading: boolean;
  error: string | null;
  loadActivity: () => Promise<void>;
  updateActivity: (updates: Partial<Activity>) => void;
  refresh: () => Promise<void>;
}

export const useActivity = (options: UseActivityOptions): UseActivityReturn => {
  const { activityId, autoLoad = true } = options;

  // State management
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load single activity
  const loadActivity = useCallback(async () => {
    if (!activityId) return;

    try {
      setIsLoading(true);
      setError(null);

      const activityData = await activitiesService.getActivityById(activityId);
      setActivity(activityData);
    } catch (err) {
      console.error('Error loading activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity');
      setActivity(null);
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  // Update activity in local state
  const updateActivity = useCallback((updates: Partial<Activity>) => {
    setActivity(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Refresh activity
  const refresh = useCallback(async () => {
    await loadActivity();
  }, [loadActivity]);

  // Auto-load on mount and when activityId changes
  useEffect(() => {
    if (autoLoad && activityId) {
      loadActivity();
    }
  }, [autoLoad, activityId, loadActivity]);

  return {
    activity,
    isLoading,
    error,
    loadActivity,
    updateActivity,
    refresh
  };
};

// Hook for public activities (homepage, public listing)
interface UsePublicActivitiesOptions {
  limit?: number;
  tags?: string[];
  autoLoad?: boolean;
}

interface UsePublicActivitiesReturn {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  loadActivities: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const usePublicActivities = (options: UsePublicActivitiesOptions = {}): UsePublicActivitiesReturn => {
  const { limit = 6, tags = [], autoLoad = true } = options;

  // State management
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load public activities
  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const publicActivities = await activitiesService.getPublicActivities(limit);
      setActivities(publicActivities);
    } catch (err) {
      console.error('Error loading public activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [limit, tags]);

  // Refresh activities
  const refresh = useCallback(async () => {
    await loadActivities();
  }, [loadActivities]);

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadActivities();
    }
  }, [autoLoad, loadActivities]);

  return {
    activities,
    isLoading,
    error,
    loadActivities,
    refresh
  };
};

// Hook for activity statistics
interface UseActivityStatsReturn {
  stats: {
    totalActivities: number;
    totalParticipants: number;
    averageParticipantsPerEvent: number;
    upcomingEvents: number;
    completedEvents: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  loadStats: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useActivityStats = (autoLoad = true): UseActivityStatsReturn => {
  // State management
  const [stats, setStats] = useState<UseActivityStatsReturn['stats']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load activity statistics
  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const statsData = await activitiesService.getActivityAnalytics();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading activity stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh statistics
  const refresh = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadStats();
    }
  }, [autoLoad, loadStats]);

  return {
    stats,
    isLoading,
    error,
    loadStats,
    refresh
  };
};

export default useActivities;
