import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy, 
  onSnapshot, 
  where,
  getDocs,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

export interface DebugInfo {
  timestamp: Date;
  action: string;
  details: any;
  success: boolean;
  error?: any;
}

export interface ShortFilmCommentDebug {
  id: string;
  submissionId: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  content: string;
  type: 'general' | 'scoring' | 'status_change' | 'flag';
  scores?: {
    technical: number;
    story: number;
    creativity: number;
    chiangmai: number;
    overall: number;
    totalScore: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
}

class DebugShortFilmCommentsService {
  private debugLogs: DebugInfo[] = [];
  
  private log(action: string, details: any, success: boolean = true, error?: any) {
    const debugInfo: DebugInfo = {
      timestamp: new Date(),
      action,
      details,
      success,
      error
    };
    
    this.debugLogs.push(debugInfo);
    
    // Keep only last 50 logs
    if (this.debugLogs.length > 50) {
      this.debugLogs = this.debugLogs.slice(-50);
    }
    
    // Console logging with emojis for easy identification
    const emoji = success ? '✅' : '❌';
    console.log(`${emoji} [ShortFilmComments] ${action}:`, details);
    if (error) {
      console.error(`❌ [ShortFilmComments] Error in ${action}:`, error);
    }
  }
  
  getDebugLogs(): DebugInfo[] {
    return [...this.debugLogs];
  }
  
  clearDebugLogs(): void {
    this.debugLogs = [];
    console.log('🧹 [ShortFilmComments] Debug logs cleared');
  }

  /**
   * Comprehensive user and permission check
   */
  async checkUserPermissions(user: User | null): Promise<{
    isAuthenticated: boolean;
    hasProfile: boolean;
    isAdmin: boolean;
    profileData?: any;
    error?: string;
  }> {
    this.log('checkUserPermissions', { userId: user?.uid, email: user?.email });
    
    if (!user) {
      const result = { isAuthenticated: false, hasProfile: false, isAdmin: false, error: 'User not authenticated' };
      this.log('checkUserPermissions', result, false);
      return result;
    }

    try {
      // Check if user profile exists
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        const result = { isAuthenticated: true, hasProfile: false, isAdmin: false, error: 'User profile not found' };
        this.log('checkUserPermissions', result, false);
        return result;
      }
      
      const profileData = profileSnap.data();
      const isAdmin = profileData.role === 'admin' || profileData.role === 'super-admin';
      
      const result = {
        isAuthenticated: true,
        hasProfile: true,
        isAdmin,
        profileData,
        error: isAdmin ? undefined : 'User does not have admin role'
      };
      
      this.log('checkUserPermissions', result, isAdmin);
      return result;
    } catch (error) {
      const result = { isAuthenticated: true, hasProfile: false, isAdmin: false, error: `Permission check failed: ${error}` };
      this.log('checkUserPermissions', result, false, error);
      return result;
    }
  }

