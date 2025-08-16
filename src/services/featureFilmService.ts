import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  onSnapshot,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FeatureFilmData, 
  FeatureFilm, 
  CreateFeatureFilmData, 
  UpdateFeatureFilmData, 
  FilmFilters,
  FileMetadata
} from '../types/featureFilm.types';
import { createMultipleGuests, getGuests, deleteAllGuests } from './guestService';
import { uploadFile, generateFeatureFilmUploadPath } from '../utils/fileUpload';

const COLLECTION_NAME = 'films';
const NEW_COLLECTION_NAME = 'films'; // Use the existing films collection

export interface FeatureFilmServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Upload files for a feature film
 */
const uploadFeatureFilmFiles = async (
  filmId: string,
  filmData: FeatureFilmData,
  userId?: string
): Promise<{ updatedData: Partial<FeatureFilmData>; errors: string[] }> => {
  const updatedData: Partial<FeatureFilmData> = {};
  const errors: string[] = [];

  try {
    // Upload poster file if provided
    if (filmData.posterFile) {
      try {
        const posterPath = generateFeatureFilmUploadPath(filmId, 'posters', filmData.posterFile.name, userId);
        const posterResult = await uploadFile(filmData.posterFile, posterPath);
        updatedData.posterUrl = posterResult.url;
      } catch (error) {
        console.error('Error uploading poster:', error);
        errors.push('Failed to upload poster');
      }
    }

    // Upload trailer file if provided
    if (filmData.trailerFile) {
      try {
        const trailerPath = generateFeatureFilmUploadPath(filmId, 'trailers', filmData.trailerFile.name, userId);
        const trailerResult = await uploadFile(filmData.trailerFile, trailerPath);
        updatedData.trailerUrl = trailerResult.url;
      } catch (error) {
        console.error('Error uploading trailer:', error);
        errors.push('Failed to upload trailer');
      }
    }

    // Upload gallery files if provided
    if (filmData.galleryFiles && filmData.galleryFiles.length > 0) {
      try {
        const galleryUrls: string[] = [];
        for (const file of filmData.galleryFiles) {
          const galleryPath = generateFeatureFilmUploadPath(filmId, 'gallery', file.name, userId);
          const galleryResult = await uploadFile(file, galleryPath);
          galleryUrls.push(galleryResult.url);
        }
        // Merge with existing gallery URLs if any
        updatedData.galleryUrls = [
          ...(filmData.galleryUrls || []).filter(url => url.trim() !== ''),
          ...galleryUrls
        ];
      } catch (error) {
        console.error('Error uploading gallery files:', error);
        errors.push('Failed to upload gallery files');
      }
    }

    return { updatedData, errors };
  } catch (error) {
    console.error('Error in uploadFeatureFilmFiles:', error);
    return { updatedData, errors: ['Failed to upload files'] };
  }
};

/**
 * Prepare film data for Firestore (remove File objects and undefined values)
 */
const prepareFilmDataForFirestore = (filmData: FeatureFilmData): Partial<FeatureFilmData> => {
  const { posterFile, trailerFile, galleryFiles, ...cleanData } = filmData;
  
  // Remove undefined values as Firestore doesn't accept them
  const firestoreData: any = {};
  
  Object.entries(cleanData).forEach(([key, value]) => {
    if (value !== undefined) {
      firestoreData[key] = value;
    }
  });
  
  return firestoreData;
};

/**
 * Helper method to extract crew members from film data for guests subcollection
 */
