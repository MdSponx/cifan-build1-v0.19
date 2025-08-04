export interface Partner {
  id: string;
  name: {
    th: string;
    en: string;
  };
  logo: {
    type: 'upload' | 'url';
    value: string;
  };
  level: 1 | 2 | 3; // 1 = Main, 2 = Supporting, 3 = Friend
  order: number; // Display order (1, 2, 3, etc.)
  note: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PartnerFormData {
  nameTh: string;
  nameEn: string;
  logoType: 'upload' | 'url';
  logoValue: string;
  level: 1 | 2 | 3;
  order: number;
  note: string;
  status: 'active' | 'inactive';
}