export enum Subject {
  MATH = 'Toán',
  PHYSICS = 'Vật lí',
  CHEMISTRY = 'Hoá học',
  BIOLOGY = 'Sinh học',
  IT = 'Tin học',
  HISTORY = 'Lịch sử',
  GEOGRAPHY = 'Địa lí',
  LAW = 'Kinh tế và pháp luật',
  AGRI_TECH = 'Công nghệ nông nghiệp',
  IND_TECH = 'Công nghệ công nghiệp',
  EXP = 'Hoạt động trải nghiệm, hướng nghiệp'
}

export interface LessonPlanInput {
  subject: string;
  grade: string;
  textbook: string;
  duration: string;
  lessonName: string;
  content: string;
}

export enum TabOption {
  CREATE = 'CREATE',
  ENHANCE = 'ENHANCE'
}

export interface GenerationState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
}
