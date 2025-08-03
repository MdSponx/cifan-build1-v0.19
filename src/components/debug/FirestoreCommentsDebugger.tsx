import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAdmin } from '../admin/AdminContext';
import { debugShortFilmCommentsService, DebugInfo, ShortFilmCommentDebug } from '../../services/debugShortFilmCommentsService';
import { shortFilmCommentsService } from '../../services/shortFilmCommentsService';
import { 
  Bug, 
  Play, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  User,
  Shield,
  Eye,
  Plus,
  Download
} from 'lucide-react';

interface FirestoreCommentsDebuggerProps {
  submissionId: string;
  onClose?: () => void;
}

const FirestoreCommentsDebugger: React.FC<FirestoreCommentsDebuggerProps> = ({ 
  submissionId, 
  onClose 
}) => {
  const { user, userProfile } = useAuth();
  const { isAdmin, adminProfile, permissions } = useAdmin();
  
  // Debug state
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [comments, setComments] = useState<ShortFilmCommentDebug[]>([]);
  const [originalComments, setOriginalComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'connection' | 'data' | 'logs'>('overview');

  // Load debug logs on mount
  useEffect(() => {
    setDebugLogs(debugShortFilmCommentsService.getDebugLogs());
  }, []);

  // Run comprehensive diagnostic
  const runDiagnostic = async () => {
    setIsRunningTests(true);
    setTestResults(null);
    
    try {
      console.log('🔍 Starting comprehensive Firestore comments diagnostic...');
      
      // Step 1: Permission check
      const permissionCheck = await debugShortFilmCommentsService.checkUserPermissions(user);
      
      // Step 2: Connection test
      const connectionTest = await debugShortFilmCommentsService.testFirestoreConnection(submissionId, user);
      
      // Step 3: Try to fetch comments with debug service
      const debugResult = await debugShortFilmCommentsService.getComments(submissionId, user);
      
      // Step 4: Try to fetch comments with original service for comparison
      let originalResult = null;
      try {
        const originalComments = await shortFilmCommentsService.getComments(submissionId);
        originalResult = {
          success: true,
          comments: originalComments,
          count: originalComments.length
        };
      } catch (error) {
        originalResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          count: 0
        };
      }
      
      const results = {
        timestamp: new Date(),
        submissionId,
        user: {
          uid: user?.uid,
          email: user?.email,
          emailVerified: user?.emailVerified
        },
        userProfile: {
          role: userProfile?.role,
          isProfileComplete: userProfile?.isProfileComplete
        },
        adminProfile: {
          isAdmin,
          adminRole: adminProfile?.adminRole,
          permissions: {
            canViewApplications: permissions.canViewApplications,
            canScoreApplications: permissions.canScoreApplications
          }
        },
        permissionCheck,
        connectionTest,
        debugService: {
          success: debugResult.success,
          commentsCount: debugResult.comments.length,
          error: debugResult.error,
          debugInfo: debugResult.debugInfo
        },
        originalService: originalResult,
        comparison: {
          bothSucceeded: debugResult.success && originalResult.success,
          countMatch: debugResult.comments.length === (originalResult.comments?.length || 0),
          debugAdvantage: debugResult.success && !originalResult.success
        }
      };
      
      setTestResults(results);
      setComments(debugResult.comments);
      setOriginalComments(originalResult.comments || []);
      setDebugLogs(debugShortFilmCommentsService.getDebugLogs());
      
      console.log('✅ Diagnostic completed:', results);
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      setTestResults({
        error: `Diagnostic failed: ${error}`,
        timestamp: new Date()
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  // Create test comment
  const createTestComment = async () => {
    if (!user) return;
    
    setIsRunningTests(true);
    try {
      const result = await debugShortFilmCommentsService.createTestComment(submissionId, user, 'scoring');
      if (result.success) {
        console.log('✅ Test comment created:', result.commentId);
        // Re-run diagnostic to see the new comment
        await runDiagnostic();
      } else {
        console.error('❌ Failed to create test comment:', result.error);
      }
    } catch (error) {
      console.error('❌ Error creating test comment:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Clean up test data
  const cleanupTestData = async () => {
    setIsRunningTests(true);
    try {
      const result = await debugShortFilmCommentsService.cleanupTestData(submissionId);
      console.log(`🧹 Cleaned up ${result.deletedCount} test comments`);
      // Re-run diagnostic to see the changes
      await runDiagnostic();
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Clear debug logs
  const clearLogs = () => {
    debugShortFilmCommentsService.clearDebugLogs();
    setDebugLogs([]);
  };

  // Export debug data
  const exportDebugData = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      submissionId,
      testResults,
      debugLogs,
      comments,
      originalComments
    };
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firestore-debug-${submissionId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === undefined) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return success ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getStatusColor = (success: boolean | undefined) => {
    if (success === undefined) return 'text-yellow-400';
    return success ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Bug className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Firestore Comments Debugger</h2>
              <p className="text-gray-400 text-sm">Submission ID: {submissionId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportDebugData}
              disabled={!testResults}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runDiagnostic}
              disabled={isRunningTests}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Run Diagnostic</span>
            </button>
            
            <button
              onClick={createTestComment}
              disabled={isRunningTests || !user}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Create Test Comment</span>
            </button>
            
            <button
              onClick={cleanupTestData}
              disabled={isRunningTests}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Cleanup Test Data</span>
            </button>
            
            <button
              onClick={clearLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'permissions', label: 'Permissions', icon: Shield },
            { id: 'connection', label: 'Connection', icon: Database },
            { id: 'data', label: 'Data', icon: Database },
            { id: 'logs', label: 'Logs', icon: Bug }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-400 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {testResults ? (
                <div className="space-y-4">
                  {/* Quick Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-medium">Authentication</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(testResults.permissionCheck?.isAuthenticated)}
                          <span className={`text-sm ${getStatusColor(testResults.permissionCheck?.isAuthenticated)}`}>
                            {testResults.permissionCheck?.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(testResults.permissionCheck?.isAdmin)}
                          <span className={`text-sm ${getStatusColor(testResults.permissionCheck?.isAdmin)}`}>
                            {testResults.permissionCheck?.isAdmin ? 'Admin Role' : 'No Admin Role'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className="w-5 h-5 text-green-400" />
                        <span className="text-white font-medium">Firestore</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(testResults.connectionTest?.canReadComments)}
                          <span className={`text-sm ${getStatusColor(testResults.connectionTest?.canReadComments)}`}>
                            {testResults.connectionTest?.canReadComments ? 'Can Read Comments' : 'Cannot Read Comments'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(testResults.connectionTest?.commentsCollectionExists)}
                          <span className={`text-sm ${getStatusColor(testResults.connectionTest?.commentsCollectionExists)}`}>
                            {testResults.connectionTest?.commentsCollectionExists ? 'Comments Exist' : 'No Comments Found'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bug className="w-5 h-5 text-purple-400" />
                        <span className="text-white font-medium">Results</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(testResults.debugService?.success)}
                          <span className={`text-sm ${getStatusColor(testResults.debugService?.success)}`}>
                            Debug Service: {testResults.debugService?.commentsCount || 0} comments
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(testResults.originalService?.success)}
                          <span className={`text-sm ${getStatusColor(testResults.originalService?.success)}`}>
                            Original Service: {testResults.originalService?.count || 0} comments
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Messages */}
                  {(testResults.debugService?.error || testResults.originalService?.error) && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h3 className="text-red-400 font-medium mb-2">Errors Detected</h3>
                      {testResults.debugService?.error && (
                        <p className="text-red-300 text-sm mb-2">
                          <strong>Debug Service:</strong> {testResults.debugService.error}
                        </p>
                      )}
                      {testResults.originalService?.error && (
                        <p className="text-red-300 text-sm">
                          <strong>Original Service:</strong> {testResults.originalService.error}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-blue-400 font-medium mb-2">Recommendations</h3>
                    <div className="space-y-2 text-sm text-blue-200">
                      {!testResults.permissionCheck?.isAdmin && (
                        <p>• User needs admin role in their profile document</p>
                      )}
                      {!testResults.connectionTest?.canReadComments && (
                        <p>• Check Firestore security rules for ShortFilmComments subcollection</p>
                      )}
                      {!testResults.connectionTest?.commentsCollectionExists && (
                        <p>• No comments found - try creating a test comment to verify write permissions</p>
                      )}
                      {testResults.debugService?.success && !testResults.originalService?.success && (
                        <p>• Debug service works but original service fails - check error handling in original service</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Click "Run Diagnostic" to start debugging</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && testResults && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">User Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User ID:</span>
                    <span className="text-white">{testResults.user?.uid || 'Not available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{testResults.user?.email || 'Not available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email Verified:</span>
                    <span className={testResults.user?.emailVerified ? 'text-green-400' : 'text-red-400'}>
                      {testResults.user?.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Profile Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role:</span>
                    <span className="text-white">{testResults.userProfile?.role || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Profile Complete:</span>
                    <span className={testResults.userProfile?.isProfileComplete ? 'text-green-400' : 'text-yellow-400'}>
                      {testResults.userProfile?.isProfileComplete ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Admin Permissions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Is Admin:</span>
                    <span className={testResults.adminProfile?.isAdmin ? 'text-green-400' : 'text-red-400'}>
                      {testResults.adminProfile?.isAdmin ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Can View Applications:</span>
                    <span className={testResults.adminProfile?.permissions?.canViewApplications ? 'text-green-400' : 'text-red-400'}>
                      {testResults.adminProfile?.permissions?.canViewApplications ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Can Score Applications:</span>
                    <span className={testResults.adminProfile?.permissions?.canScoreApplications ? 'text-green-400' : 'text-red-400'}>
                      {testResults.adminProfile?.permissions?.canScoreApplications ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'connection' && testResults && (
            <div className="space-y-4">
              {testResults.connectionTest && (
                <div className="space-y-3">
                  {Object.entries(testResults.connectionTest).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <div className="flex items-center space-x-2">
                        {typeof value === 'boolean' && getStatusIcon(value)}
                        <span className={typeof value === 'boolean' ? getStatusColor(value) : 'text-white'}>
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Debug Service Results ({comments.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {comments.map((comment, index) => (
                      <div key={comment.id} className="p-2 bg-gray-700 rounded text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-blue-400">{comment.type}</span>
                          <span className="text-gray-400">{comment.adminName}</span>
                        </div>
                        {comment.scores && (
                          <div className="text-green-400">
                            Total: {comment.scores.totalScore}/50
                          </div>
                        )}
                        <div className="text-gray-300 truncate">{comment.content}</div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-gray-400 text-center py-4">No comments found</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Original Service Results ({originalComments.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {originalComments.map((comment, index) => (
                      <div key={comment.id || index} className="p-2 bg-gray-700 rounded text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-blue-400">{comment.type}</span>
                          <span className="text-gray-400">{comment.adminName}</span>
                        </div>
                        {comment.scores && (
                          <div className="text-green-400">
                            Total: {comment.scores.totalScore}/50
                          </div>
                        )}
                        <div className="text-gray-300 truncate">{comment.content}</div>
                      </div>
                    ))}
                    {originalComments.length === 0 && (
                      <p className="text-gray-400 text-center py-4">No comments found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {debugLogs.map((log, index) => (
                <div key={index} className={`p-3 rounded-lg text-xs ${log.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={log.success ? 'text-green-400' : 'text-red-400'}>
                      {log.action}
                    </span>
                    <span className="text-gray-400">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-300">
                    {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                  </div>
                  {log.error && (
                    <div className="text-red-300 mt-1">
                      Error: {typeof log.error === 'object' ? JSON.stringify(log.error) : String(log.error)}
                    </div>
                  )}
                </div>
              ))}
              {debugLogs.length === 0 && (
                <p className="text-gray-400 text-center py-8">No debug logs available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirestoreCommentsDebugger;
