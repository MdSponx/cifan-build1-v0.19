import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, RoleAuditLog } from '../types/admin.types';

export class RoleService {
  // Get all users with their roles
  static async getAllUsers(): Promise<UserRole[]> {
    try {
      const usersQuery = query(
        collection(db, 'profiles'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(usersQuery);
      const users: UserRole[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Determine user status - check multiple possible fields
        let status: 'active' | 'inactive' = 'active';
        if (data.status) {
          status = data.status;
        } else if (data.isActive !== undefined) {
          status = data.isActive ? 'active' : 'inactive';
        } else if (data.disabled) {
          status = 'inactive';
        }
        
        // Determine last login - check multiple possible fields
        let lastLogin: Date | undefined;
        if (data.lastLogin) {
          lastLogin = data.lastLogin.toDate ? data.lastLogin.toDate() : new Date(data.lastLogin);
        } else if (data.lastSignInTime) {
          lastLogin = data.lastSignInTime.toDate ? data.lastSignInTime.toDate() : new Date(data.lastSignInTime);
        } else if (data.metadata?.lastSignInTime) {
          lastLogin = new Date(data.metadata.lastSignInTime);
        }
        
        users.push({
          id: doc.id,
          name: data.fullNameEN || data.displayName || data.name || 'Unknown User',
          email: data.email,
          role: this.mapFirebaseRoleToUserRole(data.role || 'user'),
          status,
          createdAt: data.createdAt?.toDate() || data.createdAt || new Date(),
          lastLogin,
          avatar: data.photoURL || data.avatar,
          displayName: data.fullNameEN || data.displayName || data.name
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<UserRole | null> {
    try {
      const userDoc = await getDoc(doc(db, 'profiles', userId));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const data = userDoc.data();
      
      // Determine user status - check multiple possible fields
      let status: 'active' | 'inactive' = 'active';
      if (data.status) {
        status = data.status;
      } else if (data.isActive !== undefined) {
        status = data.isActive ? 'active' : 'inactive';
      } else if (data.disabled) {
        status = 'inactive';
      }
      
      // Determine last login - check multiple possible fields
      let lastLogin: Date | undefined;
      if (data.lastLogin) {
        lastLogin = data.lastLogin.toDate ? data.lastLogin.toDate() : new Date(data.lastLogin);
      } else if (data.lastSignInTime) {
        lastLogin = data.lastSignInTime.toDate ? data.lastSignInTime.toDate() : new Date(data.lastSignInTime);
      } else if (data.metadata?.lastSignInTime) {
        lastLogin = new Date(data.metadata.lastSignInTime);
      }
      
      return {
        id: userDoc.id,
        name: data.fullNameEN || data.displayName || data.name || 'Unknown User',
        email: data.email,
        role: this.mapFirebaseRoleToUserRole(data.role || 'user'),
        status,
        createdAt: data.createdAt?.toDate() || data.createdAt || new Date(),
        lastLogin,
        avatar: data.photoURL || data.avatar,
        displayName: data.fullNameEN || data.displayName || data.name
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  // Update user role
  static async updateUserRole(
    userId: string, 
    newRole: UserRole['role'], 
    adminId: string, 
    adminName: string,
    reason?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Get current user data
      const userDoc = await getDoc(doc(db, 'profiles', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const currentData = userDoc.data();
      const oldRole = this.mapFirebaseRoleToUserRole(currentData.role || 'user');
      
      // Prevent self-demotion for super admins
      if (userId === adminId && oldRole === 'super-admin' && newRole !== 'super-admin') {
        throw new Error('Super administrators cannot demote themselves');
      }
      
      // Update user role in profiles collection
      const userRef = doc(db, 'profiles', userId);
      batch.update(userRef, {
        role: this.mapUserRoleToFirebaseRole(newRole),
        updatedAt: serverTimestamp()
      });
      
      // Create audit log entry
      const auditLogRef = doc(collection(db, 'roleAuditLog'));
      batch.set(auditLogRef, {
        adminId,
        adminName,
        targetUserId: userId,
        oldRole,
        newRole,
        timestamp: serverTimestamp(),
        reason: reason || '',
        ipAddress: '' // Could be populated from client if needed
      });
      
      // Update role history in user document
      const roleChange = {
        adminId,
        adminName,
        oldRole,
        newRole,
        timestamp: new Date(),
        reason: reason || ''
      };
      
      batch.update(userRef, {
        roleHistory: [...(currentData.roleHistory || []), roleChange],
        lastRoleUpdate: serverTimestamp()
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Update user status (active/inactive)
  static async updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<void> {
    try {
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  // Get role audit logs
  static async getRoleAuditLogs(limit: number = 50): Promise<RoleAuditLog[]> {
    try {
      const logsQuery = query(
        collection(db, 'roleAuditLog'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(logsQuery);
      const logs: RoleAuditLog[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          adminId: data.adminId,
          targetUserId: data.targetUserId,
          oldRole: data.oldRole,
          newRole: data.newRole,
          timestamp: data.timestamp?.toDate() || new Date(),
          reason: data.reason,
          ipAddress: data.ipAddress
        });
      });
      
      return logs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }

  // Get users by role
  static async getUsersByRole(role: UserRole['role']): Promise<UserRole[]> {
    try {
      const firebaseRole = this.mapUserRoleToFirebaseRole(role);
      const usersQuery = query(
        collection(db, 'profiles'),
        where('role', '==', firebaseRole),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(usersQuery);
      const users: UserRole[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.fullNameEN || data.displayName || 'Unknown User',
          email: data.email,
          role: this.mapFirebaseRoleToUserRole(data.role || 'user'),
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate(),
          avatar: data.photoURL,
          displayName: data.fullNameEN || data.displayName
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw new Error('Failed to fetch users by role');
    }
  }

  // Get role statistics
  static async getRoleStatistics(): Promise<Record<UserRole['role'], number>> {
    try {
      const users = await this.getAllUsers();
      const stats: Record<UserRole['role'], number> = {
        'super-admin': 0,
        admin: 0,
        editor: 0,
        jury: 0,
        user: 0
      };
      
      users.forEach(user => {
        if (user.status === 'active') {
          stats[user.role]++;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting role statistics:', error);
      throw new Error('Failed to get role statistics');
    }
  }

  // Check if user can be deleted (prevent last super admin deletion)
  static async canDeleteUser(userId: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return { canDelete: false, reason: 'User not found' };
      }
      
      if (user.role === 'super-admin') {
        const superAdmins = await this.getUsersByRole('super-admin');
        const activeSuperAdmins = superAdmins.filter(u => u.status === 'active');
        
        if (activeSuperAdmins.length <= 1) {
          return { 
            canDelete: false, 
            reason: 'Cannot delete the last active Super Administrator' 
          };
        }
      }
      
      return { canDelete: true };
    } catch (error) {
      console.error('Error checking if user can be deleted:', error);
      return { canDelete: false, reason: 'Error checking user deletion eligibility' };
    }
  }

  // Helper method to map Firebase roles to UserRole types
  private static mapFirebaseRoleToUserRole(firebaseRole: string): UserRole['role'] {
    switch (firebaseRole) {
      case 'super-admin':
        return 'super-admin';
      case 'admin':
        return 'admin';
      case 'editor':
        return 'editor';
      case 'jury':
        return 'jury';
      case 'user':
        return 'user';
      default:
        return 'user'; // Default role for regular users
    }
  }

  // Helper method to map UserRole types to Firebase roles
  private static mapUserRoleToFirebaseRole(userRole: UserRole['role']): string {
    switch (userRole) {
      case 'super-admin':
        return 'super-admin';
      case 'admin':
        return 'admin';
      case 'editor':
        return 'editor';
      case 'jury':
        return 'jury';
      case 'user':
        return 'user';
      default:
        return 'user';
    }
  }

  // Search users by name or email
  static async searchUsers(searchTerm: string): Promise<UserRole[]> {
    try {
      const allUsers = await this.getAllUsers();
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return allUsers.filter(user => 
        user.name.toLowerCase().includes(lowercaseSearch) ||
        user.email.toLowerCase().includes(lowercaseSearch) ||
        (user.displayName && user.displayName.toLowerCase().includes(lowercaseSearch))
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  // Bulk update user roles
  static async bulkUpdateRoles(
    updates: Array<{ userId: string; newRole: UserRole['role'] }>,
    adminId: string,
    adminName: string,
    reason?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const update of updates) {
        const userDoc = await getDoc(doc(db, 'profiles', update.userId));
        if (!userDoc.exists()) continue;
        
        const currentData = userDoc.data();
        const oldRole = this.mapFirebaseRoleToUserRole(currentData.role || 'user');
        
        // Skip if role is the same
        if (oldRole === update.newRole) continue;
        
        // Update user role
        const userRef = doc(db, 'profiles', update.userId);
        batch.update(userRef, {
          role: this.mapUserRoleToFirebaseRole(update.newRole),
          updatedAt: serverTimestamp()
        });
        
        // Create audit log entry
        const auditLogRef = doc(collection(db, 'roleAuditLog'));
        batch.set(auditLogRef, {
          adminId,
          adminName,
          targetUserId: update.userId,
          oldRole,
          newRole: update.newRole,
          timestamp: serverTimestamp(),
          reason: reason || 'Bulk update',
          ipAddress: ''
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating roles:', error);
      throw new Error('Failed to bulk update roles');
    }
  }
}
