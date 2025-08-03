import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { ScoringCriteria, VideoScoringPanelProps } from '../../types/admin.types';
import { Star, Save, RotateCcw, TrendingUp } from 'lucide-react';
import AnimatedButton from '../ui/AnimatedButton';

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

  const [scores, setScores] = useState<Partial<ScoringCriteria & { humanEffort: number }>>({
    technical: 0,
    story: 0,
    creativity: 0,
    chiangmai: 0,
    humanEffort: 0,
    overall: 0,
    comments: ''
  });

  // Update scores when currentScores prop changes
  useEffect(() => {
    if (currentScores) {
      // If user has already submitted a score, populate the fields
      setScores({
        technical: currentScores.technical,
        story: currentScores.story,
        creativity: currentScores.creativity,
        chiangmai: currentScores.chiangmai,
        humanEffort: currentScores.overall, // Map from overall prop to humanEffort state
        overall: currentScores.overall, // Keep overall for compatibility
        comments: currentScores.comments || ''
      });
    } else {
      // If no score exists, leave fields empty (0 values)
      setScores({
        technical: 0,
        story: 0,
        creativity: 0,
        chiangmai: 0,
        humanEffort: 0,
        overall: 0,
        comments: ''
      });
    }
  }, [currentScores]);

  const [hasChanges, setHasChanges] = useState(false);

  const content = {
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
  };

  const currentContent = content[currentLanguage];

  const criteriaInfo = [
    { key: 'creativity', label: currentContent.creativity, icon: '✨' },
    { key: 'technical', label: currentContent.technical, icon: '🎬' },
    { key: 'story', label: currentContent.story, icon: '📖' },
    { key: 'chiangmai', label: currentContent.chiangmai, icon: '🏔️' },
    { key: 'humanEffort', label: currentContent.humanEffort, icon: '💪' }
  ];

  // Calculate total score
  const totalScore = (scores.creativity || 0) + (scores.technical || 0) + (scores.story || 0) + (scores.chiangmai || 0) + (scores.humanEffort || 0);
  const totalPercentage = Math.round((totalScore / 50) * 100);

  // Calculate average from all scores
  const averageScore = allScores.length > 0 
    ? allScores.reduce((sum, score) => sum + score.totalScore, 0) / allScores.length 
    : 0;

  useEffect(() => {
    const hasScoreChanges = 
      scores.technical !== (currentScores?.technical || 0) ||
      scores.story !== (currentScores?.story || 0) ||
      scores.creativity !== (currentScores?.creativity || 0) ||
      scores.chiangmai !== (currentScores?.chiangmai || 0) ||
      scores.humanEffort !== (currentScores?.overall || 0) ||
      scores.comments !== (currentScores?.comments || '');
    
    setHasChanges(hasScoreChanges);
    
    // Update both humanEffort and overall to keep them in sync
    const updatedScores = {
      ...scores,
      overall: scores.humanEffort || 0,
      humanEffort: scores.humanEffort || 0
    };
    
    // Map back to overall for parent component compatibility
    const mappedScores = {
      technical: updatedScores.technical || 0,
      story: updatedScores.story || 0,
      creativity: updatedScores.creativity || 0,
      chiangmai: updatedScores.chiangmai || 0,
      overall: updatedScores.humanEffort || 0, // Use humanEffort as overall
      totalScore: (updatedScores.technical || 0) + (updatedScores.story || 0) + (updatedScores.creativity || 0) + (updatedScores.chiangmai || 0) + (updatedScores.humanEffort || 0),
      comments: updatedScores.comments
    };
    
    onScoreChange(mappedScores);
  }, [scores, currentScores, onScoreChange]);

  const handleScoreChange = (criterion: string, value: number) => {
    setScores(prev => {
      const updated = { ...prev, [criterion]: value };
      // Keep humanEffort and overall in sync
      if (criterion === 'humanEffort') {
        updated.overall = value;
      }
      return updated;
    });
  };

  const handleCommentsChange = (comments: string) => {
    setScores(prev => ({ ...prev, comments }));
  };

  const handleSaveScores = async () => {
    if (!user) return;

    const scoringData: ScoringCriteria = {
      technical: scores.technical || 0,
      story: scores.story || 0,
      creativity: scores.creativity || 0,
      chiangmai: scores.chiangmai || 0,
      overall: scores.humanEffort || 0, // Map humanEffort back to overall for interface compatibility
      totalScore,
      adminId: user.uid,
      adminName: user.displayName || user.email || 'Admin',
      scoredAt: new Date(),
      comments: scores.comments
    };

    await onSaveScores(scoringData);
    setHasChanges(false);
  };

  const handleResetScores = () => {
    setScores({
      technical: 0,
      story: 0,
      creativity: 0,
      chiangmai: 0,
      humanEffort: 0,
      overall: 0,
      comments: ''
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-blue-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return currentContent.excellent;
    if (score >= 6) return currentContent.good;
    if (score >= 4) return currentContent.average;
    return currentContent.poor;
  };

  const StarRating = ({ value, onChange, criterion }: { value: number; onChange: (value: number) => void; criterion: string }) => {
    const [hoverValue, setHoverValue] = useState(0);

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className="transition-all duration-200 hover:scale-110"
          >
            <Star
              className={`w-5 h-5 transition-colors duration-200 ${
                star <= (hoverValue || value)
                  ? 'text-[#FCB283] fill-current'
                  : 'text-white/30'
              }`}
            />
          </button>
        ))}
        <span className={`ml-3 text-lg font-bold ${getScoreColor(value)} ${getClass('header')}`}>
          {value}/10 ({Math.round((value / 10) * 100)}%)
        </span>
      </div>
    );
  };

  return (
    <div className={`glass-container rounded-2xl p-4 sm:p-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-lg ${getClass('header')} text-white mb-1 flex items-center space-x-2`}>
            <Star className="w-5 h-5 text-[#FCB283]" />
            <span>{currentContent.title}</span>
          </h3>
          <p className={`${getClass('body')} text-white/70 text-xs`}>
            {currentContent.subtitle}
          </p>
        </div>
        
        {/* Total Score Display */}
        <div className="text-center">
          <div className={`text-2xl ${getClass('header')} ${getScoreColor(totalScore / 4)} mb-1`}>
            {totalScore}/50 ({Math.round((totalScore / 50) * 100)}%)
          </div>
          <p className={`text-xs ${getClass('body')} text-white/60`}>
            {currentContent.totalScore}
          </p>
        </div>
      </div>

      {/* Scoring Criteria */}
      <div className="space-y-4 mb-6">
        {criteriaInfo.map((criterion) => (
          <div key={criterion.key} className="glass-card p-3 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{criterion.icon}</span>
                <div>
                  <h4 className={`${getClass('subtitle')} text-white font-medium`}>
                    {criterion.label}
                  </h4>
                  <p className={`text-xs ${getClass('body')} text-white/60`}>
                    {currentContent.scoringScale}
                  </p>
                </div>
              </div>
              <span className={`text-sm ${getClass('body')} ${getScoreColor(scores[criterion.key as keyof typeof scores] as number || 0)}`}>
                {getScoreLabel(scores[criterion.key as keyof typeof scores] as number || 0)}
              </span>
            </div>
            
            <StarRating
              value={scores[criterion.key as keyof typeof scores] as number || 0}
              onChange={(value) => handleScoreChange(criterion.key, value)}
              criterion={criterion.key}
            />
          </div>
        ))}
      </div>

      {/* Comments Section */}
      <div className="mb-8">
        <label className={`block text-white/90 ${getClass('body')} mb-3`}>
          {currentContent.comments}
        </label>
        <textarea
          value={scores.comments || ''}
          onChange={(e) => handleCommentsChange(e.target.value)}
          placeholder={currentContent.commentsPlaceholder}
          rows={4}
          className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none resize-vertical"
        />
      </div>

      {/* Previous Scores Summary */}
      {allScores.length > 0 && (
        <div className="mb-8">
          <h4 className={`${getClass('subtitle')} text-white mb-4 flex items-center space-x-2`}>
            <TrendingUp className="w-5 h-5 text-[#FCB283]" />
            <span>{currentContent.previousScores}</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Average Score */}
            <div className="glass-card p-4 rounded-xl text-center">
              <div className={`text-2xl ${getClass('header')} ${getScoreColor(averageScore / 5)} mb-2`}>
                {averageScore.toFixed(1)}/50 ({Math.round((averageScore / 50) * 100)}%)
              </div>
              <p className={`text-sm ${getClass('body')} text-white/80`}>
                {currentContent.averageScore}
              </p>
            </div>

            {/* Scores Count */}
            <div className="glass-card p-4 rounded-xl text-center">
              <div className={`text-2xl ${getClass('header')} text-[#FCB283] mb-2`}>
                {allScores.length}
              </div>
              <p className={`text-sm ${getClass('body')} text-white/80`}>
                {currentLanguage === 'th' ? 'ผู้ตัดสิน' : 'Judges'}
              </p>
            </div>
          </div>

          {/* Individual Scores - Show all without scroll */}
          <div className="mt-4 space-y-2">
            {allScores.map((score, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className={`${getClass('body')} text-white text-sm font-medium`}>
                    {score.adminName}
                  </p>
                  <p className={`${getClass('body')} text-white/60 text-xs`}>
                    {new Date(score.scoredAt).toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`${getClass('header')} ${getScoreColor(score.totalScore / 5)} text-lg`}>
                    {score.totalScore}/50
                  </p>
                  <p className={`${getClass('body')} text-white/60 text-xs`}>
                    C:{score.creativity} T:{score.technical} S:{score.story} CM:{score.chiangmai} HE:{score.overall}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          disabled={!hasChanges || isSubmitting}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            hasChanges && !isSubmitting
              ? 'bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white hover:from-[#FCB283] hover:to-[#AA4626]'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? currentContent.saving : currentContent.saveScores}</span>
        </button>
      </div>
    </div>
  );
};

export default VideoScoringPanel;
