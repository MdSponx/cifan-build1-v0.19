import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  Clock,
  Globe,
  EyeOff,
  MoreHorizontal,
  Copy
} from 'lucide-react';
import { Activity } from '../../types/activities';
import { useTypography } from '../../utils/typography';
import { getTagColor } from '../../utils/tagColors';

// Mock data for demonstration
const mockActivities: Activity[] = [
  {
    id: '1',
    name: 'Independent Film Workshop',
    shortDescription: 'เวิร์กช็อปการสร้างภาพยนตร์อิสระสำหรับผู้เริ่มต้น เรียนรู้เทคนิคการถ่ายทำและการตัดต่อ',
    image: '/api/placeholder/400/240',
    status: 'published',
    isPublic: true,
    needSubmission: true,
    isOneDayActivity: true,
    maxParticipants: 30,
    eventDate: '2025-03-15',
    startTime: '09:00',
    endTime: '17:00',
    registrationDeadline: '2025-03-10',
    venueName: 'Creative Hub Bangkok',
    venueLocation: 'https://maps.google.com/creative-hub',
    description: 'เวิร์กช็อปการสร้างภาพยนตร์อิสระสำหรับผู้เริ่มต้น เรียนรู้เทคนิคการถ่ายทำและการตัดต่อ รวมถึงการเล่าเรื่องผ่านภาพยนตร์',
    organizers: ['CIFAN Team', 'Creative Hub Bangkok'],
    tags: ['workshop', 'education'],
    contactEmail: 'workshop@cifanfest.com',
    contactName: 'Workshop Team',
    contactPhone: '+66-2-123-4567',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-22T14:30:00Z',
    createdBy: 'admin1',
    updatedBy: 'admin1',
    registeredParticipants: 15,
    waitlistCount: 0,
    views: 120
  },
  {
    id: '2',
    name: 'CIFAN Opening Ceremony',
    shortDescription: 'พิธีเปิดงานเทศกาลภาพยนตร์นานาชาติ CIFAN 2025 พร้อมการแสดงพิเศษและการประกาศรางวัล',
    image: '/api/placeholder/400/240',
    status: 'published',
    isPublic: true,
    needSubmission: true,
    isOneDayActivity: true,
    maxParticipants: 500,
    eventDate: '2025-03-10',
    startTime: '19:00',
    endTime: '22:00',
    registrationDeadline: '2025-03-05',
    venueName: 'Royal Paragon Hall',
    venueLocation: 'https://maps.google.com/royal-paragon',
    description: 'พิธีเปิดงานเทศกาลภาพยนตร์นานาชาติ CIFAN 2025 พร้อมการแสดงพิเศษและการประกาศรางวัล งานแสดงสุดพิเศษจากศิลปินชั้นนำ',
    organizers: ['CIFAN Organization', 'Royal Paragon Hall'],
    tags: ['ceremony', 'official'],
    contactEmail: 'ceremony@cifanfest.com',
    contactName: 'Ceremony Team',
    contactPhone: '+66-2-234-5678',
    createdAt: '2025-01-18T09:15:00Z',
    updatedAt: '2025-01-20T16:45:00Z',
    createdBy: 'admin1',
    updatedBy: 'admin1',
    registeredParticipants: 450,
    waitlistCount: 25,
    views: 890
  },
  {
    id: '3',
    name: 'Short Film Competition Panel',
    shortDescription: 'การอภิปรายกับผู้กำกับภาพยนตร์สั้นที่มีชื่อเสียง และการแบ่งปันประสบการณ์ในวงการภาพยนตร์',
    image: '/api/placeholder/400/240',
    status: 'draft',
    isPublic: false,
    needSubmission: false,
    isOneDayActivity: true,
    maxParticipants: 80,
    eventDate: '2025-03-16',
    startTime: '14:00',
    endTime: '16:00',
    registrationDeadline: '2025-03-12',
    venueName: 'Conference Room A',
    venueLocation: 'https://maps.google.com/conference-room-a',
    description: 'การอภิปรายกับผู้กำกับภาพยนตร์สั้นที่มีชื่อเสียง และการแบ่งปันประสบการณ์ในวงการภาพยนตร์ เรียนรู้เทคนิคการสร้างหนังสั้น',
    organizers: ['Film Panel Team'],
    tags: ['panel', 'short-film'],
    contactEmail: 'panel@cifanfest.com',
    contactName: 'Panel Team',
    contactPhone: '+66-2-345-6789',
    createdAt: '2025-01-25T11:20:00Z',
    updatedAt: '2025-01-25T11:20:00Z',
    createdBy: 'admin2',
    updatedBy: 'admin2',
    registeredParticipants: 0,
    waitlistCount: 0,
    views: 45
  },
  {
    id: '4',
    name: 'Documentary Screening Night',
    shortDescription: 'คืนฉายภาพยนตร์สารคดีพิเศษ พร้อมการสนทนากับผู้กำกับหลังการฉาย',
    image: '/api/placeholder/400/240',
    status: 'published',
    isPublic: true,
    needSubmission: true,
    isOneDayActivity: true,
    maxParticipants: 120,
    eventDate: '2025-03-18',
    startTime: '20:00',
    endTime: '23:00',
    registrationDeadline: '2025-03-15',
    venueName: 'Cinema Complex',
    venueLocation: 'https://maps.google.com/cinema-complex',
    description: 'คืนฉายภาพยนตร์สารคดีพิเศษ พร้อมการสนทนากับผู้กำกับหลังการฉาย ชมภาพยนตร์สารคดีคุณภาพสูงจากทั่วโลก',
    organizers: ['Cinema Complex', 'Documentary Team'],
    tags: ['screening', 'documentary'],
    contactEmail: 'screening@cifanfest.com',
    contactName: 'Screening Team',
    contactPhone: '+66-2-456-7890',
    createdAt: '2025-01-23T13:45:00Z',
    updatedAt: '2025-01-24T10:12:00Z',
    createdBy: 'admin1',
    updatedBy: 'admin1',
    registeredParticipants: 95,
    waitlistCount: 5,
    views: 234
  }
];

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
};

