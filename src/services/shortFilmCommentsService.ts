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
   * Add a scoring comment with scores
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
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      
      // Map application scores to database format
      const dbScores = this.mapAppScoresToDatabase(scores);
      console.log('💾 Saving scores to database:', {
        original: scores,
        mapped: dbScores
      });
      
      const commentData = {
        submissionId,
        adminId,
        adminName,
        adminEmail,
        content: content || '',
        type: 'scoring' as const,
        scores: dbScores, // Use mapped scores
        metadata: metadata || {},
        createdAt: serverTimestamp(),
        isEdited: false,
        isDeleted: false
      };

      const docRef = await addDoc(commentsRef, commentData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding scoring comment:', error);
      throw new Error('Failed to add scoring comment');
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
   * Get the latest score by a specific admin
   */
  async getLatestScoreByAdmin(submissionId: string, adminId: string): Promise<ShortFilmComment | null> {
    try {
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      const q = query(
        commentsRef,
        where('adminId', '==', adminId),
        where('type', '==', 'scoring'),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      // Map database scores to application format
      const mappedScores = this.mapDatabaseScoresToApp(data.scores);
      console.log('🔄 Mapped latest score by admin:', {
        original: data.scores,
        mapped: mappedScores
      });
      
      return {
        id: doc.id,
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
    } catch (error) {
      console.error('Error fetching latest score by admin:', error);
      throw new Error('Failed to fetch latest score');
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
   * Update a scoring comment with new scores
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
      const commentRef = doc(db, 'submissions', submissionId, 'ShortFilmComments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const currentData = commentDoc.data();
      
      // Map application scores to database format
      const dbScores = this.mapAppScoresToDatabase(scores);
      console.log('💾 Updating scores in database:', {
        original: scores,
        mapped: dbScores
      });
      
      // Create new content
      let content = comments.trim();
      if (!content) {
        content = `Score Assessment (Updated): ${scores.totalScore}/50 points\n` +
                 `• Technical Quality: ${scores.technical}/10\n` +
                 `• Story & Narrative: ${scores.story}/10\n` +
                 `• Creativity & Originality: ${scores.creativity}/10\n` +
                 `• Connection to Chiang Mai: ${scores.chiangmai}/10\n` +
                 `• Overall Impact: ${scores.overall}/10`;
      }

      const editHistory = currentData.editHistory || [];
      
      await updateDoc(commentRef, {
        content,
        scores: dbScores, // Use mapped scores
        updatedAt: serverTimestamp(),
        isEdited: true,
        editHistory: [
          ...editHistory,
          {
            editedAt: serverTimestamp(),
            previousContent: currentData.content,
            previousScores: currentData.scores,
            editedBy
          }
        ],
        metadata: {
          ...currentData.metadata,
          actionType: 'score_updated',
          scorePercentage: Math.round((scores.totalScore / 50) * 100)
        }
      });
    } catch (error) {
      console.error('Error updating scoring comment:', error);
      throw new Error('Failed to update scoring comment');
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
