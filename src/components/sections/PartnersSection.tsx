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

  // Group partners by level
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
          {/* Main Partners - Level 1 (Largest) */}
          {partnersByLevel.main.length > 0 && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8">
                {partnersByLevel.main.map((partner) => (
                  <div key={partner.id} className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:scale-105 transition-all duration-300 group">
                    <div className="w-32 h-16 sm:w-40 sm:h-20 md:w-48 md:h-24 lg:w-56 lg:h-28 flex items-center justify-center">
                      <img
                        src={partner.logo.value}
                        alt={partner.name[currentLanguage]}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/224x112/374151/9CA3AF?text=Logo';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supporting Partners - Level 2 (Medium) */}
          {partnersByLevel.support.length > 0 && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6">
                {partnersByLevel.support.map((partner) => (
                  <div key={partner.id} className="glass-card p-3 sm:p-4 rounded-lg sm:rounded-xl hover:scale-105 transition-all duration-300 group">
                    <div className="w-24 h-12 sm:w-32 sm:h-16 md:w-36 md:h-18 flex items-center justify-center">
                      <img
                        src={partner.logo.value}
                        alt={partner.name[currentLanguage]}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/144x72/374151/9CA3AF?text=Logo';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friend Partners - Level 3 (Small) */}
          {partnersByLevel.friend.length > 0 && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4">
                {partnersByLevel.friend.map((partner) => (
                  <div key={partner.id} className="glass-card p-2 sm:p-3 rounded-md sm:rounded-lg hover:scale-105 transition-all duration-300 group">
                    <div className="w-20 h-10 sm:w-24 sm:h-12 md:w-28 md:h-14 flex items-center justify-center">
                      <img
                        src={partner.logo.value}
                        alt={partner.name[currentLanguage]}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/112x56/374151/9CA3AF?text=Logo';
                        }}
                      />
                    </div>
                  </div>
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