const statusLabels = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
  completed: 'Completed'
};

interface ActivitiesGalleryProps {
  activities?: Activity[];
  filter?: string | null;
  onNavigate?: (route: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function ActivitiesGallery({
  activities: propActivities,
  filter,
  onNavigate,
  onRefresh,
  isLoading = false
}: ActivitiesGalleryProps = {}) {
  const { getClass } = useTypography();
  const [activities, setActivities] = useState<Activity[]>(propActivities || mockActivities);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  // Update activities when prop changes
  React.useEffect(() => {
    if (propActivities) {
      setActivities(propActivities);
    }
  }, [propActivities]);

  // Filter and sort activities
  const filteredActivities = activities
    .filter(activity => {
      const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          activity.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        default:
          return 0;
      }
    });

  const handleSelectActivity = (activityId: string) => {
    const newSelected = new Set(selectedActivities);
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId);
    } else {
      newSelected.add(activityId);
    }
    setSelectedActivities(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedActivities.size === filteredActivities.length) {
      setSelectedActivities(new Set());
    } else {
      setSelectedActivities(new Set(filteredActivities.map(a => a.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const handleViewActivity = (activityId: string) => {
    // Navigate to public activity detail page
    window.location.hash = `#activity/${activityId}`;
  };

  const handleEditActivity = (activityId: string) => {
    console.log('Edit activity:', activityId);
    onNavigate?.(`admin/activities/edit/${activityId}`);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      setActivities(prev => prev.filter(a => a.id !== activityId));
      setSelectedActivities(prev => {
        const newSet = new Set(prev);
        newSet.delete(activityId);
        return newSet;
      });
    }
  };

  const handleDuplicateActivity = (activityId: string) => {
    const originalActivity = activities.find(a => a.id === activityId);
    if (originalActivity) {
      const duplicatedActivity = {
        ...originalActivity,
        id: Date.now().toString(),
        name: `${originalActivity.name} (Copy)`,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setActivities(prev => [duplicatedActivity, ...prev]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedActivities.size > 0 && confirm(`Delete ${selectedActivities.size} selected activities?`)) {
      setActivities(prev => prev.filter(a => !selectedActivities.has(a.id)));
      setSelectedActivities(new Set());
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold text-white mb-2 ${getClass('header')}`}>Activities & Events</h1>
          <p className={`text-white/70 ${getClass('subtitle')}`}>จัดการกิจกรรมและอีเว้นต์ทั้งหมดของเทศกาลภาพยนตร์</p>
        </div>
        
        <div className="mt-4 lg:mt-0">
          <button
            onClick={() => onNavigate?.('admin/activities/create')}
            className="px-6 py-3 bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white rounded-lg hover:from-[#AA4626]/90 hover:to-[#FCB283]/90 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create New Activity
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-container rounded-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-white/20 bg-white/10 text-white placeholder-white/60 rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all backdrop-blur-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all appearance-none backdrop-blur-sm"
            >
              <option value="all" className="bg-gray-800 text-white">All Status</option>
              <option value="draft" className="bg-gray-800 text-white">Draft</option>
              <option value="published" className="bg-gray-800 text-white">Published</option>
              <option value="cancelled" className="bg-gray-800 text-white">Cancelled</option>
              <option value="completed" className="bg-gray-800 text-white">Completed</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all appearance-none backdrop-blur-sm"
            >
              <option value="newest" className="bg-gray-800 text-white">Newest First</option>
              <option value="oldest" className="bg-gray-800 text-white">Oldest First</option>
              <option value="name" className="bg-gray-800 text-white">Name A-Z</option>
              <option value="date" className="bg-gray-800 text-white">Event Date</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedActivities.size > 0 && (
          <div className="mt-4 p-3 bg-[#FCB283]/20 border border-[#FCB283]/30 rounded-lg flex items-center justify-between">
            <span className={`text-sm text-[#FCB283] font-medium ${getClass('body')}`}>
              {selectedActivities.size} activities selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedActivities(new Set())}
                className="px-3 py-1.5 bg-white/20 text-white text-sm rounded hover:bg-white/30 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-container rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{activities.length}</div>
          <div className="text-sm text-white/70">Total Activities</div>
        </div>
        <div className="glass-container rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {activities.filter(a => a.status === 'published').length}
          </div>
          <div className="text-sm text-white/70">Published</div>
        </div>
        <div className="glass-container rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {activities.filter(a => a.status === 'draft').length}
          </div>
          <div className="text-sm text-white/70">Drafts</div>
        </div>
        <div className="glass-container rounded-lg p-4">
          <div className="text-2xl font-bold text-[#FCB283]">
            {activities.filter(a => a.isPublic).length}
          </div>
          <div className="text-sm text-white/70">Public</div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="space-y-6">
        {/* Select All */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedActivities.size === filteredActivities.length && filteredActivities.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 text-[#FCB283] border-white/30 bg-white/10 rounded focus:ring-[#FCB283]"
          />
          <span className={`text-sm text-white/80 ${getClass('body')}`}>
            Select All ({filteredActivities.length} activities)
          </span>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="glass-container rounded-xl p-12 text-center">
            <div className="text-white/40 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No activities found</h3>
            <p className="text-white/70 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first activity to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button 
                onClick={() => onNavigate?.('admin/activities/create')}
                className="px-6 py-3 bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white rounded-lg hover:from-[#AA4626]/90 hover:to-[#FCB283]/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Create First Activity
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="glass-container rounded-xl overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-[#FCB283]/50">
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedActivities.has(activity.id)}
                    onChange={() => handleSelectActivity(activity.id)}
                    className="w-4 h-4 text-[#FCB283] border-white/30 bg-white/10 rounded focus:ring-[#FCB283]"
                  />
                </div>

                {/* Activity Image */}
                <div className="relative h-32 bg-gradient-to-br from-gray-200 to-gray-300">
                  <img
                    src={activity.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgOTBMMTg1IDEwNUwyMDUgODVMMjI1IDExMEgyNTVWMTMwSDEyNVYxMTBMMTQwIDk1TDE3NSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgOTBMMTg1IDEwNUwyMDUgODVMMjI1IDExMEgyNTVWMTMwSDEyNVYxMTBMMTQwIDk1TDE3NSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                    }}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[activity.status]}`}>
                      {statusLabels[activity.status]}
                    </span>
                  </div>

                  {/* Public/Private Badge */}
                  <div className="absolute bottom-3 right-3">
                    {activity.isPublic ? (
                      <div className="bg-white bg-opacity-90 rounded-full p-1">
                        <Globe className="w-3 h-3 text-[#FCB283]" />
                      </div>
                    ) : (
                      <div className="bg-white bg-opacity-90 rounded-full p-1">
                        <EyeOff className="w-3 h-3 text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Content */}
                <div className="p-4">
                  <h3 className={`text-sm font-semibold text-white mb-2 line-clamp-2 leading-tight ${getClass('header')}`}>
                    {activity.name}
                  </h3>
                  
                  <p className={`text-xs text-white/70 mb-3 line-clamp-2 ${getClass('body')}`}>
                    {activity.shortDescription.length > 120 
                      ? `${activity.shortDescription.substring(0, 120)}...`
                      : activity.shortDescription
                    }
                  </p>

                  {/* Activity Details */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <Calendar className="w-3 h-3 text-[#FCB283]" />
                      <span>{formatDate(activity.eventDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <Clock className="w-3 h-3 text-[#FCB283]" />
                      <span>{formatTime(activity.startTime)} - {formatTime(activity.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <MapPin className="w-3 h-3 text-[#FCB283]" />
                      <span className="line-clamp-1">{activity.venueName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <Users className="w-3 h-3 text-[#FCB283]" />
                      <span>
                        {activity.maxParticipants === 0 ? 'Unlimited' : `${activity.registeredParticipants || 0}/${activity.maxParticipants}`}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {activity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {activity.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-0.5 text-xs rounded-full border ${getTagColor(tag)} ${getClass('body')}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/20">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewActivity(activity.id)}
                        className="p-1.5 text-white/60 hover:text-[#FCB283] hover:bg-[#FCB283]/20 rounded-lg transition-colors"
                        title="View Public"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleEditActivity(activity.id)}
                        className="p-1.5 text-white/60 hover:text-green-400 hover:bg-green-400/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleDuplicateActivity(activity.id)}
                        className="p-1.5 text-white/60 hover:text-purple-400 hover:bg-purple-400/20 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="p-1.5 text-white/60 hover:text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination could be added here if needed */}
    </div>
  );
}
