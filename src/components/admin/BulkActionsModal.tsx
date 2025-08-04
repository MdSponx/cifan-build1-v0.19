import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { UserRole, RoleDefinition } from '../../types/admin.types';
import { RoleService } from '../../services/roleService';
import { useAdmin } from './AdminContext';
import {
  X,
  Users,
  Crown,
  Shield,
  Edit3,
  Scale,
  CheckCircle,
  AlertTriangle,
  Loader,
  UserCheck,
  UserX
} from 'lucide-react';

// Role definitions matching other components
const roleDefinitions: Record<string, RoleDefinition> = {
  'super-admin': {
    name: 'Super Administrator',
    icon: Crown,
    color: '#FFD700',
    description: 'Full system control with role assignment capabilities',
    permissions: {
      canAssignRoles: true,
      canManageUsers: true,
      canViewDashboard: true,
      canManageContent: true,
      canAccessLibrary: true,
      canRateFilms: true
    }
  },
  admin: {
    name: 'Administrator',
    icon: Shield,
    color: '#FF6B6B',
    description: 'System management without role assignment',
    permissions: {
      canAssignRoles: false,
      canManageUsers: true,
      canViewDashboard: true,
      canManageContent: true,
      canAccessLibrary: true,
      canRateFilms: false
    }
  },
  editor: {
    name: 'Content Editor',
    icon: Edit3,
    color: '#4ECDC4',
    description: 'Content management and library viewing',
    permissions: {
      canAssignRoles: false,
      canManageUsers: false,
      canViewDashboard: false,
      canManageContent: true,
      canAccessLibrary: true,
      canRateFilms: false
    }
  },
  jury: {
    name: 'Jury Member',
    icon: Scale,
    color: '#45B7D1',
    description: 'Film library access with rating capabilities',
    permissions: {
      canAssignRoles: false,
      canManageUsers: false,
      canViewDashboard: false,
      canManageContent: false,
      canAccessLibrary: true,
      canRateFilms: true
    }
  },
  user: {
    name: 'General User',
    icon: Users,
    color: '#9CA3AF',
    description: 'Basic user with submission access only',
    permissions: {
      canAssignRoles: false,
      canManageUsers: false,
      canViewDashboard: false,
      canManageContent: false,
      canAccessLibrary: false,
      canRateFilms: false
    }
  }
};

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: UserRole[];
  onActionComplete: () => void;
}

type BulkAction = 'changeRole' | 'changeStatus' | 'delete';

