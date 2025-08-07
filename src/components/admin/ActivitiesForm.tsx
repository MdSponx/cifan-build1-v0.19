import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { 
  Activity, 
  ActivityFormData, 
  ActivityValidationErrors,
  DEFAULT_ACTIVITY_TAGS,
  ACTIVITY_STATUS_OPTIONS,
  ACTIVITY_VALIDATION_RULES
} from '../../types/activities';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Image as ImageIcon, 
  Clock, 
  Mail, 
  Phone, 
  User, 
  Save,
  Plus,
  X,
  Globe,
  Eye,
  EyeOff,
  FileText,
  Tag,
  Upload,
  Trash2
} from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';
import ErrorMessage from '../forms/ErrorMessage';
import RichTextEditor from '../ui/RichTextEditor';

interface ActivitiesFormProps {
  activity?: Activity | null;
  onSubmit: (formData: ActivityFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  errors?: ActivityValidationErrors;
}

const ActivitiesForm: React.FC<ActivitiesFormProps> = ({
  activity,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
  errors: externalErrors = {}
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user } = useAuth();
  const currentLanguage = i18n.language as 'en' | 'th';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<ActivityFormData>({
    image: null,
    name: '',
    shortDescription: '',
    status: 'draft',
    isPublic: true,
    needSubmission: false,
    maxParticipants: 0,
    isOneDayActivity: true,
    eventDate: '',
    eventEndDate: '',
    startTime: '',
    endTime: '',
    registrationDeadline: '',
    venueName: '',
    venueLocation: '',
    description: '',
    organizers: [],
    tags: [],
    contactEmail: 'contact@cifanfest.com',
    contactName: '',
    contactPhone: ''
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newOrganizer, setNewOrganizer] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [internalErrors, setInternalErrors] = useState<ActivityValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine external and internal errors
  const errors = { ...internalErrors, ...externalErrors };

  // Content translations
  const content = {
    th: {
      // Form titles
      createTitle: 'สร้างกิจกรรมใหม่',
      editTitle: 'แก้ไขกิจกรรม',
      createSubtitle: 'เพิ่มกิจกรรมและอีเวนต์ใหม่สำหรับเทศกาล',
      editSubtitle: 'แก้ไขข้อมูลกิจกรรมและอีเวนต์',

      // Section titles
      overviewSection: 'ภาพรวม',
      dateVenueSection: 'วันที่และสถานที่',
      detailSection: 'รายละเอียด',
      tagsSection: 'แท็ก',
      contactSection: 'ติดต่อ',

      // Overview fields
      activityImage: 'รูปภาพกิจกรรม',
      activityName: 'ชื่อกิจกรรม',
      shortDescription: 'คำบรรยายสั้น',
      status: 'สถานะ',
      publicActivity: 'กิจกรรมสาธารณะ',
      needSubmission: 'ต้องลงทะเบียน',
      maxParticipants: 'จำนวนผู้เข้าร่วมสูงสุด',
      unlimited: 'ไม่จำกัด',

      // Date and venue fields
      oneDayActivity: 'จำนวนวันจัดกิจกรรม',
      eventDate: 'วันจัดงาน',
      eventEndDate: 'วันสิ้นสุดงาน',
      startTime: 'เวลาเริ่ม',
      endTime: 'เวลาสิ้นสุด',
      registrationDeadline: 'วันหมดเขตรับสมัคร',
      venueName: 'ชื่อสถานที่',
      venueLocation: 'พิกัดสถานที่ (Google Maps)',

      // Detail fields
      description: 'รายละเอียดงาน',
      organizers: 'ผู้จัดงาน',
      addOrganizer: 'เพิ่มผู้จัด',

      // Tags
      predefinedTags: 'แท็กที่กำหนดไว้',
      customTags: 'แท็กกำหนดเอง',
      addCustomTag: 'เพิ่มแท็กใหม่',

      // Contact fields
      contactEmail: 'อีเมลติดต่อ',
      contactName: 'ชื่อผู้ติดต่อ',
      contactPhone: 'เบอร์โทรศัพท์',

      // Actions
      save: 'บันทึก',
      saving: 'กำลังบันทึก...',
      cancel: 'ยกเลิก',
      uploadImage: 'อัปโหลดรูปภาพ',
      removeImage: 'ลบรูปภาพ',
      dragDropImage: 'ลากและวางรูปภาพที่นี่',
      supportedFormats: 'รองรับ JPG, PNG, WebP (สูงสุด 5MB)',

      // Placeholders
      activityNamePlaceholder: 'กรอกชื่อกิจกรรม',
      shortDescPlaceholder: 'คำบรรยายสั้นๆ เกี่ยวกับกิจกรรม',
      descriptionPlaceholder: 'รายละเอียดเต็มของกิจกรรม...',
      venueNamePlaceholder: 'ชื่อสถานที่จัดงาน',
      venueLocationPlaceholder: 'https://maps.google.com/...',
      organizerPlaceholder: 'ชื่อผู้จัดงาน',
      customTagPlaceholder: 'แท็กใหม่',
      contactNamePlaceholder: 'ชื่อผู้ติดต่อ',
      contactPhonePlaceholder: '+66 XX-XXX-XXXX',

      // Status options
      statusDraft: 'ร่าง',
      statusPublished: 'เผยแพร่แล้ว',
      statusCancelled: 'ยกเลิก',
      statusCompleted: 'เสร็จสิ้น',

      // Validation messages
      characterCount: 'ตัวอักษร',
      charactersRemaining: 'เหลือ',
      required: 'จำเป็นต้องกรอก',
      invalidEmail: 'รูปแบบอีเมลไม่ถูกต้อง',
      invalidPhone: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
      invalidUrl: 'รูปแบบ URL ไม่ถูกต้อง',
      fileTooLarge: 'ไฟล์ใหญ่เกินไป (สูงสุด 5MB)',
      invalidFileType: 'ประเภทไฟล์ไม่ถูกต้อง'
    },
    en: {
      // Form titles
      createTitle: 'Create New Activity',
      editTitle: 'Edit Activity',
      createSubtitle: 'Add a new activity or event for the festival',
      editSubtitle: 'Update activity and event information',

      // Section titles
      overviewSection: 'Overview',
      dateVenueSection: 'Date & Venue',
      detailSection: 'Details',
      tagsSection: 'Tags',
      contactSection: 'Contact',

      // Overview fields
      activityImage: 'Activity Image',
      activityName: 'Activity Name',
      shortDescription: 'Short Description',
      status: 'Status',
      publicActivity: 'Public Activity',
      needSubmission: 'Need Submission',
      maxParticipants: 'Max Participants',
      unlimited: 'Unlimited',

      // Date and venue fields
      oneDayActivity: 'Activity Days',
      eventDate: 'Event Date',
      eventEndDate: 'Event End Date',
      startTime: 'Start Time',
      endTime: 'End Time',
      registrationDeadline: 'Registration Deadline',
      venueName: 'Venue Name',
      venueLocation: 'Venue Location (Google Maps)',

      // Detail fields
      description: 'Description',
      organizers: 'Organizers',
      addOrganizer: 'Add Organizer',

      // Tags
      predefinedTags: 'Predefined Tags',
      customTags: 'Custom Tags',
      addCustomTag: 'Add Custom Tag',

      // Contact fields
      contactEmail: 'Contact Email',
      contactName: 'Contact Name',
      contactPhone: 'Contact Phone',

      // Actions
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      uploadImage: 'Upload Image',
      removeImage: 'Remove Image',
      dragDropImage: 'Drag & drop image here',
      supportedFormats: 'Supports JPG, PNG, WebP (max 5MB)',

      // Placeholders
      activityNamePlaceholder: 'Enter activity name',
      shortDescPlaceholder: 'Brief description of the activity',
      descriptionPlaceholder: 'Full description of the activity...',
      venueNamePlaceholder: 'Venue name',
      venueLocationPlaceholder: 'https://maps.google.com/...',
      organizerPlaceholder: 'Organizer name',
      customTagPlaceholder: 'New tag',
      contactNamePlaceholder: 'Contact person name',
      contactPhonePlaceholder: '+66 XX-XXX-XXXX',

      // Status options
      statusDraft: 'Draft',
      statusPublished: 'Published',
      statusCancelled: 'Cancelled',
      statusCompleted: 'Completed',

      // Validation messages
      characterCount: 'characters',
      charactersRemaining: 'remaining',
      required: 'This field is required',
      invalidEmail: 'Invalid email format',
      invalidPhone: 'Invalid phone format',
      invalidUrl: 'Invalid URL format',
      fileTooLarge: 'File too large (max 5MB)',
      invalidFileType: 'Invalid file type'
    }
  };

  const currentContent = content[currentLanguage];

  // Initialize form data when activity prop changes
  useEffect(() => {
    if (activity && mode === 'edit') {
      setFormData({
        image: null, // File object not available from existing activity
        name: activity.name,
        shortDescription: activity.shortDescription,
        status: activity.status,
        isPublic: activity.isPublic,
        needSubmission: activity.needSubmission,
        maxParticipants: activity.maxParticipants,
        isOneDayActivity: activity.isOneDayActivity,
        eventDate: activity.eventDate,
        eventEndDate: activity.eventEndDate || '',
        startTime: activity.startTime,
        endTime: activity.endTime,
        registrationDeadline: activity.registrationDeadline,
        venueName: activity.venueName,
        venueLocation: activity.venueLocation || '',
        description: activity.description,
        organizers: [...activity.organizers],
        tags: [...activity.tags],
        contactEmail: activity.contactEmail,
        contactName: activity.contactName,
        contactPhone: activity.contactPhone
      });
      
      // Set image preview if activity has an image
      if (activity.image) {
        setImagePreview(activity.image);
      }
    }
  }, [activity, mode]);

  // Form validation
  const validateForm = (): ActivityValidationErrors => {
    const newErrors: ActivityValidationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = currentContent.required;
    } else if (formData.name.length < ACTIVITY_VALIDATION_RULES.name.minLength) {
      newErrors.name = `Minimum ${ACTIVITY_VALIDATION_RULES.name.minLength} characters required`;
    }

    // Short description validation
    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = currentContent.required;
    } else if (formData.shortDescription.length < ACTIVITY_VALIDATION_RULES.shortDescription.minLength) {
      newErrors.shortDescription = `Minimum ${ACTIVITY_VALIDATION_RULES.shortDescription.minLength} characters required`;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = currentContent.required;
    } else if (formData.description.length < ACTIVITY_VALIDATION_RULES.description.minLength) {
      newErrors.description = `Minimum ${ACTIVITY_VALIDATION_RULES.description.minLength} characters required`;
    }

    // Date validation
    if (!formData.eventDate) {
      newErrors.eventDate = currentContent.required;
    }

    // End date validation for multi-day activities
    if (!formData.isOneDayActivity) {
      if (!formData.eventEndDate) {
        newErrors.eventEndDate = currentContent.required;
      } else if (formData.eventDate && formData.eventEndDate < formData.eventDate) {
        newErrors.eventEndDate = currentLanguage === 'th' ? 'วันสิ้นสุดต้องมาหลังวันเริ่มต้น' : 'End date must be after start date';
      }
    }

    if (!formData.registrationDeadline) {
      newErrors.registrationDeadline = currentContent.required;
    }

    // Time validation
    if (!formData.startTime) {
      newErrors.startTime = currentContent.required;
    }

    if (!formData.endTime) {
      newErrors.endTime = currentContent.required;
    }

    // Venue validation
    if (!formData.venueName.trim()) {
      newErrors.venueName = currentContent.required;
    }

    // Contact validation
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = currentContent.required;
    } else if (!ACTIVITY_VALIDATION_RULES.contactEmail.pattern.test(formData.contactEmail)) {
      newErrors.contactEmail = currentContent.invalidEmail;
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = currentContent.required;
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = currentContent.required;
    }