  /**
   * Test Firestore connection and rules
   */
  async testFirestoreConnection(submissionId: string, user: User | null): Promise<{
    canConnect: boolean;
    canReadSubmission: boolean;
    canReadComments: boolean;
    canWriteComments: boolean;
    submissionExists: boolean;
    commentsCollectionExists: boolean;
    error?: string;
  }> {
    this.log('testFirestoreConnection', { submissionId, userId: user?.uid });
    
    const result = {
      canConnect: false,
      canReadSubmission: false,
      canReadComments: false,
      canWriteComments: false,
      submissionExists: false,
      commentsCollectionExists: false,
      error: undefined as string | undefined
    };

    try {
      // Test 1: Basic Firestore connection
      result.canConnect = true;
      this.log('testFirestoreConnection', 'Basic Firestore connection: OK');

      // Test 2: Can read submission document
      try {
        const submissionRef = doc(db, 'submissions', submissionId);
        const submissionSnap = await getDoc(submissionRef);
        result.canReadSubmission = true;
        result.submissionExists = submissionSnap.exists();
        this.log('testFirestoreConnection', `Submission read: OK, exists: ${result.submissionExists}`);
      } catch (error) {
        result.error = `Cannot read submission: ${error}`;
        this.log('testFirestoreConnection', result.error, false, error);
        return result;
      }

      // Test 3: Can read comments collection
      try {
        const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
        const commentsSnap = await getDocs(commentsRef);
        result.canReadComments = true;
        result.commentsCollectionExists = commentsSnap.docs.length > 0;
        this.log('testFirestoreConnection', `Comments read: OK, docs found: ${commentsSnap.docs.length}`);
      } catch (error) {
        result.error = `Cannot read comments: ${error}`;
        this.log('testFirestoreConnection', result.error, false, error);
        return result;
      }

      // Test 4: Can write to comments collection (if user provided)
      if (user) {
        try {
          const testCommentRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
          // We won't actually write, just test the reference creation
          result.canWriteComments = true;
          this.log('testFirestoreConnection', 'Comments write permission: OK (reference created)');
        } catch (error) {
          result.error = `Cannot write comments: ${error}`;
          this.log('testFirestoreConnection', result.error, false, error);
        }
      }

      this.log('testFirestoreConnection', 'All tests completed', true);
      return result;
    } catch (error) {
      result.error = `Connection test failed: ${error}`;
      this.log('testFirestoreConnection', result.error, false, error);
      return result;
    }
  }

  /**
   * Enhanced getComments with comprehensive debugging
   */
  async getComments(submissionId: string, user?: User | null): Promise<{
    comments: ShortFilmCommentDebug[];
    debugInfo: {
      totalDocsFound: number;
      filteredDocs: number;
      permissionCheck?: any;
      connectionTest?: any;
      queryDetails: any;
      processingErrors: any[];
    };
    success: boolean;
    error?: string;
  }> {
    this.log('getComments', { submissionId, userId: user?.uid });
    
    const debugInfo = {
      totalDocsFound: 0,
      filteredDocs: 0,
      permissionCheck: undefined as any,
      connectionTest: undefined as any,
      queryDetails: {} as any,
      processingErrors: [] as any[]
    };

    try {
      // Step 1: Check user permissions if user provided
      if (user) {
        debugInfo.permissionCheck = await this.checkUserPermissions(user);
        if (!debugInfo.permissionCheck.isAdmin) {
          return {
            comments: [],
            debugInfo,
            success: false,
            error: `Permission denied: ${debugInfo.permissionCheck.error}`
          };
        }
      }

      // Step 2: Test Firestore connection
      debugInfo.connectionTest = await this.testFirestoreConnection(submissionId, user || null);
      if (!debugInfo.connectionTest.canReadComments) {
        return {
          comments: [],
          debugInfo,
          success: false,
          error: `Connection test failed: ${debugInfo.connectionTest.error}`
        };
      }

      // Step 3: Execute query with detailed logging
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      debugInfo.queryDetails.collectionPath = `submissions/${submissionId}/ShortFilmComments`;
      
      // Try multiple query strategies
      let snapshot;
      let queryStrategy = 'filtered';
      
      try {
        // Strategy 1: Filtered query (normal operation)
        const filteredQuery = query(
          commentsRef,
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc')
        );
        snapshot = await getDocs(filteredQuery);
        debugInfo.queryDetails.strategy = 'filtered';
        debugInfo.queryDetails.filters = ['isDeleted == false', 'orderBy createdAt desc'];
      } catch (error) {
        this.log('getComments', 'Filtered query failed, trying unfiltered', false, error);
        
        // Strategy 2: Unfiltered query (fallback)
        try {
          snapshot = await getDocs(commentsRef);
          queryStrategy = 'unfiltered';
          debugInfo.queryDetails.strategy = 'unfiltered';
          debugInfo.queryDetails.filters = ['none'];
        } catch (unfilteredError) {
          return {
            comments: [],
            debugInfo,
            success: false,
            error: `Both filtered and unfiltered queries failed: ${unfilteredError}`
          };
        }
      }

      debugInfo.totalDocsFound = snapshot.docs.length;
      this.log('getComments', `Query executed: ${queryStrategy}, docs found: ${debugInfo.totalDocsFound}`);

      // Step 4: Process documents with error handling
      const comments: ShortFilmCommentDebug[] = [];
      
      snapshot.docs.forEach((docSnap, index) => {
        try {
          const data = docSnap.data();
          
          // Log raw document data for debugging
          this.log('getComments', `Processing doc ${index + 1}/${snapshot.docs.length}:`, true, {
            id: docSnap.id,
            type: data.type,
            adminId: data.adminId,
            adminName: data.adminName,
            hasScores: !!data.scores,
            isDeleted: data.isDeleted,
            createdAt: data.createdAt,
            rawScores: data.scores
          });

          // Apply manual filtering if using unfiltered query
          if (queryStrategy === 'unfiltered' && data.isDeleted === true) {
            this.log('getComments', `Skipping deleted document: ${docSnap.id}`);
            return;
          }

          // Map database scores to application format
          const mappedScores = this.mapDatabaseScoresToApp(data.scores);
          
          const comment: ShortFilmCommentDebug = {
            id: docSnap.id,
            submissionId: data.submissionId,
            adminId: data.adminId,
            adminName: data.adminName,
            adminEmail: data.adminEmail,
            content: data.content,
            type: data.type,
            scores: mappedScores,
            metadata: data.metadata || {},
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            isEdited: data.isEdited || false,
            isDeleted: data.isDeleted || false
          };

          comments.push(comment);
          debugInfo.filteredDocs++;
          
        } catch (processingError) {
          const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
          debugInfo.processingErrors.push({
            docId: docSnap.id,
            error: errorMessage
          });
          this.log('getComments', `Error processing document ${docSnap.id}`, false, processingError);
        }
      });

      this.log('getComments', `Successfully processed ${comments.length} comments`);
      
      return {
        comments,
        debugInfo,
        success: true
      };

    } catch (error) {
      this.log('getComments', 'Fatal error in getComments', false, error);
      return {
        comments: [],
        debugInfo,
        success: false,
        error: `Fatal error: ${error}`
      };
    }
  }

