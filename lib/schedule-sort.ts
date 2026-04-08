import type { SchedulePlace } from './types';

/** 시간 미정·파싱 불가 시 정렬 맨 뒤 (분 단위 상한보다 큼) */
export const NO_TIME_MINUTES = 24 * 60 + 59 + 1;

/** 저장·표준 형식: "HH:mm" (24시간) */
export function parseHHMM(input: string | undefined): string | null {
  if (!input?.trim()) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function timeStringToSortMinutes(input: string | undefined): number {
  const normalized = parseHHMM(input);
  if (!normalized) return NO_TIME_MINUTES;
  const [h, min] = normalized.split(':').map(Number);
  return h * 60 + min;
}

export function sortSchedulePlaces(places: SchedulePlace[]): SchedulePlace[] {
  return [...places].sort((a, b) => {
    const ta = timeStringToSortMinutes(a.time);
    const tb = timeStringToSortMinutes(b.time);
    if (ta !== tb) return ta - tb;
    return a.placeName.localeCompare(b.placeName, 'ko');
  });
}

/** 카드·목록 표시용 */
export function formatScheduleTimeLabel(time: string | undefined): string {
  const p = parseHHMM(time);
  if (!p) return '시간 미정';
  return p;
}
