import React, { createContext, useContext, useState, useCallback } from 'react';
import StatusNotification, { NotificationData, NotificationType } from './StatusNotification';

interface NotificationContextType {
  showNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => string;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<NotificationData>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: NotificationData = {
      id,
      type,
      title,
      message,
      duration: options?.duration ?? (type === 'loading' ? 0 : 5000), // Loading notifications don't auto-dismiss
      action: options?.action
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<NotificationData>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  const contextValue: NotificationContextType = {
    showNotification,
    dismissNotification,
    clearAllNotifications,
    updateNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-[9999] pointer-events-none max-w-full">
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className="pointer-events-auto"
              style={{
                transform: `translateY(${index * 12}px)`,
                zIndex: 9999 - index
              }}
            >
              <StatusNotification
                notification={notification}
                onDismiss={dismissNotification}
              />
            </div>
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
};

// Convenience hooks for common notification types
export const useNotificationHelpers = () => {
  const { showNotification, updateNotification, dismissNotification } = useNotification();

  return {
    showSuccess: (title: string, message?: string, duration = 5000) =>
      showNotification('success', title, message, { duration }),
    
    showError: (title: string, message?: string, duration = 8000) =>
      showNotification('error', title, message, { duration }),
    
    showWarning: (title: string, message?: string, duration = 6000) =>
      showNotification('warning', title, message, { duration }),
    
    showInfo: (title: string, message?: string, duration = 5000) =>
      showNotification('info', title, message, { duration }),
    
    showLoading: (title: string, message?: string) =>
      showNotification('loading', title, message, { duration: 0 }),
    
    updateToSuccess: (id: string, title: string, message?: string) => {
      updateNotification(id, {
        type: 'success',
        title,
        message,
        duration: 5000
      });
      // Auto-dismiss after duration
      setTimeout(() => dismissNotification(id), 5000);
    },
    
    updateToError: (id: string, title: string, message?: string) => {
      updateNotification(id, {
        type: 'error',
        title,
        message,
        duration: 8000
      });
      // Auto-dismiss after duration
      setTimeout(() => dismissNotification(id), 8000);
    },
    
    dismiss: dismissNotification
  };
};

export default NotificationProvider;
