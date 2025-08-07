import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { Activity } from '../../types/activities';
import { activitiesService } from '../../services/activitiesService';
import { getTagColor } from '../../utils/tagColors';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  ExternalLink,
  Eye,
  Edit,
  Copy
} from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';

const ActivitiesSection: React.FC = () => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State management
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Content translations
  const content = {
    th: {
      title: 'เวิร์กช็อปและสัมมนา',
      subtitle: 'เข้าร่วมกิจกรรมและเวิร์กช็อปที่น่าสนใจจากเทศกาลภาพยนตร์',
      viewAll: 'ดูกิจกรรมทั้งหมด',
      register: 'ลงทะเบียน',
      learnMore: 'เรียนรู้เพิ่มเติม',
      participants: 'ผู้เข้าร่วม',
      unlimited: 'ไม่จำกัด',
      available: 'ที่ว่าง',
      full: 'เต็มแล้ว',
      upcoming: 'กำลังจะมาถึง',
      loading: 'กำลังโหลดกิจกรรม...',
      error: 'ไม่สามารถโหลดกิจกรรมได้',
      noActivities: 'ไม่มีกิจกรรมในขณะนี้',
      tryAgain: 'ลองใหม่อีกครั้ง',
      free: 'ฟรี',
      paid: 'เสียค่าใช้จ่าย'
    },
    en: {
      title: 'Workshops & Seminars',
      subtitle: 'Join exciting activities and workshops from the film festival',
      viewAll: 'View All Activities',
      register: 'Register',
      learnMore: 'Learn More',
      participants: 'participants',
      unlimited: 'Unlimited',
      available: 'available',
      full: 'Full',
      upcoming: 'Upcoming',
      loading: 'Loading activities...',
      error: 'Unable to load activities',
      noActivities: 'No activities available at the moment',
      tryAgain: 'Try Again',
      free: 'Free',
      paid: 'Paid'
    }
  };

  const currentContent = content[currentLanguage];

  // Load activities on component mount
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const publicActivities = await activitiesService.getPublicActivities(6);
      setActivities(publicActivities);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(currentContent.error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // Check if activity has available spots
  const getAvailabilityInfo = (activity: Activity) => {
    if (activity.maxParticipants === 0) {
      return { status: 'unlimited', text: currentContent.unlimited, color: 'text-green-400' };
    }
    
    const registered = activity.registeredParticipants || 0;
    const available = activity.maxParticipants - registered;
    
    if (available <= 0) {
      return { status: 'full', text: currentContent.full, color: 'text-red-400' };
    }
    
    return { 
      status: 'available', 
      text: `${available} ${currentContent.available}`, 
      color: 'text-green-400' 
    };
  };

  // Check if activity is free
  const isFreeActivity = (activity: Activity) => {
    return activity.tags.includes('free');
  };

  // Handle activity click
  const handleActivityClick = (activityId: string) => {
    window.location.hash = `#activity/${activityId}`;
  };

  // Handle view all click
  const handleViewAllClick = () => {
    window.location.hash = '#activities';
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-b from-[#110D16] to-[#1A1625] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl ${getClass('header')} text-white mb-4`}>
              {currentContent.title}
            </h2>
            <p className={`text-lg sm:text-xl ${getClass('body')} text-white/80 max-w-3xl mx-auto`}>
              {currentContent.subtitle}
            </p>
          </div>

          {/* Loading skeleton */}
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#FCB283] mx-auto mb-4" />
              <p className={`${getClass('body')} text-white/60`}>
                {currentContent.loading}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-b from-[#110D16] to-[#1A1625] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl ${getClass('header')} text-white mb-4`}>
              {currentContent.title}
            </h2>
            <p className={`text-lg sm:text-xl ${getClass('body')} text-white/80 max-w-3xl mx-auto`}>
              {currentContent.subtitle}
            </p>
          </div>

          {/* Error state */}
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className={`text-xl ${getClass('header')} text-white mb-2`}>
                {error}
              </h3>
              <AnimatedButton
                variant="outline"
                size="medium"
                onClick={loadActivities}
                className="mt-4"
              >
                {currentContent.tryAgain}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // No activities state
  if (activities.length === 0) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-b from-[#110D16] to-[#1A1625] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl ${getClass('header')} text-white mb-4`}>
              {currentContent.title}
            </h2>
            <p className={`text-lg sm:text-xl ${getClass('body')} text-white/80 max-w-3xl mx-auto`}>
              {currentContent.subtitle}
            </p>
          </div>

          {/* No activities state */}
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className={`${getClass('body')} text-white/60`}>
              {currentContent.noActivities}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-[#110D16] to-[#1A1625] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FCB283]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#AA4626]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl ${getClass('header')} text-white mb-4`}>
            {currentContent.title}
          </h2>
          <p className={`text-lg sm:text-xl ${getClass('body')} text-white/80 max-w-3xl mx-auto`}>
            {currentContent.subtitle}
          </p>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {activities.map((activity, index) => {
            const availability = getAvailabilityInfo(activity);
            const isFree = isFreeActivity(activity);
            
            return (
              <div
                key={activity.id}
                className="group cursor-pointer"
                onClick={() => handleActivityClick(activity.id)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="glass-container rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/10 hover:border-[#FCB283]/30">
                  {/* Activity Image */}
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img
                      src={activity.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgOTBMMTg1IDEwNUwyMDUgODVMMjI1IDExMEgyNTVWMTMwSDEyNVYxMTBMMTQwIDk1TDE3NSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                      alt={activity.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Status badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {isFree && (
                        <span className="px-2 py-1 bg-green-500/90 text-white text-xs font-medium rounded-full">
                          {currentContent.free}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-[#FCB283]/90 text-white text-xs font-medium rounded-full">
                        {currentContent.upcoming}
                      </span>
                    </div>

                    {/* Availability indicator */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 bg-black/60 backdrop-blur-sm text-xs font-medium rounded-full ${availability.color}`}>
                        {availability.text}
                      </span>
                    </div>
                  </div>

                  {/* Activity Content */}
                  <div className="p-6">
                    <h3 className={`text-xl ${getClass('header')} text-white mb-3 line-clamp-2 group-hover:text-[#FCB283] transition-colors`}>
                      {activity.name}
                    </h3>
                    
                    <p className={`${getClass('body')} text-white/70 mb-4 line-clamp-2`}>
                      {activity.shortDescription.length > 120 
                        ? `${activity.shortDescription.substring(0, 120)}...`
                        : activity.shortDescription
                      }
                    </p>

                    {/* Activity Details */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-sm text-white/60">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{formatDate(activity.eventDate)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-white/60">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{formatTime(activity.startTime)} - {formatTime(activity.endTime)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-white/60">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">{activity.venueName}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-white/60">
                        <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>
                          {activity.maxParticipants === 0 
                            ? currentContent.unlimited 
                            : `${activity.registeredParticipants || 0}/${activity.maxParticipants} ${currentContent.participants}`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {activity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {activity.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className={`px-2 py-1 text-xs rounded-full border ${getTagColor(tag)} ${getClass('body')}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex items-center justify-between mb-4">
                      <AnimatedButton
                        variant="outline"
                        size="small"
                        className="flex-1 mr-3"
                        onClick={(e?: React.MouseEvent) => {
                          e?.stopPropagation();
                          handleActivityClick(activity.id);
                        }}
                      >
                        {currentContent.learnMore}
                      </AnimatedButton>
                      
                      <button 
                        className="p-2 text-white/60 hover:text-[#FCB283] transition-colors"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleActivityClick(activity.id);
                        }}
                        title={currentContent.learnMore}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom Action Icons */}
                    <div className="flex items-center justify-center space-x-4 pt-3 border-t border-white/10">
                      <button 
                        className="p-2 text-white/60 hover:text-[#FCB283] transition-colors rounded-full hover:bg-white/10"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleActivityClick(activity.id);
                        }}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button 
                        className="p-2 text-white/60 hover:text-[#FCB283] transition-colors rounded-full hover:bg-white/10"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          // Add edit functionality here if needed
                        }}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button 
                        className="p-2 text-white/60 hover:text-[#FCB283] transition-colors rounded-full hover:bg-white/10"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          // Add copy functionality here if needed
                        }}
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <AnimatedButton
            variant="primary"
            size="large"
            onClick={handleViewAllClick}
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            {currentContent.viewAll}
          </AnimatedButton>
        </div>
      </div>
    </section>
  );
};

export default ActivitiesSection;