const extractCrewMembersFromFilmData = (filmData: Partial<FeatureFilmData>): any[] => {
  // Extract crew/cast information from film data
  const crewMembers: any[] = [];
  
  // PRIORITY 1: Use guests from the form if they exist (from GuestManagement component)
  if (filmData.guests && Array.isArray(filmData.guests) && filmData.guests.length > 0) {
    console.log('✅ Using guests from form data:', filmData.guests.length, 'guests');
    filmData.guests.forEach((guest, index) => {
      if (guest.name && guest.name.trim()) {
        // Map Guest object to the format expected by createMultipleGuests
        crewMembers.push({
          name: guest.name.trim(),
          contact: guest.contact?.trim() || '',
          role: guest.role || 'Guest',
          otherRole: guest.role === 'Other' ? guest.otherRole?.trim() : undefined,
          remarks: guest.remarks?.trim() || ''
        });
      }
    });
    console.log('📊 Mapped guests to crew members:', crewMembers.length);
    return crewMembers; // Return early if we have form guests
  }
  
  // PRIORITY 2: Extract from basic film fields if no form guests exist
  console.log('⚠️ No form guests found, extracting from basic film fields');
  
  // Add director as primary crew member
  if (filmData.director && filmData.director.trim()) {
    crewMembers.push({
      name: filmData.director.trim(),
      contact: '', // Default empty contact
      role: 'Director',
      otherRole: undefined,
      remarks: ''
    });
  }
  
  // Add producer if available
  if (filmData.producer && filmData.producer.trim()) {
    crewMembers.push({
      name: filmData.producer.trim(),
      contact: '', // Default empty contact
      role: 'Producer',
      otherRole: undefined,
      remarks: ''
    });
  }
  
  // Add main actors if available
  if (filmData.mainActors && filmData.mainActors.trim()) {
    const actors = filmData.mainActors.split(',').map(actor => actor.trim());
    actors.forEach((actor) => {
      if (actor) {
        crewMembers.push({
          name: actor,
          contact: '', // Default empty contact
          role: 'Actor',
          otherRole: undefined,
          remarks: ''
        });
      }
    });
  }
  
  console.log('📊 Extracted crew members from basic fields:', crewMembers.length);
  return crewMembers;
};

/**
 * Create a new feature film record
 */
