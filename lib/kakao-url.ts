/** 카카오맵 공유 URL에서 위도·경도 추출 (가능한 경우만) */
export function parseLatLngFromKakaoUrl(url: string): { lat: number; lng: number } | null {
  if (!url?.trim()) return null;
  const matches = url.match(/\d{2,3}\.\d+\s*,\s*\d{2,3}\.\d+/g);
  if (!matches?.length) return null;
  const last = matches[matches.length - 1];
  const [latS, lngS] = last.split(',').map((s) => s.trim());
  const lat = Number(latS);
  const lng = Number(lngS);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function buildKakaoMapLinkFromCoords(lat: number, lng: number, placeName?: string): string {
  if (placeName?.trim()) {
    return `https://map.kakao.com/link/map/${encodeURIComponent(placeName.trim())},${lat},${lng}`;
  }
  return `https://map.kakao.com/link/map/${lat},${lng}`;
}
