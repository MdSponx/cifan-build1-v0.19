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
   * Get all comments for a submission
   */
  async getComments(submissionId: string): Promise<ShortFilmComment[]> {
    try {
      console.log('🔍 getComments called for submissionId:', submissionId);
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      console.log('📂 Comments collection reference created');
      
      const q = query(
        commentsRef,
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      console.log('🔎 Query created with filters');
      
      const snapshot = await getDocs(q);
      console.log('📊 Query executed, docs found:', snapshot.docs.length);
      
      if (snapshot.docs.length === 0) {
        console.log('⚠️ No documents found in ShortFilmComments subcollection');
        console.log('🔍 Checking if subcollection exists by trying to get all docs...');
        
        // Try without filters to see if there are any docs at all
        const allDocsSnapshot = await getDocs(commentsRef);
        console.log('📋 Total docs in subcollection (including deleted):', allDocsSnapshot.docs.length);
        
        if (allDocsSnapshot.docs.length > 0) {
          console.log('📄 Found docs, checking their structure:');
          allDocsSnapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`Doc ${index + 1}:`, {
              id: doc.id,
              type: data.type,
              isDeleted: data.isDeleted,
              hasScores: !!data.scores,
              adminId: data.adminId,
              createdAt: data.createdAt,
              rawScores: data.scores // Log raw scores to see field names
            });
          });
        }
      }
      
      const comments = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        console.log('📝 Processing comment:', {
          id: doc.id,
          type: data.type,
          adminId: data.adminId,
          hasScores: !!data.scores,
          rawScores: data.scores // Log raw scores
        });
        
        // Map database scores to application format
        const mappedScores = this.mapDatabaseScoresToApp(data.scores);
        console.log('🔄 Mapped scores:', {
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
      });
      
      console.log('✅ Returning', comments.length, 'comments');
      return comments;
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      console.error('❌ Error details:', {
        code: (error as any).code,
        message: (error as any).message,
        stack: (error as any).stack
      });
      throw new Error('Failed to fetch comments');
    }
  }

  /**
   * Subscribe to real-time comments updates
   */
  subscribeToComments(
    submissionId: string,
    callback: (comments: ShortFilmComment[]) => void
  ): () => void {
    try {
      console.log('🔍 Setting up comments subscription for submission:', submissionId);
      const commentsRef = collection(db, 'submissions', submissionId, 'ShortFilmComments');
      const q = query(
        commentsRef,
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (snapshot: any) => {
        console.log('📊 Comments snapshot received:');
        console.log('- Document count:', snapshot.docs.length);
        console.log('- Snapshot metadata:', snapshot.metadata);
        
        if (snapshot.docs.length === 0) {
          console.log('⚠️ No comments found in ShortFilmComments subcollection');
        }

        const comments = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          console.log('📄 Processing comment document:', {
            id: doc.id,
            type: data.type,
            hasScores: !!data.scores,
            adminId: data.adminId,
            adminName: data.adminName,
            isDeleted: data.isDeleted,
            rawScores: data.scores // Log raw scores
          });
          
          // Map database scores to application format
          const mappedScores = this.mapDatabaseScoresToApp(data.scores);
          console.log('🔄 Mapped scores in subscription:', {
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
        });
        
        console.log('✅ Processed comments:', comments.length);
        console.log('📋 Comments summary:', comments.map((c: ShortFilmComment) => ({
          id: c.id,
          type: c.type,
          hasScores: !!c.scores,
          adminName: c.adminName
        })));
        
        callback(comments);
      }, (error: any) => {
        console.error('❌ Error in comments subscription:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Full error:', error);
        callback([]);
      });
    } catch (error) {
      console.error('❌ Error setting up comments subscription:', error);
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