export const createFeatureFilm = async (
  filmData: Omit<FeatureFilmData, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<FeatureFilmServiceResult> => {
  try {
    // Separate guests from film data and prepare clean data for Firestore
    const { guests, ...filmDataWithoutGuests } = filmData;
    const cleanFilmData = prepareFilmDataForFirestore(filmDataWithoutGuests as FeatureFilmData);
    
    const docData = {
      ...cleanFilmData,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create the document first
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    const filmId = docRef.id;
    console.log('✅ Film saved with ID:', filmId);
    
    // Upload files if any are provided
    const hasFiles = filmData.posterFile || filmData.trailerFile || (filmData.galleryFiles && filmData.galleryFiles.length > 0);
    if (hasFiles) {
      const { updatedData, errors } = await uploadFeatureFilmFiles(filmId, filmData, userId);
      
      if (errors.length > 0) {
        console.warn('File upload errors:', errors);
      }
      
      // Update the document with file URLs if any files were uploaded
      if (Object.keys(updatedData).length > 0) {
        await updateDoc(docRef, {
          ...updatedData,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    // CRITICAL: Create guests subcollection from crew/cast data
    const crewMembers = extractCrewMembersFromFilmData(filmData as FeatureFilmData);
    if (crewMembers.length > 0) {
      try {
        await createMultipleGuests(filmId, crewMembers);
        console.log('✅ Guest subcollection created successfully in films collection');
      } catch (guestError) {
        console.error('❌ Error creating guest subcollection in films collection:', guestError);
        // Don't fail the entire film creation if guest creation fails
        // Guest Relations can create guests manually if needed
      }
    }

    // Fetch the created film data
    const createdDoc = await getDoc(docRef);
    if (createdDoc.exists()) {
      const createdData = { id: createdDoc.id, ...createdDoc.data() } as FeatureFilmData;
      return { success: true, data: createdData };
    } else {
      return { success: false, error: 'Film created but could not retrieve data' };
    }
    
  } catch (error) {
    console.error('Error creating film:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create film' 
    };
  }
};

/**
 * Update an existing feature film record
 */
export const updateFeatureFilm = async (
  filmId: string,
  filmData: Partial<FeatureFilmData>,
  userId?: string
): Promise<FeatureFilmServiceResult> => {
  try {
    // Separate guests from film data and prepare clean data for Firestore
    const { guests, ...filmDataWithoutGuests } = filmData;
    const cleanFilmData = prepareFilmDataForFirestore(filmDataWithoutGuests as FeatureFilmData);
    
    const filmRef = doc(db, COLLECTION_NAME, filmId);
    
    // Upload files if any are provided
    const hasFiles = filmData.posterFile || filmData.trailerFile || (filmData.galleryFiles && filmData.galleryFiles.length > 0);
    let fileUploadData = {};
    
    if (hasFiles) {
      const { updatedData, errors } = await uploadFeatureFilmFiles(filmId, filmData as FeatureFilmData, userId);
      
      if (errors.length > 0) {
        console.warn('File upload errors:', errors);
      }
      
      fileUploadData = updatedData;
    }
    
    const updateData = {
      ...cleanFilmData,
      ...fileUploadData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(filmRef, updateData);
    
    // CRITICAL: Update guests subcollection when film data changes
    const crewMembers = extractCrewMembersFromFilmData(filmData);
    console.log('🔄 Updating guests subcollection for film:', filmId, 'with', crewMembers.length, 'crew members');
    
    try {
      // Always delete existing guests first
      await deleteAllGuests(filmId);
      
      // Create new guests if we have crew members
      if (crewMembers.length > 0) {
        await createMultipleGuests(filmId, crewMembers);
        console.log('✅ Guest subcollection updated successfully in films collection');
      } else {
        console.log('ℹ️ No crew members found, guests subcollection cleared');
      }
    } catch (guestError) {
      console.error('❌ Error updating guest subcollection in films collection:', guestError);
      // Don't fail the entire film update if guest update fails
    }

    // Fetch updated data from films collection
    const updatedDoc = await getDoc(filmRef);
    if (updatedDoc.exists()) {
      const updatedData = { id: updatedDoc.id, ...updatedDoc.data() } as FeatureFilmData;
      return { success: true, data: updatedData };
    } else {
      return { success: false, error: 'Film not found in films collection after update' };
    }
  } catch (error) {
    console.error('Error updating film in films collection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update film in films collection' 
    };
  }
};

/**
 * Delete a feature film record
 */
export const deleteFeatureFilm = async (filmId: string): Promise<FeatureFilmServiceResult> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, filmId);
    await deleteDoc(docRef);
    
    return {
      success: true,
      data: { id: filmId }
    };
  } catch (error) {
    console.error('Error deleting feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete feature film'
    };
  }
};

/**
 * Get a single feature film by ID
 */
export const getFeatureFilm = async (filmId: string): Promise<FeatureFilmServiceResult> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, filmId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const filmData: any = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
      
      // ALWAYS attempt to load guests from subcollection
      // This ensures we get guest data even if guestComing flag is not properly set
      try {
        const guestsResult = await getGuests(filmId);
        if (guestsResult.success && guestsResult.data && guestsResult.data.length > 0) {
          // Map guest data back to the format expected by the form
          filmData.guests = guestsResult.data.map((guest: any) => ({
            id: guest.id,
            name: guest.name,
            contact: guest.contact || '',
            role: guest.role || 'Guest',
            otherRole: guest.otherRole,
            remarks: guest.remarks || ''
          }));
          console.log('✅ Loaded', filmData.guests.length, 'guests from subcollection for film:', filmId);
        } else {
          filmData.guests = [];
          console.log('ℹ️ No guests found in subcollection for film:', filmId);
        }
      } catch (guestError) {
        console.warn('⚠️ Error loading guests from subcollection for film:', filmId, guestError);
        filmData.guests = [];
      }
      
      return {
        success: true,
        data: filmData
      };
    } else {
      return {
        success: false,
        error: 'Feature film not found'
      };
    }
  } catch (error) {
    console.error('Error getting feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature film'
    };
  }
};

/**
 * Get all feature films with optional filtering
 */
export const getFeatureFilms = async (filters?: {
  category?: string;
  status?: string;
  createdBy?: string;
}): Promise<FeatureFilmServiceResult> => {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    
    // Apply filters if provided
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.createdBy) {
      q = query(q, where('createdBy', '==', filters.createdBy));
    }
    
    const querySnapshot = await getDocs(q);
    const films: FeatureFilmData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      films.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as FeatureFilmData);
    });
    
    return {
      success: true,
      data: films
    };
  } catch (error) {
    console.error('Error getting feature films:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature films'
    };
  }
};

/**
 * Get feature films by category
 */
export const getFeatureFilmsByCategory = async (category: string): Promise<FeatureFilmServiceResult> => {
  return getFeatureFilms({ category });
};

/**
 * Get feature films by status
 */
export const getFeatureFilmsByStatus = async (status: string): Promise<FeatureFilmServiceResult> => {
  return getFeatureFilms({ status });
};

