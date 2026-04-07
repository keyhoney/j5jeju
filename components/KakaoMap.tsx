'use client';

import { useEffect, useRef } from 'react';
import { Map, MapMarker, Polyline, useKakaoLoader } from 'react-kakao-maps-sdk';
import type { Place } from '../lib/types';

interface KakaoMapProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
}

export default function KakaoMap({ places, selectedPlaceId, onSelectPlace }: KakaoMapProps) {
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [isLoading, loadingError] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '',
    libraries: ['services', 'clusterer', 'drawing'],
  });

  const center = places.length > 0 
    ? { 
        lat: places.reduce((sum, p) => sum + p.location.lat, 0) / places.length, 
        lng: places.reduce((sum, p) => sum + p.location.lng, 0) / places.length 
      }
    : { lat: 33.3617, lng: 126.5292 }; // Jeju center

  const linePath = places.map(p => ({
    lat: p.location.lat,
    lng: p.location.lng,
  }));

  useEffect(() => {
    if (!mapRef.current || places.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();
    places.forEach((place) => {
      bounds.extend(new kakao.maps.LatLng(place.location.lat, place.location.lng));
    });
    mapRef.current.setBounds(bounds, 48, 24, 160, 24);
  }, [places]);

  useEffect(() => {
    if (!mapRef.current || !selectedPlaceId) return;
    const selected = places.find((place) => place.id === selectedPlaceId);
    if (!selected) return;
    mapRef.current.panTo(new kakao.maps.LatLng(selected.location.lat, selected.location.lng));
  }, [places, selectedPlaceId]);

  const segmentInfos = places.slice(1).map((place, index) => {
    const prev = places[index];
    const dx = place.location.lat - prev.location.lat;
    const dy = place.location.lng - prev.location.lng;
    const km = Math.sqrt(dx * dx + dy * dy) * 111;
    const minutes = Math.max(5, Math.round((km / 35) * 60));
    return {
      id: `${prev.id}-${place.id}`,
      position: {
        lat: (prev.location.lat + place.location.lat) / 2,
        lng: (prev.location.lng + place.location.lng) / 2,
      },
      distance: `${km.toFixed(1)}km`,
      time: `${minutes}분`,
    };
  });

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
        {places.map((place, index) => (
          <MapMarker
            key={place.id}
            position={{ lat: place.location.lat, lng: place.location.lng }}
            onClick={() => onSelectPlace?.(place.id)}
            image={{
              src: selectedPlaceId === place.id
                ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_red.png"
                : "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png",
              size: { width: 36, height: 37 },
              options: {
                spriteSize: { width: 36, height: 691 },
                spriteOrigin: { x: 0, y: index * 46 },
              },
            }}
          >
            <div className="p-1 text-xs font-bold text-center bg-white rounded shadow-sm min-w-[60px]">
              {place.name}
            </div>
          </MapMarker>
        ))}
        <Polyline
          path={linePath}
          strokeWeight={5}
          strokeColor="#FFB347"
          strokeOpacity={0.7}
          strokeStyle="solid"
        />
        {segmentInfos.map((segment) => (
          <MapMarker
            key={segment.id}
            position={segment.position}
            clickable={false}
            image={{
              src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/transparent.png",
              size: { width: 1, height: 1 },
            }}
          >
            <div className="px-2 py-1 text-[10px] bg-black/70 text-white rounded-full">
              {segment.distance} · {segment.time}
            </div>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}