const BulkActionsModal: React.FC<BulkActionsModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedUsers, 
  onActionComplete 
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { adminProfile } = useAdmin();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole['role']>('user');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive'>('active');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');

  // Content translations
  const content = {
    th: {
      title: "การดำเนินการแบบกลุ่ม",
      subtitle: "ดำเนินการกับผู้ใช้ที่เลือกไว้",
      selectedCount: "เลือกไว้ {{count}} ผู้ใช้",
      selectAction: "เลือกการดำเนินการ",
      actions: {
        changeRole: "เปลี่ยนบทบาท",
        changeStatus: "เปลี่ยนสถานะ",
        delete: "ลบผู้ใช้"
      },
      actionDescriptions: {
        changeRole: "เปลี่ยนบทบาทของผู้ใช้ที่เลือกไว้",
        changeStatus: "เปลี่ยนสถานะของผู้ใช้ที่เลือกไว้",
        delete: "ลบผู้ใช้ที่เลือกไว้ออกจากระบบ"
      },
      newRole: "บทบาทใหม่",
      newStatus: "สถานะใหม่",
      reason: "เหตุผล (ไม่บังคับ)",
      reasonPlaceholder: "กรอกเหตุผลในการเปลี่ยนแปลง",
      confirm: "ยืนยันการดำเนินการ",
      confirmMessage: "คุณแน่ใจหรือไม่ที่จะดำเนินการนี้กับผู้ใช้ {{count}} คน?",
      deleteWarning: "การลบผู้ใช้จะไม่สามารถย้อนกลับได้",
      cancel: "ยกเลิก",
      execute: "ดำเนินการ",
      executing: "กำลังดำเนินการ...",
      success: "ดำเนินการสำเร็จ",
      successMessage: "การดำเนินการแบบกลุ่มเสร็จสิ้นแล้ว",
      done: "เสร็จสิ้น",
      status: {
        active: "ใช้งาน",
        inactive: "ไม่ใช้งาน"
      },
      roles: {
        'super-admin': "ผู้ดูแลระบบสูงสุด",
        admin: "ผู้ดูแลระบบ",
        editor: "บรรณาธิการ",
        jury: "คณะกรรมการ",
        user: "ผู้ใช้ทั่วไป"
      }
    },
    en: {
      title: "Bulk Actions",
      subtitle: "Perform actions on selected users",
      selectedCount: "{{count}} users selected",
      selectAction: "Select Action",
      actions: {
        changeRole: "Change Role",
        changeStatus: "Change Status",
        delete: "Delete Users"
      },
      actionDescriptions: {
        changeRole: "Change the role of selected users",
        changeStatus: "Change the status of selected users",
        delete: "Remove selected users from the system"
      },
      newRole: "New Role",
      newStatus: "New Status",
      reason: "Reason (Optional)",
      reasonPlaceholder: "Enter reason for the change",
      confirm: "Confirm Action",
      confirmMessage: "Are you sure you want to perform this action on {{count}} users?",
      deleteWarning: "Deleting users cannot be undone",
      cancel: "Cancel",
      execute: "Execute",
      executing: "Executing...",
      success: "Action Completed",
      successMessage: "Bulk action has been completed successfully",
      done: "Done",
      status: {
        active: "Active",
        inactive: "Inactive"
      },
      roles: {
        'super-admin': "Super Administrator",
        admin: "Administrator",
        editor: "Content Editor",
        jury: "Jury Member",
        user: "General User"
      }
    }
  };

  const currentContent = content[currentLanguage];

  // Handle action execution
  const handleExecute = async () => {
    if (!selectedAction || !adminProfile) return;

    setIsSubmitting(true);
    try {
      switch (selectedAction) {
        case 'changeRole':
          const roleUpdates = selectedUsers.map(user => ({
            userId: user.id,
            newRole: selectedRole
          }));
          await RoleService.bulkUpdateRoles(
            roleUpdates,
            adminProfile.uid,
            adminProfile.fullNameEN,
            reason || 'Bulk role update'
          );
          break;

        case 'changeStatus':
          for (const user of selectedUsers) {
            await RoleService.updateUserStatus(user.id, selectedStatus);
          }
          break;

        case 'delete':
          // TODO: Implement bulk delete functionality
          // This would require additional service methods
          console.log('Bulk delete not yet implemented');
          break;
      }

      setStep('success');
      setTimeout(() => {
        onActionComplete();
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error executing bulk action:', error);
      // TODO: Show error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setSelectedAction(null);
    setSelectedRole('user');
    setSelectedStatus('active');
    setReason('');
    setStep('select');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || selectedUsers.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="glass-container rounded-xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {step === 'select' && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-xl ${getClass('header')} text-white mb-1`}>
                  {currentContent.title}
                </h3>
                <p className={`${getClass('body')} text-white/60 text-sm`}>
                  {currentContent.subtitle}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Selected Users Count */}
            <div className="mb-6 p-3 bg-[#FCB283]/20 border border-[#FCB283]/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#FCB283]" />
                <span className={`${getClass('body')} text-white`}>
                  {currentContent.selectedCount.replace('{{count}}', selectedUsers.length.toString())}
                </span>
              </div>
            </div>

            {/* Action Selection */}
            <div className="mb-6">
              <h4 className={`${getClass('body')} font-semibold text-white mb-3`}>
                {currentContent.selectAction}
              </h4>
              <div className="space-y-2">
                {(['changeRole', 'changeStatus', 'delete'] as const).map((action) => (
                  <button
                    key={action}
                    onClick={() => setSelectedAction(action)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                      selectedAction === action
                        ? 'border-[#FCB283] bg-[#FCB283]/20'
                        : 'border-white/20 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        action === 'delete' ? 'bg-red-500/20' : 'bg-blue-500/20'
                      }`}>
                        {action === 'changeRole' && <Shield size={16} className="text-blue-400" />}
                        {action === 'changeStatus' && <UserCheck size={16} className="text-blue-400" />}
                        {action === 'delete' && <UserX size={16} className="text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <h5 className={`${getClass('body')} font-medium text-white text-sm`}>
                          {currentContent.actions[action]}
                        </h5>
                        <p className={`${getClass('body')} text-white/60 text-xs`}>
                          {currentContent.actionDescriptions[action]}
                        </p>
                      </div>
                      {selectedAction === action && (
                        <CheckCircle className="text-[#FCB283]" size={16} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action-specific Options */}
            {selectedAction === 'changeRole' && (
              <div className="mb-6">
                <label className={`block ${getClass('body')} text-white/80 mb-3`}>
                  {currentContent.newRole}
                </label>
                <div className="space-y-2">
                  {Object.entries(roleDefinitions).map(([roleKey, definition]) => {
                    const role = roleKey as UserRole['role'];
                    const IconComponent = definition.icon;
                    const isSelected = selectedRole === role;
                    
                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`w-full p-2 rounded-lg border transition-all duration-200 text-left ${
                          isSelected 
                            ? 'border-[#FCB283] bg-[#FCB283]/20' 
                            : 'border-white/20 hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: `${definition.color}20` }}
                          >
                            <IconComponent size={12} style={{ color: definition.color }} />
                          </div>
                          <span className={`${getClass('body')} text-white text-sm`}>
                            {currentContent.roles[role]}
                          </span>
                          {isSelected && (
                            <CheckCircle className="text-[#FCB283] ml-auto" size={14} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedAction === 'changeStatus' && (
              <div className="mb-6">
                <label className={`block ${getClass('body')} text-white/80 mb-3`}>
                  {currentContent.newStatus}
                </label>
                <div className="space-y-2">
                  {(['active', 'inactive'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`w-full p-2 rounded-lg border transition-all duration-200 text-left ${
                        selectedStatus === status
                          ? 'border-[#FCB283] bg-[#FCB283]/20'
                          : 'border-white/20 hover:border-white/30 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {status === 'active' ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <UserX size={16} className="text-red-400" />
                        )}
                        <span className={`${getClass('body')} text-white text-sm`}>
                          {currentContent.status[status]}
                        </span>
                        {selectedStatus === status && (
                          <CheckCircle className="text-[#FCB283] ml-auto" size={14} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reason Input */}
            {selectedAction && selectedAction !== 'delete' && (
              <div className="mb-6">
                <label className={`block ${getClass('body')} text-white/80 mb-2`}>
                  {currentContent.reason}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={currentContent.reasonPlaceholder}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] transition-colors resize-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                {currentContent.cancel}
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedAction}
                className="flex-1 px-4 py-3 bg-[#FCB283] hover:bg-[#AA4626] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentContent.confirm}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-xl ${getClass('header')} text-white mb-1`}>
                  {currentContent.confirm}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Warning */}
            <div className={`mb-6 p-4 rounded-lg border ${
              selectedAction === 'delete' 
                ? 'bg-red-500/20 border-red-500/30' 
                : 'bg-yellow-500/20 border-yellow-500/30'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className={selectedAction === 'delete' ? 'text-red-400' : 'text-yellow-400'} />
                <div>
                  <p className={`${getClass('body')} text-white mb-2`}>
                    {currentContent.confirmMessage.replace('{{count}}', selectedUsers.length.toString())}
                  </p>
                  {selectedAction === 'delete' && (
                    <p className={`${getClass('body')} text-red-400 text-sm`}>
                      {currentContent.deleteWarning}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {currentContent.cancel}
              </button>
              <button
                onClick={handleExecute}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  selectedAction === 'delete'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-[#FCB283] hover:bg-[#AA4626] text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    {currentContent.executing}
                  </>
                ) : (
                  currentContent.execute
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className={`text-xl ${getClass('header')} text-white mb-2`}>
              {currentContent.success}
            </h3>
            <p className={`${getClass('body')} text-white/60 mb-6`}>
              {currentContent.successMessage}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-[#FCB283] hover:bg-[#AA4626] text-white rounded-lg transition-colors"
            >
              {currentContent.done}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkActionsModal;
