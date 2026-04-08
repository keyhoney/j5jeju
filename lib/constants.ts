/** 고정 일정: 2026년 4월 13일 ~ 16일 (3박 4일) */
export const FIXED_TRIP_TITLE = '제주 3박 4일';

export const FIXED_DAYS = [
  { index: 0, dateLabel: '4/13 (월)', title: '1일차' },
  { index: 1, dateLabel: '4/14 (화)', title: '2일차' },
  { index: 2, dateLabel: '4/15 (수)', title: '3일차' },
  { index: 3, dateLabel: '4/16 (목)', title: '4일차' },
] as const;

/** Firestore 공개 일정 컬렉션 (환경변수로 덮어쓸 수 있음) */
export function getScheduleCollectionName(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SCHEDULE_COLLECTION) {
    return process.env.NEXT_PUBLIC_SCHEDULE_COLLECTION;
  }
  return 'jeju_schedule_public';
}
