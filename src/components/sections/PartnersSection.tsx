import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerService } from '../../services/partnerService';
import { Partner } from '../../types/partner.types';
import { Loader } from 'lucide-react';

const PartnersSection = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'th';
  
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic typography classes based on language
  const getTypographyClass = (baseClass: string) => {
    return i18n.language === 'th' ? `${baseClass}-th` : `${baseClass}-en`;
  };

  const content = {
    th: {
      title: "🤝 พาร์ทเนอร์และผู้สนับสนุน",
      subtitle: "CIFAN 2025 เกิดขึ้นได้ด้วยการสนับสนุนอย่างใจกว้างจากพาร์ทเนอร์และสปอนเซอร์ที่มีคุณค่า"
    },
    en: {
      title: "🤝 Partners & Supporters",
      subtitle: "CIFAN 2025 is made possible through the generous support of our valued partners and sponsors"
    }
  };

  const currentContent = content[currentLanguage];

  // Load partners on component mount
  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnerService.getActivePartners();
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group partners by level and sort by order
  const partnersByLevel = {
    main: partners.filter(p => p.level === 1).sort((a, b) => a.order - b.order),
    support: partners.filter(p => p.level === 2).sort((a, b) => a.order - b.order),
    friend: partners.filter(p => p.level === 3).sort((a, b) => a.order - b.order)
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 md:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl ${getTypographyClass('header')} mb-4 text-white`}>
              {currentContent.title}
            </h2>
            <p className={`text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto ${getTypographyClass('body')} px-4`}>
              {currentContent.subtitle}
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-[#FCB283] animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl ${getTypographyClass('header')} mb-4 text-white`}>
            {currentContent.title}
          </h2>
          <p className={`text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto ${getTypographyClass('body')} px-4`}>
            {currentContent.subtitle}
          </p>
        </div>

        <div className="space-y-12 sm:space-y-16">
          {/* Main Partners - Level 1 (4-6 per row) */}
          {partnersByLevel.main.length > 0 && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                {partnersByLevel.main.map((partner) => (
                  <img
                    key={partner.id}
                    src={partner.logo.value}
                    alt={partner.name[currentLanguage]}
                    className="max-w-[120px] max-h-[60px] sm:max-w-[140px] sm:max-h-[70px] md:max-w-[160px] md:max-h-[80px] lg:max-w-[180px] lg:max-h-[90px] xl:max-w-[200px] xl:max-h-[100px] object-contain hover:scale-110 hover:opacity-90 transition-all duration-300 drop-shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/200x100/374151/9CA3AF?text=Main+Partner';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Supporting Partners - Level 2 (Slightly larger than before) */}
          {partnersByLevel.support.length > 0 && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                {partnersByLevel.support.map((partner) => (
                  <img
                    key={partner.id}
                    src={partner.logo.value}
                    alt={partner.name[currentLanguage]}
                    className="max-w-[100px] max-h-[50px] sm:max-w-[120px] sm:max-h-[60px] md:max-w-[140px] md:max-h-[70px] lg:max-w-[160px] lg:max-h-[80px] object-contain hover:scale-110 hover:opacity-90 transition-all duration-300 drop-shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/160x80/374151/9CA3AF?text=Supporting';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Friend Partners - Level 3 (Same as old Level 2) */}
          {partnersByLevel.friend.length > 0 && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
                {partnersByLevel.friend.map((partner) => (
                  <img
                    key={partner.id}
                    src={partner.logo.value}
                    alt={partner.name[currentLanguage]}
                    className="max-w-[80px] max-h-[40px] sm:max-w-[100px] sm:max-h-[50px] md:max-w-[120px] md:max-h-[60px] lg:max-w-[140px] lg:max-h-[70px] object-contain hover:scale-110 hover:opacity-90 transition-all duration-300 drop-shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/140x70/374151/9CA3AF?text=Friend';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {partners.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <p className={`${getTypographyClass('body')} text-white/60`}>
                {currentLanguage === 'th' 
                  ? 'ยังไม่มีพาร์ทเนอร์ที่แสดงผล' 
                  : 'No partners to display'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;