import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  X,
  Info
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 means no auto-dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface StatusNotificationProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
}

const StatusNotification: React.FC<StatusNotificationProps> = ({
  notification,
  onDismiss
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Show animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-[#FCB283] animate-spin" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'loading':
        return 'border-[#FCB283]/30 bg-[#FCB283]/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div
      className={`
        relative w-full max-w-sm sm:max-w-md lg:max-w-lg
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
      style={{
        maxWidth: 'min(calc(100vw - 2rem), 28rem)', // Responsive max width with viewport constraint
        minWidth: '280px' // Minimum width for readability
      }}
    >
      <div className={`
        glass-container rounded-xl p-4 border-2 ${getColorClasses()}
        shadow-lg backdrop-blur-md
      `}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`${getClass('subtitle')} text-white font-medium mb-1`}>
              {notification.title}
            </h4>
            
            {notification.message && (
              <p className={`${getClass('body')} text-white/80 text-sm`}>
                {notification.message}
              </p>
            )}
            
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className={`
                  mt-2 px-3 py-1 rounded-lg text-sm font-medium
                  bg-white/10 hover:bg-white/20 text-white
                  transition-colors duration-200
                  ${getClass('menu')}
                `}
              >
                {notification.action.label}
              </button>
            )}
          </div>
          
          {notification.type !== 'loading' && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusNotification;