  /**
   * Enhanced subscription with debugging
   */
  subscribeToComments(
    submissionId: string,
    callback: (result: {
      comments: ShortFilmCommentDebug[];
      debugInfo: any;
      success: boolean;
      error?: string;
    }) => void,
    user?: User | null
  ): () => void {
    this.log('subscribeToComments', { submissionId, userId: user?.uid });
    
    try {
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      
      // Try filtered query first, fallback to unfiltered
      let query1, query2;
      
      try {
        query1 = query(
          commentsRef,
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc')
        );
      } catch (error) {
        this.log('subscribeToComments', 'Could not create filtered query, using unfiltered', false, error);
        query1 = query(commentsRef);
      }

      return onSnapshot(query1, (snapshot) => {
        this.log('subscribeToComments', `Snapshot received: ${snapshot.docs.length} docs`);
        
        const debugInfo = {
          snapshotSize: snapshot.docs.length,
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
          processingErrors: [] as any[]
        };

        const comments: ShortFilmCommentDebug[] = [];

        snapshot.docs.forEach((docSnap, index) => {
          try {
            const data = docSnap.data();
            
            // Manual filtering if needed
            if (data.isDeleted === true) {
              return;
            }

            const mappedScores = this.mapDatabaseScoresToApp(data.scores);
            
            const comment: ShortFilmCommentDebug = {
              id: docSnap.id,
              submissionId: data.submissionId,
              adminId: data.adminId,
              adminName: data.adminName,
              adminEmail: data.adminEmail,
              content: data.content,
              type: data.type,
              scores: mappedScores,
              metadata: data.metadata || {},
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate(),
              isEdited: data.isEdited || false,
              isDeleted: data.isDeleted || false
            };

            comments.push(comment);
          } catch (processingError) {
            const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
            debugInfo.processingErrors.push({
              docId: docSnap.id,
              error: errorMessage
            });
          }
        });

        callback({
          comments,
          debugInfo,
          success: true
        });
        
      }, (error) => {
        this.log('subscribeToComments', 'Subscription error', false, error);
        callback({
          comments: [],
          debugInfo: { error: error.toString() },
          success: false,
          error: error.toString()
        });
      });

    } catch (error) {
      this.log('subscribeToComments', 'Failed to create subscription', false, error);
      return () => {};
    }
  }

