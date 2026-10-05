export type Department =
  | 'สำนักปลัด'
  | 'กองคลัง'
  | 'กองช่าง'
  | 'กองการศึกษา ศาสนาและวัฒนธรรม'
  | 'กองสาธารณสุขและสิ่งแวดล้อม'
  | 'หน่วยตรวจสอบภายใน';

export type TrainingFormat = 'Onsite (ณ สถานที่จัด)' | 'Online (อบรมออนไลน์)' | 'Hybrid (ผสมผสาน)';

export type TrainingStatus = 'เสร็จสิ้นแล้ว' | 'กำลังอบรม' | 'มีกำหนดการเร็วๆ นี้';

export interface TrainingRecord {
  id: string;
  fullName: string;
  position: string;
  department: Department;
  projectName: string;
  organizer: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  location: string;
  hours: number;
  format: TrainingFormat;
  status: TrainingStatus;
  budget: number;
  certificateUrl?: string;
  certificateDriveId?: string;
  certificateFileName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingRecommendation {
  id: string;
  title: string;
  category: string;
  targetDepartment: string;
  organizer: string;
  dates: string;
  location: string;
  estimatedHours: number;
  highlight: string;
  isUrgent?: boolean;
}

export interface FilterParams {
  searchQuery: string;
  department: string;
  position: string;
  startDateFrom: string;
  startDateTo: string;
  status: string;
  year: string;
}