    // Organizers validation
    if (formData.organizers.length === 0) {
      newErrors.organizers = currentContent.required;
    }

    // Max participants validation
    if (formData.maxParticipants < 0) {
      newErrors.maxParticipants = 'Must be 0 or greater';
    }

    return newErrors;
  };

  // Handle input changes
  const handleInputChange = (field: keyof ActivityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setInternalErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = ACTIVITY_VALIDATION_RULES.image.maxSize;
    const allowedTypes = ACTIVITY_VALIDATION_RULES.image.allowedTypes;

    if (file.size > maxSize) {
      setInternalErrors(prev => ({ ...prev, image: currentContent.fileTooLarge }));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setInternalErrors(prev => ({ ...prev, image: currentContent.invalidFileType }));
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    setInternalErrors(prev => ({ ...prev, image: undefined }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
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
      const file = files[0];
      // Simulate file input change
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleImageUpload(fakeEvent);
    }
  };

  // Remove image
  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add organizer
  const addOrganizer = () => {
    if (newOrganizer.trim() && !formData.organizers.includes(newOrganizer.trim())) {
      setFormData(prev => ({
        ...prev,
        organizers: [...prev.organizers, newOrganizer.trim()]
      }));
      setNewOrganizer('');
    }
  };

  // Remove organizer
  const removeOrganizer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      organizers: prev.organizers.filter((_, i) => i !== index)
    }));
  };

  // Toggle predefined tag
  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) 
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  // Add custom tag
  const addCustomTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag.trim()]
      }));
      setCustomTag('');
    }
  };

  // Remove custom tag
  const removeCustomTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setInternalErrors(validationErrors);
      // Scroll to first error
      const firstErrorElement = document.querySelector('.error-field');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusOption = ACTIVITY_STATUS_OPTIONS.find(opt => opt.value === status);
    const colors = {
      gray: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
      green: 'text-green-400 bg-green-500/20 border-green-500/30',
      red: 'text-red-400 bg-red-500/20 border-red-500/30',
      blue: 'text-blue-400 bg-blue-500/20 border-blue-500/30'
    };
    return colors[statusOption?.color as keyof typeof colors] || colors.gray;
  };

  // Get custom tags (tags not in predefined list)
  const customTags = formData.tags.filter(tag => 
    !DEFAULT_ACTIVITY_TAGS.find(predefined => predefined.id === tag)
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="glass-container rounded-xl p-6 sm:p-8">
        <div className="text-center">
          <h1 className={`text-2xl sm:text-3xl ${getClass('header')} text-white mb-2`}>
            {mode === 'create' ? currentContent.createTitle : currentContent.editTitle}
          </h1>
          <p className={`${getClass('body')} text-white/80`}>
            {mode === 'create' ? currentContent.createSubtitle : currentContent.editSubtitle}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        
        {/* Section 1: Overview */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.overviewSection}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-3`}>
                <ImageIcon className="w-4 h-4 inline mr-2" />
                {currentContent.activityImage}
              </label>
              
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                  errors.image 
                    ? 'border-red-400 bg-red-500/10' 
                    : 'border-white/30 hover:border-[#FCB283]/50 hover:bg-white/5'
                }`}
              >
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-48 mx-auto rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className={`text-white/80 ${getClass('body')} mb-2`}>
                      {currentContent.dragDropImage}
                    </p>
                    <p className={`text-white/60 text-sm ${getClass('menu')}`}>
                      {currentContent.supportedFormats}
                    </p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <ErrorMessage error={errors.image} />
            </div>

            {/* Activity Name and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.activityName} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${errors.name ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
                  placeholder={currentContent.activityNamePlaceholder}
                />
                <ErrorMessage error={errors.name} />
              </div>

              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.status} <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                >
                  {ACTIVITY_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value} className="bg-[#110D16]">
                      {currentContent[`status${option.value.charAt(0).toUpperCase() + option.value.slice(1)}` as keyof typeof currentContent]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.shortDescription} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                maxLength={ACTIVITY_VALIDATION_RULES.shortDescription.maxLength}
                rows={3}
                className={`w-full p-3 rounded-lg bg-white/10 border ${errors.shortDescription ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors resize-none`}
                placeholder={currentContent.shortDescPlaceholder}
              />
              <div className="flex justify-between items-center mt-1">
                <ErrorMessage error={errors.shortDescription} />
                <span className={`text-xs ${getClass('menu')} text-white/60`}>
                  {formData.shortDescription.length}/{ACTIVITY_VALIDATION_RULES.shortDescription.maxLength} {currentContent.characterCount}
                </span>
              </div>
            </div>

            {/* Public Activity, Need Submission, and Max Participants */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-3`}>
                  {currentContent.publicActivity}
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('isPublic', !formData.isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      formData.isPublic ? 'bg-[#FCB283]' : 'bg-white/20'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      formData.isPublic ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                  <div className="flex items-center space-x-2">
                    {formData.isPublic ? (
                      <>
                        <Eye className="w-4 h-4 text-green-400" />
                        <span className={`text-green-400 ${getClass('body')} text-sm`}>
                          {currentLanguage === 'th' ? 'เปิดให้สาธารณะ' : 'Public'}
                        </span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 text-gray-400" />
                        <span className={`text-gray-400 ${getClass('body')} text-sm`}>
                          {currentLanguage === 'th' ? 'ส่วนตัว' : 'Private'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-3`}>
                  {currentContent.needSubmission}
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('needSubmission', !formData.needSubmission)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      formData.needSubmission ? 'bg-[#FCB283]' : 'bg-white/20'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      formData.needSubmission ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                  <div className="flex items-center space-x-2">
                    {formData.needSubmission ? (
                      <>
                        <User className="w-4 h-4 text-blue-400" />
                        <span className={`text-blue-400 ${getClass('body')} text-sm`}>
                          {currentLanguage === 'th' ? 'ต้องลงทะเบียน' : 'Registration Required'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className={`text-gray-400 ${getClass('body')} text-sm`}>
                          {currentLanguage === 'th' ? 'ไม่ต้องลงทะเบียน' : 'No Registration'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  <Users className="w-4 h-4 inline mr-2" />
                  {currentContent.maxParticipants}
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 0)}
                  min="0"
                  max={ACTIVITY_VALIDATION_RULES.maxParticipants.max}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${errors.maxParticipants ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
                  placeholder={`0 = ${currentContent.unlimited}`}
                />
                <ErrorMessage error={errors.maxParticipants} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Date and Venue */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.dateVenueSection}
            </h2>
          </div>

          <div className="space-y-6">
            {/* One Day Activity Checkbox */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-3`}>
                {currentContent.oneDayActivity}
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('isOneDayActivity', !formData.isOneDayActivity)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    formData.isOneDayActivity ? 'bg-[#FCB283]' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    formData.isOneDayActivity ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
                <div className="flex items-center space-x-2">
                  {formData.isOneDayActivity ? (
                    <>
                      <Calendar className="w-4 h-4 text-green-400" />
                      <span className={`text-green-400 ${getClass('body')} text-sm`}>
                        {currentLanguage === 'th' ? 'กิจกรรมหนึ่งวัน' : 'Single Day Event'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className={`text-blue-400 ${getClass('body')} text-sm`}>
                        {currentLanguage === 'th' ? 'กิจกรรมหลายวัน' : 'Multi-Day Event'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Date (Start Date) */}
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {formData.isOneDayActivity ? currentContent.eventDate : (currentLanguage === 'th' ? 'วันเริ่มงาน' : 'Start Date')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange('eventDate', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${errors.eventDate ? 'border-red-400 error-field' : 'border-white/20'} text-white focus:border-[#FCB283] focus:outline-none transition-colors`}
                />
                <ErrorMessage error={errors.eventDate} />
              </div>

              {/* Event End Date (only show if not one day activity) */}
              {!formData.isOneDayActivity && (
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.eventEndDate} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.eventEndDate}
                    onChange={(e) => handleInputChange('eventEndDate', e.target.value)}
                    min={formData.eventDate} // End date cannot be before start date
                    className={`w-full p-3 rounded-lg bg-white/10 border ${errors.eventEndDate ? 'border-red-400 error-field' : 'border-white/20'} text-white focus:border-[#FCB283] focus:outline-none transition-colors`}
                  />
                  <ErrorMessage error={errors.eventEndDate} />
                </div>
              )}
            </div>

            {/* Start Time and End Time - Always on the same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Time */}
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  <Clock className="w-4 h-4 inline mr-2" />
                  {currentContent.startTime} <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${errors.startTime ? 'border-red-400 error-field' : 'border-white/20'} text-white focus:border-[#FCB283] focus:outline-none transition-colors`}
                />
                <ErrorMessage error={errors.startTime} />
              </div>

              {/* End Time */}
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  <Clock className="w-4 h-4 inline mr-2" />
                  {currentContent.endTime} <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${errors.endTime ? 'border-red-400 error-field' : 'border-white/20'} text-white focus:border-[#FCB283] focus:outline-none transition-colors`}
                />
                <ErrorMessage error={errors.endTime} />
              </div>
            </div>

            {/* Registration Deadline - On its own separate line */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.registrationDeadline} <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                className={`w-full p-3 rounded-lg bg-white/10 border ${errors.registrationDeadline ? 'border-red-400 error-field' : 'border-white/20'} text-white focus:border-[#FCB283] focus:outline-none transition-colors`}
              />
              <ErrorMessage error={errors.registrationDeadline} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Venue Name */}
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  <MapPin className="w-4 h-4 inline mr-2" />
                  {currentContent.venueName} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={(e) => handleInputChange('venueName', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${errors.venueName ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
                  placeholder={currentContent.venueNamePlaceholder}
                />
                <ErrorMessage error={errors.venueName} />
              </div>

              {/* Venue Location */}
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  <Globe className="w-4 h-4 inline mr-2" />
                  {currentContent.venueLocation}
                </label>
                <input
                  type="url"
                  value={formData.venueLocation}
                  onChange={(e) => handleInputChange('venueLocation', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${errors.venueLocation ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
                  placeholder={currentContent.venueLocationPlaceholder}
                />
                <ErrorMessage error={errors.venueLocation} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Details */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.detailSection}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.description} <span className="text-red-400">*</span>
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                placeholder={currentContent.descriptionPlaceholder}
                error={!!errors.description}
                className={errors.description ? 'error' : ''}
              />
              <div className="flex justify-between items-center mt-1">
                <ErrorMessage error={errors.description} />
                <span className={`text-xs ${getClass('menu')} text-white/60`}>
                  {formData.description.replace(/<[^>]*>/g, '').length} {currentContent.characterCount}
                </span>
              </div>
            </div>

            {/* Organizers */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.organizers} <span className="text-red-400">*</span>
              </label>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newOrganizer}
                  onChange={(e) => setNewOrganizer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOrganizer())}
                  className="flex-1 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={currentContent.organizerPlaceholder}
                />
                <AnimatedButton
                  type="button"
                  variant="secondary"
                  size="medium"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={addOrganizer}
                >
                  {currentContent.addOrganizer}
                </AnimatedButton>
              </div>
              
              {formData.organizers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.organizers.map((organizer, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-[#FCB283]/20 text-[#FCB283] rounded-full text-sm border border-[#FCB283]/30"
                    >
                      <span>{organizer}</span>
                      <button
                        type="button"
                        onClick={() => removeOrganizer(index)}
                        className="text-[#FCB283] hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <ErrorMessage error={errors.organizers} />
            </div>
          </div>
        </div>

        {/* Section 4: Tags */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.tagsSection}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Predefined Tags */}
            <div>
              <h3 className={`text-lg ${getClass('subtitle')} text-white mb-4`}>
                {currentContent.predefinedTags}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {DEFAULT_ACTIVITY_TAGS.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      formData.tags.includes(tag.id)
                        ? 'border-[#FCB283] bg-[#FCB283]/20 text-[#FCB283]'
                        : 'border-white/20 bg-white/5 text-white/80 hover:border-[#FCB283]/50 hover:bg-white/10'
                    }`}
                  >
                    <div className={`font-medium text-sm ${getClass('body')}`}>
                      {tag[currentLanguage]}
                    </div>
                    <div className={`text-xs ${getClass('menu')} opacity-70`}>
                      {tag[currentLanguage === 'th' ? 'en' : 'th']}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tags */}
            <div>
              <h3 className={`text-lg ${getClass('subtitle')} text-white mb-4`}>
                {currentContent.customTags}
              </h3>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  className="flex-1 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={currentContent.customTagPlaceholder}
                />
                <AnimatedButton
                  type="button"
                  variant="secondary"
                  size="medium"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={addCustomTag}
                >
                  {currentContent.addCustomTag}
                </AnimatedButton>
              </div>

              {customTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 text-white rounded-full text-sm border border-white/20"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomTag(tag)}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Contact */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl ${getClass('header')} text-white`}>
              {currentContent.contactSection}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Email */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                <Mail className="w-4 h-4 inline mr-2" />
                {currentContent.contactEmail} <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className={`w-full p-3 rounded-lg bg-white/10 border ${errors.contactEmail ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
              />
              <ErrorMessage error={errors.contactEmail} />
            </div>

            {/* Contact Name */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                <User className="w-4 h-4 inline mr-2" />
                {currentContent.contactName} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className={`w-full p-3 rounded-lg bg-white/10 border ${errors.contactName ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
                placeholder={currentContent.contactNamePlaceholder}
              />
              <ErrorMessage error={errors.contactName} />
            </div>

            {/* Contact Phone */}
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                <Phone className="w-4 h-4 inline mr-2" />
                {currentContent.contactPhone} <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className={`w-full p-3 rounded-lg bg-white/10 border ${errors.contactPhone ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors`}
                placeholder={currentContent.contactPhonePlaceholder}
              />
              <ErrorMessage error={errors.contactPhone} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <AnimatedButton
            type="button"
            variant="outline"
            size="large"
            onClick={onCancel}
            className={isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {currentContent.cancel}
          </AnimatedButton>
          
          <AnimatedButton
            type="submit"
            variant="primary"
            size="large"
            icon={<Save className="w-4 h-4" />}
            className={`${getClass('menu')} ${(isSubmitting || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {(isSubmitting || isLoading) ? currentContent.saving : currentContent.save}
          </AnimatedButton>
        </div>
      </form>
    </div>
  );
};

export default ActivitiesForm;
