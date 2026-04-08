/** 공개 일정 한 줄 (Firestore `jeju_schedule_public` 등) */
export interface SchedulePlace {
  id: string;
  /** 0~3 → 4/13 ~ 4/16 */
  dayIndex: number;
  order: number;
  /** 예: "09:30" 또는 "오전" */
  time: string;
  placeName: string;
  kakaoMapUrl: string;
  memo?: string;
  lat: number;
  lng: number;
}

export type NewSchedulePlace = Omit<SchedulePlace, 'id'>;
