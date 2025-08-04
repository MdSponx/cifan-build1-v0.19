import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { Partner, PartnerFormData } from '../../types/partner.types';
import { partnerService } from '../../services/partnerService';
import { useAdmin } from './AdminContext';
import {
  X,
  Upload,
  Globe,
  Image as ImageIcon,
  Loader
} from 'lucide-react';

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  partner?: Partner | null;
}

const PartnerFormModal: React.FC<PartnerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  partner
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { adminProfile } = useAdmin();
  const currentLanguage = i18n.language as 'en' | 'th';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<PartnerFormData>({
    nameTh: '',
    nameEn: '',
    logoType: 'url',
    logoValue: '',
    level: 1,
    note: '',
    status: 'active'
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const content = {
    th: {
      addPartner: 'เพิ่มพาร์ทเนอร์',
      editPartner: 'แก้ไขพาร์ทเนอร์',
      nameTh: 'ชื่อ (ไทย) *',
      nameEn: 'ชื่อ (อังกฤษ) *',
      logoType: 'ประเภทโลโก้',
      uploadLogo: 'อัพโหลดโลโก้',
      logoUrl: 'ลิงก์โลโก้',
      logoUrlPlaceholder: 'https://example.com/logo.png',
      level: 'ระดับ *',
      level1: 'ระดับ 1 - หลัก',
      level2: 'ระดับ 2 - สนับสนุน',
      level3: 'ระดับ 3 - เพื่อน',
      note: 'หมายเหตุ',
      notePlaceholder: 'รายละเอียดเกี่ยวกับพาร์ทเนอร์...',
      status: 'สถานะ',
      active: 'ใช้งาน',
      inactive: 'ไม่ใช้งาน',
      cancel: 'ยกเลิก',
      save: 'บันทึก',
      saving: 'กำลังบันทึก...',
      selectFile: 'เลือกไฟล์',
      dragDrop: 'ลาก & วางไฟล์ที่นี่',
      supportedFormats: 'รองรับ JPG, PNG, SVG (สูงสุด 5MB)',
      logoPreview: 'ตัวอย่างโลโก้',
      errors: {
        nameTh: 'กรุณากรอกชื่อภาษาไทย',
        nameEn: 'กรุณากรอกชื่อภาษาอังกฤษ',
        logoValue: 'กรุณากรอกลิงก์โลโก้',
        logo: 'กรุณาเลือกไฟล์โลโก้',
        logoFormat: 'กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, SVG)',
        logoSize: 'ขนาดไฟล์ต้องไม่เกิน 5MB'
      }
    },
    en: {
      addPartner: 'Add Partner',
      editPartner: 'Edit Partner',
      nameTh: 'Name (Thai) *',
      nameEn: 'Name (English) *',
      logoType: 'Logo Type',
      uploadLogo: 'Upload Logo',
      logoUrl: 'Logo URL',
      logoUrlPlaceholder: 'https://example.com/logo.png',
      level: 'Level *',
      level1: 'Level 1 - Main',
      level2: 'Level 2 - Supporting',
      level3: 'Level 3 - Friend',
      note: 'Note',
      notePlaceholder: 'Details about the partner...',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      selectFile: 'Select File',
      dragDrop: 'Drag & drop file here',
      supportedFormats: 'Supports JPG, PNG, SVG (max 5MB)',
      logoPreview: 'Logo Preview',
      errors: {
        nameTh: 'Thai name is required',
        nameEn: 'English name is required',
        logoValue: 'Logo URL is required',
        logo: 'Logo file is required',
        logoFormat: 'Please select a valid image file (JPG, PNG, SVG)',
        logoSize: 'File size must be less than 5MB'
      }
    }
  };

  const currentContent = content[currentLanguage];

  // Initialize form with partner data
  useEffect(() => {
    if (partner) {
      setFormData({
        nameTh: partner.name.th,
        nameEn: partner.name.en,
        logoType: partner.logo.type,
        logoValue: partner.logo.value,
        level: partner.level,
        note: partner.note,
        status: partner.status
      });
      setLogoPreview(partner.logo.value);
    } else {
      // Reset form for new partner
      setFormData({
        nameTh: '',
        nameEn: '',
        logoType: 'url',
        logoValue: '',
        level: 1,
        note: '',
        status: 'active'
      });
      setLogoFile(null);
      setLogoPreview('');
    }
    setErrors({});
  }, [partner]);

  // Handle file upload
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, logo: currentContent.errors.logoFormat });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, logo: currentContent.errors.logoSize });
      return;
    }

    setLogoFile(file);
    setErrors({ ...errors, logo: '' });

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  // Handle logo URL change
  const handleLogoUrlChange = (url: string) => {
    setFormData({ ...formData, logoValue: url });
    setLogoPreview(url);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nameTh.trim()) {
      newErrors.nameTh = currentContent.errors.nameTh;
    }
    if (!formData.nameEn.trim()) {
      newErrors.nameEn = currentContent.errors.nameEn;
    }
    if (formData.logoType === 'url' && !formData.logoValue.trim()) {
      newErrors.logoValue = currentContent.errors.logoValue;
    }
    if (formData.logoType === 'upload' && !logoFile && !partner?.logo.value) {
      newErrors.logo = currentContent.errors.logo;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (partner) {
        await partnerService.updatePartner(partner.id, formData, logoFile || undefined);
      } else {
        await partnerService.createPartner(formData, adminProfile?.uid || 'unknown', logoFile || undefined);
      }
      onSubmit();
    } catch (error) {
      console.error('Error saving partner:', error);
      setErrors({ general: currentLanguage === 'th' ? 'ไม่สามารถบันทึกได้ กรุณาลองใหม่' : 'Failed to save partner. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-container rounded-xl border border-white/20 w-full max-w-lg max-h-[90vh] flex flex-col">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h2 className={`text-lg ${getClass('header')} text-white`}>
            {partner ? currentContent.editPartner : currentContent.addPartner}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Partner Names */}
            <div className="space-y-3">
              <div>
                <label className={`block ${getClass('body')} text-white/80 mb-1 text-sm`}>
                  {currentContent.nameTh}
                </label>
                <input
                  type="text"
                  value={formData.nameTh}
                  onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] transition-colors text-sm ${
                    errors.nameTh ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder="ชื่อพาร์ทเนอร์ภาษาไทย"
                />
                {errors.nameTh && (
                  <p className="text-red-400 text-xs mt-1">{errors.nameTh}</p>
                )}
              </div>
              
              <div>
                <label className={`block ${getClass('body')} text-white/80 mb-1 text-sm`}>
                  {currentContent.nameEn}
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] transition-colors text-sm ${
                    errors.nameEn ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder="Partner Name in English"
                />
                {errors.nameEn && (
                  <p className="text-red-400 text-xs mt-1">{errors.nameEn}</p>
                )}
              </div>
            </div>

            {/* Logo Type Selection */}
            <div>
              <label className={`block ${getClass('body')} text-white/80 mb-2 text-sm`}>
                {currentContent.logoType}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, logoType: 'url', logoValue: '' });
                    setLogoFile(null);
                    setLogoPreview('');
                  }}
                  className={`p-2 rounded-lg border transition-colors flex items-center justify-center space-x-1 text-sm ${
                    formData.logoType === 'url'
                      ? 'bg-[#FCB283]/20 border-[#FCB283]/50 text-[#FCB283]'
                      : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <Globe size={14} />
                  <span>{currentContent.logoUrl}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, logoType: 'upload', logoValue: '' });
                    setLogoPreview(partner?.logo.value || '');
                  }}
                  className={`p-2 rounded-lg border transition-colors flex items-center justify-center space-x-1 text-sm ${
                    formData.logoType === 'upload'
                      ? 'bg-[#FCB283]/20 border-[#FCB283]/50 text-[#FCB283]'
                      : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <Upload size={14} />
                  <span>{currentContent.uploadLogo}</span>
                </button>
              </div>
            </div>

            {/* Logo Input */}
            {formData.logoType === 'url' ? (
              <div>
                <input
                  type="url"
                  value={formData.logoValue}
                  onChange={(e) => handleLogoUrlChange(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] transition-colors text-sm ${
                    errors.logoValue ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder={currentContent.logoUrlPlaceholder}
                />
                {errors.logoValue && (
                  <p className="text-red-400 text-xs mt-1">{errors.logoValue}</p>
                )}
              </div>
            ) : (
              <div>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    errors.logo ? 'border-red-500/50' : 'border-white/30 hover:border-[#FCB283]/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <ImageIcon className="w-8 h-8 mx-auto text-white/40 mb-2" />
                  <p className={`${getClass('body')} text-white/60 text-xs mb-1`}>
                    {currentContent.dragDrop}
                  </p>
                  <p className="text-white/40 text-xs">
                    {currentContent.supportedFormats}
                  </p>
                </div>
                {errors.logo && (
                  <p className="text-red-400 text-xs mt-1">{errors.logo}</p>
                )}
              </div>
            )}

            {/* Logo Preview - Compact */}
            {logoPreview && (
              <div className="bg-white/10 rounded-lg p-3 flex items-center justify-center h-20">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/200x100/374151/9CA3AF?text=Invalid+Image';
                  }}
                />
              </div>
            )}

            {/* Level and Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block ${getClass('body')} text-white/80 mb-1 text-sm`}>
                  {currentContent.level}
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) as 1 | 2 | 3 })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#FCB283] transition-colors text-sm"
                >
                  <option value={1} className="bg-[#110D16]">{currentContent.level1}</option>
                  <option value={2} className="bg-[#110D16]">{currentContent.level2}</option>
                  <option value={3} className="bg-[#110D16]">{currentContent.level3}</option>
                </select>
              </div>
              
              <div>
                <label className={`block ${getClass('body')} text-white/80 mb-1 text-sm`}>
                  {currentContent.status}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#FCB283] transition-colors text-sm"
                >
                  <option value="active" className="bg-[#110D16]">{currentContent.active}</option>
                  <option value="inactive" className="bg-[#110D16]">{currentContent.inactive}</option>
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className={`block ${getClass('body')} text-white/80 mb-1 text-sm`}>
                {currentContent.note}
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#FCB283] transition-colors resize-none text-sm"
                placeholder={currentContent.notePlaceholder}
              />
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end space-x-3 p-4 border-t border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50 text-sm"
          >
            {currentContent.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#FCB283] hover:bg-[#AA4626] text-white transition-colors disabled:opacity-50 flex items-center space-x-2 text-sm"
          >
            {isSubmitting && <Loader className="w-3 h-3 animate-spin" />}
            <span>{isSubmitting ? currentContent.saving : currentContent.save}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerFormModal;