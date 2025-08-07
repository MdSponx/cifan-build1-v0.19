import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { FileText, Users, Calendar, Award } from 'lucide-react';

interface SubmissionsRouterProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const SubmissionsRouter: React.FC<SubmissionsRouterProps> = ({
  currentRoute,
  onNavigate
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  // Content translations
  const content = {
    th: {
      title: 'การจัดการผลงาน',
      subtitle: 'จัดการผลงานที่ส่งเข้าประกวดทั้งหมด',
      comingSoon: 'เร็วๆ นี้',
      description: 'ระบบจัดการผลงานกำลังพัฒนา',
      features: [
        'รายการผลงานทั้งหมด',
        'การกรองและค้นหา',
        'การให้คะแนนและรีวิว',
        'การจัดการสถานะ',
        'รายงานและสถิติ'
      ]
    },
    en: {
      title: 'Submissions Management',
      subtitle: 'Manage all submitted works and entries',
      comingSoon: 'Coming Soon',
      description: 'Submissions management system is under development',
      features: [
        'Complete submissions listing',
        'Advanced filtering and search',
        'Scoring and review system',
        'Status management',
        'Reports and analytics'
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
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <FileText className="w-12 h-12 text-[#FCB283]" />
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
                  {index === 0 && <FileText className="w-4 h-4 text-[#FCB283]" />}
                  {index === 1 && <Users className="w-4 h-4 text-[#FCB283]" />}
                  {index === 2 && <Award className="w-4 h-4 text-[#FCB283]" />}
                  {index === 3 && <Calendar className="w-4 h-4 text-[#FCB283]" />}
                  {index === 4 && <FileText className="w-4 h-4 text-[#FCB283]" />}
                </div>
                <span className={`${getClass('body')} text-white/90 text-left`}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="bg-white/10 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-[#AA4626] to-[#FCB283] h-2 rounded-full w-1/3"></div>
          </div>
          <p className={`text-sm ${getClass('menu')} text-white/60`}>
            {currentLanguage === 'th' ? 'ความคืบหน้า: 33%' : 'Progress: 33%'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsRouter;
