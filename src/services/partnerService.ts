import { Partner, PartnerFormData } from '../types/partner.types';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

class PartnerService {
  private collectionName = 'partners';

  async getAllPartners(): Promise<Partner[]> {
    try {
      // Try composite index query first
      try {
        const q = query(
          collection(db, this.collectionName),
          orderBy('level', 'asc'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Partner[];
      } catch (indexError: any) {
        // If composite index doesn't exist, fall back to simple query
        if (indexError?.code === 'failed-precondition' || indexError?.message?.includes('index')) {
          console.warn('Composite index not available, using fallback query');
          const q = query(
            collection(db, this.collectionName),
            orderBy('level', 'asc')
          );
          const snapshot = await getDocs(q);
          const partners = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          })) as Partner[];
          
          // Sort by createdAt in memory
          return partners.sort((a, b) => {
            if (a.level !== b.level) {
              return a.level - b.level;
            }
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
        }
        throw indexError;
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      return [];
    }
  }

  async getActivePartners(): Promise<Partner[]> {
    try {
      // Try simple query with status filter only
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const partners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Partner[];
      
      // Sort by level first, then by createdAt in memory
      return partners.sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        // Sort by order within same level, then by createdAt
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error fetching active partners:', error);
      return [];
    }
  }

  async getPartnerById(id: string): Promise<Partner | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
        } as Partner;
      }
      return null;
    } catch (error) {
      console.error('Error fetching partner:', error);
      return null;
    }
  }

  async uploadLogo(file: File, partnerId: string): Promise<string> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${partnerId}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `partners/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }

  async createPartner(data: PartnerFormData, createdBy: string, logoFile?: File): Promise<Partner> {
    try {
      const partnerId = Date.now().toString();
      let logoValue = data.logoValue;

      // Upload logo file if provided
      if (logoFile && data.logoType === 'upload') {
        logoValue = await this.uploadLogo(logoFile, partnerId);
      }

      const partnerData = {
        name: {
          th: data.nameTh,
          en: data.nameEn
        },
        logo: {
          type: data.logoType,
          value: logoValue
        },
        level: data.level,
        order: data.order,
        note: data.note,
        status: data.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy
      };

      const docRef = await addDoc(collection(db, this.collectionName), partnerData);
      return { 
        id: docRef.id, 
        ...partnerData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Partner;
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }
  }

  async updatePartner(id: string, data: PartnerFormData, logoFile?: File): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      let logoValue = data.logoValue;

      // Upload new logo file if provided
      if (logoFile && data.logoType === 'upload') {
        logoValue = await this.uploadLogo(logoFile, id);
      }

      const updateData = {
        name: {
          th: data.nameTh,
          en: data.nameEn
        },
        logo: {
          type: data.logoType,
          value: logoValue
        },
        level: data.level,
        order: data.order,
        note: data.note,
        status: data.status,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  async deletePartner(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting partner:', error);
      throw error;
    }
  }
}

export const partnerService = new PartnerService();