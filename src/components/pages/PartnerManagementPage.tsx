import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAdmin } from '../admin/AdminContext';
import { partnerService } from '../../services/partnerService';
import { Partner } from '../../types/partner.types';
import { useNotificationHelpers } from '../ui/NotificationSystem';
import PartnerFormModal from '../admin/PartnerFormModal';
import PartnerDeleteModal from '../admin/PartnerDeleteModal';
import AdminZoneHeader from '../layout/AdminZoneHeader';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  Upload,
  Star,
  Award,
  Medal,
  Loader
} from 'lucide-react';

interface PartnerManagementPageProps {
  onSidebarToggle?: () => void;
}

const PartnerManagementPage: React.FC<PartnerManagementPageProps> = ({ onSidebarToggle }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { checkPermission, adminProfile } = useAdmin();
  const { showSuccess, showError } = useNotificationHelpers();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 1 | 2 | 3>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);

  const content = {
    th: {
      title: 'จัดการพาร์ทเนอร์',
      subtitle: 'จัดการพาร์ทเนอร์และผู้สนับสนุนของเทศกาล',
      addPartner: 'เพิ่มพาร์ทเนอร์',
      searchPlaceholder: 'ค้นหาชื่อพาร์ทเนอร์...',
      filterLevel: 'กรองตามระดับ',
      filterStatus: 'กรองตามสถานะ',
      allLevels: 'ทุกระดับ',
      allStatuses: 'ทุกสถานะ',
      level1: 'ระดับ 1 - หลัก',
      level2: 'ระดับ 2 - สนับสนุน',
      level3: 'ระดับ 3 - เพื่อน',
      active: 'ใช้งาน',
      inactive: 'ไม่ใช้งาน',
      edit: 'แก้ไข',
      delete: 'ลบ',
      toggleStatus: 'เปลี่ยนสถานะ',
      noPartners: 'ไม่พบพาร์ทเนอร์',
      loading: 'กำลังโหลด...',
      uploadedLogo: 'โลโก้ที่อัพโหลด',
      externalUrl: 'ลิงก์ภายนอก',
      totalPartners: 'พาร์ทเนอร์ทั้งหมด',
      activePartners: 'พาร์ทเนอร์ที่ใช้งาน'
    },
    en: {
      title: 'Partner Management',
      subtitle: 'Manage festival partners and supporters',
      addPartner: 'Add Partner',
      searchPlaceholder: 'Search partner name...',
      filterLevel: 'Filter by Level',
      filterStatus: 'Filter by Status',
      allLevels: 'All Levels',
      allStatuses: 'All Statuses',
      level1: 'Level 1 - Main',
      level2: 'Level 2 - Supporting',
      level3: 'Level 3 - Friend',
      active: 'Active',
      inactive: 'Inactive',
      edit: 'Edit',
      delete: 'Delete',
      toggleStatus: 'Toggle Status',
      noPartners: 'No partners found',
      loading: 'Loading...',
      uploadedLogo: 'Uploaded Logo',
      externalUrl: 'External URL',
      totalPartners: 'Total Partners',
      activePartners: 'Active Partners'
    }
  };

  const currentContent = content[currentLanguage];

  // Load partners
  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnerService.getAllPartners();
      setPartners(data);
    } catch (error) {
      showError(
        currentLanguage === 'th' ? 'ไม่สามารถโหลดข้อมูลได้' : 'Failed to load partners',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter partners
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = searchTerm === '' || 
      partner.name.th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.name.en.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || partner.level === filterLevel;
    const matchesStatus = filterStatus === 'all' || partner.status === filterStatus;

    return matchesSearch && matchesLevel && matchesStatus;
  });

  // Handle form submission
  const handleFormSubmit = async () => {
    await loadPartners();
    setShowFormModal(false);
    setEditingPartner(null);
    showSuccess(
      editingPartner 
        ? (currentLanguage === 'th' ? 'อัปเดตพาร์ทเนอร์สำเร็จ' : 'Partner updated successfully')
        : (currentLanguage === 'th' ? 'เพิ่มพาร์ทเนอร์สำเร็จ' : 'Partner created successfully')
    );
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingPartner) return;
    
    try {
      await partnerService.deletePartner(deletingPartner.id);
      await loadPartners();
      setShowDeleteModal(false);
      setDeletingPartner(null);
      showSuccess(
        currentLanguage === 'th' ? 'ลบพาร์ทเนอร์สำเร็จ' : 'Partner deleted successfully'
      );
    } catch (error) {
      showError(
        currentLanguage === 'th' ? 'ไม่สามารถลบได้' : 'Failed to delete partner',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (partner: Partner) => {
    try {
      const newStatus = partner.status === 'active' ? 'inactive' : 'active';
      await partnerService.updatePartner(partner.id, {
        nameTh: partner.name.th,
        nameEn: partner.name.en,
        logoType: partner.logo.type,
        logoValue: partner.logo.value,
        level: partner.level,
        order: partner.order,
        note: partner.note,
        status: newStatus
      });
      await loadPartners();
      showSuccess(
        newStatus === 'active' 
          ? (currentLanguage === 'th' ? 'เปิดใช้งานพาร์ทเนอร์แล้ว' : 'Partner activated successfully')
          : (currentLanguage === 'th' ? 'ปิดใช้งานพาร์ทเนอร์แล้ว' : 'Partner deactivated successfully')
      );
    } catch (error) {
      showError(
        currentLanguage === 'th' ? 'ไม่สามารถเปลี่ยนสถานะได้' : 'Failed to update partner status',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  // Get level icon and color
  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return { icon: Star, color: '#FFD700', bgColor: 'bg-yellow-500/20' };
      case 2:
        return { icon: Award, color: '#C0C0C0', bgColor: 'bg-gray-400/20' };
      case 3:
        return { icon: Medal, color: '#CD7F32', bgColor: 'bg-orange-600/20' };
      default:
        return { icon: Building2, color: '#9CA3AF', bgColor: 'bg-gray-500/20' };
    }
  };

  // Permission check
  if (!checkPermission('canManageUsers')) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AdminZoneHeader
          title={currentContent.title}
          subtitle={currentContent.subtitle}
          onSidebarToggle={onSidebarToggle || (() => {})}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Building2 className="w-16 h-16 mx-auto text-red-400" />
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentLanguage === 'th' ? 'ไม่มีสิทธิ์เข้าถึง' : 'Access Denied'}
            </h2>
            <p className={`${getClass('body')} text-white/60`}>
              {currentLanguage === 'th' 
                ? 'คุณไม่มีสิทธิ์ในการจัดการพาร์ทเนอร์'
                : "You don't have permission to manage partners."
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const activePartners = partners.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Admin Zone Header */}
      <AdminZoneHeader
        title={currentContent.title}
        subtitle={currentContent.subtitle}
        onSidebarToggle={onSidebarToggle || (() => {})}
      >
        <button
          onClick={() => setShowFormModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#FCB283] hover:bg-[#AA4626] rounded-lg text-white transition-colors"
        >
          <Plus size={16} />
          <span className={`${getClass('menu')} text-sm`}>
            {currentContent.addPartner}
          </span>
        </button>
      </AdminZoneHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getClass('body')} text-white/60 text-sm`}>
                {currentContent.totalPartners}
              </p>
              <p className={`text-2xl ${getClass('header')} text-white font-bold`}>
                {partners.length}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-[#FCB283]" />
          </div>
        </div>

        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getClass('body')} text-white/60 text-sm`}>
                {currentContent.activePartners}
              </p>
              <p className={`text-2xl ${getClass('header')} text-white font-bold`}>
                {activePartners}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getClass('body')} text-white/60 text-sm`}>
                {currentContent.level1}
              </p>
              <p className={`text-2xl ${getClass('header')} text-white font-bold`}>
                {partners.filter(p => p.level === 1).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getClass('body')} text-white/60 text-sm`}>
                {currentContent.level2} + {currentContent.level3}
              </p>
              <p className={`text-2xl ${getClass('header')} text-white font-bold`}>
                {partners.filter(p => p.level === 2 || p.level === 3).length}
              </p>
            </div>
            <Award className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-container rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
              <input
                type="text"
                placeholder={currentContent.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] focus:bg-white/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div className="lg:w-48">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#FCB283] focus:bg-white/20 transition-all duration-200"
            >
              <option value="all" className="bg-[#110D16]">{currentContent.allLevels}</option>
              <option value={1} className="bg-[#110D16]">{currentContent.level1}</option>
              <option value={2} className="bg-[#110D16]">{currentContent.level2}</option>
              <option value={3} className="bg-[#110D16]">{currentContent.level3}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#FCB283] focus:bg-white/20 transition-all duration-200"
            >
              <option value="all" className="bg-[#110D16]">{currentContent.allStatuses}</option>
              <option value="active" className="bg-[#110D16]">{currentContent.active}</option>
              <option value="inactive" className="bg-[#110D16]">{currentContent.inactive}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="glass-container rounded-xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-[#FCB283] animate-spin mr-3" />
            <span className={`${getClass('body')} text-white/70`}>{currentContent.loading}</span>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-white/40 mb-4" />
            <p className={`${getClass('body')} text-white/60`}>
              {currentContent.noPartners}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPartners.map((partner) => {
              const levelInfo = getLevelInfo(partner.level);
              const LevelIcon = levelInfo.icon;

              return (
                <div key={partner.id} className="glass-card p-6 rounded-xl border border-white/10 hover:border-[#FCB283]/50 transition-all duration-200">
                  {/* Partner Logo */}
                  <div className="flex items-center justify-center mb-4 h-24 bg-white/5 rounded-lg">
                    <img
                      src={partner.logo.value}
                      alt={partner.name[currentLanguage]}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/200x100/374151/9CA3AF?text=Logo';
                      }}
                    />
                  </div>

                  {/* Partner Info */}
                  <div className="text-center mb-4">
                    <h3 className={`${getClass('body')} text-white font-semibold mb-2 line-clamp-2`}>
                      {partner.name[currentLanguage]}
                    </h3>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${levelInfo.bgColor}`}>
                        <LevelIcon size={14} style={{ color: levelInfo.color }} />
                        <span className="text-xs text-white/80">
                          {currentContent[`level${partner.level}` as keyof typeof currentContent]}
                        </span>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                        partner.status === 'active' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {partner.status === 'active' ? (
                          <Eye size={14} className="text-green-400" />
                        ) : (
                          <EyeOff size={14} className="text-red-400" />
                        )}
                        <span className="text-xs text-white/80">
                          {currentContent[partner.status as keyof typeof currentContent]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-1 text-xs text-white/60">
                      {partner.logo.type === 'upload' ? (
                        <>
                          <Upload size={12} />
                          <span>{currentContent.uploadedLogo}</span>
                        </>
                      ) : (
                        <>
                          <Globe size={12} />
                          <span>{currentContent.externalUrl}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Note */}
                  {partner.note && (
                    <p className={`${getClass('body')} text-white/60 text-sm text-center mb-4 line-clamp-2`}>
                      {partner.note}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingPartner(partner);
                        setShowFormModal(true);
                      }}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-200"
                      title={currentContent.edit}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(partner)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        partner.status === 'active' 
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                      title={currentContent.toggleStatus}
                    >
                      {partner.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {checkPermission('canManageUsers') && (
                      <button
                        onClick={() => {
                          setDeletingPartner(partner);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200"
                        title={currentContent.delete}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        <PartnerFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingPartner(null);
          }}
          onSubmit={handleFormSubmit}
          partner={editingPartner}
        />
      )}

      {showDeleteModal && deletingPartner && (
        <PartnerDeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingPartner(null);
          }}
          onConfirm={handleDelete}
          partner={deletingPartner}
        />
      )}
    </div>
  );
};

export default PartnerManagementPage;