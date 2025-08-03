import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface AdminNote {
  id: string;
  submissionId: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminRole?: string;
  content: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isEdited: boolean;
  editHistory?: Array<{
    editedAt: Timestamp;
    previousContent: string;
    editedBy: string;
  }>;
}

export interface CreateNoteData {
  submissionId: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminRole?: string;
  content: string;
}

export interface UpdateNoteData {
  content: string;
  editedBy: string;
}

class NotesService {
  // Create note in subcollection: submissions/{submissionId}/notes
  async createNote(noteData: CreateNoteData): Promise<string> {
    try {
      const notesRef = collection(db, 'submissions', noteData.submissionId, 'notes');
      
      const newNote = {
        submissionId: noteData.submissionId,
        adminId: noteData.adminId,
        adminName: noteData.adminName,
        adminEmail: noteData.adminEmail,
        adminRole: noteData.adminRole || 'Admin',
        content: noteData.content,
        createdAt: Timestamp.now(),
        isEdited: false
      };

      const docRef = await addDoc(notesRef, newNote);
      return docRef.id;
    } catch (error) {
      console.error('Error creating note:', error);
      throw new Error('Failed to create note');
    }
  }

  // Update existing note with edit history
  async updateNote(submissionId: string, noteId: string, updateData: UpdateNoteData): Promise<void> {
    try {
      const noteRef = doc(db, 'submissions', submissionId, 'notes', noteId);
      
      // Get current note to save in edit history
      const noteDoc = await getDoc(noteRef);
      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      const currentNote = noteDoc.data() as AdminNote;
      
      // Prepare edit history entry
      const editHistoryEntry = {
        editedAt: Timestamp.now(),
        previousContent: currentNote.content,
        editedBy: updateData.editedBy
      };

      // Update note with new content and edit history
      await updateDoc(noteRef, {
        content: updateData.content,
        updatedAt: Timestamp.now(),
        isEdited: true,
        editHistory: [...(currentNote.editHistory || []), editHistoryEntry]
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }
  }

  // Delete note completely
  async deleteNote(submissionId: string, noteId: string): Promise<void> {
    try {
      const noteRef = doc(db, 'submissions', submissionId, 'notes', noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }

  // Get all notes for a submission (sorted by createdAt desc)
  async getNotes(submissionId: string): Promise<AdminNote[]> {
    try {
      const notesRef = collection(db, 'submissions', submissionId, 'notes');
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdminNote));
    } catch (error) {
      console.error('Error getting notes:', error);
      throw new Error('Failed to get notes');
    }
  }

  // Real-time subscription to notes changes
  subscribeToNotes(submissionId: string, callback: (notes: AdminNote[]) => void): () => void {
    try {
      const notesRef = collection(db, 'submissions', submissionId, 'notes');
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AdminNote));
        
        callback(notes);
      }, (error) => {
        console.error('Error in notes subscription:', error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notes subscription:', error);
      return () => {};
    }
  }

  // Permission check
  canEditNote(note: AdminNote, currentUserId: string): boolean {
    return note.adminId === currentUserId;
  }

  // Utility function to format relative time
  formatRelativeTime(timestamp: Timestamp, language: 'en' | 'th'): string {
    const now = new Date();
    const noteTime = timestamp.toDate();
    const diffInSeconds = Math.floor((now.getTime() - noteTime.getTime()) / 1000);

    if (language === 'th') {
      if (diffInSeconds < 60) return 'เมื่อสักครู่';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} สัปดาห์ที่แล้ว`;
      return `${Math.floor(diffInSeconds / 2592000)} เดือนที่แล้ว`;
    } else {
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    }
  }

  // Get admin initials from name
  getAdminInitials(adminName: string): string {
    return adminName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  // Get consistent avatar color based on admin ID
  getAdminAvatarColor(adminId: string): string {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-green-500',
      'from-rose-500 to-pink-500',
      'from-amber-500 to-orange-500'
    ];
    
    // Use admin ID to consistently pick a color
    const hash = adminId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
}

// Export singleton instance
export const notesService = new NotesService();
export default notesService;