/**
 * Search feature films by title
 */
export const searchFeatureFilms = async (searchTerm: string): Promise<FeatureFilmServiceResult> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('titleEn'));
    const querySnapshot = await getDocs(q);
    const films: FeatureFilmData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const film = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as FeatureFilmData;
      
      // Client-side filtering for title search (case-insensitive)
      const searchLower = searchTerm.toLowerCase();
      if (
        film.titleEn.toLowerCase().includes(searchLower) ||
        (film.titleTh && film.titleTh.toLowerCase().includes(searchLower))
      ) {
        films.push(film);
      }
    });
    
    return {
      success: true,
      data: films
    };
  } catch (error) {
    console.error('Error searching feature films:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search feature films'
    };
  }
};

/**
 * Get statistics about feature films
 */
export const getFeatureFilmStats = async (): Promise<FeatureFilmServiceResult> => {
  try {
    const result = await getFeatureFilms();
    
    if (!result.success || !result.data) {
      return result;
    }
    
    const films = result.data as FeatureFilmData[];
    
    const stats = {
      total: films.length,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byGenre: {} as Record<string, number>,
      recentlyAdded: films.filter(film => {
        if (!film.createdAt) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return film.createdAt > weekAgo;
      }).length
    };
    
    // Calculate category distribution
    films.forEach(film => {
      stats.byCategory[film.category] = (stats.byCategory[film.category] || 0) + 1;
      stats.byStatus[film.status] = (stats.byStatus[film.status] || 0) + 1;
      // Handle multiple genres - count each genre separately
      if (film.genres && Array.isArray(film.genres)) {
        film.genres.forEach(genre => {
          stats.byGenre[genre] = (stats.byGenre[genre] || 0) + 1;
        });
      }
    });
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting feature film stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature film statistics'
    };
  }
};

// ============================================================================
// NEW ENHANCED FEATURE FILM SYSTEM FUNCTIONS
// ============================================================================

/**
 * Upload files for the new enhanced feature film system
 */
const uploadEnhancedFilmFiles = async (
  filmId: string,
  filmData: CreateFeatureFilmData,
  userId: string
): Promise<{ files: Partial<FeatureFilm['files']>; errors: string[] }> => {
  const files: Partial<FeatureFilm['files']> = {};
  const errors: string[] = [];

  try {
    // Upload poster file if provided
    if (filmData.posterFile) {
      try {
        const posterPath = generateFeatureFilmUploadPath(filmId, 'posters', filmData.posterFile.name, userId);
        const posterResult = await uploadFile(filmData.posterFile, posterPath);
        files.poster = {
          url: posterResult.url,
          name: filmData.posterFile.name,
          size: filmData.posterFile.size,
          type: filmData.posterFile.type,
          uploadedAt: new Date(),
          uploadedBy: userId
        };
      } catch (error) {
        console.error('Error uploading poster:', error);
        errors.push('Failed to upload poster');
      }
    }

    // Upload trailer file if provided
    if (filmData.trailerFile) {
      try {
        const trailerPath = generateFeatureFilmUploadPath(filmId, 'trailers', filmData.trailerFile.name, userId);
        const trailerResult = await uploadFile(filmData.trailerFile, trailerPath);
        files.trailer = {
          url: trailerResult.url,
          name: filmData.trailerFile.name,
          size: filmData.trailerFile.size,
          type: filmData.trailerFile.type,
          uploadedAt: new Date(),
          uploadedBy: userId
        };
      } catch (error) {
        console.error('Error uploading trailer:', error);
        errors.push('Failed to upload trailer');
      }
    }

    // Upload stills files if provided
    if (filmData.stillsFiles && filmData.stillsFiles.length > 0) {
      try {
        const stillsMetadata: FileMetadata[] = [];
        for (const file of filmData.stillsFiles) {
          const stillPath = generateFeatureFilmUploadPath(filmId, 'stills', file.name, userId);
          const stillResult = await uploadFile(file, stillPath);
          stillsMetadata.push({
            url: stillResult.url,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
            uploadedBy: userId
          });
        }
        files.stills = stillsMetadata;
      } catch (error) {
        console.error('Error uploading stills:', error);
        errors.push('Failed to upload stills');
      }
    }

    // Upload press kit file if provided
    if (filmData.pressKitFile) {
      try {
        const pressKitPath = generateFeatureFilmUploadPath(filmId, 'presskit', filmData.pressKitFile.name, userId);
        const pressKitResult = await uploadFile(filmData.pressKitFile, pressKitPath);
        files.pressKit = {
          url: pressKitResult.url,
          name: filmData.pressKitFile.name,
          size: filmData.pressKitFile.size,
          type: filmData.pressKitFile.type,
          uploadedAt: new Date(),
          uploadedBy: userId
        };
      } catch (error) {
        console.error('Error uploading press kit:', error);
        errors.push('Failed to upload press kit');
      }
    }

    return { files, errors };
  } catch (error) {
    console.error('Error in uploadEnhancedFilmFiles:', error);
    return { files, errors: ['Failed to upload files'] };
  }
};

