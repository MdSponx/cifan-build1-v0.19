import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { Users, UserCheck, Shield, Settings, BarChart3 } from 'lucide-react';

interface UsersRouterProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const UsersRouter: React.FC<UsersRouterProps> = ({
  currentRoute,
  onNavigate
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  // Content translations
  const content = {
    th: {
      title: 'การจัดการผู้ใช้',
      subtitle: 'จัดการผู้ใช้งานและสิทธิ์การเข้าถึง',
      comingSoon: 'เร็วๆ นี้',
      description: 'ระบบจัดการผู้ใช้งานกำลังพัฒนา',
      features: [
        'รายการผู้ใช้ทั้งหมด',
        'การจัดการบทบาทและสิทธิ์',
        'ระบบยืนยันตัวตน',
        'การตั้งค่าบัญชี',
        'รายงานการใช้งาน'
      ]
    },
    en: {
      title: 'User Management',
      subtitle: 'Manage users and access permissions',
      comingSoon: 'Coming Soon',
      description: 'User management system is under development',
      features: [
        'Complete user listing',
        'Role and permission management',
        'Identity verification system',
        'Account settings',
        'Usage analytics'
      ]
    }
  };

  const currentContent = content[currentLanguage];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="glass-container rounded-xl p-6 sm:p-8">
        <div className="text-center">
          <h1 className={`text-2xl sm:text-3xl ${getClass('header')} text-white mb-2`}>
            {currentContent.title}
          </h1>
          <p className={`${getClass('body')} text-white/80`}>
            {currentContent.subtitle}
          </p>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="glass-container rounded-xl p-8 sm:p-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center">
            <Users className="w-12 h-12 text-[#FCB283]" />
          </div>
          
          <h2 className={`text-xl sm:text-2xl ${getClass('header')} text-white mb-4`}>
            {currentContent.comingSoon}
          </h2>
          
          <p className={`${getClass('body')} text-white/80 mb-8 leading-relaxed`}>
            {currentContent.description}
          </p>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {currentContent.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="w-8 h-8 rounded-full bg-[#FCB283]/20 flex items-center justify-center flex-shrink-0">
                  {index === 0 && <Users className="w-4 h-4 text-[#FCB283]" />}
                  {index === 1 && <Shield className="w-4 h-4 text-[#FCB283]" />}
                  {index === 2 && <UserCheck className="w-4 h-4 text-[#FCB283]" />}
                  {index === 3 && <Settings className="w-4 h-4 text-[#FCB283]" />}
                  {index === 4 && <BarChart3 className="w-4 h-4 text-[#FCB283]" />}
                </div>
                <span className={`${getClass('body')} text-white/90 text-left`}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="bg-white/10 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-[#AA4626] to-[#FCB283] h-2 rounded-full w-1/4"></div>
          </div>
          <p className={`text-sm ${getClass('menu')} text-white/60`}>
            {currentLanguage === 'th' ? 'ความคืบหน้า: 25%' : 'Progress: 25%'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsersRouter;
