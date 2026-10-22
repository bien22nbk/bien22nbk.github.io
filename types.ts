export interface StudentReport {
  id: string;
  name: string;
  discipline: string; // Nền nếp (kèm điểm trừ nếu có)
  learning: string; // Học tập (kèm điểm trừ/cộng)
  hygiene: string; // Vệ sinh (kèm điểm trừ)
  score: number; // Tổng điểm tuần này
  previousScore: number; // Điểm tuần trước (để so sánh)
  classification: string; // Xếp loại: Xuất sắc, Tốt, Khá, TB...
  progress: string; // Sự tiến bộ
  parentNote: string; // Lời nhắn cho phụ huynh
}

export interface WeeklyReport {
  id?: string;
  week: number;
  group: string; // Tổ 1, 2, 3...
  summary: string;
  students: StudentReport[];
  createdAt?: string;
}

export interface FileData {
  name: string;
  type: string;
  data: string; // Base64
}

export interface MonthlyWeeklyScore {
  week: number;
  score: number;
}

export interface MonthlyStudentSummary {
  id: string;
  name: string;
  weeklyScores: MonthlyWeeklyScore[];
  averageScore: number;
  totalScore: number;
  rank: number;
  classification: string; // Xuất sắc, Tốt, Khá, Trung bình...
  trend: 'up' | 'down' | 'stable'; // Xu hướng tiến bộ
  disciplineSummary: string;
  learningSummary: string;
  awards: string[];
  parentNote: string;
}

export interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  group: string;
  totalWeeksEvaluated: number;
  weeksIncluded: number[];
  summary: string;
  strengths: string[];
  improvements: string[];
  goalsNextMonth: string[];
  topStudents: string[];
  students: MonthlyStudentSummary[];
  createdAt: string;
}