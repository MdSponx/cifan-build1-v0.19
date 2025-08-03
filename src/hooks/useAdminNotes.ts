import { useState, useEffect, useCallback } from 'react';
import { AdminNote, CreateNoteData, notesService } from '../services/notesService';
import { useAdmin } from '../components/admin/AdminContext';

interface UseAdminNotesReturn {
  notes: AdminNote[];
  loading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createNote: (content: string) => Promise<void>;
  updateNote: (noteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
  canEditNote: (note: AdminNote) => boolean;
}

export const useAdminNotes = (submissionId: string): UseAdminNotesReturn => {
  const { adminProfile } = useAdmin();
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Set up real-time subscription to notes
  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = notesService.subscribeToNotes(submissionId, (updatedNotes) => {
      setNotes(updatedNotes);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [submissionId]);

  // Create a new note
  const createNote = useCallback(async (content: string): Promise<void> => {
    if (!adminProfile || !content.trim()) {
      throw new Error('Missing admin profile or content');
    }

    setIsCreating(true);
    setError(null);

    try {
      const noteData: CreateNoteData = {
        submissionId,
        adminId: adminProfile.uid,
        adminName: adminProfile.fullNameEN,
        adminEmail: adminProfile.email,
        adminRole: adminProfile.adminRole,
        content: content.trim()
      };

      await notesService.createNote(noteData);
      // Note will be updated via real-time subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [submissionId, adminProfile]);

  // Update an existing note
  const updateNote = useCallback(async (noteId: string, content: string): Promise<void> => {
    if (!adminProfile || !content.trim()) {
      throw new Error('Missing admin profile or content');
    }

    setIsUpdating(true);
    setError(null);

    try {
      await notesService.updateNote(submissionId, noteId, {
        content: content.trim(),
        editedBy: adminProfile.fullNameEN
      });
      // Note will be updated via real-time subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [submissionId, adminProfile]);

  // Delete a note
  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    try {
      await notesService.deleteNote(submissionId, noteId);
      // Note will be removed via real-time subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [submissionId]);

  // Refresh notes manually (fallback)
  const refreshNotes = useCallback(async (): Promise<void> => {
    if (!submissionId) return;

    setLoading(true);
    setError(null);

    try {
      const updatedNotes = await notesService.getNotes(submissionId);
      setNotes(updatedNotes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh notes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  // Check if current admin can edit a note
  const canEditNote = useCallback((note: AdminNote): boolean => {
    if (!adminProfile) return false;
    return notesService.canEditNote(note, adminProfile.uid);
  }, [adminProfile]);

  return {
    notes,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes,
    canEditNote
  };
};