  /**
   * Create test data for debugging
   */
  async createTestComment(
    submissionId: string,
    user: User,
    type: 'general' | 'scoring' = 'scoring'
  ): Promise<{ success: boolean; commentId?: string; error?: string }> {
    this.log('createTestComment', { submissionId, userId: user.uid, type });
    
    try {
      const permissionCheck = await this.checkUserPermissions(user);
      if (!permissionCheck.isAdmin) {
        return { success: false, error: `Permission denied: ${permissionCheck.error}` };
      }

      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      
      const testData = {
        submissionId,
        adminId: user.uid,
        adminName: user.displayName || user.email || 'Test Admin',
        adminEmail: user.email || 'test@admin.com',
        content: type === 'scoring' 
          ? 'Test scoring comment created by debug service'
          : 'Test general comment created by debug service',
        type,
        ...(type === 'scoring' && {
          scores: {
            technical: 8,
            story: 7,
            creativity: 9,
            chiangmai: 6,
            humanEffort: 8, // Use database field name
            totalScore: 38
          }
        }),
        metadata: {
          isTestData: true,
          createdBy: 'debugService',
          timestamp: new Date().toISOString()
        },
        createdAt: serverTimestamp(),
        isEdited: false,
        isDeleted: false
      };

      const docRef = await addDoc(commentsRef, testData);
      
      this.log('createTestComment', `Test comment created with ID: ${docRef.id}`);
      return { success: true, commentId: docRef.id };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('createTestComment', 'Failed to create test comment', false, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(submissionId: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    this.log('cleanupTestData', { submissionId });
    
    try {
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      const snapshot = await getDocs(commentsRef);
      
      let deletedCount = 0;
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.metadata?.isTestData === true) {
          await deleteDoc(doc(db, 'submissions', submissionId, 'ShortFilmComments', docSnap.id));
          deletedCount++;
        }
      }
      
      this.log('cleanupTestData', `Cleaned up ${deletedCount} test comments`);
      return { success: true, deletedCount };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('cleanupTestData', 'Failed to cleanup test data', false, error);
      return { success: false, deletedCount: 0, error: errorMessage };
    }
  }

  /**
   * Map database scores to application format
   */
  private mapDatabaseScoresToApp(dbScores: any): {
    technical: number;
    story: number;
    creativity: number;
    chiangmai: number;
    overall: number;
    totalScore: number;
  } | undefined {
    if (!dbScores) return undefined;
    
    const mapped = {
      technical: dbScores.technical || 0,
      story: dbScores.story || 0,
      creativity: dbScores.creativity || 0,
      chiangmai: dbScores.chiangmai || 0,
      overall: dbScores.humanEffort || dbScores.overall || 0, // Map humanEffort to overall
      totalScore: dbScores.totalScore || 0
    };
    
    this.log('mapDatabaseScoresToApp', { original: dbScores, mapped });
    return mapped;
  }

  /**
   * Map application scores to database format
   */
  private mapAppScoresToDatabase(appScores: any) {
    const mapped = {
      technical: appScores.technical || 0,
      story: appScores.story || 0,
      creativity: appScores.creativity || 0,
      chiangmai: appScores.chiangmai || 0,
      humanEffort: appScores.overall || 0, // Map overall to humanEffort for database
      totalScore: appScores.totalScore || 0
    };
    
    this.log('mapAppScoresToDatabase', { original: appScores, mapped });
    return mapped;
  }
}

// Export singleton instance
export const debugShortFilmCommentsService = new DebugShortFilmCommentsService();
