import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { Activity, ActivityFilters } from '../../types/activities';
import { activitiesService } from '../../services/activitiesService';
import { getTagColor } from '../../utils/tagColors';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Grid,
  List,
  ArrowLeft,
  ExternalLink,
  Eye,
  Edit,
  Copy
} from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';

const PublicActivitiesPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  // State management
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'popularity'>('date');

  // Content translations
  const content = {
    th: {
      title: 'กิจกรรมและอีเวนต์',
      subtitle: 'เข้าร่วมกิจกรรมและเวิร์กช็อปที่น่าสนใจจากเทศกาลภาพยนตร์',
      backToHome: 'กลับหน้าหลัก',
      searchPlaceholder: 'ค้นหากิจกรรม...',
      filterByTags: 'กรองตามแท็ก',
      sortBy: 'เรียงตาม',
      sortByDate: 'วันที่',
      sortByName: 'ชื่อ',
      sortByPopularity: 'ความนิยม',
      viewMode: 'รูปแบบการแสดง',
      gridView: 'ตาราง',
      listView: 'รายการ',
      allTags: 'ทั้งหมด',
      workshop: 'เวิร์กช็อป',
      screening: 'การฉาย',
      ceremony: 'พิธีการ',
      panel: 'แผงอภิปราย',
      masterclass: 'คลาสพิเศษ',
      networking: 'เครือข่าย',
      participants: 'ผู้เข้าร่วม',
      unlimited: 'ไม่จำกัด',
      available: 'ที่ว่าง',
      full: 'เต็มแล้ว',
      upcoming: 'กำลังจะมาถึง',
      free: 'ฟรี',
      paid: 'เสียค่าใช้จ่าย',
      learnMore: 'เรียนรู้เพิ่มเติม',
      register: 'ลงทะเบียน',
      loading: 'กำลังโหลดกิจกรรม...',
      error: 'ไม่สามารถโหลดกิจกรรมได้',
      noActivities: 'ไม่พบกิจกรรมที่ตรงกับเงื่อนไข',
      noActivitiesDesc: 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง',
      tryAgain: 'ลองใหม่อีกครั้ง',
      clearFilters: 'ล้างตัวกรอง',
      showingResults: 'แสดง',
      of: 'จาก',
      results: 'ผลลัพธ์'
    },
    en: {
      title: 'Activities & Events',
      subtitle: 'Join exciting activities and workshops from the film festival',
      backToHome: 'Back to Home',
      searchPlaceholder: 'Search activities...',
      filterByTags: 'Filter by tags',
      sortBy: 'Sort by',
      sortByDate: 'Date',
      sortByName: 'Name',
      sortByPopularity: 'Popularity',
      viewMode: 'View mode',
      gridView: 'Grid',
      listView: 'List',
      allTags: 'All',
      workshop: 'Workshop',
      screening: 'Screening',
      ceremony: 'Ceremony',
      panel: 'Panel',
      masterclass: 'Masterclass',
      networking: 'Networking',
      participants: 'participants',
      unlimited: 'Unlimited',
      available: 'available',
      full: 'Full',
      upcoming: 'Upcoming',
      free: 'Free',
      paid: 'Paid',
      learnMore: 'Learn More',
      register: 'Register',
      loading: 'Loading activities...',
      error: 'Unable to load activities',
      noActivities: 'No activities found',
      noActivitiesDesc: 'Try adjusting your search or filters',
      tryAgain: 'Try Again',
      clearFilters: 'Clear Filters',
      showingResults: 'Showing',
      of: 'of',
      results: 'results'
    }
  };

  const currentContent = content[currentLanguage];

  // Available filter tags
  const availableTags = [
    { id: 'workshop', label: currentContent.workshop },
    { id: 'screening', label: currentContent.screening },
    { id: 'ceremony', label: currentContent.ceremony },
    { id: 'panel', label: currentContent.panel },
    { id: 'masterclass', label: currentContent.masterclass },
    { id: 'networking', label: currentContent.networking }
  ];

  // Load activities on component mount
  useEffect(() => {
    loadActivities();
  }, []);

  // Filter and sort activities when dependencies change
  useEffect(() => {
    filterAndSortActivities();
  }, [activities, searchTerm, selectedTags, sortBy]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get public activities with filters
      const filters: ActivityFilters = {
        status: 'published',
        isPublic: true
      };
      
      const response = await activitiesService.getActivities(filters, undefined, 1, 100);
      setActivities(response.activities);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(currentContent.error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortActivities = () => {
    let filtered = [...activities];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(searchLower) ||
        activity.shortDescription.toLowerCase().includes(searchLower) ||
        activity.description.toLowerCase().includes(searchLower) ||
        activity.venueName.toLowerCase().includes(searchLower) ||
        activity.organizers.some(org => org.toLowerCase().includes(searchLower))
      );
    }

    // Apply tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(activity =>
        selectedTags.some(tag => activity.tags.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          return (b.views || 0) - (a.views || 0);
        case 'date':
        default:
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      }
    });

    setFilteredActivities(filtered);
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

  // Handle tag toggle
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  // Handle clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };

  // Handle activity click
  const handleActivityClick = (activityId: string) => {
    window.location.hash = `#activity/${activityId}`;
  };

  // Handle back to home
  const handleBackToHome = () => {
    window.location.hash = '#home';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#110D16] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#FCB283] mx-auto mb-4" />
            <p className={`${getClass('body')} text-white/60`}>
              {currentContent.loading}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#110D16] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className={`text-2xl ${getClass('header')} text-white mb-4`}>
              {error}
            </h1>
            <div className="space-y-3">
              <AnimatedButton
                variant="outline"
                size="medium"
                onClick={loadActivities}
              >
                {currentContent.tryAgain}
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                size="medium"
                onClick={handleBackToHome}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentContent.backToHome}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110D16] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#110D16] to-[#1A1625] py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <AnimatedButton
              variant="outline"
              size="medium"
              onClick={handleBackToHome}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentContent.backToHome}
            </AnimatedButton>
          </div>
          
          <div className="text-center max-w-3xl mx-auto">
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl ${getClass('header')} text-white mb-6`}>
              {currentContent.title}
            </h1>
            <p className={`text-lg sm:text-xl ${getClass('body')} text-white/80`}>
              {currentContent.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-container rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder={currentContent.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'popularity')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none transition-colors appearance-none"
              >
                <option value="date" className="bg-[#110D16]">{currentContent.sortByDate}</option>
                <option value="name" className="bg-[#110D16]">{currentContent.sortByName}</option>
                <option value="popularity" className="bg-[#110D16]">{currentContent.sortByPopularity}</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-[#FCB283] text-white' 
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
                title={currentContent.gridView}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-[#FCB283] text-white' 
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
                title={currentContent.listView}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tag Filters */}
          <div className="mt-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTags([])}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedTags.length === 0
                    ? 'bg-[#FCB283] text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {currentContent.allTags}
              </button>
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-[#FCB283] text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-6 flex items-center justify-between">
            <div className={`text-sm ${getClass('body')} text-white/60`}>
              {currentContent.showingResults} {filteredActivities.length} {currentContent.of} {activities.length} {currentContent.results}
            </div>
            {(searchTerm || selectedTags.length > 0) && (
              <AnimatedButton
                variant="outline"
                size="small"
                onClick={clearFilters}
              >
                {currentContent.clearFilters}
              </AnimatedButton>
            )}
          </div>
        </div>

        {/* Activities Display */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className={`text-xl ${getClass('header')} text-white mb-2`}>
              {currentContent.noActivities}
            </h3>
            <p className={`${getClass('body')} text-white/60 mb-6`}>
              {currentContent.noActivitiesDesc}
            </p>
            {(searchTerm || selectedTags.length > 0) && (
              <AnimatedButton
                variant="primary"
                size="medium"
                onClick={clearFilters}
              >
                {currentContent.clearFilters}
              </AnimatedButton>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-6'
          }>
            {filteredActivities.map((activity, index) => {
              const availability = getAvailabilityInfo(activity);
              const isFree = activity.tags.includes('free');
              
              return (
                <div
                  key={activity.id}
                  className={`group cursor-pointer ${
                    viewMode === 'list' ? 'flex gap-6' : ''
                  }`}
                  onClick={() => handleActivityClick(activity.id)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`glass-container rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-white/10 hover:border-[#FCB283]/30 ${
                    viewMode === 'list' ? 'flex-1 flex' : ''
                  }`}>
                    
                    {/* Activity Image */}
                    <div className={`relative overflow-hidden ${
                      viewMode === 'list' ? 'w-64 flex-shrink-0' : 'h-48'
                    }`}>
                      <img
                        src={activity.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgOTBMMTg1IDEwNUwyMDUgODVMMjI1IDExMEgyNTVWMTMwSDEyNVYxMTBMMTQwIDk1TDE3NSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                        alt={activity.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                    <div className="p-6 flex-1">
                      <h3 className={`text-xl ${getClass('header')} text-white mb-3 line-clamp-2 group-hover:text-[#FCB283] transition-colors`}>
                        {activity.name}
                      </h3>
                      
                      <p className={`${getClass('body')} text-white/70 mb-4 ${viewMode === 'list' ? 'line-clamp-3' : 'line-clamp-2'}`}>
                        {activity.shortDescription.length > 120 
                          ? `${activity.shortDescription.substring(0, 120)}...`
                          : activity.shortDescription
                        }
                      </p>

                      {/* Activity Details */}
                      <div className="space-y-2 mb-4">
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
                        <div className="flex flex-wrap gap-1 mb-4">
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
        )}
      </div>
    </div>
  );
};

export default PublicActivitiesPage;
