import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { Activity } from '../../types/activities';
import { activitiesService } from '../../services/activitiesService';
import { getTagColor } from '../../utils/tagColors';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  ExternalLink,
  Share2,
  Printer,
  Mail,
  Phone,
  User,
  Globe,
  CheckCircle,
  XCircle,
  Info,
  UserPlus
} from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';

interface ActivityDetailPageProps {
  activityId: string;
}

const ActivityDetailPage: React.FC<ActivityDetailPageProps> = ({ activityId }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user } = useAuth();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State management
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Content translations
  const content = {
    th: {
      backToActivities: 'กลับไปยังกิจกรรม',
      register: 'ลงทะเบียน',
      registering: 'กำลังลงทะเบียน...',
      registered: 'ลงทะเบียนแล้ว',
      full: 'เต็มแล้ว',
      closed: 'ปิดรับสมัครแล้ว',
      loginRequired: 'กรุณาเข้าสู่ระบบเพื่อลงทะเบียน',
      noRegistrationNeeded: 'ไม่ต้องลงทะเบียน',
      freeEntry: 'เข้าร่วมได้เลย',
      eventDetails: 'รายละเอียดงาน',
      dateTime: 'วันที่และเวลา',
      venue: 'สถานที่',
      organizers: 'ผู้จัดงาน',
      contact: 'ติดต่อ',
      participants: 'ผู้เข้าร่วม',
      unlimited: 'ไม่จำกัด',
      available: 'ที่ว่าง',
      registrationDeadline: 'วันหมดเขตรับสมัคร',
      share: 'แชร์',
      print: 'พิมพ์',
      viewLocation: 'ดูตำแหน่ง',
      loading: 'กำลังโหลด...',
      error: 'ไม่สามารถโหลดกิจกรรมได้',
      notFound: 'ไม่พบกิจกรรม',
      tryAgain: 'ลองใหม่อีกครั้ง',
      free: 'ฟรี',
      paid: 'เสียค่าใช้จ่าย',
      status: 'สถานะ',
      published: 'เผยแพร่แล้ว',
      draft: 'ร่าง',
      cancelled: 'ยกเลิก',
      completed: 'เสร็จสิ้น'
    },
    en: {
      backToActivities: 'Back to Activities',
      register: 'Register',
      registering: 'Registering...',
      registered: 'Registered',
      full: 'Full',
      closed: 'Registration Closed',
      loginRequired: 'Please login to register',
      noRegistrationNeeded: 'No Registration Required',
      freeEntry: 'Free Entry',
      eventDetails: 'Event Details',
      dateTime: 'Date & Time',
      venue: 'Venue',
      organizers: 'Organizers',
      contact: 'Contact',
      participants: 'Participants',
      unlimited: 'Unlimited',
      available: 'available',
      registrationDeadline: 'Registration Deadline',
      share: 'Share',
      print: 'Print',
      viewLocation: 'View Location',
      loading: 'Loading...',
      error: 'Unable to load activity',
      notFound: 'Activity not found',
      tryAgain: 'Try Again',
      free: 'Free',
      paid: 'Paid',
      status: 'Status',
      published: 'Published',
      draft: 'Draft',
      cancelled: 'Cancelled',
      completed: 'Completed'
    }
  };

  const currentContent = content[currentLanguage];

  // Load activity on component mount
  useEffect(() => {
    loadActivity();
    // Increment view count
    incrementViews();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const activityData = await activitiesService.getActivityById(activityId);
      
      if (!activityData) {
        setError(currentContent.notFound);
        return;
      }

      // Check if activity is public or user has access
      if (!activityData.isPublic && activityData.status !== 'published') {
        setError(currentContent.notFound);
        return;
      }

      setActivity(activityData);
    } catch (err) {
      console.error('Error loading activity:', err);
      setError(currentContent.error);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      await activitiesService.incrementViews(activityId);
    } catch (err) {
      // Silently fail for view counting
      console.warn('Failed to increment views:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // Check registration availability
  const getRegistrationStatus = () => {
    if (!activity) return { canRegister: false, reason: 'loading' };
    
    const now = new Date();
    const registrationDeadline = new Date(activity.registrationDeadline);
    const eventDate = new Date(activity.eventDate);
    
    // Check if registration is needed for this activity
    if (!activity.needSubmission) {
      return { canRegister: false, reason: 'no-registration-needed' };
    }
    
    // Check if user is logged in (only if registration is needed)
    if (!user) return { canRegister: false, reason: 'login' };
    
    // Check if registration deadline has passed
    if (now > registrationDeadline) {
      return { canRegister: false, reason: 'closed' };
    }
    
    // Check if event has already passed
    if (now > eventDate) {
      return { canRegister: false, reason: 'past' };
    }
    
    // Check if activity is published
    if (activity.status !== 'published') {
      return { canRegister: false, reason: 'unpublished' };
    }
    
    // Check if activity is full
    const registered = activity.registeredParticipants || 0;
    if (activity.maxParticipants > 0 && registered >= activity.maxParticipants) {
      return { canRegister: false, reason: 'full' };
    }
    
    return { canRegister: true, reason: 'available' };
  };

  // Handle registration
  const handleRegister = async () => {
    if (!activity || !user) return;
    
    try {
      setIsRegistering(true);
      // TODO: Implement registration logic
      console.log('Registering for activity:', activity.id);
      // This would typically call a registration service
      // await registrationService.register(activity.id, user.uid);
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activity?.name,
          text: activity?.shortDescription,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle back navigation
  const handleBack = () => {
    window.location.hash = '#activities';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#110D16] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FCB283] mx-auto mb-4" />
          <p className={`${getClass('body')} text-white/60`}>
            {currentContent.loading}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !activity) {
    return (
      <div className="min-h-screen bg-[#110D16] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className={`text-2xl ${getClass('header')} text-white mb-4`}>
            {error || currentContent.notFound}
          </h1>
          <div className="space-y-3">
            <AnimatedButton
              variant="outline"
              size="medium"
              onClick={loadActivity}
            >
              {currentContent.tryAgain}
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              size="medium"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentContent.backToActivities}
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  const registrationStatus = getRegistrationStatus();
  const isFree = activity.tags.includes('free');

  return (
    <div className="min-h-screen bg-[#110D16] text-white pt-24">
      {/* Header - Positioned below main site header */}
      <div className="bg-gradient-to-b from-[#110D16] to-[#1A1625] py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <AnimatedButton
              variant="outline"
              size="medium"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentContent.backToActivities}
            </AnimatedButton>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="p-2 text-white/60 hover:text-[#FCB283] transition-colors"
                title={currentContent.share}
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-white/60 hover:text-[#FCB283] transition-colors print:hidden"
                title={currentContent.print}
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hero Image */}
            {activity.image && (
              <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden">
                <img
                  src={activity.image}
                  alt={activity.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Status badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {isFree && (
                    <span className="px-3 py-1 bg-green-500/90 text-white text-sm font-medium rounded-full">
                      {currentContent.free}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-[#FCB283]/90 text-white text-sm font-medium rounded-full">
                    {currentContent[activity.status as keyof typeof currentContent] || activity.status}
                  </span>
                </div>
              </div>
            )}

            {/* Title and Description */}
            <div>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl ${getClass('header')} text-white mb-4`}>
                {activity.name}
              </h1>
              <p className={`text-lg ${getClass('body')} text-white/80 mb-6`}>
                {activity.shortDescription}
              </p>
              
              {/* Tags */}
              {activity.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {activity.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 text-sm rounded-full border ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Full Description */}
            <div className="glass-container rounded-xl p-6 sm:p-8">
              <h2 className={`text-2xl ${getClass('header')} text-white mb-6 flex items-center`}>
                <Info className="w-6 h-6 text-[#FCB283] mr-3" />
                {currentContent.eventDetails}
              </h2>
              <div className="rich-text-editor">
                <div className="ql-container">
                  <div 
                    className={`ql-editor ${getClass('body')}`}
                    style={{
                      color: 'white',
                      padding: '16px',
                      minHeight: 'auto',
                      lineHeight: '1.7'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: activity.description
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Organizers */}
            {activity.organizers.length > 0 && (
              <div className="glass-container rounded-xl p-6 sm:p-8">
                <h3 className={`text-xl ${getClass('header')} text-white mb-4`}>
                  {currentContent.organizers}
                </h3>
                <div className="space-y-2">
                  {activity.organizers.map((organizer, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-[#FCB283]" />
                      <span className={`${getClass('body')} text-white/80`}>
                        {organizer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Registration Card */}
            <div className="glass-container rounded-xl p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-2">
                  {activity.maxParticipants === 0 
                    ? currentContent.unlimited 
                    : `${activity.registeredParticipants || 0}/${activity.maxParticipants}`
                  }
                </div>
                <div className={`text-sm ${getClass('body')} text-white/60`}>
                  {currentContent.participants}
                </div>
                
                {activity.maxParticipants > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#AA4626] to-[#FCB283] h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(((activity.registeredParticipants || 0) / activity.maxParticipants) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className={`text-xs ${getClass('menu')} text-white/60 mt-1`}>
                      {activity.maxParticipants - (activity.registeredParticipants || 0)} {currentContent.available}
                    </div>
                  </div>
                )}
              </div>

              {/* Registration Button - Show only if registration is needed */}
              {activity.needSubmission && (
                <div className="space-y-3">
                  {registrationStatus.canRegister ? (
                    <AnimatedButton
                      variant="primary"
                      size="large"
                      onClick={isRegistering ? undefined : handleRegister}
                      className={`w-full ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {currentContent.registering}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          {currentContent.register}
                        </>
                      )}
                    </AnimatedButton>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
                        <XCircle className="w-4 h-4" />
                        <span className={`text-sm ${getClass('body')}`}>
                          {registrationStatus.reason === 'login' && currentContent.loginRequired}
                          {registrationStatus.reason === 'closed' && currentContent.closed}
                          {registrationStatus.reason === 'full' && currentContent.full}
                          {registrationStatus.reason === 'past' && currentContent.closed}
                          {registrationStatus.reason === 'unpublished' && currentContent.closed}
                        </span>
                      </div>
                      {registrationStatus.reason === 'login' && (
                        <AnimatedButton
                          variant="outline"
                          size="medium"
                          onClick={() => window.location.hash = '#auth/signin'}
                          className="w-full"
                        >
                          Sign In
                        </AnimatedButton>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* No Registration Needed Message */}
              {!activity.needSubmission && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-green-400 mb-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className={`text-sm ${getClass('body')} font-medium`}>
                      {currentContent.noRegistrationNeeded}
                    </span>
                  </div>
                  <div className={`text-xs ${getClass('menu')} text-white/60`}>
                    {currentContent.freeEntry}
                  </div>
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="glass-container rounded-xl p-6 space-y-4">
              <h3 className={`text-lg ${getClass('header')} text-white mb-4`}>
                {currentContent.dateTime}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-[#FCB283] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className={`${getClass('body')} text-white font-medium`}>
                      {formatDate(activity.eventDate)}
                    </div>
                    <div className={`text-sm ${getClass('menu')} text-white/60`}>
                      {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-[#FCB283] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className={`${getClass('body')} text-white font-medium`}>
                      {activity.venueName}
                    </div>
                    {activity.venueLocation && (
                      <a
                        href={activity.venueLocation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm ${getClass('menu')} text-[#FCB283] hover:text-white transition-colors inline-flex items-center mt-1`}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {currentContent.viewLocation}
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-[#FCB283] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className={`${getClass('body')} text-white font-medium`}>
                      {currentContent.registrationDeadline}
                    </div>
                    <div className={`text-sm ${getClass('menu')} text-white/60`}>
                      {formatDate(activity.registrationDeadline)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="glass-container rounded-xl p-6">
              <h3 className={`text-lg ${getClass('header')} text-white mb-4`}>
                {currentContent.contact}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-[#FCB283]" />
                  <a
                    href={`mailto:${activity.contactEmail}`}
                    className={`${getClass('body')} text-white/80 hover:text-[#FCB283] transition-colors`}
                  >
                    {activity.contactEmail}
                  </a>
                </div>
                
                {activity.contactName && (
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-[#FCB283]" />
                    <span className={`${getClass('body')} text-white/80`}>
                      {activity.contactName}
                    </span>
                  </div>
                )}
                
                {activity.contactPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-[#FCB283]" />
                    <a
                      href={`tel:${activity.contactPhone}`}
                      className={`${getClass('body')} text-white/80 hover:text-[#FCB283] transition-colors`}
                    >
                      {activity.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailPage;
