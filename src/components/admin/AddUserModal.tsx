import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { UserRole, RoleDefinition } from '../../types/admin.types';
import { RoleService } from '../../services/roleService';
import { useAdmin } from './AdminContext';
import {
  X,
  User,
  Mail,
  Crown,
  Shield,
  Edit3,
  Scale,
  Users,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

// Role definitions matching RoleManagement component
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

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

interface FormData {
  email: string;
  name: string;
  role: UserRole['role'];
}

interface FormErrors {
  email?: string;
  name?: string;
  role?: string;
  general?: string;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { adminProfile } = useAdmin();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    role: 'user'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Content translations
  const content = {
    th: {
      title: "เพิ่มผู้ใช้ใหม่",
      subtitle: "สร้างบัญชีผู้ใช้ใหม่และกำหนดบทบาท",
      email: "อีเมล",
      emailPlaceholder: "กรอกที่อยู่อีเมล",
      name: "ชื่อ-นามสกุล",
      namePlaceholder: "กรอกชื่อเต็ม",
      role: "บทบาท",
      selectRole: "เลือกบทบาท",
      cancel: "ยกเลิก",
      addUser: "เพิ่มผู้ใช้",
      adding: "กำลังเพิ่ม...",
      success: "เพิ่มผู้ใช้สำเร็จ",
      successMessage: "ผู้ใช้ใหม่ถูกเพิ่มเข้าระบบแล้ว",
      done: "เสร็จสิ้น",
      errors: {
        emailRequired: "กรุณากรอกอีเมล",
        emailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
        nameRequired: "กรุณากรอกชื่อ",
        roleRequired: "กรุณาเลือกบทบาท"
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
      title: "Add New User",
      subtitle: "Create a new user account and assign role",
      email: "Email",
      emailPlaceholder: "Enter email address",
      name: "Full Name",
      namePlaceholder: "Enter full name",
      role: "Role",
      selectRole: "Select role",
      cancel: "Cancel",
      addUser: "Add User",
      adding: "Adding...",
      success: "User Added Successfully",
      successMessage: "The new user has been added to the system",
      done: "Done",
      errors: {
        emailRequired: "Email is required",
        emailInvalid: "Invalid email format",
        nameRequired: "Name is required",
        roleRequired: "Role is required"
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = currentContent.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = currentContent.errors.emailInvalid;
    }

    if (!formData.name.trim()) {
      newErrors.name = currentContent.errors.nameRequired;
    }

    if (!formData.role) {
      newErrors.role = currentContent.errors.roleRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !adminProfile) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // In a real implementation, this would create a user account
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Implement actual user creation logic
      // This would typically involve:
      // 1. Creating Firebase Auth account
      // 2. Creating profile document
      // 3. Setting initial role
      // 4. Sending invitation email
      
      console.log('Creating user:', formData);
      
      setStep('success');
      setTimeout(() => {
        onUserAdded();
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error adding user:', error);
      setErrors({ general: 'Failed to add user. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({ email: '', name: '', role: 'user' });
    setErrors({});
    setStep('form');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="glass-container rounded-xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6">
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
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400" />
                <span className={`${getClass('body')} text-red-400 text-sm`}>
                  {errors.general}
                </span>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
              <label className={`block ${getClass('body')} text-white/80 mb-2`}>
                {currentContent.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={currentContent.emailPlaceholder}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] transition-colors ${
                    errors.email ? 'border-red-500/50' : 'border-white/20'
                  }`}
                />
              </div>
              {errors.email && (
                <p className={`${getClass('body')} text-red-400 text-sm mt-1`}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Name Field */}
            <div className="mb-4">
              <label className={`block ${getClass('body')} text-white/80 mb-2`}>
                {currentContent.name}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={currentContent.namePlaceholder}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] transition-colors ${
                    errors.name ? 'border-red-500/50' : 'border-white/20'
                  }`}
                />
              </div>
              {errors.name && (
                <p className={`${getClass('body')} text-red-400 text-sm mt-1`}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className={`block ${getClass('body')} text-white/80 mb-3`}>
                {currentContent.role}
              </label>
              <div className="space-y-2">
                {Object.entries(roleDefinitions).map(([roleKey, definition]) => {
                  const role = roleKey as UserRole['role'];
                  const IconComponent = definition.icon;
                  const isSelected = formData.role === role;
                  
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                        isSelected 
                          ? 'border-[#FCB283] bg-[#FCB283]/20' 
                          : 'border-white/20 hover:border-white/30 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${definition.color}20` }}
                        >
                          <IconComponent size={16} style={{ color: definition.color }} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`${getClass('body')} font-medium text-white text-sm`}>
                            {currentContent.roles[role]}
                          </h4>
                          <p className={`${getClass('body')} text-white/60 text-xs`}>
                            {definition.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="text-[#FCB283]" size={16} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.role && (
                <p className={`${getClass('body')} text-red-400 text-sm mt-1`}>
                  {errors.role}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {currentContent.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-[#FCB283] hover:bg-[#AA4626] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    {currentContent.adding}
                  </>
                ) : (
                  currentContent.addUser
                )}
              </button>
            </div>
          </form>
        ) : (
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

export default AddUserModal;
