import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { Partner } from '../../types/partner.types';
import { AlertTriangle, X } from 'lucide-react';

interface PartnerDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  partner: Partner;
}

const PartnerDeleteModal: React.FC<PartnerDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  partner
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const content = {
    th: {
      title: 'ยืนยันการลบ',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบพาร์ทเนอร์นี้?',
      warning: 'การดำเนินการนี้ไม่สามารถยกเลิกได้',
      cancel: 'ยกเลิก',
      delete: 'ลบ'
    },
    en: {
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this partner?',
      warning: 'This action cannot be undone',
      cancel: 'Cancel',
      delete: 'Delete'
    }
  };

  const currentContent = content[currentLanguage];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-container rounded-2xl border border-white/20 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className={`text-lg ${getClass('header')} text-white`}>
              {currentContent.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className={`${getClass('body')} text-white/80 mb-4`}>
            {currentContent.message}
          </p>
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <div className="flex items-center space-x-3">
              <img
                src={partner.logo.value}
                alt={partner.name[currentLanguage]}
                className="w-12 h-12 object-contain rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/48x48/374151/9CA3AF?text=Logo';
                }}
              />
              <div>
                <p className={`${getClass('body')} text-white font-medium`}>
                  {partner.name[currentLanguage]}
                </p>
                <p className="text-white/60 text-sm">
                  Level {partner.level} - {partner.status}
                </p>
              </div>
            </div>
          </div>
          <p className="text-red-400 text-sm">
            {currentContent.warning}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 transition-all duration-200"
          >
            {currentContent.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
          >
            {currentContent.delete}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerDeleteModal;