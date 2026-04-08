'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Map, MapMarker, Polyline, useKakaoLoader } from 'react-kakao-maps-sdk';
import type { SchedulePlace } from '../lib/types';

interface KakaoMapProps {
  places: SchedulePlace[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
}

export default function KakaoMap({ places, selectedPlaceId, onSelectPlace }: KakaoMapProps) {
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [isLoading, loadingError] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '',
    libraries: ['services', 'clusterer', 'drawing'],
  });

  const mappable = useMemo(
    () => places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [places]
  );

  const center =
    mappable.length > 0
      ? {
          lat: mappable.reduce((sum, p) => sum + p.lat, 0) / mappable.length,
          lng: mappable.reduce((sum, p) => sum + p.lng, 0) / mappable.length,
        }
      : { lat: 33.3617, lng: 126.5292 };

  const linePath = mappable.map((p) => ({ lat: p.lat, lng: p.lng }));

  useEffect(() => {
    if (!mapRef.current || mappable.length === 0) return;
    const bounds = new kakao.maps.LatLngBounds();
    mappable.forEach((place) => {
      bounds.extend(new kakao.maps.LatLng(place.lat, place.lng));
    });
    mapRef.current.setBounds(bounds, 48, 24, 160, 24);
  }, [mappable]);

  useEffect(() => {
    if (!mapRef.current || !selectedPlaceId) return;
    const selected = mappable.find((place) => place.id === selectedPlaceId);
    if (!selected) return;
    mapRef.current.panTo(new kakao.maps.LatLng(selected.lat, selected.lng));
  }, [mappable, selectedPlaceId]);

  if (loadingError) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-jeju border-4 border-white bg-white flex items-center justify-center text-sm text-red-500">
        카카오맵 로딩에 실패했습니다. API 키와 도메인 설정을 확인해주세요.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-jeju border-4 border-white bg-white flex items-center justify-center text-sm text-gray-400">
        지도를 불러오는 중...
      </div>
    );
  }

  if (mappable.length === 0) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-jeju border-4 border-white bg-gray-50 flex items-center justify-center text-sm text-gray-500 px-4 text-center">
        좌표가 있는 일정이 없습니다. 장소 검색으로 추가하거나 카카오맵 링크에 좌표가 포함되도록 붙여 넣어 주세요.
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-jeju border-4 border-white">
      <Map
        onCreate={(map) => {
          mapRef.current = map;
        }}
        center={center}
        style={{ width: '100%', height: '100%' }}
        level={8}
      >
        {mappable.map((place) => {
          const orderInList = places.findIndex((p) => p.id === place.id);
          const spriteIndex = Math.max(0, Math.min(orderInList, 14));
          return (
          <MapMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            onClick={() => onSelectPlace?.(place.id)}
            image={{
              src:
                selectedPlaceId === place.id
                  ? 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_red.png'
                  : 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png',
              size: { width: 36, height: 37 },
              options: {
                spriteSize: { width: 36, height: 691 },
                spriteOrigin: { x: 0, y: spriteIndex * 46 },
              },
            }}
          >
            <div className="p-1 text-xs font-bold text-center bg-white rounded shadow-sm min-w-[60px] max-w-[140px] truncate">
              {place.placeName}
            </div>
          </MapMarker>
          );
        })}
        {linePath.length > 1 ? (
          <Polyline
            path={linePath}
            strokeWeight={5}
            strokeColor="#FFB347"
            strokeOpacity={0.7}
            strokeStyle="solid"
          />
        ) : null}
      </Map>
    </div>
  );
}
