import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { UserRole, RoleAuditLog, RoleDefinition } from '../../types/admin.types';
import { RoleService } from '../../services/roleService';
import {
  X,
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  Activity,
  History,
  Crown,
  Edit3,
  Scale,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader
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

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRole | null;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [activeTab, setActiveTab] = useState<'details' | 'permissions' | 'history'>('details');
  const [auditLogs, setAuditLogs] = useState<RoleAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Content translations
  const content = {
    th: {
      title: "รายละเอียดผู้ใช้",
      tabs: {
        details: "ข้อมูลทั่วไป",
        permissions: "สิทธิ์การใช้งาน",
        history: "ประวัติการเปลี่ยนแปลง"
      },
      details: {
        basicInfo: "ข้อมูลพื้นฐาน",
        name: "ชื่อ",
        email: "อีเมล",
        role: "บทบาท",
        status: "สถานะ",
        created: "สร้างเมื่อ",
        lastLogin: "เข้าสู่ระบบล่าสุด",
        accountInfo: "ข้อมูลบัญชี"
      },
      permissions: {
        title: "สิทธิ์การใช้งาน",
        description: "สิทธิ์ที่ผู้ใช้มีตามบทบาทที่ได้รับ",
        granted: "อนุญาต",
        denied: "ไม่อนุญาต"
      },
      history: {
        title: "ประวัติการเปลี่ยนแปลงบทบาท",
        noHistory: "ไม่มีประวัติการเปลี่ยนแปลง",
        changedBy: "เปลี่ยนโดย",
        from: "จาก",
        to: "เป็น",
        reason: "เหตุผล"
      },
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
      },
      permissionLabels: {
        canAssignRoles: "กำหนดบทบาทผู้ใช้",
        canManageUsers: "จัดการผู้ใช้",
        canViewDashboard: "ดูแดชบอร์ด",
        canManageContent: "จัดการเนื้อหา",
        canAccessLibrary: "เข้าถึงคลังภาพยนตร์",
        canRateFilms: "ให้คะแนนภาพยนตร์"
      },
      close: "ปิด"
    },
    en: {
      title: "User Details",
      tabs: {
        details: "Details",
        permissions: "Permissions",
        history: "History"
      },
      details: {
        basicInfo: "Basic Information",
        name: "Name",
        email: "Email",
        role: "Role",
        status: "Status",
        created: "Created",
        lastLogin: "Last Login",
        accountInfo: "Account Information"
      },
      permissions: {
        title: "User Permissions",
        description: "Permissions granted to this user based on their role",
        granted: "Granted",
        denied: "Denied"
      },
      history: {
        title: "Role Change History",
        noHistory: "No role changes recorded",
        changedBy: "Changed by",
        from: "From",
        to: "To",
        reason: "Reason"
      },
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
      },
      permissionLabels: {
        canAssignRoles: "Assign User Roles",
        canManageUsers: "Manage Users",
        canViewDashboard: "View Dashboard",
        canManageContent: "Manage Content",
        canAccessLibrary: "Access Film Library",
        canRateFilms: "Rate Films"
      },
      close: "Close"
    }
  };

  const currentContent = content[currentLanguage];

  // Load audit logs when history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && user && auditLogs.length === 0) {
      loadAuditLogs();
    }
  }, [activeTab, user]);

  const loadAuditLogs = async () => {
    if (!user) return;
    
    setLoadingLogs(true);
    try {
      const logs = await RoleService.getRoleAuditLogs(50);
      // Filter logs for this specific user
      const userLogs = logs.filter(log => log.targetUserId === user.id);
      setAuditLogs(userLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (!isOpen || !user) return null;

  const roleDefinition = roleDefinitions[user.role];
  const IconComponent = roleDefinition.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="glass-container rounded-xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-[#FCB283] to-[#AA4626] flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className={`text-xl ${getClass('header')} text-white`}>
                {currentContent.title}
              </h3>
              <p className={`${getClass('body')} text-white/60`}>
                {user.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20">
          {(['details', 'permissions', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-[#FCB283] border-b-2 border-[#FCB283] bg-white/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {currentContent.tabs[tab]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className={`text-lg ${getClass('header')} text-white mb-4`}>
                  {currentContent.details.basicInfo}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className={`block ${getClass('body')} text-white/60 text-sm mb-1`}>
                        {currentContent.details.name}
                      </label>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-white/40" />
                        <span className={`${getClass('body')} text-white`}>{user.name}</span>
                      </div>
                    </div>
                    <div>
                      <label className={`block ${getClass('body')} text-white/60 text-sm mb-1`}>
                        {currentContent.details.email}
                      </label>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-white/40" />
                        <span className={`${getClass('body')} text-white`}>{user.email}</span>
                      </div>
                    </div>
                    <div>
                      <label className={`block ${getClass('body')} text-white/60 text-sm mb-1`}>
                        {currentContent.details.role}
                      </label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center"
                          style={{ backgroundColor: `${roleDefinition.color}20` }}
                        >
                          <IconComponent size={12} style={{ color: roleDefinition.color }} />
                        </div>
                        <span className={`${getClass('body')} text-white`}>
                          {currentContent.roles[user.role]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={`block ${getClass('body')} text-white/60 text-sm mb-1`}>
                        {currentContent.details.status}
                      </label>
                      <div className="flex items-center gap-2">
                        {user.status === 'active' ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <XCircle size={16} className="text-red-400" />
                        )}
                        <span className={`${getClass('body')} ${user.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                          {currentContent.status[user.status]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={`block ${getClass('body')} text-white/60 text-sm mb-1`}>
                        {currentContent.details.created}
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-white/40" />
                        <span className={`${getClass('body')} text-white`}>
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={`block ${getClass('body')} text-white/60 text-sm mb-1`}>
                        {currentContent.details.lastLogin}
                      </label>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-white/40" />
                        <span className={`${getClass('body')} text-white`}>
                          {user.lastLogin ? formatRelativeTime(user.lastLogin) : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <h4 className={`text-lg ${getClass('header')} text-white mb-2`}>
                  {currentContent.permissions.title}
                </h4>
                <p className={`${getClass('body')} text-white/60 mb-6`}>
                  {currentContent.permissions.description}
                </p>
              </div>
              
              <div className="space-y-3">
                {Object.entries(roleDefinition.permissions).map(([permission, granted]) => (
                  <div key={permission} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      {granted ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <XCircle size={16} className="text-red-400" />
                      )}
                      <span className={`${getClass('body')} text-white`}>
                        {currentContent.permissionLabels[permission as keyof typeof currentContent.permissionLabels]}
                      </span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      granted 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {granted ? currentContent.permissions.granted : currentContent.permissions.denied}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div>
                <h4 className={`text-lg ${getClass('header')} text-white mb-2`}>
                  {currentContent.history.title}
                </h4>
              </div>
              
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader size={24} className="animate-spin text-[#FCB283]" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto mb-4 text-white/40" />
                  <p className={`${getClass('body')} text-white/60`}>
                    {currentContent.history.noHistory}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Activity size={16} className="text-[#FCB283]" />
                          <span className={`${getClass('body')} text-white font-medium`}>
                            {currentContent.history.from} {currentContent.roles[log.oldRole as keyof typeof currentContent.roles]} {currentContent.history.to} {currentContent.roles[log.newRole as keyof typeof currentContent.roles]}
                          </span>
                        </div>
                        <span className={`${getClass('body')} text-white/60 text-sm`}>
                          {formatRelativeTime(log.timestamp)}
                        </span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <p className={`${getClass('body')} text-white/80 text-sm`}>
                          {currentContent.history.changedBy}: {log.adminId}
                        </p>
                        {log.reason && (
                          <p className={`${getClass('body')} text-white/60 text-sm`}>
                            {currentContent.history.reason}: {log.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-white/20">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            {currentContent.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
