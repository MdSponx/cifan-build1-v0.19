import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAdmin } from './AdminContext';
import { RoleService } from '../../services/roleService';
import { UserRole, RoleDefinition } from '../../types/admin.types';
import { useNotificationHelpers } from '../ui/NotificationSystem';
import AddUserModal from './AddUserModal';
import UserDetailsModal from './UserDetailsModal';
import BulkActionsModal from './BulkActionsModal';
import {
  Users,
  Crown,
  Shield,
  Edit3,
  Scale,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';

// Role definitions with icons and colors - Updated to match database format
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

interface RoleManagementProps {
  onSidebarToggle?: () => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ onSidebarToggle }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { adminProfile, checkPermission } = useAdmin();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State management
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [roleStats, setRoleStats] = useState<Record<string, number>>({
    'super-admin': 0,
    admin: 0,
    editor: 0,
    jury: 0,
    user: 0
  });

  // New modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [userForDetails, setUserForDetails] = useState<UserRole | null>(null);

  // Notification helpers
  const { showSuccess, showError } = useNotificationHelpers();

  // Permission check - only Super Admin can access
  if (!checkPermission('canAssignRoles')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className={`text-xl ${getClass('header')} text-white`}>
            Access Denied
          </h2>
          <p className={`${getClass('body')} text-white/60 max-w-md`}>
            You don't have permission to access the Role Management system. Only Super Administrators can manage user roles.
          </p>
        </div>
      </div>
    );
  }

  // Content translations
  const content = {
    th: {
      title: "จัดการบทบาทผู้ใช้",
      subtitle: "จัดการบทบาทและสิทธิ์ของผู้ใช้",
      searchPlaceholder: "ค้นหาด้วยชื่อหรืออีเมล...",
      filterByRole: "กรองตามบทบาท",
      filterByStatus: "กรองตามสถานะ",
      allRoles: "ทุกบทบาท",
      allStatuses: "ทุกสถานะ",
      active: "ใช้งาน",
      inactive: "ไม่ใช้งาน",
      addUser: "เพิ่มผู้ใช้",
      bulkActions: "การดำเนินการแบบกลุ่ม",
      exportData: "ส่งออกข้อมูล",
      name: "ชื่อ",
      email: "อีเมล",
      role: "บทบาท",
      status: "สถานะ",
      lastLogin: "เข้าสู่ระบบล่าสุด",
      actions: "การดำเนินการ",
      editRole: "แก้ไขบทบาท",
      toggleStatus: "เปลี่ยนสถานะ",
      viewDetails: "ดูรายละเอียด",
      deleteUser: "ลบผู้ใช้",
      noUsers: "ไม่พบผู้ใช้",
      loading: "กำลังโหลด...",
      totalUsers: "ผู้ใช้ทั้งหมด",
      roles: {
        'super-admin': "ผู้ดูแลระบบสูงสุด",
        admin: "ผู้ดูแลระบบ",
        editor: "บรรณาธิการ",
        jury: "คณะกรรมการ",
        user: "ผู้ใช้ทั่วไป"
      }
    },
    en: {
      title: "User Role Management",
      subtitle: "Manage user roles and permissions",
      searchPlaceholder: "Search by name or email...",
      filterByRole: "Filter by Role",
      filterByStatus: "Filter by Status",
      allRoles: "All Roles",
      allStatuses: "All Statuses",
      active: "Active",
      inactive: "Inactive",
      addUser: "Add User",
      bulkActions: "Bulk Actions",
      exportData: "Export Data",
      name: "Name",
      email: "Email",
      role: "Role",
      status: "Status",
      lastLogin: "Last Login",
      actions: "Actions",
      editRole: "Edit Role",
      toggleStatus: "Toggle Status",
      viewDetails: "View Details",
      deleteUser: "Delete User",
      noUsers: "No users found",
      loading: "Loading...",
      totalUsers: "Total Users",
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

  // Load users and statistics
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        RoleService.getAllUsers(),
        RoleService.getRoleStatistics()
      ]);
      setUsers(usersData);
      setRoleStats(statsData);
    } catch (error) {
      console.error('Error loading role management data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole['role']) => {
    if (!adminProfile) {
      showError('Authentication Error', 'Admin profile not found');
      return;
    }
    
    try {
      console.log('Updating role for user:', userId, 'to role:', newRole);
      
      await RoleService.updateUserRole(
        userId,
        newRole,
        adminProfile.uid,
        adminProfile.fullNameEN,
        'Role updated via Role Management'
      );
      
      showSuccess('Role Updated', `User role has been changed to ${currentContent.roles[newRole]}`);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating role:', error);
      showError('Update Failed', `Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (userId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await RoleService.updateUserStatus(userId, newStatus);
      showSuccess('Status Updated', `User status changed to ${newStatus}`);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Update Failed', 'Failed to update user status');
    }
  };

  // Handle export data
  const handleExportData = () => {
    try {
      const csvContent = generateCSV(filteredUsers);
      downloadCSV(csvContent, 'user-roles-export.csv');
      showSuccess('Export Successful', 'User data has been exported');
    } catch (error) {
      console.error('Error exporting data:', error);
      showError('Export Failed', 'Failed to export user data');
    }
  };

  // Generate CSV content
  const generateCSV = (users: UserRole[]) => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login'];
    const rows = users.map(user => [
      user.name,
      user.email,
      user.role,
      user.status,
      user.createdAt.toISOString(),
      user.lastLogin?.toISOString() || 'Never'
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  };

  // Download CSV file
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle view user details
  const handleViewUserDetails = (user: UserRole) => {
    setUserForDetails(user);
    setShowUserDetailsModal(true);
  };

  // Get selected users for bulk actions
  const getSelectedUsersData = () => {
    return users.filter(user => selectedUsers.includes(user.id));
  };

  // Get role badge styles
  const getRoleBadgeStyles = (role: UserRole['role']) => {
    const definition = roleDefinitions[role];
    return {
      backgroundColor: `${definition.color}20`,
      borderColor: `${definition.color}50`,
      color: definition.color
    };
  };

  // Get status badge styles
  const getStatusBadgeStyles = (status: 'active' | 'inactive') => {
    return status === 'active' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Format last login date
  const formatLastLogin = (date?: Date) => {
    if (!date) return currentLanguage === 'th' ? 'ไม่เคย' : 'Never';
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (currentLanguage === 'th') {
      if (diffInMinutes < 1) return 'เมื่อสักครู่';
      if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
      if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
      if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} สัปดาห์ที่แล้ว`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} เดือนที่แล้ว`;
      return `${Math.floor(diffInDays / 365)} ปีที่แล้ว`;
    } else {
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
      return `${Math.floor(diffInDays / 365)}y ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#FCB283] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`${getClass('body')} text-white/60`}>{currentContent.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl ${getClass('header')} text-white mb-2`}>
            {currentContent.title}
          </h1>
          <p className={`${getClass('body')} text-white/60`}>
            {currentContent.subtitle}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2 bg-[#FCB283] hover:bg-[#AA4626] text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            {currentContent.addUser}
          </button>
          {selectedUsers.length > 0 && (
            <button 
              onClick={() => setShowBulkActionsModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <UserCheck size={16} />
              {currentContent.bulkActions} ({selectedUsers.length})
            </button>
          )}
          <button 
            onClick={() => handleExportData()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            {currentContent.exportData}
          </button>
        </div>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(roleDefinitions).map(([roleKey, definition]) => {
          const role = roleKey as UserRole['role'];
          const count = roleStats[role] || 0;
          const IconComponent = definition.icon;
          
          return (
            <div
              key={role}
              className="glass-container rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${definition.color}20` }}
                >
                  <IconComponent 
                    size={24} 
                    color={definition.color}
                  />
                </div>
                <span className={`text-2xl font-bold text-white`}>
                  {count}
                </span>
              </div>
              <h3 className={`${getClass('body')} font-semibold text-white mb-1`}>
                {currentContent.roles[role] || role}
              </h3>
              <p className={`${getClass('body')} text-white/60 text-sm`}>
                {definition.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="glass-container rounded-xl p-6 border border-white/20"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder={currentContent.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] transition-colors"
            />
          </div>
          
          {/* Role Filter */}
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#FCB283] transition-colors"
            >
              <option value="all">{currentContent.allRoles}</option>
              {Object.entries(currentContent.roles).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#FCB283] transition-colors"
            >
              <option value="all">{currentContent.allStatuses}</option>
              <option value="active">{currentContent.active}</option>
              <option value="inactive">{currentContent.inactive}</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-container rounded-xl border border-white/20 overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className={`text-left p-4 ${getClass('body')} font-semibold text-white/80`}>
                  {currentContent.name}
                </th>
                <th className={`text-left p-4 ${getClass('body')} font-semibold text-white/80`}>
                  {currentContent.email}
                </th>
                <th className={`text-left p-4 ${getClass('body')} font-semibold text-white/80`}>
                  {currentContent.role}
                </th>
                <th className={`text-left p-4 ${getClass('body')} font-semibold text-white/80`}>
                  {currentContent.status}
                </th>
                <th className={`text-left p-4 ${getClass('body')} font-semibold text-white/80`}>
                  {currentContent.lastLogin}
                </th>
                <th className={`text-left p-4 ${getClass('body')} font-semibold text-white/80`}>
                  {currentContent.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <div className="text-white/60">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className={getClass('body')}>{currentContent.noUsers}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-[#FCB283] to-[#AA4626] flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-semibold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className={`${getClass('body')} font-medium text-white`}>{user.name}</p>
                          <p className={`${getClass('body')} text-white/60 text-sm`}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className={`${getClass('body')} text-white/80`}>{user.email}</p>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRoleModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium transition-colors hover:bg-white/10"
                        style={getRoleBadgeStyles(user.role)}
                      >
                        {React.createElement(roleDefinitions[user.role].icon, { size: 14 })}
                        {currentContent.roles[user.role] || user.role}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleStatusToggle(user.id, user.status)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium transition-colors hover:bg-white/10 ${getStatusBadgeStyles(user.status)}`}
                      >
                        {user.status === 'active' ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Clock size={14} />
                        )}
                        {user.status === 'active' ? currentContent.active : currentContent.inactive}
                      </button>
                    </td>
                    <td className="p-4">
                      <p className={`${getClass('body')} text-white/60 text-sm`}>
                        {formatLastLogin(user.lastLogin)}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewUserDetails(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                          title={currentContent.viewDetails}
                        >
                          <Eye size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-container rounded-xl p-6 border border-white/20 max-w-md w-full"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <h3 className={`text-xl ${getClass('header')} text-white mb-4`}>
              {currentContent.editRole}
            </h3>
            <p className={`${getClass('body')} text-white/60 mb-6`}>
              Change role for {selectedUser.name}
            </p>
            
            <div className="space-y-3 mb-6">
              {Object.entries(roleDefinitions).map(([roleKey, definition]) => {
                const role = roleKey as UserRole['role'];
                const IconComponent = definition.icon;
                const isSelected = selectedUser.role === role;
                
                return (
                  <button
                    key={role}
                    onClick={() => {
                      handleRoleChange(selectedUser.id, role);
                      setShowRoleModal(false);
                      setSelectedUser(null);
                    }}
                    className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                      isSelected 
                        ? 'border-[#FCB283] bg-[#FCB283]/20' 
                        : 'border-white/20 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${definition.color}20` }}
                      >
                        <IconComponent size={20} style={{ color: definition.color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`${getClass('body')} font-semibold text-white`}>
                          {currentContent.roles[role] || role}
                        </h4>
                        <p className={`${getClass('body')} text-white/60 text-sm`}>
                          {definition.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="text-[#FCB283]" size={20} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={() => {
          loadData();
          showSuccess('User Added', 'New user has been added successfully');
        }}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={showUserDetailsModal}
        onClose={() => {
          setShowUserDetailsModal(false);
          setUserForDetails(null);
        }}
        user={userForDetails}
      />

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={showBulkActionsModal}
        onClose={() => setShowBulkActionsModal(false)}
        selectedUsers={getSelectedUsersData()}
        onActionComplete={() => {
          loadData();
          setSelectedUsers([]);
          showSuccess('Bulk Action Completed', 'The bulk action has been completed successfully');
        }}
      />
    </div>
  );
};

export default RoleManagement;
