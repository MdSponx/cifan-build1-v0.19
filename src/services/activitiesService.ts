import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  Timestamp,
  writeBatch,
  QueryDocumentSnapshot,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { 
  Activity, 
  ActivityFormData, 
  ActivityFilters, 
  ActivitySortOptions, 
  ActivityListResponse,
  ActivityFirestoreDoc,
  ActivityAnalytics,
  ActivitySearchResult,
  ActivityStatus
} from '../types/activities';

const ACTIVITIES_COLLECTION = 'activities';
const IMAGES_STORAGE_PATH = 'activities/images';

export class ActivitiesService {
  private static instance: ActivitiesService;

  static getInstance(): ActivitiesService {
    if (!ActivitiesService.instance) {
      ActivitiesService.instance = new ActivitiesService();
    }
    return ActivitiesService.instance;
  }

  /**
   * Create a new activity
   */
  async createActivity(formData: ActivityFormData, userId: string): Promise<Activity> {
    console.log('Creating activity with data:', { 
      name: formData.name, 
      userId, 
      collection: ACTIVITIES_COLLECTION 
    });
    
    try {
      let imageUrl = '';
      let imagePath = '';

      // Upload image if provided
      if (formData.image) {
        console.log('Uploading activity image...');
        const result = await this.uploadActivityImage(formData.image);
        imageUrl = result.downloadURL;
        imagePath = result.path;
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Prepare activity data for Firestore
      const activityData: any = {
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim(),
        status: formData.status,
        isPublic: formData.isPublic,
        needSubmission: formData.needSubmission,
        maxParticipants: formData.maxParticipants,
        isOneDayActivity: formData.isOneDayActivity,
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        registrationDeadline: formData.registrationDeadline,
        venueName: formData.venueName.trim(),
        venueLocation: formData.venueLocation?.trim() || '',
        description: formData.description.trim(),
        organizers: formData.organizers.map(org => org.trim()).filter(org => org.length > 0),
        tags: formData.tags,
        contactEmail: formData.contactEmail.trim(),
        contactName: formData.contactName.trim(),
        contactPhone: formData.contactPhone.trim(),
        imageUrl,
        imagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId,
        registeredParticipants: 0,
        waitlistCount: 0,
        views: 0
      };

      // Only add eventEndDate if it's a multi-day activity and has a value
      if (!formData.isOneDayActivity && formData.eventEndDate) {
        activityData.eventEndDate = formData.eventEndDate;
      }

      console.log('Prepared activity data for Firestore:', activityData);

      // Add to Firestore
      console.log('Adding document to Firestore collection:', ACTIVITIES_COLLECTION);
      const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), activityData);
      console.log('Document added successfully with ID:', docRef.id);

      // Return the created activity
      const createdActivity = this.convertFirestoreDocToActivity({
        id: docRef.id,
        ...activityData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('Activity created successfully:', createdActivity);
      return createdActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Permission denied. Please check your admin privileges.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw new Error(`Failed to create activity: ${error.message}`);
        }
      }
      
      throw new Error('Failed to create activity due to an unknown error');
    }
  }

  /**
   * Get all activities with filtering, sorting, and pagination
   */
  async getActivities(
    filters?: ActivityFilters,
    sortOptions?: ActivitySortOptions,
    page = 1,
    pageSize = 12
  ): Promise<ActivityListResponse> {
    try {
      let q = collection(db, ACTIVITIES_COLLECTION);

      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          q = query(q, where('status', '==', filters.status));
        }
        
        if (filters.isPublic !== undefined) {
          q = query(q, where('isPublic', '==', filters.isPublic));
        }

        if (filters.tags && filters.tags.length > 0) {
          q = query(q, where('tags', 'array-contains-any', filters.tags));
        }

        if (filters.organizer) {
          q = query(q, where('organizers', 'array-contains', filters.organizer));
        }

        if (filters.dateRange) {
          if (filters.dateRange.start) {
            q = query(q, where('eventDate', '>=', filters.dateRange.start));
          }
          if (filters.dateRange.end) {
            q = query(q, where('eventDate', '<=', filters.dateRange.end));
          }
        }
      }

      // Apply sorting
      if (sortOptions) {
        const direction = sortOptions.direction === 'desc' ? 'desc' : 'asc';
        q = query(q, orderBy(sortOptions.field, direction));
      } else {
        // Default sort by event date (upcoming first)
        q = query(q, orderBy('eventDate', 'asc'));
      }

      // Get total count for pagination
      const totalSnapshot = await getDocs(q);
      const total = totalSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * pageSize;
      if (offset > 0) {
        const offsetQuery = query(q, limit(offset));
        const offsetSnapshot = await getDocs(offsetQuery);
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          q = query(q, startAfter(lastDoc), limit(pageSize));
        } else {
          q = query(q, limit(pageSize));
        }
      } else {
        q = query(q, limit(pageSize));
      }

      const snapshot = await getDocs(q);
      let activities: Activity[] = snapshot.docs.map(doc => 
        this.convertFirestoreDocToActivity({
          id: doc.id,
          ...doc.data()
        } as ActivityFirestoreDoc)
      );

      // Apply client-side search filter for full-text search
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        activities = activities.filter(activity =>
          activity.name.toLowerCase().includes(searchTerm) ||
          activity.shortDescription.toLowerCase().includes(searchTerm) ||
          activity.description.toLowerCase().includes(searchTerm) ||
          activity.venueName.toLowerCase().includes(searchTerm) ||
          activity.organizers.some(org => org.toLowerCase().includes(searchTerm)) ||
          activity.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply available spots filter
      if (filters?.hasAvailableSpots) {
        activities = activities.filter(activity => 
          (activity.registeredParticipants || 0) < activity.maxParticipants
        );
      }

      return {
        activities,
        total: filters?.search || filters?.hasAvailableSpots ? activities.length : total,
        page,
        limit: pageSize,
        totalPages: Math.ceil((filters?.search || filters?.hasAvailableSpots ? activities.length : total) / pageSize),
        hasMore: page * pageSize < total
      };
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  /**
   * Get public activities for homepage display
   */
  async getPublicActivities(limit = 6): Promise<Activity[]> {
    try {
      const q = query(
        collection(db, ACTIVITIES_COLLECTION),
        where('isPublic', '==', true),
        where('status', '==', 'published'),
        orderBy('eventDate', 'asc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => 
        this.convertFirestoreDocToActivity({
          id: doc.id,
          ...doc.data()
        } as ActivityFirestoreDoc)
      );
    } catch (error) {
      console.error('Error fetching public activities:', error);
      return []; // Return empty array instead of throwing for public display
    }
  }

  /**
   * Get upcoming activities
   */
  async getUpcomingActivities(limit = 10): Promise<Activity[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, ACTIVITIES_COLLECTION),
        where('status', '==', 'published'),
        where('eventDate', '>=', today),
        orderBy('eventDate', 'asc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => 
        this.convertFirestoreDocToActivity({
          id: doc.id,
          ...doc.data()
        } as ActivityFirestoreDoc)
      );
    } catch (error) {
      console.error('Error fetching upcoming activities:', error);
      return [];
    }
  }

  /**
   * Get a single activity by ID
   */
  async getActivityById(activityId: string): Promise<Activity | null> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.convertFirestoreDocToActivity({
          id: docSnap.id,
          ...docSnap.data()
        } as ActivityFirestoreDoc);
      }

      return null;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw new Error('Failed to fetch activity');
    }
  }

  /**
   * Update an existing activity
   */
  async updateActivity(
    activityId: string, 
    formData: Partial<ActivityFormData>, 
    userId: string
  ): Promise<Activity> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error('Activity not found');
      }

      const currentData = currentDoc.data() as ActivityFirestoreDoc;
      let imageUrl = currentData.imageUrl;
      let imagePath = currentData.imagePath;

      // Handle image update
      if (formData.image) {
        // Delete old image if exists
        if (currentData.imagePath) {
          await this.deleteActivityImage(currentData.imagePath);
        }

        // Upload new image
        const result = await this.uploadActivityImage(formData.image);
        imageUrl = result.downloadURL;
        imagePath = result.path;
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };

      // Only update provided fields
      if (formData.name !== undefined) updateData.name = formData.name.trim();
      if (formData.shortDescription !== undefined) updateData.shortDescription = formData.shortDescription.trim();
      if (formData.status !== undefined) updateData.status = formData.status;
      if (formData.isPublic !== undefined) updateData.isPublic = formData.isPublic;
      if (formData.needSubmission !== undefined) updateData.needSubmission = formData.needSubmission;
      if (formData.maxParticipants !== undefined) updateData.maxParticipants = formData.maxParticipants;
      if (formData.isOneDayActivity !== undefined) updateData.isOneDayActivity = formData.isOneDayActivity;
      if (formData.eventDate !== undefined) updateData.eventDate = formData.eventDate;
      
      // Handle eventEndDate properly - avoid undefined values
      if (formData.isOneDayActivity !== undefined || formData.eventEndDate !== undefined) {
        const isOneDayActivity = formData.isOneDayActivity !== undefined ? formData.isOneDayActivity : currentData.isOneDayActivity;
        
        if (isOneDayActivity) {
          // For one-day activities, remove the eventEndDate field
          updateData.eventEndDate = deleteField();
        } else if (formData.eventEndDate) {
          // For multi-day activities, set the eventEndDate if provided
          updateData.eventEndDate = formData.eventEndDate;
        }
      }
      
      if (formData.startTime !== undefined) updateData.startTime = formData.startTime;
      if (formData.endTime !== undefined) updateData.endTime = formData.endTime;
      if (formData.registrationDeadline !== undefined) updateData.registrationDeadline = formData.registrationDeadline;
      if (formData.venueName !== undefined) updateData.venueName = formData.venueName.trim();
      if (formData.venueLocation !== undefined) updateData.venueLocation = formData.venueLocation.trim();
      if (formData.description !== undefined) updateData.description = formData.description.trim();
      if (formData.organizers !== undefined) updateData.organizers = formData.organizers.map(org => org.trim()).filter(org => org.length > 0);
      if (formData.tags !== undefined) updateData.tags = formData.tags;
      if (formData.contactEmail !== undefined) updateData.contactEmail = formData.contactEmail.trim();
      if (formData.contactName !== undefined) updateData.contactName = formData.contactName.trim();
      if (formData.contactPhone !== undefined) updateData.contactPhone = formData.contactPhone.trim();

      // Update image fields if changed
      if (formData.image) {
        updateData.imageUrl = imageUrl;
        updateData.imagePath = imagePath;
      }

      // Update in Firestore
      console.log('Updating activity with data:', updateData);
      await updateDoc(docRef, updateData);
      console.log('Activity updated successfully');

      // Return updated activity
      const updatedDoc = await getDoc(docRef);
      return this.convertFirestoreDocToActivity({
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as ActivityFirestoreDoc);
    } catch (error) {
      console.error('Error updating activity:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Permission denied. Please check your admin privileges.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw new Error(`Failed to update activity: ${error.message}`);
        }
      }
      
      throw new Error('Failed to update activity due to an unknown error');
    }
  }

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: string): Promise<void> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Activity not found');
      }

      const activityData = docSnap.data() as ActivityFirestoreDoc;

      // Delete associated image if exists
      if (activityData.imagePath) {
        await this.deleteActivityImage(activityData.imagePath);
      }

      // Delete from Firestore
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw new Error('Failed to delete activity');
    }
  }

  /**
   * Bulk update activities
   */
  async bulkUpdateActivities(
    activityIds: string[], 
    updates: Partial<ActivityFirestoreDoc>,
    userId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };

      activityIds.forEach(activityId => {
        const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
        batch.update(docRef, updateData);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating activities:', error);
      throw new Error('Failed to bulk update activities');
    }
  }

  /**
   * Bulk delete activities
   */
  async bulkDeleteActivities(activityIds: string[]): Promise<void> {
    try {
      // Get all activities first to delete their images
      const activities = await Promise.all(
        activityIds.map(id => this.getActivityById(id))
      );

      // Delete images in parallel
      await Promise.all(
        activities
          .filter(activity => activity?.image)
          .map(activity => {
            // Extract path from URL or use stored path
            const imagePath = this.extractImagePathFromUrl(activity!.image!);
            return this.deleteActivityImage(imagePath);
          })
      );

      // Delete from Firestore using batch
      const batch = writeBatch(db);
      activityIds.forEach(activityId => {
        const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk deleting activities:', error);
      throw new Error('Failed to bulk delete activities');
    }
  }

  /**
   * Duplicate an activity
   */
  async duplicateActivity(activityId: string, userId: string): Promise<Activity> {
    try {
      const original = await this.getActivityById(activityId);
      if (!original) {
        throw new Error('Original activity not found');
      }

      // Create duplicate with modifications
      const duplicateData: ActivityFormData = {
        image: null, // Don't duplicate image directly
        name: `${original.name} (Copy)`,
        shortDescription: original.shortDescription,
        status: 'draft', // Always start as draft
        isPublic: false, // Make private by default
        needSubmission: original.needSubmission,
        maxParticipants: original.maxParticipants,
        isOneDayActivity: original.isOneDayActivity,
        eventDate: original.eventDate,
        eventEndDate: original.eventEndDate || '',
        startTime: original.startTime,
        endTime: original.endTime,
        registrationDeadline: original.registrationDeadline,
        venueName: original.venueName,
        venueLocation: original.venueLocation || '',
        description: original.description,
        organizers: [...original.organizers],
        tags: [...original.tags],
        contactEmail: original.contactEmail,
        contactName: original.contactName,
        contactPhone: original.contactPhone
      };

      return this.createActivity(duplicateData, userId);
    } catch (error) {
      console.error('Error duplicating activity:', error);
      throw new Error('Failed to duplicate activity');
    }
  }

  /**
   * Search activities with advanced text search
   */
  async searchActivities(
    searchTerm: string, 
    filters?: Omit<ActivityFilters, 'search'>,
    limit = 20
  ): Promise<ActivitySearchResult> {
    try {
      // Get all activities that match other filters
      const response = await this.getActivities(filters, undefined, 1, 1000); // Get large set for search
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchedActivities = response.activities.filter(activity => {
        // Search in multiple fields
        const searchableText = [
          activity.name,
          activity.shortDescription,
          activity.description,
          activity.venueName,
          activity.contactName,
          ...activity.organizers,
          ...activity.tags
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTermLower);
      });

      // Generate search suggestions based on partial matches
      const suggestions = this.generateSearchSuggestions(searchTerm, response.activities);

      return {
        activities: matchedActivities.slice(0, limit),
        totalResults: matchedActivities.length,
        searchTerm,
        suggestions
      };
    } catch (error) {
      console.error('Error searching activities:', error);
      throw new Error('Failed to search activities');
    }
  }

  /**
   * Get activity analytics for dashboard
   */
  async getActivityAnalytics(): Promise<ActivityAnalytics> {
    try {
      const snapshot = await getDocs(collection(db, ACTIVITIES_COLLECTION));
      const activities = snapshot.docs.map(doc => 
        this.convertFirestoreDocToActivity({
          id: doc.id,
          ...doc.data()
        } as ActivityFirestoreDoc)
      );

      // Calculate status distribution
      const activitiesByStatus: Record<ActivityStatus, number> = {
        draft: 0,
        published: 0,
        cancelled: 0,
        completed: 0
      };

      let totalParticipants = 0;
      const tagCounts: Record<string, number> = {};
      const monthlyData: Record<string, { created: number; completed: number; participants: number }> = {};

      activities.forEach(activity => {
        // Status counts
        activitiesByStatus[activity.status]++;

        // Participant counts
        totalParticipants += activity.registeredParticipants || 0;

        // Tag popularity
        activity.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        // Monthly trends
        const createdMonth = new Date(activity.createdAt).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[createdMonth]) {
          monthlyData[createdMonth] = { created: 0, completed: 0, participants: 0 };
        }
        monthlyData[createdMonth].created++;

        if (activity.status === 'completed') {
          monthlyData[createdMonth].completed++;
          monthlyData[createdMonth].participants += activity.registeredParticipants || 0;
        }
      });

      // Calculate derived metrics
      const totalActivities = activities.length;
      const averageParticipantsPerEvent = totalActivities > 0 ? Math.round(totalParticipants / totalActivities) : 0;
      const today = new Date().toISOString().split('T')[0];
      const upcomingEvents = activities.filter(a => a.eventDate >= today && a.status === 'published').length;
      const completedEvents = activitiesByStatus.completed;

      // Popular tags (top 10)
      const popularTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Monthly trends (last 12 months)
      const monthlyTrends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          eventsCreated: data.created,
          eventsCompleted: data.completed,
          totalParticipants: data.participants
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      return {
        totalActivities,
        activitiesByStatus,
        totalParticipants,
        averageParticipantsPerEvent,
        upcomingEvents,
        completedEvents,
        popularTags,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error fetching activity analytics:', error);
      throw new Error('Failed to fetch activity analytics');
    }
  }

  /**
   * Increment activity view count
   */
  async incrementViews(activityId: string): Promise<void> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentViews = docSnap.data().views || 0;
        await updateDoc(docRef, {
          views: currentViews + 1,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
      // Don't throw error for view counting
    }
  }

  /**
   * Update participant count
   */
  async updateParticipantCount(
    activityId: string, 
    registeredCount: number, 
    waitlistCount = 0
  ): Promise<void> {
    try {
      const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
      await updateDoc(docRef, {
        registeredParticipants: registeredCount,
        waitlistCount,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating participant count:', error);
      throw new Error('Failed to update participant count');
    }
  }

  /**
   * Private helper methods
   */
  private async uploadActivityImage(file: File): Promise<{ downloadURL: string; path: string }> {
    try {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (file.size > maxSize) {
        throw new Error('Image file size must be less than 5MB');
      }

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const path = `${IMAGES_STORAGE_PATH}/${fileName}`;
      const storageRef = ref(storage, path);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { downloadURL, path };
    } catch (error) {
      console.error('Error uploading activity image:', error);
      throw error;
    }
  }

  private async deleteActivityImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      // Log error but don't throw - image might already be deleted
      console.warn('Error deleting activity image:', error);
    }
  }

  private extractImagePathFromUrl(imageUrl: string): string {
    try {
      // Extract path from Firebase Storage URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
      return imageUrl; // Fallback to original URL
    } catch (error) {
      return imageUrl; // Fallback to original URL
    }
  }

  private generateSearchSuggestions(searchTerm: string, activities: Activity[]): string[] {
    const suggestions = new Set<string>();
    const searchTermLower = searchTerm.toLowerCase();

    activities.forEach(activity => {
      // Add partial matches from activity names
      if (activity.name.toLowerCase().includes(searchTermLower)) {
        suggestions.add(activity.name);
      }

      // Add matching tags
      activity.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchTermLower)) {
          suggestions.add(tag);
        }
      });

      // Add matching organizers
      activity.organizers.forEach(organizer => {
        if (organizer.toLowerCase().includes(searchTermLower)) {
          suggestions.add(organizer);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5); // Return top 5 suggestions
  }

  private convertFirestoreDocToActivity(doc: ActivityFirestoreDoc): Activity {
    return {
      id: doc.id,
      image: doc.imageUrl,
      name: doc.name,
      shortDescription: doc.shortDescription,
      status: doc.status,
      isPublic: doc.isPublic,
      needSubmission: doc.needSubmission || false,
      maxParticipants: doc.maxParticipants,
      isOneDayActivity: doc.isOneDayActivity !== undefined ? doc.isOneDayActivity : true,
      eventDate: doc.eventDate,
      eventEndDate: doc.eventEndDate,
      startTime: doc.startTime,
      endTime: doc.endTime,
      registrationDeadline: doc.registrationDeadline,
      venueName: doc.venueName,
      venueLocation: doc.venueLocation,
      description: doc.description,
      organizers: doc.organizers,
      tags: doc.tags,
      contactEmail: doc.contactEmail,
      contactName: doc.contactName,
      contactPhone: doc.contactPhone,
      createdAt: doc.createdAt?.toDate ? doc.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt?.toDate ? doc.updatedAt.toDate().toISOString() : new Date().toISOString(),
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      registeredParticipants: doc.registeredParticipants || 0,
      waitlistCount: doc.waitlistCount || 0,
      views: doc.views || 0
    };
  }
}

// Export singleton instance
export const activitiesService = ActivitiesService.getInstance();
export default activitiesService;