/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

/**
 * Create a new feature film (Enhanced System)
 */
export const createEnhancedFeatureFilm = async (
  filmData: CreateFeatureFilmData,
  userId: string
): Promise<FeatureFilmServiceResult> => {
  try {
    // Generate slug if not provided
    const slug = filmData.slug || generateSlug(filmData.title);
    
    // Prepare clean data for Firestore (remove File objects)
    const { posterFile, trailerFile, stillsFiles, pressKitFile, ...cleanData } = filmData;
    
    const docData: Omit<FeatureFilm, 'id'> = {
      ...cleanData,
      slug,
      files: {},
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the document first
    const docRef = await addDoc(collection(db, NEW_COLLECTION_NAME), {
      ...docData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    const filmId = docRef.id;
    
    // Upload files if any are provided
    const hasFiles = posterFile || trailerFile || (stillsFiles && stillsFiles.length > 0) || pressKitFile;
    if (hasFiles) {
      const { files, errors } = await uploadEnhancedFilmFiles(filmId, filmData, userId);
      
      if (errors.length > 0) {
        console.warn('File upload errors:', errors);
      }
      
      // Update the document with file metadata if any files were uploaded
      if (Object.keys(files).length > 0) {
        await updateDoc(docRef, {
          files,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return {
      success: true,
      data: { id: filmId, ...docData }
    };
  } catch (error) {
    console.error('Error creating enhanced feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create feature film'
    };
  }
};

/**
 * Update an existing feature film (Enhanced System)
 */
export const updateEnhancedFeatureFilm = async (
  filmId: string,
  filmData: UpdateFeatureFilmData,
  userId: string
): Promise<FeatureFilmServiceResult> => {
  try {
    // Prepare clean data for Firestore (remove File objects)
    const { posterFile, trailerFile, stillsFiles, pressKitFile, ...cleanData } = filmData;
    
    const docRef = doc(db, NEW_COLLECTION_NAME, filmId);
    
    // Upload files if any are provided
    const hasFiles = posterFile || trailerFile || (stillsFiles && stillsFiles.length > 0) || pressKitFile;
    let fileData = {};
    
    if (hasFiles) {
      const { files, errors } = await uploadEnhancedFilmFiles(filmId, filmData as CreateFeatureFilmData, userId);
      
      if (errors.length > 0) {
        console.warn('File upload errors:', errors);
      }
      
      if (Object.keys(files).length > 0) {
        fileData = { files };
      }
    }
    
    const updateData = {
      ...cleanData,
      ...fileData,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
    
    return {
      success: true,
      data: { id: filmId, ...updateData }
    };
  } catch (error) {
    console.error('Error updating enhanced feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update feature film'
    };
  }
};

/**
 * Get a single feature film by ID (Enhanced System)
 */
export const getEnhancedFeatureFilm = async (filmId: string): Promise<FeatureFilmServiceResult> => {
  try {
    const docRef = doc(db, NEW_COLLECTION_NAME, filmId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const filmData: FeatureFilm = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FeatureFilm;
      
      return {
        success: true,
        data: filmData
      };
    } else {
      return {
        success: false,
        error: 'Feature film not found'
      };
    }
  } catch (error) {
    console.error('Error getting enhanced feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature film'
    };
  }
};

/**
 * Convert legacy FeatureFilmData to new FeatureFilm format
 */
const convertLegacyToEnhanced = (legacyData: any): FeatureFilm => {
  return {
    id: legacyData.id,
    // Map legacy fields to new structure
    title: legacyData.titleEn || legacyData.title || 'Untitled',
    titleTh: legacyData.titleTh,
    synopsis: legacyData.synopsis || '',
    synopsisTh: undefined,
    director: legacyData.director || 'Unknown',
    directorTh: undefined,
    duration: legacyData.duration || 120, // Default to 120 minutes if not specified
    releaseYear: legacyData.releaseYear || new Date().getFullYear(),
    language: Array.isArray(legacyData.languages) ? legacyData.languages : (legacyData.language ? [legacyData.language] : ['Unknown']),
    subtitles: [],
    format: legacyData.format || 'Digital',
    aspectRatio: legacyData.aspectRatio || '16:9',
    soundFormat: legacyData.soundFormat || 'Stereo',
    genres: Array.isArray(legacyData.genres) ? legacyData.genres : (legacyData.genre ? [legacyData.genre] : []),
    country: Array.isArray(legacyData.countries) ? legacyData.countries[0] : (legacyData.country || 'Unknown'),
    rating: legacyData.rating,
    files: {
      poster: legacyData.posterUrl ? {
        url: legacyData.posterUrl,
        name: 'poster',
        size: 0,
        type: 'image/jpeg',
        uploadedAt: legacyData.createdAt || new Date(),
        uploadedBy: legacyData.createdBy || 'unknown'
      } : undefined,
      trailer: legacyData.trailerUrl ? {
        url: legacyData.trailerUrl,
        name: 'trailer',
        size: 0,
        type: 'video/mp4',
        uploadedAt: legacyData.createdAt || new Date(),
        uploadedBy: legacyData.createdBy || 'unknown'
      } : undefined,
      stills: legacyData.galleryUrls && legacyData.galleryUrls.length > 0 ? 
        legacyData.galleryUrls.map((url: string, index: number) => ({
          url,
          name: `still_${index + 1}`,
          size: 0,
          type: 'image/jpeg',
          uploadedAt: legacyData.createdAt || new Date(),
          uploadedBy: legacyData.createdBy || 'unknown'
        })) : undefined
    },
    cast: legacyData.mainActors ? 
      legacyData.mainActors.split(',').map((actor: string) => ({
        name: actor.trim(),
        role: 'Actor',
        character: ''
      })) : [],
    crew: [
      {
        name: legacyData.director || 'Unknown',
        role: 'Director',
        department: 'Direction'
      },
      ...(legacyData.producer ? [{
        name: legacyData.producer,
        role: 'Producer',
        department: 'Production'
      }] : [])
    ],
    screenings: legacyData.screeningDate1 ? [{
      date: new Date(legacyData.screeningDate1),
      time: legacyData.timeEstimate || '',
      venue: legacyData.theatre || 'TBD'
    }] : undefined,
    status: legacyData.status === 'ตอบรับ / Accepted' ? 'published' : 'draft',
    featured: legacyData.featured || false,
    createdAt: legacyData.createdAt?.toDate ? legacyData.createdAt.toDate() : (legacyData.createdAt || new Date()),
    updatedAt: legacyData.updatedAt?.toDate ? legacyData.updatedAt.toDate() : (legacyData.updatedAt || new Date()),
    createdBy: legacyData.createdBy || 'unknown',
    updatedBy: legacyData.updatedBy || legacyData.createdBy || 'unknown',
    tags: legacyData.tags || [],
    slug: legacyData.slug || generateSlug(legacyData.titleEn || legacyData.title || 'untitled'),
    metaDescription: legacyData.metaDescription
  };
};

/**
 * Get all feature films with advanced filtering (Enhanced System)
 */
export const getEnhancedFeatureFilms = async (filters?: FilmFilters): Promise<FeatureFilmServiceResult> => {
  try {
    let q = query(collection(db, NEW_COLLECTION_NAME));
    
    // For legacy data, we need to be more flexible with filtering
    // Apply basic sorting first
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';
    
    try {
      q = query(q, orderBy(sortBy, sortOrder));
    } catch (error) {
      // If the field doesn't exist, fall back to createdAt
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    // Apply pagination
    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const films: FeatureFilm[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      try {
        // Convert legacy data to enhanced format
        const enhancedFilm = convertLegacyToEnhanced({
          id: doc.id,
          ...data
        });
        films.push(enhancedFilm);
      } catch (error) {
        console.warn('Error converting legacy film data:', error);
        // Skip this film if conversion fails
      }
    });
    
    // Apply client-side filters for complex queries
    let filteredFilms = films;
    
    // Status filter
    if (filters?.status) {
      filteredFilms = filteredFilms.filter(film => film.status === filters.status);
    }
    
    // Genre filter
    if (filters?.genre) {
      filteredFilms = filteredFilms.filter(film => 
        film.genres.some(genre => genre.toLowerCase().includes(filters.genre!.toLowerCase()))
      );
    }
    
    // Country filter
    if (filters?.country) {
      filteredFilms = filteredFilms.filter(film => 
        film.country.toLowerCase().includes(filters.country!.toLowerCase())
      );
    }
    
    // Featured filter
    if (filters?.featured !== undefined) {
      filteredFilms = filteredFilms.filter(film => film.featured === filters.featured);
    }
    
    // Search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredFilms = filteredFilms.filter(film => 
        film.title.toLowerCase().includes(searchLower) ||
        (film.titleTh && film.titleTh.toLowerCase().includes(searchLower)) ||
        film.director.toLowerCase().includes(searchLower) ||
        film.synopsis.toLowerCase().includes(searchLower)
      );
    }
    
    // Year filters
    if (filters?.yearFrom || filters?.yearTo) {
      filteredFilms = filteredFilms.filter(film => {
        if (filters.yearFrom && film.releaseYear < filters.yearFrom) return false;
        if (filters.yearTo && film.releaseYear > filters.yearTo) return false;
        return true;
      });
    }
    
    // Duration filters
    if (filters?.durationFrom || filters?.durationTo) {
      filteredFilms = filteredFilms.filter(film => {
        if (filters.durationFrom && film.duration < filters.durationFrom) return false;
        if (filters.durationTo && film.duration > filters.durationTo) return false;
        return true;
      });
    }
    
    return {
      success: true,
      data: filteredFilms
    };
  } catch (error) {
    console.error('Error getting enhanced feature films:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature films'
    };
  }
};

/**
 * Delete a feature film (Enhanced System)
 */
export const deleteEnhancedFeatureFilm = async (filmId: string): Promise<FeatureFilmServiceResult> => {
  try {
    const docRef = doc(db, NEW_COLLECTION_NAME, filmId);
    await deleteDoc(docRef);
    
    return {
      success: true,
      data: { id: filmId }
    };
  } catch (error) {
    console.error('Error deleting enhanced feature film:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete feature film'
    };
  }
};

/**
 * Search feature films (Enhanced System)
 */
export const searchEnhancedFeatureFilms = async (searchTerm: string): Promise<FeatureFilmServiceResult> => {
  return getEnhancedFeatureFilms({ search: searchTerm });
};

/**
 * Get feature films by status (Enhanced System)
 */
export const getEnhancedFeatureFilmsByStatus = async (status: 'draft' | 'published' | 'archived'): Promise<FeatureFilmServiceResult> => {
  return getEnhancedFeatureFilms({ status });
};

/**
 * Get published feature films for public display
 */
export const getPublishedFeatureFilms = async (): Promise<FeatureFilmServiceResult> => {
  return getEnhancedFeatureFilms({ status: 'published' });
};

/**
 * Subscribe to feature films changes (Enhanced System)
 */
export const subscribeToFeatureFilms = (callback: (films: FeatureFilm[]) => void): (() => void) => {
  const q = query(collection(db, NEW_COLLECTION_NAME), orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const films: FeatureFilm[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      films.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FeatureFilm);
    });
    callback(films);
  }, (error) => {
    console.error('Error in feature films subscription:', error);
  });
  
  return unsubscribe;
};

/**
 * Get feature film by slug for public pages
 */
export const getFeatureFilmBySlug = async (slug: string): Promise<FeatureFilmServiceResult> => {
  try {
    const q = query(
      collection(db, NEW_COLLECTION_NAME), 
      where('slug', '==', slug),
      where('status', '==', 'published')
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Feature film not found'
      };
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    const filmData: FeatureFilm = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as FeatureFilm;
    
    return {
      success: true,
      data: filmData
    };
  } catch (error) {
    console.error('Error getting feature film by slug:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature film'
    };
  }
};
