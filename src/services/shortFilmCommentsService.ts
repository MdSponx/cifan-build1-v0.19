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

export interface ShortFilmComment {
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

class ShortFilmCommentsService {
  
  /**
   * Test Firestore connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test basic Firestore read operation
      const testRef = collection(db, 'submissions');
      const testQuery = query(testRef, orderBy('createdAt', 'desc'));
      await getDocs(testQuery);
      return true;
    } catch (error) {
      console.error('Firestore connection test failed:', error);
      return false;
    }
  }

  /**
   * Add a general comment
   */
  async addGeneralComment(
    submissionId: string,
    adminId: string,
    adminName: string,
    adminEmail: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      
      const commentData = {
        submissionId,
        adminId,
        adminName,
        adminEmail,
        content,
        type: 'general' as const,
        metadata: metadata || {},
        createdAt: serverTimestamp(),
        isEdited: false,
        isDeleted: false
      };

      const docRef = await addDoc(commentsRef, commentData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding general comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Add a scoring comment with scores - Enhanced with better error handling
   */
  async addScoringComment(
    submissionId: string,
    adminId: string,
    adminName: string,
    adminEmail: string,
    scores: {
      technical: number;
      story: number;
      creativity: number;
      chiangmai: number;
      overall: number;
      totalScore: number;
    },
    content?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      console.log('🔄 Adding scoring comment to Firestore...');
      console.log('📍 Submission ID:', submissionId);
      console.log('👤 Admin ID:', adminId);
      console.log('💾 Scores:', scores);
      
      // Test connection first
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        throw new Error('Firestore connection failed');
      }
      
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      console.log('📁 Comments collection path:', `submissions/${submissionId}/ShortFilmComments`);
      
      // Map application scores to database format
      const dbScores = this.mapAppScoresToDatabase(scores);
      console.log('💾 Mapped scores for database:', {
        original: scores,
        mapped: dbScores
      });
      
      // Create comment content if not provided
      let commentContent = content?.trim();
      if (!commentContent) {
        commentContent = `Score Assessment: ${scores.totalScore}/50 points\n` +
                        `• Technical Quality: ${scores.technical}/10\n` +
                        `• Story & Narrative: ${scores.story}/10\n` +
                        `• Creativity & Originality: ${scores.creativity}/10\n` +
                        `• Connection to Chiang Mai: ${scores.chiangmai}/10\n` +
                        `• Overall Impact: ${scores.overall}/10`;
      }
      
      const commentData = {
        submissionId,
        adminId,
        adminName,
        adminEmail,
        content: commentContent,
        type: 'scoring' as const,
        scores: dbScores,
        metadata: {
          ...metadata,
          actionType: 'score_submitted',
          scorePercentage: Math.round((scores.totalScore / 50) * 100)
        },
        createdAt: serverTimestamp(),
        isEdited: false,
        isDeleted: false
      };

      console.log('📝 Final comment data:', commentData);
      
      const docRef = await addDoc(commentsRef, commentData);
      console.log('✅ Comment added with ID:', docRef.id);
      
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Error in addScoringComment:', error);
      
      // Enhanced error categorization
      if ((error as any).code === 'permission-denied') {
        throw new Error('Permission denied: You do not have permission to add scores');
      } else if ((error as any).code === 'not-found') {
        throw new Error('Submission not found: The submission may have been deleted');
      } else if ((error as any).code === 'unavailable') {
        throw new Error('Service unavailable: Please try again later');
      } else if ((error as any).message?.includes('network')) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(`Failed to add scoring comment: ${(error as any).message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Map database scores to application format
   * Database uses 'humanEffort' but application uses 'overall'
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
    
    return {
      technical: dbScores.technical || 0,
      story: dbScores.story || 0,
      creativity: dbScores.creativity || 0,
      chiangmai: dbScores.chiangmai || 0,
      overall: dbScores.humanEffort || dbScores.overall || 0, // Map humanEffort to overall
      totalScore: dbScores.totalScore || 0
    };
  }

  /**
   * Map application scores to database format
   * Application uses 'overall' but database stores 'humanEffort'
   */
  private mapAppScoresToDatabase(appScores: any) {
    return {
      technical: appScores.technical || 0,
      story: appScores.story || 0,
      creativity: appScores.creativity || 0,
      chiangmai: appScores.chiangmai || 0,
      humanEffort: appScores.overall || 0, // Map overall to humanEffort for database
      totalScore: appScores.totalScore || 0
    };
  }

  /**
   * Get all comments for a submission with robust error handling and fallback strategies
   */
  async getComments(submissionId: string): Promise<ShortFilmComment[]> {
    console.log('🔍 getComments called for submissionId:', submissionId);
    
    if (!submissionId) {
      console.warn('⚠️ No submissionId provided, returning empty array');
      return [];
    }

    try {
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      console.log('📂 Comments collection reference created');
      
      let snapshot;
      let queryStrategy = 'filtered';
      
      try {
        // Strategy 1: Try filtered query first (normal operation)
        console.log('🔎 Attempting filtered query...');
        const filteredQuery = query(
          commentsRef,
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc')
        );
        snapshot = await getDocs(filteredQuery);
        console.log('✅ Filtered query successful, docs found:', snapshot.docs.length);
      } catch (queryError) {
        console.warn('⚠️ Filtered query failed, trying fallback strategies:', queryError);
        
        try {
          // Strategy 2: Try query without orderBy (in case of index issues)
          console.log('🔄 Trying query without orderBy...');
          const simpleQuery = query(
            commentsRef,
            where('isDeleted', '==', false)
          );
          snapshot = await getDocs(simpleQuery);
          queryStrategy = 'simple';
          console.log('✅ Simple query successful, docs found:', snapshot.docs.length);
        } catch (simpleError) {
          console.warn('⚠️ Simple query failed, trying unfiltered query:', simpleError);
          
          try {
            // Strategy 3: Unfiltered query (fallback)
            console.log('🔄 Trying unfiltered query...');
            snapshot = await getDocs(commentsRef);
            queryStrategy = 'unfiltered';
            console.log('✅ Unfiltered query successful, docs found:', snapshot.docs.length);
          } catch (unfilteredError) {
            console.error('❌ All query strategies failed:', unfilteredError);
            // Return empty array instead of throwing
            return [];
          }
        }
      }

      if (snapshot.docs.length === 0) {
        console.log('📋 No documents found, returning empty array');
        return [];
      }

      // Process documents with error handling
      const comments: ShortFilmComment[] = [];
      
      snapshot.docs.forEach((docSnap, index) => {
        try {
          const data = docSnap.data();
          
          console.log(`📝 Processing comment ${index + 1}/${snapshot.docs.length}:`, {
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
            console.log(`⏭️ Skipping deleted document: ${docSnap.id}`);
            return;
          }

          // Validate required fields
          if (!data.adminId || !data.adminName || !data.type) {
            console.warn(`⚠️ Document ${docSnap.id} missing required fields, skipping`);
            return;
          }

          // Map database scores to application format with error handling
          let mappedScores;
          try {
            mappedScores = this.mapDatabaseScoresToApp(data.scores);
            console.log('🔄 Mapped scores successfully:', {
              original: data.scores,
              mapped: mappedScores
            });
          } catch (mappingError) {
            console.warn(`⚠️ Error mapping scores for document ${docSnap.id}:`, mappingError);
            mappedScores = undefined;
          }

          const comment: ShortFilmComment = {
            id: docSnap.id,
            submissionId: data.submissionId || submissionId,
            adminId: data.adminId,
            adminName: data.adminName,
            adminEmail: data.adminEmail || '',
            content: data.content || '',
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
          console.error(`❌ Error processing document ${docSnap.id}:`, processingError);
          // Continue processing other documents instead of failing completely
        }
      });

      // Sort comments if we used unfiltered query
      if (queryStrategy === 'unfiltered' || queryStrategy === 'simple') {
        comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        console.log('🔄 Manually sorted comments by createdAt desc');
      }
      
      console.log(`✅ Successfully processed ${comments.length} comments using ${queryStrategy} strategy`);
      return comments;
      
    } catch (error) {
      console.error('❌ Fatal error in getComments:', error);
      console.error('❌ Error details:', {
        code: (error as any).code,
        message: (error as any).message,
        name: (error as any).name
      });
      
      // Return empty array instead of throwing to prevent UI crashes
      console.log('🔄 Returning empty array due to error');
      return [];
    }
  }

  /**
   * Subscribe to real-time comments updates with robust error handling and fallback strategies
   */
  subscribeToComments(
    submissionId: string,
    callback: (comments: ShortFilmComment[]) => void,
    onError?: (error: any) => void
  ): () => void {
    console.log('🔍 Setting up comments subscription for submission:', submissionId);
    
    if (!submissionId) {
      console.warn('⚠️ No submissionId provided for subscription');
      callback([]);
      return () => {};
    }

    try {
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      
      // Try multiple query strategies for subscription
      let unsubscribe: (() => void) | null = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      const setupSubscription = (queryToUse: any, strategyName: string) => {
        console.log(`📡 Setting up ${strategyName} subscription (attempt ${retryCount + 1})...`);
        
        return onSnapshot(queryToUse, (snapshot: any) => {
          console.log(`📊 ${strategyName} snapshot received:`, {
            docCount: snapshot.docs.length,
            fromCache: snapshot.metadata.fromCache,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
            isEmpty: snapshot.empty
          });

          const comments: ShortFilmComment[] = [];

          snapshot.docs.forEach((docSnap: any, index: number) => {
            try {
              const data = docSnap.data();
              
              console.log(`📄 Processing subscription document ${index + 1}:`, {
                id: docSnap.id,
                type: data.type,
                hasScores: !!data.scores,
                adminId: data.adminId,
                adminName: data.adminName,
                isDeleted: data.isDeleted,
                rawScores: data.scores
              });

              // Manual filtering for unfiltered queries
              if (strategyName === 'unfiltered' && data.isDeleted === true) {
                console.log(`⏭️ Skipping deleted document in subscription: ${docSnap.id}`);
                return;
              }

              // Validate required fields
              if (!data.adminId || !data.adminName || !data.type) {
                console.warn(`⚠️ Subscription document ${docSnap.id} missing required fields, skipping`);
                return;
              }

              // Map database scores to application format with error handling
              let mappedScores;
              try {
                mappedScores = this.mapDatabaseScoresToApp(data.scores);
                if (mappedScores) {
                  console.log(`🔄 Mapped scores for ${docSnap.id}:`, {
                    original: data.scores,
                    mapped: mappedScores
                  });
                }
              } catch (mappingError) {
                console.warn(`⚠️ Error mapping scores in subscription for document ${docSnap.id}:`, mappingError);
                mappedScores = undefined;
              }

              const comment: ShortFilmComment = {
                id: docSnap.id,
                submissionId: data.submissionId || submissionId,
                adminId: data.adminId,
                adminName: data.adminName,
                adminEmail: data.adminEmail || '',
                content: data.content || '',
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
              console.error(`❌ Error processing subscription document ${docSnap.id}:`, processingError);
              // Continue processing other documents
            }
          });

          // Sort if needed
          if (strategyName === 'unfiltered' || strategyName === 'simple') {
            comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }
          
          console.log(`✅ ${strategyName} subscription processed ${comments.length} comments`);
          
          // Reset retry count on successful callback
          retryCount = 0;
          callback(comments);
          
        }, (error: any) => {
          console.error(`❌ Error in ${strategyName} subscription:`, error);
          console.error('❌ Error details:', {
            code: error.code,
            message: error.message,
            name: error.name,
            retryCount
          });
          
          // Call error callback if provided
          if (onError) {
            onError(error);
          }
          
          // Try fallback strategy if this one fails
          if (strategyName === 'filtered' && retryCount < maxRetries) {
            console.log('🔄 Filtered subscription failed, trying simple subscription...');
            if (unsubscribe) unsubscribe();
            retryCount++;
            
            try {
              const simpleQuery = query(commentsRef, where('isDeleted', '==', false));
              unsubscribe = setupSubscription(simpleQuery, 'simple');
            } catch (simpleError) {
              console.log('🔄 Simple subscription failed, trying unfiltered subscription...');
              unsubscribe = setupSubscription(commentsRef, 'unfiltered');
            }
          } else if (strategyName === 'simple' && retryCount < maxRetries) {
            console.log('🔄 Simple subscription failed, trying unfiltered subscription...');
            if (unsubscribe) unsubscribe();
            retryCount++;
            unsubscribe = setupSubscription(commentsRef, 'unfiltered');
          } else {
            // All strategies failed or max retries reached
            console.error('❌ All subscription strategies failed or max retries reached');
            callback([]);
          }
        });
      };

      // Start with filtered query
      try {
        const filteredQuery = query(
          commentsRef,
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc')
        );
        unsubscribe = setupSubscription(filteredQuery, 'filtered');
      } catch (queryError) {
        console.warn('⚠️ Could not create filtered query, trying simple query:', queryError);
        
        try {
          const simpleQuery = query(commentsRef, where('isDeleted', '==', false));
          unsubscribe = setupSubscription(simpleQuery, 'simple');
        } catch (simpleError) {
          console.warn('⚠️ Could not create simple query, using unfiltered:', simpleError);
          unsubscribe = setupSubscription(commentsRef, 'unfiltered');
        }
      }

      return () => {
        console.log('🧹 Cleaning up comments subscription');
        if (unsubscribe) {
          unsubscribe();
        }
      };
      
    } catch (error) {
      console.error('❌ Fatal error setting up comments subscription:', error);
      if (onError) {
        onError(error);
      }
      callback([]);
      return () => {};
    }
  }

  /**
   * Update a comment
   */
  async updateComment(
    submissionId: string,
    commentId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const commentRef = doc(db, 'submissions', submissionId, 'ShortFilmComments', commentId);
      
      await updateDoc(commentRef, {
        content,
        metadata: metadata || {},
        updatedAt: serverTimestamp(),
        isEdited: true
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(submissionId: string, commentId: string): Promise<void> {
    try {
      const commentRef = doc(db, 'submissions', submissionId, 'ShortFilmComments', commentId);
      
      await updateDoc(commentRef, {
        isDeleted: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Get the latest score by a specific admin - Enhanced with better error handling
   */
  async getLatestScoreByAdmin(submissionId: string, adminId: string): Promise<ShortFilmComment | null> {
    try {
      console.log('🔍 Getting latest score by admin:', { submissionId, adminId });
      
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      console.log('📁 Comments collection path:', `submissions/${submissionId}/ShortFilmComments`);
      
      // Use the simplest query that works reliably
      console.log('🔎 Using simple query to find admin comments...');
      const simpleQuery = query(
        commentsRef,
        where('adminId', '==', adminId),
        where('type', '==', 'scoring')
      );
      
      const snapshot = await getDocs(simpleQuery);
      console.log('✅ Query successful, total docs found:', snapshot.docs.length);
      
      if (snapshot.empty) {
        console.log('📋 No scoring comments found for admin:', adminId);
        return null;
      }
      
      // Filter out deleted comments and get the latest one
      const validDocs = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          const isValid = !data.isDeleted;
          
          console.log('📄 Checking document:', {
            id: doc.id,
            adminId: data.adminId,
            type: data.type,
            isDeleted: data.isDeleted,
            isValid,
            createdAt: data.createdAt?.toDate()
          });
          
          return isValid;
        })
        .sort((a, b) => {
          // Sort by createdAt descending (newest first)
          const aTime = a.data().createdAt?.toDate()?.getTime() || 0;
          const bTime = b.data().createdAt?.toDate()?.getTime() || 0;
          return bTime - aTime;
        });
      
      if (validDocs.length === 0) {
        console.log('📋 No valid (non-deleted) scoring comments found after filtering');
        return null;
      }
      
      const latestDoc = validDocs[0];
      const data = latestDoc.data();
      
      console.log('📄 Latest score document selected:', {
        id: latestDoc.id,
        adminId: data.adminId,
        adminName: data.adminName,
        type: data.type,
        hasScores: !!data.scores,
        isDeleted: data.isDeleted,
        createdAt: data.createdAt?.toDate()
      });
      
      // Map database scores to application format
      const mappedScores = this.mapDatabaseScoresToApp(data.scores);
      console.log('🔄 Mapped latest score by admin:', {
        original: data.scores,
        mapped: mappedScores
      });
      
      const result: ShortFilmComment = {
        id: latestDoc.id,
        submissionId: data.submissionId || submissionId,
        adminId: data.adminId,
        adminName: data.adminName,
        adminEmail: data.adminEmail || '',
        content: data.content || '',
        type: data.type,
        scores: mappedScores,
        metadata: data.metadata || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        isEdited: data.isEdited || false,
        isDeleted: data.isDeleted || false
      };
      
      console.log('✅ Successfully retrieved latest score by admin:', {
        id: result.id,
        totalScore: result.scores?.totalScore
      });
      return result;
      
    } catch (error) {
      console.error('❌ Error in getLatestScoreByAdmin:', error);
      console.error('❌ Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        name: (error as any)?.name,
        submissionId,
        adminId
      });
      
      // Return null instead of throwing to allow fallback to create new
      console.log('🔄 Returning null due to error, will create new comment');
      return null;
    }
  }

  /**
   * Add a status change comment
   */
  async addStatusChangeComment(
    submissionId: string,
    adminId: string,
    adminName: string,
    adminEmail: string,
    oldStatus: string,
    newStatus: string,
    reason?: string
  ): Promise<string> {
    try {
      const content = reason || `Status changed from ${oldStatus} to ${newStatus}`;
      const metadata = {
        oldStatus,
        newStatus,
        reason
      };

      return await this.addGeneralComment(
        submissionId,
        adminId,
        adminName,
        adminEmail,
        content,
        { ...metadata, type: 'status_change' }
      );
    } catch (error) {
      console.error('Error adding status change comment:', error);
      throw new Error('Failed to add status change comment');
    }
  }

  /**
   * Update a scoring comment with new scores - Enhanced with better error handling
   */
  async updateScoringComment(
    submissionId: string,
    commentId: string,
    scores: {
      technical: number;
      story: number;
      creativity: number;
      chiangmai: number;
      overall: number;
      totalScore: number;
    },
    comments: string,
    editedBy: string
  ): Promise<void> {
    try {
      console.log('🔄 Updating scoring comment...');
      console.log('📍 Submission ID:', submissionId);
      console.log('📝 Comment ID:', commentId);
      console.log('👤 Edited by:', editedBy);
      console.log('💾 New scores:', scores);
      
      // Validate inputs
      if (!submissionId || !commentId || !editedBy) {
        throw new Error('Missing required parameters for update');
      }
      
      // Test connection first
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        throw new Error('Firestore connection failed');
      }
      
      const commentRef = doc(db, 'submissions', submissionId, 'ShortFilmComments', commentId);
      console.log('📁 Comment reference path:', `submissions/${submissionId}/ShortFilmComments/${commentId}`);
      
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        console.error('❌ Comment document not found');
        throw new Error('Comment not found - it may have been deleted or the ID is incorrect');
      }

      const currentData = commentDoc.data();
      console.log('📄 Current comment data:', {
        id: commentDoc.id,
        type: currentData?.type,
        adminId: currentData?.adminId,
        hasScores: !!currentData?.scores
      });
      
      // Verify this is a scoring comment
      if (currentData?.type !== 'scoring') {
        throw new Error('Cannot update non-scoring comment with scores');
      }
      
      // Verify the user has permission to edit this comment
      if (currentData?.adminId !== editedBy) {
        console.warn('⚠️ User attempting to edit comment they did not create');
        // Allow for now, but log the warning
      }
      
      // Map application scores to database format
      const dbScores = this.mapAppScoresToDatabase(scores);
      console.log('💾 Mapped scores for database update:', {
        original: scores,
        mapped: dbScores
      });
      
      // Create new content
      let content = comments?.trim() || '';
      if (!content) {
        content = `Score Assessment (Updated): ${scores.totalScore}/50 points\n` +
                 `• Technical Quality: ${scores.technical}/10\n` +
                 `• Story & Narrative: ${scores.story}/10\n` +
                 `• Creativity & Originality: ${scores.creativity}/10\n` +
                 `• Connection to Chiang Mai: ${scores.chiangmai}/10\n` +
                 `• Overall Impact: ${scores.overall}/10`;
      }

      const editHistory = currentData?.editHistory || [];
      
      // Create edit history entry with current timestamp (not serverTimestamp)
      const currentTime = new Date();
      
      const updateData = {
        content,
        scores: dbScores,
        updatedAt: serverTimestamp(),
        isEdited: true,
        editHistory: [
          ...editHistory,
          {
            editedAt: currentTime, // Use regular Date instead of serverTimestamp
            previousContent: currentData?.content || '',
            previousScores: currentData?.scores || {},
            editedBy
          }
        ],
        metadata: {
          ...(currentData?.metadata || {}),
          actionType: 'score_updated',
          scorePercentage: Math.round((scores.totalScore / 50) * 100),
          lastEditedBy: editedBy,
          editCount: (currentData?.metadata?.editCount || 0) + 1
        }
      };
      
      console.log('📝 Update data prepared:', updateData);
      
      await updateDoc(commentRef, updateData);
      console.log('✅ Scoring comment updated successfully');
      
    } catch (error) {
      console.error('❌ Error in updateScoringComment:', error);
      console.error('❌ Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        name: (error as any)?.name,
        submissionId,
        commentId,
        editedBy
      });
      
      // Enhanced error categorization
      if ((error as any).code === 'permission-denied') {
        throw new Error('Permission denied: You do not have permission to update this score');
      } else if ((error as any).code === 'not-found') {
        throw new Error('Score not found: The score may have been deleted');
      } else if ((error as any).code === 'unavailable') {
        throw new Error('Service unavailable: Please try again later');
      } else if ((error as any).message?.includes('network')) {
        throw new Error('Network error: Please check your connection');
      } else if ((error as any).message?.includes('Comment not found')) {
        throw new Error('Score comment not found: It may have been deleted by another admin');
      } else if ((error as any).message?.includes('Missing required parameters')) {
        throw new Error('Invalid update request: Missing required information');
      } else {
        throw new Error(`Failed to update scoring comment: ${(error as any).message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Check existing score with detailed validation - Enhanced method for decision making
   */
  async checkExistingScore(submissionId: string, adminId: string): Promise<{
    exists: boolean;
    comment: ShortFilmComment | null;
    shouldUpdate: boolean;
    reason: string;
  }> {
    try {
      console.log('🔍 Checking existing score with validation:', { submissionId, adminId });
      
      // Get the latest score by this admin
      const existingScore = await this.getLatestScoreByAdmin(submissionId, adminId);
      
      if (!existingScore) {
        return {
          exists: false,
          comment: null,
          shouldUpdate: false,
          reason: 'No existing score found'
        };
      }
      
      // Validate the existing score
      if (existingScore.isDeleted) {
        return {
          exists: true,
          comment: existingScore,
          shouldUpdate: false,
          reason: 'Existing score is deleted'
        };
      }
      
      if (existingScore.adminId !== adminId) {
        return {
          exists: true,
          comment: existingScore,
          shouldUpdate: false,
          reason: 'Score belongs to different admin'
        };
      }
      
      if (existingScore.type !== 'scoring') {
        return {
          exists: true,
          comment: existingScore,
          shouldUpdate: false,
          reason: 'Comment is not a scoring type'
        };
      }
      
      if (!existingScore.scores) {
        return {
          exists: true,
          comment: existingScore,
          shouldUpdate: false,
          reason: 'Comment has no scores data'
        };
      }
      
      // All validations passed
      return {
        exists: true,
        comment: existingScore,
        shouldUpdate: true,
        reason: 'Valid existing score found, can update'
      };
      
    } catch (error) {
      console.error('❌ Error in checkExistingScore:', error);
      return {
        exists: false,
        comment: null,
        shouldUpdate: false,
        reason: `Error checking existing score: ${(error as any)?.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Add a flag comment
   */
  async addFlagComment(
    submissionId: string,
    adminId: string,
    adminName: string,
    adminEmail: string,
    flagged: boolean,
    reason?: string
  ): Promise<string> {
    try {
      const content = flagged 
        ? `Application flagged${reason ? `: ${reason}` : ''}`
        : 'Application unflagged';
      
      const metadata = {
        flagged,
        reason
      };

      return await this.addGeneralComment(
        submissionId,
        adminId,
        adminName,
        adminEmail,
        content,
        { ...metadata, type: 'flag' }
      );
    } catch (error) {
      console.error('Error adding flag comment:', error);
      throw new Error('Failed to add flag comment');
    }
  }
}

// Export singleton instance
export const shortFilmCommentsService = new ShortFilmCommentsService();
