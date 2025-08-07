import React from 'react';
import { useNotificationHelpers } from '../ui/NotificationContext';
import AnimatedButton from '../ui/AnimatedButton';
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

const NotificationTest: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo, showLoading, updateToSuccess, updateToError } = useNotificationHelpers();

  const testActivitySubmissionFlow = () => {
    // Simulate activity submission flow
    const loadingId = showLoading(
      'Saving activity...',
      'Creating new activity and uploading image...'
    );

    // After 2 seconds, update to success
    setTimeout(() => {
      updateToSuccess(
        loadingId,
        'Activity created successfully',
        'Your activity "Workshop: Film Making Basics" has been created and is now live.'
      );
    }, 2000);
  };

  const testMultipleNotifications = () => {
    showInfo('Info Notification', 'This is an informational message');
    setTimeout(() => showWarning('Warning Notification', 'This is a warning message'), 500);
    setTimeout(() => showError('Error Notification', 'This is an error message'), 1000);
    setTimeout(() => showSuccess('Success Notification', 'This is a success message'), 1500);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 glass-container rounded-xl p-4 space-y-3">
      <h3 className="text-white font-medium text-sm mb-3 flex items-center">
        <Bell className="w-4 h-4 mr-2" />
        Notification Test Panel
      </h3>
      
      <div className="space-y-2">
        <AnimatedButton
          variant="primary"
          size="small"
          onClick={testActivitySubmissionFlow}
        >
          <Loader2 className="w-3 h-3 mr-1" />
          Test Activity Submission
        </AnimatedButton>
        
        <AnimatedButton
          variant="secondary"
          size="small"
          onClick={testMultipleNotifications}
        >
          <Bell className="w-3 h-3 mr-1" />
          Test Multiple Notifications
        </AnimatedButton>
        
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => showSuccess('Success!', 'Operation completed')}
            className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
          >
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Success
          </button>
          
          <button
            onClick={() => showError('Error!', 'Something went wrong')}
            className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
          >
            <XCircle className="w-3 h-3 inline mr-1" />
            Error
          </button>
          
          <button
            onClick={() => showWarning('Warning!', 'Please check this')}
            className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition-colors"
          >
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Warning
          </button>
          
          <button
            onClick={() => showInfo('Info', 'Just so you know')}
            className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
          >
            <Info className="w-3 h-3 inline mr-1" />
            Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;
