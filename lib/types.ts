/** 공개 일정 한 줄 (Firestore `jeju_schedule_public` 등) */
export interface SchedulePlace {
  id: string;
  /** 0~3 → 4/13 ~ 4/16 */
  dayIndex: number;
  /** 레거시·호환용 (정렬에는 사용하지 않음) */
  order?: number;
  /** "HH:mm" 24시간 형식, 빈 문자열이면 시간 미정(맨 뒤 정렬) */
  time: string;
  placeName: string;
  kakaoMapUrl: string;
  memo?: string;
  lat: number;
  lng: number;
}

export type NewSchedulePlace = Omit<SchedulePlace, 'id'>;
