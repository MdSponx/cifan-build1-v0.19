import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { ScoringCriteria, VideoScoringPanelProps } from '../../types/admin.types';
import { Star, Save, RotateCcw, TrendingUp } from 'lucide-react';

const VideoScoringPanel: React.FC<VideoScoringPanelProps> = ({
  applicationId,
  currentScores,
  allScores,
  onScoreChange,
  onSaveScores,
  isSubmitting = false,
  className = ''
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user } = useAuth();
  const currentLanguage = i18n.language as 'en' | 'th';

  // Local state
  const [scores, setScores] = useState<Partial<ScoringCriteria & { humanEffort: number }>>({
    technical: 0,
    story: 0,
    creativity: 0,
    chiangmai: 0,
    humanEffort: 0,
    overall: 0,
    comments: ''
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [initialScores, setInitialScores] = useState<Partial<ScoringCriteria & { humanEffort: number }>>({});
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);

  // Content
  const content = useMemo(() => ({
    th: {
      title: "การให้คะแนน",
      subtitle: "ประเมินผลงานตามเกณฑ์การตัดสิน",
      technical: "คุณภาพทางเทคนิค",
      story: "เรื่องราวและการเล่าเรื่อง",
      creativity: "ความคิดสร้างสรรค์และความเป็นต้นฉบับ",
      chiangmai: "ความเกี่ยวข้องกับเชียงใหม่",
      humanEffort: "ความพยายามของมนุษย์",
      totalScore: "คะแนนรวม",
      comments: "ความคิดเห็นเพิ่มเติม",
      commentsPlaceholder: "เขียนความคิดเห็นเกี่ยวกับผลงานนี้...",
      saveScores: "บันทึกคะแนน",
      saving: "กำลังบันทึก...",
      resetScores: "รีเซ็ตคะแนน",
      averageScore: "คะแนนเฉลี่ย",
      yourScore: "คะแนนของคุณ",
      previousScores: "คะแนนจากผู้ตัดสินอื่น",
      noScores: "ยังไม่มีการให้คะแนน",
      scoringScale: "มาตราส่วน 1-10 คะแนน",
      excellent: "ยอดเยี่ยม",
      good: "ดี",
      average: "ปานกลาง",
      poor: "ต้องปรับปรุง"
    },
    en: {
      title: "Scoring Panel",
      subtitle: "Evaluate the film based on judging criteria",
      technical: "Technical Quality",
      story: "Story & Narrative",
      creativity: "Creativity & Originality",
      chiangmai: "Connection to Chiang Mai",
      humanEffort: "Human Effort",
      totalScore: "Total Score",
      comments: "Additional Comments",
      commentsPlaceholder: "Write your comments about this film...",
      saveScores: "Save Scores",
      saving: "Saving...",
      resetScores: "Reset Scores",
      averageScore: "Average Score",
      yourScore: "Your Score",
      previousScores: "Other Judges' Scores",
      noScores: "No scores yet",
      scoringScale: "Scale: 1-10 points",
      excellent: "Excellent",
      good: "Good",
      average: "Average",
      poor: "Needs Improvement"
    }
  }), []);

  const currentContent = content[currentLanguage];

  // Criteria info
  const criteriaInfo = useMemo(() => [
    { key: 'creativity', label: currentContent.creativity, icon: '✨' },
    { key: 'technical', label: currentContent.technical, icon: '🎬' },
    { key: 'story', label: currentContent.story, icon: '📖' },
    { key: 'chiangmai', label: currentContent.chiangmai, icon: '🏔️' },
    { key: 'humanEffort', label: currentContent.humanEffort, icon: '💪' }
  ], [currentContent]);

  // Load initial scores from props
  useEffect(() => {
    console.log('🔄 VideoScoringPanel: Loading currentScores prop:', currentScores);
    
    if (currentScores) {
      const newScores = {
        technical: currentScores.technical || 0,
        story: currentScores.story || 0,
        creativity: currentScores.creativity || 0,
        chiangmai: currentScores.chiangmai || 0,
        humanEffort: currentScores.overall || 0,
        overall: currentScores.overall || 0,
        comments: currentScores.comments || ''
      };
      
      console.log('📝 Setting scores from currentScores:', newScores);
      setScores(newScores);
      setInitialScores(newScores);
      setHasChanges(false);
    } else {
      const emptyScores = {
        technical: 0,
        story: 0,
        creativity: 0,
        chiangmai: 0,
        humanEffort: 0,
        overall: 0,
        comments: ''
      };
      
      console.log('📝 Setting empty scores (no currentScores)');
      setScores(emptyScores);
      setInitialScores(emptyScores);
      setHasChanges(false);
    }
  }, [currentScores]);

  // Change detection
  useEffect(() => {
    if (Object.keys(initialScores).length === 0) {
      console.log('⏳ No initial scores yet, skipping change detection');
      return;
    }

    // For new entries, check if any score > 0 or comments exist
    if (!currentScores) {
      const hasAnyScore = (scores.technical || 0) > 0 || 
                         (scores.story || 0) > 0 || 
                         (scores.creativity || 0) > 0 || 
                         (scores.chiangmai || 0) > 0 || 
                         (scores.humanEffort || 0) > 0 || 
                         (scores.comments || '').trim().length > 0;
      
      console.log('📊 New entry - hasAnyScore:', hasAnyScore);
      setHasChanges(hasAnyScore);
      return;
    }

    // For existing entries, compare current vs initial
    const hasScoreChanges = 
      scores.technical !== (initialScores.technical || 0) ||
      scores.story !== (initialScores.story || 0) ||
      scores.creativity !== (initialScores.creativity || 0) ||
      scores.chiangmai !== (initialScores.chiangmai || 0) ||
      scores.humanEffort !== (initialScores.humanEffort || 0) ||
      scores.comments !== (initialScores.comments || '');
    
    console.log('📊 Change detection result:', {
      hasScoreChanges,
      technical: `${scores.technical} vs ${initialScores.technical}`,
      story: `${scores.story} vs ${initialScores.story}`,
      creativity: `${scores.creativity} vs ${initialScores.creativity}`,
      chiangmai: `${scores.chiangmai} vs ${initialScores.chiangmai}`,
      humanEffort: `${scores.humanEffort} vs ${initialScores.humanEffort}`,
      comments: `"${scores.comments}" vs "${initialScores.comments}"`
    });
    
    setHasChanges(hasScoreChanges);
  }, [scores, initialScores, currentScores]);

  // Notify parent of score changes
  const memoizedOnScoreChange = useCallback((mappedScores: Partial<ScoringCriteria>) => {
    console.log('📤 Notifying parent of score changes:', mappedScores);
    onScoreChange(mappedScores);
  }, [onScoreChange]);

  useEffect(() => {
    const totalScore = (scores.technical || 0) + (scores.story || 0) + (scores.creativity || 0) + (scores.chiangmai || 0) + (scores.humanEffort || 0);
    
    const mappedScores = {
      technical: scores.technical || 0,
      story: scores.story || 0,
      creativity: scores.creativity || 0,
      chiangmai: scores.chiangmai || 0,
      overall: scores.humanEffort || 0,
      totalScore: totalScore,
      comments: scores.comments || ''
    };
    
    memoizedOnScoreChange(mappedScores);
  }, [scores, memoizedOnScoreChange]);

  // Event handlers
  const handleScoreChange = useCallback((criterion: string, value: number) => {
    console.log(`🎯 Score changed - ${criterion}: ${value}`);
    setScores(prev => {
      const updated = { ...prev, [criterion]: value };
      if (criterion === 'humanEffort') {
        updated.overall = value;
      }
      return updated;
    });
  }, []);

  const handleCommentsChange = useCallback((comments: string) => {
    console.log('💬 Comments changed:', comments);
    setScores(prev => ({ ...prev, comments }));
  }, []);

  // FIXED: Main save handler with better error handling
  const handleSaveScores = useCallback(async () => {
    console.log('💾 Save button clicked');
    
    // Enhanced validation
    if (!user) {
      console.error('❌ No user found');
      alert('Error: No user authentication found. Please log in again.');
      return;
    }
    
    if (!hasChanges) {
      console.warn('⚠️ No changes to save');
      alert('No changes detected to save.');
      return;
    }
    
    // Use both local and prop isSubmitting
    if (isSubmitting || localIsSubmitting) {
      console.warn('⚠️ Already submitting');
      return;
    }

    console.log('🔄 Starting save process...');
    console.log('💾 Current scores state:', scores);

    // Set local submitting state
    setLocalIsSubmitting(true);

    try {
      const calculatedTotalScore = (scores.technical || 0) + (scores.story || 0) + (scores.creativity || 0) + (scores.chiangmai || 0) + (scores.humanEffort || 0);

      const scoringData: ScoringCriteria = {
        technical: scores.technical || 0,
        story: scores.story || 0,
        creativity: scores.creativity || 0,
        chiangmai: scores.chiangmai || 0,
        overall: scores.humanEffort || 0,
        totalScore: calculatedTotalScore,
        adminId: user.uid,
        adminName: user.displayName || user.email || 'Admin',
        scoredAt: new Date(),
        comments: scores.comments || ''
      };

      console.log('💾 Calling onSaveScores with data:', scoringData);

      // Call parent save function with timeout
      const savePromise = onSaveScores(scoringData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save operation timed out')), 30000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      
      // Update initial scores to reflect the saved state
      const newInitialScores = {
        technical: scores.technical || 0,
        story: scores.story || 0,
        creativity: scores.creativity || 0,
        chiangmai: scores.chiangmai || 0,
        humanEffort: scores.humanEffort || 0,
        overall: scores.humanEffort || 0,
        comments: scores.comments || ''
      };
      
      setInitialScores(newInitialScores);
      setHasChanges(false);
      
      console.log('✅ Save successful');
      alert('Score saved successfully!');
      
    } catch (error) {
      console.error('❌ Save failed:', error);
      
      // Enhanced error reporting
      let errorMessage = 'Failed to save score. ';
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage += 'Permission denied. Please check your admin rights.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Network error. Please check your connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage += 'Operation timed out. Please try again.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      alert(errorMessage);
      // Don't reset hasChanges on error so user can try again
    } finally {
      setLocalIsSubmitting(false);
    }
  }, [user, hasChanges, isSubmitting, localIsSubmitting, scores, onSaveScores]);

  const handleResetScores = useCallback(() => {
    console.log('🔄 Resetting scores');
    setScores({
      technical: 0,
      story: 0,
      creativity: 0,
      chiangmai: 0,
      humanEffort: 0,
      overall: 0,
      comments: ''
    });
    setHasChanges(false);
  }, []);

  // Calculated values
  const totalScore = useMemo(() => {
    return (scores.creativity || 0) + (scores.technical || 0) + (scores.story || 0) + (scores.chiangmai || 0) + (scores.humanEffort || 0);
  }, [scores.creativity, scores.technical, scores.story, scores.chiangmai, scores.humanEffort]);

  const totalPercentage = useMemo(() => Math.round((totalScore / 50) * 100), [totalScore]);

  const averageScore = useMemo(() => {
    return allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score.totalScore, 0) / allScores.length 
      : 0;
  }, [allScores]);

  // Render functions
  const getScoreColor = (percentage: number) => {
    if (percentage >= 0.8) return 'text-green-400';
    if (percentage >= 0.6) return 'text-yellow-400';
    if (percentage >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  // Star Rating Component
  const StarRating: React.FC<{
    value: number;
    onChange: (value: number) => void;
    maxStars?: number;
    size?: 'sm' | 'md' | 'lg';
  }> = ({ value, onChange, maxStars = 10, size = 'md' }) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };
    
    const starSize = sizeClasses[size];
    
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const isActive = starValue <= (hoverValue ?? value);
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHoverValue(starValue)}
              onMouseLeave={() => setHoverValue(null)}
              className={`transition-all duration-200 hover:scale-110 ${
                isActive 
                  ? 'text-[#FCB283] drop-shadow-lg' 
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              <Star 
                className={`${starSize} ${isActive ? 'fill-current' : ''}`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  const renderStarRating = (key: string, label: string, icon: string) => (
    <div key={key} className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={`${getClass('body')} text-white/90 flex items-center space-x-2`}>
          <span className="text-lg">{icon}</span>
          <span>{label}</span>
        </label>
        <span className={`${getClass('header')} text-[#FCB283] text-lg font-bold`}>
          {Number(scores[key as keyof typeof scores]) || 0}/10
        </span>
      </div>
      
      {/* Star Rating */}
      <div className="flex items-center justify-center">
        <StarRating
          value={Number(scores[key as keyof typeof scores]) || 0}
          onChange={(value) => handleScoreChange(key, value)}
          maxStars={10}
          size="md"
        />
      </div>
    </div>
  );

  return (
    <div className={`glass-container rounded-2xl p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className={`text-2xl ${getClass('header')} text-white mb-2`}>
          {currentContent.title}
        </h3>
        <p className={`${getClass('body')} text-white/70`}>
          {currentContent.subtitle}
        </p>
      </div>

      {/* Star Rating Scores */}
      <div className="space-y-6">
        {criteriaInfo.map(criterion => 
          renderStarRating(criterion.key, criterion.label, criterion.icon)
        )}
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <label className={`${getClass('body')} text-white/90`}>
          {currentContent.comments}
        </label>
        <textarea
          value={scores.comments || ''}
          onChange={(e) => handleCommentsChange(e.target.value)}
          placeholder={currentContent.commentsPlaceholder}
          className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-transparent ${getClass('body')} resize-none`}
          rows={4}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <button
          onClick={handleResetScores}
          disabled={!hasChanges}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            hasChanges 
              ? 'border-white/20 text-white hover:bg-white/10' 
              : 'border-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{currentContent.resetScores}</span>
        </button>
        
        <button
          onClick={handleSaveScores}
          disabled={!hasChanges || isSubmitting || localIsSubmitting}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            hasChanges && !isSubmitting && !localIsSubmitting
              ? 'bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white hover:from-[#FCB283] hover:to-[#AA4626]'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>
            {(isSubmitting || localIsSubmitting) ? currentContent.saving : currentContent.saveScores}
          </span>
        </button>
      </div>
    </div>
  );
};

export default VideoScoringPanel;
