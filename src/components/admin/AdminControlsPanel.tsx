import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { AdminApplicationData, AdminControlsPanelProps } from '../../types/admin.types';
import { 
  Shield, 
  Flag, 
  Download, 
  Printer, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Save,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';
import { useAdminNotes } from '../../hooks/useAdminNotes';
import { notesService } from '../../services/notesService';

const AdminControlsPanel: React.FC<AdminControlsPanelProps> = ({
  application,
  onStatusChange,
  onNotesChange,
  onFlagToggle,
  onExport,
  onPrint,
  isUpdating = false
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  // Real notes system state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Use the admin notes hook
  const {
    notes: adminNotes,
    loading: notesLoading,
    isCreating,
    isUpdating: isUpdatingNote,
    isDeleting,
    createNote,
    updateNote,
    deleteNote,
    canEditNote
  } = useAdminNotes(application.id);

  const content = {
    th: {
      title: "การควบคุมผู้ดูแล",
      subtitle: "จัดการสถานะและบันทึกของใบสมัคร",
      
      // Status management
      statusManagement: "การจัดการสถานะ",
      currentStatus: "สถานะปัจจุบัน",
      changeStatus: "เปลี่ยนสถานะ",
      draft: "ร่าง",
      submitted: "ส่งแล้ว",
      underReview: "กำลังพิจารณา",
      accepted: "ผ่าน",
      rejected: "ไม่ผ่าน",
      
      // Admin notes
      adminNotes: "บันทึกผู้ดูแล",
      notesPlaceholder: "เขียนบันทึกส่วนตัวเกี่ยวกับใบสมัครนี้...",
      saveNotes: "บันทึกหมายเหตุ",
      saving: "กำลังบันทึก...",
      
      // New notes system
      addNewNote: "เพิ่มบันทึกใหม่",
      newNotePlaceholder: "เขียนบันทึกเกี่ยวกับใบสมัครนี้ เช่น เอกสารที่ขาดหายไป หรือปัญหาเรื่องอายุ...",
      adminActivityLog: "บันทึกการทำงานของผู้ดูแล",
      addNote: "เพิ่มบันทึก",
      editNote: "แก้ไขบันทึก",
      deleteNote: "ลบบันทึก",
      confirmDelete: "คุณแน่ใจหรือไม่ที่จะลบบันทึกนี้?",
      noNotes: "ยังไม่มีบันทึก",
      edited: "แก้ไขแล้ว",
      
      // Flag system
      flagApplication: "ตั้งค่าสถานะพิเศษ",
      unflagApplication: "ยกเลิกสถานะพิเศษ",
      flagReason: "เหตุผลในการตั้งค่าสถานะพิเศษ",
      flagReasonPlaceholder: "ระบุเหตุผล...",
      flagged: "ตั้งค่าสถานะพิเศษแล้ว",
      
      // Actions
      quickActions: "การดำเนินการด่วน",
      exportData: "ส่งออกข้อมูล",
      printView: "พิมพ์",
      
      // Confirmations
      confirmStatusChange: "คุณแน่ใจหรือไม่ที่จะเปลี่ยนสถานะ?",
      confirmFlag: "ตั้งค่าสถานะพิเศษ",
      confirmUnflag: "ยกเลิกสถานะพิเศษ",
      cancel: "ยกเลิก",
      confirm: "ยืนยัน"
    },
    en: {
      title: "Admin Controls",
      subtitle: "Manage application status and notes",
      
      // Status management
      statusManagement: "Status Management",
      currentStatus: "Current Status",
      changeStatus: "Change Status",
      draft: "Draft",
      submitted: "Submitted",
      underReview: "Under Review",
      accepted: "Accepted",
      rejected: "Rejected",
      
      // Admin notes
      adminNotes: "Admin Notes",
      notesPlaceholder: "Write private notes about this application...",
      saveNotes: "Save Notes",
      saving: "Saving...",
      
      // New notes system
      addNewNote: "Add New Note",
      newNotePlaceholder: "Write a note about this application, e.g., missing documents or age issues...",
      adminActivityLog: "Admin Activity Log",
      addNote: "Add Note",
      editNote: "Edit Note",
      deleteNote: "Delete Note",
      confirmDelete: "Are you sure you want to delete this note?",
      noNotes: "No notes yet",
      edited: "edited",
      
      // Flag system
      flagApplication: "Flag Application",
      unflagApplication: "Unflag Application",
      flagReason: "Flag Reason",
      flagReasonPlaceholder: "Specify reason...",
      flagged: "Flagged",
      
      // Actions
      quickActions: "Quick Actions",
      exportData: "Export Data",
      printView: "Print View",
      
      // Confirmations
      confirmStatusChange: "Are you sure you want to change the status?",
      confirmFlag: "Flag Application",
      confirmUnflag: "Unflag Application",
      cancel: "Cancel",
      confirm: "Confirm"
    }
  };

  const currentContent = content[currentLanguage];

  const statusOptions = [
    { value: 'draft', label: currentContent.draft, icon: <Clock className="w-4 h-4" />, color: 'text-yellow-400' },
    { value: 'submitted', label: currentContent.submitted, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-blue-400' },
    { value: 'under-review', label: currentContent.underReview, icon: <Shield className="w-4 h-4" />, color: 'text-purple-400' },
    { value: 'accepted', label: currentContent.accepted, icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400' },
    { value: 'rejected', label: currentContent.rejected, icon: <XCircle className="w-4 h-4" />, color: 'text-red-400' }
  ];

  const currentStatusOption = statusOptions.find(option => option.value === application.reviewStatus);

  const handleStatusChange = async (newStatus: AdminApplicationData['reviewStatus']) => {
    const confirmed = window.confirm(currentContent.confirmStatusChange);
    if (confirmed) {
      await onStatusChange(newStatus);
    }
  };

  const handleFlagToggle = async () => {
    if (application.flagged) {
      // Unflag
      const confirmed = window.confirm(currentContent.confirmUnflag);
      if (confirmed) {
        await onFlagToggle(false);
      }
    } else {
      // Flag - show dialog
      setShowFlagDialog(true);
    }
  };

  const handleConfirmFlag = async () => {
    await onFlagToggle(true, flagReason);
    setShowFlagDialog(false);
    setFlagReason('');
  };

  // Real notes system handlers
  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;
    try {
      await createNote(newNoteContent);
      setNewNoteContent('');
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleStartEdit = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditingContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingContent.trim()) return;
    try {
      await updateNote(editingNoteId, editingContent);
      setEditingNoteId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleDeleteNote = async (noteId: string) => {
    const confirmed = window.confirm(currentContent.confirmDelete);
    if (confirmed) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* Admin Controls - Single Flexible Container */}
      <div className="glass-container rounded-2xl p-6 sm:p-8 min-h-fit">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-xl ${getClass('header')} text-white mb-2 flex items-center space-x-2`}>
              <Shield className="w-6 h-6 text-[#FCB283]" />
              <span>{currentContent.title}</span>
            </h3>
            <p className={`${getClass('body')} text-white/70 text-sm`}>
              {currentContent.subtitle}
            </p>
          </div>
          
          {/* Flag Status */}
          {application.flagged && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
              <Flag className="w-4 h-4 text-red-400" />
              <span className={`text-red-400 text-sm ${getClass('body')}`}>
                {currentContent.flagged}
              </span>
            </div>
          )}
        </div>

        {/* Status Management */}
        <div className="mb-8">
          <h4 className={`${getClass('subtitle')} text-white mb-4`}>
            {currentContent.statusManagement}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Status */}
            <div className="glass-card p-4 rounded-xl">
              <h5 className={`${getClass('body')} text-white/80 mb-3 text-sm`}>
                {currentContent.currentStatus}
              </h5>
              <div className="flex items-center space-x-3">
                {currentStatusOption && (
                  <>
                    <span className={currentStatusOption.color}>
                      {currentStatusOption.icon}
                    </span>
                    <span className={`${getClass('body')} text-white font-medium`}>
                      {currentStatusOption.label}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Status Change */}
            <div className="glass-card p-4 rounded-xl">
              <h5 className={`${getClass('body')} text-white/80 mb-3 text-sm`}>
                {currentContent.changeStatus}
              </h5>
              <select
                value={application.reviewStatus}
                onChange={(e) => {
                  const newStatus = e.target.value as AdminApplicationData['reviewStatus'];
                  if (newStatus !== application.reviewStatus) {
                    handleStatusChange(newStatus);
                  }
                }}
                disabled={isUpdating}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-[#110D16]">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Admin Notes Log */}
        <div className="mb-8">
          <h4 className={`${getClass('subtitle')} text-white mb-4 flex items-center space-x-2`}>
            <MessageSquare className="w-5 h-5 text-[#FCB283]" />
            <span>{currentContent.adminNotes}</span>
          </h4>
          
          {/* Real Notes System - Replace Mock Data */}
          <div className="mb-6">
            <h5 className={`${getClass('body')} text-white/80 mb-3 text-sm`}>
              {currentContent.adminActivityLog}
            </h5>
            
            {/* Add New Note Form */}
            <div className="mb-4 glass-card p-4 rounded-xl">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder={currentContent.newNotePlaceholder}
                rows={3}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none resize-vertical"
              />
              {newNoteContent.trim() && (
                <div className="flex justify-end mt-3">
                  <AnimatedButton
                    variant="primary"
                    size="small"
                    onClick={isCreating ? undefined : handleCreateNote}
                    className={isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {isCreating ? currentContent.saving : currentContent.addNote}
                  </AnimatedButton>
                </div>
              )}
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {notesLoading ? (
                <div className="glass-card p-4 rounded-xl">
                  <p className="text-white/60 text-center">Loading notes...</p>
                </div>
              ) : adminNotes.length === 0 ? (
                <div className="glass-card p-4 rounded-xl">
                  <p className="text-white/60 text-center">{currentContent.noNotes}</p>
                </div>
              ) : (
                adminNotes.map((note) => (
                  <div key={note.id} className="glass-card p-4 rounded-xl border-l-4 border-blue-400">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${notesService.getAdminAvatarColor(note.adminId)} flex items-center justify-center text-white font-bold text-xs`}>
                          {notesService.getAdminInitials(note.adminName)}
                        </div>
                        <div>
                          <p className={`${getClass('body')} text-white font-medium text-sm`}>
                            {note.adminName}
                          </p>
                          <p className={`text-xs ${getClass('body')} text-white/60`}>
                            {note.adminRole || 'Admin'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${getClass('body')} text-white/60`}>
                          {notesService.formatRelativeTime(note.createdAt, currentLanguage)}
                          {note.isEdited && ` • ${currentContent.edited}`}
                        </span>
                        {canEditNote(note) && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleStartEdit(note.id, note.content)}
                              className="p-1 text-white/60 hover:text-white transition-colors"
                              title={currentContent.editNote}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={isDeleting ? undefined : () => handleDeleteNote(note.id)}
                              className={`p-1 text-white/60 hover:text-red-400 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={currentContent.deleteNote}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          className="w-full p-2 bg-white/5 border border-white/10 rounded text-white text-sm resize-vertical"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-xs text-white/60 hover:text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <button
                            onClick={isUpdatingNote ? undefined : handleSaveEdit}
                            className={`px-2 py-1 text-xs text-green-400 hover:text-green-300 transition-colors ${isUpdatingNote ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Save className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`${getClass('body')} text-white/90 text-sm leading-relaxed`}>
                        {note.content}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className={`${getClass('subtitle')} text-white mb-4`}>
            {currentContent.quickActions}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Flag/Unflag Button */}
            <AnimatedButton
              variant={application.flagged ? "outline" : "secondary"}
              size="medium"
              icon="🚩"
              onClick={handleFlagToggle}
              className={`w-full ${application.flagged ? 'border-red-400 text-red-400' : ''}`}
            >
              {application.flagged ? currentContent.unflagApplication : currentContent.flagApplication}
            </AnimatedButton>

            {/* Export Button */}
            <AnimatedButton
              variant="secondary"
              size="medium"
              icon="📥"
              onClick={onExport}
              className="w-full"
            >
              {currentContent.exportData}
            </AnimatedButton>

            {/* Print Button */}
            <AnimatedButton
              variant="secondary"
              size="medium"
              icon="🖨️"
              onClick={onPrint}
              className="w-full"
            >
              {currentContent.printView}
            </AnimatedButton>

            {/* Back to Gallery */}
            <AnimatedButton
              variant="outline"
              size="medium"
              icon="📋"
              onClick={() => window.location.hash = '#admin/gallery'}
              className="w-full"
            >
              {currentLanguage === 'th' ? 'กลับแกลเลอรี่' : 'Back to Gallery'}
            </AnimatedButton>
          </div>
        </div>
      </div>

      {/* Flag Dialog */}
      {showFlagDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-container rounded-2xl max-w-md w-full p-6">
            <h3 className={`text-lg ${getClass('header')} text-white mb-4 flex items-center space-x-2`}>
              <Flag className="w-5 h-5 text-red-400" />
              <span>{currentContent.confirmFlag}</span>
            </h3>
            
            <div className="mb-6">
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.flagReason}
              </label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder={currentContent.flagReasonPlaceholder}
                rows={3}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none resize-vertical"
              />
            </div>
            
            <div className="flex gap-4 justify-end">
              <AnimatedButton
                variant="outline"
                size="medium"
                onClick={() => setShowFlagDialog(false)}
              >
                {currentContent.cancel}
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                size="medium"
                icon="🚩"
                onClick={handleConfirmFlag}
                className={!flagReason.trim() ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {currentContent.confirm}
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControlsPanel;
