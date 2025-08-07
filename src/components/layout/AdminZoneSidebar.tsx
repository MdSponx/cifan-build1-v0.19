import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { useAdmin } from '../admin/AdminContext';
import { 
  User, 
  BarChart3, 
  Grid, 
  Building2, 
  Calendar, 
  FileText, 
  LogOut, 
  X,
  Shield,
  Users,
  Eye,
  Plus,
  Film,
  Award,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface AdminZoneSidebarProps {
  currentPage: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

interface AdminMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: {
    text: string;
    color: 'orange' | 'blue' | 'green' | 'red';
  };
}

const AdminZoneSidebar: React.FC<AdminZoneSidebarProps> = ({
  currentPage,
  isOpen,
  onToggle,
  onClose
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user, userProfile, signOut } = useAuth();
  const { adminProfile, permissions, checkPermission } = useAdmin();
  const currentLanguage = i18n.language as 'en' | 'th';
  
  // State for expandable menus
  const [isApplicationsExpanded, setIsApplicationsExpanded] = useState(true);
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(true);

  const content = {
    th: {
      adminZone: "พื้นที่ผู้ดูแลระบบ",
      adminProfile: "โปรไฟล์ผู้ดูแล",
      roleManagement: "จัดการบทบาทผู้ใช้",
      applications: "ใบสมัคร",
      applicationsDashboard: "แดชบอร์ด",
      applicationsGallery: "แกลเลอรี่",
      partnersManagement: "จัดการพาร์ทเนอร์",
      activitiesEvents: "กิจกรรมและอีเวนต์",
      allActivities: "กิจกรรมทั้งหมด",
      createNew: "สร้างใหม่",
      workshops: "เวิร์กช็อป",
      screenings: "การฉายภาพยนตร์",
      ceremonies: "พิธีการ",
      articlesNews: "บทความและข่าวสาร",
      signOut: "ออกจากระบบ",
      welcome: "ยินดีต้อนรับ",
      administrator: "ผู้ดูแลระบบ",
      comingSoon: "เร็วๆ นี้"
    },
    en: {
      adminZone: "Admin Zone",
      adminProfile: "Admin Profile",
      roleManagement: "Role Management",
      applications: "Applications",
      applicationsDashboard: "Dashboard",
      applicationsGallery: "Gallery",
      partnersManagement: "Partners Management",
      activitiesEvents: "Activities & Events",
      allActivities: "All Activities",
      createNew: "Create New",
      workshops: "Workshops",
      screenings: "Screenings",
      ceremonies: "Ceremonies",
      articlesNews: "Articles & News",
      signOut: "Sign Out",
      welcome: "Welcome",
      administrator: "Administrator",
      comingSoon: "Coming Soon"
    }
  };

  const currentContent = content[currentLanguage];

  const menuItems: AdminMenuItem[] = [
    {
      id: 'admin/profile',
      icon: <User size={20} />,
      label: currentContent.adminProfile,
      href: '#admin/profile'
    },
    // Always show Role Management for admin users
    {
      id: 'admin/role-management',
      icon: <Users size={20} />,
      label: currentContent.roleManagement,
      href: '#admin/role-management'
    },
    // Applications main menu (expandable)
    {
      id: 'admin/applications',
      icon: <FileText size={20} />,
      label: currentContent.applications,
      href: '#admin/applications'
    },
    // Always show Partners Management for admin users
    {
      id: 'admin/partners',
      icon: <Building2 size={20} />,
      label: currentContent.partnersManagement,
      href: '#admin/partners'
    },
    {
      id: 'admin/activities',
      icon: <Calendar size={20} />,
      label: currentContent.activitiesEvents,
      href: '#admin/activities'
    },
    {
      id: 'admin/articles',
      icon: <FileText size={20} />,
      label: currentContent.articlesNews,
      href: '#admin/articles',
      badge: {
        text: currentContent.comingSoon,
        color: 'orange' as const
      }
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      window.location.hash = '#home';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMenuItemClick = (href: string, hasComingSoon: boolean = false) => {
    if (hasComingSoon) {
      // Navigate to coming soon page for items with badges
      window.location.hash = '#coming-soon';
    } else {
      window.location.hash = href;
    }
    onClose();
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleApplicationsToggle = () => {
    setIsApplicationsExpanded(!isApplicationsExpanded);
  };

  const handleActivitiesToggle = () => {
    setIsActivitiesExpanded(!isActivitiesExpanded);
  };

  const isApplicationsPageActive = (page: string) => {
    return page.startsWith('admin/dashboard') || page.startsWith('admin/gallery');
  };

  const isActivitiesPageActive = (page: string) => {
    return page.startsWith('admin/activities');
  };

  // Applications submenu items
  const applicationsSubmenuItems = [
    {
      id: 'admin/dashboard',
      icon: <BarChart3 size={18} />,
      label: currentContent.applicationsDashboard,
      href: '#admin/dashboard'
    },
    {
      id: 'admin/gallery',
      icon: <Grid size={18} />,
      label: currentContent.applicationsGallery,
      href: '#admin/gallery'
    }
  ];

  // Activities submenu items
  const activitiesSubmenuItems = [
    {
      id: 'admin/activities',
      icon: <Eye size={18} />,
      label: currentContent.allActivities,
      href: '#admin/activities'
    },
    {
      id: 'admin/activities/create',
      icon: <Plus size={18} />,
      label: currentContent.createNew,
      href: '#admin/activities/create'
    },
    {
      id: 'admin/activities/workshops',
      icon: <Users size={18} />,
      label: currentContent.workshops,
      href: '#admin/activities/workshops'
    },
    {
      id: 'admin/activities/screenings',
      icon: <Film size={18} />,
      label: currentContent.screenings,
      href: '#admin/activities/screenings'
    },
    {
      id: 'admin/activities/ceremonies',
      icon: <Award size={18} />,
      label: currentContent.ceremonies,
      href: '#admin/activities/ceremonies'
    }
  ];

  const getBadgeStyles = (color: string) => {
    const styles = {
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return styles[color as keyof typeof styles] || styles.orange;
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('admin-zone-sidebar');
      const toggle = document.getElementById('admin-sidebar-toggle');
      
      if (isOpen && sidebar && !sidebar.contains(event.target as Node) && 
          toggle && !toggle.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div
      id="admin-zone-sidebar"
      className="w-full h-full glass-container rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 ease-in-out"
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.15)'
      }}
    >
      <div className="flex flex-col h-full">
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/20 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl ${getClass('header')} text-white flex items-center space-x-2`}>
              <Shield className="w-5 h-5 text-[#FCB283]" />
              <span>{currentContent.adminZone}</span>
            </h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-white/80" />
            </button>
          </div>
          
          {/* Admin User Info */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-[#FCB283] to-[#AA4626] flex items-center justify-center relative">
              {(adminProfile?.photoURL || userProfile?.photoURL) ? (
                <img
                  src={adminProfile?.photoURL || userProfile?.photoURL}
                  alt="Admin Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              )}
              {/* Admin Badge */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FCB283] rounded-full flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${getClass('body')} text-white font-medium truncate`}>
                {currentContent.welcome}
              </p>
              <div className="flex items-center space-x-2">
                <p className={`${getClass('body')} text-white/60 text-sm truncate`}>
                  {adminProfile?.fullNameEN || user?.displayName || user?.email}
                </p>
                <span className="px-2 py-0.5 bg-[#FCB283]/20 text-[#FCB283] rounded-full text-xs border border-[#FCB283]/30">
                  {currentContent.administrator}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              // Handle Applications menu item specially
              if (item.id === 'admin/applications') {
                return (
                  <li key={item.id}>
                    {/* Main Applications Button */}
                    <button
                      onClick={handleApplicationsToggle}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isApplicationsPageActive(currentPage)
                          ? 'bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white shadow-lg'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <span className={isApplicationsPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'}>
                          {item.icon}
                        </span>
                        <span className={`${getClass('body')} font-medium text-left`}>
                          {item.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Expand/Collapse Icon */}
                        <span className={`transition-transform duration-200 ${
                          isApplicationsPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'
                        } ${isApplicationsExpanded ? 'rotate-0' : '-rotate-90'}`}>
                          {isApplicationsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </div>
                    </button>

                    {/* Applications Submenu Items */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isApplicationsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <ul className="mt-2 space-y-1 ml-4">
                        {applicationsSubmenuItems.map((subItem) => (
                          <li key={subItem.id}>
                            <button
                              onClick={() => handleMenuItemClick(subItem.href)}
                              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-left ${
                                currentPage === subItem.id
                                  ? 'bg-gradient-to-r from-[#FCB283]/20 to-[#AA4626]/20 text-[#FCB283] border border-[#FCB283]/30'
                                  : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                              }`}
                            >
                              <span className={currentPage === subItem.id ? 'text-[#FCB283]' : 'text-white/50 group-hover:text-white/70'}>
                                {subItem.icon}
                              </span>
                              <span className={`${getClass('body')} text-sm font-medium`}>
                                {subItem.label}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }

              // Handle Activities & Events menu item specially
              if (item.id === 'admin/activities') {
                return (
                  <li key={item.id}>
                    {/* Main Activities & Events Button */}
                    <button
                      onClick={handleActivitiesToggle}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActivitiesPageActive(currentPage)
                          ? 'bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white shadow-lg'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <span className={isActivitiesPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'}>
                          {item.icon}
                        </span>
                        <span className={`${getClass('body')} font-medium text-left`}>
                          {item.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Expand/Collapse Icon */}
                        <span className={`transition-transform duration-200 ${
                          isActivitiesPageActive(currentPage) ? 'text-white' : 'text-white/60 group-hover:text-white'
                        } ${isActivitiesExpanded ? 'rotate-0' : '-rotate-90'}`}>
                          {isActivitiesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </div>
                    </button>

                    {/* Activities Submenu Items */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isActivitiesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <ul className="mt-2 space-y-1 ml-4">
                        {activitiesSubmenuItems.map((subItem) => (
                          <li key={subItem.id}>
                            <button
                              onClick={() => handleMenuItemClick(subItem.href)}
                              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-left ${
                                currentPage === subItem.id
                                  ? 'bg-gradient-to-r from-[#FCB283]/20 to-[#AA4626]/20 text-[#FCB283] border border-[#FCB283]/30'
                                  : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                              }`}
                            >
                              <span className={currentPage === subItem.id ? 'text-[#FCB283]' : 'text-white/50 group-hover:text-white/70'}>
                                {subItem.icon}
                              </span>
                              <span className={`${getClass('body')} text-sm font-medium`}>
                                {subItem.label}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }

              // Regular menu items
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuItemClick(item.href, !!item.badge)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white shadow-lg'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <span className={currentPage === item.id ? 'text-white' : 'text-white/60 group-hover:text-white'}>
                        {item.icon}
                      </span>
                      <span className={`${getClass('body')} font-medium text-left`}>
                        {item.label}
                      </span>
                    </div>
                    
                    {/* Badge */}
                    {item.badge && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getBadgeStyles(item.badge.color)}`}>
                        {item.badge.text}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/20 rounded-b-2xl">
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-all duration-200 ${getClass('body')}`}
          >
            <LogOut size={20} />
            <span className="font-medium">{currentContent.signOut}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminZoneSidebar;
