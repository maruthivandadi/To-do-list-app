export type Theme = 'light' | 'dark';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: 'personal' | 'study' | 'urgent';
  dueDate?: Date;
}

export interface ClassSession {
  id: string;
  subject: string;
  day: string; // "Monday", "Tuesday", etc.
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  room?: string;
  color?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  TASKS = 'TASKS',
  UPLOAD = 'UPLOAD'
}

export interface ExtractedClass {
  day: string;
  subject: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface TimetableResponse {
  schedule: ExtractedClass[];
}